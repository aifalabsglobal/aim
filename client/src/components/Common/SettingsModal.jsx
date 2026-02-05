import React from 'react';
import { X, Moon, Sun, Download, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useChatContext } from '../../context/ChatContext';

const SettingsModal = ({ isOpen, onClose }) => {
    const { theme, toggleTheme } = useTheme();
    const {
        settings = { temperature: 0.7, topP: 1, maxTokens: 4096, systemPrompt: '' },
        updateSettings
    } = useChatContext();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                    <div>
                        <h2 className="text-xl font-bold">Settings</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-0.5">
                            Customize your chat experience
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-icon"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8">
                    {/* Appearance */}
                    <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full bg-blue-500" />
                            Appearance
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => theme !== 'light' && toggleTheme()}
                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'light'
                                        ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                        : 'border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]'
                                    }`}
                            >
                                <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-blue-500' : 'text-[var(--text-muted)]'}`} />
                                <div className="text-left">
                                    <p className="text-sm font-medium">Light</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">Clean & bright</p>
                                </div>
                            </button>

                            <button
                                onClick={() => theme !== 'dark' && toggleTheme()}
                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'dark'
                                        ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                        : 'border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]'
                                    }`}
                            >
                                <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-500' : 'text-[var(--text-muted)]'}`} />
                                <div className="text-left">
                                    <p className="text-sm font-medium">Dark</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">Easy on the eyes</p>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* AI Configuration */}
                    <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full bg-emerald-500" />
                            AI Configuration
                        </h3>

                        <div className="space-y-6">
                            {/* Temperature */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Temperature</label>
                                    <span className="text-sm font-mono text-emerald-400">{settings.temperature}</span>
                                </div>
                                <input
                                    type="range" min="0" max="2" step="0.1"
                                    value={settings.temperature}
                                    onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                                <p className="text-[11px] text-[var(--text-muted)]">
                                    Lower = focused & deterministic. Higher = creative & random.
                                </p>
                            </div>

                            {/* Top P */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Top-P</label>
                                    <span className="text-sm font-mono text-emerald-400">{settings.topP}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.topP}
                                    onChange={(e) => updateSettings({ topP: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                                <p className="text-[11px] text-[var(--text-muted)]">
                                    Nucleus sampling: filters out low-probability options.
                                </p>
                            </div>

                            {/* Max Tokens */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Max Response Length</label>
                                    <span className="text-sm font-mono text-emerald-400">{settings.maxTokens}</span>
                                </div>
                                <input
                                    type="range" min="256" max="8192" step="256"
                                    value={settings.maxTokens}
                                    onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <p className="text-[11px] text-[var(--text-muted)]">
                                    Maximum tokens the AI can generate per response.
                                </p>
                            </div>

                            {/* System Prompt */}
                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium">System Prompt</label>
                                <textarea
                                    value={settings.systemPrompt}
                                    onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                                    placeholder="e.g. You are a helpful coding assistant..."
                                    className="input-base min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Data Management */}
                    <section className="pt-4 border-t border-[var(--border-color)]">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full bg-red-500" />
                            Data Management
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-sm font-medium">
                                <Trash2 className="w-4 h-4" />
                                Clear All Chats
                            </button>
                            <button className="btn-secondary flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export JSON
                            </button>
                            <button className="btn-secondary flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export Markdown
                            </button>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--border-color)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-primary px-6"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
