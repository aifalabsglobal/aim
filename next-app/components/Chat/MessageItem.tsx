"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CodeBlock from "./CodeBlock";
import MermaidBlock from "./MermaidBlock";
import MarkmapBlock from "./MarkmapBlock";
import ThinkingBlock from "./ThinkingBlock";
import { Edit2, Copy, User, Bot, Loader2, File } from "lucide-react";
import "katex/dist/katex.min.css";

type Message = {
  id: string;
  role: string;
  content: string;
  thinking?: string | null;
  thinking_duration?: number | null;
  attachments?: { id: string; originalName: string }[];
  isStreaming?: boolean;
};

export default function MessageItem({
  message,
  onEdit,
  onDelete,
}: {
  message: Message;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) onEdit(message.id, editContent.trim());
    setIsEditing(false);
  };

  const markdownComponents = useMemo(
    () => ({
      code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
        const match = /language-(\w+)/.exec(className ?? "");
        if (!inline && match) {
          const lang = match[1].toLowerCase();
          const codeStr = String(children).replace(/\n$/, "");
          if (lang === "markmap") {
            return <MarkmapBlock markdown={codeStr} />;
          }
          if (lang === "mermaid" || lang === "mindmap") {
            const mermaidCode = lang === "mindmap" ? `mindmap\n${codeStr}` : codeStr;
            return <MermaidBlock code={mermaidCode} />;
          }
          return (
            <div className="my-4">
              <CodeBlock language={match[1]} code={codeStr} />
            </div>
          );
        }
        return <code className={className} {...props}>{children}</code>;
      },
      table({ children }: { children?: React.ReactNode }) {
        return (
          <div className="my-4 w-full overflow-x-auto rounded-lg border border-[var(--border-color)]">
            <table className="aifa-table w-full caption-bottom text-sm">{children}</table>
          </div>
        );
      },
      thead({ children }: { children?: React.ReactNode }) {
        return <thead className="aifa-thead [&_tr]:border-b [&_tr]:border-[var(--border-color)]">{children}</thead>;
      },
      tbody({ children }: { children?: React.ReactNode }) {
        return <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
      },
      tr({ children }: { children?: React.ReactNode }) {
        return (
          <tr className="aifa-tr border-b border-[var(--border-color)] transition-colors hover:bg-[var(--bg-hover)]/50">
            {children}
          </tr>
        );
      },
      th({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
        return (
          <th
            className="h-10 px-4 text-left align-middle font-semibold text-[var(--text-secondary)]"
            {...props}
          >
            {children}
          </th>
        );
      },
      td({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
        return (
          <td className="p-4 align-middle text-[var(--text-primary)]" {...props}>
            {children}
          </td>
        );
      },
      ul({ children, className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
        return (
          <ul className="prose-aifa-list my-3 space-y-1 pl-6 list-disc text-[var(--text-primary)]" {...props}>
            {children}
          </ul>
        );
      },
      ol({ children, className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) {
        return (
          <ol className="prose-aifa-list my-3 space-y-1 pl-6 list-decimal text-[var(--text-primary)]" {...props}>
            {children}
          </ol>
        );
      },
      li({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
        return (
          <li className="pl-1 marker:text-[var(--accent-primary)]" {...props}>
            {children}
          </li>
        );
      },
    }),
    []
  );

  return (
    <div className={`message-container group py-5 ${isUser ? "message-user" : "message-ai"}`}>
      <div className={`flex gap-4 max-w-3xl mx-auto md:px-0 ${isUser ? "flex-row-reverse" : ""}`}>
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)]">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-sm">
              <span className="font-serif font-bold text-xs">Ai</span>
            </div>
          )}
        </div>
        <div className={`flex-1 min-w-0 flex flex-col space-y-2 ${isUser ? "items-end" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] text-[var(--text-primary)]">
              {isUser ? "You" : "AIFA"}
            </span>
            {message.isStreaming && !isUser && (
              <Loader2 className="w-3 h-3 animate-spin text-[var(--text-muted)]" />
            )}
          </div>
          {isEditing ? (
            <div className="input-box p-3 w-full bg-[var(--bg-primary)]">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  } else if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }
                }}
                className="w-full bg-transparent resize-none focus:outline-none min-h-[60px] text-[15px] leading-relaxed text-[var(--text-primary)]"
                rows={1}
              />
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-secondary)]">Cancel</button>
                <button type="button" onClick={handleSaveEdit} className="px-3 py-1.5 rounded bg-[var(--accent-primary)] text-white text-xs font-medium">Save</button>
              </div>
            </div>
          ) : (
            <div className={`w-full ${isUser ? "bg-[var(--bg-user-message)] p-3 rounded-xl rounded-tr-sm max-w-[85%]" : ""}`}>
              {message.thinking != null && !isUser && (
                <ThinkingBlock
                  content={message.thinking}
                  duration={message.thinking_duration ?? undefined}
                  isStreaming={message.isStreaming && !message.content}
                />
              )}
              <div className="prose-aifa max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {message.content
                    .replace(/\\\[([\s\S]*?)\\\]/g, "$$$$$1$$$$")
                    .replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$")}
                </ReactMarkdown>
              </div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs font-medium text-[var(--text-secondary)]">
                      <File className="w-3.5 h-3.5" />
                      <span>{file.originalName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isEditing && !isUser && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={handleCopy} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded">
                {copied ? "Copied!" : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          {!isEditing && isUser && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => setIsEditing(true)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
