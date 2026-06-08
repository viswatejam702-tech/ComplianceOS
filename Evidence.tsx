/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Calendar, Users, FileText, CheckSquare, Layers, Clock, MessageSquare, Plus, Check } from 'lucide-react';
import { AuditEngagement, AuditComment, Control, EvidenceItem } from '../types';

interface AuditsProps {
  audits: AuditEngagement[];
  comments: AuditComment[];
  controls: Control[];
  evidence: EvidenceItem[];
  orgId: string;
  onCreateAudit: (params: {
    frameworkId: string;
    name: string;
    externalAuditorEmail: string;
    externalAuditorName: string;
    targetDays: number;
  }) => void;
  onAddComment: (controlId: string, text: string, role: 'owner' | 'admin' | 'auditor') => void;
}

export default function Audits({
  audits,
  comments,
  controls,
  evidence,
  orgId,
  onCreateAudit,
  onAddComment
}: AuditsProps) {
  const [selectedAudit, setSelectedAudit] = useState<AuditEngagement | null>(audits[0] || null);
  const [isCreating, setIsCreating] = useState(false);

  // New Engagement Form Parameters
  const [frameworkId, setFrameworkId] = useState("soc2");
  const [scopeName, setScopeName] = useState("Deloitte SOC 2 Type II Statutory Assessment");
  const [auditorName, setAuditorName] = useState("Rohan Gupta");
  const [auditorEmail, setAuditorEmail] = useState("rohan.gupta@deloitte.in");
  const [targetDays, setTargetDays] = useState(60);

  // Comment helper in auditor page
  const [activeControlCommentTab, setActiveControlCommentTab] = useState<string>("");
  const [auditCommentText, setAuditCommentText] = useState("");

  const handleCreateEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAudit({
      frameworkId,
      name: scopeName,
      externalAuditorEmail: auditorEmail,
      externalAuditorName: auditorName,
      targetDays
    });
    setIsCreating(false);
  };

  const handleAddAuditorComment = (ctrlId: string) => {
    if (!auditCommentText.trim()) return;
    onAddComment(ctrlId, auditCommentText, 'auditor'); // Auditor submits
    setAuditCommentText("");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Right control: Audits timeline or Create scope */}
      <div className="xl:col-span-4 space-y-4">
        {/* Actions panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Audit Engagements
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Create an official cryptographic sandbox scoped to SOC 2, ISO 27001, or RBI standards and invite certified external practitioners.
          </p>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Scoped Engagement</span>
          </button>
        </div>

        {/* Existing Audits List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Active Engagements ({audits.length})</span>
          <div className="space-y-2">
            {audits.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedAudit(a);
                  setIsCreating(false);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition cursor-pointer ${
                  selectedAudit?.id === a.id
                    ? 'bg-blue-50/40 border-blue-500 text-blue-800'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <h5 className="font-bold text-slate-800">{a.name}</h5>
                  <div className="flex gap-2 items-center text-[9px] font-mono mt-1 font-bold">
                    <span className="text-blue-600 uppercase">{a.frameworkId}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{a.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main workspace section */}
      <div className="xl:col-span-8 space-y-4">
        {isCreating ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-slate-900 font-bold text-base border-b border-slate-100 pb-2">Initialize Compliance Audit Engagement</h4>
            
            <form onSubmit={handleCreateEngagement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Audit Name / Scope Title</label>
                  <input
                    type="text"
                    value={scopeName}
                    onChange={(e) => setScopeName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none hover:border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Target Framework</label>
                  <select
                    value={frameworkId}
                    onChange={(e) => setFrameworkId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded px-3 py-1.5 text-xs text-slate-700 font-bold outline-none cursor-pointer"
                  >
                    <option value="soc2" className="bg-white text-slate-800">SOC 2 Type II</option>
                    <option value="iso27001" className="bg-white text-slate-800">ISO 27001 (Annex A)</option>
                    <option value="rbi-nbfc" className="bg-white text-slate-800">RBI IT NBFC Master Directions</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Auditor practitioner Name</label>
                  <input
                    type="text"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Auditor practitioner Email</label>
                  <input
                    type="email"
                    value={auditorEmail}
                    onChange={(e) => setAuditorEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Target duration (Days)</label>
                  <input
                    type="number"
                    value={targetDays}
                    onChange={(e) => setTargetDays(parseInt(e.target.value) || 30)}
                    min={10}
                    required
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-655 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg transition cursor-pointer shadow-xs"
                >
                  Provision External Sandbox [Safe]
                </button>
              </div>
            </form>
          </div>
        ) : selectedAudit ? (
          <>
            {/* Audit Milestones Progress Track */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-905 text-base">{selectedAudit.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                    <span>Practitioner: <strong className="text-slate-800">{selectedAudit.externalAuditorName}</strong> ({selectedAudit.externalAuditorEmail})</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-blue-605 bg-blue-50 border border-blue-150 px-2.5 py-0.5 rounded-full uppercase font-bold">
                  {selectedAudit.status.replace("_", " ")}
                </span>
              </div>

              {/* Milestones bar */}
              <div className="space-y-3">
                <span className="text-xs text-slate-505 font-mono uppercase block font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Scheduled Timeline Milestones
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {selectedAudit.milestones.map((m, mIdx) => (
                    <div key={m.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block font-bold">Milestone {mIdx + 1}</span>
                        <h5 className="text-[11px] text-slate-700 font-bold line-clamp-1 leading-snug mt-0.5">{m.title}</h5>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono pt-1">
                        <span className="text-slate-505 font-medium">{new Date(m.dueDate).toLocaleDateString()}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                          m.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Auditor portal and evidence review panels */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 font-mono uppercase">
                  <Users className="w-4 h-4 text-blue-500" />
                  Auditor Evidence Room & Verification Panel
                </h4>
                <p className="text-[10px] font-mono text-slate-505 font-bold">Simulating Rohan Gupta (Auditor Account)</p>
              </div>

              {/* Controls directory select */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* List of controls for auditor review */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-lg p-2 max-h-[300px] overflow-y-auto space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block px-1.5 pb-1 font-bold">Scoped Checklist</span>
                  {controls.filter(c => c.frameworkId === selectedAudit.frameworkId).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveControlCommentTab(c.id)}
                      className={`w-full text-left px-2 py-1.5 rounded transition text-xs flex justify-between items-center cursor-pointer ${
                        activeControlCommentTab === c.id
                          ? 'bg-blue-50 border-l-2 border-blue-500 text-blue-850 font-bold'
                          : 'text-slate-505 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{c.controlId}: {c.name}</span>
                      <span className={`text-[8px] font-mono border px-1 rounded uppercase shrink-0 font-bold ${
                        c.status === 'pass' ? 'bg-emerald-50 text-emerald-705 border-emerald-100' : 'bg-rose-50 text-rose-705 border-rose-100'
                      }`}>{c.status}</span>
                    </button>
                  ))}
                </div>

                {/* Submitting formal findings as Rohan (Auditor) */}
                <div className="md:col-span-7 bg-white p-4 border border-slate-200 rounded-lg space-y-4">
                  {activeControlCommentTab ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Active Control Findings</span>
                        <h5 className="text-xs font-semibold text-slate-800">
                          {controls.find(c => c.id === activeControlCommentTab)?.name}
                        </h5>
                      </div>

                      {/* Comment inputs */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block flex items-center gap-1 font-bold">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                          Certified Practitioner Assessment Notes
                        </span>

                        <textarea
                          placeholder="Example: File protected branches verified under Deloitte SOC 2 parameters..."
                          value={auditCommentText}
                          onChange={(e) => setAuditCommentText(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded p-2 text-xs text-slate-800 outline-none placeholder-slate-400 font-mono leading-relaxed"
                        />

                        <button
                          onClick={() => handleAddAuditorComment(activeControlCommentTab)}
                          disabled={!auditCommentText.trim()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-405 text-xs font-bold rounded transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Submit Formal Comment</span>
                        </button>
                      </div>

                      {/* Display current comments for selected control */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Logged Remarks ({comments.filter(c => c.controlId === activeControlCommentTab).length})</span>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto">
                          {comments.filter(c => c.controlId === activeControlCommentTab).map(c => (
                            <div key={c.id} className="text-[11px] p-2 bg-slate-50 border border-slate-150 rounded text-slate-700">
                              <div className="flex justify-between items-center text-slate-500 font-mono text-[9px] mb-1">
                                <span className="font-bold text-blue-600">{c.authorName}</span>
                                <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-slate-805 font-sans leading-relaxed">{c.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold font-mono text-slate-600 uppercase">Auditor Assessment Desk</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                        Select any checklist control on the side directories panel to write comments, log exceptions, or verify compliance artifacts as Deloitte Auditor Rohan Gupta.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-605 font-mono uppercase">No Active Engagements</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
              Select or create a statutory assessment scopes engagement parameters to invite advisors and track milestones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
