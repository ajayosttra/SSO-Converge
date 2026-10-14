import { UserEmailSyncRequest, AppEmailSyncDetail, EmailSyncOverallStatus, AppSyncStatus } from '../types';

const EMAIL_SYNC_STORAGE_KEY = 'sso_converge_email_sync_requests_v1';

export const INITIAL_EMAIL_SYNC_REQUESTS: UserEmailSyncRequest[] = [
  {
    id: 'EML-REQ-2026-901',
    initiatingSystem: 'CRDS (Central Reference Data)',
    ticketReference: 'CRDS-SYNC-84920',
    initiatedByEmail: 'crds.admin@osttra.com',
    userId: 'USR-OST-9921',
    userName: 'Alex Taylor',
    oldEmail: 'alex.taylor@osttra.com',
    newEmail: 'alex.taylor@spglobal.com',
    domain: 'osttra.com',
    requestedAt: '14-10-2026 10:15:30 (UTC)',
    overallStatus: 'PARTIALLY_FAILED',
    ssoDirectoryUpdated: true,
    retryCount: 0,
    notes: 'Corporate rebranding email update requested via CRDS automation pipeline.',
    applications: [
      {
        applicationName: 'CFD',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 10:15:32 (UTC)',
        acknowledgedTimestamp: '14-10-2026 10:15:35 (UTC)',
        responseCode: 200,
        responseMessage: 'SCIM User account updated: Email changed from alex.taylor@osttra.com to alex.taylor@spglobal.com',
        payloadTraceId: 'TRC-CFD-991201'
      },
      {
        applicationName: 'CRDS',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 10:15:32 (UTC)',
        acknowledgedTimestamp: '14-10-2026 10:15:34 (UTC)',
        responseCode: 200,
        responseMessage: 'Master contact record synchronized in CRDS core relational store.',
        payloadTraceId: 'TRC-CRDS-884102'
      },
      {
        applicationName: 'TradeServ',
        environment: 'PROD',
        status: 'FAILED',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 10:15:32 (UTC)',
        responseCode: 504,
        responseMessage: 'Gateway Timeout (504)',
        failureReason: 'Downstream TradeServ SCIM endpoint timed out after 30000ms. Service unreachable via direct gateway route.',
        payloadTraceId: 'TRC-TS-772193'
      },
      {
        applicationName: 'MarkitWire',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 10:15:32 (UTC)',
        acknowledgedTimestamp: '14-10-2026 10:15:38 (UTC)',
        responseCode: 200,
        responseMessage: 'Participant mapping updated in MarkitWire User Registry.',
        payloadTraceId: 'TRC-MW-661284'
      }
    ]
  },
  {
    id: 'EML-REQ-2026-902',
    initiatingSystem: 'Active Directory / Entra ID Federation',
    ticketReference: 'CHG-2026-5512',
    initiatedByEmail: 'aad.sync.service@jpmorgan.com',
    userId: 'USR-JPM-4412',
    userName: 'Jane Smith',
    oldEmail: 'jane.smith@jpmorgan.com',
    newEmail: 'jane.smith-co@jpmorgan.com',
    domain: 'jpmorgan.com',
    requestedAt: '14-10-2026 09:20:10 (UTC)',
    completedAt: '14-10-2026 09:20:25 (UTC)',
    overallStatus: 'COMPLETED',
    ssoDirectoryUpdated: true,
    retryCount: 0,
    notes: 'Federated UPN change propagated after organizational restructuring.',
    applications: [
      {
        applicationName: 'TradeServ',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 09:20:11 (UTC)',
        acknowledgedTimestamp: '14-10-2026 09:20:16 (UTC)',
        responseCode: 200,
        responseMessage: 'User principal name successfully updated in TradeServ.',
        payloadTraceId: 'TRC-TS-550172'
      },
      {
        applicationName: 'FX Connect',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 09:20:11 (UTC)',
        acknowledgedTimestamp: '14-10-2026 09:20:19 (UTC)',
        responseCode: 200,
        responseMessage: 'Trader desk identity re-bound to new email address.',
        payloadTraceId: 'TRC-FXC-449163'
      },
      {
        applicationName: 'CRDS',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 09:20:11 (UTC)',
        acknowledgedTimestamp: '14-10-2026 09:20:14 (UTC)',
        responseCode: 200,
        responseMessage: 'CRDS entity synchronized.',
        payloadTraceId: 'TRC-CRDS-338154'
      }
    ]
  },
  {
    id: 'EML-REQ-2026-903',
    initiatingSystem: 'Service Management (ServiceNow)',
    ticketReference: 'INC-SSO-77291',
    initiatedByEmail: 'servicedesk.agent@traiana.com',
    userId: 'USR-TRN-3301',
    userName: 'Sarah Jenkins',
    oldEmail: 'sarah.jenkins@traiana.com',
    newEmail: 'sarah.j@traiana.com',
    domain: 'traiana.com',
    requestedAt: '14-10-2026 08:45:00 (UTC)',
    overallStatus: 'PARTIALLY_FAILED',
    ssoDirectoryUpdated: true,
    retryCount: 0,
    notes: 'Manual name correction ticket submitted via Helpdesk.',
    applications: [
      {
        applicationName: 'Traiana Harmony',
        environment: 'PROD',
        status: 'FAILED',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 08:45:02 (UTC)',
        responseCode: 409,
        responseMessage: 'Conflict (409)',
        failureReason: 'Target user record in Traiana Harmony is currently locked by active settlement batch processing. Retry after queue drain.',
        payloadTraceId: 'TRC-TRN-227145'
      },
      {
        applicationName: 'CFD',
        environment: 'UAT',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 08:45:02 (UTC)',
        acknowledgedTimestamp: '14-10-2026 08:45:06 (UTC)',
        responseCode: 200,
        responseMessage: 'CFD UAT test user identity updated.',
        payloadTraceId: 'TRC-CFD-116136'
      },
      {
        applicationName: 'TradeServ',
        environment: 'UAT',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 08:45:02 (UTC)',
        acknowledgedTimestamp: '14-10-2026 08:45:08 (UTC)',
        responseCode: 200,
        responseMessage: 'TradeServ UAT entity updated.',
        payloadTraceId: 'TRC-TS-005127'
      }
    ]
  },
  {
    id: 'EML-REQ-2026-904',
    initiatingSystem: 'Workday HCM Webhook',
    ticketReference: 'HR-SYNC-2026-1102',
    initiatedByEmail: 'workday.integration@citi.com',
    userId: 'USR-CITI-8820',
    userName: 'Robert Jones',
    oldEmail: 'robert.jones@citi.com',
    newEmail: 'robert.jones@citigroup.com',
    domain: 'citi.com',
    requestedAt: '14-10-2026 11:10:45 (UTC)',
    overallStatus: 'IN_PROGRESS',
    ssoDirectoryUpdated: true,
    retryCount: 0,
    notes: 'Domain alignment event emitted from Workday HR system.',
    applications: [
      {
        applicationName: 'MarkitWire',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 11:10:46 (UTC)',
        acknowledgedTimestamp: '14-10-2026 11:10:52 (UTC)',
        responseCode: 200,
        responseMessage: 'MarkitWire participant acknowledged change.',
        payloadTraceId: 'TRC-MW-994018'
      },
      {
        applicationName: 'TradeServ',
        environment: 'PROD',
        status: 'IN_PROGRESS',
        attemptCount: 1,
        lastAttemptTimestamp: '14-10-2026 11:10:46 (UTC)',
        responseCode: 202,
        responseMessage: 'Accepted (202): Payload enqueued in TradeServ Async Ingestion Buffer. Awaiting worker processing ACK.',
        payloadTraceId: 'TRC-TS-883909'
      }
    ]
  },
  {
    id: 'EML-REQ-2026-905',
    initiatingSystem: 'SSO Converge Admin Console',
    ticketReference: 'SSO-ADM-3392',
    initiatedByEmail: 'ajay.swarnkar@osttra.com',
    userId: 'USR-UBS-5531',
    userName: 'Michael Brown',
    oldEmail: 'michael.brown@ubs.com',
    newEmail: 'michael.brown@ubs-group.com',
    domain: 'ubs.com',
    requestedAt: '13-10-2026 16:30:00 (UTC)',
    completedAt: '13-10-2026 16:30:20 (UTC)',
    overallStatus: 'COMPLETED',
    ssoDirectoryUpdated: true,
    retryCount: 0,
    notes: 'Operator initiated sync for senior trading participant.',
    applications: [
      {
        applicationName: 'TradeServ',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '13-10-2026 16:30:02 (UTC)',
        acknowledgedTimestamp: '13-10-2026 16:30:08 (UTC)',
        responseCode: 200,
        responseMessage: 'TradeServ user record updated.',
        payloadTraceId: 'TRC-TS-772890'
      },
      {
        applicationName: 'CRDS',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '13-10-2026 16:30:02 (UTC)',
        acknowledgedTimestamp: '13-10-2026 16:30:05 (UTC)',
        responseCode: 200,
        responseMessage: 'CRDS entity synchronized.',
        payloadTraceId: 'TRC-CRDS-661781'
      },
      {
        applicationName: 'triReduce',
        environment: 'PROD',
        status: 'SUCCESS',
        attemptCount: 1,
        lastAttemptTimestamp: '13-10-2026 16:30:02 (UTC)',
        acknowledgedTimestamp: '13-10-2026 16:30:12 (UTC)',
        responseCode: 200,
        responseMessage: 'Portfolio compression participant contact updated.',
        payloadTraceId: 'TRC-TR-550672'
      }
    ]
  }
];

export const getInitialEmailSyncRequests = (): UserEmailSyncRequest[] => {
  try {
    const saved = localStorage.getItem(EMAIL_SYNC_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load email sync requests from localStorage', e);
  }
  return INITIAL_EMAIL_SYNC_REQUESTS;
};

export const saveEmailSyncRequests = (requests: UserEmailSyncRequest[]): void => {
  try {
    localStorage.setItem(EMAIL_SYNC_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save email sync requests to localStorage', e);
  }
};

export const formatSyncTimestamp = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = pad(date.getUTCDate());
  const m = pad(date.getUTCMonth() + 1);
  const y = date.getUTCFullYear();
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${d}-${m}-${y} ${hh}:${mm}:${ss} (UTC)`;
};

export const computeOverallStatus = (apps: AppEmailSyncDetail[]): EmailSyncOverallStatus => {
  if (apps.length === 0) return 'COMPLETED';
  const hasInProgress = apps.some(a => a.status === 'IN_PROGRESS');
  const hasFailed = apps.some(a => a.status === 'FAILED');
  const hasSuccess = apps.some(a => a.status === 'SUCCESS');

  if (hasInProgress) return 'IN_PROGRESS';
  if (hasFailed && hasSuccess) return 'PARTIALLY_FAILED';
  if (hasFailed && !hasSuccess) return 'FAILED';
  return 'COMPLETED';
};

/**
 * Automatically discovers active downstream application entitlements for any user email.
 */
export const discoverUserEntitledApplications = (
  email: string
): { name: string; env: 'PROD' | 'UAT'; reason: string }[] => {
  const normalized = (email || '').trim().toLowerCase();
  const domain = normalized.includes('@') ? normalized.split('@')[1] : '';

  // 1. Check if user has recorded logins in localStorage
  try {
    const savedLogins = localStorage.getItem('sso_central_user_login_logs_v1');
    if (savedLogins) {
      const parsed = JSON.parse(savedLogins);
      if (Array.isArray(parsed)) {
        const userLogins = parsed.filter(l => l.email && l.email.toLowerCase() === normalized);
        if (userLogins.length > 0) {
          const map = new Map<string, { name: string; env: 'PROD' | 'UAT'; reason: string }>();
          userLogins.forEach(l => {
            const k = `${l.applicationName}-${l.environment}`;
            if (!map.has(k)) {
              map.set(k, {
                name: l.applicationName,
                env: l.environment,
                reason: `Active SSO Session in ${l.environment}`
              });
            }
          });
          return Array.from(map.values());
        }
      }
    }
  } catch (e) {
    // fallback
  }

  // 2. Domain-based entitlement resolution rules
  if (domain === 'osttra.com') {
    return [
      { name: 'CFD', env: 'PROD', reason: 'Domain Entitlement (Core OSTTRA Participant)' },
      { name: 'CRDS', env: 'PROD', reason: 'Master Reference Data Service' },
      { name: 'TradeServ', env: 'PROD', reason: 'Derivatives Processing Network' },
      { name: 'MarkitWire', env: 'PROD', reason: 'OTC Derivatives Confirmation' },
      { name: 'CFD', env: 'UAT', reason: 'Staging & Integration Sandbox' }
    ];
  }

  if (domain === 'traiana.com') {
    return [
      { name: 'Traiana Harmony', env: 'PROD', reason: 'Trade Matching & Settlement' },
      { name: 'CFD', env: 'PROD', reason: 'Contract for Difference Portal' },
      { name: 'TradeServ', env: 'PROD', reason: 'Post-Trade Allocation' }
    ];
  }

  if (domain.includes('barclays') || domain.includes('citi') || domain.includes('jpmorgan') || domain.includes('ubs') || domain.includes('hsbc')) {
    return [
      { name: 'TradeServ', env: 'PROD', reason: 'Tier-1 Clearing & Matching Node' },
      { name: 'MarkitWire', env: 'PROD', reason: 'Electronic Trade Affirmation' },
      { name: 'CRDS', env: 'PROD', reason: 'Entity Reference Directory' }
    ];
  }

  // Generic / Default
  return [
    { name: 'TradeServ', env: 'PROD', reason: 'Standard Client Entitlement' },
    { name: 'MarkitWire', env: 'PROD', reason: 'Standard Client Entitlement' },
    { name: 'CRDS', env: 'PROD', reason: 'Reference Directory' }
  ];
};
