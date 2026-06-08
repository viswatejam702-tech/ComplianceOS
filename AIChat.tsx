/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Shield, LayoutDashboard, CheckSquare, Database, FileText, ShieldCheck, 
  CreditCard, Network, Bell, Bot, Sparkles, RefreshCw, AlertTriangle, 
  X, Plus, HelpCircle, History, User, Terminal, Moon, Sun, Search,
  Settings, Command, Keyboard, Monitor
} from "lucide-react";

import { Control, AuditComment, EvidenceItem, Policy, PolicyVersion, AuditEngagement, Subscription, Invoice, Membership, Role, IntegrationRun } from "./types";
import Dashboard from "./components/Dashboard";
import Controls from "./components/Controls";
import Evidence from "./components/Evidence";
import Policies from "./components/Policies";
import Audits from "./components/Audits";
import Billing from "./components/Billing";
import Integrations from "./components/Integrations";
import AIAgentTab from "./components/AIAgentTab";
import AuditTrails from "./components/AuditTrails";
import ThreeBackground from "./components/ThreeBackground";
import ErrorBoundary from "./components/ErrorBoundary";
import { apiFetch, initCsrf } from "./lib/api";

const AVAILABLE_USERS = [
  { id: "usr-1", email: "viswatejam45@gmail.com", name: "Viswa Teja", role: "owner" as Role, desc: "Owner & Founder" },
  { id: "usr-2", email: "shreya@zetatech.in", name: "Shreya Sen (CISO)", role: "admin" as Role, desc: "Admin & Sec-Ops CISO" },
  { id: "usr-3", email: "auditor@deloitte.in", name: "Rohan Gupta", role: "auditor" as Role, desc: "External Deloitte Auditor" },
  { id: "usr-4", email: "viewer@zetatech.in", name: "Viewer User", role: "viewer" as Role, desc: "Read-Only Regulatory Viewer" }
];

export default function App() {
  const orgId = "org-123"; // Standard seed organization
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Modern SaaS Redesign Additional UI States
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("complianceOS_theme");
      return saved === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [commandSearch, setCommandSearch] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState({
    organizationName: "Zeta Technologies Private Limited",
    customGstin: "27AAAAA1111A1Z1",
    vatRate: "18%"
  });
  const [activeNotificationToast, setActiveNotificationToast] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    initCsrf().finally(() => setIsBootstrapping(false));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("complianceOS_theme", theme);
  }, [theme]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K (Command Palette)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Esc (Dismiss modals)
      if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsProfileOpen(false);
      }
      // Alt + T (Toggle Theme)
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTheme(prev => prev === "dark" ? "light" : "dark");
        triggerMiniToast("Theme toggled successfully via shortcut!");
      }
      // Alt + S (Active Scan Sweep)
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        triggerAutomatedScan();
        triggerMiniToast("Triggering active compliance scan sweep!");
      }
      // Tab Jumper shortcuts (1-9)
      if (e.altKey && e.key >= "1" && e.key <= "9") {
        const tabsMap = [
          "dashboard", "controls", "evidence", "policies", 
          "audit", "ai-agent", "settings/integrations", "settings/billing", "audit-trails"
        ];
        const idx = parseInt(e.key) - 1;
        if (idx < tabsMap.length) {
          e.preventDefault();
          setActiveTab(tabsMap[idx]);
          setFocusControlId(undefined);
          triggerMiniToast(`Switched to tab: ${tabsMap[idx].toUpperCase()}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerMiniToast = (msg: string) => {
    setActiveNotificationToast(msg);
    setTimeout(() => setActiveNotificationToast(null), 3000);
  };

  // Platform-wide state
  const [controls, setControls] = useState<Control[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [audits, setAudits] = useState<AuditEngagement[]>([]);
  const [comments, setComments] = useState<AuditComment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [integrationRuns, setIntegrationRuns] = useState<IntegrationRun[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // RBAC & Persistent Telemetry State
  const [secretFindings, setSecretFindings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("complianceOS_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (AVAILABLE_USERS.some(u => u.id === parsed.id)) return parsed;
        } catch (e) {}
      }
    }
    return AVAILABLE_USERS[0];
  });

  // Standard request wrapper incorporating headers and 403-Forbidden rejections
  const request = async (url: string, init?: RequestInit) => {
    setPermissionError(null);
    const headers = {
      ...(init?.headers || {}),
      "x-user-id": currentUser.id,
      "x-user-role": currentUser.role
    };

    try {
      const response = await apiFetch(url, { ...init, headers });
      if (response.status === 403) {
        const data = await response.json();
        setPermissionError(data.error || "Permission Denied: Your active role context restricts this action.");
        // Dismiss alert bubble automatically in 7 seconds
        setTimeout(() => setPermissionError(null), 7000);
        return null;
      }
      return response;
    } catch (e) {
      console.error(`Request fails for ${url}:`, e);
      return null;
    }
  };

  const switchActiveUser = async (user: any) => {
    setCurrentUser(user);
    localStorage.setItem("complianceOS_user", JSON.stringify(user));
    setPermissionError(null);
    try {
      await apiFetch(`/api/orgs/${orgId}/audit-logs/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: user.role })
      });
      // Force trigger state reload using intermediate user details
      setTimeout(() => fetchWorkspaceTelemetry(user), 50);
    } catch (e) {
      console.error(e);
    }
  };

  // Sub-systems UI flags
  const [isScanning, setIsScanning] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [focusControlId, setFocusControlId] = useState<string | undefined>(undefined);

  // Load backend database telemetry
  const fetchWorkspaceTelemetry = async (activeUser = currentUser) => {
    try {
      // Setup dynamic tracking headers
      const callHeaders = {
        "x-user-id": activeUser.id,
        "x-user-role": activeUser.role
      };

      const getter = async (url: string) => {
        const res = await apiFetch(url, { headers: callHeaders });
        if (res.status === 403) return null;
        return res.json();
      };

      // Fetch controls
      const dataControls = await getter(`/api/orgs/${orgId}/controls`);
      if (dataControls) setControls(dataControls.controls);

      // Fetch evidence
      const dataEvidence = await getter(`/api/orgs/${orgId}/evidence`);
      if (dataEvidence) setEvidence(dataEvidence.evidence);

      // Fetch policies
      const dataPolicies = await getter(`/api/orgs/${orgId}/policies`);
      if (dataPolicies) {
        setPolicies(dataPolicies.policies);
        setVersions(dataPolicies.versions);
      }

      // Fetch audits and remarks
      const dataAudits = await getter(`/api/orgs/${orgId}/audits`);
      if (dataAudits) {
        setAudits(dataAudits.audits);
        setComments(dataAudits.comments);
      }

      // Fetch billing
      const dataBilling = await getter(`/api/orgs/${orgId}/billing/details`);
      if (dataBilling) {
        setSubscription(dataBilling.subscription);
        setInvoices(dataBilling.invoices);
      }

      // Fetch integrations
      const dataIntegrations = await getter(`/api/orgs/${orgId}/integrations`);
      if (dataIntegrations) setIntegrations(dataIntegrations.integrations);

      // Fetch integration runs
      const dataRuns = await getter(`/api/orgs/${orgId}/integrations/runs`);
      if (dataRuns) setIntegrationRuns(dataRuns.runs);

      // Fetch notifications
      const dataNotifs = await getter(`/api/orgs/${orgId}/notifications`);
      if (dataNotifs) setNotifications(dataNotifs.notifications);

      // Fetch secrets
      const dataSecrets = await getter(`/api/orgs/${orgId}/secrets`);
      if (dataSecrets) setSecretFindings(dataSecrets.secrets);

      // Fetch audit logs
      const dataAuditLogs = await getter(`/api/orgs/${orgId}/audit-logs`);
      if (dataAuditLogs) setAuditLogs(dataAuditLogs.auditLogs);

    } catch (e) {
      console.error("Could not fetch database telemetry from Express node services:", e);
    }
  };

  useEffect(() => {
    fetchWorkspaceTelemetry();
  }, []);

  // API triggers: Compliance Scanners
  const triggerAutomatedScan = async () => {
    setIsScanning(true);
    try {
      const response = await request(`/api/orgs/${orgId}/evidence/run`, {
        method: "POST"
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error("Trigger compliance scanner failed:", e);
    } finally {
      setIsScanning(false);
    }
  };

  // API triggers: Override individual control records parameters
  const updateControlRecord = async (controlId: string, params: Record<string, any>) => {
    try {
      const response = await request(`/api/orgs/${orgId}/controls/${controlId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Add interactive auditor chat comment strings
  const addNewAuditComment = async (controlId: string, commentText: string, role: Role) => {
    try {
      const activeAuditId = audits[0]?.id || "aud-1";
      const response = await request(`/api/orgs/${orgId}/audits/${activeAuditId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId,
          comment: commentText,
          authorName: role === "auditor" ? "Rohan Gupta (Auditor)" : "Viswa Teja (CISO)",
          authorRole: role
        })
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Upload manual compliance evidence items
  const uploadManualEvidenceItem = async (controlId: string, fileName: string, fileContent: string) => {
    try {
      const response = await request(`/api/orgs/${orgId}/evidence/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId,
          name: fileName,
          content: fileContent,
          type: "pdf"
        })
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Policy doc synthesis utilizing Gemini
  const generateSecurityPolicyWithGemini = async (policyParams: {
    type: string;
    companyName: string;
    techStack: string;
    teamSize: number;
    primaryData: string;
  }) => {
    try {
      const response = await request(`/api/orgs/${orgId}/policies/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyParams)
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
        setActiveTab("policies");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Update security policy workflow approvals
  const updatePolicyWorkflowStatus = async (policyId: string, status: 'draft' | 'review' | 'approved', content?: string) => {
    try {
      const response = await request(`/api/orgs/${orgId}/policies/${policyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, content })
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Razorpay recurrent subscription activation
  const subscribeToPlanWithRazorpay = async (planId: 'starter' | 'growth' | 'enterprise', gstin?: string) => {
    try {
      const response = await request(`/api/orgs/${orgId}/billing/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, gstin })
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
        setActiveTab("settings/billing");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Create secondary audit scopes
  const createNewAuditEngagement = async (auditParams: {
    frameworkId: string;
    name: string;
    externalAuditorEmail: string;
    externalAuditorName: string;
    targetDays: number;
  }) => {
    try {
      const response = await request(`/api/orgs/${orgId}/audits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditParams)
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Create connection tags
  const connectCloudIntegration = async (type: string, config: Record<string, any>) => {
    try {
      const response = await request(`/api/orgs/${orgId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, config })
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const disconnectCloudIntegration = async (type: string) => {
    try {
      const response = await request(`/api/orgs/${orgId}/integrations/${type}`, {
        method: "DELETE"
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API triggers: Remediate and dismiss secret findings
  const remediateSecretFinding = async (findingId: string) => {
    try {
      const response = await request(`/api/orgs/${orgId}/secrets/${findingId}/remediate`, {
        method: "POST"
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const dismissSecretFinding = async (findingId: string) => {
    try {
      const response = await request(`/api/orgs/${orgId}/secrets/${findingId}/dismiss`, {
        method: "POST"
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Notifications read clicker
  const markNotificationAsRead = async (notifId: string) => {
    try {
      const response = await request(`/api/orgs/${orgId}/notifications/${notifId}`, {
        method: "PUT"
      });
      if (response && response.ok) {
        await fetchWorkspaceTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Extract initials for the logged user badge
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col relative select-none font-sans transition-colors duration-300">
      {/* Dynamic Background Canvas */}
      <ThreeBackground />

      {/* Grid Parallax Light Mode Base */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />

      {/* Mini Top Action Keyboard Shortcut Toast */}
      {activeNotificationToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-indigo-650/95 border border-indigo-500/30 text-white text-[12px] px-4 py-2 rounded-full shadow-lg font-mono tracking-wide z-100 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{activeNotificationToast}</span>
        </div>
      )}

      {/* SPOTLIGHT SEARCH (COMMAND PALETTE) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900/90 dark:bg-slate-905/95 border border-indigo-500/30 rounded-[28px] w-full max-w-xl shadow-2xl overflow-hidden animate-float">
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-950/40">
              <Search className="w-5 h-5 text-indigo-500 animate-pulse" />
              <input
                type="text"
                placeholder="Search tabs, actions, roles or shortcuts..."
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                className="w-full bg-transparent border-none text-white text-sm outline-none placeholder-slate-400 font-sans focus:outline-none focus:ring-0 focus:border-transparent py-1.5"
                autoFocus
              />
              <button 
                onClick={() => setIsCommandPaletteOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
              {(() => {
                const commandItems = [
                  { label: "Dashboard Command", icon: LayoutDashboard, category: "Navigation", action: () => { setActiveTab("dashboard"); setIsCommandPaletteOpen(false); } },
                  { label: "Controls Register Hub", icon: CheckSquare, category: "Navigation", action: () => { setActiveTab("controls"); setIsCommandPaletteOpen(false); } },
                  { label: "Evidence Locker Registry", icon: Database, category: "Navigation", action: () => { setActiveTab("evidence"); setIsCommandPaletteOpen(false); } },
                  { label: "Compliance Policies Editor", icon: FileText, category: "Navigation", action: () => { setActiveTab("policies"); setIsCommandPaletteOpen(false); } },
                  { label: "External Auditor Assessment Desk", icon: ShieldCheck, category: "Navigation", action: () => { setActiveTab("audit"); setIsCommandPaletteOpen(false); } },
                  { label: "Gemini AI Automation Assistant", icon: Bot, category: "Navigation", action: () => { setActiveTab("ai-agent"); setIsCommandPaletteOpen(false); } },
                  { label: "Configuration & Connected Integrations", icon: Network, category: "Navigation", action: () => { setActiveTab("settings/integrations"); setIsCommandPaletteOpen(false); } },
                  { label: "Billing Gateway Routing Simulator", icon: CreditCard, category: "Navigation", action: () => { setActiveTab("settings/billing"); setIsCommandPaletteOpen(false); } },
                  { label: "Immutable Platform Audit Log History", icon: History, category: "Navigation", action: () => { setActiveTab("audit-trails"); setIsCommandPaletteOpen(false); } },
                  { label: "Trigger Active Scan / Infrastructure Sweep", icon: RefreshCw, category: "Actionable Utility", action: () => { triggerAutomatedScan(); setIsCommandPaletteOpen(false); } },
                  { label: "Toggle Dark / Light Visual Theme", icon: Sun, category: "Actionable Utility", action: () => { setTheme(t => t === 'light' ? 'dark' : 'light'); setIsCommandPaletteOpen(false); } },
                  { label: "Open Enterprise Profile & Preferences Dialog", icon: Settings, category: "Actionable Utility", action: () => { setIsProfileOpen(true); setIsCommandPaletteOpen(false); } },
                  { label: "Role Swap: Viswa Teja (Owner)", icon: User, category: "Simulate RBAC Identity", action: () => { switchActiveUser(AVAILABLE_USERS[0]); setIsCommandPaletteOpen(false); } },
                  { label: "Role Swap: Shreya Sen (Admin CISO)", icon: User, category: "Simulate RBAC Identity", action: () => { switchActiveUser(AVAILABLE_USERS[1]); setIsCommandPaletteOpen(false); } },
                  { label: "Role Swap: Rohan Gupta (Deloitte Auditor)", icon: User, category: "Simulate RBAC Identity", action: () => { switchActiveUser(AVAILABLE_USERS[2]); setIsCommandPaletteOpen(false); } },
                  { label: "Role Swap: Viewer User (Read-Only)", icon: User, category: "Simulate RBAC Identity", action: () => { switchActiveUser(AVAILABLE_USERS[3]); setIsCommandPaletteOpen(false); } }
                ];
                
                const filtered = commandItems.filter(item => 
                  item.label.toLowerCase().includes(commandSearch.toLowerCase()) || 
                  item.category.toLowerCase().includes(commandSearch.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      No matching commands found. Refine your query.
                    </div>
                  );
                }

                return filtered.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="w-full text-left font-sans text-[12.5px] px-3.5 py-2.5 rounded-xl hover:bg-indigo-600/20 text-slate-300 hover:text-white flex items-center justify-between transition cursor-pointer select-none border border-transparent hover:border-indigo-600/10"
                    >
                      <div className="flex items-center gap-3">
                        <IconComp className="w-4 h-4 text-indigo-400" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-slate-950/80 text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-400/10">
                        {item.category}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>

            <div className="bg-slate-950/80 p-3 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5" />
                Press <span className="bg-slate-800 text-white px-1.5 rounded">Esc</span> to close and <span className="bg-slate-800 text-white px-1.5 rounded">↑↓</span> to choose
              </span>
              <span>ComplianceOS Spotlight Registry</span>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE & PREFERENCES PRESETS MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-indigo-600/30 rounded-[28px] w-full max-w-lg shadow-2xl p-6 relative overflow-hidden animate-float">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 items-center border-b border-white/10 pb-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-600/55 text-indigo-400 font-mono flex items-center justify-center font-black text-lg">
                {getUserInitials(currentUser.name)}
              </div>
              <div>
                <h3 className="text-md font-bold text-white font-sans">{currentUser.name}</h3>
                <span className="text-xs text-indigo-450 font-mono uppercase tracking-wider font-semibold">
                  Captain Context: {currentUser.role.toUpperCase()} ({currentUser.desc})
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Company Legal Identity Entity</label>
                <input
                  type="text"
                  value={userSettings.organizationName}
                  onChange={(e) => setUserSettings({...userSettings, organizationName: e.target.value})}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Compliance VAT Margin</label>
                  <input
                    type="text"
                    value={userSettings.vatRate}
                    onChange={(e) => setUserSettings({...userSettings, vatRate: e.target.value})}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Indian GSTIN Corporate Identifier</label>
                  <input
                    type="text"
                    value={userSettings.customGstin}
                    onChange={(e) => setUserSettings({...userSettings, customGstin: e.target.value})}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 transition font-mono uppercase"
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block mb-1">
                  ⌨️ Global Platform Keyboard Hotkeys
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono text-slate-300">
                  <span className="text-slate-500">⌘K / Ctrl+K</span>
                  <span>Spotlight Search Everywhere</span>
                  <span className="text-slate-500">Alt + T</span>
                  <span>Toggle Visual theme</span>
                  <span className="text-slate-500">Alt + S</span>
                  <span>Trigger compliance Sweep</span>
                  <span className="text-slate-500">Alt + 1...9</span>
                  <span>Jump standard tab indices</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-5 mt-5 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT HEADER REDESIGNED (LINEAR/APPLE GLASS STYLE) */}
      <header className="h-[58px] bg-slate-950/45 dark:bg-slate-950/60 border-b border-indigo-550/10 flex items-center justify-between px-6 shrink-0 z-55 sticky top-0 backdrop-blur-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setIsProfileOpen(true)}>
            <div className="relative flex items-center justify-center">
              <span className="absolute animate-ping w-4 h-4 bg-indigo-500/30 rounded-full" />
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl shrink-0">
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-white text-md tracking-wider font-display block">ComplianceOS</span>
              <span className="text-[7.5px] font-mono tracking-widest text-[#06B6D4]/80 uppercase block font-black leading-none mt-0.5 animate-pulse">
                REDESIGNED PRO CONSOLE
              </span>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/60 border border-white/5 p-1 rounded-2xl">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "controls", label: "Controls", icon: CheckSquare },
              { id: "evidence", label: "Evidence", icon: Database },
              { id: "policies", label: "Policies", icon: FileText },
              { id: "audit", label: "Auditor Desk", icon: ShieldCheck },
              { id: "ai-agent", label: "AI Agent", icon: Bot },
              { id: "settings/integrations", label: "Integrations", icon: Network },
              { id: "settings/billing", label: "Billing", icon: CreditCard },
              { id: "audit-trails", label: "Audit Trails", icon: History }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setFocusControlId(undefined); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase transition-all tracking-wide cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/15"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-indigo-400/40 text-xs font-mono transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Everywhere</span>
            <kbd className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-white border border-white/5">⌘K</kbd>
          </button>

          <button
            onClick={triggerAutomatedScan}
            disabled={isScanning}
            className={`flex items-center gap-1.5 p-2 bg-slate-900/60 hover:bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-slate-400 hover:text-white transition cursor-pointer text-xs font-mono relative ${
              isScanning ? "animate-pulse" : ""
            }`}
            title="compliance sweep (Alt+S)"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden lg:inline font-bold uppercase">Sweep</span>
          </button>

          <button
            onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
            className="p-2 bg-slate-900/60 border border-indigo-500/20 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Switch Visual Theme Mode"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-450" />
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 px-2 py-1 rounded-xl">
            <Monitor className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={currentUser.id}
              onChange={(e) => {
                const selected = AVAILABLE_USERS.find(u => u.id === e.target.value);
                if (selected) switchActiveUser(selected);
              }}
              className="bg-transparent border-none text-white text-[11px] font-mono uppercase font-black outline-none cursor-pointer focus:ring-0 max-w-[120px] py-0"
            >
              {AVAILABLE_USERS.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-950 text-white">
                  {u.name.substring(0, 11)}.. ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 bg-slate-900/80 border border-white/10 rounded-xl text-slate-400 hover:text-white relative transition focus:outline-none cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-indigo-500/20 rounded-[24px] shadow-2xl overflow-hidden py-2 z-55">
                <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-slate-900/60">
                  <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    🛰️ Infrastructure Alerts
                  </span>
                  <button 
                    onClick={() => setIsNotificationsOpen(false)} 
                    className="text-[9px] text-indigo-450 hover:underline font-mono uppercase"
                  >
                    Close
                  </button>
                </div>
                <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3.5 text-[11px] transition hover:bg-indigo-650/10 cursor-pointer ${
                        !n.read ? "bg-indigo-650/5 border-l-2 border-indigo-650 text-white" : "text-slate-400"
                      }`}
                    >
                      <p className="font-sans leading-normal">{n.text}</p>
                      <span className="block text-[8.5px] font-mono text-slate-500 mt-1.5">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-[11.5px] text-slate-500 text-center py-8 font-mono">ALL CHANNELS GREEN</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-xl border border-indigo-550/20 bg-indigo-500/15 hover:border-indigo-550/50 transition flex items-center justify-center text-[11px] font-mono font-black text-indigo-400 cursor-pointer"
            title="Workspace Preferences"
          >
            {getUserInitials(currentUser.name)}
          </button>
        </div>
      </header>

      {/* MOBILE HUD NAVIGATION FOR SMALL SCREENS */}
      <nav className="xl:hidden flex items-center bg-slate-950/90 border-b border-indigo-500/10 p-2 overflow-x-auto shrink-0 z-50 gap-2">
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "controls", label: "Controls", icon: CheckSquare },
          { id: "evidence", label: "Evidence", icon: Database },
          { id: "policies", label: "Policies", icon: FileText },
          { id: "audit", label: "Auditor", icon: ShieldCheck },
          { id: "ai-agent", label: "Agent", icon: Bot },
          { id: "settings/integrations", label: "Configs", icon: Network },
          { id: "settings/billing", label: "Billing", icon: CreditCard },
          { id: "audit-trails", label: "Trails", icon: History }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setFocusControlId(undefined); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-mono font-bold uppercase transition shrink-0 ${
                isActive ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* CONTAINER CHASSIS */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto container mx-auto relative z-30 pb-20">

        {isBootstrapping && (
          <div className="mb-6 bg-slate-900/80 border border-indigo-500/20 rounded-[20px] p-4 flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            <span className="text-sm text-slate-300 font-mono">Initializing secure session &amp; loading compliance telemetry...</span>
          </div>
        )}
        
        {permissionError && (
          <div className="mb-6 bg-rose-950/85 border border-rose-500/30 text-rose-200 rounded-[20px] p-4 flex gap-3 shadow-lg backdrop-blur-md animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[12px] text-white uppercase tracking-wider font-mono">RBAC POLICIES ENFORCED: RESTRICTED ACCESS</h4>
              <p className="text-[11.5px] text-slate-300 leading-normal mt-1 font-sans">
                {permissionError}
              </p>
              <div className="text-[9px] text-rose-400 font-mono mt-1.5 uppercase tracking-wide">
                Security clearance level is insufficient. Security incident has been compiled into the immutable audit trails ledger node.
              </div>
            </div>
            <button 
              onClick={() => setPermissionError(null)}
              className="text-white/60 hover:text-white p-1 rounded-full text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab views with transition bindings */}
        <div className="animate-[fade-in_300ms_ease_out]">
          {activeTab === "dashboard" && (
            <Dashboard
              controls={controls}
              onTriggerScan={triggerAutomatedScan}
              isScanning={isScanning}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "controls" && (
            <Controls
              controls={controls}
              comments={comments}
              onUpdateControl={updateControlRecord}
              onAddComment={addNewAuditComment}
              onManualEvidenceUpload={uploadManualEvidenceItem}
            />
          )}

          {activeTab === "evidence" && (
            <Evidence
              evidence={evidence}
              runs={integrationRuns}
              onTriggerScan={triggerAutomatedScan}
              isScanning={isScanning}
              controls={controls}
              onManualEvidenceUpload={uploadManualEvidenceItem}
            />
          )}

          {activeTab === "policies" && (
            <Policies
              policies={policies}
              versions={versions}
              orgId={orgId}
              onGeneratePolicy={generateSecurityPolicyWithGemini}
              onUpdatePolicyStatus={updatePolicyWorkflowStatus}
            />
          )}

          {activeTab === "audit" && (
            <Audits
              audits={audits}
              comments={comments}
              controls={controls}
              evidence={evidence}
              orgId={orgId}
              onCreateAudit={createNewAuditEngagement}
              onAddComment={addNewAuditComment}
            />
          )}

          {activeTab === "settings/billing" && (
            <Billing
              subscription={subscription || { id: "sub-1", orgId, planId: "growth", planName: "Growth", status: "trialing", amount: 14900, currency: "USD", processor: "stripe", billingCycle: "monthly", currentPeriodEnd: "2026-07-06", cancelAtPeriodEnd: false, paymentMethodLast4: "4242", paymentMethodType: "visa", customerEmail: "viswatejam45@gmail.com", customerCountry: "US", createdAt: "2026-06-06" }}
              invoices={invoices}
              orgId={orgId}
            />
          )}

          {activeTab === "settings/integrations" && (
            <Integrations
              integrations={integrations}
              orgId={orgId}
              onConnect={connectCloudIntegration}
              onDisconnect={disconnectCloudIntegration}
            />
          )}

          {activeTab === "audit-trails" && (
            <AuditTrails
              auditLogs={auditLogs}
              secretFindings={secretFindings}
              currentUser={currentUser}
              onRemediateSecret={remediateSecretFinding}
              onDismissSecret={dismissSecretFinding}
            />
          )}

          {activeTab === "ai-agent" && (
            <AIAgentTab
              orgId={orgId}
              controls={controls}
              integrations={integrations}
              focusControlId={focusControlId}
              onTriggerChecks={triggerAutomatedScan}
              onTriggerPolicyDraft={(type) => {
                setActiveTab("policies");
              }}
              onAssignControl={(ctrlId, usrId) => {
                updateControlRecord(ctrlId, { assigneeId: usrId });
                setActiveTab("controls");
              }}
            />
          )}
        </div>
      </main>

      {/* COMPACT BOTTOM STATUS BAR */}
      <footer className="h-7 bg-slate-950 border-t border-indigo-500/15 fixed bottom-0 left-0 right-0 z-50 px-6 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9.5px] font-mono text-emerald-400 tracking-wider font-bold uppercase flex items-center gap-1">
            ALL POSTURES GREEN // {controls.filter(c => c.status === "pass").length} OF {controls.length} CONTROLS ONLINE
          </span>
        </div>

        <div className="flex-1 max-w-xl mx-8 overflow-hidden hidden md:block">
          <div className="whitespace-nowrap inline-block animate-[marquee_28s_linear_infinite] text-[9.5px] font-mono text-indigo-400/70 uppercase tracking-widest">
            🛡️ SOC2 TRUST CRITERIA INTEGRATED · ⚙️ DEVOPS SWEETENER ACTIVE · 🚀 ZERO REVENUE OUTAGE DETECTED · 🛡️ SEBI COMPLIANT · 🛡️ PADDLE & STRIPE SECURE SCHEMES NOMINAL · 🛰️ DEEP TELEMETRY SINK CONFIGURED
          </div>
        </div>

        <div className="text-[9.5px] font-mono text-slate-500 uppercase tracking-wider">
          ComplianceOS Enterprise v2.6.0 · UPTIME 99.98%
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  );
}
