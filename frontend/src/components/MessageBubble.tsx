import ReactMarkdown from "react-markdown";
import type { Message } from "../lib/types";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 animate-fade-up ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mt-0.5 ${
          isUser
            ? "bg-accent text-white"
            : "bg-ink-800 text-ink-300 border border-ink-700"
        }`}
      >
        {isUser ? "Y" : "A"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-ink-800 text-ink-100 rounded-tr-sm"
              : "bg-white border border-ink-100 text-ink-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              {message.content ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : isStreaming ? (
                <TypingDots />
              ) : null}
              {isStreaming && message.content && (
                <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
          )}
        </div>
        <span className="text-[10px] text-ink-400 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse-dot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}
