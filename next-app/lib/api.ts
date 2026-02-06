const API = "/api";

export const api = {
  getConversations: async () => {
    const res = await fetch(`${API}/conversations`, { cache: "no-store", credentials: "same-origin" });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },
  getConversation: async (id: string) => {
    const res = await fetch(`${API}/conversations/${id}`, { cache: "no-store", credentials: "same-origin" });
    if (!res.ok) throw new Error("Failed to fetch conversation");
    return res.json();
  },
  createConversation: async (data?: { title?: string; model?: string }) => {
    const res = await fetch(`${API}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    return res.json();
  },
  updateConversation: async (id: string, data: { title?: string; model?: string }) => {
    const res = await fetch(`${API}/conversations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update conversation");
    return res.json();
  },
  deleteConversation: async (id: string) => {
    const res = await fetch(`${API}/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete conversation");
    return res.json();
  },
  deleteMessage: async (convId: string, msgId: string) => {
    const res = await fetch(`${API}/conversations/${convId}/messages/${msgId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete message");
    return res.json();
  },
  getModels: async () => {
    const res = await fetch(`${API}/models`);
    if (!res.ok) throw new Error("Failed to fetch models");
    return res.json();
  },
  getGPUStatus: async () => {
    const res = await fetch(`${API}/models/status`);
    if (!res.ok) throw new Error("Failed to fetch status");
    return res.json();
  },
  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return { ...data, id: data.path ?? data.filename ?? crypto.randomUUID() };
  },
};
