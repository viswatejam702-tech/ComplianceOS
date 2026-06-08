/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, HelpCircle, User, MessageSquare, Upload, Calendar, Edit3, Send, Layers, RefreshCcw, SlidersHorizontal, Mic, MicOff } from 'lucide-react';
import { Control, AuditComment } from '../types';

interface ControlsProps {
  controls: Control[];
  comments: AuditComment[];
  onUpdateControl: (controlId: string, params: Record<string, any>) => void;
  onAddComment: (controlId: string, text: string, role: 'owner' | 'admin' | 'auditor') => void;
  onManualEvidenceUpload: (controlId: string, name: string, content: string) => void;
}

export default function Controls({
  controls,
  comments,
  onUpdateControl,
  onAddComment,
  onManualEvidenceUpload
}: ControlsProps) {
  const [search, setSearch] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  // States to leave answers
  const [newCommentText, setNewCommentText] = useState("");
  const [myRole, setMyRole] = useState<'owner' | 'auditor'>('owner');

  // Manual evidence state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Speech Recognition / Voice-to-Text states
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const toggleVoiceRecording = () => {
    if (isVoiceRecording) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsVoiceRecording(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setVoiceError("Web Speech API is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsVoiceRecording(true);
        setVoiceError(null);
      };

      rec.onresult = (event: any) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          setUploadText(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTrans.trim()}` : finalTrans.trim();
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error !== "no-speech") {
          setVoiceError(`Voice Error: ${event.error}`);
        }
        setIsVoiceRecording(false);
      };

      rec.onend = () => {
        setIsVoiceRecording(false);
      };

      rec.start();
      setRecognitionInstance(rec);
    } catch (err: any) {
      console.error("Error creating Speech Recognition:", err);
      setVoiceError("Microphone initialization failed.");
    }
  };

  // Filter logic
  const filtered = controls.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.controlId.toLowerCase().includes(search.toLowerCase()) ||
                          c.domain.toLowerCase().includes(search.toLowerCase());
    const matchesFramework = selectedFramework === "all" || c.frameworkId === selectedFramework;
    const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;
    return matchesSearch && matchesFramework && matchesStatus;
  });

  const handleLeaveComment = (controlId: string) => {
    if (!newCommentText.trim()) return;
    onAddComment(controlId, newCommentText, myRole);
    setNewCommentText("");
  };

  const handleEvidenceUploadSubmit = (controlId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadText.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      onManualEvidenceUpload(controlId, uploadTitle, uploadText);
      setUploadTitle("");
      setUploadText("");
      setIsUploading(false);
    }, 800);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Controls List Panel */}
      <div className={`${selectedControl ? 'xl:col-span-7' : 'xl:col-span-12'} space-y-4`}>
        {/* Filters and search card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search controls or domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-white text-slate-800">All Frameworks</option>
                <option value="soc2" className="bg-white text-slate-800">SOC 2 Type II</option>
                <option value="iso27001" className="bg-white text-slate-800">ISO 27001</option>
                <option value="rbi-nbfc" className="bg-white text-slate-800">RBI NBFC IT</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-white text-slate-800">All Statuses</option>
                <option value="pass" className="bg-white text-emerald-600">Pass</option>
                <option value="partial" className="bg-white text-amber-600">Partial</option>
                <option value="fail" className="bg-white text-rose-600">Fail</option>
              </select>
            </div>
          </div>
        </div>

        {/* List card table layout */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">Framework Control Clauses</h4>
            <span className="text-xs text-blue-600 font-mono font-semibold">{filtered.length} matching controls</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((ctrl) => {
              const isSelected = selectedControl?.id === ctrl.id;
              
              // Status Badge styling
              let statusBadge = "bg-slate-50 text-slate-500 border-slate-200";
              if (ctrl.status === 'pass') statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
              else if (ctrl.status === 'fail') statusBadge = "bg-rose-50 text-rose-700 border-rose-200";
              else if (ctrl.status === 'partial') statusBadge = "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <div
                  key={ctrl.id}
                  onClick={() => setSelectedControl(ctrl)}
                  className={`p-3.5 transition hover:bg-slate-50 cursor-pointer flex justify-between items-start gap-4 ${
                    isSelected ? 'bg-blue-50/40 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/40 uppercase">
                        {ctrl.controlId}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ctrl.frameworkId === 'soc2' ? 'SOC 2' : ctrl.frameworkId === 'iso27001' ? 'ISO 27001' : 'RBI NBFC'}
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-800 tracking-tight">{ctrl.name}</h5>
                    <p className="text-xs text-slate-500 max-w-xl line-clamp-1">{ctrl.description}</p>
                    <span className="text-[9px] text-slate-400 block font-mono">Domain: {ctrl.domain}</span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded-full uppercase ${statusBadge}`}>
                      {ctrl.status}
                    </span>
                    {ctrl.lastCheckedAt && (
                      <span className="text-[9px] font-mono text-slate-400 block flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ctrl.lastCheckedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-mono">No controls found matching filter guidelines.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Details Panel (Sidebar configuration) */}
      {selectedControl && (
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 self-start relative">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{selectedControl.controlId}</span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedControl.frameworkId}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-base mt-1.5 tracking-tight">{selectedControl.name}</h4>
              <span className="text-[10px] font-mono text-slate-400">{selectedControl.domain}</span>
            </div>
            <button
              onClick={() => setSelectedControl(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-mono"
            >
              Close [x]
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Control Objective</span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
              {selectedControl.description}
            </p>
          </div>

          {/* Assignee & Status overrides */}
          <div className="grid grid-cols-2 gap-3 pb-1 border-b border-slate-50">
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Assignee</label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-2 rounded-lg">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <select
                  value={selectedControl.assigneeId || ""}
                  onChange={(e) => onUpdateControl(selectedControl.id, { assigneeId: e.target.value })}
                  className="bg-transparent text-xs text-slate-700 outline-none w-full cursor-pointer font-medium"
                >
                  <option value="" className="bg-white text-slate-800">Unassigned</option>
                  <option value="usr-1" className="bg-white text-slate-800">Viswa Teja</option>
                  <option value="usr-2" className="bg-white text-slate-800">Shreya Sen (CISO)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-semibold">Change Status</label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-2 rounded-lg">
                <select
                  value={selectedControl.status}
                  onChange={(e) => onUpdateControl(selectedControl.id, { status: e.target.value })}
                  className="bg-transparent text-xs text-slate-800 font-bold outline-none w-full cursor-pointer uppercase"
                >
                  <option value="pass" className="bg-white text-emerald-600">PASS</option>
                  <option value="partial" className="bg-white text-amber-600">PARTIAL</option>
                  <option value="fail" className="bg-white text-rose-600">FAIL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Evidence Required */}
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1.5">Required Audit Evidence</span>
            <ul className="text-xs text-slate-600 space-y-1 font-medium">
              {selectedControl.evidenceRequired.map((reqEv, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>{reqEv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Auditor comments history */}
          <div className="space-y-3">
            <span className="text-[10px] text-slate-400 font-mono uppercase block flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              Auditor Comments ({comments.filter(c => c.controlId === selectedControl.id).length})
            </span>

            <div className="space-y-2 max-h-[160px] overflow-y-auto bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-2">
              {comments.filter(c => c.controlId === selectedControl.id).map((c) => (
                <div key={c.id} className="text-xs border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${c.authorRole === 'auditor' ? 'text-blue-600' : 'text-slate-800'}`}>
                      {c.authorName} ({c.authorRole.toUpperCase()})
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 mt-1 text-xs whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                </div>
              ))}
              {comments.filter(c => c.controlId === selectedControl.id).length === 0 && (
                <p className="text-[10px] text-slate-400 font-mono italic text-center py-2">No comments left on this item.</p>
              )}
            </div>

            {/* Comment submittor selection role */}
            <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Comment as:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMyRole('owner')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${myRole === 'owner' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Operator
                  </button>
                  <button
                    onClick={() => setMyRole('auditor')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${myRole === 'auditor' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Auditor
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Leave response or update notes..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
                />
                <button
                  onClick={() => handleLeaveComment(selectedControl.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded p-1.5 transition text-xs flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Manual evidence room file submission */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono uppercase block flex items-center gap-1.5 mb-2">
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              Upload Manual Security Evidence
            </span>

            <form onSubmit={(e) => handleEvidenceUploadSubmit(selectedControl.id, e)} className="space-y-2">
              <input
                type="text"
                placeholder="Evidence Name (e.g. Audit Meeting Logs 2026.pdf)"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
              />
              <div className="relative">
                <textarea
                  id="evidence-upload-text"
                  placeholder="Input descriptive evidence summary, file hash, or signed policy confirmations..."
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 pr-8 text-xs outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400 font-mono leading-relaxed"
                />
                <button
                  type="button"
                  id="controls-mic-button"
                  onClick={toggleVoiceRecording}
                  title={isVoiceRecording ? "Stop voice transcription" : "Start voice transcription"}
                  className={`absolute right-2.5 bottom-2.5 p-1 rounded-md transition duration-150 cursor-pointer ${
                    isVoiceRecording 
                      ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200 animate-pulse' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isVoiceRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {isVoiceRecording && (
                <div id="controls-voice-recording-indicator" className="bg-rose-50 border border-rose-100 rounded px-2 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-rose-600 font-bold uppercase tracking-wider animate-pulse">
                      Listening & Recording Audit Speech... [Speak clearly]
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVoiceRecording(false)}
                    className="text-[10px] font-mono font-bold text-rose-500 hover:text-rose-700 uppercase"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {voiceError && (
                <div id="controls-voice-error-indicator" className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                  ⚠ {voiceError}
                </div>
              )}
              <button
                type="submit"
                disabled={isUploading || !uploadTitle || !uploadText}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 border border-slate-200 text-slate-700 disabled:text-slate-400 rounded py-1.5 text-xs font-semibold cursor-pointer transition shadow-xs"
              >
                {isUploading ? "Uploading metadata..." : "Upload Evidence Record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
