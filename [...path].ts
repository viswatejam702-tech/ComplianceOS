/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Eye, ShieldCheck, ShieldAlert, Cpu, Download, Database, RotateCw, ExternalLink, Calendar, Search, Mic, MicOff, MessageSquare } from 'lucide-react';
import { EvidenceItem, IntegrationRun, Control } from '../types';

interface EvidenceProps {
  evidence: EvidenceItem[];
  runs: IntegrationRun[];
  onTriggerScan: () => void;
  isScanning: boolean;
  controls?: Control[];
  onManualEvidenceUpload?: (controlId: string, name: string, content: string) => Promise<any> | void;
}

export default function Evidence({ evidence, runs, onTriggerScan, isScanning, controls, onManualEvidenceUpload }: EvidenceProps) {
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rightPanelTab, setRightPanelTab] = useState<'details' | 'voice_log'>('details');

  // Voice recording states
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Voice log form states
  const [voiceControlId, setVoiceControlId] = useState("CC1.1");
  const [voiceTitle, setVoiceTitle] = useState("Manual Observation: Security Review");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const defaultControlList = controls && controls.length > 0 
    ? controls 
    : [
        { id: "CC1.1", name: "CC1.1 - Control Environment / Integrity & Ethical Values" },
        { id: "CC2.1", name: "CC2.1 - Communication and Information" },
        { id: "CC6.1", name: "CC6.1 - Logical Access Security Controls" },
        { id: "CC6.3", name: "CC6.3 - Perimeter Defense & Network Boundary Verification" },
        { id: "CC6.8", name: "CC6.8 - Unauthorized Disclosure & File Sweeper Auditing" },
        { id: "CC7.1", name: "CC7.1 - Vulnerability Mitigation & Security Sweeps" },
        { id: "CC8.1", name: "CC8.1 - Change Management Security controls" },
        { id: "A.9.1", name: "A.9.1 - Access Control and Privileged Credentials" },
        { id: "A.12.1", name: "A.12.1 - Operational IT Defenses and Procedures" },
      ];

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
          setVoiceTranscript(prev => {
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

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceTranscript.trim() || !voiceTitle.trim() || !onManualEvidenceUpload) return;

    setIsSubmittingLog(true);
    try {
      await onManualEvidenceUpload(voiceControlId, voiceTitle, voiceTranscript);
      setVoiceTranscript("");
      setVoiceTitle("Manual Observation: Security Review");
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setRightPanelTab('details');
      }, 1500);
    } catch (err) {
      console.error("Error uploading voice observations:", err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const filteredEvidence = evidence.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.controlId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Evidence Banner Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            Secure Evidence Room
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Automated compliance check-points logged and evaluated by auditor agents.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search evidence titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-250 focus:border-blue-505 text-xs text-slate-800 px-3 py-1.5 rounded-lg placeholder-slate-400 outline-none w-full md:w-48"
          />
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs px-3.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? "Scanning APIs..." : "Deep Telemetry Scan"}
          </button>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Evidence Browser Files */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Archived Compliance Evidence</h4>
            <span className="text-xs font-mono text-blue-600 font-bold">{filteredEvidence.length} Entries</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredEvidence.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3.5 transition hover:bg-slate-50/50 cursor-pointer flex justify-between items-center gap-4 border-l-4 ${
                    isSelected ? 'bg-blue-50/30 border-blue-500 font-medium' : 'border-transparent'
                  }`}
                >
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      {item.name}
                    </h5>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-450 font-mono font-semibold">
                      <span>Source: {item.source}</span>
                      <span>•</span>
                      <span className="text-blue-605 uppercase">Control Target: {item.controlId.split('-').pop() || item.controlId}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase">{item.type}</span>
                    <span className="text-[9px] font-mono font-medium text-slate-500 block mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredEvidence.length === 0 && (
              <p className="text-sm font-mono text-slate-450 text-center p-8">No matching records archived.</p>
            )}
          </div>
        </div>

        {/* Selected File Explorer View and Voice Recording Panel */}
        <div id="evidence-right-panel" className="lg:col-span-5 self-start space-y-4">
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex shadow-inner">
            <button
              type="button"
              id="details-tab-btn"
              onClick={() => setRightPanelTab('details')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition select-none flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'details' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Telemetry Explorer</span>
            </button>
            <button
              type="button"
              id="voice-log-tab-btn"
              onClick={() => setRightPanelTab('voice_log')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition select-none flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'voice_log' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-500" />
              <span>Voice Dictation</span>
            </button>
          </div>

          {rightPanelTab === 'details' ? (
            selectedItem ? (
              <div id="selected-evidence-card" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5 leading-snug">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      {selectedItem.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1 font-bold">Source: {selectedItem.source}</span>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-mono font-bold cursor-pointer"
                  >
                    Clear [x]
                  </button>
                </div>

                {/* Parsed JSON details toggle */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-bold">Raw Telemetry Checks Payload</span>
                  <pre className="bg-slate-50 border border-slate-150 p-3 rounded-lg overflow-x-auto text-[10px] font-mono text-slate-700 leading-relaxed max-h-[300px] overflow-y-auto w-full">
                    {selectedItem.content}
                  </pre>
                </div>

                {/* Meta information or download action simulation */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 font-bold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    {new Date(selectedItem.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-blue-605">Target ID: {selectedItem.controlId}</span>
                </div>
              </div>
            ) : (
              <div id="telemetry-explorer-empty" className="bg-slate-50/50 border border-slate-155 rounded-xl p-8 text-center text-slate-400">
                <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 font-mono uppercase">Telemetry File Explorer</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Select an evidence item from the central repository to view code snippets, automated cloud audits, or AI assessments.
                </p>
              </div>
            )
          ) : (
            /* Voice log dictation form */
            <div id="voice-observation-form-card" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-rose-500" />
                    Document Voice Observation
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Record real-time audit walkthrough insights to raw evidence streams.</p>
                </div>
              </div>

              {submitSuccess ? (
                <div id="voice-submit-success" className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center space-y-2">
                  <span className="text-3xl">🎉</span>
                  <h5 className="font-bold text-slate-800 text-sm">Observation Logged</h5>
                  <p className="text-xs text-slate-500 font-medium font-sans">
                    The manual speech evidence was synthesized and archived safely inside ComplianceOS telemetry databank.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVoiceSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-505 uppercase block">Target Audit Control</label>
                    <select
                      id="voice-control-select"
                      value={voiceControlId}
                      onChange={(e) => setVoiceControlId(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded px-2.5 py-1.5 text-xs outline-none text-slate-750 font-semibold"
                    >
                      {defaultControlList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} - {c.name.split(' - ').slice(1).join(' - ') || c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-505 uppercase block">Evidence Record Name</label>
                    <input
                      id="voice-title-input"
                      type="text"
                      placeholder="e.g. Observational Audit Log - System walkthrough"
                      value={voiceTitle}
                      onChange={(e) => setVoiceTitle(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded px-2.5 py-1.5 text-xs outline-none text-slate-750 font-semibold placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono font-bold text-slate-505 uppercase block">Speech-to-Text Transcript</label>
                      <span className="text-[9px] font-mono text-slate-400 font-semibold">Web Speech API</span>
                    </div>

                    <div className="relative">
                      <textarea
                        id="voice-transcript-textarea"
                        placeholder="Click 'Start Dictation' and speak. Your voice transcript will be dynamically routed and rendered here..."
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                        required
                        rows={4}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-500 rounded p-2.5 text-xs outline-none text-slate-800 placeholder-slate-400 font-mono leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Compact layout with microphone recorder action */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        id="voice-mic-trigger"
                        onClick={toggleVoiceRecording}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer select-none border shadow-xs ${
                          isVoiceRecording 
                            ? 'bg-rose-600 hover:bg-rose-750 border-rose-700 text-white animate-pulse' 
                            : 'bg-white hover:bg-rose-50/55 text-rose-600 border-rose-250'
                        }`}
                      >
                        {isVoiceRecording ? (
                          <>
                            <MicOff className="w-4 h-4 text-white shrink-0" />
                            <span>Stop [Tape dictation]</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>Start Dictation</span>
                          </>
                        )}
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingLog || !voiceTranscript.trim() || !voiceTitle.trim() || isVoiceRecording}
                        className="flex-1 bg-slate-905 border border-slate-905 hover:bg-slate-800 disabled:bg-slate-100 disabled:border-slate-200 text-white disabled:text-slate-450 rounded-lg py-2 text-xs font-bold cursor-pointer transition select-none shadow-xs"
                      >
                        {isSubmittingLog ? "Archiving..." : "Archive Observation"}
                      </button>
                    </div>

                    {isVoiceRecording && (
                      <div id="voice-recording-spectrum" className="bg-rose-50 border border-rose-100 rounded px-2.5 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                          </span>
                          <span className="text-[10px] font-mono text-rose-600 font-bold uppercase tracking-wider animate-pulse">
                            Audio recording stream is active.
                          </span>
                        </div>
                        {/* Interactive audio meter representation */}
                        <div className="flex items-end gap-[2px] h-3">
                          <div className="w-[3px] bg-rose-450 rounded-sm animate-pulse h-2"></div>
                          <div className="w-[3px] bg-rose-500 rounded-sm animate-pulse h-3"></div>
                          <div className="w-[3px] bg-rose-400 rounded-sm animate-pulse h-1.5"></div>
                          <div className="w-[3px] bg-rose-550 rounded-sm animate-pulse h-2.5"></div>
                        </div>
                      </div>
                    )}

                    {voiceError && (
                      <div id="voice-recording-error" className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-2.5 py-1.5">
                        ⚠ {voiceError}
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scanners History list */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase">
          <History className="w-4 h-4 text-blue-500" />
          Integration Agent Action History (Jobs)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs bg-white border border-slate-150 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-205 font-mono text-slate-505 font-bold">
              <tr>
                <th className="px-4 py-3">JobID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Integration</th>
                <th className="px-4 py-3">Assessment Outcomes</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(runs || []).map((run, index) => (
                <tr key={run.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">{run.id}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono font-medium">{run.runAt ? new Date(run.runAt).toLocaleString() : ""}</td>
                  <td className="px-4 py-3 text-slate-755 font-bold">Multi-Cloud Agent Scan</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(run?.results || []).map((resItem, keyIdx) => (
                        <span
                          key={keyIdx}
                          title={`${resItem.checkName}: ${resItem.findings}`}
                          className={`text-[9px] font-mono px-2 py-0.2 rounded font-bold uppercase ${
                            resItem.status === 'pass'
                              ? 'bg-emerald-50 text-emerald-755 border border-emerald-100'
                              : resItem.status === 'fail'
                              ? 'bg-rose-50 text-rose-755 border border-rose-100'
                              : 'bg-amber-50 text-amber-755 border border-amber-100'
                          }`}
                        >
                          {resItem.controlId}: {resItem.status.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono bg-emerald-50 text-emerald-750 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase text-[9px] font-bold">
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-slate-450 font-mono italic">
                    No active compliance checks triggered yet in this workspace. Trigger scan above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Simple legacy History icon placeholder mapping
function History({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
