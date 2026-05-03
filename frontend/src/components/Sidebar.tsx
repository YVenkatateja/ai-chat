import { Plus, Trash2, MessageSquare, ChevronRight } from "lucide-react";
import type { Conversation } from "../lib/types";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function formatTime(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  collapsed,
  onToggle,
}: Props) {
  return (
    <aside
      className={`relative flex flex-col transition-all duration-300 bg-ink-900 border-r border-ink-700 ${
        collapsed ? "w-14" : "w-64"
      }`}
      style={{ minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-ink-700">
        {!collapsed && (
          <span className="font-display text-lg text-cream tracking-wide">
            Aether
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-md text-ink-400 hover:text-cream hover:bg-ink-700 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
          />
        </button>
      </div>

      {/* New chat button */}
      <div className="px-2 py-3">
        <button
          onClick={onNew}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent-light border border-accent/30 transition-all text-sm font-medium ${
            collapsed ? "justify-center" : ""
          }`}
          title="New conversation"
        >
          <Plus size={15} />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      {/* Conversations */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group relative flex items-center rounded-lg transition-all cursor-pointer ${
                c.id === activeId
                  ? "bg-ink-700 text-cream"
                  : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"
              }`}
              onClick={() => onSelect(c.id)}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0 px-3 py-2.5">
                <MessageSquare size={13} className="mt-0.5 shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-snug">
                    {c.title}
                  </p>
                  <p className="text-[10px] opacity-40 mt-0.5">
                    {formatTime(c.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded text-ink-400 hover:text-red-400 transition-all"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-ink-700">
          <p className="text-[10px] text-ink-500 text-center">
            Powered by Claude
          </p>
        </div>
      )}
    </aside>
  );
}
