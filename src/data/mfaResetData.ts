import { UserMfaRecord, MfaResetAuditRecord, Domain, MfaCollaborationType } from '../types';

export const INITIAL_MFA_USERS: UserMfaRecord[] = [
  {
    id: 'mfa-usr-1',
    email: 'john.doe@osttra.com',
    displayName: 'John Doe',
    domain: 'osttra.com',
    mfaStatus: 'Enable',
    collaborationType: 'Fed',
    deviceModel: 'Apple iPhone 15 Pro (iOS 17.5)',
    deviceRegisteredOn: '12-08-2025 09:30:15 (UTC)',
    lastMfaAuth: '27-09-2026 14:22:10 (UTC)',
    mfaMethod: 'Microsoft Authenticator',
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'Primary corporate trade operator account'
  },
  {
    id: 'mfa-usr-2',
    email: 'ajay.swarnkar@osttra.com',
    displayName: 'Ajay Swarnkar',
    domain: 'osttra.com',
    mfaStatus: 'Enable',
    collaborationType: 'Fed',
    deviceModel: 'Apple iPhone 15 (iOS 18.0)',
    deviceRegisteredOn: '10-08-2025 11:15:00 (UTC)',
    lastMfaAuth: '28-09-2026 06:15:44 (UTC)',
    mfaMethod: 'Microsoft Authenticator',
    lastResetOn: '15-08-2026 10:20:00 (UTC)',
    lastResetBy: 'superadmin@osttra.com',
    lastResetTicket: 'SSOOB-8921',
    resetCount: 1,
    requiresReEnrollment: false,
    notes: 'Global security & SSO administration user'
  },
  {
    id: 'mfa-usr-3',
    email: 'alex.chen@osttra.com',
    displayName: 'Alex Chen',
    domain: 'osttra.com',
    mfaStatus: 'Enable',
    collaborationType: 'Fed',
    deviceModel: 'Hardware Token - YubiKey 5C NFC',
    deviceRegisteredOn: '06-08-2026 11:08:45 (UTC)',
    lastMfaAuth: '25-09-2026 18:40:12 (UTC)',
    mfaMethod: 'Hardware Security Key (FIDO2)',
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'Risk operations lead with hardware FIDO2 key'
  },
  {
    id: 'mfa-usr-4',
    email: 'sarah.jenkins@traiana.com',
    displayName: 'Sarah Jenkins',
    domain: 'traiana.com',
    mfaStatus: 'Enable',
    collaborationType: 'SAML',
    deviceModel: 'Samsung Galaxy S24 Ultra (Android 14)',
    deviceRegisteredOn: '07-08-2026 12:15:40 (UTC)',
    lastMfaAuth: '26-09-2026 09:12:33 (UTC)',
    mfaMethod: 'Microsoft Authenticator',
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'Traiana trade surveillance & compliance desk'
  },
  {
    id: 'mfa-usr-5',
    email: 'admin@traiana.com',
    displayName: 'Traiana Admin',
    domain: 'traiana.com',
    mfaStatus: 'Enable',
    collaborationType: 'SAML',
    deviceModel: 'Google Pixel 8 Pro',
    deviceRegisteredOn: '10-09-2025 15:45:00 (UTC)',
    lastMfaAuth: '27-09-2026 21:05:18 (UTC)',
    mfaMethod: 'Google Authenticator',
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'SAML IdP federation administrator'
  },
  {
    id: 'mfa-usr-6',
    email: 'emma.watson@trioptima.com',
    displayName: 'Emma Watson',
    domain: 'trioptima.com',
    mfaStatus: 'Disable',
    collaborationType: 'Fed',
    deviceModel: 'None (MFA Disabled)',
    deviceRegisteredOn: undefined,
    lastMfaAuth: undefined,
    mfaMethod: undefined,
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'Domain policy has MFA currently disabled per Infosec waiver SEC-8921'
  },
  {
    id: 'mfa-usr-7',
    email: 'michael.ross@abc.com',
    displayName: 'Michael Ross',
    domain: 'abc.com',
    mfaStatus: 'Disable',
    collaborationType: 'Non-Fed',
    deviceModel: 'None (MFA Disabled)',
    deviceRegisteredOn: undefined,
    lastMfaAuth: undefined,
    mfaMethod: undefined,
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'External non-federated partner account'
  },
  {
    id: 'mfa-usr-8',
    email: 'brian.conner@citi.com',
    displayName: 'Brian Conner',
    domain: 'citi.com',
    mfaStatus: 'Enable',
    collaborationType: 'SAML',
    deviceModel: 'Apple iPhone 14 Pro Max',
    deviceRegisteredOn: '15-01-2026 08:00:00 (UTC)',
    lastMfaAuth: '24-09-2026 16:50:22 (UTC)',
    mfaMethod: 'Microsoft Authenticator',
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'Citi foreign exchange institutional trading desk'
  },
  {
    id: 'mfa-usr-9',
    email: 'alex.turner@jpmorgan.com',
    displayName: 'Alex Turner',
    domain: 'jpmorgan.com',
    mfaStatus: 'Enable',
    collaborationType: 'SAML',
    deviceModel: 'Apple iPhone 13 (iOS 17.2)',
    deviceRegisteredOn: '20-02-2026 10:14:00 (UTC)',
    lastMfaAuth: '23-09-2026 11:20:00 (UTC)',
    mfaMethod: 'Microsoft Authenticator',
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'JPMorgan clearing and settlement user'
  },
  {
    id: 'mfa-usr-10',
    email: 'trader1@partnerbank.com',
    displayName: 'Partner Trader 1',
    domain: 'partnerbank.com',
    mfaStatus: 'Disable',
    collaborationType: 'OTP',
    deviceModel: 'None (Email OTP Token)',
    deviceRegisteredOn: undefined,
    lastMfaAuth: '28-09-2026 04:12:00 (UTC)',
    mfaMethod: 'Email OTP',
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: 'Guest OTP authentication user'
  }
];

export const INITIAL_MFA_RESET_AUDIT_LOGS: MfaResetAuditRecord[] = [
  {
    id: 'mfa-aud-1',
    scope: 'USER',
    target: 'ajay.swarnkar@osttra.com',
    emails: ['ajay.swarnkar@osttra.com'],
    performedBy: 'superadmin@osttra.com',
    timestamp: '15-08-2026 10:20:00 (UTC)',
    ticketId: 'SSOOB-8921',
    status: 'Successful',
    collaborationType: 'Fed',
    reason: 'Device upgraded to iPhone 15; old Authenticator app decommissioned.',
    details: 'MFA credential binding revoked. Successfully invalidated previous TOTP secret seed and triggered re-enrollment.'
  },
  {
    id: 'mfa-aud-2',
    scope: 'USER',
    target: 'sarah.jenkins@traiana.com',
    emails: ['sarah.jenkins@traiana.com'],
    performedBy: 'kanika.bhardwaj@osttra.com',
    timestamp: '20-08-2026 14:15:30 (UTC)',
    ticketId: 'INC-49281',
    status: 'Successful',
    collaborationType: 'SAML',
    reason: 'Authenticator app desynced after iOS update.',
    details: 'Cleared device trust cache and issued reset token.'
  },
  {
    id: 'mfa-aud-3',
    scope: 'DOMAIN',
    target: 'traiana.com',
    emails: ['sarah.jenkins@traiana.com', 'admin@traiana.com'],
    performedBy: 'ajay.swarnkar@osttra.com',
    timestamp: '25-08-2026 08:30:00 (UTC)',
    ticketId: 'SEC-EMERG-002',
    status: 'Successful',
    collaborationType: 'SAML',
    reason: 'Enterprise IdP SAML Certificate Rotation & Device Trust Baseline Wipe',
    details: 'Domain-wide MFA reset executed for 2 users under traiana.com. All active device trust certs invalidated.'
  }
];

const STORAGE_KEY_MFA_USERS = 'osttra_sso_mfa_users_v1';
const STORAGE_KEY_MFA_AUDIT = 'osttra_sso_mfa_audit_v1';

export const getInitialMfaUsers = (): UserMfaRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MFA_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load MFA users from storage, using defaults:', e);
  }
  return INITIAL_MFA_USERS;
};

export const saveMfaUsers = (users: UserMfaRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_MFA_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save MFA users to storage:', e);
  }
};

export const getInitialMfaAuditLogs = (): MfaResetAuditRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MFA_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load MFA audit logs from storage, using defaults:', e);
  }
  return INITIAL_MFA_RESET_AUDIT_LOGS;
};

export const saveMfaAuditLogs = (logs: MfaResetAuditRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_MFA_AUDIT, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save MFA audit logs to storage:', e);
  }
};

export const mapDomainCollabToMfaCollab = (
  collabType?: string,
  federated?: 'Yes' | 'No'
): MfaCollaborationType => {
  if (!collabType) {
    return federated === 'Yes' ? 'Fed' : 'Non-Fed';
  }
  const upper = collabType.toUpperCase();
  if (upper === 'OTP') return 'OTP';
  if (upper === 'SAML') return 'SAML';
  if (upper.includes('NON_FED') || upper === 'ENTRA_NON_FED') return 'Non-Fed';
  if (upper.includes('FED') || upper === 'B2B' || upper === 'ENTRA_FED') return 'Fed';
  return federated === 'Yes' ? 'Fed' : 'Non-Fed';
};

export const findOrGenerateMfaUser = (
  rawEmail: string,
  existingUsers: UserMfaRecord[],
  domainList: Domain[]
): UserMfaRecord => {
  const cleanEmail = rawEmail.trim().toLowerCase();
  const existing = existingUsers.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) return existing;

  const parts = cleanEmail.split('@');
  const userPrefix = parts[0] || 'user';
  const domainPart = parts[1] || 'domain.com';

  const matchedDomain = domainList.find(d => d.domain.toLowerCase() === domainPart.toLowerCase());

  let collabType: MfaCollaborationType = 'Fed';
  let mfaStatus: 'Enable' | 'Disable' = 'Enable';

  if (matchedDomain) {
    collabType = mapDomainCollabToMfaCollab(matchedDomain.collaborationType, matchedDomain.federated);
    mfaStatus = matchedDomain.mfaStatus === 'Enabled' ? 'Enable' : 'Disable';
  } else {
    // Infer sensible defaults
    if (domainPart.includes('otp') || domainPart.includes('guest')) {
      collabType = 'OTP';
      mfaStatus = 'Disable';
    } else if (domainPart.includes('saml') || domainPart.includes('traiana') || domainPart.includes('ubs') || domainPart.includes('citi')) {
      collabType = 'SAML';
      mfaStatus = 'Enable';
    } else if (domainPart.includes('abc') || domainPart.includes('external')) {
      collabType = 'Non-Fed';
      mfaStatus = 'Disable';
    } else {
      collabType = 'Fed';
      mfaStatus = 'Enable';
    }
  }

  // Format display name from prefix
  const formattedName = userPrefix
    .split(/[._-]/)
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || 'User';

  return {
    id: `mfa-usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email: cleanEmail,
    displayName: formattedName,
    domain: domainPart,
    mfaStatus,
    collaborationType: collabType,
    deviceModel: mfaStatus === 'Enable' ? 'Mobile Authenticator (Pending Re-bind)' : 'None (MFA Disabled)',
    deviceRegisteredOn: mfaStatus === 'Enable' ? '15-05-2026 12:00:00 (UTC)' : undefined,
    lastMfaAuth: mfaStatus === 'Enable' ? '20-09-2026 10:00:00 (UTC)' : undefined,
    mfaMethod: mfaStatus === 'Enable' ? 'Microsoft Authenticator' : undefined,
    lastResetOn: null,
    lastResetBy: null,
    lastResetTicket: null,
    resetCount: 0,
    requiresReEnrollment: false,
    notes: `Provisioned for domain ${domainPart}`
  };
};
