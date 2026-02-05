import { createContext, useContext, useState, useEffect } from 'react';
import { useStreamResponse } from '../hooks/useStreamResponse';
import { api } from '../services/api';

const defaultChatContext = {
    conversations: [],
    currentConversationId: null,
    setCurrentConversationId: () => {},
    currentModel: null,
    setCurrentModel: () => {},
    availableModels: [],
    gpuStatus: 'checking',
    messages: [],
    setMessages: () => {},
    sendMessage: async () => {},
    createNewChat: async () => null,
    deleteConversation: async () => {},
    isLoading: false,
    isStreaming: false,
    stopStream: () => {},
    streamingContent: '',
    thinkingContent: '',
    isThinking: false,
    thinkingDuration: 0,
    settings: { temperature: 0.7, topP: 1, maxTokens: 4096, systemPrompt: '' },
    updateSettings: () => {},
    error: null,
    refreshModels: () => {}
};

const ChatContext = createContext(defaultChatContext);

// eslint-disable-next-line react-refresh/only-export-components
export const useChatContext = () => useContext(ChatContext) ?? defaultChatContext;

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    // Load from localStorage, or null until models are fetched
    const [currentModel, setCurrentModel] = useState(() => {
        return localStorage.getItem('selectedModel') || null;
    });
    const [availableModels, setAvailableModels] = useState([]);
    const [gpuStatus, setGpuStatus] = useState('checking');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('ai-settings');
        return saved ? JSON.parse(saved) : {
            temperature: 0.7,
            topP: 1,
            maxTokens: 4096,
            systemPrompt: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('ai-settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Use the custom stream hook
    const {
        startStream,
        stopStream,
        isStreaming,
        streamingContent,
        thinkingContent,
        isThinking,
        thinkingDuration,
        // eslint-disable-next-line no-unused-vars
        streamError
    } = useStreamResponse();

    // Fetch models and GPU status on mount
    useEffect(() => {
        fetchModels();
        checkGPUStatus();

        // Periodically check GPU status
        const interval = setInterval(checkGPUStatus, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch initial conversations
    useEffect(() => {
        fetchConversations();
    }, []);

    // Load messages when conversation changes
    useEffect(() => {
        if (currentConversationId) {
            loadMessages(currentConversationId);
        } else {
            setMessages([]);
        }
    }, [currentConversationId]);

    const fetchModels = async () => {
        try {
            const data = await api.getModels();
            const models = Array.isArray(data?.models) ? data.models : [];
            setAvailableModels(models);

            // Auto-select model: savedModel > defaultModel > first available
            const savedModel = localStorage.getItem('selectedModel');
            if (savedModel && models.find(m => m.name === savedModel)) {
                setCurrentModel(savedModel);
            } else if (data.defaultModel && models.find(m => m.name === data.defaultModel)) {
                setCurrentModel(data.defaultModel);
            } else if (models.length > 0 && !currentModel) {
                // Select first available model if none set
                setCurrentModel(models[0].name);
            }
        } catch (err) {
            console.error('Failed to fetch models:', err);
            // Don't set fake fallback models - let the UI show "No models available"
            setAvailableModels([]);
        }
    };

    const checkGPUStatus = async () => {
        try {
            const data = await api.getGPUStatus();
            setGpuStatus(data.status);
            // eslint-disable-next-line no-unused-vars
        } catch (_err) {
            setGpuStatus('disconnected');
        }
    };

    const fetchConversations = async () => {
        try {
            setIsLoading(true);
            const data = await api.getConversations();
            setConversations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            setError('Failed to load conversations');
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (id) => {
        try {
            setIsLoading(true);
            const data = await api.getConversation(id);
            setMessages(Array.isArray(data?.messages) ? data.messages : []);
        } catch (err) {
            console.error('Failed to load messages:', err);
            setError('Failed to load messages');
        } finally {
            setIsLoading(false);
        }
    };

    const createNewChat = async () => {
        try {
            const data = await api.createConversation({ model: currentModel });
            setConversations(prev => [data, ...(Array.isArray(prev) ? prev : [])]);
            setCurrentConversationId(data.id);
            setMessages([]);
            return data.id;
        } catch (err) {
            console.error('Failed to create chat:', err);
            return null;
        }
    };

    const sendMessage = async (content, attachments = []) => {
        let conversationId = currentConversationId;

        // Create new chat if none selected
        if (!conversationId) {
            conversationId = await createNewChat();
            if (!conversationId) return;
        }

        // Optimistic update
        const userMessageId = `temp-${Date.now()}`;
        const userMessage = {
            id: userMessageId,
            role: 'user',
            content,
            attachments,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);

        // Start streaming response
        try {
            await startStream({
                conversationId,
                message: content,
                model: currentModel,
                options: settings,
                attachments
            });
        } catch (err) {
            console.error('Send message failed:', err);
            setError(err.message);
        }
    };

    // Refresh messages after stream ends
    useEffect(() => {
        if (!isStreaming && currentConversationId && messages.length > 0) {
            // Re-fetch to ensure consistency with DB
            loadMessages(currentConversationId);
            fetchConversations(); // Update sidebar with new title if generated
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStreaming]);

    const deleteConversation = async (id) => {
        try {
            await api.deleteConversation(id);
            setConversations(prev => (Array.isArray(prev) ? prev : []).filter(c => c.id !== id));
            if (currentConversationId === id) {
                setCurrentConversationId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err);
        }
    };

    const selectModel = (modelName) => {
        setCurrentModel(modelName);
        localStorage.setItem('selectedModel', modelName);
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            currentConversationId,
            setCurrentConversationId,
            currentModel,
            setCurrentModel: selectModel,
            availableModels,
            gpuStatus,
            messages,
            setMessages,
            sendMessage,
            createNewChat,
            deleteConversation,
            isLoading,
            isStreaming,
            stopStream,
            streamingContent,
            thinkingContent,
            isThinking,
            thinkingDuration,
            settings,
            updateSettings,
            error,
            refreshModels: fetchModels
        }}>
            {children}
        </ChatContext.Provider>
    );
};
