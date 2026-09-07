/**
 * @classgrid/ai — Core Types
 *
 * Shared type definitions used across the entire SDK.
 */

// ── LLM Types ────────────────────────────────────────────────────────────────

/** A message in the LLM conversation. */
export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

/** A tool call returned by the LLM. */
export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

/** Configuration for an LLM provider. */
export type LLMProvider = {
  name: string;
  url: string;
  apiKey: string;
  model: string;
};

/** Options for generating an LLM reply. */
export type LLMOptions = {
  messages: ChatMessage[];
  model?: string;
  channel?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  tools?: ToolDefinition[];
  onStatus?: (label: string) => void;
  onThought?: (thought: string) => void;
};

/** A tool definition for the LLM to call. */
export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

/** Result of an LLM provider attempt. */
export type LLMProviderResult = {
  answer: string | null;
  rateLimited: boolean;
  error?: string;
};

/** Extracted response from raw LLM output. */
export type ExtractedResponse = {
  content: string | null;
  toolCalls?: ToolCall[];
  thinking?: string | null;
};

// ── RAG Types ────────────────────────────────────────────────────────────────

/** A single retrieved chunk from the vector store. */
export type RetrievedChunk = {
  id: string;
  documentId: string;
  documentType: string;
  chunkIndex: number;
  chunkText: string;
  pageSlug?: string;
  pageTitle?: string;
  section?: string;
  contentType?: string;
  sourceUrl?: string;
  score: number;
};

/** Options for RAG retrieval. */
export type RetrieveOptions = {
  topK?: number;
  minScore?: number;
  numCandidates?: number;
  pageContext?: PageContext;
  contentTypes?: string[];
};

/** Result of a RAG retrieval operation. */
export type RetrievalResult = {
  chunks: RetrievedChunk[];
  contextText: string;
  usedFallback: boolean;
};

/** Current page context for page-aware RAG. */
export type PageContext = {
  path?: string;
  slug?: string;
  title?: string;
  pageId?: string;
};

// ── Chat / Session Types ─────────────────────────────────────────────────────

/** A single chat history item. */
export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

/** Channel that a message arrives on. */
export type AIChannel = "web" | "whatsapp" | "telegram" | "email";

// ── RAG Answer Types ─────────────────────────────────────────────────────────

/** Options for generating a full RAG-powered answer. */
export type GenerateAnswerOptions = {
  question: string;
  channel: AIChannel;
  userName?: string;
  fullName?: string;
  userEmail?: string;
  userContext?: Record<string, unknown>;
  history?: ChatHistoryItem[];
  pageContext?: PageContext;
  attachments?: { url: string; name: string; mimeType: string }[];
  isGuest?: boolean;
  topK?: number;
  onStatus?: (label: string) => void;
  onThought?: (thought: string) => void;
};

/** Result of a full RAG-powered answer generation. */
export type GenerateAnswerResult = {
  answer: string | null;
  retrieval: RetrievalResult;
  sources: RetrievedChunk[];
};

// ── Embedding Types ──────────────────────────────────────────────────────────

/** Configuration for the embedding provider. */
export type EmbedderConfig = {
  provider: "voyage" | "openai" | "xenova" | "custom";
  apiKey?: string;
  model?: string;
  dimensions?: number;
  apiUrl?: string;
};

// ── Memory Types ─────────────────────────────────────────────────────────────

/** Configuration for session memory. */
export type MemoryConfig = {
  provider: "redis" | "in-memory";
  /** Redis connection URL (required if provider is "redis") */
  redisUrl?: string;
  /** Max messages to store per session (default: 32) */
  maxMessages?: number;
  /** Session TTL in seconds (default: 7200 = 2 hours) */
  ttlSeconds?: number;
};

/** A memory adapter interface. */
export interface MemoryAdapter {
  save(sessionId: string, message: ChatHistoryItem): Promise<void>;
  getHistory(sessionId: string): Promise<ChatHistoryItem[]>;
  clear(sessionId: string): Promise<void>;
  getTTL(sessionId: string): Promise<number>;
}

// ── Guardrails Types ─────────────────────────────────────────────────────────

/** Configuration for AI guardrails. */
export type GuardrailsConfig = {
  /** The brand name to enforce (e.g., "Classgrid AI") */
  brandName: string;
  /** Terms that should be replaced/blocked in AI output */
  bannedTerms?: { term: string; replacement: string }[];
  /** Custom system prompt additions for identity enforcement */
  identityPrompt?: string;
};

// ── Agentic Execution & Safety Types ──────────────────────────────────────────

/** Structured output for actions requiring human approval (Human-in-the-Loop). */
export type PendingToolApproval<T = Record<string, unknown>> = {
  toolName: string;
  actionTitle: string;
  description: string;
  payload: T;
  requiredRole?: string[];
  status: "pending" | "approved" | "rejected";
  expiresAt?: string;
};

/** Context passed to an execution tool when evaluated by the SDK. */
export type ToolExecutionContext = {
  userRole?: string;
  userOrgId?: string;
  userId?: string;
  isPlatformUser?: boolean;
};

/** Safety validation result before tool execution. */
export type ToolSafetyCheckResult = {
  allowed: boolean;
  reason?: string;
};

