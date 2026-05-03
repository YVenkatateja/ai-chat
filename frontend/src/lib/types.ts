export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  document?: { name: string; text: string };
  pinned?: boolean;
}

export type AppPage = "chat" | "word-agent" | "pdf-agent" | "excel-agent";
