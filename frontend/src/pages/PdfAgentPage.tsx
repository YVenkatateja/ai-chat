import { useState, useRef } from "react";
import { FileText, Upload, Wand2, Download, Copy, Check, X, Sparkles, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";

const TEMPLATES = [
  { icon: "📑", label: "Research Paper", prompt: "Format as a structured research paper with Abstract, Introduction, Methodology, Results, Discussion, and References sections." },
  { icon: "🧾", label: "Invoice / Receipt", prompt: "Format as a professional invoice with itemized list, totals, payment terms, and company details." },
  { icon: "📜", label: "Legal Contract", prompt: "Format as a formal legal document with numbered clauses, definitions, terms and conditions, and signature blocks." },
  { icon: "📰", label: "Newsletter", prompt: "Format as a visually organized newsletter with headline, sections, callout boxes, and a clear reading flow." },
  { icon: "🏆", label: "Certificate", prompt: "Format as an achievement certificate with formal language, recipient details, title, and authorization lines." },
  { icon: "📋", label: "Resume / CV", prompt: "Format as a professional resume with contact info, summary, experience, education, and skills sections." },
];

export function PdfAgentPage() {
  const [inputText, setInputText] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [result, setResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setInputText(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const getInstruction = () => {
    if (customInstruction.trim()) return customInstruction;
    if (selectedTemplate !== null) return TEMPLATES[selectedTemplate].prompt;
    return "Format this text as a polished, print-ready PDF document with clear structure, professional headings, and proper section organization.";
  };

  const handleProcess = async () => {
    if (!inputText.trim() || isProcessing) return;
    setResult("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/agent/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, instruction: getInstruction() }),
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
            if (data.text) setResult((p) => p + data.text);
            if (data.done) setIsProcessing(false);
          } catch {}
        }
      }
    } catch {
      setResult("⚠️ Error processing. Please check your backend connection.");
    }
    setIsProcessing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted-pdf-content.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg, #060614 0%, #0f0812 50%, #060614 100%)" }}>
      {/* Header */}
      <div className="shrink-0 px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #ef4444, #f97316)" }}>
            <Layers size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>PDF Document Agent</h1>
            <p className="text-sm text-gray-500 mt-0.5">Convert any text into a print-ready, professionally structured PDF</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Left: Input */}
        <div className="w-1/2 flex flex-col border-r border-white/5 p-6 gap-4 overflow-y-auto">
          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">PDF Templates</p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedTemplate(i === selectedTemplate ? null : i); setCustomInstruction(""); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium border ${
                    selectedTemplate === i
                      ? "bg-red-500/20 border-red-500/40 text-red-300"
                      : "bg-white/3 border-white/8 text-gray-400 hover:bg-white/5 hover:text-gray-300"
                  }`}
                >
                  <span className="text-base leading-none">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom instruction */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Custom Formatting Instructions</p>
            <textarea
              value={customInstruction}
              onChange={(e) => { setCustomInstruction(e.target.value); setSelectedTemplate(null); }}
              placeholder="e.g. 'Create a 2-column layout with sidebar notes' or 'Add page breaks between sections'..."
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 resize-none outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          {/* Text input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Source Content</p>
              <div className="flex items-center gap-2">
                {fileName && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <FileText size={11} /> {fileName}
                    <button onClick={() => { setFileName(""); setInputText(""); }} className="text-gray-500 hover:text-red-400 ml-1"><X size={11} /></button>
                  </span>
                )}
                <button onClick={() => fileRef.current?.click()} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                  <Upload size={12} /> Upload
                </button>
                <input ref={fileRef} type="file" accept=".txt,.md,.text" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              </div>
            </div>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your content here, or drop a file above...&#10;&#10;The AI will organize, format, and structure it as a polished PDF-ready document."
                rows={14}
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-700 resize-none outline-none font-mono leading-relaxed"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={!inputText.trim() || isProcessing}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
            style={{ background: "linear-gradient(135deg, #ef4444, #f97316)" }}
          >
            <Wand2 size={16} className={isProcessing ? "animate-spin" : ""} />
            {isProcessing ? "Structuring PDF Content..." : "Format for PDF"}
          </button>
        </div>

        {/* Right: Output */}
        <div className="w-1/2 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">PDF-Ready Output</p>
            {result && (
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                  <Download size={13} /> Download
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 rounded-xl overflow-y-auto p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {!result && !isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <Sparkles size={28} className="text-red-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium">PDF-structured content will appear here</p>
                <p className="text-gray-700 text-xs mt-1">Add your content → pick a template → format</p>
              </div>
            ) : (
              <div className="prose-chat text-gray-300 text-sm leading-relaxed">
                <ReactMarkdown>{result}</ReactMarkdown>
                {isProcessing && <span className="inline-block w-1.5 h-4 bg-red-400 ml-0.5 animate-pulse rounded-sm" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
