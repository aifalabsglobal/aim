"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Square, Paperclip, ArrowUp, Loader2, Mic, MicOff } from "lucide-react";
import { api } from "@/lib/api";
import AttachmentPreview from "./AttachmentPreview";

/** Browser Web Speech API (fallback when no local Whisper). */
type SpeechRecognitionLike = {
  start(): void;
  stop(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: Iterable<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
function getSpeechRecognitionAPI(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [useWhisper, setUseWhisper] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.transcribeAvailable().then(setUseWhisper).catch(() => setUseWhisper(false));
  }, []);

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

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    const stream = streamRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    stream?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const startWebSpeech = useCallback(() => {
    const SpeechAPI = getSpeechRecognitionAPI();
    if (!SpeechAPI) return;
    const recognition = new SpeechAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: { results: Iterable<{ isFinal: boolean; 0: { transcript: string } }> }) => {
      const results = Array.from(e.results);
      const last = results[results.length - 1];
      if (last?.isFinal && last[0]?.transcript) {
        const newText = last[0].transcript.trim();
        if (newText) setMessage((prev) => (prev ? `${prev} ${newText}` : newText));
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const toggleVoice = useCallback(async () => {
    if (useWhisper === true) {
      if (isRecording) {
        stopRecording();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];
        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          mediaRecorderRef.current = null;
          setIsRecording(false);
          if (chunksRef.current.length === 0) return;
          setIsTranscribing(true);
          try {
            const blob = new Blob(chunksRef.current, { type: mime });
            const file = new File([blob], "recording.webm", { type: blob.type });
            const { text } = await api.transcribeAudio(file, "en");
            if (text) setMessage((prev) => (prev ? `${prev} ${text}` : text).trim());
          } catch (err) {
            console.error("Transcription failed:", err);
          } finally {
            setIsTranscribing(false);
          }
        };
        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access failed:", err);
      }
      return;
    }
    if (useWhisper === false) {
      if (isListening) {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
        return;
      }
      startWebSpeech();
    }
  }, [useWhisper, isRecording, isListening, stopRecording, startWebSpeech]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.state !== "inactive" && mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

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
      <div className={`input-box flex items-end gap-0 rounded-2xl border bg-[var(--bg-secondary)]/60 shadow-sm transition-all duration-200 ${isDragOver ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-[var(--border-color)]"} focus-within:bg-[var(--bg-primary)] focus-within:shadow-md focus-within:border-[var(--border-hover)]`}>
        <div className="flex items-center shrink-0 pl-2 pb-2 pt-2">
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
            onClick={toggleVoice}
            disabled={isUploading || isStreaming || isTranscribing || useWhisper === null}
            className={`p-2.5 rounded-xl transition-all ${isRecording || isListening ? "bg-rose-500/15 text-rose-500" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
            title={
              useWhisper === null
                ? "Checking…"
                : isTranscribing
                  ? "Transcribing…"
                  : isRecording
                    ? "Stop recording (Whisper)"
                    : isListening
                      ? "Stop listening (browser)"
                      : useWhisper
                        ? "Voice input (Whisper)"
                        : "Voice input (browser)"
            }
          >
            {useWhisper === null ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording || isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isStreaming}
            className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AIM Intelligence..."
            disabled={disabled || isUploading}
            rows={1}
            className="w-full max-h-[200px] min-h-[48px] py-3 pr-2 pl-0 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none scrollbar-thin text-[15px] leading-[1.5]"
            style={{ height: "48px" }}
          />
          <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />
        </div>
        <div className="shrink-0 pb-2 pt-2 pr-2">
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
