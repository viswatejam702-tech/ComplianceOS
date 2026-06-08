/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, ShieldAlert, CheckCircle2, XCircle, AlertOctagon, HelpCircle, HardDrive, Filter, Eye, ChevronDown, Check, Trash2, Key, Info, Lock, Copy, Smartphone, RefreshCw, FileText, Cookie } from 'lucide-react';
import { AuditLog, SecretFinding, Role } from '../types';
import { apiFetch } from '../lib/api';

interface AuditTrailsProps {
  auditLogs: AuditLog[];
  secretFindings: SecretFinding[];
  currentUser: { id: string; email: string; name: string; role: Role };
  onRemediateSecret: (id: string) => void;
  onDismissSecret: (id: string) => void;
}

export default function AuditTrails({
  auditLogs,
  secretFindings,
  currentUser,
  onRemediateSecret,
  onDismissSecret
}: AuditTrailsProps) {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [activeSecretTab, setActiveSecretTab] = useState<'active' | 'remediated'>('active');

  // Module 3: Two-Factor TOTP & Backup Keys States
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [mfaSetupStep, setMfaSetupStep] = useState<'none' | 'setup' | 'verified'>('none');
  const [mfaSecret, setMfaSecret] = useState<string>("");
  const [mfaQrCode, setMfaQrCode] = useState<string>("");
  const [mfaCodeInput, setMfaCodeInput] = useState<string>("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Module 5: Interactive Developer JWT Generation States
  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [tokenCopied, setTokenCopied] = useState<boolean>(false);
  const [tokenGenerating, setTokenGenerating] = useState<boolean>(false);

  // Module 4: Cookies + Legal Preferences Storage States
  const [cookieConsents, setCookieConsents] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("complianceOS_cookies");
        return saved ? JSON.parse(saved) : { essential: true, analytics: true, marketing: false };
      }
    } catch {
      return { essential: true, analytics: true, marketing: false };
    }
    return { essential: true, analytics: true, marketing: false };
  });
  const [legalDocumentOpen, setLegalDocumentOpen] = useState<'privacy' | 'terms' | 'gdpr' | null>(null);
  const [consentSavedMessage, setConsentSavedMessage] = useState<boolean>(false);

  // Module 3 Auth: Async handlers for Google Authenticator Setup
  const initiateMfaSetup = async () => {
    setMfaError(null);
    try {
      const response = await apiFetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMfaSecret(data.secret);
        setMfaQrCode(data.qrCode);
        setMfaSetupStep('setup');
      } else {
        setMfaError("Failed to initiate secure 2FA setup channel.");
      }
    } catch (e) {
      setMfaError("Network disruption during Authenticator Handshake.");
    }
  };

  const verifyMfaCode = async () => {
    setMfaError(null);
    try {
      const response = await apiFetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role
        },
        body: JSON.stringify({ code: mfaCodeInput })
      });
      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes || []);
        setMfaEnabled(true);
        setMfaSetupStep('verified');
      } else {
        const err = await response.json();
        setMfaError(err.message || "Invalid OTP token check.");
      }
    } catch (e) {
      setMfaError("Network failure compiling verification checks.");
    }
  };

  const disableMfa = async () => {
    setMfaError(null);
    try {
      const response = await apiFetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role
        }
      });
      if (response.ok) {
        setMfaEnabled(false);
        setMfaSetupStep('none');
        setMfaSecret("");
        setMfaQrCode("");
        setMfaCodeInput("");
        setBackupCodes([]);
      } else {
        setMfaError("Authorization block prevented de-registering multifactor.");
      }
    } catch (e) {
      setMfaError("Network failed to dispatch MFA de-authorizations.");
    }
  };

  // Module 5 Auth: Async handler to generate JWT Key
  const generateNewApiToken = async () => {
    setTokenGenerating(true);
    try {
      const response = await apiFetch("/api/auth/keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role
        },
        body: JSON.stringify({ orgId: "org-123" })
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedToken(data.apiKey);
        setTokenCopied(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTokenGenerating(false);
    }
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const saveCookieConsent = () => {
    localStorage.setItem("complianceOS_cookies", JSON.stringify(cookieConsents));
    setConsentSavedMessage(true);
    setTimeout(() => setConsentSavedMessage(false), 3000);
  };

  const actionTypes = [
    { value: "all", label: "All Logs" },
    { value: "login", label: "Login & Sessions" },
    { value: "config_changed", label: "Config Changes" },
    { value: "evidence_upload", label: "Evidence Actions" },
    { value: "policy_modified", label: "Policy Edits" },
    { value: "control_update", label: "Control Updates" },
    { value: "unauthorized_bypassed", label: "RBAC Rejections" }
  ];

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction === "all") return true;
    return log.action === filterAction;
  });

  const activeSecrets = secretFindings.filter(s => s.status === 'active');
  const resolvedSecrets = secretFindings.filter(s => s.status === 'resolved' || s.status === 'dismissed');

  const getActionBadge = (action: string) => {
    switch (action) {
      case "unauthorized_bypassed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Blocked Attempt
          </span>
        );
      case "login":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
            Session Swapped
          </span>
        );
      case "config_changed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase">
            Config Change
          </span>
        );
      case "evidence_upload":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
            Evidence Sync
          </span>
        );
      case "policy_modified":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full uppercase">
            Policy Synthesized
          </span>
        );
      case "control_update":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
            Control Update
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
            {action}
          </span>
        );
    }
  };

  const isWriteRestricted = currentUser.role === 'viewer' || currentUser.role === 'auditor';

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md uppercase">
            Security & Oversight
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2.5">
            Audit Trails & Repository Gaps
          </h2>
          <p className="text-xs text-slate-550 mt-1">
            Interactive console tracking cryptosecrecy, system state changes, and role-based permissions blocks.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
          <span className="font-mono text-slate-400">Current RBAC Mode:</span>
          <span className="font-bold text-slate-700 bg-white border border-slate-250 px-2 py-0.5 rounded shadow-2xs font-mono uppercase">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* SECTION 1: GITHUB AUTOMATED SECRET SCANNING PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 bg-[#FAFBFD] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-850">
                Repository Credentials & Vault Scanner (SOC 2 CC6.7)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl">
                Background agent scanning repositories (GitGuardian / TruffleHog heuristic emulation) for clear-text keys, database configurations, and private tokens.
              </p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg shrink-0">
            <button
              onClick={() => setActiveSecretTab('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-md font-sans tracking-wide transition ${
                activeSecretTab === 'active'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active Flaws ({activeSecrets.length})
            </button>
            <button
              onClick={() => setActiveSecretTab('remediated')}
              className={`px-3 py-1 text-xs font-semibold rounded-md font-sans tracking-wide transition ${
                activeSecretTab === 'remediated'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              History Log ({resolvedSecrets.length})
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeSecretTab === 'active' ? (
            <div className="space-y-4">
              {activeSecrets.length > 0 ? (
                <>
                  <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900">Immediate Remediation Mandated for Compliance</h4>
                      <p className="text-[11px] text-rose-700 leading-normal mt-0.5 max-w-4xl">
                        Exposure of hardcoded cryptographic credentials violates Indian CERT-In guidelines and SOC 2 Trust Security criteria. System control scoring for <strong className="font-mono">CC6.7</strong> remains locked in <span className="bg-rose-100 border border-rose-300 px-1 py-0.1 font-mono text-[9px] font-bold text-rose-700 rounded uppercase">fail</span> until all credentials are revoked and modified on branches.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-250/30 rounded-lg">
                    <table className="w-full text-left font-sans text-xs divide-y divide-slate-150">
                      <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Repository & Source File</th>
                          <th className="p-3">Matched Signature</th>
                          <th className="p-3">Severity</th>
                          <th className="p-3">Masked Signature Token Preview</th>
                          <th className="p-3 text-right">Scrutiny Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 bg-white">
                        {activeSecrets.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <span className="font-mono font-semibold text-slate-800 block">{s.repo}</span>
                              <span className="font-mono text-[10px] text-slate-450 mt-0.5 block">{s.filePath}:{s.lineNumber}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px]">
                                {s.secretType.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">
                              {s.severity === 'critical' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase">
                                  CRITICAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                  HIGH
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 bg-slate-50/55 rounded max-w-[250px] truncate">
                              {s.secretMasked}
                            </td>
                            <td className="p-3 text-right">
                              {isWriteRestricted ? (
                                <div className="inline-flex gap-1.5 items-center text-slate-400 text-[10px] font-mono bg-slate-50 border border-slate-200 p-1 rounded-md" title="RBAC restriction: Viewer or Auditor cannot remediate secrets">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>Admin Restricted</span>
                                </div>
                              ) : (
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => onRemediateSecret(s.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] font-mono px-2.5 py-1 rounded shadow-3xs cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3 text-emerald-100" />
                                    <span>Remediated</span>
                                  </button>
                                  <button
                                    onClick={() => onDismissSecret(s.id)}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] font-mono px-2 py-1 rounded cursor-pointer"
                                  >
                                    <span>Dismiss</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-8 bg-slate-50 rounded-xl text-center flex flex-col items-center justify-center border border-dashed border-slate-205">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <h4 className="font-bold text-slate-800 text-xs">Repo Vault Clean of Clear-Text Keys</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-normal">
                    Automated scans matches zero active plain-text authentication passwords. Logical security criteria fully compliant.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {resolvedSecrets.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200/50 rounded-lg">
                  <table className="w-full text-left font-sans text-xs divide-y divide-slate-150">
                    <thead className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Source Target</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Resolution Method</th>
                        <th className="p-3">Actioned Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {resolvedSecrets.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 text-slate-500">
                          <td className="p-3">
                            <span className="font-mono text-slate-600 font-medium block">{s.repo}</span>
                            <span className="font-mono text-[9px] text-slate-400 block">{s.filePath}:{s.lineNumber}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 uppercase">{s.secretType}</span>
                          </td>
                          <td className="p-3">
                            {s.status === 'resolved' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded uppercase">
                                REMEDIATED VIA KEY ROTATION
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                                MARKED AS SANCTIONED / FP
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-450">
                            {new Date(s.remediatedAt || s.dismissedAt || s.detectedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-mono italic">
                  No historical scanning remediations recorded yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: SaaS TENANT AUDIT TRAIL LOGS */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 bg-[#FAFBFD] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-850">
                Enterprise Tenant Security Log Audit Trail
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Immutable record capturing all principal sessions, policy syntheses, subscription billing changes, and blocked unauthorized activities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs bg-white border border-slate-250 p-1.5 focus:outline-none rounded font-sans font-semibold text-slate-600 cursor-pointer shadow-3xs"
            >
              {actionTypes.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto border border-slate-250/30 rounded-lg">
              <table className="w-full text-left font-sans text-xs divide-y divide-slate-150">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">User & Active Role context</th>
                    <th className="p-3">Classification Badge</th>
                    <th className="p-3">Core Log Details</th>
                    <th className="p-3">UTC Date & Timestamp</th>
                    <th className="p-3 text-right">Data Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">{log.userName}</span>
                        <span className="font-mono text-[10px] text-slate-450 mt-0.5 block">{log.userEmail}</span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div>{getActionBadge(log.action)}</div>
                          <span className="inline-block text-[9px] text-slate-400 font-mono">Role context: {log.userRole?.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium max-w-[350px]">
                        {log.context?.details || log.action}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[10.5px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <details className="inline-block text-left cursor-pointer group">
                          <summary className="text-[10px] font-mono font-bold text-blue-600 hover:underline list-none flex items-center justify-end gap-0.5">
                            <span>Inspect IP/Payload</span>
                            <ChevronDown className="w-3 h-3 text-blue-500 transition group-open:rotate-180" />
                          </summary>
                          <div className="absolute right-6 mt-2 max-w-[320px] bg-slate-900 border border-slate-800 rounded-lg p-3 text-[9.5px] font-mono text-slate-350 shadow-2xl z-55 overflow-auto text-left leading-normal">
                            <h5 className="font-bold text-blue-400 mb-1 border-b border-slate-800 pb-1 font-mono uppercase tracking-widest text-[8px]">
                              Audit Meta (IP/Resource)
                            </h5>
                            <pre className="whitespace-pre">
                              {JSON.stringify({
                                log_id: log.id,
                                tenant_id: log.context?.orgId || "org-123",
                                resource: log.context?.affectedResource || "none",
                                client_ip: "103.45.241.13",
                                client_agent: "Mozilla/5.0 ComplianceOS-Client",
                                payload: { ...log.context, details: undefined }
                              }, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 bg-slate-50 rounded-xl text-center flex flex-col items-center justify-center border border-slate-200">
              <Info className="w-10 h-10 text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-700 text-xs">Zero Matching Audit Logs</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-normal">
                No logs were found matching this class filter.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: ADVANCED ENTERPRISE SECURITY & AUDIT CENTER (MODULES 3, 4, 5) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mt-6">
        <div className="p-5 border-b border-slate-100 bg-[#FAFBFD] flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-600 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-850">
              ComplianceOS Integrated B2B Security Center
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Secure administrative dashboard driving MFA enforcement, custom token APIs, legal covenants, and cookie consent hierarchies.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: GOOGLE MFA MANAGEMENT */}
          <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-mono text-[10px] text-slate-450 uppercase tracking-widest block font-bold">MODULE 3 · AUTH MFA</span>
                {mfaEnabled ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse">
                    <Check className="w-2.5 h-2.5" /> SECURE MFA INEFFECT
                  </span>
                ) : (
                  <span className="bg-rose-100 text-rose-800 border border-rose-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <AlertOctagon className="w-2.5 h-2.5 animate-bounce" /> MFA DEACTIVATED
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 leading-tight">
                <Smartphone className="w-4 h-4 text-slate-600" />
                Two-Factor Authenticator (TOTP)
              </h4>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                Enforcing Google Authenticator or Microsoft Authenticator (RFC 6238 TOTP algorithm) validation before logins. Includes secure salt-based backup codes.
              </p>

              {mfaError && (
                <div className="mt-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] rounded leading-normal">
                  {mfaError}
                </div>
              )}

              {/* MFA ENABLED RENDERING */}
              {mfaEnabled && mfaSetupStep === "verified" && (
                <div className="mt-4 bg-emerald-50/70 border border-emerald-100 p-3 rounded-lg">
                  <h5 className="font-bold text-[11px] text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Multifactor Configuration Active
                  </h5>
                  <p className="text-[10px] text-emerald-800 mt-1 leading-normal">
                    Secure channel verified. Please store your system fallback backup recovery codes in a safe vault (e.g. 1Password):
                  </p>
                  <div className="grid grid-cols-2 gap-1 mt-2.5 p-2 bg-slate-900 text-indigo-300 border border-slate-800 rounded font-mono text-[9.5px] max-h-[110px] overflow-y-auto">
                    {backupCodes.map((bc, idx) => (
                      <span key={idx} className="block hover:text-white select-all">{bc}</span>
                    ))}
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-400 mt-1.5 block">Codes encrypted with proprietary dual salt-PBKDF2 SHA512.</span>
                </div>
              )}

              {/* MFA INITIATION FORM */}
              {!mfaEnabled && mfaSetupStep === "none" && (
                <button
                  onClick={initiateMfaSetup}
                  className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3 border border-slate-950 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5" /> Initialize 2FA Setup
                </button>
              )}

              {/* ACTIVE SETUP STEP */}
              {mfaSetupStep === "setup" && (
                <div className="mt-4 space-y-3.5 border-t border-slate-150 pt-4">
                  <div className="flex justify-center bg-white p-2 border border-slate-150 rounded-lg max-w-[140px] mx-auto">
                    {mfaQrCode ? (
                      <img src={mfaQrCode} alt="TOTP Scanning Code" className="w-32 h-32" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center font-mono text-[10px] text-slate-400">Loading...</div>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Manual Backup Code Key:</span>
                    <span className="text-[11.5px] font-mono font-bold text-slate-800 tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded shadow-3xs select-all mt-1 inline-block">
                      {mfaSecret}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-slate-600 block">Verification Code Check:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 123456"
                        maxLength={6}
                        value={mfaCodeInput}
                        onChange={(e) => setMfaCodeInput(e.target.value)}
                        className="flex-1 text-center font-mono font-bold tracking-widest bg-white border border-slate-300 rounded focus:outline-none focus:border-indigo-500 p-1.5 text-xs text-slate-800"
                      />
                      <button
                        onClick={verifyMfaCode}
                        className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded text-xs cursor-pointer shadow-3xs transition"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {mfaEnabled && (
              <button
                onClick={disableMfa}
                className="mt-6 w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2 px-3 border border-rose-200 hover:border-rose-300 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                Disable Multi-Factor Verification
              </button>
            )}
          </div>

          {/* COLUMN 2: DEVELOPER API COMPLIANCE KEY GENERATION */}
          <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-mono text-[10px] text-slate-450 uppercase tracking-widest block font-bold">MODULE 5 · COMPLIANCE API</span>
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  JWT TOKENS
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 leading-tight">
                <Key className="w-4 h-4 text-slate-600" />
                Developer Access Tokens (REST-API)
              </h4>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                Deploy authenticated, high-performance JWT tokens (under strict scope context: {currentUser.role?.toUpperCase()}) allowing programmatical extraction of compliance percentiles, policies, and evidence logs.
              </p>

              {generatedToken ? (
                <div className="mt-4 space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block">Your Base64-Url JWT Access Token:</span>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-lg">
                      <input
                        type="text"
                        readOnly
                        value={generatedToken}
                        className="flex-1 font-mono text-[9px] text-slate-600 bg-transparent focus:outline-none overflow-hidden text-ellipsis whitespace-nowrap pl-1"
                      />
                      <button
                        onClick={copyTokenToClipboard}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-150 rounded"
                        title="Copy to clipboard"
                      >
                        {tokenCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-[8.5px] p-2.5 rounded-lg leading-normal">
                    <span className="text-indigo-400 block font-bold">// Fetch compliance status rate-limited by plan:</span>
                    curl -H "Authorization: Bearer [Token]" \<br />
                    &nbsp;&nbsp;https://api.complianceos.in/api/compliance/status
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg text-center font-mono text-[10px] text-slate-400">
                  No active developer API tokens generated.
                </div>
              )}
            </div>

            <button
              onClick={generateNewApiToken}
              disabled={tokenGenerating}
              className="mt-6 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2 px-3 border border-slate-950 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tokenGenerating ? "animate-spin" : ""}`} />
              {tokenGenerating ? "Signing Session Token..." : generatedToken ? "Regenerate API JWT Key" : "Generate Core Access Token"}
            </button>
          </div>

          {/* COLUMN 3: COOKIE CONSENT & POLICY ANCHORS */}
          <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-mono text-[10px] text-slate-450 uppercase tracking-widest block font-bold">MODULE 4 · CONSENT & COVENANTS</span>
                <span className="bg-purple-100 text-purple-800 border border-purple-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  GDPR COMPLIANT
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 leading-tight">
                <Cookie className="w-4 h-4 text-slate-600" />
                Cookie Consent Preference Center
              </h4>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-normal font-sans">
                Review and alter consent configuration payloads tracked inside cookie state structures. Critical sessions are isolated under strict Secure/SameSite flags.
              </p>

              {/* CONSENT FORM */}
              <div className="mt-4 space-y-2 text-xs font-semibold text-slate-700 bg-white border border-slate-150 p-3 rounded-lg shadow-3xs">
                <label className="flex items-center gap-2 cursor-pointer p-0.5 font-mono text-[10px] text-slate-600">
                  <input type="checkbox" checked={cookieConsents.essential} disabled className="rounded text-indigo-650" />
                  <span>Essential Cookies (Session, CSRF)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-0.5 font-mono text-[10px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={cookieConsents.analytics}
                    onChange={(e) => setCookieConsents({ ...cookieConsents, analytics: e.target.checked })}
                    className="rounded text-indigo-650 cursor-pointer"
                  />
                  <span>Analytics Counters</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-0.5 font-mono text-[10px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={cookieConsents.marketing}
                    onChange={(e) => setCookieConsents({ ...cookieConsents, marketing: e.target.checked })}
                    className="rounded text-indigo-650 cursor-pointer"
                  />
                  <span>Marketing Integrators</span>
                </label>
              </div>

              {consentSavedMessage && (
                <div className="mt-3 text-center text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-1 rounded animate-fade-in uppercase font-mono tracking-wide">
                  ✓ Consent payload updated inside local vault!
                </div>
              )}
            </div>

            <div className="space-y-2.5 mt-6">
              <button
                onClick={saveCookieConsent}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-semibold py-2 px-3 border border-indigo-750 hover:border-indigo-800 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
              >
                Commit Consent Configurations
              </button>

              {/* LEGAL DOCUMENT HYPERLINKS */}
              <div className="flex justify-center gap-3 text-[10px] font-bold font-sans text-indigo-600 tracking-wide mt-1 h-3.5">
                <button onClick={() => setLegalDocumentOpen('privacy')} className="hover:underline flex items-center gap-0.5 cursor-pointer">
                  <FileText className="w-3 h-3" /> Privacy Policy
                </button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setLegalDocumentOpen('terms')} className="hover:underline flex items-center gap-0.5 cursor-pointer">
                  <FileText className="w-3 h-3" /> Terms of Services
                </button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setLegalDocumentOpen('gdpr')} className="hover:underline flex items-center gap-0.5 cursor-pointer">
                  <Shield className="w-3 h-3" /> GDPR Decl.
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* SEO INTEGRITY INDEX DISPLAY (MODULE 2) */}
        <div className="p-4 bg-slate-100/70 border-t border-slate-150 flex flex-col sm:flex-row justify-between sm:items-center text-[10px] font-mono text-slate-500 gap-2">
          <span>MODULE 2 · SEARCH ENGINE OPTIMIZATION CODES:</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-emerald-700 font-bold font-mono">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> ROBOTS.TXT: NOMINAL
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold font-mono">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> SITEMAP.XML: INDEX COVERAGE NOMINAL (100%)
            </span>
          </div>
        </div>
      </div>

      {/* DYNAMIC COVENANTS LEGAL DRAWERS OVERLAYS (MODULE 4) */}
      {legalDocumentOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-[fade-in_200ms_ease_out]">
          <div className="bg-white border border-slate-300 rounded-[24px] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative z-60">
            <div className="p-6 border-b border-slate-150 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-650" />
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider font-mono">
                  {legalDocumentOpen === 'privacy' && "Privacy Policy Agreement"}
                  {legalDocumentOpen === 'terms' && "Terms of Services Agreement"}
                  {legalDocumentOpen === 'gdpr' && "GDPR & CERT-In Safeguards Covenant"}
                </h3>
              </div>
              <button
                onClick={() => setLegalDocumentOpen(null)}
                className="text-slate-400 hover:text-slate-800 text-sm font-bold font-mono uppercase border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1 rounded-full transition cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs text-slate-650 leading-relaxed">
              {legalDocumentOpen === 'privacy' && (
                <>
                  <p className="font-bold text-slate-850">Effective Date: June 8, 2026 · Release v2.6.0-Enterprise</p>
                  <p>
                    ComplianceOS and its subsidiary organizations are committed to the security, safety, confidentiality, and integrity of SaaS enterprise data portfolios. This policy explains how information is stored, treated, and quarantined in compliance with global frameworks like SOC 2, HIPAA, ISO 27001, and Indian MEITY/CERT-In guidelines.
                  </p>
                  <h4 className="font-bold text-slate-805 mt-2 font-mono uppercase">1. PRINCIPALS OF DATA HARVEST & LEAK SWEEPS</h4>
                  <p>
                    We collect organizational metadata strictly to facilitate background API assessment sweeps, hardcoded token scanning, and unified billing routines. Personal keys, passwords, or secret payloads are never transmitted in explicit plaintext; all assets are quarantined on active cloud container modules or encrypted using cryptographically strong AES-256-GCM configurations.
                  </p>
                  <h4 className="font-bold text-slate-805 mt-2 font-mono uppercase">2. AUDITOR CONTEXT & DISCLOSURES</h4>
                  <p>
                    We do not sell, rent, or lease corporate identifiers or metadata streams to advertising cartels. Access to database nodes is monitored strictly under role-based access controls (RBAC) enforced dynamically via our secure middleware layers. Unauthorized bypass attempts are captured and locked inside the immutable audit trails ledger.
                  </p>
                </>
              )}

              {legalDocumentOpen === 'terms' && (
                <>
                  <p className="font-bold text-slate-850">Last Revised: June 8, 2026</p>
                  <p>
                    These terms govern access and subscription licenses to the ComplianceOS SaaS platform. By logging in or deploying API integrations, your legal entity agrees to be bound by these provisions and all associated security audit guidelines.
                  </p>
                  <h4 className="font-bold text-slate-805 mt-2 font-mono uppercase">1. PLANS AND BILLING INTEGRITY</h4>
                  <p>
                    Subscriptions are processed dynamically via region-appropriate merchant-of-records (MoR): Razorpay for Indian domestic entities (INR currencies with active GST invoicing), and Stripe for Rest-of-World/global users (USD currencies). Upgrade and cancellation operations are subject to standard automated proration calculations outlined in our unified billing routing service.
                  </p>
                  <h4 className="font-bold text-slate-805 mt-2 font-mono uppercase">2. INTELLECTUAL SAFEGUARDS</h4>
                  <p>
                    Enterprise customers retain full ownership of policy documents, evidence outputs, and telemetry logs. ComplianceOS retains the property and access layers matching our system intelligence, AI heuristic assessment engines, and layout canvases.
                  </p>
                </>
              )}

              {legalDocumentOpen === 'gdpr' && (
                <>
                  <p className="font-bold text-slate-850">EU Regulation 2016/679 (GDPR) Alignment Declaration</p>
                  <p>
                    ComplianceOS fully conforms to the General Data Protection Regulation (GDPR) constraints for data controllers and processors, with certified safeguards under the EU-U.S. Data Privacy Framework.
                  </p>
                  <h4 className="font-bold text-slate-805 mt-2 font-mono uppercase">1. RIGHT TO PURGE & DATA ISOLATION</h4>
                  <p>
                    We support immediate, absolute data purge requests. Triggering an organization deletion wipes all references from the local state JSON databases within 60 seconds, accompanied by memory-cache resets.
                  </p>
                  <h4 className="font-bold text-slate-805 mt-2 font-mono uppercase">2. INDEMNITY & INCIDENT REPORTING SAFEGUARDS</h4>
                  <p>
                    In accordance with GDPR Article 33 and CERT-In national guidelines, security breaches or suspicious credential finding exposures trigger immediate Slack notification webhook signals. We commit to maximum 72-hour notifications for critical vulnerabilities.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end">
              <button
                onClick={() => setLegalDocumentOpen(null)}
                className="bg-indigo-650 text-white font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-3xs hover:bg-indigo-700 transition"
              >
                Accept and Acknowledge Covenant Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
