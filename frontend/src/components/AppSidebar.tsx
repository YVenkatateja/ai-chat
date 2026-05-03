import { useState } from "react";
import {
  MessageSquare, FileText, FileSpreadsheet, FileStack,
  Plus, Trash2, Pin, ChevronLeft, ChevronRight,
  Cpu, Sparkles, Database, MoreHorizontal
} from "lucide-react";
import type { Conversation, AppPage } from "../lib/types";

interface Props {
  conversations: Conversation[];
  activeId: string;
  currentPage: AppPage;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onClearMemory: () => void;
  onNavigate: (page: AppPage) => void;
  totalMemory: number;
}

const NAV_ITEMS: { page: AppPage; icon: React.ReactNode; label: string; description: string; color: string }[] = [
  {
    page: "chat",
    icon: <MessageSquare size={18} />,
    label: "AI Chat",
    description: "Conversations",
    color: "from-violet-500 to-purple-600",
  },
  {
    page: "word-agent",
    icon: <FileText size={18} />,
    label: "Word Agent",
    description: "→ .docx",
    color: "from-blue-500 to-cyan-600",
  },
  {
    page: "pdf-agent",
    icon: <FileStack size={18} />,
    label: "PDF Agent",
    description: "→ .pdf",
    color: "from-red-500 to-orange-500",
  },
  {
    page: "excel-agent",
    icon: <FileSpreadsheet size={18} />,
    label: "Excel Agent",
    description: "→ .xlsx",
    color: "from-emerald-500 to-green-600",
  },
];

function timeAgo(date: Date): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AppSidebar({
  conversations, activeId, currentPage, onSelectConversation,
  onNewChat, onDelete, onPin, onClearMemory, onNavigate, totalMemory
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  const [showMemoryMenu, setShowMemoryMenu] = useState(false);

  return (
    <aside
      className={`relative flex flex-col h-screen transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-72"
      }`}
      style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          <Cpu size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>Aether</span>
            <span className="text-xs text-purple-400 ml-1.5 font-medium">Pro</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="px-3 py-3 space-y-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {!collapsed && <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2">Workspace</p>}
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} ${
                active ? "opacity-100 shadow-lg" : "opacity-50 group-hover:opacity-80"
              } transition-all`}>
                <span className="text-white">{item.icon}</span>
              </div>
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-semibold leading-none mb-0.5 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              )}
              {active && !collapsed && (
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Chat conversations (only when on chat page) */}
      {currentPage === "chat" && !collapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">History</p>
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-lg transition-all font-medium"
            >
              <Plus size={12} />
              New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-xs">No conversations yet</div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onMouseEnter={() => setHoveredConv(c.id)}
                  onMouseLeave={() => setHoveredConv(null)}
                  onClick={() => onSelectConversation(c.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    c.id === activeId
                      ? "bg-white/10 border border-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {c.pinned && <Pin size={10} className="shrink-0 text-yellow-400" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate leading-snug ${c.id === activeId ? "text-white" : "text-gray-400"}`}>
                      {c.title}
                    </p>
                    <p className="text-[10px] text-gray-700 mt-0.5 flex items-center gap-1">
                      {c.messages.length} msgs · {timeAgo(c.updatedAt)}
                    </p>
                  </div>
                  {hoveredConv === c.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onPin(c.id); }}
                        className="p-1 rounded hover:bg-white/10 text-gray-600 hover:text-yellow-400 transition-colors"
                        title={c.pinned ? "Unpin" : "Pin"}
                      >
                        <Pin size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                        className="p-1 rounded hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Memory status + controls */}
      <div className="mt-auto px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {!collapsed ? (
          <div className="relative">
            <button
              onClick={() => setShowMemoryMenu(!showMemoryMenu)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 shrink-0">
                <Database size={13} className="text-emerald-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-medium text-gray-400">Memory</p>
                <p className="text-[10px] text-gray-600">{totalMemory} conversation{totalMemory !== 1 ? "s" : ""} saved</p>
              </div>
              <MoreHorizontal size={14} className="text-gray-600 group-hover:text-gray-400" />
            </button>
            {showMemoryMenu && (
              <div
                className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden"
                style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <button
                  onClick={() => { onClearMemory(); setShowMemoryMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                  Clear All Memory
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20" title={`${totalMemory} conversations saved`}>
              <Database size={13} className="text-emerald-400" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
