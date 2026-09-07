"use client";

import { cn } from "../utils.js";
import { List } from "lucide-react";

export interface TOCItem {
  id: string;
  label: string;
}

interface ScrollSpyTOCProps {
  tocItems: TOCItem[];
  activeSection: string;
}

/**
 * Right-side minimalist scroll-spy Table of Contents.
 * Renders a fixed-position "On this page" label + tick marks on desktop (xl+).
 * Shared between ComparisonDetailClient and BlogDetailClient.
 */
export function ScrollSpyTOC({ tocItems, activeSection }: ScrollSpyTOCProps) {
  return (
    <div className="hidden xl:block absolute right-4 top-24 bottom-24 w-[280px] z-40 pointer-events-none hide-when-ask-ai-open">
      <div className="sticky top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-end w-full pr-4">

        {/* "On this page" dropdown label */}
        <div className="group relative inline-flex items-center gap-2 mb-4 text-[13px] font-semibold text-slate-900 dark:text-muted-foreground cursor-pointer p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          <List className="w-4 h-4" />
          <div className="absolute top-full right-0 mt-2 w-56 max-h-[300px] overflow-y-auto overscroll-contain rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999] p-2 text-left">
            {tocItems.map(item => (
              <a key={`dropdown-${item.id}`} href={`#${item.id}`} className={cn(
                "block px-2 py-1.5 text-[13px] rounded hover:bg-slate-100 dark:hover:bg-white/5",
                activeSection === item.id ? "text-emerald-500 font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Scroll spy ticks */}
        <div className="flex flex-col gap-1 items-end w-full max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tocItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={`tick-${item.id}`}
                href={`#${item.id}`}
                className="group relative flex justify-end items-center h-2 w-full"
                aria-label={`Scroll to ${item.label}`}
                aria-current={isActive ? "true" : undefined}
              >
                <div
                  className={cn(
                    "h-[1px] transition-all duration-300 ease-in-out",
                    isActive
                      ? "w-10 bg-emerald-600 dark:bg-emerald-400"
                      : "w-5 bg-slate-500 dark:bg-white/40 group-hover:w-7 group-hover:bg-slate-700 dark:group-hover:bg-white/60"
                  )}
                />
                {/* Hover Tooltip */}
                <span className="absolute right-12 px-2 py-1 bg-slate-800 dark:bg-white text-white dark:text-black text-[11px] font-medium rounded opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-lg z-[999]">
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
