import { GoogleGenerativeAI } from '@google/generative-ai';
import * as officeParser from 'officeparser';

// src/core/thinking-extractor.ts
function extractResponse(data) {
  if (!data || typeof data !== "object") return { content: null, thinking: null };
  const choices = data.choices;
  if (!Array.isArray(choices) || choices.length === 0) return { content: null, thinking: null };
  const first = choices[0];
  const message = first.message || {};
  let thinking = message.reasoning_content || message.thinking || message.thought || message.thinkingContent || message.reasoning || null;
  let content = message.content;
  if (Array.isArray(content)) {
    const textParts = [];
    for (const block of content) {
      if (typeof block === "string") {
        textParts.push(block);
      } else if (typeof block === "object" && block !== null && block.type === "thinking") {
        const thinkingBlock = block.thinking;
        if (typeof thinkingBlock === "string") {
          thinking = thinkingBlock;
        } else if (Array.isArray(thinkingBlock)) {
          thinking = thinkingBlock.filter((t) => t.type === "text" && t.text).map((t) => t.text).join("\n");
        } else {
          thinking = JSON.stringify(thinkingBlock);
        }
      } else if (typeof block === "object" && block !== null && (block.type === "text" || block.text)) {
        textParts.push(block.text);
      }
    }
    content = textParts.join("\n");
  } else if (typeof content === "object" && content !== null) {
    content = JSON.stringify(content);
  }
  if (typeof content === "string") {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      if (!thinking) thinking = thinkMatch[1].trim();
      content = content.replace(/<think>[\s\S]*?<\/think>\n?/g, "").trim();
    }
    let cleanForJsonCheck = content.trim();
    const codeBlockMatch = cleanForJsonCheck.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (codeBlockMatch) {
      cleanForJsonCheck = codeBlockMatch[1].trim();
    }
    if (cleanForJsonCheck.startsWith("{") || cleanForJsonCheck.startsWith("[")) {
      try {
        const parsed = JSON.parse(cleanForJsonCheck);
        thinking = content;
        if (Array.isArray(parsed)) {
          const textBlocks = parsed.filter(
            (b) => (b.type === "text" || b.type === "answer") && b.text
          );
          if (textBlocks.length > 0) {
            content = textBlocks.map((b) => b.text).join("\n");
          } else {
            content = "I am processing your request.";
          }
        } else if (parsed.text) {
          content = parsed.text;
        } else {
          content = "I am processing your request.";
        }
      } catch {
        let rawStr = cleanForJsonCheck;
        if (rawStr.includes('"type": "tool"') || rawStr.includes('"internal_thought_process"')) {
          thinking = rawStr;
          content = "I am processing your request.";
        } else {
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
    content: content || null,
    toolCalls: message.tool_calls,
    thinking,
    usage: data.usage || null
  };
}

// src/core/llm-client.ts
async function tryProvider(provider, messages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, depth = 0, toolFailures = {}) {
  const verbose = config.verbose !== false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const maxDepth = config.maxToolDepth ?? 2;
  const allTools = [...config.tools || []];
  if (verbose) {
    console.log(`
\u{1F680} [llm] Requesting answer from ${provider.name.toUpperCase()} (${provider.model})...`);
  }
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        ...provider.name !== "gemini" ? { max_tokens: maxTokens } : {},
        tools: allTools.length > 0 ? allTools : void 0,
        // Enable streaming only for the final answer (depth 0, no tool forcing)
        ...onToken && depth === 0 ? { stream: true, stream_options: { include_usage: true } } : {}
      })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (verbose) console.error(`\u274C [llm:${provider.name}] HTTP ${response.status}: ${body.slice(0, 300)}`);
      if (response.status === 429) return { answer: null, rateLimited: true, error: "rate_limited" };
      if (response.status === 401 || response.status === 403) return { answer: null, rateLimited: false, error: "auth_failed" };
      return { answer: null, rateLimited: false, error: `http_${response.status}` };
    }
    const isStreaming = onToken && depth === 0 && response.headers.get("content-type")?.includes("text/event-stream");
    if (isStreaming && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let streamUsage = null;
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
              fullContent += delta;
              onToken(delta);
            }
            const reasoning = chunk.choices?.[0]?.delta?.reasoning;
            if (reasoning) {
              onThought?.(reasoning);
            }
            const toolCalls = chunk.choices?.[0]?.delta?.tool_calls;
            if (toolCalls) {
              reader.cancel();
              break;
            }
            if (chunk.usage) {
              streamUsage = chunk.usage;
            }
          } catch {
          }
        }
      }
      clearTimeout(timeout);
      if (streamUsage && verbose) {
        console.log(`
\u{1F3AF} [TOKEN USAGE (Stream)] ${provider.name} | prompt: ${streamUsage?.prompt_tokens} | completion: ${streamUsage?.completion_tokens} | total: ${streamUsage?.total_tokens}`);
      }
      if (fullContent) return { answer: fullContent, rateLimited: false, usage: streamUsage };
    }
    const data = await (isStreaming ? Promise.resolve(null) : response.json());
    if (!data) return { answer: null, rateLimited: false, error: "stream_fallback" };
    const result = extractResponse(data);
    if (data?.usage && verbose) {
      console.log(`
\u{1F3AF} [TOKEN USAGE (Non-Stream)] ${provider.name} | prompt: ${data.usage.prompt_tokens} | completion: ${data.usage.completion_tokens} | total: ${data.usage.total_tokens}`);
    }
    if (result.thinking) {
      if (verbose) {
        console.log(`
\u{1F9E0} [thinking] ${provider.name.toUpperCase()}: ${result.thinking.slice(0, 200)}...`);
      }
      const lines = result.thinking.trim().split("\n").slice(0, 4).join("\n");
      onThought?.(lines);
    }
    if (result.toolCalls && result.toolCalls.length > 0) {
      if (depth >= maxDepth) {
        if (verbose) console.error(`\u274C [llm:${provider.name}] Max tool depth (${maxDepth}) reached.`);
        return {
          answer: "I searched but couldn't find a clear answer. Could you try rephrasing?",
          rateLimited: false,
          error: "max_depth"
        };
      }
      const call = result.toolCalls[0];
      const toolName = call.function.name;
      if (verbose) {
        console.log(`\u{1F6E0}\uFE0F  [llm:${provider.name}] Tool: ${toolName} (Depth: ${depth + 1}/${maxDepth})`);
      }
      if (toolName === "internal_thought_process") {
        const alreadyThought = messages.some(
          (m) => m.tool_calls && m.tool_calls.some((tc) => tc.function.name === "internal_thought_process")
        );
        if (alreadyThought) {
          if (verbose) console.error(`\u26A0\uFE0F [llm:${provider.name}] Blocked duplicate thought call.`);
          const nextMessages2 = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            {
              role: "tool",
              tool_call_id: call.id,
              content: "ERROR: You have ALREADY used the internal_thought_process tool. Provide your final answer now."
            }
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages2, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, depth + 1, toolFailures);
        }
        let args;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          const nextMessages2 = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            { role: "tool", tool_call_id: call.id, content: "Error: Invalid JSON arguments." }
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages2, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, depth + 1, toolFailures);
        }
        if (verbose) console.log(`\u{1F9E0} [thinking via tool] ${provider.name}: ${args.thought.slice(0, 200)}...`);
        const lines = args.thought.split("\n").slice(0, 4).join("\n");
        onThought?.(lines);
        onStatus?.("analyzing");
        const nextMessages = [
          ...messages,
          { role: "assistant", content: result.content || "", tool_calls: [call] },
          { role: "tool", tool_call_id: call.id, content: "Thought logged. Provide your final answer now." }
        ];
        clearTimeout(timeout);
        return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, depth, toolFailures);
      }
      const handler = config.toolHandlers?.[toolName];
      if (handler) {
        let args;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          const nextMessages2 = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            { role: "tool", tool_call_id: call.id, content: "Error: Invalid JSON arguments." }
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages2, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, depth + 1, toolFailures);
        }
        const alreadyCalled = messages.some(
          (m) => m.tool_calls && m.tool_calls.some(
            (tc) => tc.function.name === toolName && tc.function.arguments === call.function.arguments
          )
        );
        if (alreadyCalled) {
          if (verbose) console.error(`\u26A0\uFE0F [llm:${provider.name}] Blocked duplicate ${toolName} call.`);
          const nextMessages2 = [
            ...messages,
            { role: "assistant", content: result.content || "", tool_calls: [call] },
            {
              role: "tool",
              tool_call_id: call.id,
              content: `ERROR: You have ALREADY called ${toolName} with these exact arguments. Use the data you already have.`
            }
          ];
          clearTimeout(timeout);
          return tryProvider(provider, nextMessages2, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, depth + 1, toolFailures);
        }
        onStatus?.(toolName.replace(/_/g, " "));
        onToolCall?.(toolName, args);
        let toolResult;
        try {
          toolResult = await handler(args);
        } catch (e) {
          toolResult = `Tool error: ${e instanceof Error ? e.message : String(e)}`;
        }
        onToolResult?.(toolName, toolResult.slice(0, 2e3));
        onStatus?.("analyzing");
        const isError = toolResult.toLowerCase().includes("error") || toolResult.toLowerCase().includes("failed") || toolResult.toLowerCase().includes("exception");
        if (isError) {
          toolFailures[toolName] = (toolFailures[toolName] || 0) + 1;
        }
        const totalFailures = Object.values(toolFailures).reduce((a, b) => a + b, 0);
        if (toolFailures[toolName] >= 2) {
          if (verbose) console.error(`\u274C [llm:${provider.name}] Tool ${toolName} failed 2 times. Aborting retry loop.`);
          return {
            answer: `I tried to use the ${toolName} tool but it failed multiple times. Please check the logs. Last error: ${toolResult}`,
            rateLimited: false,
            error: "tool_failure_limit"
          };
        }
        if (totalFailures >= 3) {
          if (verbose) console.error(`\u274C [llm:${provider.name}] Global tool failure limit reached (${totalFailures} total errors). Aborting loop to prevent runaway execution.`);
          return {
            answer: `I have encountered multiple errors while trying to complete this task. To prevent further issues, I have stopped trying. Please review the logs to see what went wrong.`,
            rateLimited: false,
            error: "global_tool_failure_limit"
          };
        }
        const nextMessages = [
          ...messages,
          { role: "assistant", content: result.content || "", tool_calls: [call] },
          { role: "tool", tool_call_id: call.id, content: toolResult.slice(0, 6e3) }
        ];
        clearTimeout(timeout);
        return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, onToken, onToolCall, onToolResult, depth + 1, toolFailures);
      }
    }
    if (result.content && verbose) {
    }
    return { answer: result.content || null, rateLimited: false, usage: data?.usage || null };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : String(error);
    if (name === "AbortError" || message.toLowerCase().includes("abort")) {
      if (verbose) console.warn(`\u26A0\uFE0F [llm:${provider.name}] Timeout after ${timeoutMs}ms`);
    } else {
      if (verbose) console.error(`\u274C [llm:${provider.name}] Fatal: ${message}`);
    }
    return { answer: null, rateLimited: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
function createLLMClient(config) {
  return {
    getModel() {
      return config.providers.length > 0 ? config.providers[0].model : "unknown";
    },
    async generate({
      messages,
      temperature = config.defaultTemperature ?? 0.35,
      maxTokens = config.defaultMaxTokens ?? 600,
      timeoutMs = config.defaultTimeoutMs ?? 6e4,
      onStatus,
      onThought,
      onToken,
      onToolCall,
      onToolResult
    }) {
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
    }
  };
}
async function extractPdfWithGemini(pdfBuffer, mimeType = "application/pdf") {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Falling back to officeparser for PDF.");
    return null;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `You are a highly advanced Document OCR and Vision Preprocessor.
Your job is to read this document and convert it into clean, structured Markdown text.
CRITICAL INSTRUCTIONS:
1. Extract all text perfectly, maintaining headings and lists.
2. Whenever you encounter a chart, diagram, photograph, or image, insert a block like:
   [IMAGE/CHART DESCRIPTION: <highly detailed description of what the image shows, including all data points if it is a graph>]
3. Do not add conversational filler. Just return the extracted document content.`;
    const pdfPart = {
      inlineData: {
        data: pdfBuffer.toString("base64"),
        mimeType
      }
    };
    const result = await model.generateContent([prompt, pdfPart]);
    const text = result.response.text();
    return text?.trim() || null;
  } catch (error) {
    console.error("[gemini-ocr] Failed to parse PDF with Gemini:", error);
    return null;
  }
}
async function describeImageWithGemini(imageUrl, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Cannot describe image.");
    return null;
  }
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[gemini-ocr] Failed to fetch image from URL: ${imageUrl}, status: ${response.status} ${response.statusText}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `You are an advanced image analysis assistant. 
Describe EXACTLY what you see in this image in detail. Be accurate and factual.
CRITICAL RULES:
1. Describe ONLY what is actually visible in the image. Do NOT guess or assume anything that is not clearly shown.
2. If it's a screenshot of a website or app, describe the actual UI elements, text, and layout you can see.
3. If it's a photograph, describe the scene, objects, people, buildings, colors, and setting.
4. If it contains text, extract that text accurately.
5. Keep your description concise but thorough (max 300 words).
6. Do NOT invent or fabricate any details that are not visible in the image.`;
    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType
      }
    };
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    return text?.trim() || null;
  } catch (error) {
    console.error("[gemini-ocr] Failed to describe image with Gemini:", error);
    return null;
  }
}
async function answerChatWithGeminiNatively(systemPrompt, history, userMessage, images) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Cannot use native Gemini chat.");
    return null;
  }
  try {
    const imageParts = [];
    for (const img of images) {
      try {
        const response = await fetch(img.url);
        if (!response.ok) {
          console.error(`[gemini-ocr] Failed to fetch image: ${img.url}`);
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`[gemini-ocr] Fetched image from ${img.url}`);
        console.log(`[gemini-ocr] Status: ${response.status}, Content-Type: ${response.headers.get("content-type")}, Size: ${buffer.length} bytes`);
        if (buffer.length < 100) {
          console.log(`[gemini-ocr] WARNING: Image is unusually small. It might be corrupted or empty!`);
        }
        imageParts.push({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: img.mimeType
          }
        });
      } catch (fetchErr) {
        console.error(`[gemini-ocr] Failed to fetch image ${img.url}:`, fetchErr);
      }
    }
    if (imageParts.length === 0) {
      console.error("[gemini-ocr] No images could be fetched. Aborting native Gemini chat.");
      return null;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    let fullPrompt = `SYSTEM INSTRUCTIONS:
${systemPrompt}

`;
    if (history.length > 0) {
      fullPrompt += `CHAT HISTORY:
`;
      for (const msg of history) {
        fullPrompt += `${msg.role.toUpperCase()}: ${msg.content}

`;
      }
    }
    fullPrompt += `IMPORTANT: The user has attached ${imageParts.length} image(s). You MUST carefully examine EVERY attached image and describe what you see before answering the user's question. Do NOT ignore or skip any image.

`;
    fullPrompt += `CURRENT USER MESSAGE:
${userMessage}`;
    const result = await model.generateContent([fullPrompt, ...imageParts]);
    const text = result.response.text()?.trim() || null;
    console.log(`
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 RAW PROVIDER RESPONSE (GEMINI NATIVE) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
    console.log(text);
    console.log(`\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`);
    return text;
  } catch (error) {
    console.error("[gemini-ocr] Native chat failed:", error);
    if (error?.status === 429 || error?.message?.includes("429")) {
      return "[RATE_LIMITED]";
    }
    return null;
  }
}
async function extractTextFromAttachment(url, mimeType) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch attachment from URL: ${url}, status: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (mimeType === "application/pdf") {
      const geminiText = await extractPdfWithGemini(buffer, mimeType);
      if (geminiText) {
        return geminiText;
      }
    }
    const text = await officeParser.parseOffice(buffer);
    return typeof text === "string" ? text.trim() : null;
  } catch (error) {
    console.error("Error parsing attachment:", error);
    return null;
  }
}

export { answerChatWithGeminiNatively, createLLMClient, describeImageWithGemini, extractPdfWithGemini, extractResponse, extractTextFromAttachment };
//# sourceMappingURL=chunk-Q7Y2NYJP.js.map
//# sourceMappingURL=chunk-Q7Y2NYJP.js.map