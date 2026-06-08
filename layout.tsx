/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Network, Github, Cloud, Users, Slack, KanbanSquare, Link2, Link2Off, RefreshCw } from 'lucide-react';
import { Integration } from '../types';

interface IntegrationsProps {
  integrations: Integration[];
  orgId: string;
  onConnect: (type: 'github' | 'aws' | 'gws' | 'slack' | 'jira', config: Record<string, any>) => Promise<void>;
  onDisconnect: (type: 'github' | 'aws' | 'gws' | 'slack' | 'jira') => Promise<void>;
}

export default function Integrations({
  integrations,
  orgId,
  onConnect,
  onDisconnect
}: IntegrationsProps) {
  const [connectingType, setConnectingType] = useState<string | null>(null);

  // Connection parameters overrides
  const [githubReposText, setGithubReposText] = useState("zetatech-api, zetatech-web");
  const [awsAccountText, setAwsAccountText] = useState("987654321012");
  const [gwsDomainText, setGwsDomainText] = useState("zetatech.in");
  const [slackWorkspaceText, setSlackWorkspaceText] = useState("zetatech-hq");
  const [slackWebhookText, setSlackWebhookText] = useState("https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX");
  const [jiraUrlText, setJiraUrlText] = useState("zetatech.atlassian.net");

  const availableIntegrations = [
    {
      type: 'github' as const,
      name: 'GitHub Cloud Integration',
      description: 'Audit repository configurations, branch protectors rules, pull requests approvals timelines, and search Cryptographic keys.',
      icon: <Github className="w-8 h-8 text-slate-800" />
    },
    {
      type: 'aws' as const,
      name: 'AWS Cloud Console',
      description: 'Audit S3 storage bucket policies, verify encryption status, query wildcard IAM configurations, and scan CloudTrail logging trails.',
      icon: <Cloud className="w-8 h-8 text-amber-500" />
    },
    {
      type: 'gws' as const,
      name: 'Google Workspace',
      description: 'Synchronize company directories accounts, audit security parameters, and scan multifactor MFA status across corporate scopes.',
      icon: <Users className="w-8 h-8 text-sky-505" />
    },
    {
      type: 'slack' as const,
      name: 'Slack Collaboration Suite',
      description: 'Inspect private-public channel scopes permissions, authenticate guest connections, and set alerts webhooks on failures.',
      icon: <Slack className="w-8 h-8 text-fuchsia-505" />
    },
    {
      type: 'jira' as const,
      name: 'Jira Software Tracking',
      description: 'Synchronize compliance ticketholder credentials, verify peer change-control checklists, and map SDLC criteria automatically.',
      icon: <KanbanSquare className="w-8 h-8 text-blue-500" />
    }
  ];

  const handleConnectIntegration = async (type: 'github' | 'aws' | 'gws' | 'slack' | 'jira') => {
    let config = {};
    if (type === 'github') config = { repos: githubReposText.split(",").map(r => r.trim()) };
    else if (type === 'aws') config = { accountId: awsAccountText };
    else if (type === 'gws') config = { domain: gwsDomainText };
    else if (type === 'slack') config = { workspace: slackWorkspaceText, webhookUrl: slackWebhookText };
    else if (type === 'jira') config = { domain: jiraUrlText };

    setConnectingType(type);
    try {
      await onConnect(type, config);
    } catch (e) {
      console.error(e);
    } finally {
      setConnectingType(null);
    }
  };

  const handleDisconnectIntegration = async (type: 'github' | 'aws' | 'gws' | 'slack' | 'jira') => {
    setConnectingType(type);
    try {
      await onDisconnect(type);
    } catch (e) {
      console.error(e);
    } finally {
      setConnectingType(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <div className="bg-white border border-slate-205 rounded-xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-500" />
            Integrations & Multi-Cloud API Hub
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Connect corporate directories and engineering stacks to populate automated evidence items instantly.
          </p>
        </div>
        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-150 px-3 py-1 rounded-full uppercase font-bold">
          {integrations.filter(i => i.status === 'connected').length} connected interfaces
        </span>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {availableIntegrations.map((item) => {
          const linkedObj = integrations.find(i => i.type === item.type);
          const isLinked = linkedObj?.status === 'connected';
          const isPending = connectingType === item.type;

          return (
            <div key={item.type} className="bg-white border border-slate-205 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.name}</h4>
                    <span className={`w-2 h-2 rounded-full ${isLinked ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.description}</p>
                </div>
              </div>

              {/* Dynamic connected inputs params displays */}
              {isLinked && linkedObj && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1.5 text-xs font-mono">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Authorized Parameters</span>
                  {item.type === 'github' && (
                    <div className="text-[11px] text-slate-600 font-bold">
                      <span>Mapped Repos:</span>
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-1 text-slate-800">
                        {linkedObj.config?.repos?.join(", ") || "None"}
                      </span>
                    </div>
                  )}
                  {item.type === 'aws' && (
                    <div className="text-[11px] text-slate-600 font-bold">
                      <span>AWS Account Number:</span>
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-1 text-slate-800">
                        {linkedObj.config?.accountId || "None"}
                      </span>
                    </div>
                  )}
                  {item.type === 'gws' && (
                    <div className="text-[11px] text-slate-600 font-bold">
                      <span>Synced Domain:</span>
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-1 text-slate-800">
                        {linkedObj.config?.domain || "None"}
                      </span>
                    </div>
                  )}
                  {item.type === 'slack' && (
                    <div className="text-[11px] text-slate-600 font-bold space-y-1">
                      <div>
                        <span>Slack HQ:</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-1 text-slate-800">
                          {linkedObj.config?.workspace || "None"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span>Webhook URL:</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-1 text-slate-800 break-all select-all font-mono text-[10px]">
                          {linkedObj.config?.webhookUrl || "None"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inputs configurations BEFORE connecting */}
              {!isLinked && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 space-y-2">
                  <span className="text-[9px] text-slate-450 uppercase font-mono block font-bold">Connection settings</span>
                  {item.type === 'github' && (
                    <input
                      type="text"
                      value={githubReposText}
                      onChange={(e) => setGithubReposText(e.target.value)}
                      placeholder="e.g. repo-1, repo-2"
                      className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-slate-700 font-mono font-bold"
                    />
                  )}
                  {item.type === 'aws' && (
                    <input
                      type="text"
                      value={awsAccountText}
                      onChange={(e) => setAwsAccountText(e.target.value)}
                      placeholder="e.g. AWS account ID"
                      className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-slate-700 font-mono font-bold"
                    />
                  )}
                  {item.type === 'gws' && (
                    <input
                      type="text"
                      value={gwsDomainText}
                      onChange={(e) => setGwsDomainText(e.target.value)}
                      placeholder="e.g. company.com"
                      className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-slate-700 font-mono font-bold"
                    />
                  )}
                  {item.type === 'slack' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold font-mono block">Workspace Tag</label>
                        <input
                          type="text"
                          value={slackWorkspaceText}
                          onChange={(e) => setSlackWorkspaceText(e.target.value)}
                          placeholder="e.g. workspace-tag"
                          className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-slate-700 font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold font-mono block">Incoming Webhook URL</label>
                        <input
                          type="text"
                          value={slackWebhookText}
                          onChange={(e) => setSlackWebhookText(e.target.value)}
                          placeholder="https://hooks.slack.com/services/..."
                          className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-slate-700 font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}
                  {item.type === 'jira' && (
                    <input
                      type="text"
                      value={jiraUrlText}
                      onChange={(e) => setJiraUrlText(e.target.value)}
                      placeholder="e.g. company.atlassian.net"
                      className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-slate-700 font-mono font-bold"
                    />
                  )}
                </div>
              )}

              {/* Toggle linked logic */}
              <div className="flex pt-2 justify-end">
                {isLinked ? (
                  <button
                    onClick={() => handleDisconnectIntegration(item.type)}
                    disabled={isPending}
                    className="bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {isPending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Link2Off className="w-3.5 h-3.5 text-red-500" />
                        <span>Revoke Connection</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectIntegration(item.type)}
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-650 text-xs px-3.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer font-bold shadow-xs"
                  >
                    {isPending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5 text-blue-200" />
                        <span>Authorize API Hub</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
