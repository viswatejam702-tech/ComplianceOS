import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, Send, Sparkles, Plus, AlertCircle, RefreshCw, CheckCircle2, XCircle, 
  Layers, Shield, Layout, Settings, Cpu, HelpCircle, Terminal 
} from "lucide-react";
import { ChatMessage, Control, Integration } from "../types";
import { apiFetch } from "../lib/api";

interface AIAgentTabProps {
  orgId: string;
  controls: Control[];
  integrations: Integration[];
  focusControlId?: string;
  onTriggerChecks?: () => void;
  onTriggerPolicyDraft?: (type: string) => void;
  onAssignControl?: (controlId: string, assigneeId: string) => void;
}

interface ChatSession {
  id: string;
  title: string;
  lastMsg: string;
  date: string;
}

export default function AIAgentTab({
  orgId,
  controls,
  integrations,
  focusControlId,
  onTriggerChecks,
  onTriggerPolicyDraft,
  onAssignControl
}: AIAgentTabProps) {
  const [activeSessionId, setActiveSessionId] = useState("session-1");
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "session-1", title: "SOC 2 Trust Criteria", lastMsg: "Check encryption standard for CC6.1...", date: "Just Now" },
    { id: "session-2", title: "AWS Gap Analysis", lastMsg: "S3 public read findings active...", date: "2 Hours Ago" },
    { id: "session-3", title: "ISO 27001 Policies Review", lastMsg: "Draft Annex A policy documents...", date: "Yesterday" }
  ]);

  const [activeControlId, setActiveControlId] = useState<string>(focusControlId || "");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "RECON-INITIATED. I am AuditorGPT, your technical compliance officer. Scanning regulatory framework telemetry... All systems ready. Select an assessment context, or fire a command query directly below.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `chat-${Math.random().toString(36).substring(4)}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
      controlId: activeControlId
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    // Update active session last message preview text
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, lastMsg: textToSend.substring(0, 40) + "..." } : s));

    try {
      const response = await apiFetch(`/api/orgs/${orgId}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          controlId: activeControlId || undefined
        })
      });

      if (!response.ok) throw new Error("Network response failed");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `chat-${Math.random().toString(36).substring(4)}`,
          role: "model",
          text: data.message,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);

      if (data.trigger) {
        handleTriggerAction(data.trigger);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: "chat-err",
          role: "model",
          text: "I encountered a transient connection issue. Please ensure process.env.GEMINI_API_KEY is configured under Secrets to enable production AI responses, or try again.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAction = (actionType: string) => {
    if (actionType === "run_checks" && onTriggerChecks) {
      onTriggerChecks();
      setMessages((prev) => [
        ...prev,
        {
          id: `action-${Date.now()}`,
          role: "model",
          text: "🚀 **Action Initiated**: Core compliance engines are sweeping integrated accounts right now. I will notify you once new telemetry clears.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const handleNewSession = () => {
    const nextId = `session-${Date.now()}`;
    const newSess: ChatSession = {
      id: nextId,
      title: "New AI Compliance Scope",
      lastMsg: "Awaiting input text...",
      date: "Just Now"
    };
    setSessions([newSess, ...sessions]);
    setActiveSessionId(nextId);
    setMessages([
      {
        id: "welcome-new",
        role: "model",
        text: "NEW TELEMETRY STREAM SESSION. Binders loaded. Type a prompt or use the quick templates to evaluate gaps.",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleQuickTrigger = (promptText: string, contextId?: string) => {
    if (contextId) {
      setActiveControlId(contextId);
    }
    setInputText(promptText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] select-none">
      {/* LEFT PANEL: 280px equivalent structure (lg:col-span-3) */}
      <div className="lg:col-span-3 bg-[#080818]/90 border border-blue-500/12 rounded-xl p-4 flex flex-col justify-between h-full relative overflow-hidden backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-blue-400 tracking-wider ALL CAPS">CHAT SESSIONS</span>
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1 bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/40 rounded px-2 py-1 text-[10px] font-mono font-bold text-blue-300 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>NEW SESSION</span>
            </button>
          </div>

          {/* Session List */}
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-2.5 rounded border transition flex flex-col font-mono text-xs cursor-pointer ${
                  activeSessionId === s.id
                    ? "bg-blue-500/15 border-blue-400 text-slate-100"
                    : "bg-transparent border-transparent hover:border-blue-500/20 text-slate-400"
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="font-semibold truncate pr-2">{s.title}</span>
                  <span className="text-[8px] text-blue-400/50 uppercase shrink-0">{s.date}</span>
                </div>
                <span className="text-[10px] opacity-70 truncate block">{s.lastMsg}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-blue-500/12 my-3" />

          {/* Context Selector */}
          <div>
            <label className="text-[10px] font-mono text-blue-400 tracking-wider block mb-2 uppercase">
              COGNITIVE FOCUS BINDER
            </label>
            <select
              value={activeControlId}
              onChange={(e) => setActiveControlId(e.target.value)}
              className="w-full bg-[#0d0d22] border border-blue-500/12 px-2.5 py-2 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500/40 font-mono"
            >
              <option value="">-- SYSTEM-WIDE GENERAL ENGINE --</option>
              {controls.map((c) => (
                <option key={c.id} value={c.controlId}>
                  [{c.controlId}] {c.name.substring(0, 32)}...
                </option>
              ))}
            </select>
            <span className="text-[9px] font-mono text-slate-500 mt-1 block">
              Filters AI scoping strictly to the database metrics mapped of this control criteria.
            </span>
          </div>

          {/* Connector status feeds */}
          <div className="space-y-2 mt-4">
            <span className="text-[10px] font-mono text-blue-400 tracking-wider block uppercase">
              ACTIVE CONNECTOR HARNESS
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {["github", "aws", "gws", "jira", "slack"].map((type) => {
                const integ = integrations.find(i => i.type === type);
                const isConn = integ?.status === "connected";
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-1.5 p-1.5 border rounded ${
                      isConn ? "bg-green-500/5 border-green-500/20" : "bg-[#0d0d22] border-blue-500/8"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isConn ? "bg-green-400 animate-pulse" : "bg-slate-700"}`} />
                    <span className="uppercase text-[9px] font-bold text-slate-300">{type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-2 text-[9px] font-mono text-slate-500 text-center uppercase tracking-wider">
          AuditorGPT v2.6 // Secure Session
        </div>
      </div>

      {/* MAIN CHAT AREA (lg:col-span-9) */}
      <div className="lg:col-span-9 bg-[#080818]/90 border border-blue-500/12 rounded-xl flex flex-col justify-between h-full relative overflow-hidden backdrop-blur-md">
        {/* Header HUD panel representation */}
        <div className="px-4 py-3 border-b border-blue-500/12 bg-blue-950/20 flex justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-200 uppercase tracking-widest">
              SECURE CRYPTO-AUDIT STREAM // {activeSessionId.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-400 text-[9px] uppercase font-semibold">Gemini Flash-2.0 Active</span>
          </div>
        </div>

        {/* Message Feeds Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-4xl ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-xs font-mono font-bold ${
                  m.role === "user"
                    ? "bg-blue-600/20 border-blue-500 text-blue-300"
                    : "bg-[#0d0d22] border-blue-500/30 text-emerald-400"
                }`}
              >
                {m.role === "user" ? "U" : "Ω"}
              </div>
              <div className="space-y-1">
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed font-sans ${
                    m.role === "user"
                      ? "bg-blue-500/10 border border-blue-500/30 text-blue-100 rounded-tr-none text-right"
                      : "bg-[#0d0d22]/80 border border-blue-500/10 text-slate-200 rounded-tl-none text-left"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {m.text}
                </div>
                <div className={`text-[8px] font-mono text-slate-500 ${m.role === "user" ? "text-right" : "text-left"}`}>
                  TIMESTAMP: {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 mr-auto items-center">
              <div className="w-7 h-7 rounded-full bg-[#0d0d22] border border-blue-500/20 text-emerald-400 flex items-center justify-center animate-spin text-xs">
                ⚙️
              </div>
              <span className="text-[10px] font-mono text-blue-400 antialiased animate-pulse">
                PARSING COMPLIANCE ENGINES...
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

          {/* RAPID TRIGGER QUICKS (visible empty indicators) */}
          <div className="px-4 py-2 bg-blue-950/10 border-t border-blue-500/11">
            <div className="flex gap-2 items-center mb-1.5">
              <span className="text-[8px] font-mono text-blue-400 uppercase tracking-widest">RAPID AI TRIGGERS:</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickTrigger("Explain current gap analysis status & vulnerabilities.", "CC6.1")}
                className="text-left p-2 bg-[#0a0e1a]/80 hover:bg-blue-500/10 border border-blue-500/12 rounded text-[10px] font-mono transition text-slate-300 cursor-pointer"
              >
                <span className="text-blue-400 font-bold block mb-1">🔍 CC6.1 Gaps</span>
                Evaluate infrastructure credential controls list.
              </button>
              <button
                onClick={() => handleQuickTrigger("Draft production-ready regulatory Information Security Policy.", "CC6.1")}
                className="text-left p-2 bg-[#0a0e1a]/80 hover:bg-blue-500/10 border border-blue-500/12 rounded text-[10px] font-mono transition text-slate-300 cursor-pointer"
              >
                <span className="text-blue-400 font-bold block mb-1">📝 Policy Synthesis</span>
                Draft compliant system security policies.
              </button>
              <button
                onClick={() => handleQuickTrigger("Prepare evidence files checklist for external auditors.", "A.9.1")}
                className="text-left p-2 bg-[#0a0e1a]/80 hover:bg-blue-500/10 border border-blue-500/12 rounded text-[10px] font-mono transition text-slate-300 cursor-pointer"
              >
                <span className="text-blue-400 font-bold block mb-1">💼 Auditor Checklist</span>
                Assemble artifacts directory audit trail.
              </button>
              <button
                onClick={() => handleQuickTrigger("Trigger system security scans on cloud integration hubs.", "")}
                className="text-left p-2 bg-[#0a0e1a]/80 hover:bg-blue-500/10 border border-blue-500/12 rounded text-[10px] font-mono transition text-slate-300 cursor-pointer"
              >
                <span className="text-blue-400 font-bold block mb-1">🚀 Automated Sweep</span>
                Run API tests on multi-tenant servers.
              </button>
            </div>
          </div>

        {/* Input area */}
        <div className="p-3 border-t border-blue-500/12 bg-black/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message to AuditorGPT compliance node... Enter commands..."
              className="flex-1 bg-[#0d0d22] border border-blue-500/20 rounded px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-950 text-white border border-blue-400/30 px-4 py-2.5 rounded text-xs font-mono tracking-widest flex items-center gap-1 cursor-pointer transition uppercase"
            >
              <span>SEND</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
