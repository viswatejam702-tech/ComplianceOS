/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Sparkles, X, ChevronDown, Check, Play, FileText, UserPlus } from 'lucide-react';
import { ChatMessage } from '../types';
import { apiFetch } from '../lib/api';

interface AIChatProps {
  orgId: string;
  focusControlId?: string;
  onClose?: () => void;
  onTriggerChecks?: () => void;
  onTriggerPolicyDraft?: (type: string) => void;
  onAssignControl?: (controlId: string, assigneeId: string) => void;
}

export default function AIChat({
  orgId,
  focusControlId,
  onClose,
  onTriggerChecks,
  onTriggerPolicyDraft,
  onAssignControl
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: 'model',
      text: focusControlId
        ? `Hello! I see you are focusing on Control **${focusControlId}**. I have analyzed its evidence history. Type "evaluate this check" or "remediate" to get custom instructions, or say "run check now" to initiate verification.`
        : "Hello! I am **AuditorGPT**, your technical compliance officer. I can analyze configurations, draft security policies, trigger check runs, or explain SOC 2/ISO 27001/RBI guidelines. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (focusControlId) {
      setSuggestedActions([
        "How do I satisfy CC6.1?",
        "Draft Access Control Policy",
        "Run security scan now",
        "Assign this control to me"
      ]);
    } else {
      setSuggestedActions([
        "Explain RBI nb-fc requirements",
        "Generate mock compliance audit",
        "What are my current gaps?",
        "Create standard InfoSec policy"
      ]);
    }
  }, [focusControlId]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = {
      id: `chat-${Math.random().toString(36).substring(4)}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
      controlId: focusControlId
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await apiFetch(`/api/orgs/${orgId}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          controlId: focusControlId
        })
      });

      if (!response.ok) throw new Error("Network response failed");
      const data = await response.json();

      setMessages(prev => [...prev, {
        id: `chat-${Math.random().toString(36).substring(4)}`,
        role: 'model',
        text: data.message,
        timestamp: new Date().toLocaleTimeString()
      }]);

      if (data.trigger) {
        handleTriggerAction(data.trigger);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: `chat-err`,
        role: 'model',
        text: "I encountered a transient connection issue. Please make sure GEMINI_API_KEY is configured under Secrets, or try again.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAction = (actionType: string) => {
    if (actionType === "run_checks" && onTriggerChecks) {
      onTriggerChecks();
      setMessages(prev => [...prev, {
        id: `action-${Date.now()}`,
        role: 'model',
        text: "⚡ **Action Executed**: Triggering the automated Compliance Scanners across connected repositories and AWS cloud profiles.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } else if (actionType === "draft_policy" && onTriggerPolicyDraft) {
      onTriggerPolicyDraft("access-control");
      setMessages(prev => [...prev, {
        id: `action-${Date.now()}`,
        role: 'model',
        text: "📝 **Action Executed**: Initiated draft synthesis for Access Control Policy in the Policies builder panel.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } else if (actionType === "assign_teammate" && onAssignControl && focusControlId) {
      onAssignControl(focusControlId, "usr-1");
      setMessages(prev => [...prev, {
        id: `action-${Date.now()}`,
        role: 'model',
        text: "👤 **Action Executed**: Outstanding control task assigned to your profile folder successfully.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  return (
    <div id="ai_auditor_chat" className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <Bot className="w-5 h-5 text-blue-500" />
          <div>
            <h4 className="font-bold text-sm text-slate-850 flex items-center gap-1">
              AI Auditor Coach
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">Powered by Gemini-2.5</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-450 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-150 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[480px]">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'model' && (
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/50 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-slate-50 border border-slate-200/60 text-slate-705'
            }`}>
              <div className="prose prose-sm font-sans whitespace-pre-wrap text-slate-800">
                {m.text}
              </div>
              <span className="block text-[9px] text-slate-400 font-mono mt-1 text-right">{m.timestamp}</span>
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-655" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/50 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-[10px] font-mono">Analyzing workspace telemetry...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Actions chips */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/50 flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
        {suggestedActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(action)}
            className="text-[10px] font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-250 px-2.5 py-1 rounded-full transition text-left cursor-pointer shadow-xs"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={focusControlId ? `Ask about control ${focusControlId}...` : "Ask a compliance question..."}
          className="flex-1 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-450 text-white rounded-lg p-2 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
