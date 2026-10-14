import { TraianaUserSkipRecord, TraianaSkipAuditRecord } from '../types';

export const TRAIANA_APPLICATIONS: string[] = [
  'CFD',
  'Harmony',
  'TradeServ',
  'CreditLink',
  'Netting',
  'TRM',
  'CRDS'
];

export const INITIAL_TRAIANA_USERS: TraianaUserSkipRecord[] = [
  {
    id: 'traiana-usr-1',
    userName: 'jdoe',
    application: 'CFD',
    verifiedEmail: null,
    currentProvidedEmail: 'jdoe@barclays.com',
    skipCount: 3,
    maxSkips: 3,
    status: 'LOCKED_EXHAUSTED',
    isLocked: true,
    lastLoginAttempt: '11-09-2026 08:24:12 (UTC)',
    lastSkipTimestamp: '11-09-2026 08:24:12 (UTC)',
    verifiedOn: null,
    verifiedBy: null,
    ticketId: 'SUP-4491',
    resetCountHistory: 0,
    notes: 'Exhausted 3/3 skips. User reported corporate firewall blocked OTP emails from delivery.'
  },
  {
    id: 'traiana-usr-2',
    userName: 'alex.turner',
    application: 'CFD',
    verifiedEmail: null,
    currentProvidedEmail: 'alex.turner@jpmorgan.com',
    skipCount: 3,
    maxSkips: 3,
    status: 'LOCKED_EXHAUSTED',
    isLocked: true,
    lastLoginAttempt: '11-09-2026 07:15:40 (UTC)',
    lastSkipTimestamp: '11-09-2026 07:15:40 (UTC)',
    verifiedOn: null,
    verifiedBy: null,
    ticketId: 'SUP-4485',
    resetCountHistory: 1,
    lastResetOn: '04-09-2026 14:10:00 (UTC)',
    lastResetBy: 'ajay.swarnkar@osttra.com',
    notes: 'User exhausted skips again. Requires support verification.'
  },
  {
    id: 'traiana-usr-3',
    userName: 'brian.conner',
    application: 'Harmony',
    verifiedEmail: null,
    currentProvidedEmail: 'brian.conner@citi.com',
    skipCount: 2,
    maxSkips: 3,
    status: 'PENDING_VERIFICATION',
    isLocked: false,
    lastLoginAttempt: '10-09-2026 16:30:19 (UTC)',
    lastSkipTimestamp: '10-09-2026 16:30:19 (UTC)',
    verifiedOn: null,
    verifiedBy: null,
    ticketId: 'SUP-4420',
    resetCountHistory: 0,
    notes: '2 skips used. 1 skip remaining before lockout.'
  },
  {
    id: 'traiana-usr-4',
    userName: 'sarah.jenkins',
    application: 'TradeServ',
    verifiedEmail: null,
    currentProvidedEmail: 'sjenkins@morganstanley.com',
    skipCount: 1,
    maxSkips: 3,
    status: 'PENDING_VERIFICATION',
    isLocked: false,
    lastLoginAttempt: '09-09-2026 11:42:00 (UTC)',
    lastSkipTimestamp: '09-09-2026 11:42:00 (UTC)',
    verifiedOn: null,
    verifiedBy: null,
    ticketId: 'SUP-4390',
    resetCountHistory: 0,
    notes: '1 skip used during morning market open.'
  },
  {
    id: 'traiana-usr-5',
    userName: 'michael.chang',
    application: 'CreditLink',
    verifiedEmail: null,
    currentProvidedEmail: null,
    skipCount: 3,
    maxSkips: 3,
    status: 'LOCKED_EXHAUSTED',
    isLocked: true,
    lastLoginAttempt: '11-09-2026 09:05:33 (UTC)',
    lastSkipTimestamp: '11-09-2026 09:05:33 (UTC)',
    verifiedOn: null,
    verifiedBy: null,
    ticketId: 'SUP-4502',
    resetCountHistory: 0,
    notes: 'Locked out. User did not provide email during 3 skips.'
  },
  {
    id: 'traiana-usr-6',
    userName: 'elena.rostova',
    application: 'CFD',
    verifiedEmail: null,
    currentProvidedEmail: null,
    skipCount: 0,
    maxSkips: 3,
    status: 'PENDING_VERIFICATION',
    isLocked: false,
    lastLoginAttempt: '08-09-2026 10:14:22 (UTC)',
    lastSkipTimestamp: null,
    verifiedOn: null,
    verifiedBy: null,
    ticketId: 'SSOOB-5100',
    resetCountHistory: 0,
    notes: 'Fresh legacy user account. Has not skipped yet.'
  },
  {
    id: 'traiana-usr-7',
    userName: 'david.miller',
    application: 'Harmony',
    verifiedEmail: 'david.miller@hsbc.com',
    currentProvidedEmail: 'david.miller@hsbc.com',
    skipCount: 0,
    maxSkips: 3,
    status: 'VERIFIED_BY_ADMIN',
    isLocked: false,
    lastLoginAttempt: '10-09-2026 17:00:00 (UTC)',
    lastSkipTimestamp: null,
    verifiedOn: '08-09-2026 15:20:00 (UTC)',
    verifiedBy: 'ajay.swarnkar@osttra.com (OSTTRA Support Admin)',
    ticketId: 'SSOOB-4912',
    resetCountHistory: 1,
    lastResetOn: '08-09-2026 15:20:00 (UTC)',
    lastResetBy: 'ajay.swarnkar@osttra.com',
    notes: 'Email verified directly by OSTTRA admin on behalf of user after phone verification.'
  },
  {
    id: 'traiana-usr-8',
    userName: 'claire.dupont',
    application: 'Netting',
    verifiedEmail: 'claire.d@bnpparibas.com',
    currentProvidedEmail: 'claire.d@bnpparibas.com',
    skipCount: 1,
    maxSkips: 3,
    status: 'VERIFIED_BY_OTP',
    isLocked: false,
    lastLoginAttempt: '07-09-2026 09:12:45 (UTC)',
    lastSkipTimestamp: '06-09-2026 14:00:00 (UTC)',
    verifiedOn: '07-09-2026 09:15:10 (UTC)',
    verifiedBy: 'Self-Service (OTP Verified)',
    ticketId: 'SSOOB-4880',
    resetCountHistory: 0,
    notes: 'User self-verified OTP on second attempt.'
  },
  {
    id: 'traiana-usr-9',
    userName: 'robert.chen',
    application: 'TRM',
    verifiedEmail: null,
    currentProvidedEmail: 'robert.chen@nomura.com',
    skipCount: 2,
    maxSkips: 3,
    status: 'PENDING_VERIFICATION',
    isLocked: false,
    lastLoginAttempt: '10-09-2026 19:40:11 (UTC)',
    lastSkipTimestamp: '10-09-2026 19:40:11 (UTC)',
    verifiedOn: null,
    verifiedBy: null,
    ticketId: 'SUP-4467',
    resetCountHistory: 0,
    notes: 'Warning threshold reached. User needs to verify email soon.'
  }
];

export const INITIAL_TRAIANA_SKIP_AUDIT_LOGS: TraianaSkipAuditRecord[] = [
  {
    id: 'aud-skip-101',
    recordId: 'traiana-usr-7',
    userName: 'david.miller',
    application: 'Harmony',
    action: 'ADMIN_VERIFY_EMAIL',
    performedBy: 'ajay.swarnkar@osttra.com',
    timestamp: '08-09-2026 15:20:00 (UTC)',
    ticketId: 'SSOOB-4912',
    previousSkipCount: 3,
    newSkipCount: 0,
    previousEmail: null,
    newVerifiedEmail: 'david.miller@hsbc.com',
    previousStatus: 'LOCKED_EXHAUSTED',
    newStatus: 'VERIFIED_BY_ADMIN',
    reason: 'User provided verified email to OSTTRA support via authorized client service request.',
    notes: 'Admin captured email on behalf of user, verified domain ownership and unlocked account.'
  },
  {
    id: 'aud-skip-102',
    recordId: 'traiana-usr-2',
    userName: 'alex.turner',
    application: 'CFD',
    action: 'RESET_SKIP_COUNTER',
    performedBy: 'ajay.swarnkar@osttra.com',
    timestamp: '04-09-2026 14:10:00 (UTC)',
    ticketId: 'SUP-4485',
    previousSkipCount: 3,
    newSkipCount: 0,
    previousEmail: null,
    newVerifiedEmail: null,
    previousStatus: 'LOCKED_EXHAUSTED',
    newStatus: 'PENDING_VERIFICATION',
    reason: 'Client requested skip reset while corporate email routing was being reconfigured.',
    notes: 'Counter reset to 0/3. User granted 3 fresh skip chances.'
  },
  {
    id: 'aud-skip-103',
    recordId: 'traiana-usr-8',
    userName: 'claire.dupont',
    application: 'Netting',
    action: 'OTP_VERIFIED',
    performedBy: 'claire.dupont (Self-Service)',
    timestamp: '07-09-2026 09:15:10 (UTC)',
    ticketId: 'SSOOB-4880',
    previousSkipCount: 1,
    newSkipCount: 1,
    previousEmail: 'claire.d@bnpparibas.com',
    newVerifiedEmail: 'claire.d@bnpparibas.com',
    previousStatus: 'PENDING_VERIFICATION',
    newStatus: 'VERIFIED_BY_OTP',
    reason: 'User successfully entered 6-digit OTP code sent to corporate email.',
    notes: 'Self-service verification complete.'
  }
];

const STORAGE_KEY_USERS = 'osttra_traiana_user_skips_v1';
const STORAGE_KEY_AUDITS = 'osttra_traiana_skip_audits_v1';

export function getInitialTraianaUsers(): TraianaUserSkipRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading Traiana users from storage', e);
  }
  return INITIAL_TRAIANA_USERS;
}

export function saveTraianaUsers(users: TraianaUserSkipRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving Traiana users to storage', e);
  }
}

export function getInitialTraianaAuditLogs(): TraianaSkipAuditRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AUDITS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading Traiana audit logs from storage', e);
  }
  return INITIAL_TRAIANA_SKIP_AUDIT_LOGS;
}

export function saveTraianaAuditLogs(logs: TraianaSkipAuditRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving Traiana audit logs to storage', e);
  }
}
