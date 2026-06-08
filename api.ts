/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Shield, CheckCircle2, AlertTriangle, XCircle, Play, Sparkles, RefreshCw, 
  Layers, ArrowUpRight, Check, Info, Bot, Activity, Zap, FileCode, CheckCircle, Download
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Control, Framework } from "../types";

interface DashboardProps {
  controls: Control[];
  onTriggerScan: () => void;
  isScanning: boolean;
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ controls, onTriggerScan, isScanning, onNavigateToTab }: DashboardProps) {
  // Compute stats
  const totalCount = controls.length;
  const passedCount = controls.filter((c) => c.status === "pass").length;
  const partialCount = controls.filter((c) => c.status === "partial").length;
  const failedCount = controls.filter((c) => c.status === "fail").length;
  const naCount = controls.filter((c) => c.status === "not_applicable").length;

  const scorePct = totalCount > 0 ? Math.round(((passedCount + partialCount * 0.5) / (totalCount - naCount)) * 100) : 0;

  // Score trend data
  const trendData = [
    { name: "05-01", score: 62 },
    { name: "05-10", score: 68 },
    { name: "05-20", score: 71 },
    { name: "05-30", score: 78 },
    { name: "06-01", score: 82 },
    { name: "06-06", score: scorePct }
  ];

  const frameworks: Framework[] = [
    {
      id: "soc2",
      name: "SOC 2 Type II Accreditation",
      description: "AICPA Trust Services Criteria posture monitoring",
      controlsCount: controls.filter((c) => c.frameworkId === "soc2").length,
      passedCount: controls.filter((c) => c.frameworkId === "soc2" && c.status === "pass").length
    },
    {
      id: "iso27001",
      name: "ISO/IEC 27001:2022 Framework",
      description: "Global Information Security Management clauses mapping",
      controlsCount: controls.filter((c) => c.frameworkId === "iso27001").length,
      passedCount: controls.filter((c) => c.frameworkId === "iso27001" && c.status === "pass").length
    },
    {
      id: "rbi-nbfc",
      name: "RBI IT Master Directions",
      description: "Indian NBFC Core regulated guidelines standard",
      controlsCount: controls.filter((c) => c.frameworkId === "rbi-nbfc").length,
      passedCount: controls.filter((c) => c.frameworkId === "rbi-nbfc" && c.status === "pass").length
    }
  ];

  const calculateFrameworkScore = (fId: string) => {
    const fwControls = controls.filter((c) => c.frameworkId === fId);
    if (fwControls.length === 0) return 0;
    const passed = fwControls.filter((c) => c.status === "pass").length;
    return Math.round((passed / fwControls.length) * 100);
  };

  const exportComplianceReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalControls: totalCount,
        passed: passedCount,
        partial: partialCount,
        failed: failedCount,
        scorePercent: scorePct,
      },
      frameworks: frameworks.map((f) => ({
        ...f,
        score: calculateFrameworkScore(f.id),
      })),
      controls: controls.map((c) => ({
        id: c.controlId,
        name: c.name,
        framework: c.frameworkId,
        status: c.status,
        lastCheckedAt: c.lastCheckedAt,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `complianceos-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const recentRuns = [
    { id: "run-1", framework: "SOC2 CC6.1", type: "AUTOMATED", status: "pass", title: "Verify AWS S3 bucket encryption keys", time: "2 mins ago" },
    { id: "run-2", framework: "ISO27001 A.9", type: "AUTOMATED", status: "pass", title: "Audit Active Directory multi-factor access logs", time: "12 mins ago" },
    { id: "run-3", framework: "RBI D7.1", type: "MANUAL", status: "partial", title: "Validate Disaster Recovery Drill reporting node", time: "1 hour ago" },
    { id: "run-4", framework: "SOC2 CC7.2", type: "AUTOMATED", status: "fail", title: "Scan GitHub master vulnerability alerts", time: "3 hours ago" },
    { id: "run-5", framework: "ISO27001 A.12", type: "AUTOMATED", status: "pass", title: "Database security baseline scan verified configurations", time: "5 hours ago" }
  ];

  return (
    <div className="space-y-6 select-none font-sans text-slate-900 dark:text-slate-100 animate-[fade-in_300ms_ease_out]">
      
      {/* Telemetry Hero Header Area */}
      <div className="glass-panel p-6 md:p-8 rounded-[28px] overflow-hidden relative border border-indigo-500/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/10 dark:bg-indigo-600/15 blur-[60px] pointer-events-none rounded-full" />
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-550/10 border border-indigo-500/20 text-indigo-500 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Active Posture Center
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight font-display text-slate-900 dark:text-white">
            Compliance Command Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Continuous compliance sweeps with real-time SOC 2, ISO 27001, and RBI NBFC telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportComplianceReport}
            className="inline-flex items-center gap-2 bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 text-slate-200 font-mono font-semibold text-xs px-4 py-3 rounded-2xl transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT REPORT</span>
          </button>
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className={`relative group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono font-semibold text-xs px-5 py-3 rounded-2xl shadow-lg hover:shadow-indigo-550/30 transition-all duration-250 cursor-pointer active:scale-95 disabled:scale-100 disabled:opacity-85 ${
              isScanning ? "animate-pulse" : ""
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>SWEEPING PLATFORM INFRA...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white fill-current" />
                <span>TRIGGER ACTIVE SWEEP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Analytics 4 Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between border border-indigo-500/15 min-h-[140px] shadow-lg">
          <div className="absolute top-3 right-3 p-2 bg-indigo-650/15 rounded-xl border border-indigo-500/10">
            <Shield className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-450 uppercase block mb-1">Overall Posture Weighted Score</span>
            <div className="flex items-baseline gap-2.5">
              <span className={`text-4xl font-extrabold tracking-tight font-display ${scorePct > 80 ? "text-emerald-500" : "text-amber-500"}`}>
                {scorePct}%
              </span>
              <span className="text-[10.5px] font-mono font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center">
                +1.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal mt-2.5">
              Total aggregated controls posture currently compliant.
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between border border-indigo-500/15 min-h-[140px] shadow-lg">
          <div className="absolute top-3 right-3 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-450 uppercase block mb-1">Satisfied Framework Controls</span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-extrabold tracking-tight font-display text-emerald-500">
                {passedCount}/{totalCount}
              </span>
              <span className="text-[10.5px] font-mono font-semibold text-slate-400 block">+3 today</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal mt-2.5">
              Individual posture policies checked and validated as ACTIVE.
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between border border-indigo-500/15 min-h-[140px] shadow-lg">
          <div className="absolute top-3 right-3 p-2 bg-amber-500/10 rounded-xl border border-amber-500/10">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-450 uppercase block mb-1">Critical Deficits Detected</span>
            <div className="flex items-baseline gap-2.5">
              <span className={`text-4xl font-extrabold tracking-tight font-display ${failedCount > 0 ? "text-rose-500" : "text-slate-700 dark:text-slate-300"}`}>
                {failedCount + partialCount}
              </span>
              <span className="text-[10.5px] font-mono font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md text-[10px]">
                {failedCount} Critical
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal mt-2.5">
              Deficits detected from automated sweeps requiring repair.
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between border border-indigo-500/15 min-h-[140px] shadow-lg">
          <div className="absolute top-3 right-3 p-2 bg-[#06B6D4]/10 rounded-xl border border-[#06B6D4]/10">
            <Sparkles className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-450 uppercase block mb-1">Audit Artifact Density Index</span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-extrabold tracking-tight font-display text-[#06B6D4]">
                {Math.round(scorePct * 0.95)}%
              </span>
              <span className="text-[10.5px] font-mono font-semibold text-slate-400">SOC 2 Room</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal mt-2.5">
              Audit artifact preparedness evaluated for regulatory rooms.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Double Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left main area (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Framework Progress List */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/10 shadow-lg">
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-md font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Strategic Compliance Frameworks
              </h4>
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                Mapped Postures
              </span>
            </div>

            <div className="space-y-4">
              {frameworks.map((fw) => {
                const score = calculateFrameworkScore(fw.id);
                return (
                  <div 
                    key={fw.id} 
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-400/30 transition duration-150"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">{fw.name}</h5>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block pr-6">
                        {fw.description}
                      </span>
                    </div>

                    <div className="w-full md:w-64">
                      <div className="flex justify-between text-[11px] font-mono font-semibold mb-1.5">
                        <span className="text-slate-400">{fw.passedCount} / {fw.controlsCount} Completed</span>
                        <span className="font-bold text-indigo-500 dark:text-indigo-400">{score}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-300/10">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            score > 80 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Area Recharts Section */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/10 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold mb-0.5">Continuous Ledger</span>
                <h4 className="text-md font-bold text-slate-900 dark:text-white font-sans uppercase">
                  Accredit Rating Historical Curve
                </h4>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold text-slate-500">
                <span>30-Day Resolution</span>
              </div>
            </div>

            <div className="h-[160px] min-h-[160px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={160} minWidth={0}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(148, 163, 184, 0.4)" 
                    tickLine={false} 
                    style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: "bold" }} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="rgba(148, 163, 184, 0.4)" 
                    tickLine={false} 
                    style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: "bold" }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--bg-card-main)", 
                      borderColor: "rgba(99, 102, 241, 0.3)", 
                      borderRadius: "14px",
                      fontSize: "11px", 
                      color: "var(--text-primary)", 
                      fontFamily: "monospace" 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4338ca" 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    strokeWidth={2.5} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Directory Summary Cards Widgets */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/10 shadow-lg">
            <h4 className="text-xs font-mono font-bold text-indigo-500 tracking-widest uppercase mb-4">
              Status Allocation Matrices
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-emerald-500/10 p-4 rounded-2xl text-center">
                <span className="text-emerald-500 font-mono text-xs font-bold uppercase">Passing Postures</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 block">{passedCount}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Verified Healthy Node</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-amber-500/10 p-4 rounded-2xl text-center">
                <span className="text-amber-500 font-mono text-xs font-bold uppercase">Partial Gaps</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 block">{partialCount}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Requiring Mitigation</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-rose-500/10 p-4 rounded-2xl text-center">
                <span className="text-rose-500 font-mono text-xs font-bold uppercase">Deficient Outages</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 block">{failedCount}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Immediate Action Node</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-indigo-500/10 p-4 rounded-2xl text-center">
                <span className="text-cyan-500 font-mono text-xs font-bold uppercase font-semibold">Excluded / N/A</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 block">{naCount}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Not mapped to scope</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-indigo-500/10 p-4 rounded-2xl text-center">
                <span className="text-indigo-400 font-mono text-xs font-bold uppercase">Assigned Owners</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 block font-bold">
                  {controls.filter(c => c.assigneeId).length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Accountable CISOs</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-indigo-500/10 p-4 rounded-2xl text-center">
                <span className="text-purple-400 font-mono text-xs font-bold uppercase">Awaiting Audit</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 block">3</span>
                <span className="text-[10px] text-slate-400 block mt-1">Pending validation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Section (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Runs / Evidence Sweeps feed card */}
          <div className="glass-panel p-5 rounded-3xl border border-indigo-500/10 shadow-lg flex flex-col h-full">
            <span className="text-[10px] font-mono text-indigo-400 tracking-wider block uppercase font-bold mb-1">Live Integration Stream</span>
            <h4 className="text-[14px] font-bold text-slate-900 dark:text-white font-display uppercase mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
              Recent Evidence Sweepers
            </h4>

            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[400px] pr-1 scrollbar-thin">
              {recentRuns.map((r) => (
                <div 
                  key={r.id} 
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-205/40 dark:border-white/5 p-4 rounded-2xl hover:border-indigo-500/20 transition-all font-sans"
                >
                  <div className="flex justify-between items-center gap-2 mb-1.5">
                    <span className="text-indigo-500 dark:text-indigo-400 font-mono font-bold text-[10px] uppercase tracking-wide">
                      {r.framework}
                    </span>
                    <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      r.type === "AUTOMATED" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                    }`}>
                      {r.type}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed mb-3 pr-2">
                    {r.title}
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${r.status === "pass" ? "bg-emerald-500" : r.status === "fail" ? "bg-rose-500" : "bg-amber-500 animate-pulse"}`} />
                      <span>{r.status}</span>
                    </div>
                    <span>{r.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onNavigateToTab("evidence")}
              className="w-full mt-5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/15 text-indigo-500 font-sans font-bold text-xs py-3 rounded-2xl transition text-center cursor-pointer active:scale-98"
            >
              Open Evidence Locker Registry →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
