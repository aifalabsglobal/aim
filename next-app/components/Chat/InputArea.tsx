"use client";

import { useState, useRef, useEffect } from "react";
import { Square, Paperclip, ArrowUp, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import AttachmentPreview from "./AttachmentPreview";

type Att = { id: string; filename?: string; originalName?: string; mimetype: string; size?: number; path?: string };

export default function InputArea({
  onSend,
  onStop,
  isStreaming,
  disabled,
}: {
  onSend: (content: string, attachments?: Att[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Att[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
      if (!message && attachments.length === 0) ta.style.height = "50px";
    }
  }, [message, attachments.length]);

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    const newAttachments: Att[] = [...attachments];
    for (const file of files) {
      try {
        const result = await api.uploadFile(file);
        newAttachments.push({
          id: result.id ?? result.path ?? crypto.randomUUID(),
          filename: result.filename,
          originalName: result.originalName,
          mimetype: result.mimetype,
          size: result.size,
          path: result.path,
        });
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    setAttachments(newAttachments);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((message.trim() || attachments.length > 0) && !isStreaming && !disabled && !isUploading) {
      onSend(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (message.trim() || attachments.length > 0) && !disabled && !isStreaming && !isUploading;

  return (
    <div
      className="w-full relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) uploadFiles(files);
      }}
    >
      <div className={`input-box p-2 transition-all duration-200 ${isDragOver ? "border-emerald-500 ring-1 ring-emerald-500/20" : ""}`}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="How can AIFA help you today?"
          disabled={disabled || isUploading}
          rows={1}
          className="w-full max-h-[200px] min-h-[50px] py-3 px-3 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none scrollbar-thin text-[16px] leading-[1.6]"
          style={{ height: "50px" }}
        />
        <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />
        <div className="flex items-center justify-between px-2 pb-1 pt-1">
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) uploadFiles(files);
              }}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isStreaming}
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
              title="Add artifacts"
            >
              <Paperclip className="w-4.5 h-4.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={isStreaming ? onStop : () => handleSubmit()}
            disabled={!isStreaming && !canSend}
            title={isStreaming ? "Stop generating" : "Send"}
            className={`p-2 rounded-lg transition-all duration-200 ${isStreaming || canSend ? "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)]" : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"}`}
          >
            {isStreaming ? (
              <Square className="w-4 h-4 fill-current" />
            ) : isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {isDragOver && (
        <div className="absolute inset-0 z-20 rounded-xl bg-[var(--bg-primary)]/90 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-[var(--accent-primary)]">
          <p className="text-[var(--accent-primary)] font-medium">Drop files to upload</p>
        </div>
      )}
    </div>
  );
}
