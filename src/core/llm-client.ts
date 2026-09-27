/**
 * @classgrid/ai — Multi-Provider LLM Client
 *
 * A production-hardened LLM client with:
 *   - Automatic provider fallback chain (e.g., Gemini → Mistral → OpenAI)
 *   - Built-in tool calling with loop protection and depth limits
 *   - Full parallel tool execution (processes ALL tool calls, not just the first)
 *   - Duplicate tool call blocking
 *   - Universal thinking extraction from any provider
 *   - <think> tag streaming support (DeepSeek-style models)
 *   - Rate-limit detection and graceful degradation
 *
 * Usage:
 *   const client = createLLMClient({
 *     providers: [
 *       { name: "gemini", url: "...", apiKey: "...", model: "gemini-3.5-flash" },
 *       { name: "mistral", url: "...", apiKey: "...", model: "mistral-small-latest" },
 *     ],
 *     tools: [...],
 *     toolHandlers: { search_web: async (args) => "..." },
 *   });
 *
 *   const answer = await client.generate({ messages, temperature: 0.35 });
 */

import type {
  ChatMessage,
  LLMProvider,
  LLMOptions,
  LLMProviderResult,
  ToolDefinition,
} from "../types.js";
import { extractResponse } from "./thinking-extractor.js";

// ── Client Configuration ─────────────────────────────────────────────────────

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

export type LLMClientConfig = {
  /** Ordered list of providers to try (first = primary, rest = fallbacks) */
  providers: LLMProvider[];
  /** Tool definitions to pass to the LLM */
  tools?: ToolDefinition[];
  /** Map of tool name → handler function */
  toolHandlers?: Record<string, ToolHandler>;
  /** Max tool call depth before aborting (default: 2, deep search: 4) */
  maxToolDepth?: number;
  /** Default max tokens (default: 600) */
  defaultMaxTokens?: number;
  /** Default temperature (default: 0.35) */
  defaultTemperature?: number;
  /** Default timeout in ms (default: 60000) */
  defaultTimeoutMs?: number;
  /** Enable verbose console logging (default: true) */
  verbose?: boolean;
};

// ── Internal Tool: Thinking ──────────────────────────────────────────────────

const INTERNAL_THOUGHT_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "internal_thought_process",
    description:
      "CRITICAL: If you need to plan your response, analyze rules, or think step-by-step before answering the user, you MUST call this tool FIRST. Never output raw thoughts as text.",
    parameters: {
      type: "object",
      properties: {
        thought: {
          type: "string",
          description: "Your internal reasoning, step-by-step plan, or thought process.",
        },
      },
      required: ["thought"],
    },
  },
};

// ── Provider Request (Recursive for Tool Calls) ──────────────────────────────

async function tryProvider(
  provider: LLMProvider,
  messages: ChatMessage[],
  config: LLMClientConfig,
  temperature: number,
  maxTokens: number,
  timeoutMs: number,
  onStatus?: (label: string) => void,
  onThought?: (thought: string) => void,
  onToken?: (token: string) => void,
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void,
  onToolResult?: (toolName: string, result: string) => void,
  depth: number = 0,
  toolFailures: Record<string, number> = {}
): Promise<LLMProviderResult> {
  const verbose = config.verbose !== false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();
  const maxDepth = config.maxToolDepth ?? 2;

  const allTools = [...(config.tools || [])];

  if (verbose) {
    console.log(`\n🚀 [llm] Requesting answer from ${provider.name.toUpperCase()} (${provider.model})...`);
  }

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        ...(provider.name !== "gemini" ? { max_tokens: maxTokens } : {}),
        tools: allTools.length > 0 ? allTools : undefined,
        // Enable streaming only for the final answer (depth 0, no tool forcing)
        ...(onToken && depth === 0 ? { stream: true, stream_options: { include_usage: true } } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (verbose) console.error(`❌ [llm:${provider.name}] HTTP ${response.status}: ${body.slice(0, 300)}`);

      if (response.status === 429) return { answer: null, rateLimited: true, error: "rate_limited" };
      if (response.status === 401 || response.status === 403) return { answer: null, rateLimited: false, error: "auth_failed" };
      return { answer: null, rateLimited: false, error: `http_${response.status}` };
    }

    const isStreaming = onToken && depth === 0 && response.headers.get("content-type")?.includes("text/event-stream");

    if (isStreaming && response.body) {
      // ── Stream tokens in real-time with <think> tag filtering ──
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let streamUsage: Record<string, unknown> | null = null;
      let isInsideThink = false;
      let thinkBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const chunk = JSON.parse(raw);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              // Buffer content to filter <think>...</think> tags
              thinkBuffer += delta;

              while (thinkBuffer.length > 0) {
                if (!isInsideThink) {
                  const startIdx = thinkBuffer.indexOf("<think>");
                  if (startIdx !== -1) {
                    // Emit everything before the <think> tag as content
                    if (startIdx > 0) {
                      const before = thinkBuffer.slice(0, startIdx);
                      fullContent += before;
                      onToken(before);
                    }
                    isInsideThink = true;
                    thinkBuffer = thinkBuffer.slice(startIdx + 7); // 7 = "<think>".length
                  } else {
                    // Check for partial <think> match at end of buffer
                    let partialMatch = false;
                    for (let i = 1; i <= 6; i++) {
                      if (thinkBuffer.length >= i && thinkBuffer.endsWith("<think>".slice(0, i))) {
                        // Hold back the partial match, emit the rest
                        const emitLen = thinkBuffer.length - i;
                        if (emitLen > 0) {
                          const safe = thinkBuffer.slice(0, emitLen);
                          fullContent += safe;
                          onToken(safe);
                          thinkBuffer = thinkBuffer.slice(emitLen);
                        }
                        partialMatch = true;
                        break;
                      }
                    }
                    if (!partialMatch) {
                      // No <think> anywhere — emit everything
                      fullContent += thinkBuffer;
                      onToken(thinkBuffer);
                      thinkBuffer = "";
                    } else {
                      break; // Wait for more data
                    }
                  }
                } else {
                  // Inside <think> — route to onThought instead of onToken
                  const endIdx = thinkBuffer.indexOf("</think>");
                  if (endIdx !== -1) {
                    if (endIdx > 0) {
                      const thoughtStr = thinkBuffer.slice(0, endIdx);
                      onThought?.(thoughtStr);
                    }
                    isInsideThink = false;
                    thinkBuffer = thinkBuffer.slice(endIdx + 8); // 8 = "</think>".length
                  } else {
                    // Check for partial </think> match at end
                    let partialMatch = false;
                    for (let i = 1; i <= 7; i++) {
                      if (thinkBuffer.length >= i && thinkBuffer.endsWith("</think>".slice(0, i))) {
                        const emitLen = thinkBuffer.length - i;
                        if (emitLen > 0) {
                          const safe = thinkBuffer.slice(0, emitLen);
                          onThought?.(safe);
                          thinkBuffer = thinkBuffer.slice(emitLen);
                        }
                        partialMatch = true;
                        break;
                      }
                    }
                    if (!partialMatch) {
                      onThought?.(thinkBuffer);
                      thinkBuffer = "";
                    } else {
                      break; // Wait for more data
                    }
                  }
                }
              }
            }
            
            // Capture native reasoning tokens (e.g. from gpt-oss-20b)
            const reasoning = chunk.choices?.[0]?.delta?.reasoning;
            if (reasoning) {
              onThought?.(reasoning);
            }

            // Handle tool calls in stream
            const toolCalls = chunk.choices?.[0]?.delta?.tool_calls;
            if (toolCalls) {
              // If tool calls appear during streaming, fall back to non-stream
              reader.cancel();
              break;
            }

            // Capture usage from final chunk if present
            if (chunk.usage) {
              streamUsage = chunk.usage;
            }
          } catch { /* skip malformed */ }
        }
      }

      // Flush remaining think buffer
      if (thinkBuffer) {
        if (isInsideThink) onThought?.(thinkBuffer);
        else {
          fullContent += thinkBuffer;
          onToken(thinkBuffer);
        }
      }

      clearTimeout(timeout);
      
      if (streamUsage && verbose) {
        console.log(`\n🎯 [TOKEN USAGE (Stream)] ${provider.name} | prompt: ${streamUsage?.prompt_tokens} | completion: ${streamUsage?.completion_tokens} | total: ${streamUsage?.total_tokens}`);
      }
      
      if (fullContent) return { answer: fullContent, rateLimited: false, usage: streamUsage };
      // Fall back to non-streaming if content was empty (tool calls etc)
    }

    const data = await (isStreaming ? Promise.resolve(null) : response.json());
    if (!data) return { answer: null, rateLimited: false, error: "stream_fallback" };
    const result = extractResponse(data);

    if (data?.usage && verbose) {
      console.log(`\n🎯 [TOKEN USAGE (Non-Stream)] ${provider.name} | prompt: ${data.usage.prompt_tokens} | completion: ${data.usage.completion_tokens} | total: ${data.usage.total_tokens}`);
    }

    // Emit thinking — truncate to 3-4 lines max for clean UI
    if (result.thinking) {
      if (verbose) {
        console.log(`\n🧠 [thinking] ${provider.name.toUpperCase()}: ${result.thinking.slice(0, 200)}...`);
      }
      const lines = result.thinking.trim().split("\n").slice(0, 4).join("\n");
      onThought?.(lines);
    }

    // ── Handle Tool Calling — process ALL parallel tool calls ──
    if (result.toolCalls && result.toolCalls.length > 0) {
      if (depth >= maxDepth) {
        if (verbose) console.error(`❌ [llm:${provider.name}] Max tool depth (${maxDepth}) reached.`);
        return {
          answer: "I searched but couldn't find a clear answer. Could you try rephrasing?",
          rateLimited: false,
          error: "max_depth",
        };
      }

      if (verbose) {
        const toolNames = result.toolCalls.map((tc) => tc.function.name).join(", ");
        console.log(`🛠️  [llm:${provider.name}] ${result.toolCalls.length} tool call(s): [${toolNames}] (Depth: ${depth + 1}/${maxDepth})`);
      }

      // Build the assistant message with ALL tool calls attached (OpenAI API format)
      const nextMessages: ChatMessage[] = [
        ...messages,
        { role: "assistant", content: result.content || "", tool_calls: result.toolCalls },
      ];

      let allThoughts = true;
      let shouldAbort = false;
      let abortResult: LLMProviderResult = { answer: null, rateLimited: false };

      // Process each tool call sequentially
      for (const call of result.toolCalls) {
        const toolName = call.function.name;

        // ── Handle internal thinking tool ──
        if (toolName === "internal_thought_process") {
          const alreadyThought = messages.some(
            (m) => m.tool_calls && m.tool_calls.some((tc) => tc.function.name === "internal_thought_process")
          );

          if (alreadyThought) {
            if (verbose) console.error(`⚠️ [llm:${provider.name}] Blocked duplicate thought call.`);
            nextMessages.push({
              role: "tool",
              tool_call_id: call.id,
              content: "ERROR: You have ALREADY used the internal_thought_process tool. Provide your final answer now.",
            });
            continue;
          }

          let args: Record<string, unknown>;
          try {
            args = JSON.parse(call.function.arguments);
          } catch {
            nextMessages.push({ role: "tool", tool_call_id: call.id, content: "Error: Invalid JSON arguments." });
            continue;
          }

          if (verbose) console.log(`🧠 [thinking via tool] ${provider.name}: ${(args.thought as string).slice(0, 200)}...`);
          // Truncate thought to 3-4 lines max for clean UI
          const thinkLines = (args.thought as string).split("\n").slice(0, 4).join("\n");
          onThought?.(thinkLines);
          onStatus?.("analyzing");

          nextMessages.push({ role: "tool", tool_call_id: call.id, content: "Thought logged. Provide your final answer now." });
          continue;
        }

        // ── Handle custom tool calls ──
        allThoughts = false;
        const handler = config.toolHandlers?.[toolName];

        if (!handler) {
          if (verbose) console.warn(`⚠️ [llm:${provider.name}] No handler for tool: ${toolName}`);
          nextMessages.push({ role: "tool", tool_call_id: call.id, content: `ERROR: No handler registered for tool "${toolName}".` });
          continue;
        }

        let args: Record<string, unknown>;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          nextMessages.push({ role: "tool", tool_call_id: call.id, content: "Error: Invalid JSON arguments." });
          continue;
        }

        // Duplicate tool call blocking
        const alreadyCalled = messages.some(
          (m) =>
            m.tool_calls &&
            m.tool_calls.some(
              (tc) => tc.function.name === toolName && tc.function.arguments === call.function.arguments
            )
        );

        if (alreadyCalled) {
          if (verbose) console.error(`⚠️ [llm:${provider.name}] Blocked duplicate ${toolName} call.`);
          nextMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: `ERROR: You have ALREADY called ${toolName} with these exact arguments. Use the data you already have.`,
          });
          continue;
        }

        onStatus?.(toolName.replace(/_/g, " "));
        onToolCall?.(toolName, args);

        let toolResult: string;
        try {
          toolResult = await handler(args);
        } catch (e) {
          toolResult = `Tool error: ${e instanceof Error ? e.message : String(e)}`;
        }

        onToolResult?.(toolName, (toolResult || "").slice(0, 2000));
        onStatus?.("analyzing");

        // Track errors for safety limits
        const isError = (toolResult || "").toLowerCase().includes("error") || (toolResult || "").toLowerCase().includes("failed") || (toolResult || "").toLowerCase().includes("exception");
        if (isError) {
          toolFailures[toolName] = (toolFailures[toolName] || 0) + 1;
        }

        const totalFailures = Object.values(toolFailures).reduce((a, b) => a + b, 0);

        if (toolFailures[toolName] >= 2) {
          if (verbose) console.error(`❌ [llm:${provider.name}] Tool ${toolName} failed 2 times. Aborting retry loop.`);
          shouldAbort = true;
          abortResult = {
            answer: `I tried to use the ${toolName} tool but it failed multiple times. Please check the logs. Last error: ${toolResult}`,
            rateLimited: false,
            error: "tool_failure_limit",
          };
          nextMessages.push({ role: "tool", tool_call_id: call.id, content: (toolResult || "").slice(0, 6000) });
          break;
        }

        if (totalFailures >= 3) {
          if (verbose) console.error(`❌ [llm:${provider.name}] Global tool failure limit reached (${totalFailures} total errors). Aborting loop.`);
          shouldAbort = true;
          abortResult = {
            answer: `I have encountered multiple errors while trying to complete this task. To prevent further issues, I have stopped trying. Please review the logs to see what went wrong.`,
            rateLimited: false,
            error: "global_tool_failure_limit",
          };
          nextMessages.push({ role: "tool", tool_call_id: call.id, content: (toolResult || "").slice(0, 6000) });
          break;
        }

        nextMessages.push({ role: "tool", tool_call_id: call.id, content: (toolResult || "").slice(0, 6000) });
      }

      clearTimeout(timeout);
      if (shouldAbort) return abortResult;

      // Don't increment depth for thinking-only rounds — don't punish reasoning
      return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, allThoughts ? depth : depth + 1, toolFailures);
    }

    // Return final answer
    if (result.content && verbose) {
      // Intentionally removed the ✅ [llm] log here because we now log a much more
      // detailed token breakdown natively in the ai-chat.controller.js
    }

    return { answer: result.content || null, rateLimited: false, usage: data?.usage || null };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : String(error);
    if (name === "AbortError" || message.toLowerCase().includes("abort")) {
      if (verbose) console.warn(`⚠️ [llm:${provider.name}] Timeout after ${timeoutMs}ms`);
    } else {
      if (verbose) console.error(`❌ [llm:${provider.name}] Fatal: ${message}`);
    }
    return { answer: null, rateLimited: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export type LLMClient = {
  /** Generate a reply using the provider fallback chain. */
  generate: (options: LLMOptions) => Promise<{ answer: string | null; usage?: Record<string, unknown> | null }>;
  /** Get the current primary model name. */
  getModel: () => string;
};

/**
 * Create a multi-provider LLM client with automatic fallback.
 *
 * @example
 * ```ts
 * import { createLLMClient } from "@classgrid/ai/core";
 *
 * const client = createLLMClient({
 *   providers: [
 *     { name: "gemini", url: "https://...", apiKey: "...", model: "gemini-3.5-flash" },
 *     { name: "mistral", url: "https://...", apiKey: "...", model: "mistral-small-latest" },
 *   ],
 * });
 *
 * const answer = await client.generate({
 *   messages: [
 *     { role: "system", content: "You are a helpful assistant." },
 *     { role: "user", content: "What is RAG?" },
 *   ],
 * });
 * ```
 */
export function createLLMClient(config: LLMClientConfig): LLMClient {
  return {
    getModel() {
      return config.providers.length > 0 ? config.providers[0].model : "unknown";
    },

    async generate({
      messages,
      temperature = config.defaultTemperature ?? 0.35,
      maxTokens = config.defaultMaxTokens ?? 600,
      timeoutMs = config.defaultTimeoutMs ?? 60000,
      onStatus,
      onThought,
      onToken,
      onToolCall,
      onToolResult,
    }: LLMOptions): Promise<{ answer: string | null; usage?: Record<string, unknown> | null }> {
      if (config.providers.length === 0) {
        console.error("[llm] No providers configured.");
        return { answer: null, usage: null };
      }

      let allRateLimited = true;

      for (const provider of config.providers) {
        const result = await tryProvider(
          provider,
          messages,
          config,
          temperature,
          maxTokens,
          timeoutMs,
          onStatus,
          onThought,
          onToken,
          onToolCall,
          onToolResult
        );

        if (result.answer) return { answer: result.answer, usage: result.usage };

        if (!result.rateLimited) allRateLimited = false;

        if (config.verbose !== false) {
          console.warn(`[llm] ${provider.name} failed (${result.error}), trying next...`);
        }
      }

      if (allRateLimited) {
        console.error("[llm] All providers rate-limited.");
        return { answer: "[RATE_LIMITED]", usage: null };
      }

      console.error("[llm] All providers failed.");
      return { answer: null, usage: null };
    },
  };
}
