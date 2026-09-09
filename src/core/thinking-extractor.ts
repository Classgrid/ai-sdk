/**
 * @classgrid/ai — Thinking Extractor
 *
 * Universally extracts "thinking" / "reasoning" from any LLM provider's
 * response format. Handles:
 *   - Standard API fields (reasoning_content, thinking, thought)
 *   - Anthropic/OpenRouter array format ([{ type: "thinking", ... }])
 *   - DeepSeek <think>...</think> tags
 *   - Mistral JSON leak format ([{ "type": "text", "text": "..." }])
 *
 * This is one of the most battle-tested parts of the Classgrid AI stack,
 * handling edge cases from 5+ different LLM providers.
 */

import type { ExtractedResponse } from "../types.js";

/**
 * Extract a clean response (content + thinking) from raw LLM API output.
 *
 * @param data - The raw JSON response from any OpenAI-compatible API.
 * @returns The extracted content, thinking, and optional tool calls.
 */
export function extractResponse(data: unknown): ExtractedResponse {
  if (!data || typeof data !== "object") return { content: null, thinking: null };

  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return { content: null, thinking: null };

  const first = choices[0] as Record<string, unknown>;
  const message = (first.message || {}) as Record<string, unknown>;

  // 1. Check standard API fields for universal thinking extraction
  let thinking =
    (message.reasoning_content as string) ||
    (message.thinking as string) ||
    (message.thought as string) ||
    (message.thinkingContent as string) ||
    (message.reasoning as string) ||
    null;

  let content = message.content as string | unknown[] | null;

  // 2. Handle Anthropic / OpenRouter Array Format
  if (Array.isArray(content)) {
    const textParts: string[] = [];

    for (const block of content) {
      if (typeof block === "string") {
        textParts.push(block);
      } else if (
        typeof block === "object" &&
        block !== null &&
        (block as Record<string, unknown>).type === "thinking"
      ) {
        const thinkingBlock = (block as Record<string, unknown>).thinking;
        if (typeof thinkingBlock === "string") {
          thinking = thinkingBlock;
        } else if (Array.isArray(thinkingBlock)) {
          thinking = thinkingBlock
            .filter((t: Record<string, unknown>) => t.type === "text" && t.text)
            .map((t: Record<string, unknown>) => t.text as string)
            .join("\n");
        } else {
          thinking = JSON.stringify(thinkingBlock);
        }
      } else if (
        typeof block === "object" &&
        block !== null &&
        ((block as Record<string, unknown>).type === "text" || (block as Record<string, unknown>).text)
      ) {
        textParts.push((block as Record<string, string>).text);
      }
    }

    content = textParts.join("\n");
  } else if (typeof content === "object" && content !== null) {
    content = JSON.stringify(content);
  }

  // 3. Handle Raw String Leaks
  if (typeof content === "string") {
    // Check for DeepSeek style: <think>...</think>
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      if (!thinking) thinking = thinkMatch[1].trim();
      content = content.replace(/<think>[\s\S]*?<\/think>\n?/g, "").trim();
    }

    // Check for JSON leak style (Mistral often leaks `[{"type":"text"...` instead of calling the tool)
    let cleanForJsonCheck = content.trim();
    const codeBlockMatch = cleanForJsonCheck.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (codeBlockMatch) {
      cleanForJsonCheck = codeBlockMatch[1].trim();
    }

    if (cleanForJsonCheck.startsWith("{") || cleanForJsonCheck.startsWith("[")) {
      try {
        const parsed = JSON.parse(cleanForJsonCheck);

        // It successfully parsed as JSON — Mistral leaked JSON into the content block
        thinking = content;

        if (Array.isArray(parsed)) {
          const textBlocks = parsed.filter(
            (b: Record<string, unknown>) =>
              (b.type === "text" || b.type === "answer") && b.text
          );
          if (textBlocks.length > 0) {
            content = textBlocks.map((b: Record<string, string>) => b.text).join("\n");
          } else {
            content = "I am processing your request.";
          }
        } else if (parsed.text) {
          content = parsed.text;
        } else {
          content = "I am processing your request.";
        }
      } catch {
        // Not valid JSON, but still might be a leaked array with literal newlines
        let rawStr = cleanForJsonCheck;

        // If this is a leaked tool call, wipe it out entirely
        if (rawStr.includes('"type": "tool"') || rawStr.includes('"internal_thought_process"')) {
          thinking = rawStr;
          content = "I am processing your request.";
        } else {
          // Aggressively strip `[{"type": "text", "text": "` and `"}]`
          rawStr = rawStr.replace(/^\[?\s*\{\s*"type"\s*:\s*"text"\s*,\s*"text"\s*:\s*"/i, "");
          rawStr = rawStr.replace(/"\s*\}\s*\]?$/, "");
          rawStr = rawStr.replace(/\\n/g, "\n");
          rawStr = rawStr.replace(/\\"/g, '"');
          content = rawStr;
        }
      }
    }
  }

  return {
    content: (content as string) || null,
    toolCalls: message.tool_calls as ExtractedResponse["toolCalls"],
    thinking,
  };
}
