'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Maps languages to short badges like Vercel does
const LANG_BADGES: Record<string, string> = {
  javascript: 'JS',
  typescript: 'TS',
  jsx: 'JSX',
  tsx: 'TSX',
  bash: 'SH',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  python: 'PY',
};

export function CodeBlockClient({ rawCode, html, language = 'javascript' }: { rawCode: string; html: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeText = LANG_BADGES[language] || language.toUpperCase().substring(0, 4);

  // Attempt to extract filename from the first line if it's a comment
  const lines = rawCode.split('\n');
  let filename = '';
  if (lines[0] && lines[0].startsWith('// ') && lines[0].includes('.')) {
    filename = lines[0].replace('// ', '').trim();
  } else if (lines[0] && lines[0].startsWith('# ') && lines[0].includes('.')) {
    filename = lines[0].replace('# ', '').trim();
  }

  return (
    <div className="group relative my-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111113] overflow-hidden text-sm shadow-sm dark:shadow-xl">
      {/* Vercel-style Code Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#18181b]">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-white dark:bg-white/10 text-slate-700 dark:text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] border border-slate-200 dark:border-transparent min-w-[24px] tracking-wider">
            {badgeText}
          </span>
          {filename && (
            <span className="text-slate-600 dark:text-zinc-400 text-[13px] font-mono tracking-tight">
              {filename}
            </span>
          )}
        </div>
        
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Code Content */}
      <div 
        className="relative overflow-auto max-h-[32rem] text-sm code-block-wrapper custom-scrollbar [&>pre]:!bg-transparent [&>pre]:!m-0" 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  );
}
