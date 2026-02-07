"use client";

import { useEffect } from "react";
import { X, Moon, Sun, Trash2, Wrench } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useChatContext } from "@/context/ChatContext";

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { settings = { temperature: 0.7, topP: 1, maxTokens: 4096, systemPrompt: "" }, updateSettings, mcpInfo } = useChatContext();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div>
            <h2 id="settings-title" className="text-xl font-bold">Settings</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Customize your chat experience</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Appearance</h3>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => theme !== "light" && toggleTheme()} className={`flex items-center gap-3 p-4 rounded-xl border ${theme === "light" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"}`}>
                <Sun className={`w-5 h-5 ${theme === "light" ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`} />
                <div className="text-left"><p className="text-sm font-medium">Light</p></div>
              </button>
              <button type="button" onClick={() => theme !== "dark" && toggleTheme()} className={`flex items-center gap-3 p-4 rounded-xl border ${theme === "dark" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"}`}>
                <Moon className={`w-5 h-5 ${theme === "dark" ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`} />
                <div className="text-left"><p className="text-sm font-medium">Dark</p></div>
              </button>
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">AI Configuration</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between"><label className="text-sm font-medium">Temperature</label><span className="text-sm font-mono text-emerald-400">{settings.temperature}</span></div>
                <input type="range" min={0} max={2} step={0.1} value={settings.temperature} onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })} className="w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><label className="text-sm font-medium">Top-P</label><span className="text-sm font-mono text-emerald-400">{settings.topP}</span></div>
                <input type="range" min={0} max={1} step={0.05} value={settings.topP} onChange={(e) => updateSettings({ topP: parseFloat(e.target.value) })} className="w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><label className="text-sm font-medium">Max Tokens</label><span className="text-sm font-mono text-emerald-400">{settings.maxTokens}</span></div>
                <input type="range" min={256} max={8192} step={256} value={settings.maxTokens} onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value, 10) })} className="w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">System Prompt</label>
                <textarea value={settings.systemPrompt} onChange={(e) => updateSettings({ systemPrompt: e.target.value })} placeholder="e.g. You are a helpful assistant..." className="w-full min-h-[100px] p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none" />
              </div>
            </div>
          </section>
          {mcpInfo && mcpInfo.tools.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" /> MCP Tools ({mcpInfo.tools.length} from {mcpInfo.servers.length} server{mcpInfo.servers.length !== 1 ? "s" : ""})
              </h3>
              <div className="rounded-lg border border-[var(--border-color)] divide-y divide-[var(--border-color)] max-h-48 overflow-y-auto scrollbar-thin">
                {mcpInfo.tools.map((t, i) => (
                  <div key={t.name + i} className="px-4 py-2.5">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                    {t.description && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{t.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="pt-4 border-t border-[var(--border-color)]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Data</h3>
            <button type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Clear All Chats
            </button>
          </section>
        </div>
        <div className="p-6 border-t border-[var(--border-color)] flex justify-end">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium">Save & Close</button>
        </div>
      </div>
    </div>
  );
}
