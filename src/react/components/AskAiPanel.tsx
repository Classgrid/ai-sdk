"use client";

import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import hljs from "highlight.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  BarChart3,
  Bot,
  Check,
  ClipboardList,
  Copy,
  CreditCard,
  ChevronRight,
  ArrowDown,
  File,
  FileImage,
  FileText,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  MessageCircleMore,
  Paperclip,
  School,
  Search,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "./ui/button.js";
import { Input } from "./ui/input.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion.js";
import { cn } from "../utils.js";
import { CodeBlockClient } from "./CodeBlockClient.js";
import { toast } from "sonner";
import FilePreviewModal, { type FilePreviewSource } from "./FilePreviewModal.js";
import { DocsImageViewer } from "./DocsImageViewer.js";
import { ScrollSpyTOC } from "./TOC.js";

// ─── SDK-local type definitions & stubs ───
type PageContext = {
  path?: string;
  title?: string;
  summary?: string;
  [key: string]: any;
};

// Stub: useSession (SDK consumers may not have next-auth)
function useSession(): { data: any } {
  return { data: null };
}

// Stub: usePostHog (SDK consumers may not have posthog)
function usePostHog(): any {
  return { capture: () => {} };
}

// Stub: file upload server actions (SDK consumers provide their own endpoint)
async function getPresignedUrlForAskAiFile(_name: string, _type: string, _size: number): Promise<any> {
  return { uploadUrl: "mock", publicUrl: "mock" };
}
async function checkAiUploadRateLimit(_count: number): Promise<{ allowed: boolean; reason?: string }> {
  return { allowed: true };
}
async function recordAiFilesSent(_count: number): Promise<void> {}

type AskAiPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageContext?: PageContext;
  variant?: "in-flow" | "overlay" | "full-page";
  initialMessages?: ChatMessage[];
  autoFocus?: boolean;
};

type AiAttachment = {
  name: string;
  url: string;
  mimeType: string;
  size: number;
};

type UIFileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // Only present for live uploads, stripped for localStorage
  status: "uploading" | "done" | "error";
  url?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  typing?: boolean;
  contextUrl?: string;
  contextTitle?: string;
  attachments?: AiAttachment[];
  thought?: string;
  tocSummary?: string;
};

type ListItem = {
  indexLabel?: string;
  text: string;
};

type StructuredBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: ListItem[] }
  | { type: "section"; title: string; paragraphs: string[]; items?: ListItem[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; code: string; language: string };

const SUGGESTED_QUESTIONS = [
  "What is Classgrid?",
  "How can my school use Classgrid?",
  "Does Classgrid provide websites?",
  "How do I get started?",
];

function suggestedQuestionsForPage(pageContext?: PageContext) {
  const path = pageContext?.path || "";

  if (path === "/pricing") {
    return [
      "How does Classgrid pricing work?",
      "Which modules are included?",
      "How do I get a quote?",
      "Is pricing fixed or custom?",
    ];
  }

  if (path.startsWith("/product/modules")) {
    return [
      "What does this module do?",
      "Who uses this module?",
      "How does this module help admins?",
      "How do I see a demo?",
    ];
  }

  if (path.startsWith("/support") || path.startsWith("/help-center")) {
    return [
      "How do I raise a support ticket?",
      "What is Classgrid Talk vs support tickets?",
      "I'm from an institution — how do I get help?",
      "Can I track my ticket status?",
    ];
  }

  if (path.startsWith("/terms") || path.startsWith("/privacy") || path.startsWith("/cookies") || path.startsWith("/acceptable-use")) {
    return [
      "Summarize this policy",
      "What data does Classgrid handle?",
      "What should institutions know?",
      "Who do I contact for policy questions?",
    ];
  }

  if (path.includes("contact") || path.includes("demo")) {
    return [
      "What happens after I submit this form?",
      "How do I book a demo?",
      "Who should contact sales?",
      "What details should I include?",
    ];
  }

  return SUGGESTED_QUESTIONS;
}

const panelTransition = {
  duration: 0.36,
  ease: [0.22, 1, 0.36, 1],
} as const;

const SECTION_ICON_RULES: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /admission|enroll/i, icon: FileText },
  { match: /attendance/i, icon: BarChart3 },
  { match: /exam|result|quiz/i, icon: ClipboardList },
  { match: /fee|payment|billing/i, icon: CreditCard },
  { match: /communicat|chat|notice/i, icon: MessageCircleMore },
  { match: /website|domain|tenant/i, icon: Globe2 },
  { match: /dashboard|analytics|report/i, icon: LayoutDashboard },
  { match: /school|college|institute|coaching/i, icon: School },
  { match: /classgrid/i, icon: Sparkles },
  { match: /competitor|vs|comparison/i, icon: Globe2 },
];

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function sanitizeAssistantText(text: string) {
  const normalized = text.replace(/\r/g, "");
  const cleanedLines = normalized.split("\n").map((line) => {
    let cleaned = line
      .replace(/__(.*?)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s*/g, "")
      .replace(/^>\s*/g, "");

    // Protect **bold** markers by temporarily replacing them
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, "%%BOLD_START%%$1%%BOLD_END%%");
    // Now strip ALL remaining single asterisks (italic markers like *"text"*)
    cleaned = cleaned.replace(/\*/g, "");
    // Restore **bold** markers
    cleaned = cleaned.replace(/%%BOLD_START%%/g, "**").replace(/%%BOLD_END%%/g, "**");

    return cleaned.replace(/\s+$/g, "");
  });

  return cleanedLines
    .join("\n")
    .replace(/^-{3,}$/gm, "")         // strip markdown horizontal rules (---)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongParagraph(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= 170) return [trimmed];

  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) return [trimmed];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((`${current} ${sentence}`.trim()).length <= 170) {
      current = `${current} ${sentence}`.trim();
    } else {
      if (current) chunks.push(current);
      current = sentence;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function extractInlineNumberedItems(text: string) {
  const matches = [...text.matchAll(/(\d+)\.\s+(.+?)(?=(?:\s+\d+\.\s)|$)/g)];
  if (matches.length < 2) return null;

  return matches.map((match) => ({
    indexLabel: `${match[1]}.`,
    text: match[2].trim(),
  }));
}

function parseListBlock(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const inlineItems = lines.length === 1 ? extractInlineNumberedItems(lines[0]) : null;
  if (inlineItems) return inlineItems;

  const rows: ListItem[] = [];

  for (const line of lines) {
    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      rows.push({ indexLabel: `${numbered[1]}.`, text: numbered[2].trim() });
      continue;
    }

    const bullet = line.match(/^[-*\u2022]\s+(.+)$/);
    if (bullet) {
      rows.push({ text: bullet[1].trim() });
      continue;
    }

    return null;
  }

  return rows.length ? rows : null;
}

function isLikelyHeading(title: string) {
  const trimmed = title.trim().replace(/:$/, "");
  if (!trimmed) return false;
  if (trimmed.startsWith("|")) return false; // Never treat a table row as a heading

  if (SECTION_ICON_RULES.some((rule) => rule.match.test(trimmed))) return true;

  return /^[A-Za-z][A-Za-z\s/&-]{2,50}$/.test(trimmed) && trimmed.split(/\s+/).length <= 6;
}

function parseSectionBlock(block: string): StructuredBlock | null {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const firstLine = lines[0];
  const headingWithBody = firstLine.match(/^([^:]{2,60}):\s+(.+)$/);
  if (headingWithBody && isLikelyHeading(headingWithBody[1])) {
    const paragraphs = splitLongParagraph(headingWithBody[2]);
    return {
      type: "section",
      title: headingWithBody[1].trim(),
      paragraphs,
    };
  }

  if (isLikelyHeading(firstLine) && lines.length > 1) {
    const bodyLines = lines.slice(1);
    const bodyText = bodyLines.join("\n");

    // Check if the body is a numbered/bullet list — preserve list structure
    const listItems = parseListBlock(bodyText);
    if (listItems) {
      return {
        type: "section",
        title: firstLine.replace(/:$/, "").trim(),
        paragraphs: [],
        items: listItems,
      };
    }

    const body = bodyLines.join(" ");
    return {
      type: "section",
      title: firstLine.replace(/:$/, "").trim(),
      paragraphs: splitLongParagraph(body),
    };
  }

  return null;
}

function parseTableBlock(block: string) {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  // Find the first line that looks like a table header (contains |)
  let headerIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("|") && i + 1 < lines.length && /^[\|\-\s:]+$/.test(lines[i + 1])) {
      headerIndex = i;
      break;
    }
  }

  if (!lines[headerIndex].includes("|")) return null;
  if (headerIndex + 1 >= lines.length) return null;
  if (!/^[\|\-\s:]+$/.test(lines[headerIndex + 1])) return null;

  const extractCells = (line: string) => {
    const parts = line.split("|");
    if (parts.length > 0 && parts[0].trim() === "") parts.shift();
    if (parts.length > 0 && parts[parts.length - 1].trim() === "") parts.pop();
    return parts.map(c => c.trim());
  };

  const headers = extractCells(lines[headerIndex]);
  if (headers.length === 0) return null;

  const rows = lines.slice(headerIndex + 2).map(extractCells).filter(r => r.length > 0);
  if (rows.length === 0) return null;

  return { type: "table" as const, headers, rows };
}

function buildStructuredBlocks(text: string): StructuredBlock[] {
  const blocks: StructuredBlock[] = [];
  const parts = text.split(/(```[\s\S]*?(?:```|$))/g);

  for (const part of parts) {
    if (part.startsWith("```")) {
      const match = part.match(/^```([\w-]*)\n([\s\S]*?)(?:```|$)/);
      if (match) {
        blocks.push({
          type: "code",
          language: match[1].trim(),
          code: match[2],
        });
      } else {
        blocks.push({
          type: "code",
          language: "",
          code: part.replace(/```/g, "").trim(),
        });
      }
      continue;
    }

    const cleaned = sanitizeAssistantText(part);
    if (!cleaned) continue;

    const rawBlocks = cleaned.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    for (const rawBlock of rawBlocks) {
      const listItems = parseListBlock(rawBlock);
      if (listItems) {
        blocks.push({ type: "list", items: listItems });
        continue;
      }

      const tableBlock = parseTableBlock(rawBlock);
      if (tableBlock) {
        blocks.push(tableBlock);
        continue;
      }

      const sectionBlock = parseSectionBlock(rawBlock);
      if (sectionBlock) {
        blocks.push(sectionBlock);
        continue;
      }

      for (const paragraph of splitLongParagraph(rawBlock.trim())) {
        if (paragraph) {
          blocks.push({ type: "paragraph", text: paragraph });
        }
      }
    }
  }

  return blocks;
}

function getSectionIcon(title: string) {
  const match = SECTION_ICON_RULES.find((rule) => rule.match.test(title));
  return match?.icon ?? ChevronRight;
}

function TypingDots({ reducedMotion }: { reducedMotion: boolean }) {
  const dotClass = "h-1.5 w-1.5 rounded-full bg-muted-foreground";

  if (reducedMotion) {
    return (
      <div className="flex items-center gap-1">
        <span className={dotClass} />
        <span className={dotClass} />
        <span className={dotClass} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className={dotClass}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14 }}
        />
      ))}
    </div>
  );
}

function SearchingSpinner({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) {
    return <Search className="h-3.5 w-3.5 text-emerald-400" />;
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
    >
      <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
    </motion.div>
  );
}

function isSafeAssistantHref(href: string) {
  return href.startsWith("/") || href.startsWith("#") || /^https?:\/\//i.test(href);
}

function renderInlineText(rawText: string) {
  // Pre-process to fix **[Link](url)** being caught as bold instead of a link
  const text = rawText.replace(/\*\*(\[[^\]]+\]\s*\((?:https?:\/\/|\/|#)[^\s)]*\))\*\*/g, "$1");

  const pattern = /(\[([^\]]+)\]\s*\(((?:https?:\/\/|\/|#)[^\s)]*)\)|\*\*([^*]+)\*\*)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const fullMatch = match[0];
    const label = match[2];
    const href = match[3];
    const boldText = match[4];

    if (label && href && isSafeAssistantHref(href)) {
      const external = /^https?:\/\//i.test(href);
      // Strip any bold asterisks that might be inside the label: [**Book Demo**](...)
      const cleanLabel = label.replace(/\*\*/g, "");

      nodes.push(
        <a
          key={`link-${match.index}`}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="font-semibold text-emerald-600 underline underline-offset-4 transition-colors hover:text-emerald-500 dark:text-emerald-400"
        >
          {cleanLabel}
        </a>
      );
    } else if (boldText) {
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-emerald-600 dark:text-emerald-400">
          {boldText}
        </strong>
      );
    } else {
      nodes.push(<span key={`raw-${match.index}`}>{fullMatch}</span>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes;
}

function MessageActions({ content, messageId }: { content: string; messageId: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`classgrid:ai-feedback:${messageId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.feedback === "up" || parsed.feedback === "down") {
          setFeedback(parsed.feedback);
        }
      }
    } catch (e) { }
  }, [messageId]);

  async function handleCopy() {
    try {
      // Strip bold markers and links for plain text copy
      const plainText = content
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // Clipboard API may not be available in some contexts
    }
  }

  function handleFeedback(type: "up" | "down") {
    const newFeedback = type === feedback ? null : type;
    setFeedback(newFeedback);

    try {
      if (newFeedback) {
        localStorage.setItem(`classgrid:ai-feedback:${messageId}`, JSON.stringify({ feedback: newFeedback }));
      } else {
        localStorage.removeItem(`classgrid:ai-feedback:${messageId}`);
      }
    } catch (e) { }

    if (newFeedback === "down") {
      posthog?.capture("ai_message_thumbs_down", {
        message_id: messageId,
        content_preview: content.substring(0, 100)
      });
    } else if (newFeedback === "up") {
      posthog?.capture("ai_message_thumbs_up", {
        message_id: messageId,
        content_preview: content.substring(0, 100)
      });
    }
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
          copied
            ? "bg-emerald-500/15 text-emerald-500"
            : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        )}
        title={copied ? "Copied!" : "Copy response"}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => handleFeedback("up")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
          feedback === "up"
            ? "bg-emerald-500/15 text-emerald-500"
            : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        )}
        title="Helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleFeedback("down")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
          feedback === "down"
            ? "bg-red-500/15 text-red-400"
            : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        )}
        title="Not helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const AssistantMessageContent = memo(({ content, isTyping }: { content: string, isTyping?: boolean }) => {
  const blocks = useMemo(() => buildStructuredBlocks(content), [content]);

  return (
    <div className="space-y-3 text-sm leading-relaxed overflow-hidden break-words">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={`p-${index}`} className="text-slate-900 dark:text-white whitespace-pre-wrap">
              {renderInlineText(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={`l-${index}`} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={`li-${index}-${itemIndex}`} className="flex gap-2 text-slate-800 dark:text-slate-200">
                  <span className="min-w-5 font-medium text-emerald-600 dark:text-emerald-400">
                    {item.indexLabel ?? "\u2022"}
                  </span>
                  <span>{renderInlineText(item.text)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "table") {
          return (
            <div key={`t-${index}`} className="w-full pb-2">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {block.headers.map((h, i) => (
                        <TableHead key={i} className="font-semibold text-slate-900 dark:text-white">
                          {renderInlineText(h)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {block.rows.map((row, rIndex) => (
                      <TableRow key={rIndex}>
                        {row.map((cell, cIndex) => (
                          <TableCell key={cIndex} className="text-muted-foreground">
                            {renderInlineText(cell)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        }

        if (block.type === "code") {
          let highlighted = block.code;

          // Disable CPU-heavy syntax highlighting while actively typing to prevent scrolling freeze and main thread locks
          if (!isTyping) {
            try {
              if (block.language && hljs.getLanguage(block.language)) {
                highlighted = hljs.highlight(block.code, { language: block.language }).value;
              } else {
                highlighted = hljs.highlightAuto(block.code).value;
              }
            } catch (e) {
              highlighted = block.code
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            }
          } else {
            highlighted = block.code
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          }

          // Build line-numbered HTML
          const highlightedLines = highlighted.split("\n");
          const lineRows = highlightedLines.map((line, i) =>
            `<div class="flex w-max min-w-full"><span class="sticky left-0 z-10 shrink-0 w-14 pr-4 text-right select-none text-slate-400 bg-[#fafbfc] border-r border-slate-200 dark:text-zinc-600 dark:bg-[#111113] dark:border-white/5">${i + 1}</span><span class="px-4 whitespace-pre">${line || " "}</span></div>`
          ).join("");
          const finalHtml = `<pre class="text-[13px] py-4 !m-0 flex flex-col"><code class="font-mono hljs">${lineRows}</code></pre>`;

          return (
            <div key={`c-${index}`} className="w-full pb-2 overflow-hidden">
              <CodeBlockClient rawCode={block.code} html={finalHtml} language={block.language} />
            </div>
          );
        }

        const Icon = getSectionIcon(block.title);
        return (
          <div key={`s-${index}`} className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">{block.title.replace(/\*\*/g, "")}</h3>
            </div>
            {block.items && block.items.length > 0 ? (
              <ul className="space-y-2">
                {block.items.map((item, itemIndex) => (
                  <li key={`sli-${index}-${itemIndex}`} className="flex gap-2 text-slate-900 dark:text-white">
                    <span className="min-w-5 font-medium text-emerald-400">
                      {item.indexLabel ?? "\u2022"}
                    </span>
                    <span>{renderInlineText(item.text)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2">
                {block.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`sp-${index}-${paragraphIndex}`} className="text-slate-900 dark:text-white whitespace-pre-wrap">
                    {renderInlineText(paragraph)}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

export function AskAiPanel({ open, onOpenChange, pageContext, variant = "in-flow", initialMessages, autoFocus = true }: AskAiPanelProps) {
  const { data: session } = useSession();
  const prefersReducedMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // Build TOC items from user questions
  const tocItems = useMemo(() => {
    return messages
      .filter((m) => m.role === "user" && m.content)
      .map((m) => {
        let label = m.tocSummary || m.content.trim();
        if (!m.tocSummary) {
          const words = label.split(/\s+/);
          if (words.length > 4) {
            label = words.slice(0, 4).join(" ") + "...";
          } else if (label.length > 25) {
            label = label.substring(0, 25) + "...";
          }
        }
        return { id: `msg-${m.id}`, label };
      });
  }, [messages]);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (tocItems.length === 0) return;
    
    // Initially select the last item if none is selected
    if (!activeSection) {
      setActiveSection(tocItems[tocItems.length - 1].id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the top-most visible intersecting element
        const intersecting = entries.filter(e => e.isIntersecting);
        if (intersecting.length > 0) {
          // Sort by top offset to get the highest one in the viewport
          intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSection(intersecting[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px" } // Triggers when element is in top 30% of screen
    );

    // Give the DOM a moment to render new messages before observing
    const timeoutId = setTimeout(() => {
      tocItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [tocItems]);

  const [thinkingLabel, setThinkingLabel] = useState("Thinking");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [lastSentDocsPath, setLastSentDocsPath] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (!chatScrollRef.current) return;
    isAutoScrollingRef.current = true;
    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth"
    });
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 200);
    userScrolledUpRef.current = false;
    setShowScrollButton(false);
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // ── File attachment state ──
  const [attachedFiles, setAttachedFiles] = useState<UIFileAttachment[]>([]);
  const [previewFile, setPreviewFile] = useState<FilePreviewSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Local Storage Draft Persistence ──
  useEffect(() => {
    try {
      const savedInput = localStorage.getItem("askAiDraftInput");
      if (savedInput) setInput(savedInput);

      const savedFilesStr = localStorage.getItem("askAiDraftFiles");
      if (savedFilesStr) {
        const savedFiles = JSON.parse(savedFilesStr) as UIFileAttachment[];
        // Only restore files that finished uploading and have URLs,
        // because we can't restore the raw File object to resume failed uploads.
        const validRestoredFiles = savedFiles.filter(f => f.status === "done" && f.url);
        if (validRestoredFiles.length > 0) {
          setAttachedFiles(validRestoredFiles);
        }
      }

      const savedContext = localStorage.getItem("askAiDraftContext");
      if (savedContext) setLastSentDocsPath(savedContext);
    } catch (err) {
      console.error("Failed to restore Ask AI draft:", err);
    }
  }, []);

  useEffect(() => {
    if (input.trim() || attachedFiles.length > 0) {
      localStorage.setItem("askAiDraftInput", input);

      const filesToSave = attachedFiles
        .filter(f => f.status === "done" && f.url)
        .map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          status: f.status,
          url: f.url
        }));
      localStorage.setItem("askAiDraftFiles", JSON.stringify(filesToSave));
    } else {
      localStorage.removeItem("askAiDraftInput");
      localStorage.removeItem("askAiDraftFiles");
    }

    if (lastSentDocsPath) {
      localStorage.setItem("askAiDraftContext", lastSentDocsPath);
    } else {
      localStorage.removeItem("askAiDraftContext");
    }
  }, [input, attachedFiles, lastSentDocsPath]);

  const MAX_FILE_SIZE = 35 * 1024 * 1024; // 35MB
  const ACCEPTED_FILE_TYPES = "image/*,.pdf,.md,.txt,.csv,.doc,.docx,.xlsx,.pptx";

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return FileImage;
    if (mimeType === "application/pdf") return FileText;
    return File;
  }

  const processFiles = useCallback(async (files: File[]) => {
    const newFiles: UIFileAttachment[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      status: "uploading"
    }));

    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" is too large (${formatFileSize(f.size)}).`, { description: "Limit: 6 files · 35MB each" });
        return;
      }
    }

    if (newFiles.length === 0) return;

    const remaining = 6 - attachedFiles.length;

    if (remaining <= 0) {
      toast.error("You can attach up to 6 files per message.");
      return;
    }

    let accepted = newFiles;
    let droppedWarning = false;
    if (newFiles.length > remaining) {
      droppedWarning = true;
      accepted = newFiles.slice(0, remaining);
    }

    // Show files in UI immediately (optimistic) — no delay like Vercel/ChatGPT
    setAttachedFiles(prev => [...prev, ...accepted]);

    // If we had dropped files, show the warning now
    if (droppedWarning) {
      toast.error("You can attach up to 6 files per message.");
    }

    // Pre-flight check: See if we have enough hourly quota
    try {
      const preCheck = await checkAiUploadRateLimit(accepted.length);
      if (preCheck.error) {
        toast.error(preCheck.error);
        // Remove optimistically added files since quota is exceeded
        const acceptedIds = accepted.map(f => f.id);
        setAttachedFiles(prev => prev.filter(f => !acceptedIds.includes(f.id)));
        return;
      }
    } catch (err) {
      console.error("Pre-flight rate limit check failed:", err);
      // Fail open so we don't break the app if DB is down
    }

    let rateLimitToastShown = false;

    // Upload accepted files immediately in the background
    for (const newFile of accepted) {
      try {
        const result = await getPresignedUrlForAskAiFile(newFile.name, newFile.type, newFile.size);
        if ("error" in result) {
          if (!rateLimitToastShown) {
            toast.error(result.error);
            rateLimitToastShown = true;
          }

          if (result.error.includes("maximum limit")) {
            // If it's a rate limit, remove this file and all remaining unprocessed files from the UI
            const remainingIds = accepted.slice(accepted.indexOf(newFile)).map(f => f.id);
            setAttachedFiles(prev => prev.filter(f => !remainingIds.includes(f.id)));
            break; // Abort the rest of the batch
          } else {
            // For normal errors (like network/size), leave it as a red Failed box
            setAttachedFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: "error" } : f));
          }
          continue;
        }

        // Upload directly to R2 via presigned URL
        if (!newFile.file) throw new Error("Missing file blob for upload");
        
        if (result.uploadUrl === "mock") {
          // Simulate a network upload delay for the mock
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          await fetch(result.uploadUrl, {
            method: "PUT",
            body: newFile.file,
            headers: { "Content-Type": newFile.type },
          });
        }

        // Mark as done and save URL
        const finalUrl = result.publicUrl === "mock" ? URL.createObjectURL(newFile.file) : result.publicUrl;
        setAttachedFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: "done", url: finalUrl } : f));
      } catch (err) {
        console.error(`Failed to upload ${newFile.name}:`, err);
        if (!rateLimitToastShown) {
          toast.error(`Failed to upload "${newFile.name}".`);
        }
        setAttachedFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: "error" } : f));
      }
    }
  }, [attachedFiles.length]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(Array.from(files));
    e.target.value = "";
  }, [processFiles]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      await processFiles(pastedFiles);
    }
  }, [processFiles]);

  const removeAttachedFile = useCallback((id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Load chat history and session ID from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("classgrid_ai_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force typing to false for loaded messages so they don't get stuck
        setMessages(parsed.map((m: any) => ({ ...m, typing: false })));
      }
      const savedSessionId = localStorage.getItem("classgrid_ai_session_id");
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } catch (_) { }
  }, []);

  // Save chat history and session ID to local storage whenever they update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("classgrid_ai_chat_history", JSON.stringify(messages));
    }
    if (sessionId) {
      localStorage.setItem("classgrid_ai_session_id", sessionId);
    }
  }, [messages, sessionId]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isTerminated, setIsTerminated] = useState(false);

  // Track page history to answer "what page was I on" questions
  const [pageHistory, setPageHistory] = useState<{ path: string; title: string }[]>([]);

  useEffect(() => {
    if (!pageContext?.path) return;

    try {
      // Load current history from storage
      const savedHistory = localStorage.getItem("classgrid_page_history");
      let history: { path: string; title: string }[] = savedHistory ? JSON.parse(savedHistory) : [];

      const newEntry = {
        path: pageContext.path,
        title: pageContext.title || document.title
      };

      // If the current page is different from the last page in history, add it
      if (history.length === 0 || history[history.length - 1].path !== newEntry.path) {
        history = [...history, newEntry].slice(-8); // Keep max 8 pages
        localStorage.setItem("classgrid_page_history", JSON.stringify(history));
      }

      setPageHistory(history);
    } catch (_) { }
  }, [pageContext?.path, pageContext?.title]);
  const [bannedUntil, setBannedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);

  // Fetch contextual user data on mount if session exists
  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/user/ai-context")
        .then((res) => res.json())
        .then((data) => {
          if (data?.userContext) {
            setUserContext(data.userContext);
          }
        })
        .catch((err) => console.error("Failed to fetch user context", err));
    }
  }, [session]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isGenerating = submitting || thinking || (messages[messages.length - 1]?.typing === true);

  // Live countdown timer for ban expiry
  useEffect(() => {
    if (!bannedUntil) {
      setCountdown("");
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = bannedUntil.getTime() - now;

      if (diff <= 0) {
        // Ban expired — unlock the chat!
        setIsTerminated(false);
        setBannedUntil(null);
        setCountdown("");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [bannedUntil]);

  // Check if user is already banned on page load
  useEffect(() => {
    async function checkBanStatus() {
      try {
        const endpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT || "/api/ask-ai";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "__ban_check__" }),
        });
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          setIsTerminated(true);
          if (data?.bannedUntil) {
            setBannedUntil(new Date(data.bannedUntil));
          }
        }
      } catch (_) {
        // silently ignore network errors
      }
    }
    if (open) void checkBanStatus();
  }, [open]);

  function handleClearChat() {
    setMessages([]);
    setInput("");
    setSessionId(null);
    setAttachedFiles([]);
    setLastSentDocsPath(null);
    localStorage.removeItem("classgrid_ai_chat_history");
    localStorage.removeItem("classgrid_ai_session_id");
    localStorage.removeItem("askAiDraftContext");
  }

  function handleStop() {
    // 1. Abort any ongoing network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Stop any ongoing typing animation
    typingRunRef.current++;

    // 3. Reset states
    setThinking(false);
    setSubmitting(false);

    // 4. Update the last message to stop the typing indicator
    setMessages((current) => {
      const last = current[current.length - 1];
      if (last?.role === "assistant" && last.typing) {
        return current.map(m => m.id === last.id ? { ...m, typing: false } : m);
      }
      return current;
    });
  }

  async function handleCopyAll() {
    if (messages.length === 0) return;
    try {
      const text = messages
        .map((m) => `${m.role === "user" ? "You" : "Classgrid AI"}:\n${m.content}`)
        .join("\n\n---\n\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (_) { }
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : null;

  const typingRunRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const hasDocsContext = pageContext?.path?.startsWith("/docs") && pageContext.path !== lastSentDocsPath;
  const isAnyFileUploading = attachedFiles.some(f => f.status === "uploading");
  const canSubmit = (input.trim().length > 0 || hasDocsContext || attachedFiles.length > 0) && !submitting && !isAnyFileUploading;
  const emptyState = useMemo(() => messages.length === 0, [messages.length]);
  const suggestedQuestions = useMemo(() => suggestedQuestionsForPage(pageContext), [pageContext]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !isMobile) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "auto";
    };
  }, [open, isMobile]);

  const userScrolledUpRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

  // Track when user manually scrolls — use 'scroll' event which fires for ALL scroll types
  useEffect(() => {
    const element = chatScrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      // Skip if we caused this scroll programmatically
      if (isAutoScrollingRef.current) return;

      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      // User scrolled up if they're more than 80px from bottom
      const isScrolledUp = distanceFromBottom > 80;
      userScrolledUpRef.current = isScrolledUp;
      setShowScrollButton(isScrolledUp);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  // Auto-scroll when a new message is added or thinking state changes
  useEffect(() => {
    if (!open) return;
    const element = chatScrollRef.current;
    if (!element) return;

    const currentCount = messages.length;
    const isNewMessage = currentCount > prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    // If user scrolled up, don't force them down — unless it's a brand new message they just sent
    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.role === "user";

    if (userScrolledUpRef.current && !isUserMessage && !thinking) return;

    // Only auto-scroll on: new message added, thinking started, or user just sent a message
    if (!isNewMessage && !thinking) return;

    // Reset scroll lock when user sends a new message
    if (isUserMessage) {
      userScrolledUpRef.current = false;
    }

    isAutoScrollingRef.current = true;
    requestAnimationFrame(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
      setTimeout(() => { isAutoScrollingRef.current = false; }, 200);
    });
  }, [messages.length, thinking, open]);

  // Follow along during typing animation via a gentle interval
  // instead of reacting to every message state change (which fights user scroll)
  useEffect(() => {
    if (!open) return;
    const element = chatScrollRef.current;
    if (!element) return;

    // Only run while a message is actively being typed
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.typing) return;

    const interval = setInterval(() => {
      // If user scrolled up, respect their position
      if (userScrolledUpRef.current) return;

      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      if (distanceFromBottom > 150) return;

      isAutoScrollingRef.current = true;
      element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
      setTimeout(() => { isAutoScrollingRef.current = false; }, 80);
    }, 150);

    return () => clearInterval(interval);
  }, [open, messages.length, messages[messages.length - 1]?.typing]);

  function createMessageId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function wait(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function getCharDelay(char: string) {
    if (prefersReducedMotion) return 0;
    if (/[.!?]/.test(char)) return 30;
    if (/[,;:]/.test(char)) return 20;
    if (char === " ") return 6;
    return 11;
  }

  async function typeAssistantResponse(answer: string) {
    const runId = ++typingRunRef.current;

    setMessages((current) => {
      const last = current[current.length - 1];
      if (last && last.role === "assistant" && !last.content) {
        return current.map(m => m.id === last.id ? { ...m, typing: true } : m);
      }
      return [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: "",
          createdAt: Date.now(),
          typing: true,
        },
      ];
    });

    for (let index = 1; index <= answer.length; index += 1) {
      if (runId !== typingRunRef.current) return;

      setMessages((current) => {
        const last = current[current.length - 1];
        if (!last || last.role !== "assistant") return current;
        return current.map((message) =>
          message.id === last.id
            ? { ...message, content: answer.slice(0, index) }
            : message
        );
      });

      const delay = getCharDelay(answer[index - 1]);
      if (delay > 0) {
        await wait(delay);
      }
    }

    if (runId !== typingRunRef.current) return;

    setMessages((current) => {
      const last = current[current.length - 1];
      if (!last || last.role !== "assistant") return current;
      return current.map((message) =>
        message.id === last.id ? { ...message, typing: false } : message
      );
    });
  }

  async function askQuestion(question: string) {
    let displayQuestion = question.trim();
    let apiQuestion = question.trim();
    const isDocsContextActive = pageContext?.path?.startsWith("/docs") && pageContext.path !== lastSentDocsPath;

    // Only send files that successfully uploaded
    const filesToUpload = attachedFiles
      .filter(f => f.status === "done" && f.url)
      .map(f => ({
        name: f.name,
        url: f.url!,
        mimeType: f.type,
        size: f.size,
      }));

    if (!apiQuestion && !isDocsContextActive && filesToUpload.length === 0) return;
    if (submitting) return;

    if (isDocsContextActive && pageContext?.path && filesToUpload.length === 0) {
      const docsUrl = `https://classgrid.in${pageContext.path}`;
      setLastSentDocsPath(pageContext.path);

      if (!apiQuestion) {
        apiQuestion = `Explain this page: ${pageContext.title || "Documentation"} (${docsUrl})`;
      } else {
        apiQuestion = `${apiQuestion}\n\n*(Context: ${docsUrl})*`;
      }
    }

    // If user only attached files with no text, set a default question
    if (!displayQuestion && filesToUpload.length > 0) {
      const fileNames = filesToUpload.map(f => f.name).join(", ");
      displayQuestion = ""; // Leave UI blank so only the image renders
      apiQuestion = `[User attached file(s): ${fileNames}] Please analyze or read the attached content.`;
    }

    setError("");
    setInput("");
    setAttachedFiles([]);
    localStorage.removeItem("askAiDraftInput");
    localStorage.removeItem("askAiDraftFiles");
    localStorage.removeItem("askAiDraftContext");
    setSubmitting(true);
    setThinking(true);
    setThinkingLabel("Thinking");
    userScrolledUpRef.current = false; // Reset scroll lock for new question

    const uploadedAttachments: AiAttachment[] = filesToUpload;

    // Record file sends for rate limiting (only counts when actually sent, not uploaded)
    if (uploadedAttachments.length > 0) {
      recordAiFilesSent(uploadedAttachments.length).catch(console.error);
    }

    if (uploadedAttachments.length > 0) {
      const fileContextLines = uploadedAttachments.map((a, i) => {
        let cleanName = a.name;
        if (/^whatsapp image/i.test(cleanName)) cleanName = "Uploaded Image";
        else if (/^screenshot/i.test(cleanName)) cleanName = "Screenshot";
        else if (/^img_/i.test(cleanName)) cleanName = "Uploaded Image";

        return `[Attached file: ${cleanName} (${a.mimeType}) — URL: ${a.url}]`;
      }).join("\n");
      apiQuestion = `${apiQuestion}\n\n${fileContextLines}`;
    }

    const sentContextUrl = isDocsContextActive && pageContext?.path
      ? `https://classgrid.in${pageContext.path}`
      : undefined;
    const sentContextTitle = isDocsContextActive && pageContext?.title
      ? pageContext.title
      : undefined;

    const userMsgId = createMessageId("user");
    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: displayQuestion,
        createdAt: Date.now(),
        contextUrl: sentContextUrl,
        contextTitle: sentContextTitle,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      },
    ];

    setMessages(nextMessages);

    // BACKGROUND SUMMARY GENERATOR FOR TOC (Delayed to prevent rate limits)
    if (displayQuestion.length > 25) {
      setTimeout(() => {
        console.log("firing background summary fetch for message:", userMsgId);
        const endpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT || "/api/ask-ai";
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: `Create a 3 to 5 word summary title for this message. Output ONLY the raw words, no quotes, no preambles: ${displayQuestion}`,
            history: [{ role: "system", content: "You are a title generator. Output only a short title, without quotes." }]
          })
        })
        .then(async (res) => {
           console.log("background summary fetch response status:", res.status);
           const contentType = res.headers.get("content-type") || "";
           if (contentType.includes("text/event-stream") && res.body) {
             const reader = res.body.getReader();
             const decoder = new TextDecoder();
             let buffer = "";
             let finalAnswer = "";
             while (true) {
               const { done, value } = await reader.read();
               if (done) break;
               buffer += decoder.decode(value, { stream: true });
               const parts = buffer.split("\n\n");
               buffer = parts.pop() || "";
               for (const part of parts) {
                 const dataMatch = part.match(/^data:\s*(.+)$/m);
                 if (dataMatch) {
                   try {
                     const event = JSON.parse(dataMatch[1]);
                     if (event.type === "answer") {
                       finalAnswer = event.answer;
                       console.log("background summary parsed final answer:", finalAnswer);
                     }
                   } catch (_) {}
                 }
               }
             }
             if (finalAnswer) {
               console.log("updating state with tocSummary:", finalAnswer);
               setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, tocSummary: finalAnswer.trim().replace(/^["']|["']$/g, '') } : m));
             } else {
               console.log("background summary finished but finalAnswer was empty");
             }
           } else {
             console.log("background summary response was not event-stream", contentType);
           }
        })
        .catch(err => console.error("background summary fetch failed:", err));
      }, 2000);
    }

    let wasTerminated = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const endpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT || "/api/ask-ai";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: apiQuestion,
          userName: session?.user?.name ?? undefined,
          userEmail: session?.user?.email ?? undefined,
          userContext: userContext,
          sessionId: sessionId ?? undefined,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments.map(a => ({ url: a.url, name: a.name, mimeType: a.mimeType })) : undefined,
          history: messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
          pageContext: {
            ...pageContext,
            pageHistory: pageHistory,
            summary: pageContext?.summary || (typeof window !== "undefined" ? (window as any).classgrid_current_ticket_context : undefined),
          },
        }),
      });

      // Error responses (403 ban, 429 rate-limit) are still JSON
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 403) {
          setIsTerminated(true);
          wasTerminated = true;
          if (payload?.bannedUntil) {
            setBannedUntil(new Date(payload.bannedUntil));
          }
        }
        throw new Error(
          typeof payload?.error === "string" && payload.error.trim().length > 0
            ? payload.error
            : "Unable to answer right now. Please try again."
        );
      }

      // --- SSE STREAM READER ---
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalPayload: any = null;
        let streamError: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const dataMatch = part.match(/^data:\s*(.+)$/m);
            if (!dataMatch) continue;

            try {
              const event = JSON.parse(dataMatch[1]);
              if (event.type === "status") {
                setThinkingLabel(
                  event.label === "searching" ? "Searching the web" :
                    event.label === "reading page" ? "Reading webpage" :
                      event.label === "reading image" ? "Reading image" :
                        event.label === "reading document" ? "Reading document" :
                          event.label === "analyzing" ? "Analyzing results" :
                            "Thinking"
                );
              } else if (event.type === "answer") {
                finalPayload = event;
              } else if (event.type === "thought") {
                setMessages((prev) => {
                  let lastMsg = prev[prev.length - 1];
                  let targetPrev = prev;
                  if (!lastMsg || lastMsg.role !== "assistant") {
                    lastMsg = { id: createMessageId("assistant"), role: "assistant", content: "", createdAt: Date.now() };
                    targetPrev = [...prev, lastMsg];
                  }
                  const thoughtText = event.thought || event.content || "";
                  return [
                    ...targetPrev.slice(0, -1),
                    { ...lastMsg, thought: (lastMsg.thought || "") + thoughtText + "\n\n" }
                  ];
                });
              } else if (event.type === "error") {
                streamError = event.error || "Unable to answer right now. Please try again.";
              }
            } catch (_) {
              // Skip malformed JSON chunks
            }
          }
        }

        if (streamError) {
          throw new Error(streamError);
        }

        if (finalPayload) {
          if (finalPayload.sessionId) {
            setSessionId(finalPayload.sessionId);
            localStorage.setItem("classgrid_ai_session_id", finalPayload.sessionId);
          }

          const answer =
            typeof finalPayload.answer === "string" && finalPayload.answer.trim().length > 0
              ? finalPayload.answer
              : session?.user?.name
                ? `Hi ${session.user.name.split(" ")[0]}, I can help you with Classgrid features, pricing, or setup. What would you like to explore?`
                : "I can help you with Classgrid features, pricing, or setup. What would you like to explore?";

          setThinking(false);
          await wait(prefersReducedMotion ? 0 : 100);
          await typeAssistantResponse(answer);
        } else {
          throw new Error("Unable to answer right now. Please try again.");
        }
      } else {
        // Fallback: JSON response (for ban_check or older format)
        const payload = await response.json().catch(() => ({}));

        if (payload?.sessionId) {
          setSessionId(payload.sessionId);
          localStorage.setItem("classgrid_ai_session_id", payload.sessionId);
        }

        const answer =
          typeof payload?.answer === "string" && payload.answer.trim().length > 0
            ? payload.answer
            : session?.user?.name
              ? `Hi ${session.user.name.split(" ")[0]}, I can help you with Classgrid features, pricing, or setup. What would you like to explore?`
              : "I can help you with Classgrid features, pricing, or setup. What would you like to explore?";

        setThinking(false);
        await wait(prefersReducedMotion ? 0 : 100);
        await typeAssistantResponse(answer);
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.message?.includes("abort")) {
        // User manually stopped the generation, silently exit
        setSubmitting(false);
        setThinking(false);
        return;
      }
      const rawMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to answer right now. Please try again.";

      // If terminated, add support info to the message shown in chat
      const fallback = wasTerminated || rawMessage.includes("terminated") || rawMessage.includes("restricted")
        ? `${rawMessage}\n\nIf you believe this is a mistake, please contact us at support@classgrid.in.\n\nTo understand why this action was taken, please read our [Privacy Policy](/privacy) and [Terms of Service](/terms).`
        : rawMessage;

      setThinking(false);
      await wait(prefersReducedMotion ? 0 : 100);
      await typeAssistantResponse(fallback);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    void askQuestion(input);
  }

  // ─── Panel content (shared between desktop sidebar and mobile bottom-sheet) ───
  const panelHeader = (
    <div className={cn("flex items-center justify-between px-4 py-4", variant !== "full-page" && "border-b border-border")}>
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-emerald-500" />
        <p className="text-sm font-semibold text-foreground">Ask AI</p>
      </div>
      <div className="flex items-center gap-1">
        {variant !== "full-page" && messages.length > 0 && (
          <>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground cursor-pointer"
              onClick={handleCopyAll}
              title="Copy entire chat"
            >
              {copiedAll ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy chat</span>
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground cursor-pointer"
              onClick={handleClearChat}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Clear chat</span>
            </button>
            <div className="mx-1 h-4 w-[1px] bg-border" />
          </>
        )}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground cursor-pointer"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close panel</span>
        </button>
      </div>
    </div>
  );

  const panelChat = (
    <div ref={variant !== "full-page" ? chatScrollRef : undefined} className={cn("overscroll-contain [scrollbar-width:thin]", variant === "full-page" ? "w-full" : "flex-1 min-h-0 overflow-y-auto")}>
      <div className={cn("flex flex-col gap-4 px-4 py-4", variant === "full-page" && "max-w-[52rem] mx-auto w-full pb-52")}>
        {emptyState ? (
          <>
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {session?.user?.name ? (
                  <span className="mb-1 block font-medium text-foreground">
                    Hi, {session.user.name.split(" ")[0]} 👋
                  </span>
                ) : null}
                {pageContext?.title
                  ? `Ask about ${pageContext.title}, Classgrid features, pricing, demos, or support.`
                  : "Ask anything about Classgrid features, pricing, website capabilities, demo process, or support."}
              </p>
            </div>

            <div className="space-y-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-2xl border-border bg-card/40 px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => void askQuestion(question)}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
                  {question}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <motion.div
                  key={message.id}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.16 }}
                  className={cn(
                    "flex items-end gap-2 w-full",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {/* 
                    AI WARNING: NEVER DELETE OR MODIFY THE PROFILE PHOTO LOGIC BELOW! 
                    THIS WAS BUILT PERFECTLY TO SUPPORT BOTH PLATFORM PHOTOS AND GOOGLE PHOTOS.
                    DO NOT TOUCH THIS!
                  */}
                  <div
                    className={cn(
                      "flex h-8 w-8 overflow-hidden shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isUser && ((session?.user as any)?.platformPhoto || (session?.user as any)?.image || userInitial)
                        ? "order-2 bg-muted text-muted-foreground"
                        : "hidden"
                    )}
                  >
                    {isUser ? (
                      (session?.user as any)?.platformPhoto || (session?.user as any)?.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={(session?.user as any)?.platformPhoto || (session?.user as any)?.image} alt="User" className="h-full w-full object-cover" />
                      ) : userInitial ? (
                        userInitial
                      ) : null
                    ) : null}
                  </div>

                  <div className={cn("flex flex-col gap-1.5 min-w-0", isUser ? "order-1 items-end max-w-[75%]" : "order-2 w-full")}>

                    {/* ── Text Bubble ── */}
                    {message.content && (
                      <div
                        id={isUser ? `msg-${message.id}` : undefined}
                        className={cn(
                          "relative min-w-0 transition-all duration-700 msg-target-glow scroll-mt-12",
                          isUser
                            ? "rounded-2xl rounded-br-none px-4 py-2.5 bg-foreground text-background"
                            : "w-full max-w-full bg-transparent text-foreground"
                        )}
                      >
                        {isUser && (
                          <svg
                            width="8"
                            height="12"
                            viewBox="0 0 8 12"
                            fill="currentColor"
                            className="absolute bottom-0 -right-1.5 text-foreground"
                          >
                            <path d="M0 0V12H8C5 12 2 9 0 0Z" />
                          </svg>
                        )}
                        {isUser ? (
                          <>
                            <p className="text-sm leading-relaxed break-words break-all whitespace-pre-wrap relative z-10">{message.content}</p>
                            {message.contextUrl && (
                              <a
                                href={message.contextUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 flex items-center gap-1.5 text-[11px] text-sky-300 dark:text-sky-300 hover:text-sky-200 transition-opacity relative z-10"
                              >
                                <FileText className="h-3 w-3" />
                                <span className="underline underline-offset-2 truncate max-w-[200px]">
                                  {message.contextTitle || message.contextUrl}
                                </span>
                              </a>
                            )}
                          </>
                        ) : (
                          <div className="pl-1 w-full max-w-full">
                            {message.thought && (
                              <Accordion type="single" collapsible={true as any} className="mb-4">
                                <AccordionItem value="thought" className="border-none">
                                  <AccordionTrigger className="w-fit flex-none justify-start gap-1.5 px-2.5 py-1.5 h-auto text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 hover:no-underline dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 transition-colors [&>svg]:size-3 [&>svg]:ml-0">
                                    <span>Thought</span>
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-3 pb-1 px-1">
                                    <div className="border-l-[3px] border-slate-200 dark:border-white/10 pl-3.5 py-0.5 text-[13px] text-slate-500 dark:text-slate-400 font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                                      {message.thought.trim()}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                            <AssistantMessageContent content={message.content} isTyping={message.typing} />
                          </div>
                        )}
                        {!isUser && !message.typing && message.content.length > 0 && (
                          <div className="pl-1 mt-3">
                            <MessageActions content={message.content} messageId={message.id} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Attachments (Outside Bubble) ── */}
                    {isUser && message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-col gap-2 items-end">

                        {/* Images using DocsImageViewer */}
                        {message.attachments.filter(a => a.mimeType.startsWith("image/")).length > 0 && (
                          <DocsImageViewer
                            images={message.attachments.filter(a => a.mimeType.startsWith("image/")).map((a, idx) => ({
                              id: `${a.name}-${idx}-${message.id}`,
                              src: a.url,
                              alt: a.name
                            }))}
                            renderThumbnails={(images, openImage) => (
                              <div className="flex flex-wrap gap-2 justify-end">
                                {images.map((img) => (
                                  <button
                                    key={img.id}
                                    type="button"
                                    onClick={(e) => openImage(img, e)}
                                    title={img.alt}
                                    className={cn(
                                      "relative group overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:border-emerald-500/50 transition-all shadow-sm cursor-pointer",
                                      images.length === 1 && !message.content ? "rounded-2xl rounded-tr-none h-auto w-[180px] sm:w-[220px]" : "rounded-xl h-20 w-20 sm:h-[88px] sm:w-[88px]"
                                    )}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={img.src}
                                      alt={img.alt}
                                      className={cn("absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105", images.length === 1 && !message.content ? "relative object-contain" : "object-cover")}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors" />
                                  </button>
                                ))}
                              </div>
                            )}
                          />
                        )}

                        {/* Other Documents using FilePreviewModal */}
                        {message.attachments.filter(a => !a.mimeType.startsWith("image/")).length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {message.attachments.filter(a => !a.mimeType.startsWith("image/")).map((att, i) => {
                              const Icon = getFileIcon(att.mimeType);
                              return (
                                <button
                                  key={`${att.name}-${i}`}
                                  type="button"
                                  onClick={() => setPreviewFile({ name: att.name, src: att.url, mimeType: att.mimeType })}
                                  title={att.name}
                                  className="relative group overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:border-emerald-500/50 transition-all shadow-sm rounded-xl h-20 w-20 sm:h-[88px] sm:w-[88px]"
                                >
                                  <div className="flex flex-col items-center justify-center gap-1 text-foreground/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    <Icon className="h-7 w-7" strokeWidth={1.5} />
                                    <span className="text-[9px] uppercase tracking-wider font-bold">
                                      {att.name.split('.').pop()?.substring(0, 4)}
                                    </span>
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <AnimatePresence>
              {thinking ? (
                <motion.div
                  key="thinking-state"
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="flex items-end gap-2"
                >
                  <div className="pl-1">
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                      <span className="font-medium animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%] bg-clip-text text-transparent bg-[linear-gradient(110deg,#94a3b8,45%,#0f172a,55%,#94a3b8)] dark:bg-[linear-gradient(110deg,#475569,45%,#ffffff,55%,#475569)]">
                        {thinkingLabel}
                      </span>
                      {(thinkingLabel === "Searching the web" || thinkingLabel === "Reading webpage" || thinkingLabel === "Reading image" || thinkingLabel === "Reading document") ? (
                        <SearchingSpinner reducedMotion={Boolean(prefersReducedMotion)} />
                      ) : (
                        <TypingDots reducedMotion={Boolean(prefersReducedMotion)} />
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );

  const panelInput = (
    <div className={cn(
      "px-4 py-4 relative",
      variant === "full-page"
        ? "absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        : "border-t border-border"
    )}>
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 -top-12 flex justify-center z-20 pointer-events-auto"
          >
            <button
              type="button"
              onClick={scrollToBottom}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border shadow-md text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(variant === "full-page" && "relative max-w-[52rem] mx-auto w-full pointer-events-auto")}>

      {isTerminated ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-500">
          <p>This conversation has been terminated.</p>
          {countdown && (
            <p className="mt-1 text-xs text-red-400">
              Access resumes in: <span className="font-mono font-bold">{countdown}</span>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative w-full shadow-sm rounded-2xl border border-border bg-background focus-within:border-foreground/30 focus-within:ring-1 focus-within:ring-foreground/30 transition-colors">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileSelect}
              className="hidden"
            />

            {pageContext?.path?.startsWith("/docs") && pageContext.path !== lastSentDocsPath && (
              <div className="px-3 pt-3 pb-0">
                <div className="group relative inline-flex items-center gap-2.5 rounded-[10px] border border-border/80 bg-muted/40 px-3 py-2 pr-8 shadow-sm max-w-[95%]">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0 overflow-hidden text-left gap-0.5">
                    <span className="text-[12px] font-semibold text-foreground truncate leading-tight">
                      {pageContext.title || "Introduction"}
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 truncate leading-tight">
                      https://classgrid.in{pageContext.path}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastSentDocsPath(pageContext.path!)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 focus:text-foreground"
                    title="Remove page context"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove context</span>
                  </button>
                </div>
              </div>
            )}

            {/* Attached file chips */}
            {attachedFiles.length > 0 && (
              <div className="px-3 pt-3 pb-0 flex flex-wrap gap-1.5">
                {attachedFiles.map((att) => {
                  const Icon = getFileIcon(att.type);
                  const isImage = att.type.startsWith("image/");
                  return (
                    <div
                      key={att.id}
                      className={cn(
                        "group relative inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 pr-8 shadow-sm max-w-[200px] transition-all",
                        att.status === "error" ? "border-red-500/50 bg-red-500/10" : "border-border/80 bg-muted/40",
                        att.status === "uploading" ? "opacity-70 animate-pulse" : "opacity-100"
                      )}
                    >
                      {isImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={att.url || (att.file ? URL.createObjectURL(att.file) : "")}
                          alt={att.name}
                          className="h-6 w-6 rounded object-cover shrink-0"
                        />
                      ) : (
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex flex-col min-w-0 overflow-hidden text-left gap-0">
                        <span className="text-[11px] font-medium text-foreground truncate leading-tight">
                          {att.name}
                        </span>
                        {att.status === "uploading" ? (
                          <div className="h-1.5 w-full max-w-[80px] bg-muted-foreground/20 rounded-full overflow-hidden mt-1 mb-0.5">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: "85%" }}
                              transition={{ duration: 2.5, ease: "easeOut" }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/70 leading-tight">
                            {att.status === "error" ? "Failed" : formatFileSize(att.size)}
                          </span>
                        )}
                      </div>

                      {/* Allow previewing the file immediately after successful upload */}
                      {att.status === "done" && att.url && (
                        <button
                          type="button"
                          onClick={() => setPreviewFile({ name: att.name, src: att.url!, mimeType: att.type })}
                          className="absolute inset-0 w-full h-full cursor-pointer z-0"
                          title="Preview file"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeAttachedFile(att.id)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10 cursor-pointer"
                        title={`Remove ${att.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <textarea
              id="ask-ai-input"
              name="askAiQuestion"
              suppressHydrationWarning
              ref={inputRef as any}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSubmit) void askQuestion(input);
                }
              }}
              placeholder={attachedFiles.length > 0 ? "Add a message or send files..." : "Ask a question..."}
              autoComplete="off"
              className={cn(
                "min-h-[120px] max-h-[240px] w-full resize-none bg-transparent pb-12 pr-14 text-sm text-foreground focus:outline-none overflow-y-auto [scrollbar-width:thin] leading-relaxed transition-colors",
                (pageContext?.path?.startsWith("/docs") && !isGenerating) ? "pl-14" : "pl-4",
                (pageContext?.path?.startsWith("/docs") || attachedFiles.length > 0) ? "pt-3" : "pt-4 rounded-2xl"
              )}
            />

            {/* Bottom Left action bar: paperclip */}
            {(pageContext?.path?.startsWith("/docs") || variant === "full-page") && !isGenerating && (
              <div className="absolute bottom-3 left-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachedFiles.length >= 6}
                  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-30 transition-all cursor-pointer"
                  title={attachedFiles.length >= 6 ? "Max 6 files" : "Attach file (max 35MB)"}
                >
                  <Paperclip className={cn("h-4 w-4 -rotate-45", isAnyFileUploading && "opacity-50")} />
                </button>
              </div>
            )}

            {/* Bottom Right action bar: send/stop */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">

              {isGenerating ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleStop}
                  className="h-8 rounded-full bg-foreground text-background hover:bg-foreground/90 px-3 text-[11px] font-medium shadow-sm transition-all active:scale-95"
                  title="Stop generating"
                >
                  <Square className="mr-1.5 h-3 w-3 fill-current opacity-80" />
                  Stop
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="icon"
                  disabled={!canSubmit}
                  className="h-8 w-8 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Send question</span>
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
      </div>

    </div>
  );

  return (
    <>
      <style>{`
        @keyframes targetGlowPulse {
          0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
          15% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.6); }
          100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
        }
        .msg-target-glow:target {
          animation: targetGlowPulse 2.5s ease-in-out forwards;
        }
      `}</style>
      {/* ══════════════════════════════════════════════════════════
          FULL-PAGE: ChatGPT-style centered layout
          ══════════════════════════════════════════════════════════ */}
      {variant === "full-page" ? (
        <div className="fixed inset-0 z-[100] bg-background flex flex-row">
          <div className="flex-1 relative flex flex-col h-full">
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto overscroll-contain scroll-smooth"
            >
              {panelChat}
            </div>
            <div className="shrink-0 bg-background pt-2 pb-6 px-4 md:px-8 max-w-4xl w-full mx-auto">
              {panelInput}
            </div>
          </div>
          {/* Right-side TOC showing user questions */}
          {tocItems.length > 0 && <ScrollSpyTOC tocItems={tocItems} activeSection={activeSection} />}
        </div>
      ) : null}

      {/* ══════════════════════════════════════════════════════════
          DESKTOP: Side Panel Layout
          ══════════════════════════════════════════════════════════ */}
      {variant === "in-flow" ? (
        <div
          className={cn(
            "hidden sm:block shrink-0 overflow-hidden sticky top-0 h-[100dvh]",
            "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            prefersReducedMotion && "!duration-0",
            open ? "w-[400px]" : "w-0"
          )}
        >
          <aside
            className="h-[100dvh] w-[400px] flex flex-col border-l border-border bg-background"
            aria-hidden={!open}
          >
            {panelHeader}
            {panelChat}
            {panelInput}
          </aside>
        </div>
      ) : null}

      {variant === "overlay" ? (
        <AnimatePresence>
          {!isMobile && open && (
            <motion.aside
              aria-hidden={!open}
              className="fixed inset-y-0 right-0 z-[120] w-[400px] flex flex-col border-l border-border bg-background shadow-2xl hidden sm:flex"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={prefersReducedMotion ? { duration: 0 } : panelTransition}
            >
              {panelHeader}
              {panelChat}
              {panelInput}
            </motion.aside>
          )}
        </AnimatePresence>
      ) : null}

      {/* ══════════════════════════════════════════════════════════
          MOBILE: Fixed bottom-sheet (unchanged from production)
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {open && isMobile ? (
          <motion.button
            key="ask-ai-overlay"
            type="button"
            aria-label="Close Ask AI panel"
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[110] bg-background/70 backdrop-blur-sm sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
        ) : null}
      </AnimatePresence>

      {isMobile && (
        <motion.aside
          aria-hidden={!open}
          className={cn(
            "fixed z-[120] flex flex-col border-border bg-background shadow-2xl sm:hidden",
            "inset-x-0 bottom-0 h-[100dvh] w-full border-t",
            open ? "pointer-events-auto" : "pointer-events-none"
          )}
          initial={false}
          animate={
            open
              ? { y: 0, opacity: 1 }
              : { y: "100%", opacity: 0 }
          }
          transition={prefersReducedMotion ? { duration: 0 } : panelTransition}
        >
          {panelHeader}
          {panelChat}
          {panelInput}
        </motion.aside>
      )}

      {/* File Preview Modal */}
      {previewFile && !previewFile.mimeType?.startsWith("image/") && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* DocsImageViewer for standalone image previews (e.g. from the input chip) */}
      {previewFile && previewFile.mimeType?.startsWith("image/") && (
        <DocsImageViewer
          images={[{
            id: previewFile.name,
            src: typeof previewFile.src === 'string' ? previewFile.src : URL.createObjectURL(previewFile.src as Blob),
            alt: previewFile.name
          }]}
          defaultOpenIndex={0}
          renderThumbnails={() => null}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}

