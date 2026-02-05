import { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, ArrowUp, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import AttachmentPreview from './AttachmentPreview';

const InputArea = ({ onSend, onStop, isStreaming, disabled }) => {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
            if (!message && attachments.length === 0) {
                textarea.style.height = '50px';
            }
        }
    }, [message, attachments]);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        await uploadFiles(files);
    };

    const uploadFiles = async (files) => {
        setIsUploading(true);
        const newAttachments = [...attachments];
        for (const file of files) {
            try {
                const result = await api.uploadFile(file);
                newAttachments.push(result);
            } catch (error) {
                console.error('File upload failed:', error);
            }
        }
        setAttachments(newAttachments);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if ((message.trim() || attachments.length > 0) && !isStreaming && !disabled && !isUploading) {
            onSend(message.trim(), attachments);
            setMessage('');
            setAttachments([]);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const onDragLeave = () => {
        setIsDragOver(false);
    };

    const onDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await uploadFiles(files);
        }
    };

    const canSend = (message.trim() || attachments.length > 0) && !disabled && !isStreaming && !isUploading;

    return (
        <div
            className="w-full relative"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Stop Button (Centered above input) */}
            {isStreaming && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 animate-fade-in-up">
                    <button
                        onClick={onStop}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-sm transition-all"
                    >
                        <Square className="w-2.5 h-2.5 fill-current" />
                        Stop generating
                    </button>
                </div>
            )}

            {/* Input Box */}
            <div className={`input-box p-2 transition-all duration-200 ${isDragOver ? 'border-emerald-500 ring-1 ring-emerald-500/20' : ''}`}>
                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How can AIFA help you today?"
                    disabled={disabled || isUploading}
                    rows={1}
                    className="w-full max-h-[200px] min-h-[50px] py-3 px-3 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none scrollbar-thin text-[16px] leading-[1.6]"
                    style={{ height: '50px' }}
                />

                {/* Attachment Preview */}
                <AttachmentPreview
                    attachments={attachments}
                    onRemove={removeAttachment}
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-2 pb-1 pt-1">
                    <div className="flex items-center gap-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
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

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!canSend}
                            className={`p-2 rounded-lg transition-all duration-200 ${canSend
                                ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)]'
                                : 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed'
                                }`}
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowUp className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 z-20 rounded-xl bg-[var(--bg-primary)]/90 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-[var(--accent-primary)]">
                    <p className="text-[var(--accent-primary)] font-medium">Drop files to upload</p>
                </div>
            )}
        </div>
    );
};
export default InputArea;
