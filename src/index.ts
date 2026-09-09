/**
 * @classgrid/ai
 *
 * The full-stack AI SDK for building intelligent, multi-channel AI agents
 * with RAG, memory, tool calling, and provider fallback.
 *
 * Built by Classgrid — The Operating System for Educational Institutions.
 *
 * @see https://classgrid.in
 * @author Nikhil Shinde <nikhil.shinde@classgrid.in>
 */

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  ChatMessage,
  ToolCall,
  LLMProvider,
  LLMOptions,
  LLMProviderResult,
  ExtractedResponse,
  ToolDefinition,
  RetrievedChunk,
  RetrieveOptions,
  RetrievalResult,
  PageContext,
  ChatHistoryItem,
  AIChannel,
  GenerateAnswerOptions,
  GenerateAnswerResult,
  EmbedderConfig,
  MemoryConfig,
  MemoryAdapter,
  GuardrailsConfig,
  PendingToolApproval,
  ToolExecutionContext,
  ToolSafetyCheckResult,
} from "./types.js";

// ── Core ─────────────────────────────────────────────────────────────────────
export { createLLMClient, type LLMClient, type LLMClientConfig, type ToolHandler } from "./core/index.js";
export { extractResponse } from "./core/index.js";

// ── Memory ───────────────────────────────────────────────────────────────────
export { createInMemoryAdapter } from "./memory/index.js";
export { createRedisMemoryAdapter } from "./memory/index.js";

// ── Guardrails ───────────────────────────────────────────────────────────────
export { createGuardrails, validateToolExecutionSafety, sanitizePromptProtection, createPendingApproval } from "./guardrails/index.js";

// ── Execution Tools ──────────────────────────────────────────────────────────
export {
  QUERY_CLASSGRID_DATA_TOOL,
  CREATE_ACADEMIC_ASSIGNMENT_TOOL,
  APPROVE_LEAVE_REQUEST_TOOL,
  GENERATE_TIMETABLE_SLOT_TOOL,
  AGENTIC_EXECUTION_TOOLS,
} from "./tools/index.js";

