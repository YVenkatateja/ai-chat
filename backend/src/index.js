import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = path.join(__dirname, "../memory.json");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function streamToRes(res, messages, systemPrompt) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  try {
    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Groq error:", err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.post("/api/memory/save", (req, res) => {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({ conversations: req.body.conversations, savedAt: new Date() }, null, 2));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Save failed" }); }
});

app.get("/api/memory/load", (req, res) => {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return res.json({ conversations: [] });
    res.json(JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8")));
  } catch { res.json({ conversations: [] }); }
});

app.post("/api/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages array is required" });
  await streamToRes(res, messages, systemPrompt || "You are a helpful, thoughtful, and concise AI assistant.");
});

app.post("/api/chat-with-doc", async (req, res) => {
  const { messages, documentText, fileName } = req.body;
  if (!messages || !documentText) return res.status(400).json({ error: "messages and documentText required" });
  const sys = `You are a helpful AI assistant. The user uploaded a document called "${fileName}". Use it to answer their questions accurately.\n\n--- DOCUMENT CONTENT ---\n${documentText.slice(0, 8000)}\n--- END ---`;
  await streamToRes(res, messages, sys);
});

app.post("/api/agent/word", async (req, res) => {
  const { text, instruction } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  const sys = `You are a professional document formatter. Transform raw text into beautifully structured Markdown that renders like a polished Word document. Use proper headings, sections, bullet points, bold text, and tables. Keep all original information — only improve structure and formatting.`;
  await streamToRes(res, [{ role: "user", content: instruction + "\n\n---\n\n" + text }], sys);
});

app.post("/api/agent/pdf", async (req, res) => {
  const { text, instruction } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  const sys = `You are a PDF document specialist. Format raw text into a professionally structured, print-ready document. Use clear section breaks, Markdown tables for tabular data, blockquotes for callouts, and ensure it flows naturally for a print layout. Begin with a clear title and document metadata.`;
  await streamToRes(res, [{ role: "user", content: instruction + "\n\n---\n\n" + text }], sys);
});

app.post("/api/agent/excel-chat", async (req, res) => {
  const { question, dataContext, history = [] } = req.body;
  if (!question || !dataContext) return res.status(400).json({ error: "question and dataContext required" });
  const sys = `You are an expert data analyst. The user uploaded a CSV file. Here is the data:\n\n${dataContext}\n\nAnswer questions clearly. Perform calculations accurately. Use Markdown tables for comparisons. Be concise but thorough.`;
  await streamToRes(res, [...history, { role: "user", content: question }], sys);
});

app.post("/api/agent/excel-report", async (req, res) => {
  const { dataContext, fileName } = req.body;
  if (!dataContext) return res.status(400).json({ error: "dataContext required" });
  const sys = `You are a senior business data analyst. Generate comprehensive, insightful analysis reports.`;
  const prompt = `Analyze this dataset and write a full professional report.\n\n${dataContext}\n\nInclude: Executive Summary, Dataset Overview, Key Statistics (min/max/avg/total per numeric column), Top 5 Findings, Trends & Patterns, Anomalies, Recommendations, and Conclusion. File: ${fileName || "Dataset"}. Use clear Markdown formatting with headers.`;
  await streamToRes(res, [{ role: "user", content: prompt }], sys);
});

app.listen(PORT, () => {
  console.log("Backend running at http://localhost:" + PORT);
  console.log("Memory file: " + MEMORY_FILE);
  console.log("Groq key loaded:", process.env.GROQ_API_KEY?.slice(0, 8));
});
