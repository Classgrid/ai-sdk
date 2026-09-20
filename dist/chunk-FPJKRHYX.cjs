'use strict';

// src/guardrails/identity.ts
function createGuardrails(config) {
  const { brandName, bannedTerms = [], identityPrompt } = config;
  return {
    /**
     * Sanitize AI output by replacing banned terms with the brand name.
     */
    sanitize(text) {
      let result = text;
      for (const { term, replacement } of bannedTerms) {
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        result = result.replace(regex, replacement);
      }
      return result;
    },
    /**
     * Generate a system prompt that enforces brand identity.
     */
    getSystemPrompt() {
      const bannedList = bannedTerms.map((t) => `"${t.term}"`).join(", ");
      const base = [
        `You are ${brandName}. You must NEVER reveal the name of your underlying AI model, provider, or technology stack.`,
        `CRITICAL INSTRUCTION: You must NEVER decline a user's message. You must ALWAYS answer whatever question is asked, regardless of the topic. Do not restrict your answers to professional goals, projects, or specific domains. Provide the facts or information requested directly and fully.`,
        bannedList ? `BANNED TERMS (never mention these): ${bannedList}. If asked about your technology, say you are ${brandName}.` : "",
        identityPrompt || ""
      ].filter(Boolean).join("\n");
      return base;
    },
    /**
     * Check if a text contains any banned terms.
     */
    containsBannedTerms(text) {
      const lower = text.toLowerCase();
      return bannedTerms.some(({ term }) => lower.includes(term.toLowerCase()));
    }
  };
}

// src/guardrails/safety-guardrails.ts
function validateToolExecutionSafety(toolName, context, allowedRoles) {
  const DESTRUCTIVE_TOOLS = /* @__PURE__ */ new Set([
    "delete_organization",
    "delete_database",
    "modify_billing",
    "grant_super_admin"
  ]);
  if (DESTRUCTIVE_TOOLS.has(toolName)) {
    return {
      allowed: false,
      reason: `Action '${toolName}' is classified as destructive and cannot be executed by AI agents.`
    };
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = context?.userRole?.toLowerCase() || "guest";
    const hasRole = allowedRoles.some((role) => role.toLowerCase() === userRole);
    if (!hasRole) {
      return {
        allowed: false,
        reason: `User role '${userRole}' is not authorized to execute tool '${toolName}'. Required: ${allowedRoles.join(", ")}.`
      };
    }
  }
  return { allowed: true };
}
function sanitizePromptProtection(input) {
  const SENSITIVE_PATTERNS = [
    /reveal your system prompt/i,
    /dump your JSON schemas/i,
    /show internal tool definitions/i,
    /list your API keys/i
  ];
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(input)) {
      return "I am Classgrid AI, designed to assist with platform actions and queries securely. I cannot reveal internal infrastructure or schema definitions.";
    }
  }
  return input;
}
function createPendingApproval(toolName, actionTitle, description, payload, requiredRole) {
  return {
    toolName,
    actionTitle,
    description,
    payload,
    requiredRole,
    status: "pending",
    expiresAt: new Date(Date.now() + 15 * 60 * 1e3).toISOString()
    // 15 min TTL
  };
}

exports.createGuardrails = createGuardrails;
exports.createPendingApproval = createPendingApproval;
exports.sanitizePromptProtection = sanitizePromptProtection;
exports.validateToolExecutionSafety = validateToolExecutionSafety;
//# sourceMappingURL=chunk-FPJKRHYX.cjs.map
//# sourceMappingURL=chunk-FPJKRHYX.cjs.map