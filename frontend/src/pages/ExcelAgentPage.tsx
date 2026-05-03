import { useState, useRef, useCallback } from "react";
import {
  FileSpreadsheet, Upload, BarChart2, MessageSquare,
  Send, Sparkles, TrendingUp, AlertCircle, X, Loader
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  summary: {
    rowCount: number;
    colCount: number;
    numericCols: string[];
    textCols: string[];
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChartData {
  title: string;
  type: "bar" | "line" | "summary";
  labels: string[];
  values: number[];
  insight: string;
}

function genId() { return Math.random().toString(36).slice(2, 8); }

// Simple CSV parser
function parseCSV(text: string): ParsedData {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [], summary: { rowCount: 0, colCount: 0, numericCols: [], textCols: [] } };
  
  const parseRow = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseRow(line);
    const row: Record<string, any> = {};
    headers.forEach((h, i) => {
      const v = vals[i] ?? "";
      const num = parseFloat(v.replace(/[,$%]/g, ""));
      row[h] = !isNaN(num) && v !== "" ? num : v;
    });
    return row;
  });

  const numericCols = headers.filter(h => rows.some(r => typeof r[h] === "number"));
  const textCols = headers.filter(h => !numericCols.includes(h));

  return { headers, rows, summary: { rowCount: rows.length, colCount: headers.length, numericCols, textCols } };
}

// Mini bar chart component (pure CSS/SVG)
function MiniBarChart({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const displayCount = Math.min(labels.length, 10);
  const displayLabels = labels.slice(0, displayCount);
  const displayValues = values.slice(0, displayCount);

  return (
    <div className="flex items-end gap-1.5 h-24 w-full mt-3">
      {displayValues.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[9px] text-gray-500 font-mono">{v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${Math.max((v / max) * 64, 4)}px`, background: color }}
          />
          <span className="text-[8px] text-gray-600 truncate w-full text-center leading-none">{String(displayLabels[i]).slice(0, 8)}</span>
        </div>
      ))}
    </div>
  );
}

export function ExcelAgentPage() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fileName, setFileName] = useState("");
  const [rawCsv, setRawCsv] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "report">("chat");
  const [report, setReport] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawCsv(text);
      const parsed = parseCSV(text);
      setParsedData(parsed);
      setMessages([]);
      setCharts([]);
      setReport("");
      autoGenerateCharts(parsed);
    };
    reader.readAsText(file);
  };

  const autoGenerateCharts = (data: ParsedData) => {
    if (data.summary.numericCols.length === 0) return;
    const chartList: ChartData[] = [];

    // Generate chart for first 3 numeric columns
    data.summary.numericCols.slice(0, 3).forEach((col) => {
      const labelCol = data.summary.textCols[0];
      const labels = labelCol
        ? data.rows.slice(0, 10).map((r) => String(r[labelCol]).slice(0, 12))
        : data.rows.slice(0, 10).map((_, i) => `Row ${i + 1}`);
      const values = data.rows.slice(0, 10).map((r) => Number(r[col]) || 0);
      const total = values.reduce((a, b) => a + b, 0);
      const avg = total / values.length;
      const max = Math.max(...values);
      chartList.push({
        title: col,
        type: "bar",
        labels,
        values,
        insight: `Total: ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Avg: ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Max: ${max.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      });
    });
    setCharts(chartList);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming || !parsedData) return;
    const userMsg: Message = { id: genId(), role: "user", content: input.trim() };
    const assistantId = genId();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    const dataContext = `
CSV Data Summary:
- File: ${fileName}
- Rows: ${parsedData.summary.rowCount}, Columns: ${parsedData.summary.colCount}
- Headers: ${parsedData.headers.join(", ")}
- Numeric columns: ${parsedData.summary.numericCols.join(", ")}
- Text columns: ${parsedData.summary.textCols.join(", ")}

First 20 rows of data:
${parsedData.rows.slice(0, 20).map(r => JSON.stringify(r)).join("\n")}
    `.trim();

    try {
      const response = await fetch("/api/agent/excel-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg.content,
          dataContext,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.body) throw new Error("No stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + data.text } : m));
            if (data.done) setIsStreaming(false);
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: "⚠️ Error analyzing data." } : m));
    }
    setIsStreaming(false);
  }, [input, isStreaming, parsedData, messages, fileName]);

  const generateReport = useCallback(async () => {
    if (!parsedData || isAnalyzing) return;
    setIsAnalyzing(true);
    setReport("");
    setActiveTab("report");

    const dataContext = `
File: ${fileName}
Rows: ${parsedData.summary.rowCount}, Columns: ${parsedData.summary.colCount}
Headers: ${parsedData.headers.join(", ")}
Numeric columns: ${parsedData.summary.numericCols.join(", ")}
Sample data (first 30 rows):
${parsedData.rows.slice(0, 30).map(r => JSON.stringify(r)).join("\n")}
    `.trim();

    try {
      const response = await fetch("/api/agent/excel-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataContext, fileName }),
      });

      if (!response.body) throw new Error("No stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) setReport((p) => p + data.text);
            if (data.done) setIsAnalyzing(false);
          } catch {}
        }
      }
    } catch {
      setReport("⚠️ Error generating report.");
    }
    setIsAnalyzing(false);
  }, [parsedData, isAnalyzing, fileName]);

  const CHART_COLORS = [
    "linear-gradient(180deg, #8b5cf6, #6d28d9)",
    "linear-gradient(180deg, #06b6d4, #0e7490)",
    "linear-gradient(180deg, #10b981, #059669)",
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg, #060614 0%, #061410 50%, #060614 100%)" }}>
      {/* Header */}
      <div className="shrink-0 px-8 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <FileSpreadsheet size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Excel Analyzer Agent</h1>
              <p className="text-sm text-gray-500 mt-0.5">Upload a CSV/Excel file — chat with your data and generate reports</p>
            </div>
          </div>
          {parsedData && (
            <div className="flex items-center gap-3">
              <button
                onClick={generateReport}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                {isAnalyzing ? <Loader size={15} className="animate-spin" /> : <TrendingUp size={15} />}
                {isAnalyzing ? "Generating..." : "Auto Report"}
              </button>
            </div>
          )}
        </div>
      </div>

      {!parsedData ? (
        // Upload state
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            onDragOver={(e) => e.preventDefault()}
            className="w-full max-w-lg flex flex-col items-center justify-center gap-5 p-16 rounded-3xl cursor-pointer transition-all"
            style={{ border: "2px dashed rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.04)" }}
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <FileSpreadsheet size={36} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white mb-1">Drop your CSV file here</p>
              <p className="text-sm text-gray-500">or click to browse · Supports .csv files</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><BarChart2 size={12} /> Auto charts</span>
              <span className="text-gray-700">·</span>
              <span className="flex items-center gap-1"><MessageSquare size={12} /> Chat with data</span>
              <span className="text-gray-700">·</span>
              <span className="flex items-center gap-1"><TrendingUp size={12} /> AI reports</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
      ) : (
        // Data loaded state
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Charts panel */}
          <div className="w-80 shrink-0 flex flex-col border-r border-white/5 overflow-y-auto">
            {/* File info */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-gray-300 truncate max-w-[140px]">{fileName}</span>
                </div>
                <button onClick={() => { setParsedData(null); setFileName(""); setMessages([]); setCharts([]); setReport(""); }}
                  className="p-1 rounded hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors"><X size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Rows", value: parsedData.summary.rowCount },
                  { label: "Columns", value: parsedData.summary.colCount },
                  { label: "Numeric", value: parsedData.summary.numericCols.length },
                  { label: "Text", value: parsedData.summary.textCols.length },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-lg font-bold text-emerald-400">{s.value}</p>
                    <p className="text-[10px] text-gray-600 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Auto Charts</p>
              {charts.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle size={20} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No numeric data found for charts</p>
                </div>
              ) : (
                charts.map((chart, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart2 size={13} className="text-emerald-400" />
                      <p className="text-xs font-semibold text-gray-300 truncate">{chart.title}</p>
                    </div>
                    <p className="text-[10px] text-gray-600 mb-2">{chart.insight}</p>
                    <MiniBarChart labels={chart.labels} values={chart.values} color={CHART_COLORS[i % CHART_COLORS.length]} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Chat + Report */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="shrink-0 flex border-b border-white/5">
              {[
                { key: "chat", icon: <MessageSquare size={14} />, label: "Chat with Data" },
                { key: "report", icon: <TrendingUp size={14} />, label: "AI Report" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-all border-b-2 ${
                    activeTab === tab.key
                      ? "text-emerald-400 border-emerald-400"
                      : "text-gray-600 border-transparent hover:text-gray-400"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "chat" ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <Sparkles size={28} className="text-emerald-400" />
                      </div>
                      <p className="text-gray-400 font-medium mb-1">Ask anything about your data</p>
                      <p className="text-gray-600 text-sm mb-6">e.g. "What is the total revenue?" or "Which category has the highest average?"</p>
                      <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                        {[
                          "What are the top 5 rows by value?",
                          "Summarize the key statistics",
                          "Which column has the most variation?",
                          "Find any anomalies or outliers",
                        ].map((q) => (
                          <button key={q} onClick={() => setInput(q)}
                            className="text-left text-xs px-4 py-3 rounded-xl text-gray-500 hover:text-gray-300 transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                            msg.role === "user"
                              ? "text-white rounded-tr-sm"
                              : "text-gray-300 rounded-tl-sm"
                          }`}
                            style={msg.role === "user"
                              ? { background: "linear-gradient(135deg, #10b981, #059669)" }
                              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
                            }>
                            {msg.role === "assistant" ? (
                              <div className="prose-chat">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                {isStreaming && !msg.content && (
                                  <div className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                                )}
                              </div>
                            ) : msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>

                {/* Chat input */}
                <div className="shrink-0 p-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                      placeholder="Ask about your data..."
                      className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || isStreaming}
                      className="px-4 py-3 rounded-xl text-white transition-all disabled:opacity-30"
                      style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Report tab
              <div className="flex-1 overflow-y-auto p-6">
                {!report && !isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <TrendingUp size={28} className="text-emerald-400" />
                    </div>
                    <p className="text-gray-400 font-medium mb-1">No report generated yet</p>
                    <p className="text-gray-600 text-sm mb-4">Click "Auto Report" to generate a full AI analysis</p>
                    <button onClick={generateReport}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                      <TrendingUp size={15} /> Generate Report
                    </button>
                  </div>
                ) : (
                  <div className="prose-chat text-gray-300 text-sm leading-relaxed max-w-3xl mx-auto">
                    <ReactMarkdown>{report}</ReactMarkdown>
                    {isAnalyzing && <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-0.5 animate-pulse rounded-sm" />}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CHART_COLORS = [
  "linear-gradient(180deg, #8b5cf6, #6d28d9)",
  "linear-gradient(180deg, #06b6d4, #0e7490)",
  "linear-gradient(180deg, #10b981, #059669)",
];
