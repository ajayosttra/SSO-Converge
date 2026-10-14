import { AppSecret, AppSecretAuditRecord } from '../types';

/**
 * Normalizes date string and handles timezone offsets like +00, +00:00, or Z
 */
export function normalizeDateString(expiryDateStr: string): Date {
  if (!expiryDateStr) return new Date();
  let s = expiryDateStr.trim();
  if (s.endsWith('+00')) {
    s = s.slice(0, -3) + 'Z';
  } else if (/\+\d{2}$/.test(s)) {
    s = s + ':00';
  }
  s = s.replace(' ', 'T');
  let d = new Date(s);
  if (isNaN(d.getTime())) {
    const match = expiryDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      d = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
    }
  }
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Calculates days remaining from current reference time (2026-09-07) to target expiry date.
 */
export function calculateExpiryInfo(expiryDateStr: string) {
  // Reference date: current system simulation benchmark (2026-09-07)
  const today = new Date('2026-09-07T00:00:00Z');
  const expiry = normalizeDateString(expiryDateStr);
  const diffTime = expiry.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: 'Expired' | 'Critical' | 'Warning' | 'Healthy';
  if (days <= 0) {
    status = 'Expired'; // Expired -> RED & Delete button available
  } else if (days <= 90) {
    status = 'Critical'; // Expiring in next 3 months (<= 90 days) -> RED
  } else if (days <= 180) {
    status = 'Warning'; // 3-6 months
  } else {
    status = 'Healthy'; // > 6 months
  }

  return { daysRemaining: days, status };
}

/**
 * Generates a realistic 64-char (512-bit) hex client secret and hint, matching pgAdmin database format
 */
export function generateNewClientSecret(): { clientSecret: string; secretHint: string } {
  const hexChars = '0123456789abcdef';
  let clientSecret = '';
  for (let i = 0; i < 64; i++) {
    clientSecret += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let hintPrefix = '';
  for (let i = 0; i < 3; i++) {
    hintPrefix += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  const secretHint = `${hintPrefix}*******`;
  
  return { clientSecret, secretHint };
}

export const INITIAL_RAW_SECRETS = [
  {
    secretId: 74,
    clientId: 'bd1afe1d-c204-436b-af6c-cd664234018f',
    applicationName: 'OSTTRA TradeServ Gateway',
    environment: 'PROD' as const,
    clientSecret: '308e73d0ece287449c2e041d6424ff86aa63a9fb3ff629aa1a3a99c7fd6a9c1b',
    secretHint: '8Vj*******',
    createdDate: '2026-06-30 03:43:38+00',
    expiryDate: '2026-09-01 09:00:00+00', // 01 Sep 2026 -> EXPIRED!
    ownerEmail: 'tradeserv-secops@osttra.com',
    notes: 'Handles high-throughput clearing affirmation requests between OSTTRA TradeServ and participant banks.'
  },
  {
    secretId: 75,
    clientId: '331834df-e457-4eae-a9f7-09a73dcb21c0',
    applicationName: 'MarkitWire (Rates & Credit Affirmation)',
    environment: 'PROD' as const,
    clientSecret: 'dd1381ea2f1acdd4dd32dbecded0bb375700729ebccf11627bdd552ef86abd',
    secretHint: 'Mg1*******',
    createdDate: '2026-06-30 03:44:33+00',
    expiryDate: '2026-10-15 03:44:33+00', // ~41 days left -> Expiring in 3 months! (RED)
    ownerEmail: 'ajay.swarnkar@osttra.com',
    notes: 'Real-time trade validation & lifecycle event affirmation node connecting to central SSO token endpoint.'
  },
  {
    secretId: 76,
    clientId: 'f8a4fbb4-d34c-418e-9484-9adc26feefed',
    applicationName: 'Traiana Harmony Legacy FX Feed',
    environment: 'PROD' as const,
    clientSecret: 'abecf3e6143721328987a04bc29e18b03248feff7af704c9e4aa1aef9789dec4',
    secretHint: 'g_p*******',
    createdDate: '2026-06-30 03:45:14+00',
    expiryDate: '2026-08-25 03:45:14+00', // EXPIRED 10 days ago! -> RED & Delete button visible
    ownerEmail: 'traiana-devops@osttra.com',
    notes: 'Legacy FX post-trade feed. Replaced by Harmony v2 connector. Expired credentials require purging.'
  },
  {
    secretId: 77,
    clientId: '27792c29-291a-416f-9cf0-ad36fb93a5011',
    applicationName: 'TriOptima TriResolve Portfolio Rec',
    environment: 'PROD' as const,
    clientSecret: 'd6d8ecaa4d6bf19c8bed1ff2c1d100ca0deb154ebdc2ca595dae8ed011c546b611f7',
    secretHint: 'xyg*******',
    createdDate: '2026-06-30 03:45:51+00',
    expiryDate: '2026-11-20 03:45:51+00', // ~77 days left -> Expiring in 3 months! (RED)
    ownerEmail: 'trioptima-infra@osttra.com',
    notes: 'Automated portfolio reconciliation engine querying member bilateral collateral positions.'
  },
  {
    secretId: 78,
    clientId: '2cf3edca-de85-4712-ba99-66e11abecb02',
    applicationName: 'OSTTRA TradeClear Margin Service',
    environment: 'PROD' as const,
    clientSecret: '2f190cbdcbacdc2197d600badcbacdb4e13e0110736b7713e4b43c034176afb508',
    secretHint: 'k-q*******',
    createdDate: '2026-06-30 03:46:14+00',
    expiryDate: '2027-06-30 03:46:14+00', // ~299 days left -> Healthy
    ownerEmail: 'tradeclear-core@osttra.com',
    notes: 'Intraday margin calculation and real-time CCP margin call dispatch subsystem.'
  },
  {
    secretId: 79,
    clientId: '1076149d-deca-47da-b291-04fafea9f87b',
    applicationName: 'CFD Clearing Hub Engine',
    environment: 'UAT' as const,
    clientSecret: '757acd7357c03530c0eba2b6ccf18cf27fe568d0b01b564dcfe1307ea92dd95c',
    secretHint: 'fLQ*******',
    createdDate: '2026-07-02 06:21:59+00',
    expiryDate: '2027-07-02 06:21:59+00', // ~301 days left -> Healthy
    ownerEmail: 'cfd-dev-uat@osttra.com',
    notes: 'Contract for Difference (CFD) pre-settlement clearing simulator and testing harnesses.'
  },
  {
    secretId: 80,
    clientId: 'ad1d6f42-14cf-4158-9c3e-755a0f271108',
    applicationName: 'Salesforce Financial Cloud SSO',
    environment: 'PROD' as const,
    clientSecret: '560bbca4bfe58cbfebdca3feffb6ba8da735d1239bfanc5fd77eccbf0ba7cc3f',
    secretHint: 'J0Q*******',
    createdDate: '2026-07-02 06:22:48+00',
    expiryDate: '2027-07-02 06:22:48+00', // ~301 days left -> Healthy
    ownerEmail: 'crm-admin@osttra.com',
    notes: 'Backend synchronization of institutional participant profiles with OSTTRA Single Sign-On.'
  },
  {
    secretId: 81,
    clientId: 'df964c0c-5a0e-4396-9ea2-e53aeb30b5f4',
    applicationName: 'Old Settlement Batch Worker (Decommissioned)',
    environment: 'DEV' as const,
    clientSecret: '27d7b7df5bf7d19070fb71c3207046bee64d5a08131fe8236bcbc3b05b36a7',
    secretHint: 'IDQ*******',
    createdDate: '2026-07-02 06:23:23+00',
    expiryDate: '2026-08-30 06:23:23+00', // EXPIRED 5 days ago! -> RED & Delete button visible
    ownerEmail: 'dev-sandbox-cleanup@osttra.com',
    notes: 'Decommissioned microservice worker. Expired in DEV sandbox; eligible for immediate deletion.'
  },
  {
    secretId: 82,
    clientId: 'e1d8ccc0-3117-4d56-92ca-4b7c855c5f31',
    applicationName: 'Snowflake Data Lake Analytical Connector',
    environment: 'PROD' as const,
    clientSecret: '3003b3567b1a01b6fa73d657cdeb4bfa1f512fb9eb54dd3bac81af2f1b3caeba01',
    secretHint: 'S-J*******',
    createdDate: '2026-07-02 06:24:00+00',
    expiryDate: '2026-10-02 06:24:00+00', // ~28 days left -> Expiring in 3 months! (RED)
    ownerEmail: 'bi-analytics@osttra.com',
    notes: 'Nightly batch ETL extracts streaming trade status snapshots into Snowflake warehouse.'
  },
  {
    secretId: 83,
    clientId: '96bab3b6-1ccf-48eb-95e4-0dd82fc0fcf9',
    applicationName: 'Reset Risk Benchmark Pricing Engine',
    environment: 'PROD' as const,
    clientSecret: '318cbe956c65c385856e90fa610c9e676ca0e0003f8a01ab54017e13cf3f420',
    secretHint: '7MJ*******',
    createdDate: '2026-07-02 06:24:35+00',
    expiryDate: '2027-07-02 06:24:35+00', // ~301 days left -> Healthy
    ownerEmail: 'reset-pricing@osttra.com',
    notes: 'Risk basis mitigation calculating risk exposures across swaps, FRAs, and swaptions.'
  },
  {
    secretId: 84,
    clientId: 'e1130fb5-1ae3-4868-a544-307bfcacbdc3',
    applicationName: 'Bloomberg TOMS Order Flow Bridge',
    environment: 'PROD' as const,
    clientSecret: 'eb14b6f3d7135a70098df3114d5e87bb13c1fb9b311ffb3ef75639aed97c5720',
    secretHint: 'Pka*******',
    createdDate: '2026-07-02 06:25:09+00',
    expiryDate: '2027-07-02 06:25:09+00', // ~301 days left -> Healthy
    ownerEmail: 'connectivity@osttra.com',
    notes: 'Fixed-income order matching engine receiving straight-through processing tickets.'
  },
  {
    secretId: 85,
    clientId: 'c5180606-0d3c-4651-aad4-0dbdfc54d286',
    applicationName: 'JPMorgan Chase Direct Affirmation Node',
    environment: 'PROD' as const,
    clientSecret: '1e09f6d39cd15a6ba58bc74bce04c0926c2cbf9bd1a1c90aa01abc190cbfb',
    secretHint: 'JH2*******',
    createdDate: '2026-07-02 06:25:39+00',
    expiryDate: '2027-07-02 06:25:39+00', // ~301 days left -> Healthy
    ownerEmail: 'partner-integrations@osttra.com',
    notes: 'Dedicated B2B OAuth client credentials flow for JPMorgan Chase automated affirmation queue.'
  },
  {
    secretId: 86,
    clientId: 'cf0b5ce5-c05e-4329-a235-079cfc87eb20',
    applicationName: 'Barclays Cross-Asset Execution Ingress',
    environment: 'PROD' as const,
    clientSecret: '81ecff42638c3223f6ad4d7716757a7d37b75dc7e7a0db5e0e0904820d081829',
    secretHint: 'TUQ*******',
    createdDate: '2026-07-02 06:26:25+00',
    expiryDate: '2026-11-12 06:26:25+00', // ~69 days left -> Expiring in 3 months! (RED)
    ownerEmail: 'partner-integrations@osttra.com',
    notes: 'Institutional client gateway for Barclays fixed income & FX trade ingestion.'
  },
  {
    secretId: 87,
    clientId: '07c8c162-443c-470d-be0c-9daf5c34dcd6',
    applicationName: 'Citi Velocity Trade Capture Bridge',
    environment: 'PROD' as const,
    clientSecret: '0dad71d295913c73c4d872081e68646702783d297d7009fc035bb8b06606e938',
    secretHint: '-jy*******',
    createdDate: '2026-07-02 06:27:01+00',
    expiryDate: '2027-07-02 06:27:01+00', // ~301 days left -> Healthy
    ownerEmail: 'partner-integrations@osttra.com',
    notes: 'Inbound trade capture bridge connecting Citi Velocity to OSTTRA affirmation workflow.'
  },
  {
    secretId: 88,
    clientId: '7a6c6c04-4129-44d7-ba07-b11fae057e41',
    applicationName: 'Goldman Sachs Marquee Execution API',
    environment: 'UAT' as const,
    clientSecret: '9ca7672b44cb0fbbf4593847291a0c84857193a0b94857182937482910cbe482',
    secretHint: 'Cnx*******',
    createdDate: '2026-07-02 07:05:50+00',
    expiryDate: '2027-07-02 07:05:50+00', // ~301 days left -> Healthy
    ownerEmail: 'marq-uat@osttra.com',
    notes: 'UAT sandbox testbed for Marquee rates trade feeds and validation checks.'
  },
  {
    secretId: 89,
    clientId: '6e5c4394-eb94-413b-a2a5-957bb018374e',
    applicationName: 'Deutsche Bank Autopool Ingestion Feed',
    environment: 'DEV' as const,
    clientSecret: 'c546417dee064b4119d837482910e74829102938475829102938475829102938',
    secretHint: 'w8u*******',
    createdDate: '2026-08-20 08:49:36+00',
    expiryDate: '2027-08-20 08:49:36+00', // ~350 days left -> Healthy
    ownerEmail: 'dev-sandbox-core@osttra.com',
    notes: 'Internal developer cluster for high volume simulated STP affirmations.'
  },
  {
    secretId: 90,
    clientId: '4f2910ba-b844-4841-8930-9efca9b1092a',
    applicationName: 'BNP Paribas FIX Drop Copy Session (Retired)',
    environment: 'UAT' as const,
    clientSecret: '98fa012019485b0185938472910cbe4829104857182937482910cbe482910485',
    secretHint: 'bNp*******',
    createdDate: '2025-08-10 10:14:00+00',
    expiryDate: '2026-08-10 10:14:00+00', // EXPIRED ~25 days ago -> Delete icon visible
    ownerEmail: 'partner-uat@osttra.com',
    notes: 'Retired UAT FIX session replaced by modern REST Gateway. Expired credentials ready for administrative deletion.'
  },
  {
    secretId: 91,
    clientId: '90cd2814-1e5b-4390-8cb4-224419ad2201',
    applicationName: 'Equities Pre-Trade Validation Gateway (Legacy v1)',
    environment: 'PROD' as const,
    clientSecret: 'e0129485bbdf0185938472910cbe4829104857182937482910cbe48291048571',
    secretHint: 'eQ1*******',
    createdDate: '2025-07-15 04:22:15+00',
    expiryDate: '2026-07-15 04:22:15+00', // EXPIRED ~51 days ago -> Delete icon visible
    ownerEmail: 'equities-secops@osttra.com',
    notes: 'Decommissioned v1 validation gateway. Production token expired; pending administrative purge.'
  },
  {
    secretId: 92,
    clientId: '5b184209-6712-42da-91bb-3108c4098933',
    applicationName: 'Sandbox Mock Liquidity Provider Service',
    environment: 'DEV' as const,
    clientSecret: 'aa58392019485b0185938472910cbe4829104857182937482910cbe482910485',
    secretHint: 'm0k*******',
    createdDate: '2025-08-01 14:00:00+00',
    expiryDate: '2026-08-01 14:00:00+00', // EXPIRED ~34 days ago -> Delete icon visible
    ownerEmail: 'dev-sandbox-cleanup@osttra.com',
    notes: 'Temporary sandbox mock liquidity provider test harness. Expired credentials ready for cleanup.'
  },
  {
    secretId: 93,
    clientId: '8114be01-9fa2-44df-9cb1-70014295e810',
    applicationName: 'EuroCCP Clearing Notification Feed (Deprecated)',
    environment: 'PROD' as const,
    clientSecret: 'bf910293847582910293847582910cbe4829104857182937482910cbe4829104',
    secretHint: 'EcP*******',
    createdDate: '2025-06-20 02:11:45+00',
    expiryDate: '2026-06-20 02:11:45+00', // EXPIRED ~76 days ago -> Delete icon visible
    ownerEmail: 'clearing-operations@osttra.com',
    notes: 'Superseded legacy clearing broadcast socket. Deletion recommended to eliminate stale attack surface.'
  }
];

export function getInitialAppSecrets(): AppSecret[] {
  return INITIAL_RAW_SECRETS.map((item) => {
    const { daysRemaining, status } = calculateExpiryInfo(item.expiryDate);
    return {
      id: `sec-${item.secretId}`,
      secretId: item.secretId,
      clientId: item.clientId,
      applicationName: item.applicationName,
      environment: item.environment,
      clientSecret: item.clientSecret,
      secretHint: item.secretHint,
      createdDate: item.createdDate,
      expiryDate: item.expiryDate,
      daysRemaining,
      status,
      ownerEmail: item.ownerEmail,
      notes: item.notes
    };
  });
}

/**
 * Pre-configured detailed audit history records for key applications
 */
export const SPECIALIZED_APP_AUDIT_LOGS: Record<string, AppSecretAuditRecord[]> = {
  'OSTTRA TradeServ Gateway': [
    {
      id: 'aud-tradeserv-v3',
      secretId: 'sec-44',
      applicationName: 'OSTTRA TradeServ Gateway',
      clientId: 'bd1afe1d-c204-436b-af6c-cd664234018f',
      environment: 'PROD',
      version: 'v3 (Current - Expired)',
      timestamp: '2026-09-01 09:00:00+00',
      action: 'EXPIRY_DATE_UPDATED',
      actor: 'secops-automation@osttra.com',
      ticketId: 'INC-44820',
      ipAddress: '10.240.12.88 (AWS eu-west-1 Vault Controller)',
      details: {
        secretHint: '8Vj*******',
        expiryDate: '2026-09-01 09:00:00+00',
        createdDate: '2026-06-30 03:43:38+00',
        status: 'Expired',
        daysRemaining: -6,
        ownerEmail: 'tradeserv-secops@osttra.com',
        notes: 'Secret expired past decommission deadline. Traffic should be directed to secondary key or revoked.',
        rotationReason: 'Sunset schedule executed. Gateway credentials expired on 01 Sep 2026.',
        authAlgorithm: 'HMAC-SHA512 (512-bit Secret)'
      }
    },
    {
      id: 'aud-tradeserv-v2',
      secretId: 'sec-44',
      applicationName: 'OSTTRA TradeServ Gateway',
      clientId: 'bd1afe1d-c204-436b-af6c-cd664234018f',
      environment: 'PROD',
      version: 'v2 (Previous Rotation)',
      timestamp: '2026-06-30 03:43:38+00',
      action: 'CLIENT_SECRET_ROTATED',
      actor: 'ajay.swarnkar@osttra.com',
      ticketId: 'SEC-9014',
      ipAddress: '192.168.4.112 (London HQ Corporate SSO)',
      details: {
        secretHint: '8Vj*******',
        expiryDate: '2026-09-01 09:00:00+00',
        createdDate: '2026-06-30 03:43:38+00',
        status: 'Critical',
        daysRemaining: 63,
        ownerEmail: 'tradeserv-secops@osttra.com',
        notes: 'Handles high-throughput clearing affirmation requests between OSTTRA TradeServ and participant banks.',
        rotationReason: 'Quarterly compliance credential rotation following financial market infrastructure policy.',
        authAlgorithm: 'HMAC-SHA512 (512-bit Secret)'
      }
    },
    {
      id: 'aud-tradeserv-v1',
      secretId: 'sec-44',
      applicationName: 'OSTTRA TradeServ Gateway',
      clientId: 'bd1afe1d-c204-436b-af6c-cd664234018f',
      environment: 'PROD',
      version: 'v1 (Initial Provisioning)',
      timestamp: '2025-06-30 03:43:38+00',
      action: 'CLIENT_SECRET_CREATED',
      actor: 'devops-provisioner@osttra.com',
      ticketId: 'PROV-1184',
      ipAddress: '10.100.0.15 (Terraform Cloud Pipeline)',
      details: {
        secretHint: '4Kp*******',
        expiryDate: '2026-06-30 03:43:38+00',
        createdDate: '2025-06-30 03:43:38+00',
        status: 'Healthy',
        daysRemaining: 365,
        ownerEmail: 'tradeserv-secops@osttra.com',
        notes: 'Initial production client registration in OSTTRA OAuth2 centralized IdP.',
        rotationReason: 'Initial onboarding of TradeServ microservice mesh.',
        authAlgorithm: 'HMAC-SHA512 (512-bit Secret)'
      }
    }
  ]
};

/**
 * Returns audit records for any given application secret.
 * If specialized history exists, returns it; otherwise generates consistent versioned historical logs.
 */
export function getAuditRecordsForApp(secret: AppSecret): AppSecretAuditRecord[] {
  if (SPECIALIZED_APP_AUDIT_LOGS[secret.applicationName]) {
    return SPECIALIZED_APP_AUDIT_LOGS[secret.applicationName];
  }

  // Generate standard 2-version audit trail for any application
  const currentVersion: AppSecretAuditRecord = {
    id: `aud-${secret.id}-v2`,
    secretId: secret.id,
    applicationName: secret.applicationName,
    clientId: secret.clientId,
    environment: secret.environment,
    version: 'v2 (Current)',
    timestamp: secret.createdDate,
    action: secret.daysRemaining <= 0 ? 'EXPIRY_DATE_UPDATED' : 'CLIENT_SECRET_ROTATED',
    actor: secret.ownerEmail || 'admin@osttra.com',
    ticketId: `SEC-${secret.secretId ? 5000 + secret.secretId : 7200}`,
    ipAddress: '192.168.12.44 (OSTTRA Security Gateway)',
    details: {
      secretHint: secret.secretHint,
      expiryDate: secret.expiryDate,
      createdDate: secret.createdDate,
      status: secret.status,
      daysRemaining: secret.daysRemaining,
      ownerEmail: secret.ownerEmail || 'secops@osttra.com',
      notes: secret.notes || 'Production operational credential.',
      rotationReason: 'Lifecycle credential management update and key refresh.',
      authAlgorithm: 'HMAC-SHA512 (512-bit Secret)'
    }
  };

  // Previous v1
  const prevDate = new Date(normalizeDateString(secret.createdDate).getTime() - 90 * 24 * 60 * 60 * 1000);
  const prevDateStr = prevDate.toISOString().replace('T', ' ').slice(0, 19) + '+00';
  const prevExpiry = new Date(normalizeDateString(secret.createdDate).getTime());
  const prevExpiryStr = prevExpiry.toISOString().replace('T', ' ').slice(0, 19) + '+00';

  const v1Record: AppSecretAuditRecord = {
    id: `aud-${secret.id}-v1`,
    secretId: secret.id,
    applicationName: secret.applicationName,
    clientId: secret.clientId,
    environment: secret.environment,
    version: 'v1 (Initial Provisioning)',
    timestamp: prevDateStr,
    action: 'CLIENT_SECRET_CREATED',
    actor: 'system-provisioner@osttra.com',
    ticketId: `PROV-${secret.secretId ? 1000 + secret.secretId : 3310}`,
    ipAddress: '10.100.4.12 (CI/CD Pipeline)',
    details: {
      secretHint: secret.secretHint.slice(0, 2) + 'a*******',
      expiryDate: prevExpiryStr,
      createdDate: prevDateStr,
      status: 'Healthy',
      daysRemaining: 180,
      ownerEmail: secret.ownerEmail || 'secops@osttra.com',
      notes: 'Initial client credentials issued upon service registration.',
      rotationReason: 'Initial setup and credential distribution to API client.',
      authAlgorithm: 'HMAC-SHA512 (512-bit Secret)'
    }
  };

  return [currentVersion, v1Record];
}
