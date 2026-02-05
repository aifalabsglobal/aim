import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Play, Terminal, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CodeBlock = ({ language = 'javascript', code }) => {
    const { theme } = useTheme();
    const [editableCode, setEditableCode] = useState(code);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState(null);
    const [showConsole, setShowConsole] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionMode, setExecutionMode] = useState('client'); // 'client' or 'server'
    const editorRef = useRef(null);

    // Sync with prop changes if needed
    useEffect(() => {
        setEditableCode(code);
    }, [code]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(editableCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;

        // Function to update height based on content
        const updateHeight = () => {
            const contentHeight = editor.getContentHeight();
            // contentHeight returns the height of lines. We might want a small buffer.
            editor.getDomNode().style.height = `${contentHeight}px`;
            editor.layout();
        };

        // Update initially
        updateHeight();

        // Listen for content changes (typing, etc)
        editor.onDidChangeModelContent(updateHeight);

        // Listen for specific content size changes (e.g. word wrap)
        editor.onDidContentSizeChange(updateHeight);
    };

    const handleRunClient = () => {
        setShowConsole(true);
        try {
            const logs = [];
            const mockConsole = {
                log: (...args) => {
                    logs.push(args.map(arg =>
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '));
                }
            };
            const runCode = new Function('console', editableCode);
            let result = runCode(mockConsole);
            const outputText = logs.length > 0 ? logs.join('\n') : (result !== undefined ? String(result) : '✓ Executed successfully');
            setOutput({ type: 'success', content: outputText });
        } catch (error) {
            setOutput({ type: 'error', content: error.toString() });
        }
    };

    const handleRunServer = async () => {
        setShowConsole(true);
        setIsExecuting(true);
        setOutput({ type: 'info', content: 'Executing...' });

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language,
                    code: editableCode
                })
            });

            const result = await response.json();

            if (result.success) {
                setOutput({ type: 'success', content: result.output });
            } else {
                setOutput({ type: 'error', content: result.error });
            }
        } catch (error) {
            setOutput({ type: 'error', content: `Execution failed: ${error.message}` });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleRun = () => {
        if (executionMode === 'client' && (language === 'javascript' || language === 'js')) {
            handleRunClient();
        } else {
            handleRunServer();
        }
    };

    const canExecute = () => {
        const supportedLanguages = ['javascript', 'js', 'python', 'py'];
        return supportedLanguages.includes(language.toLowerCase());
    };

    // Map language names if necessary for Monaco
    const getMonacoLanguage = (lang) => {
        const map = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'sh': 'shell',
            'bash': 'shell'
        };
        return map[lang.toLowerCase()] || lang.toLowerCase();
    };

    return (
        <div className="code-block my-4 animate-fade-in-up border border-[var(--border-color)]">
            {/* Header */}
            <div className="code-block-header border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/60" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-wider">{language}</span>
                </div>

                <div className="flex items-center gap-1">
                    {canExecute() && (
                        <>
                            <button
                                onClick={handleRun}
                                disabled={isExecuting}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={executionMode === 'client' ? 'Run in browser' : 'Run on server'}
                            >
                                <Play className={`w-3 h-3 ${isExecuting ? 'animate-pulse' : ''}`} />
                                {isExecuting ? 'Running...' : `Run ${executionMode === 'server' ? '(Server)' : '(Browser)'}`}
                            </button>
                            {(language === 'javascript' || language === 'js') && (
                                <button
                                    onClick={() => setExecutionMode(executionMode === 'client' ? 'server' : 'client')}
                                    className="px-2 py-1 rounded-lg text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                                    title="Toggle execution mode"
                                >
                                    {executionMode === 'client' ? '🌐' : '⚙️'}
                                </button>
                            )}
                        </>
                    )}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Code Content */}
            <div className="code-block-content p-0 overflow-hidden" style={{ minHeight: '100px' }}>
                <Editor
                    height="100px" // Managed by onMount
                    language={getMonacoLanguage(language)}
                    value={editableCode}
                    onChange={(value) => setEditableCode(value)}
                    theme={theme === 'dark' ? 'vs-dark' : 'vs-dark'}
                    onMount={handleEditorDidMount}
                    options={{
                        readOnly: false,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineHeight: 24, // Explicit pixel value required by Monaco
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace",
                        fontLigatures: true,
                        renderLineHighlight: 'none',
                        contextmenu: true,
                        scrollbar: {
                            vertical: 'hidden', // Auto-expand, no scroll
                            horizontal: 'auto',
                            horizontalScrollbarSize: 6
                        },
                        domReadOnly: false,
                        automaticLayout: true,
                        padding: { top: 20, bottom: 20 },
                        lineNumbers: 'on',
                        lineNumbersMinChars: 3,
                        folding: false,
                        wordWrap: 'on',
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true
                    }}
                />
            </div>

            {/* Console Output */}
            {showConsole && output && (
                <div className="border-t border-[var(--border-color)] animate-fade-in-up">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-tertiary)]">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                Output
                            </span>
                        </div>
                        <button
                            onClick={() => setShowConsole(false)}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div
                        className={`px-5 py-4 text-sm font-mono overflow-auto max-h-48 ${output.type === 'error'
                            ? 'bg-red-500/10 text-red-400 border-l-4 border-red-500'
                            : output.type === 'info'
                                ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500'
                                : 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500'
                            }`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                        <pre className="whitespace-pre-wrap break-words leading-relaxed">{output.content}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeBlock;
