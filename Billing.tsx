/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'owner' | 'admin' | 'auditor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  gistin?: string;
  pan?: string;
}

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  joinedAt: string;
}

export type ControlStatus = 'pass' | 'fail' | 'partial' | 'not_applicable';

export interface Control {
  id: string;
  frameworkId: string; // 'soc2' | 'iso27001' | 'rbi-nbfc'
  domain: string; // e.g., 'Annex A.5', 'CC6 Common Criteria'
  controlId: string; // e.g., 'CC6.1', 'A.9.1'
  name: string;
  description: string;
  evidenceRequired: string[];
  automatedCheckFn?: string;
  status: ControlStatus;
  lastCheckedAt?: string;
  assigneeId?: string;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  controlsCount: number;
  passedCount: number;
}

export interface Integration {
  id: string;
  orgId: string;
  type: 'github' | 'aws' | 'gws' | 'jira' | 'slack';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  connectedAt?: string;
}

export interface IntegrationRun {
  id: string;
  orgId: string;
  integrationId: string;
  runAt: string;
  status: 'success' | 'failed';
  results: Array<{
    checkName: string;
    description: string;
    status: 'pass' | 'fail' | 'warning';
    findings: string;
    controlId: string;
  }>;
}

export interface EvidenceItem {
  id: string;
  orgId: string;
  controlId: string;
  name: string;
  source: string; // 'GitHub Agent', 'AWS Scanner', 'Manual Upload', etc.
  type: 'json' | 'pdf' | 'screenshot' | 'text';
  content: string; // structured JSON or description
  fileUrl?: string;
  createdAt: string;
}

export interface Policy {
  id: string;
  orgId: string;
  title: string;
  type: 'infosec' | 'access-control' | 'incident-response' | 'business-continuity' | 'vendor-mgmt';
  status: 'approved' | 'review' | 'draft';
  createdBy: string;
  approvedBy?: string;
  content: string; // Markdown/HTML content
  updatedAt: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  version: number;
  content: string;
  status: 'approved' | 'review' | 'draft';
  createdBy: string;
  approvedBy?: string;
  changedAt: string;
}

export interface AuditEngagement {
  id: string;
  orgId: string;
  frameworkId: string;
  name: string;
  status: 'planning' | 'in_progress' | 'under_review' | 'completed';
  externalAuditorEmail?: string;
  externalAuditorName?: string;
  startDate: string;
  targetCompletionDate: string;
  milestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: 'pending' | 'completed';
  }>;
}

export interface AuditComment {
  id: string;
  auditId: string;
  controlId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  comment: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  orgId: string;
  planId: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'inactive' | 'trial' | 'past_due';
  amount: number; // in INR
  trialEndsAt?: string;
  billingPeriod: 'monthly' | 'yearly';
  nextBillingAt?: string;
  autoDebitEnabled: boolean; // e-NACH / UPI Autopay
  gstin?: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  subscriptionId: string;
  invoiceNumber: string;
  amount: number; // Base amount in INR
  gstAmount: number; // 18% GST amount
  totalAmount: number; // Base + GST
  status: 'paid' | 'unpaid' | 'refunded';
  date: string;
  dueDate: string;
  gstin?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  controlId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: Role;
  action: string; // 'login' | 'config_changed' | 'evidence_upload' | 'control_update' | 'policy_modified'
  timestamp: string;
  context: {
    orgId?: string;
    affectedResource?: string;
    details?: string;
    [key: string]: any;
  };
}

export interface SecretFinding {
  id: string;
  repo: string;
  filePath: string;
  lineNumber: number;
  commitHash: string;
  secretType: 'aws_key' | 'stripe_key' | 'db_password' | 'private_key';
  secretMasked: string;
  severity: 'critical' | 'high' | 'medium';
  status: 'active' | 'resolved' | 'dismissed';
  detectedAt: string;
  remediatedAt?: string;
  dismissedAt?: string;
}

