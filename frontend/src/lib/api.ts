import type { Message } from "./types";

const BASE = "/api";

export async function streamChat(
  messages: Message[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const response = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      systemPrompt,
    }),
  });
  if (!response.ok || !response.body) { onError("Failed to connect to AI backend."); return; }
  await readSSE(response, onChunk, onDone, onError);
}

export async function streamChatWithDoc(
  messages: Message[],
  documentText: string,
  fileName: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const response = await fetch(`${BASE}/chat-with-doc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      documentText, fileName,
    }),
  });
  if (!response.ok || !response.body) { onError("Failed to connect."); return; }
  await readSSE(response, onChunk, onDone, onError);
}

export async function streamAgentTask(
  endpoint: string,
  payload: Record<string, any>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const response = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok || !response.body) { onError("Agent failed to connect."); return; }
  await readSSE(response, onChunk, onDone, onError);
}

async function readSSE(
  response: Response,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.text) onChunk(data.text);
        if (data.done) onDone();
        if (data.error) onError(data.error);
      } catch {}
    }
  }
}
