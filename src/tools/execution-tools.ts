import type { ToolDefinition } from "../types";

/**
 * Universal Query Tool for safe, RBAC-isolated data retrieval.
 */
export const QUERY_CLASSGRID_DATA_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "query_classgrid_data",
    description: "Safely execute read-only queries against Classgrid institutional datasets (attendance, grades, schedules, fee status). Scoped strictly to the user's organization.",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          enum: ["students", "attendance", "examinations", "fee_records", "schedules"],
          description: "The institutional data domain to query.",
        },
        filters: {
          type: "object",
          description: "Key-value filter parameters (e.g., classId, gradeLevel, dateRange).",
        },
        limit: {
          type: "number",
          description: "Maximum records to retrieve (default: 20, max: 100).",
        },
      },
      required: ["collection"],
    },
  },
};

/**
 * Action Tool: Create Academic Assignment (Requires Teacher/Admin Approval)
 */
export const CREATE_ACADEMIC_ASSIGNMENT_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "create_academic_assignment",
    description: "Generate a new assignment draft for a specific class. Returns a PendingConfirmation payload for teacher approval.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Assignment title." },
        subject: { type: "string", description: "Academic subject (e.g. Mathematics, Science)." },
        targetClass: { type: "string", description: "Target class/grade identifier." },
        dueDate: { type: "string", description: "ISO date string for assignment submission deadline." },
        maxPoints: { type: "number", description: "Total points available (default: 100)." },
        instructions: { type: "string", description: "Detailed instructions for students." },
      },
      required: ["title", "subject", "targetClass", "dueDate"],
    },
  },
};

/**
 * Action Tool: Approve/Reject Leave Request (Requires Org Admin/HOD Approval)
 */
export const APPROVE_LEAVE_REQUEST_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "approve_leave_request",
    description: "Approve or decline a pending student or faculty leave application.",
    parameters: {
      type: "object",
      properties: {
        requestId: { type: "string", description: "The unique Leave Request ID." },
        decision: { type: "string", enum: ["approve", "reject"], description: "The decision." },
        remarks: { type: "string", description: "Optional remarks for the applicant." },
      },
      required: ["requestId", "decision"],
    },
  },
};

/**
 * Action Tool: Schedule Timetable Slot (Requires Admin Approval)
 */
export const GENERATE_TIMETABLE_SLOT_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "generate_timetable_slot",
    description: "Create or reschedule a class lecture slot in the master timetable.",
    parameters: {
      type: "object",
      properties: {
        className: { type: "string", description: "Name of the class (e.g., Grade 10-A)." },
        subject: { type: "string", description: "Subject name." },
        facultyId: { type: "string", description: "Assigned faculty member ID." },
        dayOfWeek: {
          type: "string",
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
          description: "Day of the week.",
        },
        startTime: { type: "string", description: "Start time (HH:MM format)." },
        endTime: { type: "string", description: "End time (HH:MM format)." },
      },
      required: ["className", "subject", "facultyId", "dayOfWeek", "startTime", "endTime"],
    },
  },
};

/**
 * Full Suite of Agentic Execution Tools for Classgrid AI
 */
export const AGENTIC_EXECUTION_TOOLS: ToolDefinition[] = [
  QUERY_CLASSGRID_DATA_TOOL,
  CREATE_ACADEMIC_ASSIGNMENT_TOOL,
  APPROVE_LEAVE_REQUEST_TOOL,
  GENERATE_TIMETABLE_SLOT_TOOL,
];
