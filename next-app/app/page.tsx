"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatContainer from "@/components/Chat/ChatContainer";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/components/Common/ThemeToggle";
import SettingsModal from "@/components/Common/SettingsModal";
import { PanelLeftOpen } from "lucide-react";
import "katex/dist/katex.min.css";

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <ThemeProvider>
      <ChatProvider>
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden relative">
          {isMobile && isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden
            />
          )}
          <div
            className={`fixed md:relative z-40 h-full transition-all duration-300 ease-out ${isSidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0 w-0"} bg-[var(--bg-secondary)] border-r border-[var(--border-color)]`}
          >
            <Sidebar toggle={toggleSidebar} />
          </div>
          <div className="flex-1 flex flex-col h-full relative min-w-0">
            <header className="relative flex items-center px-4 py-3 bg-[var(--bg-primary)] border-b border-transparent z-20 h-[60px]">
              <div className="absolute left-4 flex items-center gap-2 z-30">
                {!isSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
                    aria-label="Open sidebar"
                  >
                    <PanelLeftOpen className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="w-full flex justify-center pointer-events-none">
                {!isSidebarOpen && (
                  <div className="flex items-center justify-center gap-2 pointer-events-auto">
                    <span className="font-serif font-bold text-lg text-[var(--text-primary)] tracking-tight">AIFA</span>
                  </div>
                )}
              </div>
              <div className="absolute right-4 flex items-center gap-2 z-30">
                <ThemeToggle />
              </div>
            </header>
            <ChatContainer />
          </div>
        </div>
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </ChatProvider>
    </ThemeProvider>
  );
}
