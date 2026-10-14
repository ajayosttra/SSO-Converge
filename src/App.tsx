/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ArrowLeftRight, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  X, 
  Check, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Info,
  Edit2,
  ShieldCheck,
  Globe,
  Network,
  History,
  Ban,
  ShieldAlert,
  Key,
  Lock,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Sparkles,
  Activity,
  BellRing,
  RotateCcw,
  Smartphone,
  Clock,
  LogIn,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Domain, PendingRequest, User, OperationName, OperationType, Application, DomainUser, AuditRecord, UserAuditRecord, BlacklistedDomain, SamlMetadataConfig, ApiEndpointHealth, ApiProbeLog, AppSecret, TraianaUserSkipRecord, TraianaSkipAuditRecord, UserMfaRecord, MfaResetAuditRecord, SsoUserLoginRecord, UserAppLoginSummary, SsoAuthProtocol, UserEmailSyncRequest, AppEmailSyncDetail, EmailSyncOverallStatus } from './types';
import { INITIAL_DOMAIN_DATA, INITIAL_PENDING_REQUESTS, INITIAL_AUDIT_LOGS, INITIAL_USER_AUDIT_LOGS, AZURE_WHITELISTED_DOMAINS, DEFAULT_PASSWORD, INITIAL_BLACKLISTED_DOMAINS, checkIsDomainBlocked, INITIAL_SAML_CONFIGS, generateSamlUuid, buildOsttraSamlMetadataUrl } from './constants';
import { INITIAL_API_ENDPOINTS, INITIAL_PROBE_LOGS } from './data/apiHealthData';
import { getInitialAppSecrets } from './data/appSecretsData';
import { getInitialTraianaUsers, saveTraianaUsers, getInitialTraianaAuditLogs, saveTraianaAuditLogs } from './data/traianaSkipData';
import { getInitialMfaUsers, saveMfaUsers, getInitialMfaAuditLogs, saveMfaAuditLogs } from './data/mfaResetData';
import { getInitialSsoLoginRecords, saveSsoLoginRecords, createSsoLoginRecord } from './data/userLoginData';
import { getInitialEmailSyncRequests, saveEmailSyncRequests, formatSyncTimestamp, computeOverallStatus } from './data/emailSyncData';
import { AuditLogModal } from './components/AuditLogModal';
import { AuditLogsView } from './components/AuditLogsView';
import { BlockedDomainsBlotter } from './components/BlockedDomainsBlotter';
import { SamlMetadataBlotter } from './components/SamlMetadataBlotter';
import { ApiHealthView } from './components/ApiHealthView';
import { AppSecretsView } from './components/AppSecretsView';
import { TraianaSkipCounterView } from './components/TraianaSkipCounterView';
import { MfaResetManagementView } from './components/MfaResetManagementView';
import { UserLoginLogView } from './components/UserLoginLogView';
import { EmailSyncManagementView } from './components/EmailSyncManagementView';

// --- Helper Functions ---
const getFormattedDate = () => {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
};

const isIpInWhitelist = (ip: string, whitelist?: string[]): boolean => {
  if (!whitelist || whitelist.length === 0) return true; // No restriction defined
  const trimmedIp = ip.trim();
  if (!trimmedIp) return true;

  return whitelist.some(entry => {
    const cleanEntry = entry.trim();
    if (!cleanEntry) return false;
    
    // Exact single IP match
    if (cleanEntry === trimmedIp) return true;

    // IP Range format: "192.168.1.1 - 192.168.1.50" or "192.168.1.1-192.168.1.50"
    if (cleanEntry.includes('-')) {
      const parts = cleanEntry.split('-').map(s => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        const ipToNum = (ipStr: string) => ipStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
        try {
          const userNum = ipToNum(trimmedIp);
          const startNum = ipToNum(parts[0]);
          const endNum = ipToNum(parts[1]);
          if (!isNaN(userNum) && !isNaN(startNum) && !isNaN(endNum)) {
            return userNum >= startNum && userNum <= endNum;
          }
        } catch {
          return false;
        }
      }
    }

    // CIDR subnet format e.g. "192.168.1.0/24"
    if (cleanEntry.includes('/')) {
      const [subnetIp, maskBitsStr] = cleanEntry.split('/');
      const maskBits = parseInt(maskBitsStr, 10);
      if (subnetIp && !isNaN(maskBits)) {
        const ipToNum = (ipStr: string) => ipStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
        try {
          const userNum = ipToNum(trimmedIp);
          const subnetNum = ipToNum(subnetIp);
          const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
          return (userNum & mask) === (subnetNum & mask);
        } catch {
          return false;
        }
      }
    }

    // Wildcard match e.g. "192.168.1.*"
    if (cleanEntry.includes('*')) {
      const regexStr = '^' + cleanEntry.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
      return new RegExp(regexStr).test(trimmedIp);
    }

    return false;
  });
};

const IpWhitelistManager = ({ 
  ips, 
  onChange, 
  title = "IP Whitelisting (Allowed Login IPs)", 
  description = "Define single IPs (e.g. 192.168.1.50), CIDR blocks (e.g. 10.0.0.0/24), or IP ranges (e.g. 172.16.0.1 - 172.16.0.100). When defined, users in this domain can only log in from these IPs.",
  readOnly = false 
}: { 
  ips: string[]; 
  onChange: (ips: string[]) => void; 
  title?: string; 
  description?: string;
  readOnly?: boolean;
}) => {
  const [newIpInput, setNewIpInput] = useState('');
  const [ipError, setIpError] = useState('');

  // State for updating existing IPs inline
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingError, setEditingError] = useState('');

  const handleAdd = () => {
    const val = newIpInput.trim();
    if (!val) return;
    if (ips.includes(val)) {
      setIpError('This IP or range is already in the whitelist.');
      return;
    }
    onChange([...ips, val]);
    setNewIpInput('');
    setIpError('');
  };

  const handleRemove = (indexToRemove: number) => {
    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
      setEditingValue('');
      setEditingError('');
    }
    onChange(ips.filter((_, idx) => idx !== indexToRemove));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(ips[index]);
    setEditingError('');
  };

  const handleSaveEdit = (index: number) => {
    const val = editingValue.trim();
    if (!val) {
      setEditingError('IP rule cannot be empty.');
      return;
    }
    if (ips.some((item, i) => i !== index && item.toLowerCase() === val.toLowerCase())) {
      setEditingError('This IP or range is already in the whitelist.');
      return;
    }
    const updated = [...ips];
    updated[index] = val;
    onChange(updated);
    setEditingIndex(null);
    setEditingValue('');
    setEditingError('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
    setEditingError('');
  };

  return (
    <div className="bg-emerald-50/40 border border-emerald-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center space-x-2">
        <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>

      {!readOnly && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input 
              type="text"
              value={newIpInput}
              onChange={(e) => { setNewIpInput(e.target.value); setIpError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              placeholder="e.g. 192.168.1.50, 10.0.0.0/24, or 172.16.0.1 - 172.16.0.100"
              className="flex-1 form-input-light text-xs py-2 bg-white"
            />
            <button 
              type="button" 
              onClick={handleAdd}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-md transition-colors shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Add IPs
            </button>
          </div>
          {ipError && <p className="text-xs text-red-600 font-semibold">{ipError}</p>}
        </div>
      )}

      {/* Badges / List of IPs */}
      <div className="pt-2 border-t border-emerald-200/60">
        <p className="text-[11px] font-bold text-gray-700 mb-2">
          Whitelisted IPs List {ips.length === 0 ? <span className="text-gray-400 font-normal">(No restriction set - Logins allowed from any IP)</span> : <span className="text-emerald-800">({ips.length} rule{ips.length > 1 ? 's' : ''} defined)</span>}
        </p>
        {ips.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-2">
              {ips.map((ip, index) => {
                if (editingIndex === index) {
                  return (
                    <div key={index} className="flex items-center gap-1.5 bg-white border-2 border-emerald-500 p-1 rounded-md shadow-sm">
                      <input 
                        type="text"
                        value={editingValue}
                        onChange={(e) => { setEditingValue(e.target.value); setEditingError(''); }}
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(index); }
                          if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit(); }
                        }}
                        className="text-xs font-mono font-bold text-gray-800 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-emerald-600 w-52 bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(index)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Save Updated IP"
                      >
                        <Check size={13} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                }

                return (
                  <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-white border border-emerald-300 text-emerald-950 shadow-xxs">
                    <Network size={12} className="text-emerald-600 shrink-0" />
                    {ip}
                    {!readOnly && (
                      <div className="flex items-center gap-1 ml-1 border-l border-emerald-200 pl-1.5">
                        <button 
                          type="button" 
                          onClick={() => handleStartEdit(index)} 
                          className="text-gray-500 hover:text-emerald-700 transition-colors p-0.5 rounded cursor-pointer"
                          title="Update / Edit IP rule"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleRemove(index)} 
                          className="text-gray-400 hover:text-red-600 transition-colors p-0.5 rounded cursor-pointer"
                          title="Remove IP rule"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </span>
                );
              })}
            </div>
            {editingError && <p className="text-xs text-red-600 font-semibold">{editingError}</p>}
          </div>
        ) : (
          <div className="text-xs text-gray-500 bg-white p-2.5 rounded border border-dashed border-emerald-300 flex items-center gap-2">
            <Globe size={14} className="text-emerald-600" />
            Unrestricted access: Domain users can log in from any client IP address.
          </div>
        )}
      </div>
    </div>
  );
};

const getDomainApplications = (domain: string): Application[] => {
  if (!domain || typeof domain !== 'string') return [];
  const apps: Application[] = [
    { name: 'TradeServ', environment: 'PROD' },
    { name: 'TradeServ', environment: 'UAT' },
    { name: 'MarkitWire', environment: 'PROD' },
    { name: 'MarkitWire', environment: 'UAT' },
    { name: 'FX Connect', environment: 'PROD' },
    { name: 'Traiana Harmony', environment: 'PROD' },
    { name: 'CFD', environment: 'PROD' },
    { name: 'CFD', environment: 'UAT' },
    { name: 'CRDS', environment: 'PROD' },
    { name: 'CRDS', environment: 'UAT' },
  ];
  // Deterministic subset based on domain name
  const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return apps.filter((_, i) => (hash + i) % 3 === 0 || (hash + i) % 5 === 0);
};

const getDomainUsers = (domain: string): DomainUser[] => {
  if (!domain || typeof domain !== 'string') return [];
  
  const prefixes = ['john.doe', 'jane.smith', 'robert.jones', 'sarah.wilson', 'michael.brown', 'emily.davis'];
  const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const domainApps = getDomainApplications(domain);

  const users: DomainUser[] = prefixes.slice(0, (hash % 4) + 2).map((prefix, i) => ({
    email: `${prefix}@${domain}`,
    applications: domainApps.filter((_, j) => (hash + i + j) % 2 === 0),
    lastLogin: new Date(Date.now() - (hash + i) * 3600000).toLocaleString('en-GB'),
  }));

  if (domain.toLowerCase() === 'osttra.com') {
    users.unshift({
      email: 'ajay.swarnkar@osttra.com',
      applications: [
        { name: 'CFD', environment: 'UAT' },
        { name: 'CFD', environment: 'PROD' },
        { name: 'CRDS', environment: 'UAT' },
        { name: 'CRDS', environment: 'PROD' },
      ],
      lastLogin: '01-03-2026',
    });
  }

  if (domain.toLowerCase() === 'traiana.com') {
    users.unshift({
      email: 'ajay.swarnkar@traiana.com',
      applications: [
        { name: 'CFD', environment: 'UAT' },
        { name: 'CFD', environment: 'PROD' },
        { name: 'CRDS', environment: 'UAT' },
        { name: 'CRDS', environment: 'PROD' },
      ],
      lastLogin: '01-03-2026',
    });
  }

  return users;
};

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  let classes = "status-badge ";
  if (status === 'Enabled') classes += "status-enabled";
  else if (status === 'Disabled') classes += "status-disabled";
  else classes += "status-pending";

  return <span className={classes}>{status}</span>;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'blotter' | 'pending' | 'migration' | 'configuration' | 'audit' | 'user-logins' | 'email-sync' | 'api-health' | 'app-secrets' | 'traiana-skips' | 'mfa-reset'>('blotter');
  const [blotterTab, setBlotterTab] = useState<'registered' | 'blocked' | 'saml'>('registered');
  const [samlConfigs, setSamlConfigs] = useState<SamlMetadataConfig[]>(INITIAL_SAML_CONFIGS);
  const [domainData, setDomainData] = useState<Domain[]>(INITIAL_DOMAIN_DATA);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(INITIAL_PENDING_REQUESTS);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [userAuditLogs, setUserAuditLogs] = useState<UserAuditRecord[]>(INITIAL_USER_AUDIT_LOGS);
  const [blacklistedDomains, setBlacklistedDomains] = useState<BlacklistedDomain[]>(INITIAL_BLACKLISTED_DOMAINS);
  const [isFourEyeCheckEnabled, setIsFourEyeCheckEnabled] = useState(false);
  const [configSubTab, setConfigSubTab] = useState<'blacklist' | 'governance'>('governance');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  // SSO User Login Activity & Last Login State
  const [ssoLoginRecords, setSsoLoginRecords] = useState<SsoUserLoginRecord[]>(getInitialSsoLoginRecords);

  useEffect(() => {
    saveSsoLoginRecords(ssoLoginRecords);
  }, [ssoLoginRecords]);

  const handleRecordSsoLogin = (data: {
    email: string;
    applicationName: string;
    environment: 'PROD' | 'UAT';
    protocol: SsoAuthProtocol;
    clientIp: string;
    location: string;
  }) => {
    const newRecord = createSsoLoginRecord(data);
    setSsoLoginRecords(prev => [newRecord, ...prev]);
    showMessage(`SSO Login successfully recorded for ${data.email} to ${data.applicationName} (${data.environment}).`, 'success');
  };

  // Cross-Application User Email Propagation State
  const [emailSyncRequests, setEmailSyncRequests] = useState<UserEmailSyncRequest[]>(getInitialEmailSyncRequests);

  useEffect(() => {
    saveEmailSyncRequests(emailSyncRequests);
  }, [emailSyncRequests]);

  const partiallyFailedEmailCount = useMemo(() => 
    emailSyncRequests.filter(r => r.overallStatus === 'PARTIALLY_FAILED').length, 
    [emailSyncRequests]
  );

  const handleRetriggerAppSync = (requestId: string, applicationName: string) => {
    setEmailSyncRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      const updatedApps = req.applications.map(app => {
        if (app.applicationName !== applicationName) return app;
        return {
          ...app,
          status: 'SUCCESS' as const,
          attemptCount: app.attemptCount + 1,
          lastAttemptTimestamp: formatSyncTimestamp(),
          acknowledgedTimestamp: formatSyncTimestamp(),
          responseCode: 200,
          responseMessage: `Manual re-trigger successful: Email updated in ${applicationName} repository.`,
          failureReason: undefined
        };
      });
      return {
        ...req,
        applications: updatedApps,
        overallStatus: computeOverallStatus(updatedApps),
        retryCount: req.retryCount + 1,
        lastRetriggeredAt: formatSyncTimestamp(),
        retriggeredBy: currentUser?.displayName || 'Admin Operator'
      };
    }));
    showMessage(`Re-triggered email update for ${applicationName}. Acknowledgment received (200 OK).`, 'success');
  };

  const handleRetriggerAllFailedSync = (requestId: string) => {
    setEmailSyncRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      const updatedApps = req.applications.map(app => {
        if (app.status !== 'FAILED') return app;
        return {
          ...app,
          status: 'SUCCESS' as const,
          attemptCount: app.attemptCount + 1,
          lastAttemptTimestamp: formatSyncTimestamp(),
          acknowledgedTimestamp: formatSyncTimestamp(),
          responseCode: 200,
          responseMessage: `Re-triggered downstream delivery: Synchronized successfully in ${app.applicationName}.`,
          failureReason: undefined
        };
      });
      return {
        ...req,
        applications: updatedApps,
        overallStatus: computeOverallStatus(updatedApps),
        retryCount: req.retryCount + 1,
        lastRetriggeredAt: formatSyncTimestamp(),
        retriggeredBy: currentUser?.displayName || 'Admin Operator'
      };
    }));
    showMessage(`Batch re-trigger completed. All downstream application acknowledgments confirmed.`, 'success');
  };

  const handleInitiateEmailSync = (data: {
    oldEmail: string;
    newEmail: string;
    selectedApps: { name: string; env: 'PROD' | 'UAT' }[];
    notes?: string;
  }) => {
    const now = formatSyncTimestamp();
    const domain = data.newEmail.split('@')[1] || 'osttra.com';
    const rawName = data.oldEmail.split('@')[0] || 'User';
    const userName = rawName.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    const initiatorEmail = currentUser?.email || 'ajay.swarnkar@osttra.com';
    const ticketRef = `SSO-ADM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReq: UserEmailSyncRequest = {
      id: `EML-REQ-${new Date().getUTCFullYear()}-${Date.now().toString().slice(-4)}`,
      initiatingSystem: 'SSO Converge Admin Console',
      ticketReference: ticketRef,
      initiatedByEmail: initiatorEmail,
      userName,
      oldEmail: data.oldEmail,
      newEmail: data.newEmail,
      domain,
      requestedAt: now,
      completedAt: now,
      ssoDirectoryUpdated: true,
      retryCount: 0,
      notes: data.notes || `Email update triggered from Converge app by ${initiatorEmail}`,
      applications: data.selectedApps.map(a => ({
        applicationName: a.name,
        environment: a.env,
        status: 'SUCCESS' as const,
        attemptCount: 1,
        lastAttemptTimestamp: now,
        acknowledgedTimestamp: now,
        responseCode: 200,
        responseMessage: `Email successfully updated in ${a.name} database.`,
        payloadTraceId: `TRC-${a.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`
      })),
      overallStatus: 'COMPLETED'
    };

    setEmailSyncRequests(prev => [newReq, ...prev]);

    // Update login records if user previously had entries with oldEmail
    setSsoLoginRecords(prev => prev.map(rec => {
      if (rec.email.toLowerCase() === data.oldEmail.toLowerCase()) {
        return {
          ...rec,
          email: data.newEmail,
          domain,
          displayName: userName
        };
      }
      return rec;
    }));

    showMessage(`Dispatched email update for ${userName} (${data.oldEmail} -> ${data.newEmail}) across ${data.selectedApps.length} applications based on active entitlements.`, 'success');
  };

  // API Health Check State
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointHealth[]>(INITIAL_API_ENDPOINTS);
  const [apiProbeLogs, setApiProbeLogs] = useState<ApiProbeLog[]>(INITIAL_PROBE_LOGS);

  // Application Secrets & Expiry State
  const [appSecrets, setAppSecrets] = useState<AppSecret[]>(getInitialAppSecrets);

  const expiringSecretsCount = useMemo(() => appSecrets.filter(s => s.daysRemaining <= 90).length, [appSecrets]);

  // Traiana Skip Counter & Email Verification State
  const [traianaUsers, setTraianaUsers] = useState<TraianaUserSkipRecord[]>(getInitialTraianaUsers);
  const [traianaSkipAuditLogs, setTraianaSkipAuditLogs] = useState<TraianaSkipAuditRecord[]>(getInitialTraianaAuditLogs);

  const lockedTraianaUsersCount = useMemo(() => traianaUsers.filter(u => u.isLocked).length, [traianaUsers]);

  // Persistent storage hooks for Traiana data
  useEffect(() => {
    saveTraianaUsers(traianaUsers);
  }, [traianaUsers]);

  useEffect(() => {
    saveTraianaAuditLogs(traianaSkipAuditLogs);
  }, [traianaSkipAuditLogs]);

  // MFA Reset Management State
  const [mfaUsers, setMfaUsers] = useState<UserMfaRecord[]>(getInitialMfaUsers);
  const [mfaAuditLogs, setMfaAuditLogs] = useState<MfaResetAuditRecord[]>(getInitialMfaAuditLogs);
  const [mfaTargetEmail, setMfaTargetEmail] = useState<string>('');
  const [mfaTargetDomain, setMfaTargetDomain] = useState<string>('');

  const pendingMfaReEnrollCount = useMemo(() => mfaUsers.filter(u => u.requiresReEnrollment).length, [mfaUsers]);

  useEffect(() => {
    saveMfaUsers(mfaUsers);
  }, [mfaUsers]);

  useEffect(() => {
    saveMfaAuditLogs(mfaAuditLogs);
  }, [mfaAuditLogs]);

  // Modal/Panel States
  const [isRegistrationPanelOpen, setIsRegistrationPanelOpen] = useState(false);
  const [viewingDomain, setViewingDomain] = useState<Domain | null>(null);
  const [viewingAuditDomain, setViewingAuditDomain] = useState<Domain | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'config' | 'apps' | 'users'>('config');
  const [detailsSelectedUsers, setDetailsSelectedUsers] = useState<string[]>([]);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PendingRequest | null>(null);

  const addAuditLog = (
    domain: Domain,
    actionBy: string,
    ticketId: string,
    description: string,
    actionType: 'Initial' | 'Update'
  ) => {
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const newRecord: AuditRecord = {
      id: `aud-${domain.domain.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
      domainId: domain.id,
      domain: domain.domain,
      timestamp: formattedTimestamp,
      actionBy: actionBy || (currentUser?.displayName || currentUser?.email || 'System'),
      reviewer: currentUser?.email || actionBy || 'System',
      ticketId: ticketId || domain.ssoobTicket || 'N/A',
      description,
      status: domain.status,
      actionType,
      snapshot: {
        domain: domain.domain,
        federated: domain.federated,
        collaborationType: domain.collaborationType,
        samlRegistrationId: domain.samlRegistrationId,
        mfaStatus: domain.mfaStatus,
        whitelistedIps: domain.whitelistedIps ? [...domain.whitelistedIps] : [],
        status: domain.status,
        ssoobTicket: domain.ssoobTicket,
        infosecTicket: domain.infosecTicket || '',
        actionBy: actionBy || (currentUser?.displayName || currentUser?.email || 'System'),
        reviewer: currentUser?.email || actionBy || 'System',
        timestamp: formattedTimestamp
      }
    };
    setAuditLogs(prev => [newRecord, ...prev]);
  };

  const addUserAuditLog = (
    email: string,
    actionBy: string,
    ticketId: string,
    description: string,
    actionType: 'Initial' | 'Update',
    partialSnapshot?: Partial<UserAuditRecord['snapshot']>
  ) => {
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const domain = email.split('@')[1] || 'osttra.com';

    const newRecord: UserAuditRecord = {
      id: `uaud-${email.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
      email,
      domain,
      timestamp: formattedTimestamp,
      actionBy: actionBy || (currentUser?.displayName || currentUser?.email || 'System'),
      reviewer: currentUser?.email || actionBy || 'System',
      ticketId: ticketId || 'USR-ACT',
      description,
      status: 'Enabled',
      actionType,
      snapshot: {
        email,
        displayName: email.split('@')[0],
        domain,
        status: 'Enabled',
        mfaStatus: 'Enabled',
        collaborationType: 'B2B',
        roles: ['SSO User'],
        applications: ['TradeX'],
        ticketId: ticketId || 'USR-ACT',
        actionBy: actionBy || (currentUser?.displayName || currentUser?.email || 'System'),
        reviewer: currentUser?.email || actionBy || 'System',
        timestamp: formattedTimestamp,
        ...partialSnapshot
      }
    };
    setUserAuditLogs(prev => [newRecord, ...prev]);
  };

  useEffect(() => {
    setDetailsSelectedUsers([]);
  }, [viewingDomain, activeDetailsTab]);

  // Registration Form State
  const [regDomainInput, setRegDomainInput] = useState('');
  const [regFederated, setRegFederated] = useState<'Yes' | 'No'>('Yes');
  const [regCollaborationType, setRegCollaborationType] = useState<'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED' | ''>('SAML');
  const [regSamlId, setRegSamlId] = useState('');
  const [regMfaStatus, setRegMfaStatus] = useState<'Enabled' | 'Disabled'>('Enabled');
  const [regInfosecTicket, setRegInfosecTicket] = useState('');
  const [regWhitelistedIps, setRegWhitelistedIps] = useState<string[]>([]);

  // SAML ID source tracker for domain registration form
  const [regSamlSource, setRegSamlSource] = useState<{
    type: 'AUTO_METADATA' | 'COPIED_DOMAIN' | 'GENERATED_NEW' | null;
    sourceDomain?: string;
    ticketId?: string;
  }>({ type: null });

  // Inline SAML Metadata Generation Modal in Domain Registration
  const [isInlineSamlModalOpen, setIsInlineSamlModalOpen] = useState(false);
  const [inlineSamlTicket, setInlineSamlTicket] = useState('');
  const [inlineSamlNotes, setInlineSamlNotes] = useState('');
  const [inlineSamlError, setInlineSamlError] = useState('');

  // Dropdown for copying SAML ID from other domain
  const [isCopySamlDropdownOpen, setIsCopySamlDropdownOpen] = useState(false);
  const [copySearchQuery, setCopySearchQuery] = useState('');
  const [copiedSamlKey, setCopiedSamlKey] = useState<string | null>(null);

  // Helper function to normalize domain strings
  const cleanDomainString = (d: string) => {
    return (d || '').toLowerCase().trim().replace(/^[a-zA-Z]+:\/\//, '').replace(/@.*/, '').replace(/\/.*$/, '');
  };

  const normalizedRegDomain = cleanDomainString(regDomainInput);

  // Real-time matching SAML metadata configuration check for typed domain
  const autoMatchedSamlConfig = useMemo(() => {
    if (!normalizedRegDomain) return null;
    return samlConfigs.find(c => {
      const cd = cleanDomainString(c.domain || '');
      if (cd === normalizedRegDomain) return true;
      if (c.domains && c.domains.some(d => cleanDomainString(d) === normalizedRegDomain)) return true;
      return false;
    }) || null;
  }, [normalizedRegDomain, samlConfigs]);

  // List of all available domains with SAML configurations to copy from
  const availableSamlDomains = useMemo(() => {
    const list: Array<{ domain: string; samlRegistrationId: string; ticketId: string; status?: string }> = [];
    const seenCombos = new Set<string>();

    samlConfigs.forEach(cfg => {
      const dom = cfg.domain || (cfg.domains && cfg.domains[0]) || 'Unknown';
      const key = `${dom}-${cfg.samlRegistrationId}`;
      if (!seenCombos.has(key)) {
        list.push({
          domain: dom,
          samlRegistrationId: cfg.samlRegistrationId,
          ticketId: cfg.ticketId,
          status: cfg.status
        });
        seenCombos.add(key);
      }
    });

    domainData.forEach(d => {
      if (d.samlRegistrationId) {
        const key = `${d.domain}-${d.samlRegistrationId}`;
        if (!seenCombos.has(key)) {
          list.push({
            domain: d.domain,
            samlRegistrationId: d.samlRegistrationId,
            ticketId: d.ssoobTicket || d.infosecTicket || 'N/A',
            status: 'REGISTERED'
          });
          seenCombos.add(key);
        }
      }
    });

    return list;
  }, [samlConfigs, domainData]);

  // Auto-populate SAML ID when domain name matches existing SAML metadata
  useEffect(() => {
    if (regCollaborationType === 'SAML') {
      if (autoMatchedSamlConfig) {
        setRegSamlId(autoMatchedSamlConfig.samlRegistrationId);
        setRegSamlSource({
          type: 'AUTO_METADATA',
          sourceDomain: autoMatchedSamlConfig.domain || normalizedRegDomain,
          ticketId: autoMatchedSamlConfig.ticketId
        });
      } else {
        // If it was auto-matched from a previous domain input and no longer matches, clear it
        if (regSamlSource.type === 'AUTO_METADATA') {
          setRegSamlId('');
          setRegSamlSource({ type: null });
        }
      }
    }
  }, [autoMatchedSamlConfig, normalizedRegDomain, regCollaborationType]);

  // Real-time blocked domain check for registration form
  const regBlockedCheck = useMemo(() => {
    return checkIsDomainBlocked(regDomainInput, blacklistedDomains);
  }, [regDomainInput, blacklistedDomains]);

  // Blacklisted Domains Management Handlers with User Audit Logging
  const handleAddBlacklistedDomain = (newEntry: Omit<BlacklistedDomain, 'id' | 'addedOn'>) => {
    const userEmail = currentUser?.email || newEntry.addedBy || 'admin@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const ticket = newEntry.ticketId || 'SEC-BLK';
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const newRecord: BlacklistedDomain = {
      id: `blk-${newEntry.domain.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
      ...newEntry,
      addedBy: userEmail,
      addedOn: getFormattedDate()
    };
    setBlacklistedDomains(prev => [newRecord, ...prev]);

    // Record in User Audit Log (Who added the blacklisted domain)
    const newUserAuditRecord: UserAuditRecord = {
      id: `uaud-blk-add-${Date.now()}`,
      email: userEmail,
      domain: newEntry.domain,
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: ticket,
      description: `Added domain "${newEntry.domain}" to Blocklist (${newEntry.category}). Reason: ${newEntry.reason}`,
      status: 'Enabled',
      actionType: 'Initial',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: newEntry.domain,
        status: 'Enabled',
        mfaStatus: 'Enabled',
        collaborationType: 'Blocklist Rule',
        roles: ['Security Admin'],
        applications: ['Blocklist Manager'],
        ticketId: ticket,
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    };
    setUserAuditLogs(prev => [newUserAuditRecord, ...prev]);

    showMessage(`Domain '${newEntry.domain}' successfully added to blocklist.`, 'success');
  };

  const handleAddBatchBlacklistedDomains = (newEntries: Array<Omit<BlacklistedDomain, 'id' | 'addedOn'>>) => {
    if (newEntries.length === 0) return;
    const userEmail = currentUser?.email || 'admin@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const newRecords: BlacklistedDomain[] = newEntries.map((entry, idx) => ({
      id: `blk-${entry.domain.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}-${idx}`,
      ...entry,
      addedBy: userEmail,
      addedOn: getFormattedDate()
    }));

    const newAuditRecords: UserAuditRecord[] = newEntries.map((entry, idx) => ({
      id: `uaud-blk-add-${Date.now()}-${idx}`,
      email: userEmail,
      domain: entry.domain,
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: entry.ticketId || 'SEC-BLK',
      description: `Added domain "${entry.domain}" to Blocklist`,
      status: 'Enabled',
      actionType: 'Initial',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: entry.domain,
        status: 'Enabled',
        mfaStatus: 'Enabled',
        collaborationType: 'Blocklist Rule',
        roles: ['Security Admin'],
        applications: ['Blocklist Manager'],
        ticketId: entry.ticketId || 'SEC-BLK',
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    }));

    setBlacklistedDomains(prev => [...newRecords, ...prev]);
    setUserAuditLogs(prev => [...newAuditRecords, ...prev]);

    if (newEntries.length === 1) {
      showMessage(`Domain '${newEntries[0].domain}' successfully added to blocklist.`, 'success');
    } else {
      showMessage(`${newEntries.length} domains successfully added to blocklist.`, 'success');
    }
  };

  const handleUpdateBlacklistedDomain = (id: string, updates: Partial<BlacklistedDomain>) => {
    const item = blacklistedDomains.find(d => d.id === id);
    if (!item) return;

    const userEmail = currentUser?.email || 'admin@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const ticket = updates.ticketId || item.ticketId || 'SEC-BLK';
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    setBlacklistedDomains(prev => prev.map(item => item.id === id ? { 
      ...item, 
      ...updates,
      updatedBy: userEmail,
      updatedOn: getFormattedDate()
    } : item));

    const updatedCategory = updates.category || item.category;
    const updatedReason = updates.reason || item.reason;

    // Record in User Audit Log
    const newUserAuditRecord: UserAuditRecord = {
      id: `uaud-blk-upd-${Date.now()}`,
      email: userEmail,
      domain: item.domain,
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: ticket,
      description: `Updated blocklist rule for domain "${item.domain}" (${updatedCategory}). Reason: ${updatedReason}`,
      status: 'Enabled',
      actionType: 'Update',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: item.domain,
        status: 'Enabled',
        mfaStatus: 'Enabled',
        collaborationType: 'Blocklist Rule',
        roles: ['Security Admin'],
        applications: ['Blocklist Manager'],
        ticketId: ticket,
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    };
    setUserAuditLogs(prev => [newUserAuditRecord, ...prev]);

    showMessage(`Blocklist rule updated successfully.`, 'success');
  };

  const handleDeleteBlacklistedDomain = (id: string) => {
    const item = blacklistedDomains.find(d => d.id === id);
    if (!item) return;

    const userEmail = currentUser?.email || 'admin@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const ticket = item.ticketId || 'SEC-BLK';
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    setBlacklistedDomains(prev => prev.filter(d => d.id !== id));

    // Record in User Audit Log (Who removed the blacklisted domain)
    const newUserAuditRecord: UserAuditRecord = {
      id: `uaud-blk-del-${Date.now()}`,
      email: userEmail,
      domain: item.domain,
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: ticket,
      description: `Removed domain "${item.domain}" from Blocklist (${item.category}).`,
      status: 'Disabled',
      actionType: 'Update',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: item.domain,
        status: 'Disabled',
        mfaStatus: 'Disabled',
        collaborationType: 'Blocklist Removal',
        roles: ['Security Admin'],
        applications: ['Blocklist Manager'],
        ticketId: ticket,
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    };
    setUserAuditLogs(prev => [newUserAuditRecord, ...prev]);

    showMessage(`Domain '${item.domain}' removed from blocklist.`, 'info');
  };

  const handleToggleBlacklistedStatus = (id: string) => {
    const item = blacklistedDomains.find(d => d.id === id);
    if (!item) return;

    const nextState = !item.enabled;
    const userEmail = currentUser?.email || 'admin@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const ticket = item.ticketId || 'SEC-BLK';
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    setBlacklistedDomains(prev => prev.map(d => {
      if (d.id === id) {
        return { 
          ...d, 
          enabled: nextState,
          updatedBy: userEmail,
          updatedOn: getFormattedDate()
        };
      }
      return d;
    }));

    // Record in User Audit Log
    const newUserAuditRecord: UserAuditRecord = {
      id: `uaud-blk-tog-${Date.now()}`,
      email: userEmail,
      domain: item.domain,
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: ticket,
      description: `${nextState ? 'Activated' : 'Deactivated'} blocklist rule for domain "${item.domain}".`,
      status: nextState ? 'Enabled' : 'Disabled',
      actionType: 'Update',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: item.domain,
        status: nextState ? 'Enabled' : 'Disabled',
        mfaStatus: 'Enabled',
        collaborationType: 'Blocklist Rule',
        roles: ['Security Admin'],
        applications: ['Blocklist Manager'],
        ticketId: ticket,
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    };
    setUserAuditLogs(prev => [newUserAuditRecord, ...prev]);

    showMessage(`Block rule for '${item.domain}' ${nextState ? 'enabled' : 'disabled'}.`, nextState ? 'success' : 'info');
  };

  // --- SAML Metadata Workflow Handlers ---
  const handleGenerateSamlMetadata = (domainInput: string, ticketId: string, notes?: string): SamlMetadataConfig => {
    const primaryDomain = domainInput.toLowerCase().trim().replace(/^[a-zA-Z]+:\/\//, '').replace(/@.*/, '').replace(/\/.*$/, '') || 'client.com';
    const samlRegistrationId = generateSamlUuid();
    const osttraMetadataUrl = buildOsttraSamlMetadataUrl(samlRegistrationId);
    const userEmail = currentUser?.email || 'ajay.swarnkar@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const newConfig: SamlMetadataConfig = {
      id: `saml-cfg-${Date.now()}`,
      domain: primaryDomain,
      domains: [primaryDomain],
      ticketId,
      samlRegistrationId,
      osttraMetadataUrl,
      spEntityId: osttraMetadataUrl,
      spAcsUrl: `https://sso.osttra.com/api/saml/auth/v1/consume/${samlRegistrationId}`,
      status: 'SP_METADATA_GENERATED',
      createdBy: userEmail,
      createdOn: getFormattedDate(),
      notes: notes || undefined
    };

    setSamlConfigs(prev => [newConfig, ...prev]);

    // Record in User Audit Log
    const newUserAuditRecord: UserAuditRecord = {
      id: `uaud-saml-gen-${Date.now()}`,
      email: userEmail,
      domain: primaryDomain,
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: ticketId,
      description: `Generated OSTTRA SAML 2.0 SP Metadata URL for domain [${primaryDomain}] (SAML ID: ${samlRegistrationId}). Metadata URL: ${osttraMetadataUrl}`,
      status: 'Enabled',
      actionType: 'Initial',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: primaryDomain,
        status: 'Enabled',
        mfaStatus: 'Enabled',
        collaborationType: 'SAML Metadata Generator',
        roles: ['Identity Admin'],
        applications: ['SAML SSO Gateway'],
        ticketId: ticketId,
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    };
    setUserAuditLogs(prev => [newUserAuditRecord, ...prev]);

    showMessage(`SAML Metadata URL generated for domain '${primaryDomain}'.`, 'success');
    return newConfig;
  };

  const handleUpdateClientSamlMetadata = (id: string, updates: Partial<SamlMetadataConfig>) => {
    const item = samlConfigs.find(c => c.id === id);
    if (!item) return;

    const userEmail = currentUser?.email || 'ajay.swarnkar@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const updatedDomains = updates.domains 
      ? Array.from(new Set(updates.domains.map(d => d.toLowerCase().trim()).filter(Boolean)))
      : (item.domains || [item.domain || '']);

    const primaryDomain = updatedDomains[0] || item.domain || 'client.com';

    setSamlConfigs(prev => prev.map(c => c.id === id ? {
      ...c,
      ...updates,
      domains: updatedDomains,
      domain: primaryDomain,
      updatedBy: userEmail,
      updatedOn: getFormattedDate()
    } : c));

    // Also update any matching Domain in domainData if it already has this samlRegistrationId
    setDomainData(prev => prev.map(d => {
      if (d.samlRegistrationId === item.samlRegistrationId) {
        return {
          ...d,
          updatedBy: userEmail,
          updatedOn: getFormattedDate()
        };
      }
      return d;
    }));

    // Record in User Audit Log
    const domainSummary = updatedDomains.join(', ');
    const newUserAuditRecord: UserAuditRecord = {
      id: `uaud-saml-upd-${Date.now()}`,
      email: userEmail,
      domain: primaryDomain,
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: item.ticketId,
      description: `Updated SAML IdP Metadata & Domains for [${domainSummary}] (SAML ID: ${item.samlRegistrationId}). Configured Entity ID: ${updates.clientEntityId || item.clientEntityId || 'N/A'}, SSO URL: ${updates.clientSsoUrl || item.clientSsoUrl || 'N/A'}. Total Domains: ${updatedDomains.length}.`,
      status: 'Enabled',
      actionType: 'Update',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: domainSummary,
        status: 'Enabled',
        mfaStatus: 'Enabled',
        collaborationType: 'SAML IdP Configuration',
        roles: ['Identity Admin'],
        applications: ['SAML SSO Gateway'],
        ticketId: item.ticketId,
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    };
    setUserAuditLogs(prev => [newUserAuditRecord, ...prev]);

    showMessage(`SAML metadata and domains updated for '${primaryDomain}'.`, 'success');
  };

  const handleDeleteSamlMetadata = (id: string) => {
    const item = samlConfigs.find(c => c.id === id);
    if (!item) return;

    const userEmail = currentUser?.email || 'ajay.swarnkar@osttra.com';
    const userDisplayName = currentUser?.displayName || userEmail;
    const formattedTimestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const domainList = (item.domains && item.domains.length > 0) ? item.domains.join(', ') : item.domain;

    setSamlConfigs(prev => prev.filter(c => c.id !== id));

    // Record in User Audit Log
    const newUserAuditRecord: UserAuditRecord = {
      id: `uaud-saml-del-${Date.now()}`,
      email: userEmail,
      domain: item.domain || 'SAML',
      timestamp: formattedTimestamp,
      actionBy: userEmail,
      reviewer: userEmail,
      ticketId: item.ticketId,
      description: `Deleted SAML configuration for domain(s) [${domainList}] (SAML ID: ${item.samlRegistrationId}).`,
      status: 'Disabled',
      actionType: 'Update',
      snapshot: {
        email: userEmail,
        displayName: userDisplayName,
        domain: domainList || item.domain || '',
        status: 'Disabled',
        mfaStatus: 'Disabled',
        collaborationType: 'SAML Configuration',
        roles: ['Identity Admin'],
        applications: ['SAML SSO Gateway'],
        ticketId: item.ticketId,
        actionBy: userEmail,
        reviewer: userEmail,
        timestamp: formattedTimestamp
      }
    };
    setUserAuditLogs(prev => [newUserAuditRecord, ...prev]);

    showMessage(`SAML setup for '${domainList}' deleted.`, 'info');
  };

  const handleQuickRegisterWithSaml = (domain: string, samlRegistrationId: string, ticketId: string) => {
    setRegDomainInput(domain);
    setRegFederated('Yes');
    setRegCollaborationType('SAML');
    setRegSamlId(samlRegistrationId);
    setRegMfaStatus('Enabled');
    setRegInfosecTicket('');
    setRegSamlSource({
      type: 'COPIED_DOMAIN',
      sourceDomain: domain,
      ticketId: ticketId
    });
    setIsRegistrationPanelOpen(true);
  };

  // Edit Domain Form State
  const [editFederated, setEditFederated] = useState<'Yes' | 'No'>('Yes');
  const [editCollaborationType, setEditCollaborationType] = useState<'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED' | ''>('SAML');
  const [editSamlId, setEditSamlId] = useState('');
  const [editMfaStatus, setEditMfaStatus] = useState<'Enabled' | 'Disabled'>('Enabled');
  const [editInfosecTicket, setEditInfosecTicket] = useState('');
  const [editWhitelistedIps, setEditWhitelistedIps] = useState<string[]>([]);

  // Migration Form State
  const [migrationCollaborationType, setMigrationCollaborationType] = useState<'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED'>('SAML');
  const [migrationSamlId, setMigrationSamlId] = useState('');
  const [migrationWhitelistedIps, setMigrationWhitelistedIps] = useState<string[]>([]);

  useEffect(() => {
    if (editingDomain) {
      setEditFederated(editingDomain.federated);
      setEditCollaborationType(editingDomain.collaborationType || (editingDomain.federated === 'No' ? 'ENTRA_NON_FED' : 'SAML'));
      setEditSamlId(editingDomain.samlRegistrationId || '');
      setEditMfaStatus(editingDomain.mfaStatus);
      setEditInfosecTicket(editingDomain.infosecTicket || '');
      setEditWhitelistedIps(editingDomain.whitelistedIps || []);
    }
  }, [editingDomain]);

  // Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState({
    domain: '',
    federated: '',
    mfaStatus: '',
    status: '',
    registeredBy: '',
    registeredOn: '',
    ssoobTicket: '',
    approvedBy: '',
    approvedOn: '',
    collaborationType: '',
    samlRegistrationId: '',
    whitelistedIps: ''
  });

  // Login State
  const [loginEmail, setLoginEmail] = useState('admin@osttra.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginClientIp, setLoginClientIp] = useState('192.168.1.100');

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 7000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
      showMessage('Invalid email format.', 'error');
      return;
    }
    if (loginPassword !== DEFAULT_PASSWORD) {
      showMessage('Login failed: Invalid password.', 'error');
      return;
    }

    // IP Whitelist Validation Check for Domain
    const domainPart = loginEmail.split('@')[1]?.toLowerCase().trim();
    if (domainPart) {
      const foundDomain = domainData.find(d => d.domain.toLowerCase() === domainPart);
      if (foundDomain && foundDomain.status === 'Disabled') {
        showMessage(`Login Denied: Domain '${foundDomain.domain}' is currently disabled.`, 'error');
        return;
      }
      if (foundDomain && foundDomain.whitelistedIps && foundDomain.whitelistedIps.length > 0) {
        const isAllowed = isIpInWhitelist(loginClientIp, foundDomain.whitelistedIps);
        if (!isAllowed) {
          showMessage(`Login Denied: IP address '${loginClientIp}' is not authorized for domain '${foundDomain.domain}'. Active Whitelisted IPs: ${foundDomain.whitelistedIps.join(', ')}`, 'error');
          return;
        }
      }
    }

    const rawName = (loginEmail && typeof loginEmail === 'string') ? loginEmail.split('@')[0] : '';
    const user: User = {
      email: loginEmail,
      displayName: (rawName && rawName.length > 0) ? (rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()) : 'User',
      initials: (rawName && rawName.length > 0) ? rawName.substring(0, 2).toUpperCase() : 'US'
    };
    setCurrentUser(user);

    // Record login event in SSO User Login Activity Log
    const foundDomain = domainPart ? domainData.find(d => d.domain.toLowerCase() === domainPart) : null;
    const portalLoginRecord = createSsoLoginRecord({
      email: loginEmail,
      applicationName: 'SSO Central Portal',
      environment: 'PROD',
      protocol: foundDomain?.collaborationType === 'SAML' ? 'SAML 2.0' : 'Entra ID (Fed)',
      clientIp: loginClientIp,
      location: 'Corporate Gateway',
    });
    setSsoLoginRecords(prev => [portalLoginRecord, ...prev]);

    setActiveView('blotter');
    showMessage(`Welcome, ${user.displayName}! Authorized login from IP: ${loginClientIp}`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showMessage('Logged out successfully.', 'info');
  };

  // --- Domain Logic ---

  const filteredDomains = useMemo(() => {
    // 1. Get all pending registration requests as "Virtual" domains
    const pendingRegs = pendingRequests
      .filter(r => r.operation === 'Domain Registration')
      .map(r => ({
        id: r.domainId,
        domain: r.domainName,
        federated: r.payload.federated || 'No',
        mfaStatus: r.payload.mfaStatus || 'Disabled',
        registeredBy: r.initiatedBy,
        registeredOn: r.initiatedOn,
        updatedBy: r.initiatedBy,
        updatedOn: r.initiatedOn,
        approvedBy: null,
        approvedOn: null,
        ssoobTicket: r.payload.ssoobTicket || 'N/A',
        status: 'Pending' as const,
        collaborationType: r.payload.collaborationType || '',
        samlRegistrationId: r.payload.samlRegistrationId || '',
        isPending: true,
        requestId: r.requestId
      }));

    // 2. Map existing domains and check if they have a pending request
    const existingDomains = domainData.map(d => {
      const request = pendingRequests.find(r => r.domainId === d.id);
      return {
        ...d,
        status: request ? 'Pending' : d.status,
        isPending: !!request,
        requestId: request?.requestId
      };
    });

    // 3. Combine and filter
    const combined = [...pendingRegs, ...existingDomains];

    return combined.filter(d => {
      if (globalSearch) {
        const search = globalSearch.toLowerCase();
        const match = Object.values(d).some(val => String(val ?? '').toLowerCase().includes(search));
        if (!match) return false;
      }
      for (const [key, value] of Object.entries(columnFilters)) {
        if (value) {
          if (!String((d as any)[key] ?? '').toLowerCase().includes((value as string).toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [domainData, pendingRequests, globalSearch, columnFilters]);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);
    const domain = (formData.get('domain') as string).toLowerCase().trim();
    const federated = formData.get('federated') as 'Yes' | 'No';
    const collaborationType = ((formData.get('collaborationType') as any) || regCollaborationType) as 'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED';
    const samlRegistrationId = (federated === 'Yes' && collaborationType === 'SAML') ? (formData.get('samlRegistrationId') as string || regSamlId).trim() : '';
    const mfaStatus: 'Enabled' | 'Disabled' = collaborationType === 'OTP' ? 'Disabled' : ((formData.get('mfaStatus') as 'Enabled' | 'Disabled') || regMfaStatus);
    const ssoobTicket = (formData.get('ssoobTicket') as string || '').toUpperCase().trim();
    const infosecTicket = (formData.get('infosecTicket') as string || regInfosecTicket || '').toUpperCase().trim();

    if (federated === 'Yes' && collaborationType === 'SAML' && !samlRegistrationId) {
      showMessage("SAML Registration ID is mandatory for SAML collaboration. Please generate SAML metadata or copy from an existing domain.", "error");
      return;
    }

    if (mfaStatus === 'Disabled' && collaborationType !== 'OTP' && !infosecTicket) {
      showMessage("Infosec Ticket Reference is required when MFA is Disabled.", "error");
      return;
    }

    const existing = domainData.find(d => d.domain === domain) || pendingRequests.find(r => r.domainName === domain);
    if (existing) {
      showMessage(`Domain '${domain}' already exists or is pending review.`, 'error');
      return;
    }

    // Check if domain is blocked in blacklist
    const blockedCheck = checkIsDomainBlocked(domain, blacklistedDomains);
    if (blockedCheck.isBlocked) {
      showMessage(`Registration Blocked: Domain '${domain}' is on the Blacklist (${blockedCheck.rule?.reason || 'Security Restriction'}${blockedCheck.rule?.ticketId ? ` - Ref: ${blockedCheck.rule.ticketId}` : ''}). Registration is prohibited.`, 'error');
      return;
    }

    const payload: Partial<Domain> = {
      domain,
      federated,
      collaborationType,
      samlRegistrationId,
      mfaStatus,
      ssoobTicket,
      infosecTicket,
      whitelistedIps: regWhitelistedIps,
      registeredBy: currentUser.email,
      registeredOn: getFormattedDate(),
    };

    if (isFourEyeCheckEnabled) {
      const newRequest: PendingRequest = {
        requestId: Date.now(),
        operation: 'Domain Registration',
        operationType: 'Create',
        initiatedBy: currentUser.email,
        initiatedOn: getFormattedDate(),
        domainId: Date.now() + 1,
        domainName: domain,
        payload,
        approvedBy: null,
        approvedOn: null
      };
      setPendingRequests(prev => [...prev, newRequest]);
      setIsRegistrationPanelOpen(false);
      setRegDomainInput('');
      setRegSamlId('');
      setRegSamlSource({ type: null });
      setIsCopySamlDropdownOpen(false);
      setRegWhitelistedIps([]);
      showMessage(`Domain '${domain}' submitted for Pending Review.`, 'info');
    } else {
      const newDomain: Domain = {
        id: Date.now(),
        domain,
        federated,
        mfaStatus,
        ssoobTicket,
        infosecTicket,
        whitelistedIps: regWhitelistedIps,
        registeredBy: currentUser.email,
        registeredOn: getFormattedDate(),
        updatedBy: currentUser.email,
        updatedOn: getFormattedDate(),
        approvedBy: null,
        approvedOn: null,
        status: 'Enabled',
        collaborationType,
        samlRegistrationId
      };
      setDomainData(prev => [newDomain, ...prev]);
      addAuditLog(
        newDomain, 
        currentUser.email, 
        ssoobTicket, 
        `Configured domain ${domain} with isFederated as ${federated === 'Yes' ? 'true' : 'false'}, Collaboration Type: ${collaborationType}, MFA: ${mfaStatus}.`,
        'Initial'
      );
      setIsRegistrationPanelOpen(false);
      setRegDomainInput('');
      setRegSamlId('');
      setRegSamlSource({ type: null });
      setIsCopySamlDropdownOpen(false);
      setRegWhitelistedIps([]);
      showMessage(`Domain '${domain}' registered successfully!`, 'success');
    }
  };

  const handleUpdateDomain = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !editingDomain) return;

    const formData = new FormData(e.currentTarget);
    const newStatus = editingDomain.status; // status is handled by the toggle button in the form
    const collaborationType = ((formData.get('collaborationType') as any) || editCollaborationType) as 'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED';
    const newMfaStatus: 'Enabled' | 'Disabled' = collaborationType === 'OTP' ? 'Disabled' : ((formData.get('mfaStatus') as 'Enabled' | 'Disabled') || editMfaStatus);
    const infosecTicket = (formData.get('infosecTicket') as string || editInfosecTicket || '').toUpperCase().trim();

    if (newMfaStatus === 'Disabled' && collaborationType !== 'OTP' && !infosecTicket) {
      showMessage("Infosec Ticket Reference is required when MFA is Disabled.", "error");
      return;
    }

    const samlRegistrationId = (editingDomain.federated === 'Yes' && collaborationType === 'SAML') ? (formData.get('samlRegistrationId') as string || editSamlId).trim() : '';

    if (isFourEyeCheckEnabled) {
      const newRequest: PendingRequest = {
        requestId: Date.now(),
        operation: 'Domain Update',
        operationType: 'Update',
        initiatedBy: currentUser.email,
        initiatedOn: getFormattedDate(),
        domainId: editingDomain.id,
        domainName: editingDomain.domain,
        payload: { 
          ...editingDomain,
          status: newStatus, 
          mfaStatus: newMfaStatus,
          collaborationType,
          samlRegistrationId,
          infosecTicket,
          whitelistedIps: editWhitelistedIps
        },
        approvedBy: null,
        approvedOn: null
      };
      setPendingRequests(prev => [...prev, newRequest]);
      setEditingDomain(null);
      showMessage(`Update for '${editingDomain.domain}' submitted for Pending Review.`, 'info');
    } else {
      const updatedDomain: Domain = { 
        ...editingDomain, 
        status: newStatus, 
        mfaStatus: newMfaStatus, 
        collaborationType,
        samlRegistrationId,
        infosecTicket,
        whitelistedIps: editWhitelistedIps,
        updatedBy: currentUser.email, 
        updatedOn: getFormattedDate() 
      };

      setDomainData(prev => prev.map(d => d.id === editingDomain.id ? updatedDomain : d));

      // Build precise audit description of what changed
      const changes: string[] = [];
      if (editingDomain.status !== newStatus) changes.push(`Status changed from ${editingDomain.status} to ${newStatus}`);
      if (editingDomain.mfaStatus !== newMfaStatus) changes.push(`MFA changed from ${editingDomain.mfaStatus} to ${newMfaStatus}`);
      if (editingDomain.collaborationType !== collaborationType) changes.push(`Collaboration Type changed from ${editingDomain.collaborationType || 'ENTRA_NON_FED'} to ${collaborationType}`);
      if (editingDomain.samlRegistrationId !== samlRegistrationId) changes.push(`SAML Registration ID updated to ${samlRegistrationId || 'N/A'}`);
      if (JSON.stringify(editingDomain.whitelistedIps || []) !== JSON.stringify(editWhitelistedIps)) {
        changes.push(`Whitelisted IPs updated (${editWhitelistedIps.length} rule${editWhitelistedIps.length > 1 ? 's' : ''}: ${editWhitelistedIps.join(', ') || 'Unrestricted'})`);
      }
      const desc = changes.length > 0 
        ? `Updated domain ${editingDomain.domain}: ${changes.join('. ')}.`
        : `Updated domain ${editingDomain.domain} configuration.`;

      addAuditLog(
        updatedDomain,
        currentUser.email,
        infosecTicket || updatedDomain.ssoobTicket || 'DMGS-UPDATE',
        desc,
        'Update'
      );

      setEditingDomain(null);
      showMessage(`Domain '${editingDomain.domain}' updated successfully!`, 'success');
    }
  };

  const approveRequest = (requestId: number) => {
    if (!currentUser) return;
    const request = pendingRequests.find(r => r.requestId === requestId);
    if (!request) return;

    if (request.initiatedBy.toLowerCase() === currentUser.email.toLowerCase()) {
      showMessage(`Error: User cannot approve their own requests.`, 'error');
      return;
    }

    if (request.operation === 'Domain Registration') {
      const blockedCheck = checkIsDomainBlocked(request.payload.domain!, blacklistedDomains);
      if (blockedCheck.isBlocked) {
        showMessage(`Approval Blocked: Domain '${request.payload.domain}' is on the security blocklist (${blockedCheck.rule?.reason || 'Restricted'}).`, 'error');
        return;
      }

      const newDomain: Domain = {
        id: request.domainId,
        domain: request.payload.domain!,
        federated: request.payload.federated!,
        collaborationType: request.payload.collaborationType!,
        samlRegistrationId: request.payload.samlRegistrationId!,
        mfaStatus: request.payload.mfaStatus!,
        ssoobTicket: request.payload.ssoobTicket!,
        whitelistedIps: request.payload.whitelistedIps || [],
        registeredBy: request.payload.registeredBy!,
        registeredOn: request.payload.registeredOn!,
        updatedBy: currentUser.email,
        updatedOn: getFormattedDate(),
        approvedBy: currentUser.email,
        approvedOn: getFormattedDate(),
        status: 'Enabled'
      };
      setDomainData(prev => [newDomain, ...prev]);
      addAuditLog(
        newDomain,
        currentUser.email,
        newDomain.ssoobTicket,
        `Approved 4-Eye Registration for domain ${newDomain.domain}. Initialized with isFederated as ${newDomain.federated === 'Yes' ? 'true' : 'false'}, Collaboration: ${newDomain.collaborationType}.`,
        'Initial'
      );
    } else if (request.operation === 'Domain Migration') {
      const updatedList = domainData.map(d => 
        d.id === request.domainId 
          ? { ...d, ...request.payload, updatedBy: currentUser.email, updatedOn: getFormattedDate(), approvedBy: currentUser.email, approvedOn: getFormattedDate(), status: 'Enabled' as const } 
          : d
      );
      setDomainData(updatedList);
      const migratedDomain = updatedList.find(d => d.id === request.domainId);
      if (migratedDomain) {
        addAuditLog(
          migratedDomain,
          currentUser.email,
          migratedDomain.ssoobTicket,
          `Approved 4-Eye Migration for domain ${migratedDomain.domain}. Updated collaboration type to ${migratedDomain.collaborationType}.`,
          'Update'
        );
      }
    } else if (request.operation === 'Domain Update') {
      const updatedList = domainData.map(d => 
        d.id === request.domainId 
          ? { ...d, ...request.payload, updatedBy: currentUser.email, updatedOn: getFormattedDate(), approvedBy: currentUser.email, approvedOn: getFormattedDate() } 
          : d
      );
      setDomainData(updatedList);
      const updatedDomain = updatedList.find(d => d.id === request.domainId);
      if (updatedDomain) {
        addAuditLog(
          updatedDomain,
          currentUser.email,
          updatedDomain.ssoobTicket,
          `Approved 4-Eye Update for domain ${updatedDomain.domain}.`,
          'Update'
        );
      }
    }

    setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
    setViewingRequest(null);
    showMessage(`Request for '${request.domainName}' approved!`, 'success');
  };

  const rejectRequest = (requestId: number) => {
    setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
    setViewingRequest(null);
    showMessage(`Request rejected.`, 'info');
  };

  // --- Migration Logic ---
  const [isMigrationDrawerOpen, setIsMigrationDrawerOpen] = useState(false);
  const [migrationDomain, setMigrationDomain] = useState('');
  const [migrationResult, setMigrationResult] = useState<Domain | null>(null);
  const [migrationUsers, setMigrationUsers] = useState<{ user: string, applications: string }[]>([]);
  const [migrationUserFilters, setMigrationUserFilters] = useState({ user: '', application: '', status: 'All' });
  const [selectedMigrationUsers, setSelectedMigrationUsers] = useState<string[]>([]);
  const [migrateUsersEnabled, setMigrateUsersEnabled] = useState(true);
  const [migrateDomainEnabled, setMigrateDomainEnabled] = useState(true);
  const [migrationStep, setMigrationStep] = useState<1 | 2>(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userCurrentPage, setUserCurrentPage] = useState(1);

  const getDomainUsers = (domain: string) => {
    if (domain === 'traiana.com') {
      return [
        { user: 'greg.smith@traiana.com', applications: 'Tradeserv, Reporting' },
        { user: 'sara.jones@traiana.com', applications: 'CFD' },
        { user: 'mike.tyson@traiana.com', applications: 'Reporting' },
        { user: 'emma.brown@traiana.com', applications: 'Tradeserv' },
        { user: 'leo.messi@traiana.com', applications: 'CFD, Tradeserv, Reporting' },
      ];
    }
    if (domain === 'abc.com' || domain === 'pqr.com' || domain === 'osttra.com') {
      const users = [];
      const count = domain === 'osttra.com' ? 15 : 20;
      for (let i = 1; i <= count; i++) {
        const applications = (i % 3 === 0) ? 'CFD, Tradeserv' : ((i % 2 === 0) ? 'CFD' : 'Tradeserv');
        users.push({ user: `dynamicuser${i}@${domain}`, applications: applications });
      }
      return users;
    }
    return [];
  };

  const handleMigrationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = domainData.find(d => d.domain.toLowerCase() === migrationDomain.toLowerCase().trim());
    if (!domain) {
      showMessage(`Domain '${migrationDomain}' not found.`, 'error');
      setMigrationResult(null);
      setMigrationUsers([]);
      setSelectedMigrationUsers([]);
      return;
    }
    setMigrationResult(domain);
    
    // Set default target collaboration type according to current state
    const isNonFed = domain.federated === 'No' || domain.collaborationType === 'ENTRA_NON_FED' || domain.collaborationType === 'OTP' || !domain.collaborationType;
    const isEntraFed = domain.federated === 'Yes' && domain.collaborationType === 'ENTRA_FED';
    
    if (isNonFed) {
      setMigrationCollaborationType(domain.collaborationType === 'OTP' ? 'ENTRA_FED' : 'OTP');
    } else if (isEntraFed) {
      setMigrationCollaborationType('SAML');
    } else {
      setMigrationCollaborationType('ENTRA_FED');
    }
    
    setMigrationSamlId('');
    setMigrationWhitelistedIps(domain.whitelistedIps || []);
    const users = getDomainUsers(domain.domain);
    setMigrationUsers(users);
    setSelectedMigrationUsers(users.map(u => u.user));
    setMigrationUserFilters({ user: '', application: '', status: 'All' });
    setMigrateUsersEnabled(true);
    setMigrateDomainEnabled(true);
    setMigrationStep(1);
    setUserCurrentPage(1);
  };

  const filteredMigrationUsers = useMemo(() => {
    return migrationUsers.filter(u => {
      const userMatch = u.user.toLowerCase().includes(migrationUserFilters.user.toLowerCase());
      const appMatch = u.applications.toLowerCase().includes(migrationUserFilters.application.toLowerCase());
      const alreadyMigrated = (migrationResult?.migratedUsers || []).includes(u.user);
      
      let statusMatch = true;
      if (migrationUserFilters.status === 'Migrated') {
        statusMatch = alreadyMigrated;
      } else if (migrationUserFilters.status === 'Non-migrated') {
        statusMatch = !alreadyMigrated;
      }
      return userMatch && appMatch && statusMatch;
    });
  }, [migrationUsers, migrationUserFilters, migrationResult]);

  const performMigration = (domain: Domain) => {
    if (!currentUser) return;

    if (!migrateDomainEnabled && !migrateUsersEnabled) {
      showMessage('Please enable at least one migration option (Domain Configuration or User Migration) before proceeding.', 'error');
      return;
    }
    
    // Determine target domain values
    const targetFederated: 'Yes' | 'No' = migrateDomainEnabled
      ? (migrationCollaborationType === 'ENTRA_NON_FED' || migrationCollaborationType === 'OTP' ? 'No' : 'Yes')
      : domain.federated;

    const targetCollaborationType = migrateDomainEnabled
      ? migrationCollaborationType
      : domain.collaborationType;

    const targetSamlRegistrationId = migrateDomainEnabled
      ? (migrationCollaborationType === 'SAML' ? migrationSamlId.trim() : '')
      : domain.samlRegistrationId;

    const targetWhitelistedIps = migrateDomainEnabled
      ? migrationWhitelistedIps
      : (domain.whitelistedIps || []);

    const targetMfaStatus: 'Enabled' | 'Disabled' = migrateDomainEnabled
      ? (migrationCollaborationType === 'OTP' ? 'Disabled' : domain.mfaStatus)
      : domain.mfaStatus;

    // Validate SAML Registration ID if SAML Federated is selected
    if (migrateDomainEnabled && migrationCollaborationType === 'SAML' && !migrationSamlId.trim()) {
      showMessage('SAML Registration ID is required for SAML Federated migration.', 'error');
      return;
    }

    // Validate Azure Whitelisting if migrating from Non-federated to Federated
    if (migrateDomainEnabled && domain.federated === 'No' && targetFederated === 'Yes') {
      if (!AZURE_WHITELISTED_DOMAINS.includes(domain.domain)) {
        showMessage(`Domain '${domain.domain}' is not whitelisted in Azure.`, 'error');
        return;
      }
    }

    // Determine target migrated users list
    const targetMigratedUsers = migrateUsersEnabled ? selectedMigrationUsers : (domain.migratedUsers || []);

    if (isFourEyeCheckEnabled) {
      const newRequest: PendingRequest = {
        requestId: Date.now(),
        operation: 'Domain Migration',
        operationType: 'Update',
        initiatedBy: currentUser.email,
        initiatedOn: getFormattedDate(),
        domainId: domain.id,
        domainName: domain.domain,
        payload: { 
          federated: targetFederated,
          collaborationType: targetCollaborationType,
          samlRegistrationId: targetSamlRegistrationId,
          whitelistedIps: targetWhitelistedIps,
          migratedUsers: targetMigratedUsers,
          mfaStatus: targetMfaStatus
        },
        approvedBy: null,
        approvedOn: null
      };
      setPendingRequests(prev => [...prev, newRequest]);
      setActiveView('blotter');
      setIsMigrationDrawerOpen(false);
      showMessage(`Migration request for '${domain.domain}' to ${targetCollaborationType} submitted for Pending Review.`, 'info');
    } else {
      let migratedDomainObj: Domain | null = null;
      setDomainData(prev => prev.map(d => {
        if (d.id === domain.id) {
          const updated: Domain = { 
            ...d, 
            federated: targetFederated, 
            collaborationType: targetCollaborationType,
            samlRegistrationId: targetSamlRegistrationId,
            whitelistedIps: targetWhitelistedIps,
            migratedUsers: targetMigratedUsers,
            mfaStatus: targetMfaStatus,
            updatedBy: currentUser.email, 
            updatedOn: getFormattedDate(), 
            status: 'Enabled' 
          };
          migratedDomainObj = updated;
          return updated;
        }
        return d;
      }));

      if (migratedDomainObj) {
        addAuditLog(
          migratedDomainObj,
          currentUser.email,
          domain.ssoobTicket || 'MIG-EXEC',
          `Migrated domain ${domain.domain} status from ${domain.federated === 'Yes' ? 'Fed' : 'Non-Fed'} to ${targetFederated === 'Yes' ? 'Fed' : 'Non-Fed'}. Updated Collaboration type from ${domain.collaborationType || 'ENTRA_NON_FED'} to ${targetCollaborationType}${targetCollaborationType === 'OTP' ? ' (OTP Mode: MFA Disabled)' : ''}${targetSamlRegistrationId ? ` (SAML ID: ${targetSamlRegistrationId})` : ''}.`,
          'Update'
        );
      }

      // Record user audit logs for migrated users
      if (migrateUsersEnabled && selectedMigrationUsers.length > 0) {
        selectedMigrationUsers.forEach(userEmail => {
          addUserAuditLog(
            userEmail,
            currentUser.email,
            domain.ssoobTicket || 'MIG-EXEC',
            `Migrated user ${userEmail} authentication to ${targetCollaborationType} with MFA ${targetCollaborationType === 'OTP' ? 'Disabled (Guest OTP)' : 'Enabled'}.`,
            'Update',
            {
              collaborationType: targetCollaborationType as any,
              ticketId: domain.ssoobTicket || 'MIG-EXEC',
              mfaStatus: targetCollaborationType === 'OTP' ? 'Disabled' : 'Enabled'
            }
          );
        });
      }

      setActiveView('blotter');
      setIsMigrationDrawerOpen(false);
      
      let successMsg = `Successfully completed migration for '${domain.domain}' to ${targetCollaborationType}: `;
      if (migrateDomainEnabled && migrateUsersEnabled) {
        successMsg += `domain configuration and ${selectedMigrationUsers.length} user(s) migrated.`;
      } else if (migrateDomainEnabled) {
        successMsg += `domain configuration updated.`;
      } else {
        successMsg += `${selectedMigrationUsers.length} user(s) migrated.`;
      }
      showMessage(successMsg, 'success');
    }
  };

  const handleMigrateUsersLater = () => {
    if (!viewingDomain) return;
    const currentMigrated = viewingDomain.migratedUsers || [];
    const updatedMigratedUsers = Array.from(new Set([...currentMigrated, ...detailsSelectedUsers]));
    
    setDomainData(prev => prev.map(d => 
      d.id === viewingDomain.id 
        ? { ...d, migratedUsers: updatedMigratedUsers, updatedBy: currentUser.email, updatedOn: getFormattedDate() }
        : d
    ));
    
    setViewingDomain(prev => prev ? { ...prev, migratedUsers: updatedMigratedUsers } : null);
    setDetailsSelectedUsers([]);
    showMessage(`Successfully migrated ${detailsSelectedUsers.length} user(s) to ${viewingDomain.collaborationType || 'Federated'}!`, 'success');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-main-bg)] p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200">
          <div className="text-center mb-6">
            <span className="text-3xl font-extrabold tracking-widest text-gray-800 block mb-1">OSTTRA</span>
            <span className="text-sm tracking-wider text-[var(--color-accent)]">SSO Central Login</span>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-3">Please sign in with your email address and password.</p>
              <label className="block text-sm font-medium mb-1 text-gray-600">Email Address</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required 
                placeholder="e.g., yourname@osttra.com" 
                className="w-full form-input-light" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required 
                placeholder="Enter password" 
                className="w-full form-input-light" 
              />
            </div>
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold mb-1 text-gray-600 flex items-center justify-between">
                <span>Client IP (IP Whitelist Test)</span>
                <span className="text-[10px] text-emerald-700 font-mono">Simulated IP</span>
              </label>
              <input 
                type="text" 
                value={loginClientIp}
                onChange={(e) => setLoginClientIp(e.target.value)}
                required 
                placeholder="e.g. 192.168.1.100" 
                className="w-full form-input-light text-xs font-mono" 
              />
              <div className="flex gap-1.5 mt-2">
                <button 
                  type="button" 
                  onClick={() => setLoginClientIp('192.168.1.100')} 
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-mono"
                >
                  osttra IP
                </button>
                <button 
                  type="button" 
                  onClick={() => setLoginClientIp('172.16.0.50')} 
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-mono"
                >
                  traiana IP
                </button>
                <button 
                  type="button" 
                  onClick={() => setLoginClientIp('203.0.113.99')} 
                  className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded font-mono"
                >
                  Blocked IP
                </button>
              </div>
            </div>
            <button type="submit" className="w-full accent-button justify-center py-3 mt-2">Sign In</button>
          </form>
          {message && (
            <div className={`mt-4 p-3 rounded text-sm text-center ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-main-bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-sidebar-bg)] flex flex-col shadow-xl z-20">
        <div className="p-4 flex items-center h-16 border-b border-gray-700 space-x-2">
          <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">UAT</span>
          <span className="text-lg font-bold tracking-wider text-white">Converge</span>
        </div>
        <nav className="p-2 flex-1 space-y-1">
          <button 
            onClick={() => {
              setActiveView('blotter');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'blotter' && !isMigrationDrawerOpen ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} className="mr-3 text-[var(--color-accent)]" />
            Domain enquiry
          </button>
          <button 
            onClick={() => {
              setActiveView('pending');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'pending' ? 'active' : ''}`}
          >
            <ClipboardList size={20} className="mr-3 text-[var(--color-accent)]" />
            Pending reviews
          </button>
          <button 
            onClick={() => {
              setActiveView('blotter');
              setMigrationDomain('');
              setMigrationResult(null);
              setMigrationUsers([]);
              setSelectedMigrationUsers([]);
              setMigrateUsersEnabled(true);
              setMigrateDomainEnabled(true);
              setIsMigrationDrawerOpen(true);
            }} 
            className={`sidebar-link w-full ${isMigrationDrawerOpen ? 'active' : ''}`}
          >
            <ArrowLeftRight size={20} className="mr-3 text-[var(--color-accent)]" />
            Domain & user migration
          </button>
          <button 
            onClick={() => {
              setActiveView('configuration');
              setConfigSubTab('governance');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'configuration' ? 'active' : ''}`}
          >
            <Settings size={20} className="mr-3 text-[var(--color-accent)]" />
            Configuration
          </button>
          {/* Audit Log Menu Group with Submenu */}
          <div className="space-y-0.5">
            <button 
              onClick={() => {
                setActiveView('audit');
                setIsMigrationDrawerOpen(false);
              }} 
              className={`sidebar-link w-full ${activeView === 'audit' || activeView === 'user-logins' ? 'active' : ''}`}
            >
              <History size={20} className="mr-3 text-[var(--color-accent)]" />
              <div className="flex items-center justify-between w-full pr-1">
                <span>Audit Log</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${activeView === 'audit' || activeView === 'user-logins' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            {/* Sub-menu items indented under Audit Log */}
            <div className="pl-6 pr-1 py-1 space-y-1 bg-black/15 border-l-2 border-[var(--color-accent)]/40 ml-4 my-1 rounded-r-md">
              <button
                onClick={() => {
                  setActiveView('audit');
                  setIsMigrationDrawerOpen(false);
                }}
                className={`w-full text-xs flex items-center px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                  activeView === 'audit' 
                    ? 'text-white font-bold bg-white/15 shadow-xs' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full mr-2 bg-gray-400"></span>
                Domain &amp; System Audits
              </button>
              <button
                onClick={() => {
                  setActiveView('user-logins');
                  setIsMigrationDrawerOpen(false);
                }}
                className={`w-full text-xs flex items-center justify-between px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                  activeView === 'user-logins' 
                    ? 'text-white font-bold bg-white/15 shadow-xs' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center">
                  <Clock size={13} className="mr-2 text-[var(--color-accent)]" />
                  <span>User Login Log</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </button>
            </div>
          </div>

          <button 
            onClick={() => {
              setActiveView('email-sync');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'email-sync' ? 'active' : ''}`}
          >
            <Mail size={20} className="mr-3 text-[var(--color-accent)]" />
            <div className="flex items-center justify-between w-full pr-1">
              <span>Email Update Status</span>
              {partiallyFailedEmailCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {partiallyFailedEmailCount}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveView('api-health');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'api-health' ? 'active' : ''}`}
          >
            <Activity size={20} className="mr-3 text-[var(--color-accent)]" />
            <div className="flex items-center justify-between w-full pr-1">
              <span>API Health Check</span>
              {apiEndpoints.some(e => e.status !== 'Healthy') ? (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveView('app-secrets');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'app-secrets' ? 'active' : ''}`}
          >
            <Key size={20} className="mr-3 text-[var(--color-accent)]" />
            <div className="flex items-center justify-between w-full pr-1">
              <span>App Secrets &amp; Expiry</span>
              {expiringSecretsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {expiringSecretsCount}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveView('traiana-skips');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'traiana-skips' ? 'active' : ''}`}
          >
            <RotateCcw size={20} className="mr-3 text-[var(--color-accent)]" />
            <div className="flex items-center justify-between w-full pr-1">
              <span>Traiana Skip Counter</span>
              {lockedTraianaUsersCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {lockedTraianaUsersCount}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveView('mfa-reset');
              setIsMigrationDrawerOpen(false);
            }} 
            className={`sidebar-link w-full ${activeView === 'mfa-reset' ? 'active' : ''}`}
          >
            <Smartphone size={20} className="mr-3 text-[var(--color-accent)]" />
            <div className="flex items-center justify-between w-full pr-1">
              <span>Reset MFA</span>
              {pendingMfaReEnrollCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-teal-500 text-white animate-pulse">
                  {pendingMfaReEnrollCount}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </div>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-700 flex justify-between items-center text-xs text-gray-500">
          <span>OSTTRA</span>
          <span>© 2026 OSTTRA</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-base font-extrabold tracking-tight text-gray-800">
              {activeView === 'blotter' && (
                blotterTab === 'blocked' 
                  ? 'Domain enquiry — Blocked Domains' 
                  : blotterTab === 'saml' 
                  ? 'Domain enquiry — SAML Metadata Management' 
                  : 'Domain enquiry'
              )}
              {activeView === 'pending' && 'Pending reviews'}
              {activeView === 'configuration' && (configSubTab === 'blacklist' ? 'Blocked Domains Management (Blacklist)' : 'Configuration & Governance')}
              {activeView === 'audit' && 'Audit Log'}
              {activeView === 'user-logins' && 'User SSO Login Activity & Last Login Log'}
              {activeView === 'email-sync' && 'User Email Update Status & Downstream Propagation'}
              {activeView === 'api-health' && 'API Health Check & Status Monitor'}
              {activeView === 'app-secrets' && 'Application Secrets & Expiry Monitor'}
              {activeView === 'traiana-skips' && 'Traiana Legacy App OTP & Skip Counter Support'}
              {activeView === 'mfa-reset' && 'Reset MFA'}
            </h1>
            
            {activeView === 'blotter' && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    setRegDomainInput('');
                    setRegFederated('Yes');
                    setRegCollaborationType('SAML');
                    setRegSamlId('');
                    setRegMfaStatus('Enabled');
                    setRegInfosecTicket('');
                    setIsRegistrationPanelOpen(true);
                  }}
                  className="flex items-center text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus size={14} className="mr-1 text-teal-600" />
                  Register new domain
                </button>
                <button 
                  onClick={() => {
                    setMigrationDomain('');
                    setMigrationResult(null);
                    setMigrationUsers([]);
                    setSelectedMigrationUsers([]);
                    setMigrateUsersEnabled(true);
                    setMigrateDomainEnabled(true);
                    setIsMigrationDrawerOpen(true);
                  }}
                  className="flex items-center text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus size={14} className="mr-1 text-teal-600" />
                  Migrate
                </button>
                <button 
                  onClick={() => setBlotterTab('saml')}
                  className={`flex items-center text-xs font-semibold rounded px-3 py-1.5 transition-colors shadow-xs cursor-pointer ${
                    blotterTab === 'saml' 
                      ? 'bg-teal-700 text-white' 
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Key size={14} className={`mr-1 ${blotterTab === 'saml' ? 'text-teal-200' : 'text-teal-600'}`} />
                  SAML Metadata
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Traiana Locked Counter Indicator Button */}
            {lockedTraianaUsersCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveView('traiana-skips')}
                className="flex items-center text-[11px] font-extrabold space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 transition-all cursor-pointer shadow-2xs"
                title={`${lockedTraianaUsersCount} Traiana users locked due to exhausted skips. Click to review & unlock.`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                <span>🔒 {lockedTraianaUsersCount} Locked (Traiana)</span>
              </button>
            )}

            {/* Quick MFA Pending Re-Enrollment Indicator Button */}
            {pendingMfaReEnrollCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveView('mfa-reset')}
                className="flex items-center text-[11px] font-extrabold space-x-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 px-3 py-1 rounded-full border border-teal-300 transition-all cursor-pointer shadow-2xs"
                title={`${pendingMfaReEnrollCount} user account(s) have reset MFA and are awaiting new device registration.`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                <span>📱 {pendingMfaReEnrollCount} Pending MFA Bind</span>
              </button>
            )}

            {/* Quick App Secrets Alert Indicator Button (Visible if any expiring in <= 90 days) */}
            {expiringSecretsCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveView('app-secrets')}
                className="flex items-center text-[11px] font-extrabold space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-300 transition-all cursor-pointer shadow-2xs"
                title={`${expiringSecretsCount} credentials expiring in next 3 months. Click to review.`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                <span>🚨 {expiringSecretsCount} Secrets Expiring (&le;3 Mos)</span>
              </button>
            )}

            {/* Quick API Health Indicator Button */}
            <button
              type="button"
              onClick={() => setActiveView('api-health')}
              className={`hidden lg:flex items-center text-[11px] font-bold space-x-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer shadow-2xs ${
                apiEndpoints.some(e => e.status === 'Down')
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : apiEndpoints.some(e => e.status === 'Degraded')
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Click to open API Health Dashboard"
            >
              <span className={`w-2 h-2 rounded-full ${
                apiEndpoints.some(e => e.status === 'Down')
                  ? 'bg-rose-500 animate-ping'
                  : apiEndpoints.some(e => e.status === 'Degraded')
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}></span>
              <span>
                API Health: {apiEndpoints.filter(e => e.status === 'Healthy').length}/{apiEndpoints.length} OK
              </span>
            </button>

            {/* Last updated indicator */}
            <div className="hidden xl:flex items-center text-[10px] text-gray-400 font-semibold space-x-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-200/50">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
              <span>Last updated: 15 July, 2026 05:23:22 - 12:00:00</span>
            </div>

            {/* Header search */}
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-36 text-xxs border border-gray-300 rounded pl-7 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* User profile */}
            <div className="flex items-center space-x-2.5 border-l border-gray-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white border border-emerald-700 shadow-xs">
                {currentUser.initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-gray-800 leading-tight">{currentUser.displayName}</p>
                <p className="text-[10px] text-gray-400 font-semibold leading-none mt-0.5">Global Admin</p>
              </div>
              <button onClick={handleLogout} className="ml-1 text-gray-400 hover:text-red-600 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 relative">
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-4 p-3 rounded-lg text-sm text-center font-semibold border ${
                message.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 
                message.type === 'error' ? 'bg-red-100 text-red-800 border-red-300' : 
                'bg-blue-100 text-blue-800 border-blue-300'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {/* Views */}
          {activeView === 'blotter' && (
            <div className="space-y-6">
              {/* Blotter Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div className="flex items-center space-x-2 bg-gray-100/90 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => setBlotterTab('registered')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      blotterTab === 'registered'
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
                  >
                    <Globe size={15} />
                    <span>Registered Domains</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      blotterTab === 'registered' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {domainData.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setBlotterTab('blocked')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      blotterTab === 'blocked'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
                  >
                    <Ban size={15} />
                    <span>Blocked Domains</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      blotterTab === 'blocked' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                    }`}>
                      {blacklistedDomains.filter(d => d.enabled).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setBlotterTab('saml')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      blotterTab === 'saml'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
                  >
                    <Key size={15} />
                    <span>SAML Metadata</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      blotterTab === 'saml' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {samlConfigs.length}
                    </span>
                  </button>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  {blotterTab === 'registered' && (
                    <span>Viewing all {filteredDomains.length} filtered domain configurations</span>
                  )}
                  {blotterTab === 'blocked' && (
                    <span>Enforcing security block rules across registrations</span>
                  )}
                  {blotterTab === 'saml' && (
                    <span>Manage SP / IdP federation metadata URLs and certificates</span>
                  )}
                </div>
              </div>

              {blotterTab === 'registered' ? (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium mb-2 text-gray-500">Global Search</label>
                    <div className="relative">
                      <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search Domain, Registered By, or Ticket Reference..." 
                        className="w-full form-input-light pl-10"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[var(--color-table-header-bg)] border-b border-gray-300 sticky top-0">
                        <tr>
                          <th className="p-3 font-semibold">Domain Name</th>
                          <th className="p-3 font-semibold">Federated</th>
                          <th className="p-3 font-semibold">Collaboration Type</th>
                          <th className="p-3 font-semibold">SAML Registration ID</th>
                          <th className="p-3 font-semibold">MFA Status</th>
                          <th className="p-3 font-semibold">Whitelisted IPs</th>
                          <th className="p-3 font-semibold">Domain Status</th>
                          <th className="p-3 font-semibold">Registered By</th>
                          <th className="p-3 font-semibold">Registered On</th>
                          <th className="p-3 font-semibold">SSOOB Ticket</th>
                          <th className="p-3 font-semibold">Approved By</th>
                          <th className="p-3 font-semibold">Approved On</th>
                          <th className="p-3 font-semibold">Action</th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter" value={columnFilters.domain} onChange={e => setColumnFilters({...columnFilters, domain: e.target.value})} /></th>
                          <th className="p-1">
                            <select className="blotter-filter-input" value={columnFilters.federated} onChange={e => setColumnFilters({...columnFilters, federated: e.target.value})}>
                              <option value="">All</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </th>
                          <th className="p-1">
                            <select className="blotter-filter-input" value={columnFilters.collaborationType} onChange={e => setColumnFilters({...columnFilters, collaborationType: e.target.value})}>
                              <option value="">All</option>
                              <option value="B2B">B2B</option>
                              <option value="SAML">SAML</option>
                              <option value="OTP">OTP</option>
                              <option value="ENTRA_FED">ENTRA_FED</option>
                              <option value="ENTRA_NON_FED">ENTRA_NON_FED</option>
                            </select>
                          </th>
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter" value={columnFilters.samlRegistrationId} onChange={e => setColumnFilters({...columnFilters, samlRegistrationId: e.target.value})} /></th>
                          <th className="p-1">
                            <select className="blotter-filter-input" value={columnFilters.mfaStatus} onChange={e => setColumnFilters({...columnFilters, mfaStatus: e.target.value})}>
                              <option value="">All</option>
                              <option value="Enabled">Enabled</option>
                              <option value="Disabled">Disabled</option>
                            </select>
                          </th>
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter IPs" value={columnFilters.whitelistedIps} onChange={e => setColumnFilters({...columnFilters, whitelistedIps: e.target.value})} /></th>
                          <th className="p-1">
                            <select className="blotter-filter-input" value={columnFilters.status} onChange={e => setColumnFilters({...columnFilters, status: e.target.value})}>
                              <option value="">All</option>
                              <option value="Enabled">Enabled</option>
                              <option value="Disabled">Disabled</option>
                              <option value="Pending">Pending</option>
                            </select>
                          </th>
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter" value={columnFilters.registeredBy} onChange={e => setColumnFilters({...columnFilters, registeredBy: e.target.value})} /></th>
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter" value={columnFilters.registeredOn} onChange={e => setColumnFilters({...columnFilters, registeredOn: e.target.value})} /></th>
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter" value={columnFilters.ssoobTicket} onChange={e => setColumnFilters({...columnFilters, ssoobTicket: e.target.value})} /></th>
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter" value={columnFilters.approvedBy} onChange={e => setColumnFilters({...columnFilters, approvedBy: e.target.value})} /></th>
                          <th className="p-1"><input type="text" className="blotter-filter-input" placeholder="Filter" value={columnFilters.approvedOn} onChange={e => setColumnFilters({...columnFilters, approvedOn: e.target.value})} /></th>
                          <th className="p-1"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredDomains.map((domain, idx) => (
                          <tr key={domain.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                            <td className="p-3 font-medium text-gray-800">{domain.domain}</td>
                            <td className={`p-3 font-bold ${domain.federated === 'Yes' ? 'text-green-700' : 'text-gray-500'}`}>{domain.federated}</td>
                            <td className="p-3 text-gray-800">{domain.collaborationType || '-'}</td>
                            <td className="p-3 text-gray-800">
                              {domain.samlRegistrationId ? (
                                <button
                                  type="button"
                                  onClick={() => setBlotterTab('saml')}
                                  className="inline-flex items-center gap-1 font-mono text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                                  title={`SAML 2.0 Registration ID: ${domain.samlRegistrationId}. Click to view in SAML Metadata workflow.`}
                                >
                                  <Key size={11} className="text-teal-600 shrink-0" />
                                  <span className="truncate max-w-[130px]">{domain.samlRegistrationId}</span>
                                </button>
                              ) : (
                                <span className="text-gray-400 font-normal">-</span>
                              )}
                            </td>
                            <td className={`p-3 font-bold ${domain.mfaStatus === 'Enabled' ? 'text-green-700' : 'text-gray-500'}`}>{domain.mfaStatus}</td>
                            <td className="p-3 text-xs">
                              {domain.whitelistedIps && domain.whitelistedIps.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300" title={domain.whitelistedIps.join(', ')}>
                                  <ShieldCheck size={12} className="text-emerald-700" />
                                  {domain.whitelistedIps.length} Rule{domain.whitelistedIps.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-normal">Unrestricted</span>
                              )}
                            </td>
                            <td className="p-3"><StatusBadge status={domain.status} /></td>
                            <td className="p-3 text-xs text-gray-600">{domain.registeredBy}</td>
                            <td className="p-3 text-xs text-gray-600">{domain.registeredOn}</td>
                            <td className="p-3 font-medium">{domain.ssoobTicket || 'N/A'}</td>
                            <td className="p-3 text-xs text-gray-600">{domain.approvedBy || 'N/A'}</td>
                            <td className="p-3 text-xs text-gray-600">{domain.approvedOn || 'N/A'}</td>
                            <td className="p-3">
                              <div className="flex space-x-2.5 items-center">
                                <button 
                                  onClick={() => {
                                    if ((domain as any).isPending) {
                                      const request = pendingRequests.find(r => r.requestId === (domain as any).requestId);
                                      if (request) setViewingRequest(request);
                                    } else {
                                      setEditingDomain(domain);
                                    }
                                  }} 
                                  className="text-gray-500 hover:text-[var(--color-primary)] transition-colors p-1 hover:bg-gray-100 rounded cursor-pointer"
                                  title={(domain as any).isPending ? "Review Pending Request" : "Edit Domain"}
                                >
                                  <Edit2 size={17} />
                                </button>
                                <button 
                                  onClick={() => setViewingDomain(domain)} 
                                  className="text-gray-500 hover:text-[var(--color-primary)] transition-colors p-1 hover:bg-gray-100 rounded cursor-pointer" 
                                  title="View Details"
                                >
                                  <Eye size={17} />
                                </button>
                                <button 
                                  onClick={() => setViewingAuditDomain(domain)} 
                                  className="text-gray-500 hover:text-[#0e8787] hover:bg-teal-50 transition-colors p-1 rounded cursor-pointer" 
                                  title="Audit Log"
                                >
                                  <History size={17} className="text-teal-700" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setMfaTargetDomain(domain.domain);
                                    setActiveView('mfa-reset');
                                  }} 
                                  className="text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors p-1 rounded cursor-pointer" 
                                  title={`Reset MFA for domain ${domain.domain}`}
                                >
                                  <RotateCcw size={17} className="text-emerald-700" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredDomains.length === 0 && (
                          <tr>
                            <td colSpan={13} className="p-8 text-center text-gray-500">No domains match the current filters.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : blotterTab === 'blocked' ? (
                <BlockedDomainsBlotter
                  blacklistedDomains={blacklistedDomains}
                  onAdd={handleAddBlacklistedDomain}
                  onAddBatch={handleAddBatchBlacklistedDomains}
                  onUpdate={handleUpdateBlacklistedDomain}
                  onDelete={handleDeleteBlacklistedDomain}
                  onToggleStatus={handleToggleBlacklistedStatus}
                  currentUserEmail={currentUser.email}
                />
              ) : (
                <SamlMetadataBlotter
                  samlConfigs={samlConfigs}
                  domains={domainData}
                  onGenerate={handleGenerateSamlMetadata}
                  onUpdateClientMetadata={handleUpdateClientSamlMetadata}
                  onDelete={handleDeleteSamlMetadata}
                  onQuickRegisterDomain={handleQuickRegisterWithSaml}
                  currentUserEmail={currentUser.email}
                />
              )}
            </div>
          )}

          {activeView === 'pending' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">4-Eye Pending Operations</h2>
                <button onClick={() => setActiveView('blotter')} className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center">
                  <ChevronLeft size={16} className="mr-1" />
                  Back to Blotter
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--color-table-header-bg)] border-b border-gray-300">
                    <tr>
                      <th className="p-3 font-semibold">Operation</th>
                      <th className="p-3 font-semibold">Entity</th>
                      <th className="p-3 font-semibold">Type</th>
                      <th className="p-3 font-semibold">Initiated By</th>
                      <th className="p-3 font-semibold">Initiated On</th>
                      <th className="p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingRequests.map((req) => (
                      <tr key={req.requestId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-gray-800">{req.operation}</td>
                        <td className="p-3 font-medium text-gray-800">{req.domainName}</td>
                        <td className="p-3 text-gray-600">{req.operationType}</td>
                        <td className="p-3 text-gray-600">{req.initiatedBy}</td>
                        <td className="p-3 text-gray-600">{req.initiatedOn}</td>
                        <td className="p-3">
                          <div className="flex space-x-3">
                            <button onClick={() => approveRequest(req.requestId)} className="text-green-600 hover:text-green-800" title="Approve"><Check size={18} /></button>
                            <button onClick={() => rejectRequest(req.requestId)} className="text-red-600 hover:text-red-800" title="Reject"><X size={18} /></button>
                            <button onClick={() => setViewingRequest(req)} className="text-gray-600 hover:text-gray-800" title="View Details"><Eye size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">No operations are currently pending review.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {activeView === 'configuration' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">System Configuration</h2>
                  <p className="text-xs text-gray-500">Manage global security policies and dual-authorization parameters.</p>
                </div>
                <button onClick={() => setActiveView('blotter')} className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center cursor-pointer">
                  <ChevronLeft size={16} className="mr-1" />
                  Back to Blotter
                </button>
              </div>

              <div className="max-w-xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Governance & Approval Settings</h2>
                  <p className="text-sm text-gray-500 mb-6">Manage global dual-authorization parameters for domain operations.</p>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-bold mb-2 text-gray-800">4-Eye Check Policy</label>
                      <p className="text-xs text-gray-500 mb-4">Enforces dual authorization for critical domain actions (registration/migration). When enabled, changes require secondary operator approval.</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 font-medium">Enforce Dual Authorization</span>
                        <button 
                          onClick={() => setIsFourEyeCheckEnabled(!isFourEyeCheckEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 cursor-pointer ${isFourEyeCheckEnabled ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isFourEyeCheckEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        showMessage(`Governance settings updated.`, 'success');
                        setActiveView('blotter');
                      }} 
                      className="w-full accent-button justify-center py-3 cursor-pointer"
                    >
                      Save Settings and Return to Blotter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'audit' && (
            <AuditLogsView
              domains={domainData}
              domainAuditLogs={auditLogs}
              userAuditLogs={userAuditLogs}
              onNavigateHome={() => setActiveView('blotter')}
            />
          )}

          {activeView === 'user-logins' && (
            <UserLoginLogView
              loginRecords={ssoLoginRecords}
              onRecordLogin={handleRecordSsoLogin}
              onNavigateHome={() => setActiveView('blotter')}
            />
          )}

          {activeView === 'email-sync' && (
            <EmailSyncManagementView
              requests={emailSyncRequests}
              onRetriggerApp={handleRetriggerAppSync}
              onRetriggerAllFailed={handleRetriggerAllFailedSync}
              onInitiateSync={handleInitiateEmailSync}
              onNavigateHome={() => setActiveView('blotter')}
              currentUserEmail={currentUser?.email || 'ajay.swarnkar@osttra.com'}
            />
          )}

          {activeView === 'api-health' && (
            <ApiHealthView
              endpoints={apiEndpoints}
              onUpdateEndpoints={setApiEndpoints}
              probeLogs={apiProbeLogs}
              onAddProbeLog={(log) => setApiProbeLogs(prev => [log, ...prev])}
              onNavigateHome={() => setActiveView('blotter')}
            />
          )}

          {activeView === 'app-secrets' && (
            <AppSecretsView
              secrets={appSecrets}
              onUpdateSecrets={setAppSecrets}
              onNavigateHome={() => setActiveView('blotter')}
            />
          )}

          {activeView === 'traiana-skips' && (
            <TraianaSkipCounterView
              users={traianaUsers}
              onUpdateUsers={setTraianaUsers}
              auditLogs={traianaSkipAuditLogs}
              onAddAuditLog={(log) => setTraianaSkipAuditLogs(prev => [log, ...prev])}
              currentUser={currentUser}
              onNavigateHome={() => setActiveView('blotter')}
            />
          )}

          {activeView === 'mfa-reset' && (
            <MfaResetManagementView
              users={mfaUsers}
              onUpdateUsers={setMfaUsers}
              auditLogs={mfaAuditLogs}
              onAddAuditLog={(log) => setMfaAuditLogs(prev => [log, ...prev])}
              domains={domainData}
              currentUser={currentUser}
              onNavigateHome={() => setActiveView('blotter')}
              initialTargetEmail={mfaTargetEmail}
              initialTargetDomain={mfaTargetDomain}
            />
          )}
        </main>
      </div>

      {/* Side Panel: Registration */}
      <AnimatePresence>
        {isRegistrationPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegistrationPanelOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Register New Domain</h2>
                <button onClick={() => setIsRegistrationPanelOpen(false)} className="text-gray-400 hover:text-gray-800 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      name="domain" 
                      type="text" 
                      required 
                      placeholder="e.g., yourcompany.com" 
                      value={regDomainInput}
                      onChange={(e) => setRegDomainInput(e.target.value)}
                      className={`w-full form-input-light pr-10 ${regBlockedCheck.isBlocked ? 'border-red-500 ring-1 ring-red-400 bg-red-50/30' : ''}`} 
                    />
                    {regDomainInput.trim() && (
                      <div className="absolute right-3 top-2.5">
                        {regBlockedCheck.isBlocked ? (
                          <Ban size={18} className="text-red-600" />
                        ) : (
                          <Check size={18} className="text-emerald-600" />
                        )}
                      </div>
                    )}
                  </div>

                  {regBlockedCheck.isBlocked && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-xs"
                    >
                      <div className="flex items-start space-x-2.5">
                        <Ban size={16} className="text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-800">Domain is Blacklisted</p>
                          <p className="text-[11px] text-red-700 mt-0.5">
                            Matches active blocklist rule <span className="font-mono font-bold bg-red-100 px-1 py-0.2 rounded text-red-900">{regBlockedCheck.rule?.domain}</span> ({regBlockedCheck.rule?.category}).
                          </p>
                          <p className="text-[11px] text-red-600 mt-1 italic">
                            Reason: {regBlockedCheck.rule?.reason}
                            {regBlockedCheck.rule?.ticketId && (
                              <span className="ml-1 font-mono font-bold">[{regBlockedCheck.rule.ticketId}]</span>
                            )}
                          </p>
                          <p className="text-[11px] text-red-500 font-semibold mt-1">Registration will be rejected upon submission.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">Federated</label>
                  <select 
                    name="federated" 
                    required 
                    className="w-full form-input-light"
                    value={regFederated}
                    onChange={(e) => {
                      const val = e.target.value as 'Yes' | 'No';
                      setRegFederated(val);
                      if (val === 'No') {
                        if (regCollaborationType !== 'OTP' && regCollaborationType !== 'ENTRA_NON_FED') {
                          setRegCollaborationType('ENTRA_NON_FED');
                        }
                        setRegSamlId('');
                        setRegSamlSource({ type: null });
                        if (regCollaborationType === 'OTP') {
                          setRegMfaStatus('Disabled');
                        } else {
                          setRegMfaStatus('Enabled');
                          setRegInfosecTicket('');
                        }
                      } else {
                        if (regCollaborationType !== 'SAML' && regCollaborationType !== 'ENTRA_FED') {
                          setRegCollaborationType('SAML');
                        }
                        setRegMfaStatus('Enabled');
                      }
                    }}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">Collaboration Type</label>
                  <select 
                    name="collaborationType" 
                    required
                    className="w-full form-input-light"
                    value={regCollaborationType}
                    onChange={(e) => {
                      const val = e.target.value as 'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED' | '';
                      setRegCollaborationType(val);
                      if (val !== 'SAML') {
                        setRegSamlId('');
                        setRegSamlSource({ type: null });
                      }
                      if (val === 'OTP') {
                        setRegMfaStatus('Disabled');
                      } else if (val === 'ENTRA_NON_FED') {
                        if (regMfaStatus === 'Disabled') {
                          setRegMfaStatus('Enabled');
                          setRegInfosecTicket('');
                        }
                      }
                    }}
                  >
                    {regFederated === 'No' ? (
                      <>
                        <option value="ENTRA_NON_FED">ENTRA_NON_FED</option>
                        <option value="OTP">OTP</option>
                      </>
                    ) : (
                      <>
                        <option value="SAML">SAML</option>
                        <option value="OTP">OTP</option>
                        <option value="ENTRA_FED">ENTRA_FED</option>
                      </>
                    )}
                  </select>
                  {regFederated === 'No' && regCollaborationType === 'OTP' && (
                    <div className="mt-1.5 p-2 rounded bg-indigo-50 border border-indigo-100 flex items-start space-x-2 text-[11px] text-indigo-900">
                      <ShieldCheck size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>OTP Non-Federated Mode:</strong> One-Time Passcode guest access. SAML ID and MFA are disabled. Infosec Ticket is optional, and IP whitelisting can be configured.
                      </span>
                    </div>
                  )}
                </div>
                {/* SAML Registration ID Container: Read-Only & Mandatory */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <span>SAML Registration ID</span>
                      {regCollaborationType === 'SAML' && (
                        <span className="text-red-500 font-bold">* (Mandatory)</span>
                      )}
                    </label>
                    {regCollaborationType === 'SAML' ? (
                      <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                        <Lock size={11} className="text-gray-400" />
                        Read-Only
                      </span>
                    ) : regCollaborationType === 'OTP' ? (
                      <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                        <Lock size={11} className="text-gray-400" />
                        Disabled for OTP
                      </span>
                    ) : null}
                  </div>

                  {/* Read-Only Input Field with Actions */}
                  <div className="relative">
                    <input 
                      name="samlRegistrationId" 
                      type="text" 
                      readOnly
                      required={regCollaborationType === 'SAML'}
                      disabled={regCollaborationType !== 'SAML'}
                      placeholder={
                        regCollaborationType === 'SAML' 
                          ? (normalizedRegDomain 
                              ? "— No SAML ID Linked (Generate or Copy Below) —" 
                              : "Enter Domain Name above to check SAML metadata") 
                          : regCollaborationType === 'OTP'
                          ? "N/A (Disabled for OTP)"
                          : "N/A (Non-SAML)"
                      }
                      className={`w-full form-input-light font-mono text-xs pr-16 read-only-input ${
                        regCollaborationType === 'SAML' && !regSamlId 
                          ? 'border-amber-400 bg-amber-50/20 text-amber-900 placeholder:text-amber-600/70' 
                          : regCollaborationType === 'SAML' && regSamlId
                          ? 'border-teal-400 bg-teal-50/30 text-teal-950 font-bold'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      value={regCollaborationType === 'SAML' ? regSamlId : ''}
                    />
                    {regSamlId && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(regSamlId);
                            setCopiedSamlKey('reg-saml');
                            setTimeout(() => setCopiedSamlKey(null), 2000);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 cursor-pointer"
                          title="Copy SAML Registration ID"
                        >
                          {copiedSamlKey === 'reg-saml' ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRegSamlId('');
                            setRegSamlSource({ type: null });
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                          title="Unlink / Clear SAML ID"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SAML Source & Configuration Helpers */}
                  {regCollaborationType === 'SAML' && (
                    <div className="mt-2 space-y-2">
                      {/* State A: SAML ID is Populated and Valid */}
                      {regSamlId ? (
                        <div className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/60 text-xs text-teal-950 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5 text-teal-900">
                              <CheckCircle2 size={14} className="text-teal-700 shrink-0" />
                              {regSamlSource.type === 'AUTO_METADATA' && (
                                <>Auto-Populated from SAML Metadata for '{regSamlSource.sourceDomain}'</>
                              )}
                              {regSamlSource.type === 'COPIED_DOMAIN' && (
                                <>Reusing SAML Registration ID from '{regSamlSource.sourceDomain}'</>
                              )}
                              {regSamlSource.type === 'GENERATED_NEW' && (
                                <>SAML Metadata Generated for '{regSamlSource.sourceDomain}'</>
                              )}
                              {!regSamlSource.type && (
                                <>SAML Registration ID Linked</>
                              )}
                            </span>
                            <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold">
                              Mandatory Fulfilled
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-teal-800 pt-1 border-t border-teal-200/60">
                            <span>
                              {regSamlSource.ticketId && <span>Ref: <strong>{regSamlSource.ticketId}</strong> • </span>}
                              ID: <code className="font-mono">{regSamlId.slice(0, 18)}...</code>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsCopySamlDropdownOpen(prev => !prev)}
                                className="text-teal-700 hover:text-teal-900 font-semibold underline text-[11px] cursor-pointer"
                              >
                                Change / Copy from other domain
                              </button>
                              <span className="text-teal-300">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineSamlTicket(regInfosecTicket || 'SSOOB-GEN');
                                  setInlineSamlNotes('');
                                  setInlineSamlError('');
                                  setIsInlineSamlModalOpen(true);
                                }}
                                className="text-teal-700 hover:text-teal-900 font-semibold underline text-[11px] cursor-pointer"
                              >
                                Generate new
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* State B: SAML ID is Empty (Metadata not found for entered domain) */
                        <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/70 text-xs text-amber-950 space-y-2.5">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-900">
                                {normalizedRegDomain 
                                  ? `SAML Metadata Not Found for "${normalizedRegDomain}"` 
                                  : `SAML Metadata Required (Mandatory)`}
                              </p>
                              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                SAML Registration ID is <strong>read-only and mandatory</strong>. Choose an option to populate it:
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {/* Option 1: Generate SAML Metadata */}
                            <button
                              type="button"
                              onClick={() => {
                                setInlineSamlTicket(regInfosecTicket || 'SSOOB-GEN');
                                setInlineSamlNotes('');
                                setInlineSamlError('');
                                setIsInlineSamlModalOpen(true);
                              }}
                              className="p-2.5 bg-white hover:bg-teal-50 border border-teal-300 hover:border-teal-400 rounded-lg text-left transition-all shadow-2xs group cursor-pointer"
                            >
                              <div className="flex items-center space-x-1.5 text-teal-800 font-bold text-xs">
                                <Key size={13} className="text-teal-600 group-hover:scale-110 transition-transform" />
                                <span>Generate SAML Metadata</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                Create new OSTTRA SP metadata & dedicated SAML ID for {normalizedRegDomain || 'this domain'}.
                              </p>
                            </button>

                            {/* Option 2: Copy from Other SAML Domain */}
                            <button
                              type="button"
                              onClick={() => setIsCopySamlDropdownOpen(prev => !prev)}
                              className="p-2.5 bg-white hover:bg-indigo-50 border border-indigo-300 hover:border-indigo-400 rounded-lg text-left transition-all shadow-2xs group cursor-pointer"
                            >
                              <div className="flex items-center space-x-1.5 text-indigo-800 font-bold text-xs">
                                <Share2 size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                <span>Copy from Other Domain</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                Reuse SAML ID from an enterprise subsidiary or shared IdP.
                              </p>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Searchable Picker to Copy SAML ID from Other Domains */}
                      <AnimatePresence>
                        {isCopySamlDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden bg-white border border-indigo-200 rounded-lg shadow-md p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                <Share2 size={13} className="text-indigo-700" />
                                Select Domain to Copy SAML Registration ID:
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsCopySamlDropdownOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="relative">
                              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Filter existing SAML domains..."
                                value={copySearchQuery}
                                onChange={(e) => setCopySearchQuery(e.target.value)}
                                className="w-full form-input-light pl-8 text-[11px] py-1"
                              />
                            </div>

                            <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded">
                              {availableSamlDomains
                                .filter(d => !copySearchQuery || d.domain.toLowerCase().includes(copySearchQuery.toLowerCase()) || d.ticketId.toLowerCase().includes(copySearchQuery.toLowerCase()))
                                .map((item, idx) => (
                                  <button
                                    key={`${item.domain}-${item.samlRegistrationId}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                      setRegSamlId(item.samlRegistrationId);
                                      setRegSamlSource({
                                        type: 'COPIED_DOMAIN',
                                        sourceDomain: item.domain,
                                        ticketId: item.ticketId
                                      });
                                      setIsCopySamlDropdownOpen(false);
                                      showMessage(`SAML Registration ID copied from domain '${item.domain}'.`, 'success');
                                    }}
                                    className="w-full text-left p-2 hover:bg-indigo-50/70 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                                  >
                                    <div>
                                      <div className="flex items-center space-x-1.5">
                                        <Globe size={12} className="text-indigo-600" />
                                        <span className="font-bold text-gray-800 group-hover:text-indigo-900">{item.domain}</span>
                                        <span className="text-[10px] bg-gray-100 px-1 py-0.2 rounded text-gray-600 font-mono">
                                          {item.ticketId}
                                        </span>
                                      </div>
                                      <p className="font-mono text-[10px] text-gray-400 mt-0.5 pl-4 truncate max-w-[240px]">
                                        ID: {item.samlRegistrationId}
                                      </p>
                                    </div>
                                    <span className="text-[11px] font-semibold text-indigo-700 group-hover:underline shrink-0 pl-2">
                                      Copy ID →
                                    </span>
                                  </button>
                                ))}
                              {availableSamlDomains.length === 0 && (
                                <p className="text-[11px] text-gray-400 text-center py-3 italic">
                                  No existing SAML domains available to copy.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-600">MFA</label>
                    {regCollaborationType === 'OTP' && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock size={11} className="text-amber-600" />
                        Disabled & Non-Editable (OTP)
                      </span>
                    )}
                  </div>
                  {regCollaborationType === 'OTP' ? (
                    <>
                      <input type="hidden" name="mfaStatus" value="Disabled" />
                      <select 
                        disabled 
                        className="w-full form-input-light read-only-input bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                        value="Disabled"
                      >
                        <option value="Disabled">Disabled</option>
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        MFA is disabled and non-editable for OTP collaboration.
                      </p>
                    </>
                  ) : (
                    <select 
                      name="mfaStatus" 
                      required 
                      className="w-full form-input-light"
                      value={regMfaStatus}
                      onChange={(e) => {
                        const val = e.target.value as 'Enabled' | 'Disabled';
                        setRegMfaStatus(val);
                        if (val === 'Enabled') setRegInfosecTicket('');
                      }}
                    >
                      <option value="Enabled">Enabled</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-600">
                      Infosec Ticket Reference 
                      {regMfaStatus === 'Disabled' && regCollaborationType !== 'OTP' && (
                        <span className="text-red-500 font-bold ml-0.5">* (Mandatory)</span>
                      )}
                      {regCollaborationType === 'OTP' && (
                        <span className="text-gray-400 font-normal text-xs ml-1">(Optional)</span>
                      )}
                    </label>
                    {regCollaborationType === 'OTP' && (
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                        Optional if available
                      </span>
                    )}
                  </div>
                  <input 
                    name="infosecTicket" 
                    type="text" 
                    required={regMfaStatus === 'Disabled' && regCollaborationType !== 'OTP'}
                    disabled={regMfaStatus !== 'Disabled' && regCollaborationType !== 'OTP'}
                    placeholder={
                      regCollaborationType === 'OTP' 
                        ? "e.g., INFOSEC-1234 (optional if available)" 
                        : regMfaStatus === 'Disabled' 
                        ? "e.g., INFOSEC-1234" 
                        : "N/A"
                    }
                    className={`w-full form-input-light ${
                      regMfaStatus !== 'Disabled' && regCollaborationType !== 'OTP' 
                        ? 'read-only-input bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : regCollaborationType === 'OTP' 
                        ? 'border-blue-300 focus:border-blue-500' 
                        : ''
                    }`}
                    value={regInfosecTicket}
                    onChange={(e) => setRegInfosecTicket(e.target.value)}
                  />
                  {regCollaborationType === 'OTP' && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      User can provide the Infosec ticket ID if available. IPs can be whitelisted below.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">SSOOB Ticket Reference (Optional)</label>
                  <input name="ssoobTicket" type="text" placeholder="SSOOB-XXX" className="w-full form-input-light" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">Registered By</label>
                  <input type="text" readOnly value={currentUser.email} className="w-full form-input-light read-only-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">Registered On</label>
                  <input type="text" readOnly value={getFormattedDate()} className="w-full form-input-light read-only-input" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-600">IP Whitelist</label>
                    {regCollaborationType === 'OTP' && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Recommended for OTP
                      </span>
                    )}
                  </div>
                  <IpWhitelistManager 
                    ips={regWhitelistedIps} 
                    onChange={setRegWhitelistedIps} 
                  />
                  {regCollaborationType === 'OTP' && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Add corporate IP ranges for whitelisting to secure OTP guest access to trusted networks.
                    </p>
                  )}
                </div>
                <button type="submit" className="w-full accent-button justify-center py-3 mt-8">Register New Domain</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal: Inline SAML Metadata Generator for Domain Registration */}
      <AnimatePresence>
        {isInlineSamlModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInlineSamlModalOpen(false)}
              className="fixed inset-0 bg-black/50"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-50 text-teal-800 rounded-lg">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Generate SAML 2.0 Metadata</h3>
                    <p className="text-xs text-gray-500">Create metadata & assign a new SAML Registration ID</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsInlineSamlModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const targetDomain = regDomainInput.trim().toLowerCase();
                if (!targetDomain) {
                  setInlineSamlError('Please provide or enter a valid domain name first.');
                  return;
                }
                const ticket = inlineSamlTicket.trim().toUpperCase();
                if (!ticket) {
                  setInlineSamlError('SSOOB / Infosec Ticket Reference is required.');
                  return;
                }

                // Generate SAML metadata
                const newCfg = handleGenerateSamlMetadata(targetDomain, ticket, inlineSamlNotes.trim());
                setRegSamlId(newCfg.samlRegistrationId);
                setRegSamlSource({
                  type: 'GENERATED_NEW',
                  sourceDomain: targetDomain,
                  ticketId: ticket
                });
                setIsInlineSamlModalOpen(false);
                showMessage(`SAML Metadata and Registration ID generated for '${targetDomain}'.`, 'success');
              }}>
                <div className="p-6 space-y-4">
                  {inlineSamlError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                      <AlertTriangle size={15} className="shrink-0 text-red-600" />
                      <span>{inlineSamlError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Domain Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., example.com"
                      value={regDomainInput}
                      onChange={(e) => {
                        setRegDomainInput(e.target.value);
                        setInlineSamlError('');
                      }}
                      className="w-full form-input-light font-mono text-sm"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      This domain will be bound to the generated SAML SP Metadata endpoint.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Ticket Reference <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., SSOOB-10442 or SEC-8891"
                      value={inlineSamlTicket}
                      onChange={(e) => {
                        setInlineSamlTicket(e.target.value);
                        setInlineSamlError('');
                      }}
                      className="w-full form-input-light font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Configuration Notes (Optional)
                    </label>
                    <textarea 
                      placeholder="e.g., Corporate Okta integration / Azure AD Enterprise App"
                      value={inlineSamlNotes}
                      onChange={(e) => setInlineSamlNotes(e.target.value)}
                      rows={2}
                      className="w-full form-input-light text-sm"
                    />
                  </div>

                  <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-lg text-xs text-teal-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-teal-950">
                      <Sparkles size={13} className="text-teal-700" />
                      What happens on generation:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-teal-800 text-[11px] pl-1">
                      <li>Generates a secure UUID v4 <code className="font-mono">SAML Registration ID</code>.</li>
                      <li>Generates OSTTRA SAML 2.0 SP Metadata URL (<code className="font-mono">https://sso.osttra.com/saml/v1/metadata/...</code>).</li>
                      <li>Populates the mandatory SAML Registration ID field immediately.</li>
                      <li>Logs an initial audit entry for compliance.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex items-center justify-end space-x-3 bg-gray-50">
                  <button 
                    type="button"
                    onClick={() => setIsInlineSamlModalOpen(false)}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="accent-button flex items-center space-x-2"
                  >
                    <Key size={16} />
                    <span>Generate & Link SAML ID</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View Details */}
      <AnimatePresence>
        {viewingDomain && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setViewingDomain(null); setActiveDetailsTab('config'); }}
              className="fixed inset-0 bg-black/50"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl z-10 p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold text-gray-800 mr-2">Domain Details: {viewingDomain.domain}</h2>
                  <StatusBadge status={viewingDomain.status} />
                </div>
                <button onClick={() => { setViewingDomain(null); setActiveDetailsTab('config'); }} className="text-gray-400 hover:text-gray-800 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button 
                  onClick={() => setActiveDetailsTab('config')}
                  className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${activeDetailsTab === 'config' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Domain Configuration
                </button>
                <button 
                  onClick={() => setActiveDetailsTab('apps')}
                  className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${activeDetailsTab === 'apps' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Applications
                </button>
                <button 
                  onClick={() => setActiveDetailsTab('users')}
                  className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${activeDetailsTab === 'users' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Users
                </button>
              </div>

              <div className="space-y-4">
                {activeDetailsTab === 'config' && (
                  <>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {[
                        { label: 'Domain Name', value: viewingDomain.domain },
                        { label: 'Federated', value: viewingDomain.federated },
                        { label: 'Collaboration Type', value: viewingDomain.collaborationType || '-' },
                        { label: 'SAML Registration ID', value: viewingDomain.samlRegistrationId || '-' },
                        { label: 'MFA Status', value: viewingDomain.mfaStatus },
                        { label: 'Infosec Ticket Reference', value: viewingDomain.infosecTicket || 'N/A' },
                        { label: 'SSOOB Ticket Reference', value: viewingDomain.ssoobTicket || 'N/A' },
                        { label: 'Registered By', value: viewingDomain.registeredBy },
                        { label: 'Registered On', value: viewingDomain.registeredOn },
                        { label: 'Approved By', value: viewingDomain.approvedBy || 'N/A' },
                        { label: 'Approved On', value: viewingDomain.approvedOn || 'N/A' },
                        { label: 'Updated By', value: viewingDomain.updatedBy },
                        { label: 'Updated On', value: viewingDomain.updatedOn },
                      ].map((item, i) => (
                        <div key={i} className="pb-2 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500">{item.label}</p>
                          <p className="text-base font-semibold text-gray-800">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <IpWhitelistManager 
                        ips={viewingDomain.whitelistedIps || []} 
                        onChange={() => {}} 
                        readOnly={true} 
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-bold text-gray-700 mb-3">Example Users</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {getDomainUsers(viewingDomain.domain).slice(0, 3).map((user, i) => {
                          const latestUserLogin = ssoLoginRecords.find(r => r.email.toLowerCase() === user.email.toLowerCase());
                          return (
                          <div key={i} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold mr-3">
                                {user.email && user.email.length > 0 ? user.email.charAt(0).toUpperCase() : '?'}
                                {(user.email && typeof user.email === 'string' && user.email.includes('.') && user.email.split('.')[1] && user.email.split('.')[1].length > 0) ? user.email.split('.')[1].charAt(0).toUpperCase() : ''}
                              </div>
                              <span className="text-gray-700 font-medium">{user.email}</span>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                              Last login: {latestUserLogin ? latestUserLogin.lastLoginTimestamp.split(' ')[0] : (user.lastLogin ? user.lastLogin.split(',')[0] : 'Never')}
                            </span>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {activeDetailsTab === 'apps' && (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Application Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Environment</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {getDomainApplications(viewingDomain.domain).map((app, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{app.name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${app.environment === 'PROD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {app.environment}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeDetailsTab === 'users' && (
                  <div className="space-y-4">
                    {/* Migration Action Bar (For Federated Domains or OTP Domains) */}
                    {(viewingDomain.federated === 'Yes' || viewingDomain.collaborationType === 'OTP') && (() => {
                      const allDomainUsers = getDomainUsers(viewingDomain.domain);
                      const migratedList = viewingDomain.migratedUsers || [];
                      const migratedCount = allDomainUsers.filter(u => migratedList.includes(u.email)).length;
                      const unmigratedCount = allDomainUsers.length - migratedCount;

                      return (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">Domain Migration: User Status</p>
                              <p className="text-xs text-gray-500">
                                Total Users: <span className="font-semibold text-gray-700">{allDomainUsers.length}</span> | 
                                Migrated: <span className="font-semibold text-green-600">{migratedCount}</span> | 
                                Unmigrated: <span className="font-semibold text-amber-600">{unmigratedCount}</span>
                              </p>
                            </div>
                            
                            {unmigratedCount > 0 && (
                              <button
                                disabled={detailsSelectedUsers.length === 0}
                                onClick={handleMigrateUsersLater}
                                className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                                  detailsSelectedUsers.length > 0 
                                    ? 'bg-[var(--color-primary)] text-white hover:bg-opacity-90 shadow-sm cursor-pointer' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                Migrate Selected ({detailsSelectedUsers.length})
                              </button>
                            )}
                          </div>

                          {unmigratedCount > 0 && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600 bg-white border border-gray-100 p-2 rounded">
                              <input 
                                type="checkbox"
                                checked={allDomainUsers.length > 0 && allDomainUsers.filter(u => !migratedList.includes(u.email)).every(u => detailsSelectedUsers.includes(u.email))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const unmigratedEmails = allDomainUsers
                                      .filter(u => !migratedList.includes(u.email))
                                      .map(u => u.email);
                                    setDetailsSelectedUsers(unmigratedEmails);
                                  } else {
                                    setDetailsSelectedUsers([]);
                                  }
                                }}
                                className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-3.5 w-3.5 cursor-pointer"
                              />
                              <span className="font-medium cursor-pointer select-none" onClick={() => {
                                const unmigratedEmails = allDomainUsers
                                  .filter(u => !migratedList.includes(u.email))
                                  .map(u => u.email);
                                const allSelected = allDomainUsers.length > 0 && allDomainUsers.filter(u => !migratedList.includes(u.email)).every(u => detailsSelectedUsers.includes(u.email));
                                if (allSelected) {
                                  setDetailsSelectedUsers([]);
                                } else {
                                  setDetailsSelectedUsers(unmigratedEmails);
                                }
                              }}>
                                Select All Unmigrated Users
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {(viewingDomain.federated === 'Yes' || viewingDomain.collaborationType === 'OTP') && (
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10">Select</th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User Email</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Application</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Environment</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">MFA Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {getDomainUsers(viewingDomain.domain).map((user, i) => {
                            const isMigrated = (viewingDomain.migratedUsers || []).includes(user.email);
                            const isChecked = detailsSelectedUsers.includes(user.email);
                            const latestUserLogin = ssoLoginRecords.find(r => r.email.toLowerCase() === user.email.toLowerCase());
                            
                            return (
                              <tr key={i} className="hover:bg-gray-50">
                                {(viewingDomain.federated === 'Yes' || viewingDomain.collaborationType === 'OTP') && (
                                  <td className="px-4 py-3 text-sm align-middle">
                                    {isMigrated ? (
                                      <div className="flex items-center justify-center text-green-600 font-bold">
                                        ✓
                                      </div>
                                    ) : (
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setDetailsSelectedUsers(prev => prev.filter(email => email !== user.email));
                                          } else {
                                            setDetailsSelectedUsers(prev => [...prev, user.email]);
                                          }
                                        }}
                                        className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-4 w-4 cursor-pointer"
                                      />
                                    )}
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm text-gray-800 font-medium align-middle">{user.email}</td>
                                <td className="px-4 py-3 text-sm align-middle">
                                  <div className="flex flex-col gap-1">
                                    {user.applications && Array.isArray(user.applications) && user.applications.map((app, j) => (
                                      <div key={j} className="text-xs text-gray-700">{app.name}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm align-middle">
                                  <div className="flex flex-col gap-1">
                                    {user.applications && Array.isArray(user.applications) && user.applications.map((app, j) => (
                                      <div key={j} className="text-xs font-medium text-gray-600">{app.environment}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-700 font-mono align-middle">{latestUserLogin ? latestUserLogin.lastLoginTimestamp : user.lastLogin}</td>
                                <td className="px-4 py-3 text-xs align-middle">
                                  {viewingDomain.federated === 'No' ? (
                                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                                      Non-Fed (N/A)
                                    </span>
                                  ) : isMigrated ? (
                                    <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-bold">
                                      Migrated ({viewingDomain.collaborationType})
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-bold">
                                      Pending Migration
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs align-middle text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingDomain(null);
                                      setMfaTargetEmail(user.email);
                                      setActiveView('mfa-reset');
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                                    title={`Reset MFA for ${user.email}`}
                                  >
                                    <RotateCcw size={12} />
                                    Reset MFA
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button onClick={() => { setViewingDomain(null); setActiveDetailsTab('config'); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Domain */}
      <AnimatePresence>
        {editingDomain && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDomain(null)}
              className="fixed inset-0 bg-black/50"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-xl z-10 p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold text-gray-800 mr-2">Edit Domain</h2>
                  <StatusBadge status={editingDomain.status} />
                </div>
                <button onClick={() => setEditingDomain(null)} className="text-gray-400 hover:text-gray-800 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdateDomain} className="space-y-4">
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium mb-3 text-gray-600">Domain Status</label>
                  <div className="flex items-center">
                    <span className="mr-3 text-sm text-gray-500 font-medium">Disable</span>
                    <button 
                      type="button"
                      onClick={() => setEditingDomain({...editingDomain, status: editingDomain.status === 'Enabled' ? 'Disabled' : 'Enabled'})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${editingDomain.status === 'Enabled' ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingDomain.status === 'Enabled' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="ml-3 text-sm text-gray-500 font-medium">Enable</span>
                    <input type="hidden" name="status" checked={editingDomain.status === 'Enabled'} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Domain Name</label>
                    <input type="text" readOnly value={editingDomain.domain} className="w-full form-input-light read-only-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Federated</label>
                    <input type="text" readOnly value={editingDomain.federated} className="w-full form-input-light read-only-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Collaboration Type</label>
                    <select 
                      name="collaborationType" 
                      required
                      className="w-full form-input-light"
                      value={editCollaborationType}
                      onChange={(e) => {
                        const val = e.target.value as 'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED' | '';
                        setEditCollaborationType(val);
                        if (val !== 'SAML') setEditSamlId('');
                        if (val === 'OTP') {
                          setEditMfaStatus('Disabled');
                        } else if (val === 'ENTRA_NON_FED') {
                          if (editMfaStatus === 'Disabled') {
                            setEditMfaStatus('Enabled');
                            setEditInfosecTicket('');
                          }
                        }
                      }}
                    >
                      {editingDomain.federated === 'No' ? (
                        <>
                          <option value="ENTRA_NON_FED">ENTRA_NON_FED</option>
                          <option value="OTP">OTP</option>
                        </>
                      ) : (
                        <>
                          {editingDomain.collaborationType === 'B2B' && <option value="B2B">B2B (Legacy)</option>}
                          <option value="SAML">SAML</option>
                          <option value="OTP">OTP</option>
                          <option value="ENTRA_FED">ENTRA_FED</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">SAML Registration ID</label>
                    <input 
                      name="samlRegistrationId" 
                      type="text" 
                      required={editCollaborationType === 'SAML'}
                      disabled={editCollaborationType !== 'SAML'}
                      placeholder={editCollaborationType === 'SAML' ? "Enter SAML ID" : editCollaborationType === 'OTP' ? "N/A (Disabled for OTP)" : "N/A"}
                      className={`w-full form-input-light ${editCollaborationType !== 'SAML' ? 'read-only-input' : ''}`}
                      value={editSamlId}
                      onChange={(e) => setEditSamlId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">SSOOB Ticket Reference</label>
                    <input type="text" readOnly value={editingDomain.ssoobTicket || 'N/A'} className="w-full form-input-light read-only-input" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-600">MFA Status</label>
                      {editCollaborationType === 'OTP' && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock size={10} className="text-amber-600" />
                          Disabled (OTP)
                        </span>
                      )}
                    </div>
                    {editCollaborationType === 'OTP' ? (
                      <>
                        <input type="hidden" name="mfaStatus" value="Disabled" />
                        <select 
                          disabled 
                          className="w-full form-input-light read-only-input bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                          value="Disabled"
                        >
                          <option value="Disabled">Disabled</option>
                        </select>
                      </>
                    ) : (
                      <select 
                        name="mfaStatus" 
                        value={editMfaStatus} 
                        onChange={(e) => {
                          const val = e.target.value as 'Enabled' | 'Disabled';
                          setEditMfaStatus(val);
                          if (val === 'Enabled') setEditInfosecTicket('');
                        }}
                        required 
                        className="w-full form-input-light"
                      >
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-600">
                        Infosec Ticket Reference 
                        {editMfaStatus === 'Disabled' && editCollaborationType !== 'OTP' && <span className="text-red-500">*</span>}
                        {editCollaborationType === 'OTP' && <span className="text-gray-400 font-normal text-xs ml-1">(Optional)</span>}
                      </label>
                    </div>
                    <input 
                      name="infosecTicket" 
                      type="text" 
                      required={editMfaStatus === 'Disabled' && editCollaborationType !== 'OTP'}
                      disabled={editMfaStatus !== 'Disabled' && editCollaborationType !== 'OTP'}
                      placeholder={
                        editCollaborationType === 'OTP' 
                          ? "e.g., INFOSEC-1234 (optional if available)" 
                          : editMfaStatus === 'Disabled' 
                          ? "e.g., INFOSEC-1234" 
                          : "N/A"
                      }
                      className={`w-full form-input-light ${
                        editMfaStatus !== 'Disabled' && editCollaborationType !== 'OTP' 
                          ? 'read-only-input' 
                          : ''
                      }`}
                      value={editInfosecTicket}
                      onChange={(e) => setEditInfosecTicket(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <IpWhitelistManager 
                    ips={editWhitelistedIps} 
                    onChange={setEditWhitelistedIps} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Registered By</label>
                    <input type="text" readOnly value={editingDomain.registeredBy} className="w-full form-input-light read-only-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Registered On</label>
                    <input type="text" readOnly value={editingDomain.registeredOn} className="w-full form-input-light read-only-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Updated By</label>
                    <input type="text" readOnly value={currentUser.email} className="w-full form-input-light read-only-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Updated On</label>
                    <input type="text" readOnly value={getFormattedDate()} className="w-full form-input-light read-only-input" />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200 space-x-3">
                  <button type="button" onClick={() => setEditingDomain(null)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400">Cancel</button>
                  <button type="submit" className="accent-button">Update Domain</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View Request */}
      <AnimatePresence>
        {viewingRequest && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingRequest(null)}
              className="fixed inset-0 bg-black/50"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Pending Request Details</h2>
                <button onClick={() => setViewingRequest(null)} className="text-gray-400 hover:text-gray-800 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Request ID</p>
                    <p className="text-base font-semibold text-gray-800">{viewingRequest.requestId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Domain</p>
                    <p className="text-base font-semibold text-gray-800">{viewingRequest.domainName}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Operation</p>
                    <p className="text-base font-semibold text-gray-800">{viewingRequest.operation}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Type</p>
                    <p className="text-base font-semibold text-gray-800">{viewingRequest.operationType}</p>
                  </div>
                </div>

                <div className="pb-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Payload Details</p>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-1">
                    {Object.entries(viewingRequest.payload).map(([key, val]) => (
                      <p key={key}>
                        <span className="font-medium capitalize">{key}:</span> {Array.isArray(val) ? (val.length > 0 ? val.join(', ') : '(None)') : String(val)}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Initiated By</p>
                    <p className="text-base font-semibold text-gray-800">{viewingRequest.initiatedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Initiated On</p>
                    <p className="text-base font-semibold text-gray-800">{viewingRequest.initiatedOn}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button onClick={() => approveRequest(viewingRequest.requestId)} className="accent-button">Approve</button>
                  <button onClick={() => rejectRequest(viewingRequest.requestId)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-400">Reject</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sliding Drawer: Domain and User Migration */}
      <AnimatePresence>
        {isMigrationDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMigrationDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Sliding Panel */}
            <div className="fixed inset-y-0 right-0 max-w-4xl w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-4xl bg-slate-50 flex flex-col shadow-2xl border-l border-gray-200"
              >
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">Active Journey</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mt-1">Domain & User Migration</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Convert domain authentication and migrate users in a single unified process.</p>
                  </div>
                  <button 
                    onClick={() => setIsMigrationDrawerOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all shadow-xs"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Search for domain screen if not loaded yet */}
                  {!migrationResult ? (
                    <div className="space-y-6 py-6 max-w-xl mx-auto">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                          <ArrowLeftRight size={32} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Enter Domain Name</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                          Search for a registered domain in our system to view its current federation status and start its migration.
                        </p>
                      </div>

                      <form onSubmit={handleMigrationSearch} className="space-y-4">
                        <div className="relative rounded-lg shadow-sm">
                          <input 
                            type="text" 
                            required 
                            placeholder="Search registered domain (e.g., traiana.com, abc.com, osttra.com)..." 
                            className="w-full form-input-light pl-4 pr-24 py-3.5 text-sm rounded-lg animate-none"
                            value={migrationDomain}
                            onChange={(e) => setMigrationDomain(e.target.value)}
                          />
                          <button 
                            type="submit" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-md transition-colors shadow-xs"
                          >
                            Fetch
                          </button>
                        </div>
                      </form>

                      {/* Quick links to sample domains */}
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Domains Quick Access</p>
                        <div className="grid grid-cols-2 gap-2">
                          {domainData.slice(0, 4).map((d) => (
                            <button
                              key={d.id}
                              onClick={() => {
                                setMigrationDomain(d.domain);
                                // We call fetch manually
                                setMigrationResult(d);
                                const isNonFed = d.federated === 'No' || d.collaborationType === 'ENTRA_NON_FED' || d.collaborationType === 'OTP' || !d.collaborationType;
                                const isEntraFed = d.federated === 'Yes' && d.collaborationType === 'ENTRA_FED';
                                if (isNonFed) {
                                  setMigrationCollaborationType(d.collaborationType === 'OTP' ? 'ENTRA_FED' : 'OTP');
                                } else if (isEntraFed) {
                                  setMigrationCollaborationType('SAML');
                                } else {
                                  setMigrationCollaborationType('ENTRA_FED');
                                }
                                setMigrationSamlId('');
                                const users = getDomainUsers(d.domain);
                                setMigrationUsers(users);
                                setSelectedMigrationUsers(users.map(u => u.user));
                                setMigrationUserFilters({ user: '', application: '', status: 'All' });
                                setMigrateUsersEnabled(true);
                                setMigrateDomainEnabled(true);
                                setMigrationStep(1);
                                setUserCurrentPage(1);
                              }}
                              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/20 text-left transition-all group shadow-xxs"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-gray-800 truncate group-hover:text-emerald-950">{d.domain}</p>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">{d.federated === 'Yes' ? 'Federated' : 'Non-fed'}</p>
                              </div>
                              <span className="text-xs text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">→</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Active domain summary banner */}
                      <div className="bg-emerald-950 text-emerald-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-emerald-900">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Current Domain in Journey</p>
                          <h4 className="text-lg font-extrabold text-white mt-0.5">{migrationResult.domain}</h4>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setMigrationResult(null);
                              setMigrationDomain('');
                            }}
                            className="bg-emerald-900 hover:bg-emerald-850 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors border border-emerald-800"
                          >
                            Change Domain
                          </button>
                        </div>
                      </div>

                      {/* PART 1 Content: Domain Settings */}
                      <div className="space-y-6">
                        {/* Toggle domain migration */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-gray-900">Migrate Domain Configuration</h4>
                              <p className="text-xs text-gray-500">Enable this if you wish to change the primary authentication system of the domain itself.</p>
                            </div>
                            <div className="flex items-center">
                              <button 
                                onClick={() => setMigrateDomainEnabled(!migrateDomainEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${migrateDomainEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${migrateDomainEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>
                          </div>

                          {migrateDomainEnabled && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Collaboration Type</label>
                                  {(() => {
                                    const isResultNonFed = migrationResult.federated === 'No' || migrationResult.collaborationType === 'ENTRA_NON_FED' || migrationResult.collaborationType === 'OTP' || !domainData.find(dm => dm.id === migrationResult.id)?.collaborationType;
                                    const isResultEntraFed = migrationResult.federated === 'Yes' && migrationResult.collaborationType === 'ENTRA_FED';
                                    const isResultSamlFed = migrationResult.federated === 'Yes' && migrationResult.collaborationType === 'SAML';

                                    const targetOptions: { value: 'OTP' | 'ENTRA_FED' | 'SAML' | 'ENTRA_NON_FED'; label: string }[] = [];
                                    if (isResultNonFed) {
                                      targetOptions.push({ value: 'OTP', label: 'OTP (Email One-Time Passcode)' });
                                      targetOptions.push({ value: 'ENTRA_FED', label: 'Entra Federated (ENTRA_FED)' });
                                      targetOptions.push({ value: 'SAML', label: 'SAML Federated (SAML)' });
                                      if (migrationResult.collaborationType === 'OTP') {
                                        targetOptions.push({ value: 'ENTRA_NON_FED', label: 'Non-Federated (ENTRA_NON_FED)' });
                                      }
                                    } else if (isResultEntraFed) {
                                      targetOptions.push({ value: 'OTP', label: 'OTP (Email One-Time Passcode)' });
                                      targetOptions.push({ value: 'ENTRA_NON_FED', label: 'Non-Federated (ENTRA_NON_FED)' });
                                      targetOptions.push({ value: 'SAML', label: 'SAML Federated (SAML)' });
                                    } else if (isResultSamlFed) {
                                      targetOptions.push({ value: 'OTP', label: 'OTP (Email One-Time Passcode)' });
                                      targetOptions.push({ value: 'ENTRA_FED', label: 'Entra Federated (ENTRA_FED)' });
                                      targetOptions.push({ value: 'ENTRA_NON_FED', label: 'Non-Federated (ENTRA_NON_FED)' });
                                    } else {
                                      targetOptions.push({ value: 'OTP', label: 'OTP (Email One-Time Passcode)' });
                                      targetOptions.push({ value: 'ENTRA_FED', label: 'Entra Federated (ENTRA_FED)' });
                                      targetOptions.push({ value: 'SAML', label: 'SAML Federated (SAML)' });
                                      targetOptions.push({ value: 'ENTRA_NON_FED', label: 'Non-Federated (ENTRA_NON_FED)' });
                                    }

                                    return (
                                      <select 
                                        className="w-full form-input-light text-xs rounded-md py-2.5"
                                        value={migrationCollaborationType}
                                        onChange={(e) => {
                                          const val = e.target.value as 'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED';
                                          setMigrationCollaborationType(val);
                                          if (val !== 'SAML') setMigrationSamlId('');
                                        }}
                                      >
                                        {targetOptions.map((opt) => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                    );
                                  })()}
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    SAML Registration ID {migrationCollaborationType === 'SAML' && <span className="text-red-500">*</span>}
                                    {migrationCollaborationType === 'OTP' && <span className="text-gray-400 font-normal text-[11px] ml-1">(Disabled for OTP)</span>}
                                  </label>
                                  <input 
                                    type="text" 
                                    disabled={migrationCollaborationType !== 'SAML'}
                                    placeholder={migrationCollaborationType === 'SAML' ? "e.g. SAML-REG-ID-12345" : migrationCollaborationType === 'OTP' ? "N/A (Disabled for OTP)" : "N/A (SAML not selected)"}
                                    className={`w-full form-input-light text-xs rounded-md py-2.5 ${migrationCollaborationType !== 'SAML' ? 'read-only-input' : ''}`}
                                    value={migrationSamlId}
                                    onChange={(e) => setMigrationSamlId(e.target.value)}
                                  />
                                </div>

                                {migrationCollaborationType === 'OTP' && (
                                  <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                                    <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-amber-950">One-Time Passcode (OTP) Migration Parameters:</span>
                                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">Non-Fed Mode</span>
                                      </div>
                                      <p className="text-xxs text-amber-800 leading-relaxed font-semibold">
                                        The domain will operate under Non-Federated guest authentication (<span className="font-mono">federated: No</span>). MFA is automatically disabled and non-editable as users authenticate directly via single-use email verification tokens. Corporate IP whitelisting below can be configured to restrict OTP authorization.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Whitelisted IPs Manager */}
                              <div className="pt-3 border-t border-gray-100">
                                <IpWhitelistManager 
                                  ips={migrationWhitelistedIps} 
                                  onChange={setMigrationWhitelistedIps} 
                                  title="Domain Whitelisted IPs" 
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Dynamic Use Case Helper banner */}
                        {migrateDomainEnabled && (() => {
                          const isResultNonFed = migrationResult.federated === 'No' || migrationResult.collaborationType === 'ENTRA_NON_FED' || migrationResult.collaborationType === 'OTP' || !migrationResult.collaborationType;
                          const isResultEntraFed = migrationResult.federated === 'Yes' && migrationResult.collaborationType === 'ENTRA_FED';
                          const isResultSamlFed = migrationResult.federated === 'Yes' && migrationResult.collaborationType === 'SAML';

                          let useCaseTitle = '';
                          let useCaseDesc = '';

                          if (isResultNonFed) {
                            if (migrationCollaborationType === 'OTP') {
                              useCaseTitle = 'Use Case: From Non-Fed to OTP (Email One-Time Passcode)';
                              useCaseDesc = 'Migrate a standard non-federated domain to OTP (One-Time Passcode) guest access. MFA enforcement is disabled for OTP, and SAML ID is not required. IP whitelisting can be set up below.';
                            } else if (migrationCollaborationType === 'ENTRA_FED') {
                              useCaseTitle = 'Use Case 1: From Non-fed to Entra Fed';
                              useCaseDesc = 'Migrate a standard non-federated domain to Entra Federated (ENTRA_FED) authentication.';
                            } else if (migrationCollaborationType === 'SAML') {
                              useCaseTitle = 'Use Case 2: From Non-fed to SAML Fed';
                              useCaseDesc = 'Migrate a standard non-federated domain to SAML Federated (SAML) authentication. A SAML Registration ID must be provided.';
                            }
                          } else if (isResultEntraFed) {
                            if (migrationCollaborationType === 'OTP') {
                              useCaseTitle = 'Use Case: From Entra Fed to OTP';
                              useCaseDesc = 'Convert the Entra Federated domain to Non-Federated OTP (Email One-Time Passcode) authentication.';
                            } else if (migrationCollaborationType === 'ENTRA_NON_FED') {
                              useCaseTitle = 'Use Case 3: From Entra Fed to No Fed';
                              useCaseDesc = 'Convert the Entra Federated domain back to a standard Non-Federated (ENTRA_NON_FED) authentication style.';
                            } else if (migrationCollaborationType === 'SAML') {
                              useCaseTitle = 'Use Case 4: From Entra Fed to SAML Fed';
                              useCaseDesc = 'Transition the domain from Entra Federated to SAML Federated (SAML) authentication. A SAML Registration ID must be provided.';
                            }
                          } else if (isResultSamlFed) {
                            if (migrationCollaborationType === 'OTP') {
                              useCaseTitle = 'Use Case: From SAML Fed to OTP';
                              useCaseDesc = 'Convert the SAML Federated domain to Non-Federated OTP (Email One-Time Passcode) authentication.';
                            } else if (migrationCollaborationType === 'ENTRA_FED') {
                              useCaseTitle = 'Use Case 5: From SAML Fed to Entra Fed';
                              useCaseDesc = 'Transition the domain from SAML Federated to Entra Federated (ENTRA_FED) authentication.';
                            } else if (migrationCollaborationType === 'ENTRA_NON_FED') {
                              useCaseTitle = 'Use Case 6: From SAML Fed to Non Fed';
                              useCaseDesc = 'Convert the SAML Federated domain back to a standard Non-Federated (ENTRA_NON_FED) authentication style.';
                            }
                          }

                          if (!useCaseTitle) return null;

                          return (
                            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start space-x-3 shadow-xxs">
                              <Info size={18} className="text-teal-700 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-extrabold text-teal-950 uppercase tracking-wide">{useCaseTitle}</p>
                                <p className="text-xxs text-teal-800 mt-1 leading-relaxed font-semibold">{useCaseDesc}</p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Domain Status Visualizer */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Authentication State Comparison</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Current */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xxs">
                              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Current State</p>
                              <div className="space-y-2 mt-3 text-xs text-gray-700">
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                  <span className="text-gray-400 font-semibold">Federation</span>
                                  <span className="font-extrabold text-gray-900">{migrationResult.federated === 'Yes' ? 'Federated' : 'Non-Federated'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                  <span className="text-gray-400 font-semibold">Collaboration</span>
                                  <span className="font-mono bg-gray-50 border border-gray-150 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700">
                                    {migrationResult.collaborationType || 'ENTRA_NON_FED'}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                  <span className="text-gray-400 font-semibold">MFA Status</span>
                                  <span className="text-[11px] font-semibold text-gray-700">
                                    {migrationResult.mfaStatus || 'Disabled'}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-gray-400 font-semibold">SAML Reg ID</span>
                                  <span className="font-mono text-[10px] font-semibold text-gray-600">
                                    {migrationResult.samlRegistrationId || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Target */}
                            <div className={`border rounded-xl p-4 shadow-xxs transition-all ${
                              migrateDomainEnabled 
                                ? 'bg-emerald-50/40 border-emerald-200' 
                                : 'bg-gray-100/50 border-gray-200 opacity-60'
                            }`}>
                              <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Target State</p>
                              {migrateDomainEnabled ? (
                                <div className="space-y-2 mt-3 text-xs text-emerald-950">
                                  <div className="flex justify-between py-1 border-b border-emerald-100/60">
                                    <span className="text-emerald-700/70 font-semibold">Federation</span>
                                    <span className="font-extrabold text-emerald-950">
                                      {migrationCollaborationType === 'ENTRA_NON_FED' || migrationCollaborationType === 'OTP' ? 'Non-Federated' : 'Federated'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-1 border-b border-emerald-100/60">
                                    <span className="text-emerald-700/70 font-semibold">Collaboration</span>
                                    <span className="font-mono bg-emerald-100/60 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-extrabold text-emerald-900">
                                      {migrationCollaborationType}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-1 border-b border-emerald-100/60">
                                    <span className="text-emerald-700/70 font-semibold">MFA Status</span>
                                    <span className="font-semibold text-[11px] text-emerald-900">
                                      {migrationCollaborationType === 'OTP' ? 'Disabled (Non-editable for OTP)' : (migrationCollaborationType === 'ENTRA_NON_FED' ? 'Disabled' : 'Enabled')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-1">
                                    <span className="text-emerald-700/70 font-semibold">SAML Reg ID</span>
                                    <span className="font-mono text-[10px] font-extrabold text-emerald-900">
                                      {migrationCollaborationType === 'SAML' 
                                        ? (migrationSamlId.trim() || 'Required') 
                                        : 'N/A (Disabled)'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <p className="text-xs text-gray-400 italic">Domain config migration is disabled. Current state will remain unchanged.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PART 2 Content: User Migration Settings */}
                      <div className="space-y-6 pt-4 border-t border-gray-200">
                        {/* Enable user migration toggle */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-gray-900">Enable User Migration</h4>
                              <p className="text-xs text-gray-500">Enable this if you wish to migrate users mapped to this domain during this journey.</p>
                            </div>
                            <div className="flex items-center">
                              <button 
                                onClick={() => setMigrateUsersEnabled(!migrateUsersEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${migrateUsersEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${migrateUsersEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {migrateUsersEnabled && (
                          <div className="space-y-4 animate-fadeIn">
                            {migrationUsers.length > 0 ? (
                              <div className="space-y-3">
                                {/* Filter and selection toolbar */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xxs space-y-3">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input 
                                        type="checkbox" 
                                        checked={filteredMigrationUsers.length > 0 && filteredMigrationUsers.every(u => selectedMigrationUsers.includes(u.user))}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            const filteredEmails = filteredMigrationUsers.map(u => u.user);
                                            setSelectedMigrationUsers(prev => Array.from(new Set([...prev, ...filteredEmails])));
                                          } else {
                                            const filteredEmails = filteredMigrationUsers.map(u => u.user);
                                            setSelectedMigrationUsers(prev => prev.filter(email => !filteredEmails.includes(email)));
                                          }
                                        }}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                        id="drawerSelectAll"
                                      />
                                      <label htmlFor="drawerSelectAll" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                                        Select all visible
                                      </label>
                                    </div>
                                    <div className="text-xs font-extrabold text-gray-500">
                                      Selected: <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{selectedMigrationUsers.length} of {migrationUsers.length}</span>
                                    </div>
                                  </div>

                                  {/* Advanced filter row */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3 border-t border-gray-100">
                                    <div className="relative">
                                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                      <input 
                                        type="text" 
                                        className="w-full text-xxs border border-gray-300 rounded pl-7 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50" 
                                        placeholder="Search email..." 
                                        value={migrationUserFilters.user}
                                        onChange={e => {
                                          setMigrationUserFilters({ ...migrationUserFilters, user: e.target.value });
                                          setUserCurrentPage(1);
                                        }}
                                      />
                                    </div>
                                    <div className="relative">
                                      <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                      <input 
                                        type="text" 
                                        className="w-full text-xxs border border-gray-300 rounded pl-7 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50" 
                                        placeholder="Search applications..." 
                                        value={migrationUserFilters.application}
                                        onChange={e => {
                                          setMigrationUserFilters({ ...migrationUserFilters, application: e.target.value });
                                          setUserCurrentPage(1);
                                        }}
                                      />
                                    </div>
                                    <div className="relative">
                                      <select
                                        className="w-full text-xxs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-semibold text-gray-600"
                                        value={migrationUserFilters.status}
                                        onChange={e => {
                                          setMigrationUserFilters({ ...migrationUserFilters, status: e.target.value });
                                          setUserCurrentPage(1);
                                        }}
                                      >
                                        <option value="All">All Statuses</option>
                                        <option value="Migrated">Migrated Only</option>
                                        <option value="Non-migrated">Non-migrated Only</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {/* Custom Table with Paginated User List */}
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xxs">
                                  <table className="min-w-full divide-y divide-gray-150">
                                    <thead className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left border-b border-gray-200">
                                      <tr>
                                        <th className="p-3 w-10">Select</th>
                                        <th className="p-3">User & Mapping Apps</th>
                                        <th className="p-3 text-right">Target state</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                      {(() => {
                                        const startIndex = (userCurrentPage - 1) * userPageSize;
                                        const paginatedUsers = filteredMigrationUsers.slice(startIndex, startIndex + userPageSize);
                                        
                                        if (paginatedUsers.length === 0) {
                                          return (
                                            <tr>
                                              <td colSpan={3} className="text-center text-gray-400 p-8">No users found matching current filters.</td>
                                            </tr>
                                          );
                                        }

                                        return paginatedUsers.map((u, i) => {
                                          const isChecked = selectedMigrationUsers.includes(u.user);
                                          const alreadyMigrated = (migrationResult.migratedUsers || []).includes(u.user);
                                          
                                          let targetStateLabel = '';
                                          let targetBadgeClass = '';

                                          if (alreadyMigrated) {
                                            targetStateLabel = 'Migrated';
                                            targetBadgeClass = 'text-green-700 bg-green-50 border-green-200';
                                          } else if (isChecked) {
                                            const targetType = migrateDomainEnabled ? migrationCollaborationType : (migrationResult.collaborationType || 'ENTRA_FED');
                                            targetStateLabel = `Target: ${targetType}`;
                                            targetBadgeClass = targetType === 'OTP'
                                              ? 'text-amber-800 bg-amber-50 border-amber-300 font-extrabold'
                                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 font-extrabold';
                                          } else {
                                            targetStateLabel = 'Non-migrated';
                                            targetBadgeClass = 'text-gray-500 bg-slate-100 border-gray-200';
                                          }

                                          return (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                              <td className="p-3 text-center">
                                                <input 
                                                  type="checkbox" 
                                                  checked={isChecked}
                                                  onChange={() => {
                                                    if (isChecked) {
                                                      setSelectedMigrationUsers(prev => prev.filter(email => email !== u.user));
                                                    } else {
                                                      setSelectedMigrationUsers(prev => [...prev, u.user]);
                                                    }
                                                  }}
                                                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                                />
                                              </td>
                                              <td className="p-3">
                                                <div className="font-extrabold text-gray-800">{u.user}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 font-semibold">Applications: {u.applications}</div>
                                              </td>
                                              <td className="p-3 text-right">
                                                <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${targetBadgeClass}`}>
                                                  {targetStateLabel}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        });
                                      })()}
                                    </tbody>
                                  </table>

                                  {/* Pagination Controls */}
                                  {filteredMigrationUsers.length > 0 && (
                                    <div className="bg-slate-50 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Page size:</span>
                                        <select
                                          className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                          value={userPageSize}
                                          onChange={(e) => {
                                            setUserPageSize(Number(e.target.value));
                                            setUserCurrentPage(1);
                                          }}
                                        >
                                          <option value={5}>Show 5</option>
                                          <option value={10}>Show 10</option>
                                          <option value={20}>Show 20</option>
                                        </select>
                                      </div>

                                      <div className="flex items-center space-x-4">
                                        <span className="text-[10px] text-gray-500 font-bold">
                                          {(() => {
                                            const start = (userCurrentPage - 1) * userPageSize + 1;
                                            const end = Math.min(userCurrentPage * userPageSize, filteredMigrationUsers.length);
                                            return `Showing ${start}-${end} of ${filteredMigrationUsers.length}`;
                                          })()}
                                        </span>

                                        <div className="flex space-x-1.5">
                                          <button
                                            onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={userCurrentPage === 1}
                                            className="p-1 border border-gray-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            title="Previous Page"
                                          >
                                            <ChevronLeft size={14} className="text-gray-600" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              const totalPages = Math.ceil(filteredMigrationUsers.length / userPageSize);
                                              setUserCurrentPage(prev => Math.min(prev + 1, totalPages));
                                            }}
                                            disabled={userCurrentPage >= Math.ceil(filteredMigrationUsers.length / userPageSize)}
                                            className="p-1 border border-gray-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            title="Next Page"
                                          >
                                            <ChevronRight size={14} className="text-gray-600" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 text-xs rounded-xl flex items-start space-x-3">
                                <Info size={16} className="text-yellow-700 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-extrabold uppercase tracking-wide text-yellow-950">Warning: No mapped users</p>
                                  <p className="font-semibold text-yellow-900 mt-1">This domain does not have any currently registered SSO users. Migration will proceed with domain configuration only.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!migrateUsersEnabled && (
                          <div className="p-4 border border-amber-200 bg-amber-50 text-amber-800 text-xs rounded-xl flex items-start space-x-3">
                            <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-extrabold uppercase tracking-wide text-amber-950">User Migration Deferred</p>
                              <p className="font-semibold text-amber-900 mt-1">
                                You have chosen to migrate the domain first, leaving the mapped users unmigrated. You can migrate users to the target state individually or in bulk later.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <button 
                      onClick={() => setIsMigrationDrawerOpen(false)}
                      className="text-xs font-bold text-gray-500 hover:text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-all border border-transparent"
                    >
                      Cancel Journey
                    </button>
                  </div>

                  {migrationResult && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => performMigration(migrationResult)}
                        disabled={!migrateDomainEnabled && !migrateUsersEnabled}
                        className={`flex items-center text-xs font-extrabold text-white bg-emerald-600 px-5 py-2.5 rounded-md hover:bg-emerald-700 shadow-sm transition-all ${
                          (!migrateDomainEnabled && !migrateUsersEnabled) ? 'opacity-40 cursor-not-allowed bg-gray-400' : ''
                        }`}
                      >
                        Execute Migration
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Log Modal & Compare View */}
      {viewingAuditDomain && (
        <AuditLogModal 
          domain={viewingAuditDomain}
          auditRecords={auditLogs}
          onClose={() => setViewingAuditDomain(null)}
        />
      )}
    </div>
  );
}
