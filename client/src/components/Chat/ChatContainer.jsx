import { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import MessageItem from './MessageItem';
import InputArea from './InputArea';
import { ArrowDown, Sparkles, MessageCircle, Zap } from 'lucide-react';

const ChatContainer = () => {
    const {
        messages,
        sendMessage,
        stopStream,
        isStreaming,
        streamingContent,
        thinkingContent,
        thinkingDuration,
        isThinking,
        currentConversationId
    } = useChatContext();

    const bottomRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [userAutoScroll, setUserAutoScroll] = useState(true);

    // Combine historical messages with current streaming message
    const displayMessages = [...messages];
    if (isStreaming) {
        displayMessages.push({
            id: 'streaming-temp',
            role: 'assistant',
            content: streamingContent,
            thinking: thinkingContent,
            thinking_duration: thinkingDuration,
            isStreaming: true
        });
    }

    // Scroll to bottom on conversation change or initial load
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'auto' });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUserAutoScroll(true);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowScrollButton(false); // Explicitly hide button
        }
    }, [currentConversationId]); // Trigger explicitly on conversation ID change

    // Force auto-scroll when user sends a message (last message is user)
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'user') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUserAutoScroll(true);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowScrollButton(false); // Explicitly hide button
            if (bottomRef.current) {
                // Use smooth for user send action for better UX
                bottomRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]);

    // Handle auto-scroll during streaming
    useEffect(() => {
        // Only trigger auto-scroll when content changes, not when userAutoScroll state changes
        // This prevents the "bounce back" effect when manually scrolling to bottom
        if (userAutoScroll && bottomRef.current) {
            // Use auto (instant) during streaming to prevent jitter
            bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
            // If we are auto-scrolling, button should be hidden
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (showScrollButton) setShowScrollButton(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, streamingContent, thinkingContent, isThinking]); // Removed userAutoScroll from deps

    // Handle scroll events
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // Increased threshold to 250 to account for pb-48 (approx 192px) padding
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 250;

            // Only update state if changed to prevent re-renders
            if (isNearBottom !== userAutoScroll) {
                setUserAutoScroll(isNearBottom);
            }
            if (!isNearBottom !== showScrollButton) {
                setShowScrollButton(!isNearBottom);
            }
        }
    };

    const toBottom = () => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
            setUserAutoScroll(true);
            setShowScrollButton(false);
        }
    };

    const handleDelete = (id) => {
        console.log("Delete message", id);
    };

    const handleEdit = (id, newContent) => {
        console.log("Edit message", id, newContent);
    };

    // Claude-style Suggestions for empty state
    const suggestions = [
        { text: "Help me check my React state logic", type: "tech" },
        { text: "Explain how quantum computing works", type: "science" },
        { text: "Draft an email for a client meeting", type: "writing" },
    ];

    return (
        <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-primary)]">
            {/* Messages Area - Document feel */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto scrollbar-thin pb-32 md:pb-40"
            >
                {displayMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center px-4 animate-fade-in-up py-20 max-w-3xl mx-auto">

                        <div className="mb-4"></div>

                        <h1 className="text-3xl md:text-3xl font-serif font-medium mb-4 text-center text-[var(--text-primary)] leading-tight">
                            Experience Aim Intelligence
                        </h1>

                        <div className="w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-1 mb-10 shadow-sm">
                            <div className="bg-[var(--bg-primary)] rounded-lg p-4 min-h-[60px] flex items-center text-[var(--text-secondary)]">
                                How can AIFA help you today?
                            </div>
                        </div>

                        {/* Suggestion Cards - Minimal */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full px-2 max-w-3xl">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendMessage(suggestion.text)}
                                    className="group flex flex-col p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] transition-all text-left shadow-sm hover:shadow-md"
                                >
                                    <span className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">
                                        {suggestion.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full px-4 md:px-0">
                        {displayMessages.map((msg, idx) => (
                            <MessageItem
                                key={msg.id}
                                message={msg}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                )}
                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <button
                    onClick={toBottom}
                    className="absolute bottom-32 left-1/2 -translate-x-1/2 p-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-lg hover:bg-[var(--bg-hover)] transition-all z-10"
                    aria-label="Scroll to bottom"
                >
                    <ArrowDown className="w-4 h-4 text-[var(--text-primary)]" />
                </button>
            )}

            {/* Input Area */}
            <div className="absolute bottom-0 w-full bg-[var(--bg-primary)] pb-6 pt-2 px-4 md:px-0">
                <div className="max-w-3xl mx-auto">
                    <InputArea
                        onSend={sendMessage}
                        onStop={stopStream}
                        isStreaming={isStreaming}
                        disabled={isStreaming && !streamingContent && !isThinking}
                    />
                    <div className="text-center mt-3">
                        <p className="text-[11px] text-[var(--text-muted)]">
                            Worlds best inference model from AIM Research Labs
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatContainer;
