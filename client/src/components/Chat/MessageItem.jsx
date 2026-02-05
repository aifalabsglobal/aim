import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeBlock from './CodeBlock';
import ThinkingBlock from './ThinkingBlock';
import { Edit2, RotateCcw, Copy, Check, User, Bot, Trash2, File, ExternalLink, Loader2 } from 'lucide-react';

import 'katex/dist/katex.min.css';

const MessageItem = ({ message, onEdit, onDelete }) => {
    const isUser = message.role === 'user';
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [copied, setCopied] = useState(false);

    const textareaRef = useRef(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            textareaRef.current.focus();
        }
    }, [isEditing]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveEdit = () => {
        if (editContent.trim() !== message.content) {
            onEdit(message.id, editContent);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditContent(message.content);
        }
    };

    // Memoize the markdown components
    const markdownComponents = React.useMemo(() => ({
        code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <div className="my-4">
                    <CodeBlock
                        language={match[1]}
                        code={String(children).replace(/\n$/, '')}
                        theme="vs-light"
                    />
                </div>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }
    }), []);

    return (
        <div className={`message-container group py-5 ${isUser ? '' : ''}`}>
            {/* AIFA-style centered layout */}
            <div className={`flex gap-4 max-w-3xl mx-auto md:px-0 ${isUser ? 'flex-row-reverse' : ''}`}>

                {/* Avatar / Icon */}
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

                {/* Content Area */}
                <div className={`flex-1 min-w-0 flex flex-col space-y-2 ${isUser ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-[var(--text-primary)]">
                            {isUser ? 'You' : 'AIFA'}
                        </span>
                        {message.isStreaming && !isUser && (
                            <Loader2 className="w-3 h-3 animate-spin text-[var(--text-muted)]" />
                        )}
                    </div>

                    {/* Message Body */}
                    {isEditing ? (
                        <div className="input-box p-3 w-full bg-[var(--bg-primary)]">
                            <textarea
                                ref={textareaRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent resize-none focus:outline-none min-h-[60px] text-[15px] leading-relaxed text-[var(--text-primary)]"
                                rows={1}
                            />
                            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[var(--border-color)]">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-secondary)]">Cancel</button>
                                <button onClick={handleSaveEdit} className="px-3 py-1.5 rounded bg-[var(--accent-primary)] text-white text-xs font-medium">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className={`w-full ${isUser ? 'bg-[var(--bg-user-message)] p-3 rounded-xl rounded-tr-sm max-w-[85%]' : ''}`}>

                            {/* Thinking Block with toggling? For now standard */}
                            {message.thinking && !isUser && (
                                <ThinkingBlock
                                    content={message.thinking}
                                    duration={message.thinking_duration}
                                    isStreaming={message.isStreaming && !message.content}
                                />
                            )}

                            <div className={`prose-aifa max-w-none ${isUser ? '' : ''}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={markdownComponents}
                                >
                                    {/* Preprocess LaTeX brackets to $ delimiters for remark-math */}
                                    {message.content
                                        .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // \[ ... \] -> $$ ... $$
                                        .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')     // \( ... \) -> $ ... $
                                    }
                                </ReactMarkdown>
                            </div>

                            {/* Attachments */}
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

                    {/* Footer Actions (Copy, Edit, Regen) */}
                    {!isEditing && !isUser && (
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handleCopy} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => onEdit(message.id, 'regenerate')} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"><RotateCcw className="w-3.5 h-3.5" /></button>
                        </div>
                    )}
                    {/* User Edit */}
                    {!isEditing && isUser && (
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setIsEditing(true)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Memoize the entire component
export default React.memo(MessageItem, (prevProps, nextProps) => {
    // Only re-render if content, streaming state, or editing state changes
    return (
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.isStreaming === nextProps.message.isStreaming &&
        prevProps.message.thinking === nextProps.message.thinking &&
        prevProps.isLast === nextProps.isLast
    );
});
