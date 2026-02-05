import { Image, File, XCircle } from 'lucide-react';

const AttachmentPreview = ({ attachments, onRemove }) => {
    if (!attachments || attachments.length === 0) return null;

    const getFileIcon = (mimetype) => {
        if (mimetype.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400" />;
        return <File className="w-5 h-5 text-[var(--text-muted)]" />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-wrap gap-2 p-3 border-b border-[var(--border-color)] animate-fade-in-up">
            {attachments.map((file) => (
                <div
                    key={file.id}
                    className="group relative flex items-center gap-3 p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-xl min-w-[160px] max-w-[220px] transition-all duration-200"
                >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {file.mimetype.startsWith('image/') ? (
                            <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            getFileIcon(file.mimetype)
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-medium truncate" title={file.originalName}>
                            {file.originalName}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase">
                            {file.mimetype.split('/')[1]} • {formatSize(file.size)}
                        </p>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={() => onRemove(file.id)}
                        className="absolute -top-2 -right-2 p-0.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-400 rounded-full border border-[var(--border-color)] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        title="Remove"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AttachmentPreview;
