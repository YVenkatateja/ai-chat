import { useState, useCallback, useEffect, useRef } from "react";
import type { Message, Conversation } from "../lib/types";
import { streamChat, streamChatWithDoc } from "../lib/api";
import {
  saveToLocal, loadFromLocal, syncToBackend, loadFromBackend, debounce
} from "../lib/memory";

function genId() { return Math.random().toString(36).slice(2, 10); }

function makeConversation(): Conversation {
  const now = new Date();
  return { id: genId(), title: "New conversation", messages: [], createdAt: now, updatedAt: now };
}

const debouncedSync = debounce((convs: Conversation[]) => syncToBackend(convs), 2000);

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const local = loadFromLocal();
    return local.length > 0 ? local : [makeConversation()];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const local = loadFromLocal();
    return local.length > 0 ? local[0].id : "";
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful, thoughtful, and concise AI assistant. Respond clearly and accurately."
  );
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    loadFromBackend().then((backendConvs) => {
      if (backendConvs && backendConvs.length > 0) {
        setConversations(backendConvs);
        setActiveId(backendConvs[0].id);
        saveToLocal(backendConvs);
      }
    });
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;
    saveToLocal(conversations);
    debouncedSync(conversations);
  }, [conversations]);

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const updateConversation = useCallback(
    (id: string, updater: (c: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    }, []
  );

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming || !active) return;
    const userMsg: Message = { id: genId(), role: "user", content: content.trim(), timestamp: new Date() };
    const assistantId = genId();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", timestamp: new Date() };
    const isFirst = active.messages.length === 0;
    const title = isFirst ? content.trim().slice(0, 42) + (content.length > 42 ? "..." : "") : active.title;

    updateConversation(activeId, (c) => ({
      ...c, title, updatedAt: new Date(),
      messages: [...c.messages, userMsg, assistantMsg],
    }));
    setIsStreaming(true);
    const allMessages = [...active.messages, userMsg];

    const onChunk = (text: string) => updateConversation(activeId, (c) => ({
      ...c, messages: c.messages.map((m) => m.id === assistantId ? { ...m, content: m.content + text } : m),
    }));
    const onDone = () => setIsStreaming(false);
    const onError = (err: string) => {
      updateConversation(activeId, (c) => ({
        ...c, messages: c.messages.map((m) => m.id === assistantId ? { ...m, content: "Error: " + err } : m),
      }));
      setIsStreaming(false);
    };

    if (active.document) {
      await streamChatWithDoc(allMessages, active.document.text, active.document.name, onChunk, onDone, onError);
    } else {
      await streamChat(allMessages, systemPrompt, onChunk, onDone, onError);
    }
  }, [active, activeId, isStreaming, systemPrompt, updateConversation]);

  const newConversation = useCallback(() => {
    const c = makeConversation();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) { const fresh = makeConversation(); setActiveId(fresh.id); return [fresh]; }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }, [activeId]);

  const pinConversation = useCallback((id: string) => {
    updateConversation(id, (c) => ({ ...c, pinned: !c.pinned }));
  }, [updateConversation]);

  const clearAllMemory = useCallback(() => {
    const fresh = makeConversation();
    setConversations([fresh]);
    setActiveId(fresh.id);
    try { localStorage.removeItem("aether_conversations"); } catch {}
  }, []);

  const attachDocument = useCallback((name: string, text: string) => {
    updateConversation(activeId, (c) => ({ ...c, document: { name, text }, title: "Doc: " + name.slice(0, 28) }));
  }, [activeId, updateConversation]);

  const removeDocument = useCallback(() => {
    updateConversation(activeId, (c) => { const { document: _, ...rest } = c; return rest; });
  }, [activeId, updateConversation]);

  const sorted = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return {
    conversations: sorted, active, activeId, setActiveId, isStreaming,
    systemPrompt, setSystemPrompt, sendMessage, newConversation, deleteConversation,
    pinConversation, clearAllMemory, attachDocument, removeDocument,
  };
}
