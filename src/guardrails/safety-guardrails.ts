import type { PendingToolApproval, ToolExecutionContext, ToolSafetyCheckResult } from "../types";

/**
 * Validates whether the active user session is authorized to trigger an Agentic Tool.
 */
export function validateToolExecutionSafety(
  toolName: string,
  context?: ToolExecutionContext,
  allowedRoles?: string[]
): ToolSafetyCheckResult {
  // 1. Block destructive operations globally
  const DESTRUCTIVE_TOOLS = new Set([
    "delete_organization",
    "delete_database",
    "modify_billing",
    "grant_super_admin",
  ]);

  if (DESTRUCTIVE_TOOLS.has(toolName)) {
    return {
      allowed: false,
      reason: `Action '${toolName}' is classified as destructive and cannot be executed by AI agents.`,
    };
  }

  // 2. Validate RBAC if allowedRoles specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = context?.userRole?.toLowerCase() || "guest";
    const hasRole = allowedRoles.some((role) => role.toLowerCase() === userRole);

    if (!hasRole) {
      return {
        allowed: false,
        reason: `User role '${userRole}' is not authorized to execute tool '${toolName}'. Required: ${allowedRoles.join(", ")}.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Sanitizes input prompts to defend against system prompt / schema extraction attacks.
 */
export function sanitizePromptProtection(input: string): string {
  const SENSITIVE_PATTERNS = [
    /reveal your system prompt/i,
    /dump your JSON schemas/i,
    /show internal tool definitions/i,
    /list your API keys/i,
  ];

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(input)) {
      return "I am Classgrid AI, designed to assist with platform actions and queries securely. I cannot reveal internal infrastructure or schema definitions.";
    }
  }

  return input;
}

/**
 * Helper to construct a structured PendingToolApproval payload for UI rendering.
 */
export function createPendingApproval<T = Record<string, unknown>>(
  toolName: string,
  actionTitle: string,
  description: string,
  payload: T,
  requiredRole?: string[]
): PendingToolApproval<T> {
  return {
    toolName,
    actionTitle,
    description,
    payload,
    requiredRole,
    status: "pending",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min TTL
  };
}
