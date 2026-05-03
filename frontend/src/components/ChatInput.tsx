import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, X, FileText } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  onAttach: (name: string, text: string) => void;
  onRemoveDoc: () => void;
  isStreaming: boolean;
  document?: { name: string; text: string };
}

export function ChatInput({ onSend, onAttach, onRemoveDoc, isStreaming, document }: Props) {
  const [value, setValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onAttach(file.name, text);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md"))) {
      readFile(file);
    }
  };

  return (
    <div className="border-t border-ink-100 bg-cream/80 backdrop-blur-sm px-4 py-3">
      {/* Document badge */}
      {document && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg w-fit">
          <FileText size={13} className="text-accent" />
          <span className="text-xs text-accent font-medium truncate max-w-[200px]">
            {document.name}
          </span>
          <button
            onClick={onRemoveDoc}
            className="text-accent/60 hover:text-accent transition-colors ml-1"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div
        className={`flex items-end gap-2 p-2 rounded-2xl border transition-all bg-white ${
          dragOver
            ? "border-accent shadow-md ring-2 ring-accent/20"
            : "border-ink-200 focus-within:border-ink-400 focus-within:shadow-sm"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* File attach */}
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.text"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 p-2 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
          title="Attach text file"
        >
          <Paperclip size={17} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={document ? `Ask about ${document.name}…` : "Message Aether…"}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-ink-800 placeholder-ink-300 outline-none py-2 max-h-[180px] font-body leading-relaxed"
          disabled={isStreaming}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          className="shrink-0 p-2 rounded-xl bg-ink-800 text-cream hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Send"
        >
          <Send size={15} />
        </button>
      </div>

      <p className="text-center text-[10px] text-ink-300 mt-2">
        Shift+Enter for newline · Drop .txt files to chat with documents
      </p>
    </div>
  );
}
