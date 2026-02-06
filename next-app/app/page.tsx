"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatContainer from "@/components/Chat/ChatContainer";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SettingsModal from "@/components/Common/SettingsModal";
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
            <ChatContainer
              sidebarToggle={() => setIsSidebarOpen(true)}
              isSidebarOpen={isSidebarOpen}
            />
          </div>
        </div>
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </ChatProvider>
    </ThemeProvider>
  );
}
