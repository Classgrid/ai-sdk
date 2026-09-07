# @classgrid/ai

> The full-stack AI SDK for building intelligent, multi-channel AI agents with RAG, memory, tool calling, and automatic provider fallback.

**Built by [Classgrid](https://classgrid.in)** — The Operating System for Educational Institutions.

[![npm](https://img.shields.io/npm/v/@classgrid/ai)](https://www.npmjs.com/package/@classgrid/ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why @classgrid/ai?

| Feature | Vercel AI SDK | LangChain | **@classgrid/ai** |
|---------|:---:|:---:|:---:|
| Multi-provider fallback | ❌ | ❌ | ✅ |
| Tool calling with loop protection | ❌ | ❌ | ✅ |
| Universal thinking extraction | ❌ | ❌ | ✅ |
| RAG pipeline | ❌ | ✅ | ✅ |
| Redis session memory | ❌ | ✅ | ✅ |
| Brand guardrails | ❌ | ❌ | ✅ |
| Lightweight | ✅ | ❌ | ✅ |

---

## Installation

```bash
npm install @classgrid/ai
```

### Optional peer dependencies

```bash
# For Redis-backed session memory
npm install ioredis

# For MongoDB vector search (RAG)
npm install mongoose
```

---

## Quick Start

### 1. Multi-Provider LLM Client

```typescript
import { createLLMClient } from "@classgrid/ai";

const client = createLLMClient({
  providers: [
    {
      name: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: process.env.GEMINI_API_KEY!,
      model: "gemini-3.5-flash",
    },
    {
      name: "mistral",
      url: "https://api.mistral.ai/v1/chat/completions",
      apiKey: process.env.MISTRAL_API_KEY!,
      model: "mistral-small-latest",
    },
  ],
});

const answer = await client.generate({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is RAG in AI?" },
  ],
});

console.log(answer);
```

If Gemini is rate-limited or fails, it automatically falls back to Mistral. No code changes needed.

### 2. Tool Calling with Loop Protection

```typescript
const client = createLLMClient({
  providers: [/* ... */],
  tools: [
    {
      type: "function",
      function: {
        name: "search_web",
        description: "Search the web for information.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    },
  ],
  toolHandlers: {
    search_web: async (args) => {
      const res = await fetch(`https://api.tavily.com/search`, {
        method: "POST",
        body: JSON.stringify({ query: args.query }),
      });
      const data = await res.json();
      return data.answer || "No results found.";
    },
  },
  maxToolDepth: 3, // Prevent infinite loops
});
```

Built-in protections:
- **Duplicate tool call blocking** — If the LLM tries to call the same tool with the same args twice, it's blocked.
- **Depth limits** — Configurable max recursion depth to prevent runaway tool loops.
- **Internal thinking** — The SDK automatically provides a "thinking" tool so the LLM can reason before answering.

### 3. Session Memory

```typescript
// In-memory (for development)
import { createInMemoryAdapter } from "@classgrid/ai";

const memory = createInMemoryAdapter({ maxMessages: 32, ttlSeconds: 7200 });

await memory.save("user-123", { role: "user", content: "Hello!" });
await memory.save("user-123", { role: "assistant", content: "Hi there!" });

const history = await memory.getHistory("user-123");
// → [{ role: "user", content: "Hello!" }, { role: "assistant", content: "Hi there!" }]
```

```typescript
// Redis (for production)
import Redis from "ioredis";
import { createRedisMemoryAdapter } from "@classgrid/ai";

const redis = new Redis(process.env.REDIS_URL!);
const memory = createRedisMemoryAdapter({ redisClient: redis });

// Same API as in-memory — just swap the adapter!
```

### 4. Brand Guardrails

```typescript
import { createGuardrails } from "@classgrid/ai";

const guard = createGuardrails({
  brandName: "MyApp AI",
  bannedTerms: [
    { term: "GPT-4", replacement: "MyApp AI" },
    { term: "OpenAI", replacement: "MyApp AI" },
    { term: "Claude", replacement: "MyApp AI" },
  ],
});

// Sanitize AI output
const safe = guard.sanitize("I am powered by GPT-4 from OpenAI.");
// → "I am powered by MyApp AI from MyApp AI."

// Get system prompt for identity enforcement
const systemPrompt = guard.getSystemPrompt();
// → "You are MyApp AI. You must NEVER reveal..."
```

### 5. Universal Thinking Extraction

```typescript
import { extractResponse } from "@classgrid/ai";

// Works with ANY provider's raw JSON response
const result = extractResponse(rawApiResponse);

console.log(result.content);   // The final answer text
console.log(result.thinking);  // The reasoning/thinking (if available)
console.log(result.toolCalls); // Any tool calls the LLM wants to make
```

Handles:
- DeepSeek `<think>...</think>` tags
- Anthropic `[{ type: "thinking", thinking: "..." }]` arrays
- Mistral JSON content leaks
- Standard `reasoning_content` fields

---

## Architecture

```
@classgrid/ai
├── core/           ← Multi-provider LLM client + thinking extraction
├── rag/            ← Embedding + vector search + reranking pipeline
├── memory/         ← Redis + in-memory session stores
├── channels/       ← WhatsApp, Telegram, Email adapters
└── guardrails/     ← Brand identity enforcement
```

---

## License

MIT © [Nikhil Shinde](https://classgrid.in)
