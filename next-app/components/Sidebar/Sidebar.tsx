"use client";

import { useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import ModelSwitcher from "../Common/ModelSwitcher";
import { Plus, PanelLeftClose, Edit2, Trash2, Check, X, Settings } from "lucide-react";

type Conversation = { id: string; title: string | null; updatedAt?: string; createdAt?: string };

export default function Sidebar({ toggle }: { toggle: () => void }) {
  const { conversations, currentConversationId, setCurrentConversationId, createNewChat, deleteConversation } = useChatContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const list = Array.isArray(conversations) ? (conversations as Conversation[]) : [];
  const today = new Date();
  const isToday = (date: string) => new Date(date).toDateString() === today.toDateString();
  const isYesterday = (date: string) => {
    const d = new Date(date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  };
  const grouped = {
    today: list.filter((c) => isToday(c.updatedAt ?? c.createdAt ?? "")),
    yesterday: list.filter((c) => isYesterday(c.updatedAt ?? c.createdAt ?? "")),
    older: list.filter((c) => !isToday(c.updatedAt ?? c.createdAt ?? "") && !isYesterday(c.updatedAt ?? c.createdAt ?? "")),
  };

  const renderConversation = (conv: Conversation) => (
    <div
      key={conv.id}
      onClick={() => setCurrentConversationId(conv.id)}
      className={`group sidebar-int justify-between overflow-hidden ${currentConversationId === conv.id ? "active" : ""}`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {editingId === conv.id ? (
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <input
              value={editTitle}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-transparent border-b border-[var(--border-color)] outline-none text-xs w-full py-0.5 text-[var(--text-primary)]"
              autoFocus
            />
            <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-[var(--text-primary)] hover:text-emerald-500 p-0.5">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-[var(--text-muted)] hover:text-rose-500 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="truncate text-[13px]">{conv.title ?? "New Conversation"}</span>
        )}
      </div>
      {currentConversationId === conv.id && editingId !== conv.id && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title ?? ""); }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
            className="p-1 text-[var(--text-muted)] hover:text-rose-500"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  const renderSection = (title: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-2 px-3 uppercase tracking-wide opacity-80">{title}</div>
        <div className="flex flex-col gap-0.5">{items.map(renderConversation)}</div>
      </div>
    );
  };

  return (
    <div className="sidebar flex flex-col h-full w-full overflow-hidden bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
      <div className="flex items-center justify-between px-4 py-4 mt-2">
        <button type="button" className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)] font-serif font-bold text-lg tracking-tight">
          <span>AIFA</span>
        </button>
        <button type="button" onClick={toggle} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)]">
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>
      <div className="px-3 mb-6">
        <button
          type="button"
          onClick={() => createNewChat()}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-all shadow-sm border border-transparent hover:border-[var(--border-color)]"
        >
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm">
            <Plus className="w-4 h-4" />
            <span>Start new chat</span>
          </div>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin pb-4">
        {renderSection("Today", grouped.today)}
        {renderSection("Yesterday", grouped.yesterday)}
        {renderSection("Previous 7 Days", grouped.older)}
        {list.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-[var(--text-muted)] text-xs">No conversations yet.</p>
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-[var(--border-color)]">
        <ModelSwitcher sidebarMode />
      </div>
      <div className="p-3 pt-0">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--text-primary)] truncate">John Doe</div>
            <div className="text-[11px] text-[var(--text-muted)] truncate">Pro Plan</div>
          </div>
          <Settings className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
        </div>
      </div>
    </div>
  );
}
