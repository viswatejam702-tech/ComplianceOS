/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, Terminal } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ComplianceOS ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div id="error-boundary-container" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Aesthetic top boundary indicator */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 via-indigo-500 to-indigo-600" />
            
            <div className="flex items-start gap-5">
              <div className="p-3 bg-rose-505/10 border border-rose-500/20 text-rose-500 rounded-xl shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-widest block">
                  SYSTEM_UI_RECOVERY • RUNTIME SHIELD
                </span>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Application Interface Failure
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  A critical error occurred while rendering the user interface elements. To defend the system integrity and preserve active configuration states, render sequestration was enacted.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 font-bold uppercase">
                  <Terminal className="w-4 h-4 text-rose-400" />
                  <span>Diagnostics Breakdown:</span>
                </div>
                <div className="text-xs font-mono bg-slate-900 p-3 rounded-lg border border-slate-850 text-slate-300 overflow-x-auto whitespace-pre-wrap select-all">
                  {this.state.error?.toString() || "Unknown UI rendering crash"}
                </div>

                {this.state.errorInfo && (
                  <details className="group mt-2">
                    <summary className="text-[10px] font-mono text-indigo-400 font-bold cursor-pointer hover:text-indigo-300 transition select-none flex items-center gap-1.5 focus:outline-none">
                      <span>VIEW DETAILED STACK TRACE</span>
                      <span className="text-[8px] transition-transform group-open:rotate-90">▶</span>
                    </summary>
                    <div className="mt-2.5 max-h-[160px] overflow-y-auto text-[9.5px] font-mono bg-slate-900/90 p-3 rounded-lg border border-slate-850 text-indigo-300 leading-normal scrollbar-thin">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 gap-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  ComplianceOS Protection
                </span>
                <button
                  id="reload-page"
                  onClick={this.handleReload}
                  className="bg-indigo-650 hover:bg-indigo-600 active:translate-y-px text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer select-none shadow-md shadow-indigo-950/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload System Interface</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
