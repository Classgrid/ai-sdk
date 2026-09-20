import * as React from 'react';
import { memo, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import hljs from 'highlight.js';
import { useMotionValue, motion, useMotionTemplate, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Check, Copy, FileText, BarChart3, ClipboardList, CreditCard, MessageCircleMore, Globe2, LayoutDashboard, School, Sparkles, ChevronRight, ChevronDownIcon, Bot, Trash2, X, ArrowDown, Paperclip, Square, ArrowUp, Search, FileImage, File, ThumbsUp, ThumbsDown, List, ZoomOut, ZoomIn, RotateCw, Download } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { Accordion as Accordion$1 } from '@base-ui/react/accordion';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { Input as Input$1 } from '@base-ui/react/input';

// src/react/components/AskAiPanel.tsx
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
var buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 relative overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white hover:bg-emerald-500 hover:text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-emerald-500 dark:hover:text-white border border-zinc-800 dark:border-white/10 hover:border-transparent transition-colors duration-300",
        primary: "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors duration-300",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        rainbow: "bg-white text-zinc-950 hover:text-zinc-950 dark:bg-zinc-950 dark:text-white dark:hover:text-white border border-zinc-200 dark:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.1)]"
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-14 rounded-full px-10 text-base",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Button = React.forwardRef(
  ({ className, variant, size, asChild = false, showGlow = false, glowVariant = "emerald", children, ...props }, ref) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    function handleMouseMove({ currentTarget, clientX, clientY }) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
    const isRainbow = variant === "rainbow";
    const glowColorDark = glowVariant === "neutral" ? "rgba(255, 255, 255, 0.25)" : "rgba(16, 185, 129, 0.45)";
    const glowColorLight = glowVariant === "neutral" ? "rgba(0, 0, 0, 0.1)" : "rgba(16, 185, 129, 0.35)";
    const renderGlow = () => {
      if (isRainbow) {
        return /* @__PURE__ */ jsx(
          motion.div,
          {
            className: "pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 z-10",
            style: {
              background: useMotionTemplate`
                radial-gradient(
                  200px circle at ${mouseX}px ${mouseY}px,
                  rgba(255, 0, 0, 0.6),
                  rgba(255, 165, 0, 0.6),
                  rgba(255, 255, 0, 0.6),
                  rgba(0, 128, 0, 0.6),
                  rgba(0, 0, 255, 0.6),
                  rgba(75, 0, 130, 0.6),
                  rgba(238, 130, 238, 0.6),
                  transparent 80%
                )
              `
            }
          }
        );
      }
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          motion.div,
          {
            className: "pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden z-0",
            style: {
              background: useMotionTemplate`
                radial-gradient(
                  120px circle at ${mouseX}px ${mouseY}px,
                  ${glowColorLight},
                  transparent 80%
                )
              `
            }
          }
        ),
        /* @__PURE__ */ jsx(
          motion.div,
          {
            className: "pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 hidden dark:block z-0",
            style: {
              background: useMotionTemplate`
                radial-gradient(
                  120px circle at ${mouseX}px ${mouseY}px,
                  ${glowColorDark},
                  transparent 80%
                )
              `
            }
          }
        )
      ] });
    };
    const isRoundedFull = size === "lg" || className?.includes("rounded-full");
    const radiusClass = isRoundedFull ? "rounded-full" : "rounded-md";
    if (asChild) {
      return /* @__PURE__ */ jsxs(
        motion.div,
        {
          onMouseMove: handleMouseMove,
          transition: { type: "spring", stiffness: 400, damping: 25 },
          className: cn("inline-block group relative overflow-hidden", radiusClass),
          children: [
            /* @__PURE__ */ jsx(
              Slot,
              {
                className: cn(buttonVariants({ variant, size, className })),
                ref,
                ...props,
                children
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 pointer-events-none mix-blend-plus-lighter rounded-[inherit]", children: showGlow && renderGlow() })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsxs(
      motion.button,
      {
        onMouseMove: handleMouseMove,
        transition: { type: "spring", stiffness: 400, damping: 25 },
        className: cn("group relative", buttonVariants({ variant, size, className })),
        ref,
        ...props,
        children: [
          showGlow && renderGlow(),
          /* @__PURE__ */ jsx("span", { className: "relative z-10 flex items-center gap-2", children })
        ]
      }
    );
  }
);
Button.displayName = "Button";
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsx(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tfoot",
    {
      "data-slot": "table-footer",
      className: cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      ),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  );
}
function TableCaption({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "caption",
    {
      "data-slot": "table-caption",
      className: cn("mt-4 text-sm text-muted-foreground", className),
      ...props
    }
  );
}
function Accordion({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    Accordion$1.Root,
    {
      "data-slot": "accordion",
      className: cn("flex w-full flex-col", className),
      ...props
    }
  );
}
function AccordionItem({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    Accordion$1.Item,
    {
      "data-slot": "accordion-item",
      className: cn("not-last:border-b group", className),
      ...props
    }
  );
}
function AccordionTrigger({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(Accordion$1.Header, { className: "flex", children: /* @__PURE__ */ jsxs(
    Accordion$1.Trigger,
    {
      "data-slot": "accordion-trigger",
      className: cn(
        "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(
          ChevronDownIcon,
          {
            "data-slot": "accordion-trigger-icon",
            className: "ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] group-aria-expanded/accordion-trigger:rotate-180"
          }
        )
      ]
    }
  ) });
}
function AccordionContent({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Accordion$1.Panel,
    {
      "data-slot": "accordion-content",
      className: "accordion-panel overflow-hidden",
      ...props,
      children: /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "pt-0 pb-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
            className
          ),
          children
        }
      )
    }
  );
}
var LANG_BADGES = {
  javascript: "JS",
  typescript: "TS",
  jsx: "JSX",
  tsx: "TSX",
  bash: "SH",
  json: "JSON",
  html: "HTML",
  css: "CSS",
  python: "PY"
};
function CodeBlockClient({ rawCode, html, language = "javascript" }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const badgeText = LANG_BADGES[language] || language.toUpperCase().substring(0, 4);
  const lines = rawCode.split("\n");
  let filename = "";
  if (lines[0] && lines[0].startsWith("// ") && lines[0].includes(".")) {
    filename = lines[0].replace("// ", "").trim();
  } else if (lines[0] && lines[0].startsWith("# ") && lines[0].includes(".")) {
    filename = lines[0].replace("# ", "").trim();
  }
  return /* @__PURE__ */ jsxs("div", { className: "group relative my-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111113] overflow-hidden text-sm shadow-sm dark:shadow-xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#18181b]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex items-center justify-center bg-white dark:bg-white/10 text-slate-700 dark:text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] border border-slate-200 dark:border-transparent min-w-[24px] tracking-wider", children: badgeText }),
        filename && /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-zinc-400 text-[13px] font-mono tracking-tight", children: filename })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onCopy,
          className: "flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5",
          title: "Copy code",
          children: copied ? /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" }) : /* @__PURE__ */ jsx(Copy, { className: "w-3.5 h-3.5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "relative overflow-auto max-h-[32rem] text-sm code-block-wrapper custom-scrollbar [&>pre]:!bg-transparent [&>pre]:!m-0",
        dangerouslySetInnerHTML: { __html: html }
      }
    )
  ] });
}
function getMimeType(file) {
  if (file.mimeType) return file.mimeType;
  if (typeof file.src !== "string") return file.src.type || "";
  let nameStr = file.name || "";
  if (!nameStr.includes(".")) {
    nameStr = file.src.split("?")[0] || "";
  }
  const ext = nameStr.split(".").pop()?.toLowerCase() || "";
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
  return map[ext] || "application/octet-stream";
}
function isImage(mime) {
  return mime.startsWith("image/");
}
function isPDF(mime) {
  return mime === "application/pdf";
}
function isText(mime) {
  return mime.startsWith("text/") && mime !== "text/csv";
}
function isOfficeDoc(mime) {
  return [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ].includes(mime);
}
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function FilePreviewModal({ file, onClose, onDelete }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [textContent, setTextContent] = useState(null);
  const mime = file ? getMimeType(file) : "";
  const srcUrl = typeof file?.src === "string" ? file.src : objectUrl;
  useEffect(() => {
    if (!file || typeof file.src === "string") {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file.src);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!file || !isText(mime)) {
      setTextContent(null);
      return;
    }
    if (typeof file.src !== "string") {
      file.src.text().then(setTextContent);
    } else {
      fetch(file.src).then((r) => r.text()).then(setTextContent).catch(() => setTextContent(null));
    }
  }, [file, mime]);
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [file]);
  const handleKey = useCallback((e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 3));
    if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.25));
  }, [onClose]);
  useEffect(() => {
    if (!file) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [file, handleKey]);
  const handleDownload = () => {
    if (!srcUrl && !file) return;
    const a = document.createElement("a");
    a.href = srcUrl || "";
    a.download = file?.name || "download";
    a.click();
  };
  if (!file) return null;
  return /* @__PURE__ */ jsx(AnimatePresence, { children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.15 },
      className: "fixed inset-0 z-[200] flex flex-col bg-white/95 dark:bg-black backdrop-blur-md",
      onClick: onClose,
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "relative z-10 flex items-center justify-between px-5 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 shrink-0",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                isImage(mime) ? /* @__PURE__ */ jsx(FileImage, { className: "w-5 h-5 text-emerald-400 shrink-0" }) : isPDF(mime) ? /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-red-400 shrink-0" }) : /* @__PURE__ */ jsx(File, { className: "w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0" }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[300px]", children: file.name }),
                  typeof file.src !== "string" && /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-500 dark:text-zinc-400", children: formatSize(file.src.size) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                isImage(mime) && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setZoom((z) => Math.max(z - 0.25, 0.25)),
                      title: "Zoom out",
                      className: "w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors",
                      children: /* @__PURE__ */ jsx(ZoomOut, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs text-zinc-600 dark:text-zinc-400 w-10 text-center", children: [
                    Math.round(zoom * 100),
                    "%"
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setZoom((z) => Math.min(z + 0.25, 3)),
                      title: "Zoom in",
                      className: "w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors",
                      children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setRotation((r) => (r + 90) % 360),
                      title: "Rotate",
                      className: "w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors",
                      children: /* @__PURE__ */ jsx(RotateCw, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-1" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleDownload,
                    title: "Download",
                    className: "w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white transition-colors",
                    children: /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" })
                  }
                ),
                onDelete && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      onDelete();
                    },
                    title: "Delete file",
                    className: "w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-red-600 hover:text-white transition-colors",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: onClose,
                    title: "Close (Esc)",
                    className: "w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors",
                    children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex-1 flex items-center justify-center overflow-auto p-4",
            onClick: (e) => e.stopPropagation(),
            children: [
              isImage(mime) && srcUrl && /* @__PURE__ */ jsx(
                motion.div,
                {
                  initial: { scale: 0.95, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: { duration: 0.2 },
                  className: "flex items-center justify-center",
                  children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: srcUrl,
                      alt: file.name,
                      draggable: false,
                      style: {
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: "transform 0.2s ease",
                        maxWidth: "90vw",
                        maxHeight: "80vh",
                        objectFit: "contain",
                        borderRadius: 8
                      }
                    }
                  )
                }
              ),
              isPDF(mime) && srcUrl && /* @__PURE__ */ jsx(
                "iframe",
                {
                  src: srcUrl,
                  title: file.name,
                  className: "w-full max-w-4xl h-[80vh] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white"
                }
              ),
              isOfficeDoc(mime) && srcUrl && !srcUrl.startsWith("blob:") && /* @__PURE__ */ jsx("div", { className: "w-full max-w-5xl h-[85vh] bg-white rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col", children: /* @__PURE__ */ jsx(
                "iframe",
                {
                  src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(srcUrl)}`,
                  title: file.name,
                  className: "w-full flex-1 border-0"
                }
              ) }),
              isText(mime) && textContent !== null && /* @__PURE__ */ jsx("div", { className: "w-full max-w-3xl max-h-[80vh] overflow-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 shadow-sm", children: /* @__PURE__ */ jsx("pre", { className: "text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono leading-relaxed", children: textContent }) }),
              !isImage(mime) && !isPDF(mime) && !isText(mime) && !(isOfficeDoc(mime) && srcUrl && !srcUrl.startsWith("blob:")) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-5 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center", children: /* @__PURE__ */ jsx(File, { className: "w-10 h-10 text-zinc-500 dark:text-zinc-400" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-zinc-900 dark:text-white font-semibold text-lg mb-1", children: file.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-zinc-500 dark:text-zinc-400 text-sm", children: "This file type cannot be previewed directly." })
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleDownload,
                    className: "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
                      "Download file"
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "shrink-0 text-center py-2 text-[10px] text-zinc-500 dark:text-zinc-600 select-none", children: isImage(mime) ? "Scroll to zoom \xB7 + / \u2212 keys \xB7 Esc to close" : "Esc to close" })
      ]
    },
    "file-preview-backdrop"
  ) });
}
function DocsImageViewer({ images, renderThumbnails, defaultOpenIndex, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const thumbnailRectRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    if (defaultOpenIndex !== void 0 && images[defaultOpenIndex]) {
      setSelectedImage(images[defaultOpenIndex]);
    }
  }, [defaultOpenIndex, images]);
  const openImage = useCallback((img, event) => {
    if (event?.currentTarget) {
      thumbnailRectRef.current = event.currentTarget.getBoundingClientRect();
    }
    setSelectedImage(img);
  }, []);
  const closeImage = useCallback(() => {
    setSelectedImage(null);
    setZoom(1);
    onClose?.();
  }, [onClose]);
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedImage]);
  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, closeImage]);
  useEffect(() => {
    if (!selectedImage) return;
    const handleWheel = (e) => {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        return Math.min(Math.max(0.5, prev + delta), 4);
      });
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [selectedImage]);
  const getOriginOffset = useCallback(() => {
    const rect = thumbnailRectRef.current;
    if (!rect || typeof window === "undefined") return { x: 0, y: 0 };
    return {
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    renderThumbnails(images, openImage),
    typeof document !== "undefined" && createPortal(
      /* @__PURE__ */ jsx(AnimatePresence, { children: selectedImage && (() => {
        const origin = getOriginOffset();
        return /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
            className: "fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-sm cursor-zoom-out",
            onClick: closeImage,
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "absolute top-4 right-4 z-[10000] p-2.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black/60 dark:text-white/60 transition-all cursor-pointer",
                  onClick: (e) => {
                    e.stopPropagation();
                    closeImage();
                  },
                  "aria-label": "Close viewer",
                  children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "w-full h-full flex items-center justify-center p-6 sm:p-12",
                  onClick: (e) => {
                    e.stopPropagation();
                    closeImage();
                  },
                  children: /* @__PURE__ */ jsx(
                    motion.img,
                    {
                      src: selectedImage.src,
                      alt: selectedImage.alt,
                      className: "block max-w-full max-h-full w-auto object-contain rounded-lg shadow-2xl cursor-zoom-in",
                      style: { touchAction: "pinch-zoom", transform: `scale(${zoom})`, transition: "transform 0.15s ease-out" },
                      initial: {
                        opacity: 0,
                        scale: 0.12,
                        x: origin.x,
                        y: origin.y
                      },
                      animate: {
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        y: 0
                      },
                      exit: {
                        opacity: 0,
                        scale: 0.12,
                        x: origin.x,
                        y: origin.y
                      },
                      transition: {
                        duration: 0.28,
                        ease: [0.4, 0, 0.2, 1]
                      },
                      onClick: (e) => e.stopPropagation()
                    },
                    selectedImage.id
                  )
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] text-black/25 dark:text-white/25 text-[10px] tracking-wide select-none pointer-events-none", children: "Click or press Esc to close" })
            ]
          },
          "docs-lightbox-backdrop"
        );
      })() }),
      document.body
    )
  ] });
}
function ScrollSpyTOC({ tocItems, activeSection }) {
  return /* @__PURE__ */ jsx("div", { className: "hidden xl:block absolute right-4 top-24 bottom-24 w-[280px] z-40 pointer-events-none hide-when-ask-ai-open", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-end w-full pr-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "group relative inline-flex items-center gap-2 mb-4 text-[13px] font-semibold text-slate-900 dark:text-muted-foreground cursor-pointer p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors", children: [
      /* @__PURE__ */ jsx(List, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-full right-0 mt-2 w-56 max-h-[300px] overflow-y-auto overscroll-contain rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999] p-2 text-left", children: tocItems.map((item) => /* @__PURE__ */ jsx("a", { href: `#${item.id}`, className: cn(
        "block px-2 py-1.5 text-[13px] rounded hover:bg-slate-100 dark:hover:bg-white/5",
        activeSection === item.id ? "text-emerald-500 font-medium" : "text-muted-foreground"
      ), children: item.label }, `dropdown-${item.id}`)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 items-end w-full max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", children: tocItems.map((item) => {
      const isActive = activeSection === item.id;
      return /* @__PURE__ */ jsxs(
        "a",
        {
          href: `#${item.id}`,
          className: "group relative flex justify-end items-center h-2 w-full",
          "aria-label": `Scroll to ${item.label}`,
          "aria-current": isActive ? "true" : void 0,
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "h-[1px] transition-all duration-300 ease-in-out",
                  isActive ? "w-10 bg-emerald-600 dark:bg-emerald-400" : "w-5 bg-slate-500 dark:bg-white/40 group-hover:w-7 group-hover:bg-slate-700 dark:group-hover:bg-white/60"
                )
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "absolute right-12 px-2 py-1 bg-slate-800 dark:bg-white text-white dark:text-black text-[11px] font-medium rounded opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-lg z-[999]", children: item.label })
          ]
        },
        `tick-${item.id}`
      );
    }) })
  ] }) });
}
function useSession() {
  return { data: null };
}
function usePostHog() {
  return { capture: () => {
  } };
}
async function getPresignedUrlForAskAiFile(_name, _type, _size) {
  return { uploadUrl: "mock", publicUrl: "mock" };
}
async function checkAiUploadRateLimit(_count) {
  return { allowed: true };
}
async function recordAiFilesSent(_count) {
}
var SUGGESTED_QUESTIONS = [
  "What is Classgrid?",
  "How can my school use Classgrid?",
  "Does Classgrid provide websites?",
  "How do I get started?"
];
function suggestedQuestionsForPage(pageContext) {
  const path = pageContext?.path || "";
  if (path === "/pricing") {
    return [
      "How does Classgrid pricing work?",
      "Which modules are included?",
      "How do I get a quote?",
      "Is pricing fixed or custom?"
    ];
  }
  if (path.startsWith("/product/modules")) {
    return [
      "What does this module do?",
      "Who uses this module?",
      "How does this module help admins?",
      "How do I see a demo?"
    ];
  }
  if (path.startsWith("/support") || path.startsWith("/help-center")) {
    return [
      "How do I raise a support ticket?",
      "What is Classgrid Talk vs support tickets?",
      "I'm from an institution \u2014 how do I get help?",
      "Can I track my ticket status?"
    ];
  }
  if (path.startsWith("/terms") || path.startsWith("/privacy") || path.startsWith("/cookies") || path.startsWith("/acceptable-use")) {
    return [
      "Summarize this policy",
      "What data does Classgrid handle?",
      "What should institutions know?",
      "Who do I contact for policy questions?"
    ];
  }
  if (path.includes("contact") || path.includes("demo")) {
    return [
      "What happens after I submit this form?",
      "How do I book a demo?",
      "Who should contact sales?",
      "What details should I include?"
    ];
  }
  return SUGGESTED_QUESTIONS;
}
var panelTransition = {
  duration: 0.36,
  ease: [0.22, 1, 0.36, 1]
};
var SECTION_ICON_RULES = [
  { match: /admission|enroll/i, icon: FileText },
  { match: /attendance/i, icon: BarChart3 },
  { match: /exam|result|quiz/i, icon: ClipboardList },
  { match: /fee|payment|billing/i, icon: CreditCard },
  { match: /communicat|chat|notice/i, icon: MessageCircleMore },
  { match: /website|domain|tenant/i, icon: Globe2 },
  { match: /dashboard|analytics|report/i, icon: LayoutDashboard },
  { match: /school|college|institute|coaching/i, icon: School },
  { match: /classgrid/i, icon: Sparkles },
  { match: /competitor|vs|comparison/i, icon: Globe2 }
];
function sanitizeAssistantText(text) {
  const normalized = text.replace(/\r/g, "");
  const cleanedLines = normalized.split("\n").map((line) => {
    let cleaned = line.replace(/__(.*?)__/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/^#{1,6}\s*/g, "").replace(/^>\s*/g, "");
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, "%%BOLD_START%%$1%%BOLD_END%%");
    cleaned = cleaned.replace(/\*/g, "");
    cleaned = cleaned.replace(/%%BOLD_START%%/g, "**").replace(/%%BOLD_END%%/g, "**");
    return cleaned.replace(/\s+$/g, "");
  });
  return cleanedLines.join("\n").replace(/^-{3,}$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}
function splitLongParagraph(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= 170) return [trimmed];
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) return [trimmed];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (`${current} ${sentence}`.trim().length <= 170) {
      current = `${current} ${sentence}`.trim();
    } else {
      if (current) chunks.push(current);
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
function extractInlineNumberedItems(text) {
  const matches = [...text.matchAll(/(\d+)\.\s+(.+?)(?=(?:\s+\d+\.\s)|$)/g)];
  if (matches.length < 2) return null;
  return matches.map((match) => ({
    indexLabel: `${match[1]}.`,
    text: match[2].trim()
  }));
}
function parseListBlock(block) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const inlineItems = lines.length === 1 ? extractInlineNumberedItems(lines[0]) : null;
  if (inlineItems) return inlineItems;
  const rows = [];
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
function isLikelyHeading(title) {
  const trimmed = title.trim().replace(/:$/, "");
  if (!trimmed) return false;
  if (trimmed.startsWith("|")) return false;
  if (SECTION_ICON_RULES.some((rule) => rule.match.test(trimmed))) return true;
  return /^[A-Za-z][A-Za-z\s/&-]{2,50}$/.test(trimmed) && trimmed.split(/\s+/).length <= 6;
}
function parseSectionBlock(block) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const firstLine = lines[0];
  const headingWithBody = firstLine.match(/^([^:]{2,60}):\s+(.+)$/);
  if (headingWithBody && isLikelyHeading(headingWithBody[1])) {
    const paragraphs = splitLongParagraph(headingWithBody[2]);
    return {
      type: "section",
      title: headingWithBody[1].trim(),
      paragraphs
    };
  }
  if (isLikelyHeading(firstLine) && lines.length > 1) {
    const bodyLines = lines.slice(1);
    const bodyText = bodyLines.join("\n");
    const listItems = parseListBlock(bodyText);
    if (listItems) {
      return {
        type: "section",
        title: firstLine.replace(/:$/, "").trim(),
        paragraphs: [],
        items: listItems
      };
    }
    const body = bodyLines.join(" ");
    return {
      type: "section",
      title: firstLine.replace(/:$/, "").trim(),
      paragraphs: splitLongParagraph(body)
    };
  }
  return null;
}
function parseTableBlock(block) {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;
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
  const extractCells = (line) => {
    const parts = line.split("|");
    if (parts.length > 0 && parts[0].trim() === "") parts.shift();
    if (parts.length > 0 && parts[parts.length - 1].trim() === "") parts.pop();
    return parts.map((c) => c.trim());
  };
  const headers = extractCells(lines[headerIndex]);
  if (headers.length === 0) return null;
  const rows = lines.slice(headerIndex + 2).map(extractCells).filter((r) => r.length > 0);
  if (rows.length === 0) return null;
  return { type: "table", headers, rows };
}
function buildStructuredBlocks(text) {
  const blocks = [];
  const parts = text.split(/(```[\s\S]*?(?:```|$))/g);
  for (const part of parts) {
    if (part.startsWith("```")) {
      const match = part.match(/^```([\w-]*)\n([\s\S]*?)(?:```|$)/);
      if (match) {
        blocks.push({
          type: "code",
          language: match[1].trim(),
          code: match[2]
        });
      } else {
        blocks.push({
          type: "code",
          language: "",
          code: part.replace(/```/g, "").trim()
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
function getSectionIcon(title) {
  const match = SECTION_ICON_RULES.find((rule) => rule.match.test(title));
  return match?.icon ?? ChevronRight;
}
function TypingDots({ reducedMotion }) {
  const dotClass = "h-1.5 w-1.5 rounded-full bg-muted-foreground";
  if (reducedMotion) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsx("span", { className: dotClass }),
      /* @__PURE__ */ jsx("span", { className: dotClass }),
      /* @__PURE__ */ jsx("span", { className: dotClass })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: [0, 1, 2].map((index) => /* @__PURE__ */ jsx(
    motion.span,
    {
      className: dotClass,
      animate: { opacity: [0.25, 1, 0.25], y: [0, -2, 0] },
      transition: { duration: 0.9, repeat: Infinity, delay: index * 0.14 }
    },
    index
  )) });
}
function SearchingSpinner({ reducedMotion }) {
  if (reducedMotion) {
    return /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 text-emerald-400" });
  }
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      animate: { rotate: 360 },
      transition: { duration: 1.8, repeat: Infinity, ease: "linear" },
      children: /* @__PURE__ */ jsx(Globe2, { className: "h-3.5 w-3.5 text-emerald-400" })
    }
  );
}
function isSafeAssistantHref(href) {
  return href.startsWith("/") || href.startsWith("#") || /^https?:\/\//i.test(href);
}
function renderInlineText(rawText) {
  const text = rawText.replace(/\*\*(\[[^\]]+\]\s*\((?:https?:\/\/|\/|#)[^\s)]*\))\*\*/g, "$1");
  const pattern = /(\[([^\]]+)\]\s*\(((?:https?:\/\/|\/|#)[^\s)]*)\)|\*\*([^*]+)\*\*)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(/* @__PURE__ */ jsx("span", { children: text.slice(lastIndex, match.index) }, `text-${lastIndex}`));
    }
    const fullMatch = match[0];
    const label = match[2];
    const href = match[3];
    const boldText = match[4];
    if (label && href && isSafeAssistantHref(href)) {
      const external = /^https?:\/\//i.test(href);
      const cleanLabel = label.replace(/\*\*/g, "");
      nodes.push(
        /* @__PURE__ */ jsx(
          "a",
          {
            href,
            target: external ? "_blank" : void 0,
            rel: external ? "noreferrer" : void 0,
            className: "font-semibold text-emerald-600 underline underline-offset-4 transition-colors hover:text-emerald-500 dark:text-emerald-400",
            children: cleanLabel
          },
          `link-${match.index}`
        )
      );
    } else if (boldText) {
      nodes.push(
        /* @__PURE__ */ jsx("strong", { className: "font-semibold text-emerald-600 dark:text-emerald-400", children: boldText }, `bold-${match.index}`)
      );
    } else {
      nodes.push(/* @__PURE__ */ jsx("span", { children: fullMatch }, `raw-${match.index}`));
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(/* @__PURE__ */ jsx("span", { children: text.slice(lastIndex) }, `text-${lastIndex}`));
  }
  return nodes;
}
function MessageActions({ content, messageId }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
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
    } catch (e) {
    }
  }, [messageId]);
  async function handleCopy() {
    try {
      const plainText = content.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch (_) {
    }
  }
  function handleFeedback(type) {
    const newFeedback = type === feedback ? null : type;
    setFeedback(newFeedback);
    try {
      if (newFeedback) {
        localStorage.setItem(`classgrid:ai-feedback:${messageId}`, JSON.stringify({ feedback: newFeedback }));
      } else {
        localStorage.removeItem(`classgrid:ai-feedback:${messageId}`);
      }
    } catch (e) {
    }
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
  return /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-1", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: handleCopy,
        className: cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
          copied ? "bg-emerald-500/15 text-emerald-500" : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        ),
        title: copied ? "Copied!" : "Copy response",
        children: copied ? /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => handleFeedback("up"),
        className: cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
          feedback === "up" ? "bg-emerald-500/15 text-emerald-500" : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        ),
        title: "Helpful",
        children: /* @__PURE__ */ jsx(ThumbsUp, { className: "h-3.5 w-3.5" })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => handleFeedback("down"),
        className: cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
          feedback === "down" ? "bg-red-500/15 text-red-400" : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        ),
        title: "Not helpful",
        children: /* @__PURE__ */ jsx(ThumbsDown, { className: "h-3.5 w-3.5" })
      }
    )
  ] });
}
var AssistantMessageContent = memo(({ content, isTyping }) => {
  const blocks = useMemo(() => buildStructuredBlocks(content), [content]);
  return /* @__PURE__ */ jsx("div", { className: "space-y-3 text-sm leading-relaxed overflow-hidden break-words", children: blocks.map((block, index) => {
    if (block.type === "paragraph") {
      return /* @__PURE__ */ jsx("p", { className: "text-slate-900 dark:text-white whitespace-pre-wrap", children: renderInlineText(block.text) }, `p-${index}`);
    }
    if (block.type === "list") {
      return /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: block.items.map((item, itemIndex) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2 text-slate-800 dark:text-slate-200", children: [
        /* @__PURE__ */ jsx("span", { className: "min-w-5 font-medium text-emerald-600 dark:text-emerald-400", children: item.indexLabel ?? "\u2022" }),
        /* @__PURE__ */ jsx("span", { children: renderInlineText(item.text) })
      ] }, `li-${index}-${itemIndex}`)) }, `l-${index}`);
    }
    if (block.type === "table") {
      return /* @__PURE__ */ jsx("div", { className: "w-full pb-2", children: /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsx(TableRow, { children: block.headers.map((h, i) => /* @__PURE__ */ jsx(TableHead, { className: "font-semibold text-slate-900 dark:text-white", children: renderInlineText(h) }, i)) }) }),
        /* @__PURE__ */ jsx(TableBody, { children: block.rows.map((row, rIndex) => /* @__PURE__ */ jsx(TableRow, { children: row.map((cell, cIndex) => /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground", children: renderInlineText(cell) }, cIndex)) }, rIndex)) })
      ] }) }) }, `t-${index}`);
    }
    if (block.type === "code") {
      let highlighted = block.code;
      if (!isTyping) {
        try {
          if (block.language && hljs.getLanguage(block.language)) {
            highlighted = hljs.highlight(block.code, { language: block.language }).value;
          } else {
            highlighted = hljs.highlightAuto(block.code).value;
          }
        } catch (e) {
          highlighted = block.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
      } else {
        highlighted = block.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      const finalHtml = `<pre class="text-[13px] py-4 px-4 !m-0 flex flex-col"><code class="font-mono hljs">${highlighted}</code></pre>`;
      return /* @__PURE__ */ jsx("div", { className: "w-full pb-2 overflow-hidden", children: /* @__PURE__ */ jsx(CodeBlockClient, { rawCode: block.code, html: finalHtml, language: block.language }) }, `c-${index}`);
    }
    const Icon = getSectionIcon(block.title);
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-emerald-400" }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-slate-900 dark:text-white", children: block.title.replace(/\*\*/g, "") })
      ] }),
      block.items && block.items.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: block.items.map((item, itemIndex) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2 text-slate-900 dark:text-white", children: [
        /* @__PURE__ */ jsx("span", { className: "min-w-5 font-medium text-emerald-400", children: item.indexLabel ?? "\u2022" }),
        /* @__PURE__ */ jsx("span", { children: renderInlineText(item.text) })
      ] }, `sli-${index}-${itemIndex}`)) }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: block.paragraphs.map((paragraph, paragraphIndex) => /* @__PURE__ */ jsx("p", { className: "text-slate-900 dark:text-white whitespace-pre-wrap", children: renderInlineText(paragraph) }, `sp-${index}-${paragraphIndex}`)) })
    ] }, `s-${index}`);
  }) });
});
function AskAiPanel({ open, onOpenChange, pageContext, variant = "in-flow", initialMessages, autoFocus = true }) {
  const { data: session } = useSession();
  const prefersReducedMotion = useReducedMotion();
  const [messages, setMessages] = useState(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const tocItems = useMemo(() => {
    return messages.filter((m) => m.role === "user" && m.content).map((m) => {
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
    if (!activeSection) {
      setActiveSection(tocItems[tocItems.length - 1].id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSection(intersecting[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px" }
      // Triggers when element is in top 30% of screen
    );
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
  const [sessionId, setSessionId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [lastSentDocsPath, setLastSentDocsPath] = useState(null);
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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    try {
      const savedInput = localStorage.getItem("askAiDraftInput");
      if (savedInput) setInput(savedInput);
      const savedFilesStr = localStorage.getItem("askAiDraftFiles");
      if (savedFilesStr) {
        const savedFiles = JSON.parse(savedFilesStr);
        const validRestoredFiles = savedFiles.filter((f) => f.status === "done" && f.url);
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
      const filesToSave = attachedFiles.filter((f) => f.status === "done" && f.url).map((f) => ({
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
  const MAX_FILE_SIZE = 35 * 1024 * 1024;
  const ACCEPTED_FILE_TYPES = "image/*,.pdf,.md,.txt,.csv,.doc,.docx,.xlsx,.pptx";
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  function getFileIcon(mimeType) {
    if (mimeType.startsWith("image/")) return FileImage;
    if (mimeType === "application/pdf") return FileText;
    return File;
  }
  const processFiles = useCallback(async (files) => {
    const newFiles = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      status: "uploading"
    }));
    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" is too large (${formatFileSize(f.size)}).`, { description: "Limit: 6 files \xB7 35MB each" });
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
    setAttachedFiles((prev) => [...prev, ...accepted]);
    if (droppedWarning) {
      toast.error("You can attach up to 6 files per message.");
    }
    try {
      const preCheck = await checkAiUploadRateLimit(accepted.length);
      if (preCheck.error) {
        toast.error(preCheck.error);
        const acceptedIds = accepted.map((f) => f.id);
        setAttachedFiles((prev) => prev.filter((f) => !acceptedIds.includes(f.id)));
        return;
      }
    } catch (err) {
      console.error("Pre-flight rate limit check failed:", err);
    }
    let rateLimitToastShown = false;
    for (const newFile of accepted) {
      try {
        const result = await getPresignedUrlForAskAiFile(newFile.name, newFile.type, newFile.size);
        if ("error" in result) {
          if (!rateLimitToastShown) {
            toast.error(result.error);
            rateLimitToastShown = true;
          }
          if (result.error.includes("maximum limit")) {
            const remainingIds = accepted.slice(accepted.indexOf(newFile)).map((f) => f.id);
            setAttachedFiles((prev) => prev.filter((f) => !remainingIds.includes(f.id)));
            break;
          } else {
            setAttachedFiles((prev) => prev.map((f) => f.id === newFile.id ? { ...f, status: "error" } : f));
          }
          continue;
        }
        if (!newFile.file) throw new Error("Missing file blob for upload");
        if (result.uploadUrl === "mock") {
          await new Promise((resolve) => setTimeout(resolve, 2e3));
        } else {
          await fetch(result.uploadUrl, {
            method: "PUT",
            body: newFile.file,
            headers: { "Content-Type": newFile.type }
          });
        }
        const finalUrl = result.publicUrl === "mock" ? URL.createObjectURL(newFile.file) : result.publicUrl;
        setAttachedFiles((prev) => prev.map((f) => f.id === newFile.id ? { ...f, status: "done", url: finalUrl } : f));
      } catch (err) {
        console.error(`Failed to upload ${newFile.name}:`, err);
        if (!rateLimitToastShown) {
          toast.error(`Failed to upload "${newFile.name}".`);
        }
        setAttachedFiles((prev) => prev.map((f) => f.id === newFile.id ? { ...f, status: "error" } : f));
      }
    }
  }, [attachedFiles.length]);
  const handleFileSelect = useCallback(async (e) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(Array.from(files));
    e.target.value = "";
  }, [processFiles]);
  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      await processFiles(pastedFiles);
    }
  }, [processFiles]);
  const removeAttachedFile = useCallback((id) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("classgrid_ai_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m) => ({ ...m, typing: false })));
      }
      const savedSessionId = localStorage.getItem("classgrid_ai_session_id");
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } catch (_) {
    }
  }, []);
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
  const [pageHistory, setPageHistory] = useState([]);
  useEffect(() => {
    if (!pageContext?.path) return;
    try {
      const savedHistory = localStorage.getItem("classgrid_page_history");
      let history = savedHistory ? JSON.parse(savedHistory) : [];
      const newEntry = {
        path: pageContext.path,
        title: pageContext.title || document.title
      };
      if (history.length === 0 || history[history.length - 1].path !== newEntry.path) {
        history = [...history, newEntry].slice(-8);
        localStorage.setItem("classgrid_page_history", JSON.stringify(history));
      }
      setPageHistory(history);
    } catch (_) {
    }
  }, [pageContext?.path, pageContext?.title]);
  const [bannedUntil, setBannedUntil] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [userContext, setUserContext] = useState(null);
  useEffect(() => {
  }, [session]);
  const abortControllerRef = useRef(null);
  const isGenerating = submitting || thinking || messages[messages.length - 1]?.typing === true;
  useEffect(() => {
    if (!bannedUntil) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const now = Date.now();
      const diff = bannedUntil.getTime() - now;
      if (diff <= 0) {
        setIsTerminated(false);
        setBannedUntil(null);
        setCountdown("");
        return;
      }
      const mins = Math.floor(diff / 6e4);
      const secs = Math.floor(diff % 6e4 / 1e3);
      setCountdown(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    };
    tick();
    const interval = setInterval(tick, 1e3);
    return () => clearInterval(interval);
  }, [bannedUntil]);
  useEffect(() => {
    async function checkBanStatus() {
      try {
        const endpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT || "/api/ask-ai";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "__ban_check__" })
        });
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          setIsTerminated(true);
          if (data?.bannedUntil) {
            setBannedUntil(new Date(data.bannedUntil));
          }
        }
      } catch (_) {
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    typingRunRef.current++;
    setThinking(false);
    setSubmitting(false);
    setMessages((current) => {
      const last = current[current.length - 1];
      if (last?.role === "assistant" && last.typing) {
        return current.map((m) => m.id === last.id ? { ...m, typing: false } : m);
      }
      return current;
    });
  }
  async function handleCopyAll() {
    if (messages.length === 0) return;
    try {
      const text = messages.map((m) => `${m.role === "user" ? "You" : "Classgrid AI"}:
${m.content}`).join("\n\n---\n\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2e3);
    } catch (_) {
    }
  }
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const typingRunRef = useRef(0);
  const inputRef = useRef(null);
  const chatScrollRef = useRef(null);
  const hasDocsContext = pageContext?.path?.startsWith("/docs") && pageContext.path !== lastSentDocsPath;
  const isAnyFileUploading = attachedFiles.some((f) => f.status === "uploading");
  const canSubmit = (input.trim().length > 0 || hasDocsContext || attachedFiles.length > 0) && !submitting && !isAnyFileUploading;
  const emptyState = useMemo(() => messages.length === 0, [messages.length]);
  const suggestedQuestions = useMemo(() => suggestedQuestionsForPage(pageContext), [pageContext]);
  useEffect(() => {
    const onEscape = (event) => {
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
  useEffect(() => {
    const element = chatScrollRef.current;
    if (!element) return;
    const handleScroll = () => {
      if (isAutoScrollingRef.current) return;
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      const isScrolledUp = distanceFromBottom > 80;
      userScrolledUpRef.current = isScrolledUp;
      setShowScrollButton(isScrolledUp);
    };
    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const element = chatScrollRef.current;
    if (!element) return;
    const currentCount = messages.length;
    const isNewMessage = currentCount > prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;
    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.role === "user";
    if (userScrolledUpRef.current && !isUserMessage && !thinking) return;
    if (!isNewMessage && !thinking) return;
    if (isUserMessage) {
      userScrolledUpRef.current = false;
    }
    isAutoScrollingRef.current = true;
    requestAnimationFrame(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 200);
    });
  }, [messages.length, thinking, open]);
  useEffect(() => {
    if (!open) return;
    const element = chatScrollRef.current;
    if (!element) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.typing) return;
    const interval = setInterval(() => {
      if (userScrolledUpRef.current) return;
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      if (distanceFromBottom > 150) return;
      isAutoScrollingRef.current = true;
      element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 80);
    }, 150);
    return () => clearInterval(interval);
  }, [open, messages.length, messages[messages.length - 1]?.typing]);
  function createMessageId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  function getCharDelay(char) {
    if (prefersReducedMotion) return 0;
    if (/[.!?]/.test(char)) return 30;
    if (/[,;:]/.test(char)) return 20;
    if (char === " ") return 6;
    return 11;
  }
  async function typeAssistantResponse(answer) {
    const runId = ++typingRunRef.current;
    setMessages((current) => {
      const last = current[current.length - 1];
      if (last && last.role === "assistant" && !last.content) {
        return current.map((m) => m.id === last.id ? { ...m, typing: true } : m);
      }
      return [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: "",
          createdAt: Date.now(),
          typing: true
        }
      ];
    });
    for (let index = 1; index <= answer.length; index += 1) {
      if (runId !== typingRunRef.current) return;
      setMessages((current) => {
        const last = current[current.length - 1];
        if (!last || last.role !== "assistant") return current;
        return current.map(
          (message) => message.id === last.id ? { ...message, content: answer.slice(0, index) } : message
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
      return current.map(
        (message) => message.id === last.id ? { ...message, typing: false } : message
      );
    });
  }
  async function askQuestion(question) {
    let displayQuestion = question.trim();
    let apiQuestion = question.trim();
    const isDocsContextActive = pageContext?.path?.startsWith("/docs") && pageContext.path !== lastSentDocsPath;
    const filesToUpload = attachedFiles.filter((f) => f.status === "done" && f.url).map((f) => ({
      name: f.name,
      url: f.url,
      mimeType: f.type,
      size: f.size
    }));
    if (!apiQuestion && !isDocsContextActive && filesToUpload.length === 0) return;
    if (submitting) return;
    if (isDocsContextActive && pageContext?.path && filesToUpload.length === 0) {
      const docsUrl = `https://classgrid.in${pageContext.path}`;
      setLastSentDocsPath(pageContext.path);
      if (!apiQuestion) {
        apiQuestion = `Explain this page: ${pageContext.title || "Documentation"} (${docsUrl})`;
      } else {
        apiQuestion = `${apiQuestion}

*(Context: ${docsUrl})*`;
      }
    }
    if (!displayQuestion && filesToUpload.length > 0) {
      const fileNames = filesToUpload.map((f) => f.name).join(", ");
      displayQuestion = "";
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
    userScrolledUpRef.current = false;
    const uploadedAttachments = filesToUpload;
    if (uploadedAttachments.length > 0) {
      recordAiFilesSent(uploadedAttachments.length).catch(console.error);
    }
    if (uploadedAttachments.length > 0) {
      const fileContextLines = uploadedAttachments.map((a, i) => {
        let cleanName = a.name;
        if (/^whatsapp image/i.test(cleanName)) cleanName = "Uploaded Image";
        else if (/^screenshot/i.test(cleanName)) cleanName = "Screenshot";
        else if (/^img_/i.test(cleanName)) cleanName = "Uploaded Image";
        return `[Attached file: ${cleanName} (${a.mimeType}) \u2014 URL: ${a.url}]`;
      }).join("\n");
      apiQuestion = `${apiQuestion}

${fileContextLines}`;
    }
    const sentContextUrl = isDocsContextActive && pageContext?.path ? `https://classgrid.in${pageContext.path}` : void 0;
    const sentContextTitle = isDocsContextActive && pageContext?.title ? pageContext.title : void 0;
    const userMsgId = createMessageId("user");
    const nextMessages = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: displayQuestion,
        createdAt: Date.now(),
        contextUrl: sentContextUrl,
        contextTitle: sentContextTitle,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : void 0
      }
    ];
    setMessages(nextMessages);
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
        }).then(async (res) => {
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
                  } catch (_) {
                  }
                }
              }
            }
            if (finalAnswer) {
              console.log("updating state with tocSummary:", finalAnswer);
              setMessages((prev) => prev.map((m) => m.id === userMsgId ? { ...m, tocSummary: finalAnswer.trim().replace(/^["']|["']$/g, "") } : m));
            } else {
              console.log("background summary finished but finalAnswer was empty");
            }
          } else {
            console.log("background summary response was not event-stream", contentType);
          }
        }).catch((err) => console.error("background summary fetch failed:", err));
      }, 2e3);
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
          userName: session?.user?.name ?? void 0,
          userEmail: session?.user?.email ?? void 0,
          userContext,
          sessionId: sessionId ?? void 0,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments.map((a) => ({ url: a.url, name: a.name, mimeType: a.mimeType })) : void 0,
          history: messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-10).map((m) => ({ role: m.role, content: m.content })),
          pageContext: {
            ...pageContext,
            pageHistory,
            summary: pageContext?.summary || (typeof window !== "undefined" ? window.classgrid_current_ticket_context : void 0)
          }
        })
      });
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
          typeof payload?.error === "string" && payload.error.trim().length > 0 ? payload.error : "Unable to answer right now. Please try again."
        );
      }
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalPayload = null;
        let streamError = null;
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
                  event.label === "searching" ? "Searching the web" : event.label === "reading page" ? "Reading webpage" : event.label === "reading image" ? "Reading image" : event.label === "reading document" ? "Reading document" : event.label === "analyzing" ? "Analyzing results" : "Thinking"
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
          const answer = typeof finalPayload.answer === "string" && finalPayload.answer.trim().length > 0 ? finalPayload.answer : session?.user?.name ? `Hi ${session.user.name.split(" ")[0]}, I can help you with Classgrid features, pricing, or setup. What would you like to explore?` : "I can help you with Classgrid features, pricing, or setup. What would you like to explore?";
          setThinking(false);
          await wait(prefersReducedMotion ? 0 : 100);
          await typeAssistantResponse(answer);
        } else {
          throw new Error("Unable to answer right now. Please try again.");
        }
      } else {
        const payload = await response.json().catch(() => ({}));
        if (payload?.sessionId) {
          setSessionId(payload.sessionId);
          localStorage.setItem("classgrid_ai_session_id", payload.sessionId);
        }
        const answer = typeof payload?.answer === "string" && payload.answer.trim().length > 0 ? payload.answer : session?.user?.name ? `Hi ${session.user.name.split(" ")[0]}, I can help you with Classgrid features, pricing, or setup. What would you like to explore?` : "I can help you with Classgrid features, pricing, or setup. What would you like to explore?";
        setThinking(false);
        await wait(prefersReducedMotion ? 0 : 100);
        await typeAssistantResponse(answer);
      }
    } catch (error2) {
      if (error2.name === "AbortError" || error2.message?.includes("abort")) {
        setSubmitting(false);
        setThinking(false);
        return;
      }
      const rawMessage = error2 instanceof Error && error2.message.trim().length > 0 ? error2.message : "Unable to answer right now. Please try again.";
      const fallback = wasTerminated || rawMessage.includes("terminated") || rawMessage.includes("restricted") ? `${rawMessage}

If you believe this is a mistake, please contact us at support@classgrid.in.

To understand why this action was taken, please read our [Privacy Policy](/privacy) and [Terms of Service](/terms).` : rawMessage;
      setThinking(false);
      await wait(prefersReducedMotion ? 0 : 100);
      await typeAssistantResponse(fallback);
    } finally {
      setSubmitting(false);
    }
  }
  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    void askQuestion(input);
  }
  const panelHeader = /* @__PURE__ */ jsxs("div", { className: cn("flex items-center justify-between px-4 py-4", variant !== "full-page" && "border-b border-border"), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Bot, { className: "h-4 w-4 text-emerald-500" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: "Ask AI" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      variant !== "full-page" && messages.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground cursor-pointer",
            onClick: handleCopyAll,
            title: "Copy entire chat",
            children: [
              copiedAll ? /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-emerald-500" }) : /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Copy chat" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground cursor-pointer",
            onClick: handleClearChat,
            title: "Clear chat",
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Clear chat" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mx-1 h-4 w-[1px] bg-border" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "flex h-8 w-8 items-center justify-center rounded-md text-foreground cursor-pointer",
          onClick: () => onOpenChange(false),
          children: [
            /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close panel" })
          ]
        }
      )
    ] })
  ] });
  const panelChat = /* @__PURE__ */ jsx("div", { ref: variant !== "full-page" ? chatScrollRef : void 0, className: cn("overscroll-contain [scrollbar-width:thin]", variant === "full-page" ? "w-full" : "flex-1 min-h-0 overflow-y-auto"), children: /* @__PURE__ */ jsx("div", { className: cn("flex flex-col gap-4 px-4 py-4", variant === "full-page" && "max-w-[52rem] mx-auto w-full pb-52"), children: emptyState ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card px-4 py-3", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      null,
      pageContext?.title ? `Ask about ${pageContext.title}, Classgrid features, pricing, demos, or support.` : "Ask anything about Classgrid features, pricing, website capabilities, demo process, or support."
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: suggestedQuestions.map((question) => /* @__PURE__ */ jsxs(
      Button,
      {
        type: "button",
        variant: "outline",
        className: "w-full justify-start rounded-2xl border-border bg-card/40 px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground",
        onClick: () => void askQuestion(question),
        children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "mr-2 h-4 w-4 text-emerald-500" }),
          question
        ]
      },
      question
    )) })
  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    messages.map((message) => {
      const isUser = message.role === "user";
      return /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: prefersReducedMotion ? false : { opacity: 0 },
          animate: { opacity: 1 },
          transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.16 },
          className: cn(
            "flex items-end gap-2 w-full",
            isUser ? "justify-end" : "justify-start"
          ),
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex h-8 w-8 overflow-hidden shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  "hidden"
                ),
                children: isUser ? null : null
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-1.5 min-w-0", isUser ? "order-1 items-end max-w-[75%]" : "order-2 w-full"), children: [
              message.content && /* @__PURE__ */ jsxs(
                "div",
                {
                  id: isUser ? `msg-${message.id}` : void 0,
                  className: cn(
                    "relative min-w-0 transition-all duration-700 msg-target-glow scroll-mt-12",
                    isUser ? "rounded-2xl rounded-br-none px-4 py-2.5 bg-foreground text-background" : "w-full max-w-full bg-transparent text-foreground"
                  ),
                  children: [
                    isUser && /* @__PURE__ */ jsx(
                      "svg",
                      {
                        width: "8",
                        height: "12",
                        viewBox: "0 0 8 12",
                        fill: "currentColor",
                        className: "absolute bottom-0 -right-1.5 text-foreground",
                        children: /* @__PURE__ */ jsx("path", { d: "M0 0V12H8C5 12 2 9 0 0Z" })
                      }
                    ),
                    isUser ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed break-words break-all whitespace-pre-wrap relative z-10", children: message.content }),
                      message.contextUrl && /* @__PURE__ */ jsxs(
                        "a",
                        {
                          href: message.contextUrl,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          className: "mt-1.5 flex items-center gap-1.5 text-[11px] text-sky-300 dark:text-sky-300 hover:text-sky-200 transition-opacity relative z-10",
                          children: [
                            /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3" }),
                            /* @__PURE__ */ jsx("span", { className: "underline underline-offset-2 truncate max-w-[200px]", children: message.contextTitle || message.contextUrl })
                          ]
                        }
                      )
                    ] }) : /* @__PURE__ */ jsxs("div", { className: "pl-1 w-full max-w-full", children: [
                      message.thought && /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "mb-4", children: /* @__PURE__ */ jsxs(AccordionItem, { value: "thought", className: "border-none", children: [
                        /* @__PURE__ */ jsx(AccordionTrigger, { className: "w-fit flex-none justify-start gap-1.5 px-2.5 py-1.5 h-auto text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 hover:no-underline dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 transition-colors [&>svg]:size-3 [&>svg]:ml-0", children: /* @__PURE__ */ jsx("span", { children: "Thought" }) }),
                        /* @__PURE__ */ jsx(AccordionContent, { className: "pt-3 pb-1 px-1", children: /* @__PURE__ */ jsx("div", { className: "border-l-[3px] border-slate-200 dark:border-white/10 pl-3.5 py-0.5 text-[13px] text-slate-500 dark:text-slate-400 font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar", children: message.thought.trim() }) })
                      ] }) }),
                      /* @__PURE__ */ jsx(AssistantMessageContent, { content: message.content, isTyping: message.typing })
                    ] }),
                    !isUser && !message.typing && message.content.length > 0 && /* @__PURE__ */ jsx("div", { className: "pl-1 mt-3", children: /* @__PURE__ */ jsx(MessageActions, { content: message.content, messageId: message.id }) })
                  ]
                }
              ),
              isUser && message.attachments && message.attachments.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 items-end", children: [
                message.attachments.filter((a) => a.mimeType.startsWith("image/")).length > 0 && /* @__PURE__ */ jsx(
                  DocsImageViewer,
                  {
                    images: message.attachments.filter((a) => a.mimeType.startsWith("image/")).map((a, idx) => ({
                      id: `${a.name}-${idx}-${message.id}`,
                      src: a.url,
                      alt: a.name
                    })),
                    renderThumbnails: (images, openImage) => /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 justify-end", children: images.map((img) => /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: (e) => openImage(img, e),
                        title: img.alt,
                        className: cn(
                          "relative group overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:border-emerald-500/50 transition-all shadow-sm cursor-pointer",
                          images.length === 1 && !message.content ? "rounded-2xl rounded-tr-none h-auto w-[180px] sm:w-[220px]" : "rounded-xl h-20 w-20 sm:h-[88px] sm:w-[88px]"
                        ),
                        children: [
                          /* @__PURE__ */ jsx(
                            "img",
                            {
                              src: img.src,
                              alt: img.alt,
                              className: cn("absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105", images.length === 1 && !message.content ? "relative object-contain" : "object-cover")
                            }
                          ),
                          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors" })
                        ]
                      },
                      img.id
                    )) })
                  }
                ),
                message.attachments.filter((a) => !a.mimeType.startsWith("image/")).length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 justify-end", children: message.attachments.filter((a) => !a.mimeType.startsWith("image/")).map((att, i) => {
                  const Icon = getFileIcon(att.mimeType);
                  return /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setPreviewFile({ name: att.name, src: att.url, mimeType: att.mimeType }),
                      title: att.name,
                      className: "relative group overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:border-emerald-500/50 transition-all shadow-sm rounded-xl h-20 w-20 sm:h-[88px] sm:w-[88px]",
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-1 text-foreground/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors", children: [
                          /* @__PURE__ */ jsx(Icon, { className: "h-7 w-7", strokeWidth: 1.5 }),
                          /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase tracking-wider font-bold", children: att.name.split(".").pop()?.substring(0, 4) })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors" })
                      ]
                    },
                    `${att.name}-${i}`
                  );
                }) })
              ] })
            ] })
          ]
        },
        message.id
      );
    }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: thinking ? /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: prefersReducedMotion ? false : { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.2 },
        className: "flex items-end gap-2",
        children: /* @__PURE__ */ jsx("div", { className: "pl-1", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-base text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%] bg-clip-text text-transparent bg-[linear-gradient(110deg,#94a3b8,45%,#0f172a,55%,#94a3b8)] dark:bg-[linear-gradient(110deg,#475569,45%,#ffffff,55%,#475569)]", children: thinkingLabel }),
          thinkingLabel === "Searching the web" || thinkingLabel === "Reading webpage" || thinkingLabel === "Reading image" || thinkingLabel === "Reading document" ? /* @__PURE__ */ jsx(SearchingSpinner, { reducedMotion: Boolean(prefersReducedMotion) }) : /* @__PURE__ */ jsx(TypingDots, { reducedMotion: Boolean(prefersReducedMotion) })
        ] }) })
      },
      "thinking-state"
    ) : null })
  ] }) }) });
  const panelInput = /* @__PURE__ */ jsxs("div", { className: cn(
    "px-4 py-4 relative",
    variant === "full-page" ? "absolute bottom-0 left-0 right-0 z-10 pointer-events-none" : "border-t border-border"
  ), children: [
    /* @__PURE__ */ jsx(AnimatePresence, { children: showScrollButton && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
        className: "absolute left-0 right-0 -top-12 flex justify-center z-20 pointer-events-auto",
        children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: scrollToBottom,
            className: "flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border shadow-md text-muted-foreground hover:text-foreground cursor-pointer",
            children: /* @__PURE__ */ jsx(ArrowDown, { className: "h-4 w-4" })
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: cn(variant === "full-page" && "relative max-w-[52rem] mx-auto w-full pointer-events-auto"), children: isTerminated ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-500", children: [
      /* @__PURE__ */ jsx("p", { children: "This conversation has been terminated." }),
      countdown && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-red-400", children: [
        "Access resumes in: ",
        /* @__PURE__ */ jsx("span", { className: "font-mono font-bold", children: countdown })
      ] })
    ] }) : /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, className: "space-y-2", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full shadow-sm rounded-2xl border border-border bg-background focus-within:border-foreground/30 focus-within:ring-1 focus-within:ring-foreground/30 transition-colors", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          multiple: true,
          accept: ACCEPTED_FILE_TYPES,
          onChange: handleFileSelect,
          className: "hidden"
        }
      ),
      pageContext?.path?.startsWith("/docs") && pageContext.path !== lastSentDocsPath && /* @__PURE__ */ jsx("div", { className: "px-3 pt-3 pb-0", children: /* @__PURE__ */ jsxs("div", { className: "group relative inline-flex items-center gap-2.5 rounded-[10px] border border-border/80 bg-muted/40 px-3 py-2 pr-8 shadow-sm max-w-[95%]", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0 overflow-hidden text-left gap-0.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[12px] font-semibold text-foreground truncate leading-tight", children: pageContext.title || "Introduction" }),
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground/80 truncate leading-tight", children: [
            "https://classgrid.in",
            pageContext.path
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setLastSentDocsPath(pageContext.path),
            className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 focus:text-foreground",
            title: "Remove page context",
            children: [
              /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Remove context" })
            ]
          }
        )
      ] }) }),
      attachedFiles.length > 0 && /* @__PURE__ */ jsx("div", { className: "px-3 pt-3 pb-0 flex flex-wrap gap-1.5", children: attachedFiles.map((att) => {
        const Icon = getFileIcon(att.type);
        const isImage2 = att.type.startsWith("image/");
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "group relative inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 pr-8 shadow-sm max-w-[200px] transition-all",
              att.status === "error" ? "border-red-500/50 bg-red-500/10" : "border-border/80 bg-muted/40",
              att.status === "uploading" ? "opacity-70 animate-pulse" : "opacity-100"
            ),
            children: [
              isImage2 ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: att.url || (att.file ? URL.createObjectURL(att.file) : ""),
                    alt: att.name,
                    className: "h-6 w-6 rounded object-cover shrink-0"
                  }
                )
              ) : /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0 overflow-hidden text-left gap-0", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-foreground truncate leading-tight", children: att.name }),
                att.status === "uploading" ? /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full max-w-[80px] bg-muted-foreground/20 rounded-full overflow-hidden mt-1 mb-0.5", children: /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { width: "0%" },
                    animate: { width: "85%" },
                    transition: { duration: 2.5, ease: "easeOut" },
                    className: "h-full bg-emerald-500 rounded-full"
                  }
                ) }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground/70 leading-tight", children: att.status === "error" ? "Failed" : formatFileSize(att.size) })
              ] }),
              att.status === "done" && att.url && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setPreviewFile({ name: att.name, src: att.url, mimeType: att.type }),
                  className: "absolute inset-0 w-full h-full cursor-pointer z-0",
                  title: "Preview file"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeAttachedFile(att.id),
                  className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10 cursor-pointer",
                  title: `Remove ${att.name}`,
                  children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
                }
              )
            ]
          },
          att.id
        );
      }) }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          id: "ask-ai-input",
          name: "askAiQuestion",
          suppressHydrationWarning: true,
          ref: inputRef,
          value: input,
          onChange: (event) => setInput(event.target.value),
          onPaste: handlePaste,
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) void askQuestion(input);
            }
          },
          placeholder: attachedFiles.length > 0 ? "Add a message or send files..." : "Ask a question...",
          autoComplete: "off",
          className: cn(
            "min-h-[120px] max-h-[240px] w-full resize-none bg-transparent pb-12 pr-14 text-sm text-foreground focus:outline-none overflow-y-auto [scrollbar-width:thin] leading-relaxed transition-colors",
            pageContext?.path?.startsWith("/docs") && !isGenerating ? "pl-14" : "pl-4",
            pageContext?.path?.startsWith("/docs") || attachedFiles.length > 0 ? "pt-3" : "pt-4 rounded-2xl"
          )
        }
      ),
      (pageContext?.path?.startsWith("/docs") || variant === "full-page") && !isGenerating && /* @__PURE__ */ jsx("div", { className: "absolute bottom-3 left-4", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => fileInputRef.current?.click(),
          disabled: attachedFiles.length >= 6,
          className: "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-30 transition-all cursor-pointer",
          title: attachedFiles.length >= 6 ? "Max 6 files" : "Attach file (max 35MB)",
          children: /* @__PURE__ */ jsx(Paperclip, { className: cn("h-4 w-4 -rotate-45", isAnyFileUploading && "opacity-50") })
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-3 right-3 flex items-center gap-1.5", children: isGenerating ? /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "primary",
          onClick: handleStop,
          className: "h-8 rounded-full bg-foreground text-background hover:bg-foreground/90 px-3 text-[11px] font-medium shadow-sm transition-all active:scale-95",
          title: "Stop generating",
          children: [
            /* @__PURE__ */ jsx(Square, { className: "mr-1.5 h-3 w-3 fill-current opacity-80" }),
            "Stop"
          ]
        }
      ) : /* @__PURE__ */ jsxs(
        Button,
        {
          type: "submit",
          variant: "primary",
          size: "icon",
          disabled: !canSubmit,
          className: "h-8 w-8 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-all shadow-sm",
          children: [
            /* @__PURE__ */ jsx(ArrowUp, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Send question" })
          ]
        }
      ) })
    ] }) }) })
  ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes targetGlowPulse {
          0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
          15% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.6); }
          100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
        }
        .msg-target-glow:target {
          animation: targetGlowPulse 2.5s ease-in-out forwards;
        }
      ` }),
    variant === "full-page" ? /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] bg-background flex flex-row", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 relative flex flex-col h-full", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: chatScrollRef,
            className: "flex-1 overflow-y-auto overscroll-contain scroll-smooth",
            children: panelChat
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "shrink-0 bg-background pt-2 pb-6 px-4 md:px-8 max-w-4xl w-full mx-auto", children: panelInput })
      ] }),
      tocItems.length > 0 && /* @__PURE__ */ jsx(ScrollSpyTOC, { tocItems, activeSection })
    ] }) : null,
    variant === "in-flow" ? /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "hidden sm:block shrink-0 overflow-hidden sticky top-0 h-[100dvh]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          prefersReducedMotion && "!duration-0",
          open ? "w-[400px]" : "w-0"
        ),
        children: /* @__PURE__ */ jsxs(
          "aside",
          {
            className: "h-[100dvh] w-[400px] flex flex-col border-l border-border bg-background",
            "aria-hidden": !open,
            children: [
              panelHeader,
              panelChat,
              panelInput
            ]
          }
        )
      }
    ) : null,
    variant === "overlay" ? /* @__PURE__ */ jsx(AnimatePresence, { children: !isMobile && open && /* @__PURE__ */ jsxs(
      motion.aside,
      {
        "aria-hidden": !open,
        className: "fixed inset-y-0 right-0 z-[120] w-[400px] flex flex-col border-l border-border bg-background shadow-2xl hidden sm:flex",
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: prefersReducedMotion ? { duration: 0 } : panelTransition,
        children: [
          panelHeader,
          panelChat,
          panelInput
        ]
      }
    ) }) : null,
    /* @__PURE__ */ jsx(AnimatePresence, { children: open && isMobile ? /* @__PURE__ */ jsx(
      motion.button,
      {
        type: "button",
        "aria-label": "Close Ask AI panel",
        onClick: () => onOpenChange(false),
        className: "fixed inset-0 z-[110] bg-background/70 backdrop-blur-sm sm:hidden",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: "easeInOut" }
      },
      "ask-ai-overlay"
    ) : null }),
    isMobile && /* @__PURE__ */ jsxs(
      motion.aside,
      {
        "aria-hidden": !open,
        className: cn(
          "fixed z-[120] flex flex-col border-border bg-background shadow-2xl sm:hidden",
          "inset-x-0 bottom-0 h-[100dvh] w-full border-t",
          open ? "pointer-events-auto" : "pointer-events-none"
        ),
        initial: false,
        animate: open ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 },
        transition: prefersReducedMotion ? { duration: 0 } : panelTransition,
        children: [
          panelHeader,
          panelChat,
          panelInput
        ]
      }
    ),
    previewFile && !previewFile.mimeType?.startsWith("image/") && /* @__PURE__ */ jsx(
      FilePreviewModal,
      {
        file: previewFile,
        onClose: () => setPreviewFile(null)
      }
    ),
    previewFile && previewFile.mimeType?.startsWith("image/") && /* @__PURE__ */ jsx(
      DocsImageViewer,
      {
        images: [{
          id: previewFile.name,
          src: typeof previewFile.src === "string" ? previewFile.src : URL.createObjectURL(previewFile.src),
          alt: previewFile.name
        }],
        defaultOpenIndex: 0,
        renderThumbnails: () => null,
        onClose: () => setPreviewFile(null)
      }
    )
  ] });
}
function TypingDots2({ reducedMotion = false }) {
  const dotClass = "h-1.5 w-1.5 rounded-full bg-muted-foreground";
  if (reducedMotion) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsx("span", { className: dotClass }),
      /* @__PURE__ */ jsx("span", { className: dotClass }),
      /* @__PURE__ */ jsx("span", { className: dotClass })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: [0, 1, 2].map((index) => /* @__PURE__ */ jsx(
    motion.span,
    {
      className: dotClass,
      animate: { opacity: [0.25, 1, 0.25], y: [0, -2, 0] },
      transition: { duration: 0.9, repeat: Infinity, delay: index * 0.14 }
    },
    index
  )) });
}
function SearchingSpinner2({ reducedMotion = false }) {
  if (reducedMotion) {
    return /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 text-emerald-400" });
  }
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      animate: { rotate: 360 },
      transition: { duration: 1.8, repeat: Infinity, ease: "linear" },
      children: /* @__PURE__ */ jsx(Globe2, { className: "h-3.5 w-3.5 text-emerald-400" })
    }
  );
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    Input$1,
    {
      type,
      "data-slot": "input",
      className: cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      ),
      ...props
    }
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AskAiPanel, Button, CodeBlockClient, Input, SearchingSpinner2 as SearchingSpinner, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, TypingDots2 as TypingDots, buttonVariants, cn };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map