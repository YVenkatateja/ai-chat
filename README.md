# Aether — AI Chat Assistant

A full-stack AI chat app powered by Claude (Anthropic). Real-time streaming, document Q&A, conversation history, and a refined editorial UI.

---

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Anthropic SDK (streaming)
- **AI**: Claude claude-sonnet-4-20250514 via Server-Sent Events

---

## Setup & Run

### 1. Get your Anthropic API key
Sign up at https://console.anthropic.com and copy your API key.

---

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Then edit .env and paste your ANTHROPIC_API_KEY

# Run in development (auto-restarts on change)
npm run dev

# OR run in production mode
npm start
```

Backend runs at: **http://localhost:3001**

---

### 3. Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Features

| Feature | Description |
|---|---|
| 💬 Real-time chat | Streaming responses via SSE |
| 📄 Document Q&A | Drop any `.txt` file to chat with it |
| 🧵 Conversations | Multiple sessions with auto-titles |
| ⚙️ System prompt | Customize AI persona per session |
| 🗑️ Delete chats | Clean up conversations from sidebar |

---

## Project Structure

```
ai-chat/
├── backend/
│   ├── src/index.js        # Express server + Anthropic streaming
│   ├── .env.example        # Copy this to .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx             # Root layout + empty state
    │   ├── components/
    │   │   ├── Sidebar.tsx         # Conversation list
    │   │   ├── MessageBubble.tsx   # Chat messages (Markdown)
    │   │   ├── ChatInput.tsx       # Input + file attach
    │   │   └── SystemPromptModal.tsx
    │   ├── hooks/useChat.ts    # All chat state logic
    │   └── lib/
    │       ├── api.ts          # Backend API calls
    │       └── types.ts        # TypeScript types
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | Standard chat with streaming |
| POST | `/api/chat-with-doc` | Document Q&A with streaming |
