'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Compass, Lightbulb, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose-sm max-w-none text-ink-900 leading-relaxed font-sans ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-teal-950 tracking-tight mt-5 mb-3 pb-2 border-b border-sand-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sand-500 shrink-0" />
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-teal-900 tracking-tight mt-5 mb-2.5 flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <div className="my-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 border border-teal-200/70 font-sans font-semibold text-xs tracking-wide uppercase text-teal-900 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                {children}
              </span>
            </div>
          ),
          h4: ({ children }) => (
            <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-ink-700 mt-3 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2.5 leading-relaxed text-ink-800 text-[13.5px]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink-950 text-[13.5px]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-ink-800">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-teal-700 text-[13.5px]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:font-mono marker:text-xs marker:font-semibold marker:text-teal-800 text-[13.5px]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-ink-800 pl-0.5">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <div className="my-3.5 p-3.5 rounded-xl bg-gradient-to-r from-sand-50/90 to-ivory-100 border-l-4 border-sand-400 text-ink-900 shadow-2xs relative">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-sand-600 mt-0.5 shrink-0" />
                <div className="text-xs sm:text-[13px] leading-relaxed italic [&>p]:my-0">
                  {children}
                </div>
              </div>
            </div>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-hidden rounded-xl border border-sand-300 shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  {children}
                </table>
              </div>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-teal-900 text-white font-medium">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-sand-200/70 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-sand-50/60 even:bg-ivory-50/40">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-sand-100 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-ink-800 align-top leading-snug">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-sand-100 border border-sand-200 text-teal-900 font-mono text-[11px] font-medium">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2.5 rounded-xl bg-ink-900 text-sand-100 font-mono text-xs overflow-x-auto shadow-xs border border-ink-800">
                <code>{children}</code>
              </pre>
            );
          },
          hr: () => (
            <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-sand-300 to-transparent" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:text-teal-900 underline underline-offset-2 font-medium transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
