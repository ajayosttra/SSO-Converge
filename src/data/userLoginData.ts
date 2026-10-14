import { SsoUserLoginRecord, UserAppLoginSummary, SsoAuthProtocol, SsoLoginStatus } from '../types';

const SSO_LOGIN_STORAGE_KEY = 'sso_central_user_login_logs_v1';

export const KNOWN_APPLICATIONS: { name: string; description: string; defaultEnv: 'PROD' | 'UAT' }[] = [
  { name: 'CFD', description: 'Contract For Difference Processing Portal', defaultEnv: 'PROD' },
  { name: 'CRDS', description: 'Central Reference Data Service', defaultEnv: 'PROD' },
  { name: 'TradeServ', description: 'Post-Trade Derivatives Processing', defaultEnv: 'PROD' },
  { name: 'MarkitWire', description: 'OTC Derivatives Confirmation Network', defaultEnv: 'PROD' },
  { name: 'Traiana Harmony', description: 'Cross-Asset Trade Processing & Matching', defaultEnv: 'PROD' },
  { name: 'FX Connect', description: 'Foreign Exchange Execution & Allocation', defaultEnv: 'PROD' },
  { name: 'triReduce', description: 'Multilateral Portfolio Compression', defaultEnv: 'PROD' },
  { name: 'triResolve', description: 'Portfolio Reconciliation & Margin Management', defaultEnv: 'PROD' },
  { name: 'SSO Central Admin', description: 'Single Sign-On Identity & Federation Gateway', defaultEnv: 'PROD' },
];

export const INITIAL_SSO_USER_LOGINS: SsoUserLoginRecord[] = [
  {
    id: 'SSO-LOG-2026-1001',
    email: 'ajay.swarnkar@osttra.com',
    displayName: 'Ajay Swarnkar',
    domain: 'osttra.com',
    applicationName: 'CFD',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 10:45:12 (UTC)',
    rawTimestamp: new Date('2026-10-14T10:45:12Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '194.28.112.45',
    location: 'London, United Kingdom',
    sessionId: 'sess_osttra_94821a',
    idpEntityId: 'https://sts.windows.net/osttra-corp-aad/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1002',
    email: 'ajay.swarnkar@osttra.com',
    displayName: 'Ajay Swarnkar',
    domain: 'osttra.com',
    applicationName: 'CRDS',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 09:20:00 (UTC)',
    rawTimestamp: new Date('2026-10-14T09:20:00Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '194.28.112.45',
    location: 'London, United Kingdom',
    sessionId: 'sess_osttra_88312b',
    idpEntityId: 'https://sts.windows.net/osttra-corp-aad/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1003',
    email: 'ajay.swarnkar@osttra.com',
    displayName: 'Ajay Swarnkar',
    domain: 'osttra.com',
    applicationName: 'CFD',
    environment: 'UAT',
    lastLoginTimestamp: '13-10-2026 15:30:45 (UTC)',
    rawTimestamp: new Date('2026-10-13T15:30:45Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '194.28.112.45',
    location: 'London, United Kingdom',
    sessionId: 'sess_osttra_77142c',
    idpEntityId: 'https://sts.windows.net/osttra-corp-aad/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1004',
    email: 'ajay.swarnkar@osttra.com',
    displayName: 'Ajay Swarnkar',
    domain: 'osttra.com',
    applicationName: 'MarkitWire',
    environment: 'PROD',
    lastLoginTimestamp: '13-10-2026 11:12:18 (UTC)',
    rawTimestamp: new Date('2026-10-13T11:12:18Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '194.28.112.45',
    location: 'London, United Kingdom',
    sessionId: 'sess_osttra_66231d',
    idpEntityId: 'https://sts.windows.net/osttra-corp-aad/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1005',
    email: 'ajay.swarnkar@traiana.com',
    displayName: 'Ajay Swarnkar',
    domain: 'traiana.com',
    applicationName: 'Traiana Harmony',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 08:15:22 (UTC)',
    rawTimestamp: new Date('2026-10-14T08:15:22Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '194.28.112.45',
    location: 'London, United Kingdom',
    sessionId: 'sess_traiana_55419e',
    idpEntityId: 'https://sso.traiana.com/adfs/services/trust',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1006',
    email: 'john.doe@barclays.com',
    displayName: 'John Doe',
    domain: 'barclays.com',
    applicationName: 'TradeServ',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 10:12:05 (UTC)',
    rawTimestamp: new Date('2026-10-14T10:12:05Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '157.203.42.11',
    location: 'London, United Kingdom',
    sessionId: 'sess_barclays_44921f',
    idpEntityId: 'https://fed.barclays.com/idp/shibboleth',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0',
  },
  {
    id: 'SSO-LOG-2026-1007',
    email: 'john.doe@barclays.com',
    displayName: 'John Doe',
    domain: 'barclays.com',
    applicationName: 'MarkitWire',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 07:44:30 (UTC)',
    rawTimestamp: new Date('2026-10-14T07:44:30Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '157.203.42.11',
    location: 'London, United Kingdom',
    sessionId: 'sess_barclays_33812g',
    idpEntityId: 'https://fed.barclays.com/idp/shibboleth',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0',
  },
  {
    id: 'SSO-LOG-2026-1008',
    email: 'jane.smith@jpmorgan.com',
    displayName: 'Jane Smith',
    domain: 'jpmorgan.com',
    applicationName: 'TradeServ',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 09:58:14 (UTC)',
    rawTimestamp: new Date('2026-10-14T09:58:14Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '165.225.80.12',
    location: 'New York, United States',
    sessionId: 'sess_jpm_22719h',
    idpEntityId: 'https://sts.windows.net/jpmorgan-chase-fed/',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1009',
    email: 'jane.smith@jpmorgan.com',
    displayName: 'Jane Smith',
    domain: 'jpmorgan.com',
    applicationName: 'FX Connect',
    environment: 'PROD',
    lastLoginTimestamp: '13-10-2026 16:40:02 (UTC)',
    rawTimestamp: new Date('2026-10-13T16:40:02Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '165.225.80.12',
    location: 'New York, United States',
    sessionId: 'sess_jpm_11603i',
    idpEntityId: 'https://sts.windows.net/jpmorgan-chase-fed/',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1010',
    email: 'alex.chen@osttra.com',
    displayName: 'Alex Chen',
    domain: 'osttra.com',
    applicationName: 'CRDS',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 08:35:50 (UTC)',
    rawTimestamp: new Date('2026-10-14T08:35:50Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '194.28.112.88',
    location: 'Singapore',
    sessionId: 'sess_osttra_99501j',
    idpEntityId: 'https://sts.windows.net/osttra-corp-aad/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1011',
    email: 'alex.chen@osttra.com',
    displayName: 'Alex Chen',
    domain: 'osttra.com',
    applicationName: 'TradeServ',
    environment: 'UAT',
    lastLoginTimestamp: '12-10-2026 07:11:25 (UTC)',
    rawTimestamp: new Date('2026-10-12T07:11:25Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '194.28.112.88',
    location: 'Singapore',
    sessionId: 'sess_osttra_88410k',
    idpEntityId: 'https://sts.windows.net/osttra-corp-aad/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1012',
    email: 'sarah.jenkins@traiana.com',
    displayName: 'Sarah Jenkins',
    domain: 'traiana.com',
    applicationName: 'Traiana Harmony',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 06:50:33 (UTC)',
    rawTimestamp: new Date('2026-10-14T06:50:33Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '212.121.33.90',
    location: 'Tel Aviv, Israel',
    sessionId: 'sess_traiana_77309l',
    idpEntityId: 'https://sso.traiana.com/adfs/services/trust',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1013',
    email: 'sarah.jenkins@traiana.com',
    displayName: 'Sarah Jenkins',
    domain: 'traiana.com',
    applicationName: 'CFD',
    environment: 'UAT',
    lastLoginTimestamp: '11-10-2026 14:22:19 (UTC)',
    rawTimestamp: new Date('2026-10-11T14:22:19Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '212.121.33.90',
    location: 'Tel Aviv, Israel',
    sessionId: 'sess_traiana_66298m',
    idpEntityId: 'https://sso.traiana.com/adfs/services/trust',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1014',
    email: 'robert.jones@citi.com',
    displayName: 'Robert Jones',
    domain: 'citi.com',
    applicationName: 'MarkitWire',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 09:05:12 (UTC)',
    rawTimestamp: new Date('2026-10-14T09:05:12Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '199.67.138.10',
    location: 'New York, United States',
    sessionId: 'sess_citi_55187n',
    idpEntityId: 'https://fed.citi.com/idp/SSO.saml2',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0',
  },
  {
    id: 'SSO-LOG-2026-1015',
    email: 'robert.jones@citi.com',
    displayName: 'Robert Jones',
    domain: 'citi.com',
    applicationName: 'TradeServ',
    environment: 'PROD',
    lastLoginTimestamp: '13-10-2026 18:02:40 (UTC)',
    rawTimestamp: new Date('2026-10-13T18:02:40Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '199.67.138.10',
    location: 'New York, United States',
    sessionId: 'sess_citi_44076o',
    idpEntityId: 'https://fed.citi.com/idp/SSO.saml2',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0',
  },
  {
    id: 'SSO-LOG-2026-1016',
    email: 'emily.davis@hsbc.com',
    displayName: 'Emily Davis',
    domain: 'hsbc.com',
    applicationName: 'FX Connect',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 08:42:01 (UTC)',
    rawTimestamp: new Date('2026-10-14T08:42:01Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '155.136.80.20',
    location: 'Hong Kong',
    sessionId: 'sess_hsbc_33965p',
    idpEntityId: 'https://sts.windows.net/hsbc-group-aad/',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1017',
    email: 'emily.davis@hsbc.com',
    displayName: 'Emily Davis',
    domain: 'hsbc.com',
    applicationName: 'MarkitWire',
    environment: 'UAT',
    lastLoginTimestamp: '10-10-2026 13:15:00 (UTC)',
    rawTimestamp: new Date('2026-10-10T13:15:00Z').getTime(),
    protocol: 'Entra ID (Fed)',
    status: 'SUCCESS',
    clientIp: '155.136.80.20',
    location: 'Hong Kong',
    sessionId: 'sess_hsbc_22854q',
    idpEntityId: 'https://sts.windows.net/hsbc-group-aad/',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0',
  },
  {
    id: 'SSO-LOG-2026-1018',
    email: 'michael.brown@ubs.com',
    displayName: 'Michael Brown',
    domain: 'ubs.com',
    applicationName: 'TradeServ',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 09:40:11 (UTC)',
    rawTimestamp: new Date('2026-10-14T09:40:11Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '193.134.254.10',
    location: 'Zurich, Switzerland',
    sessionId: 'sess_ubs_11743r',
    idpEntityId: 'https://saml.ubs.com/idp/shibboleth',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0',
  },
  {
    id: 'SSO-LOG-2026-1019',
    email: 'michael.brown@ubs.com',
    displayName: 'Michael Brown',
    domain: 'ubs.com',
    applicationName: 'CRDS',
    environment: 'PROD',
    lastLoginTimestamp: '12-10-2026 16:55:09 (UTC)',
    rawTimestamp: new Date('2026-10-12T16:55:09Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '193.134.254.10',
    location: 'Zurich, Switzerland',
    sessionId: 'sess_ubs_99632s',
    idpEntityId: 'https://saml.ubs.com/idp/shibboleth',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0',
  },
  {
    id: 'SSO-LOG-2026-1020',
    email: 'david.wilson@bnpparibas.com',
    displayName: 'David Wilson',
    domain: 'bnpparibas.com',
    applicationName: 'triReduce',
    environment: 'PROD',
    lastLoginTimestamp: '14-10-2026 07:18:29 (UTC)',
    rawTimestamp: new Date('2026-10-14T07:18:29Z').getTime(),
    protocol: 'SAML 2.0',
    status: 'SUCCESS',
    clientIp: '195.154.122.35',
    location: 'Paris, France',
    sessionId: 'sess_bnp_88521t',
    idpEntityId: 'https://fed.bnpparibas.com/openam/SSO',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
  },
];

export const getInitialSsoLoginRecords = (): SsoUserLoginRecord[] => {
  try {
    const saved = localStorage.getItem(SSO_LOGIN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load SSO user login records from localStorage', e);
  }
  return INITIAL_SSO_USER_LOGINS;
};

export const saveSsoLoginRecords = (records: SsoUserLoginRecord[]): void => {
  try {
    localStorage.setItem(SSO_LOGIN_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save SSO user login records to localStorage', e);
  }
};

export const formatLoginTimestamp = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = pad(date.getUTCDate());
  const m = pad(date.getUTCMonth() + 1);
  const y = date.getUTCFullYear();
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${d}-${m}-${y} ${hh}:${mm}:${ss} (UTC)`;
};

export const createSsoLoginRecord = (params: {
  email: string;
  applicationName: string;
  environment: 'PROD' | 'UAT';
  protocol?: SsoAuthProtocol;
  status?: SsoLoginStatus;
  clientIp?: string;
  location?: string;
  idpEntityId?: string;
  failureReason?: string;
}): SsoUserLoginRecord => {
  const email = params.email.trim().toLowerCase();
  const domain = email.includes('@') ? email.split('@')[1] : 'osttra.com';
  const rawPrefix = email.includes('@') ? email.split('@')[0] : 'user';
  const displayName = rawPrefix
    .split(/[._-]/)
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || 'User';

  const now = new Date();
  const formattedTimestamp = formatLoginTimestamp(now);
  const uniqueId = `SSO-LOG-${now.getUTCFullYear()}-${Date.now().toString().slice(-6)}`;

  return {
    id: uniqueId,
    email,
    displayName,
    domain,
    applicationName: params.applicationName,
    environment: params.environment,
    lastLoginTimestamp: formattedTimestamp,
    rawTimestamp: now.getTime(),
    protocol: params.protocol || 'Entra ID (Fed)',
    status: params.status || 'SUCCESS',
    clientIp: params.clientIp || '194.28.112.45',
    location: params.location || 'London, United Kingdom',
    sessionId: `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
    idpEntityId: params.idpEntityId || `https://sts.identity.${domain}/adfs/ls/`,
    userAgent: navigator.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    failureReason: params.failureReason,
  };
};

export const getUserAppLoginSummaries = (records: SsoUserLoginRecord[]): UserAppLoginSummary[] => {
  const map = new Map<string, UserAppLoginSummary>();

  // Sort chronological descending first so the first occurrence is the latest login
  const sorted = [...records].sort((a, b) => b.rawTimestamp - a.rawTimestamp);

  for (const rec of sorted) {
    const key = `${rec.email.toLowerCase()}::${rec.applicationName}::${rec.environment}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        email: rec.email,
        displayName: rec.displayName || rec.email.split('@')[0],
        domain: rec.domain,
        applicationName: rec.applicationName,
        environment: rec.environment,
        lastLoginTimestamp: rec.lastLoginTimestamp,
        rawTimestamp: rec.rawTimestamp,
        totalLogins: 1,
        lastClientIp: rec.clientIp,
        lastProtocol: rec.protocol,
        lastStatus: rec.status,
      });
    } else {
      existing.totalLogins += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.rawTimestamp - a.rawTimestamp);
};
