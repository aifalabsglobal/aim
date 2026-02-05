import { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { ChevronDown, Sparkles, Check, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const ModelSwitcher = ({ sidebarMode = false }) => {
    const {
        currentModel,
        setCurrentModel,
        availableModels,
        gpuStatus
    } = useChatContext();

    const models = Array.isArray(availableModels) ? availableModels : [];
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getStatusIndicator = () => {
        switch (gpuStatus) {
            case 'connected':
                return (
                    <span className="flex items-center gap-1.5" title="GPU Connected">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </span>
                );
            case 'disconnected':
                return (
                    <span className="flex items-center gap-1" title="GPU Disconnected">
                        <WifiOff className="w-3 h-3 text-red-400" />
                    </span>
                );
            case 'checking':
                return (
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Checking connection..."></span>
                );
            default:
                return (
                    <span className="w-2 h-2 rounded-full bg-gray-500" title="Unknown status"></span>
                );
        }
    };

    const getCurrentModelDisplay = () => {
        const model = models.find(m => m.name === currentModel || m.id === currentModel);
        return model?.displayName || model?.name?.split(':')[0] || currentModel?.split(':')[0];
    };

    const formatModelName = (model) => {
        return model.displayName || model.name?.split(':')[0] || model.name;
    };

    const formatModelSize = (size) => {
        if (!size) return '';
        const gb = size / (1024 * 1024 * 1024);
        return gb.toFixed(1) + ' GB';
    };

    return (
        <div className={`relative ${sidebarMode ? 'w-full' : ''}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)] transition-all duration-200 shadow-sm ${sidebarMode ? 'w-full' : ''}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{getCurrentModelDisplay()}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusIndicator()}
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute ${sidebarMode ? 'bottom-full mb-2 left-0 w-full' : 'top-full mt-2 left-1/2 -translate-x-1/2 w-72'} py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl z-50 animate-fade-in-up`}>
                    {/* Header */}
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-[var(--border-color)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Select Model
                            </span>
                            <span className={`flex items-center gap-1.5 text-[10px] font-medium ${gpuStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {gpuStatus === 'connected' ? (
                                    <>
                                        <Wifi className="w-3 h-3" />
                                        GPU Online
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-3 h-3" />
                                        GPU Offline
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Model List */}
                    <div className="max-h-64 overflow-y-auto scrollbar-thin py-1">
                        {models.length > 0 ? (
                            models.map((model) => (
                                <button
                                    key={model.id || model.name}
                                    onClick={() => {
                                        setCurrentModel(model.name);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${currentModel === model.name
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">
                                                {formatModelName(model)}
                                            </span>
                                            {model.offline && (
                                                <span className="px-1.5 py-0.5 text-[9px] font-medium bg-yellow-500/20 text-yellow-500 rounded">
                                                    OFFLINE
                                                </span>
                                            )}
                                        </div>
                                        {model.size && (
                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                {formatModelSize(model.size)}
                                            </span>
                                        )}
                                    </div>
                                    {currentModel === model.name && (
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-50" />
                                <p className="text-sm text-[var(--text-muted)]">No models available</p>
                                <p className="text-xs text-[var(--text-muted)] opacity-70 mt-1">
                                    Check GPU connection
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {models.length > 0 && (
                        <div className="px-4 py-2 border-t border-[var(--border-color)]">
                            <p className="text-[10px] text-[var(--text-muted)] text-center">
                                {models.length} model{models.length !== 1 ? 's' : ''} available
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ModelSwitcher;
