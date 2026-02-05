import axios from 'axios';

const API_URL = '/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const api = {
    // Chat
    streamChat: (data) => axiosInstance.post('/chat/stream', data),
    stopChat: (data) => axiosInstance.post('/chat/stop', data),

    // File Upload
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Conversations
    getConversations: async () => {
        const response = await axiosInstance.get('/conversations');
        return response.data;
    },
    getConversation: async (id) => {
        const response = await axiosInstance.get(`/conversations/${id}`);
        return response.data;
    },
    createConversation: async (data) => {
        const response = await axiosInstance.post('/conversations', data);
        return response.data;
    },
    updateConversation: async (id, data) => {
        const response = await axiosInstance.put(`/conversations/${id}`, data);
        return response.data;
    },
    deleteConversation: async (id) => {
        const response = await axiosInstance.delete(`/conversations/${id}`);
        return response.data;
    },
    deleteMessage: async (convId, msgId) => {
        const response = await axiosInstance.delete(`/conversations/${convId}/messages/${msgId}`);
        return response.data;
    },

    // Models
    getModels: async () => {
        const response = await axiosInstance.get('/models');
        return response.data;
    },
    getGPUStatus: async () => {
        const response = await axiosInstance.get('/models/status');
        return response.data;
    }
};
