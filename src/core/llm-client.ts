/**
 * @classgrid/ai — Multi-Provider LLM Client
 *
 * A production-hardened LLM client with:
 *   - Automatic provider fallback chain (e.g., Gemini → Mistral → OpenAI)
 *   - Built-in tool calling with loop protection and depth limits
 *   - Duplicate tool call blocking
 *   - Universal thinking extraction from any provider
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
  depth: number = 0
): Promise<LLMProviderResult> {
  const verbose = config.verbose !== false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();
  const maxDepth = config.maxToolDepth ?? 2;

  const allTools = [INTERNAL_THOUGHT_TOOL, ...(config.tools || [])];

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
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (verbose) console.error(`❌ [llm:${provider.name}] HTTP ${response.status}: ${body.slice(0, 300)}`);

      if (response.status === 429) return { answer: null, rateLimited: true, error: "rate_limited" };
      if (response.status === 401 || response.status === 403) return { answer: null, rateLimited: false, error: "auth_failed" };
      return { answer: null, rateLimited: false, error: `http_${response.status}` };
    }

    const data = await response.json();
    const result = extractResponse(data);

    // Emit thinking
    if (result.thinking) {
      if (verbose) {
        console.log(`\n🧠 [thinking] ${provider.name.toUpperCase()}: ${result.thinking.slice(0, 200)}...`);
      }
      onThought?.(result.thinking.trim());
    }

    // Handle Tool Calling
    if (result.toolCalls && result.toolCalls.length > 0) {
      if (depth >= maxDepth) {
        if (verbose) console.error(`❌ [llm:${provider.name}] Max tool depth (${maxDepth}) reached.`);
        return {
          answer: "I searched but couldn't find a clear answer. Could you try rephrasing?",
          rateLimited: false,
          error: "max_depth",
        };
      }

      const call = result.toolCalls[0];
      const toolName = call.function.name;

      if (verbose) {
        console.log(`🛠️  [llm:${provider.name}] Tool: ${toolName} (Depth: ${depth + 1}/${maxDepth})`);
      }

      // Handle internal thinking tool
      if (toolName === "internal_thought_process") {
        const alreadyThought = messages.some(
          (m) => m.tool_calls && m.tool_calls.some((tc) => tc.function.name === "internal_thought_process")
        );

        if (alreadyThought) {
          if (verbose) console.error(`⚠️ [llm:${provider.name}] Blocked duplicate thought call.`);
          const nextMessages: ChatMessage[] = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            {
              role: "tool",
              tool_call_id: call.id,
              content: "ERROR: You have ALREADY used the internal_thought_process tool. Provide your final answer now.",
            },
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth + 1);
        }

        let args: Record<string, unknown>;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          const nextMessages: ChatMessage[] = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            { role: "tool", tool_call_id: call.id, content: "Error: Invalid JSON arguments." },
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth + 1);
        }

        if (verbose) console.log(`🧠 [thinking via tool] ${provider.name}: ${(args.thought as string).slice(0, 200)}...`);
        onThought?.(args.thought as string);
        onStatus?.("analyzing");

        const nextMessages: ChatMessage[] = [
          ...messages,
          { role: "assistant", content: result.content || "", tool_calls: [call] },
          { role: "tool", tool_call_id: call.id, content: "Thought logged. Provide your final answer now." },
        ];
        clearTimeout(timeout);
        // Don't increment depth for thinking — don't punish reasoning
        return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth);
      }

      // Handle custom tool calls
      const handler = config.toolHandlers?.[toolName];
      if (handler) {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          const nextMessages: ChatMessage[] = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            { role: "tool", tool_call_id: call.id, content: "Error: Invalid JSON arguments." },
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth + 1);
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
          const nextMessages: ChatMessage[] = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            {
              role: "tool",
              tool_call_id: call.id,
              content: `ERROR: You have ALREADY called ${toolName} with these exact arguments. Use the data you already have.`,
            },
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth + 1);
        }

        onStatus?.(toolName.replace(/_/g, " "));

        let toolResult: string;
        try {
          toolResult = await handler(args);
        } catch (e) {
          toolResult = `Tool error: ${e instanceof Error ? e.message : String(e)}`;
        }

        onStatus?.("analyzing");

        const nextMessages: ChatMessage[] = [
          ...messages,
          { role: "assistant", content: result.content || "", tool_calls: [call] },
          { role: "tool", tool_call_id: call.id, content: toolResult.slice(0, 6000) },
        ];
        clearTimeout(timeout);
        return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth + 1);
      }
    }

    // Return final answer
    if (result.content && verbose) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [llm] ${provider.name.toUpperCase()} answered in ${duration}s!`);
    }

    return { answer: result.content || null, rateLimited: false };
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
  generate: (options: LLMOptions) => Promise<string | null>;
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
    }: LLMOptions): Promise<string | null> {
      if (config.providers.length === 0) {
        console.error("[llm] No providers configured.");
        return null;
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
          onThought
        );

        if (result.answer) return result.answer;

        if (!result.rateLimited) allRateLimited = false;

        if (config.verbose !== false) {
          console.warn(`[llm] ${provider.name} failed (${result.error}), trying next...`);
        }
      }

      if (allRateLimited) {
        console.error("[llm] All providers rate-limited.");
        return "[RATE_LIMITED]";
      }

      console.error("[llm] All providers failed.");
      return null;
    },
  };
}
