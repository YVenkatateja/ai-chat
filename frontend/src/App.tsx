import { useEffect, useRef, useState } from "react";
import { useChat } from "./hooks/useChat";
import { AppSidebar } from "./components/AppSidebar";
import { MessageBubble } from "./components/MessageBubble";
import { ChatInput } from "./components/ChatInput";
import { SystemPromptModal } from "./components/SystemPromptModal";
import { WordAgentPage } from "./pages/WordAgentPage";
import { PdfAgentPage } from "./pages/PdfAgentPage";
import { ExcelAgentPage } from "./pages/ExcelAgentPage";
import { loadPageFromLocal, savePageToLocal } from "./lib/memory";
import type { AppPage } from "./lib/types";
import { Sparkles } from "lucide-react";

const STARTERS = [
  "Explain quantum entanglement simply",
  "Write a haiku about the ocean at dawn",
  "What's the difference between TCP and UDP?",
  "Help me brainstorm names for a coffee brand",
  "Summarize the history of jazz in 3 paragraphs",
  "Debug: why does 0.1 + 0.2 not equal 0.3 in JS?",
];

export default function App() {
  const {
    conversations, active, activeId, setActiveId, isStreaming,
    systemPrompt, setSystemPrompt, sendMessage, newConversation,
    deleteConversation, pinConversation, clearAllMemory,
    attachDocument, removeDocument,
  } = useChat();

  const [currentPage, setCurrentPage] = useState<AppPage>(() => loadPageFromLocal() as AppPage);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
    savePageToLocal(page);
  };

  const isEmpty = !active || active.messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060614", fontFamily: "'DM Sans', sans-serif" }}>
      <AppSidebar
        conversations={conversations}
        activeId={activeId}
        currentPage={currentPage}
        onSelectConversation={(id) => { setActiveId(id); handleNavigate("chat"); }}
        onNewChat={newConversation}
        onDelete={deleteConversation}
        onPin={pinConversation}
        onClearMemory={clearAllMemory}
        onNavigate={handleNavigate}
        totalMemory={conversations.length}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {currentPage === "chat" && (
          <>
            {/* Chat header */}
            <header className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-white/5"
              style={{ background: "rgba(6,6,20,0.8)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-sm font-semibold text-gray-300 truncate max-w-xs">
                  {active?.title || "New conversation"}
                </h1>
                {active?.document && (
                  <span className="shrink-0 text-[10px] px-2 py-1 rounded-full font-semibold"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                    doc mode
                  </span>
                )}
              </div>
              <SystemPromptModal systemPrompt={systemPrompt} onSave={setSystemPrompt} />
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {isEmpty ? (
                <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-2xl"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    How can I help?
                  </h2>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Ask me anything — or drop a .txt file to chat with your documents
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {STARTERS.map((s) => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="text-left px-4 py-3 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-all leading-snug"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-5">
                  {active.messages.map((msg, i) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isStreaming={isStreaming && i === active.messages.length - 1 && msg.role === "assistant"}
                    />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="max-w-3xl w-full mx-auto">
              <ChatInput
                onSend={sendMessage}
                onAttach={attachDocument}
                onRemoveDoc={removeDocument}
                isStreaming={isStreaming}
                document={active?.document}
              />
            </div>
          </>
        )}

        {currentPage === "word-agent" && <WordAgentPage />}
        {currentPage === "pdf-agent" && <PdfAgentPage />}
        {currentPage === "excel-agent" && <ExcelAgentPage />}
      </main>
    </div>
  );
}
