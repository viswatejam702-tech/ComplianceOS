/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Cpu, Edit3, CheckCircle2, History, Send, Layers, HelpCircle, Save, Check, RefreshCw, FileDown } from 'lucide-react';
import { Policy, PolicyVersion } from '../types';

interface PoliciesProps {
  policies: Policy[];
  versions: PolicyVersion[];
  orgId: string;
  onGeneratePolicy: (params: {
    type: string;
    companyName: string;
    techStack: string;
    teamSize: number;
    primaryData: string;
  }) => Promise<void>;
  onUpdatePolicyStatus: (policyId: string, status: 'draft' | 'review' | 'approved', content?: string) => void;
}

export default function Policies({
  policies,
  versions,
  orgId,
  onGeneratePolicy,
  onUpdatePolicyStatus
}: PoliciesProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(policies[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  // Plan generation parameters
  const [policyType, setPolicyType] = useState("infosec");
  const [companyName, setCompanyName] = useState("ZetaTech Labs");
  const [techStack, setTechStack] = useState("Node/RDS, AWS EC2, GitHub");
  const [teamSize, setTeamSize] = useState(12);
  const [primaryData, setPrimaryData] = useState("User logins, PAN, bank account detail hashes");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartEdit = (policy: Policy) => {
    setEditorContent(policy.content);
    setIsEditing(true);
  };

  const handleSaveEdit = (policyId: string) => {
    onUpdatePolicyStatus(policyId, selectedPolicy?.status || 'draft', editorContent);
    if (selectedPolicy) {
      setSelectedPolicy({ ...selectedPolicy, content: editorContent, updatedAt: new Date().toISOString() });
    }
    setIsEditing(false);
  };

  const handleTriggerGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await onGeneratePolicy({
        type: policyType,
        companyName,
        techStack,
        teamSize,
        primaryData
      });
      // Set generated policy as active selection (refetched inside App level state)
      // We will select corresponding type in local logic
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Find active version count for selected item
  const currentVersions = versions.filter(v => v.policyId === selectedPolicy?.id);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Policy drafter settings panel */}
      <div className="xl:col-span-4 bg-white border border-slate-205 rounded-xl p-4 shadow-xs space-y-4 self-start">
        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-mono uppercase">
          <Cpu className="w-4 h-4 text-blue-600" />
          AI Policy Generator
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Synthesize high-grade, local statutory-compliant internal policies tailored to Indian startup environments automatically.
        </p>

        <form onSubmit={handleTriggerGenerate} className="space-y-3 pt-1">
          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Policy Category</label>
            <select
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
              className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-bold cursor-pointer"
            >
              <option value="infosec">Information Security Policy</option>
              <option value="access-control">Access Control Policy</option>
              <option value="incident-response">Incident Response Plan</option>
              <option value="business-continuity">Business Continuity Plan</option>
              <option value="vendor-mgmt">Vendor Management Policy</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Company legal name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-sans font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Architecture stack</label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              required
              placeholder="e.g. Node, RDS PostgreSQL, AWS EC2"
              className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Team Size</label>
              <input
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                min={1}
                required
                className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Local Data Scopes</label>
              <input
                type="text"
                value={primaryData}
                placeholder="e.g. passwords, tax filings"
                onChange={(e) => setPrimaryData(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-sans font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold text-xs py-2 rounded-lg transition shrink-0 flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-xs"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Policy...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Generate with Gemini AI</span>
              </>
            )}
          </button>
        </form>

        {/* Existing Policy lists */}
        <div className="pt-4 border-t border-slate-150">
          <span className="text-[10px] text-slate-405 font-mono uppercase block mb-2 font-bold">Policy Documents Store</span>
          <div className="space-y-1.5">
            {policies.map((p) => {
              const works = selectedPolicy?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPolicy(p);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs flex justify-between items-center transition cursor-pointer ${
                    works
                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 shrink-0 ${works ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-bold truncate max-w-[150px]">{p.title}</span>
                  </div>
                  {/* Status pills inside button list */}
                  <span className={`text-[9px] font-mono border px-1.5 py-0.2 rounded-full uppercase font-bold ${
                    p.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                      : p.status === 'review'
                      ? 'bg-amber-50 text-amber-705 border-amber-150'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {p.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor / Reader Screen Panel */}
      <div className="xl:col-span-8 bg-white border border-slate-205 rounded-xl p-4 shadow-xs flex flex-col space-y-4">
        {selectedPolicy ? (
          <>
            {/* Header control buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">{selectedPolicy.title}</h4>
                <div className="flex gap-2 items-center text-xs text-slate-450 mt-1 font-bold">
                  <span>Last saved: {new Date(selectedPolicy.updatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>State: {selectedPolicy.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex bg-white p-1 rounded-lg border border-slate-200 gap-1 select-none text-xs font-bold">
                {selectedPolicy.status !== 'approved' && (
                  <button
                    onClick={() => handleStartEdit(selectedPolicy)}
                    className="text-xs text-slate-705 hover:text-slate-900 px-2.5 py-1 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit draft</span>
                  </button>
                )}
                <button
                  onClick={() => onUpdatePolicyStatus(selectedPolicy.id, 'review')}
                  disabled={selectedPolicy.status === 'review'}
                  className="text-slate-600 hover:text-slate-900 disabled:text-amber-600 disabled:hover:text-amber-600 disabled:bg-amber-50 px-2.5 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs font-bold"
                >
                  Submit review
                </button>
                <button
                  onClick={() => {
                    onUpdatePolicyStatus(selectedPolicy.id, 'approved');
                    setSelectedPolicy({ ...selectedPolicy, status: 'approved' });
                  }}
                  disabled={selectedPolicy.status === 'approved'}
                  className="text-slate-600 hover:text-slate-905 disabled:text-emerald-700 disabled:hover:text-emerald-700 disabled:bg-emerald-50 px-2.5 py-1 rounded hover:bg-slate-50 cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Policy</span>
                </button>
              </div>
            </div>

            {/* Document Render layout / textarea editor */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  rows={20}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-4 font-mono text-xs text-slate-800 outline-none leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  >
                    Cancel [x]
                  </button>
                  <button
                    onClick={() => handleSaveEdit(selectedPolicy.id)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto max-w-none text-slate-700 whitespace-pre-wrap font-sans text-xs font-medium leading-relaxed select-text">
                {selectedPolicy.content}
              </div>
            )}

            {/* Version histories */}
            <div className="pt-4 border-t border-slate-150">
              <span className="text-xs text-slate-500 font-mono uppercase block mb-2 flex items-center gap-1 font-bold">
                <History className="w-3.5 h-3.5" />
                Version Archive History ({currentVersions.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentVersions.map((v) => (
                  <div key={v.id} className="bg-slate-50 p-2 border border-slate-150 rounded font-mono text-[10px] space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-blue-600">v{v.version}.0.0</span>
                      <span className="text-slate-455 uppercase">{v.status}</span>
                    </div>
                    <span className="text-slate-500 block font-medium">{new Date(v.changedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-205 border-dashed rounded-xl">
            <Cpu className="w-10 h-10 text-slate-350 mx-auto mb-3 animate-pulse" />
            <p className="text-xs font-bold font-mono text-slate-600">No policy selected to display</p>
            <p className="text-xs text-slate-455 max-w-xs mx-auto mt-1 font-medium">
              Select or draft a compliance policy document on the side panel to review metadata and approvals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
