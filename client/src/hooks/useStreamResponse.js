import { useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const useStreamResponse = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [thinkingContent, setThinkingContent] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingDuration, setThinkingDuration] = useState(null);
    const [streamError, setStreamError] = useState(null);

    const abortControllerRef = useRef(null);

    const startStream = useCallback(async ({ conversationId, message, model, options = {}, attachments = [] }) => {
        // Reset states
        setIsStreaming(true);
        setStreamingContent('');
        setThinkingContent('');
        setIsThinking(false);
        setThinkingDuration(null);
        setStreamError(null);

        abortControllerRef.current = new AbortController();

        try {
            await fetchEventSource('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId,
                    message,
                    model,
                    options,
                    attachments
                }),
                signal: abortControllerRef.current.signal,

                onopen(res) {
                    if (res.ok && res.status === 200) {
                        console.log("Connection made ", res);
                    } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
                        console.log("Client-side error ", res);
                    }
                },
                onmessage(event) {
                    try {
                        const data = JSON.parse(event.data);

                        switch (data.type) {
                            case 'start':
                                // Initial message ID received
                                break;

                            case 'thinking_start':
                                setIsThinking(true);
                                break;

                            case 'thinking_chunk':
                                setThinkingContent(prev => prev + data.content);
                                break;

                            case 'thinking_end':
                                setIsThinking(false);
                                setThinkingDuration(data.duration);
                                // Also update full content if provided
                                if (data.thinking) {
                                    setThinkingContent(data.thinking);
                                }
                                break;

                            case 'content_chunk':
                                setStreamingContent(prev => prev + data.content);
                                break;

                            case 'done':
                                setIsStreaming(false);
                                break;

                            case 'error':
                                setStreamError(data.message);
                                setIsStreaming(false);
                                break;
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                },
                onclose() {
                    console.log("Connection closed by the server");
                    setIsStreaming(false);
                },
                onerror(err) {
                    console.log("There was an error from server", err);
                    setStreamError(err.message);
                    setIsStreaming(false);
                    throw err; // rethrow to stop retry
                },
            });
        } catch (err) {
            console.error('Stream failed:', err);
            setStreamError(err.message);
            setIsStreaming(false);
        }
    }, []);

    const stopStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsStreaming(false);

            // Notify backend to save partial state
            // api.stopChat({ ... }) - implemented elsewhere or fire-and-forget
        }
    }, []);

    return {
        startStream,
        stopStream,
        isStreaming,
        streamingContent,
        thinkingContent,
        isThinking,
        thinkingDuration,
        streamError
    };
};
