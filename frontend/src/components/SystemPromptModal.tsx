import { useState } from "react";
import { Settings, X, Check } from "lucide-react";

interface Props {
  systemPrompt: string;
  onSave: (prompt: string) => void;
}

export function SystemPromptModal({ systemPrompt, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(systemPrompt);

  const handleSave = () => {
    onSave(draft);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => { setDraft(systemPrompt); setOpen(true); }}
        className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
        title="System prompt settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-cream border border-ink-200 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
              <h2 className="font-display text-lg text-ink-800">System Prompt</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-ink-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-ink-400 mb-3">
                Define the AI's persona, instructions, and behavior. This applies to all messages in the current session.
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                className="w-full text-sm text-ink-800 bg-parchment border border-ink-200 rounded-xl px-4 py-3 outline-none focus:border-ink-400 resize-none font-body leading-relaxed placeholder-ink-300"
                placeholder="You are a helpful assistant…"
              />
            </div>
            <div className="flex justify-end gap-2 px-6 pb-5">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-ink-500 hover:text-ink-800 transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-ink-800 text-cream rounded-lg hover:bg-accent transition-colors font-medium"
              >
                <Check size={14} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
