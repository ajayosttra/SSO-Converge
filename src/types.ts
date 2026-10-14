export interface Domain {
  id: number;
  domain: string;
  federated: 'Yes' | 'No';
  mfaStatus: 'Enabled' | 'Disabled';
  registeredBy: string;
  registeredOn: string;
  updatedBy: string;
  updatedOn: string;
  approvedBy: string | null;
  approvedOn: string | null;
  ssoobTicket: string;
  infosecTicket?: string;
  status: 'Enabled' | 'Disabled' | 'Pending' | 'Pending Review';
  collaborationType: 'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED' | '';
  samlRegistrationId: string;
  migratedUsers?: string[];
  whitelistedIps?: string[];
}

export type OperationType = 'Create' | 'Update';
export type OperationName = 'Domain Registration' | 'Domain Migration' | 'Domain Update';

export interface PendingRequest {
  requestId: number;
  operation: OperationName;
  operationType: OperationType;
  initiatedBy: string;
  initiatedOn: string;
  domainId: number;
  domainName: string;
  payload: Partial<Domain>;
  approvedBy: string | null;
  approvedOn: string | null;
}

export interface User {
  email: string;
  displayName: string;
  initials: string;
}

export interface Application {
  name: string;
  environment: 'UAT' | 'PROD';
}

export interface AuditSnapshot {
  domain: string;
  federated: 'Yes' | 'No';
  collaborationType: 'B2B' | 'SAML' | 'OTP' | 'ENTRA_FED' | 'ENTRA_NON_FED' | '';
  samlRegistrationId: string;
  mfaStatus: 'Enabled' | 'Disabled';
  whitelistedIps?: string[];
  status: 'Enabled' | 'Disabled' | 'Pending' | 'Pending Review';
  ssoobTicket: string;
  infosecTicket?: string;
  actionBy: string;
  reviewer?: string;
  timestamp: string;
}

export interface AuditRecord {
  id: string;
  domainId: number;
  domain: string;
  timestamp: string;
  actionBy: string;
  reviewer?: string;
  ticketId: string;
  description: string;
  status: 'Enabled' | 'Disabled' | 'Pending' | 'Pending Review';
  actionType: 'Initial' | 'Update';
  snapshot: AuditSnapshot;
}

export interface UserAuditSnapshot {
  email: string;
  displayName?: string;
  domain: string;
  status: 'Enabled' | 'Disabled' | 'Pending';
  mfaStatus: 'Enabled' | 'Disabled';
  collaborationType: string;
  roles: string[];
  applications: string[];
  ticketId: string;
  actionBy: string;
  reviewer?: string;
  timestamp: string;
}

export interface UserAuditRecord {
  id: string;
  userId?: string;
  email: string;
  domain?: string;
  timestamp: string;
  actionBy: string;
  reviewer?: string;
  ticketId: string;
  description: string;
  status: 'Enabled' | 'Disabled' | 'Pending';
  actionType: 'Initial' | 'Update';
  snapshot: UserAuditSnapshot;
}

export interface DomainUser {
  email: string;
  applications: { name: string; environment: 'UAT' | 'PROD' }[];
  lastLogin: string;
}

export type BlocklistCategory = 'Public Webmail' | 'Security Risk' | 'Disposable/Temporary' | 'Competitor' | 'Regulatory' | 'Custom';

export interface BlacklistedDomain {
  id: string;
  domain: string;
  reason: string;
  category: BlocklistCategory;
  ticketId?: string;
  addedBy: string;
  addedOn: string;
  updatedBy?: string;
  updatedOn?: string;
  enabled: boolean;
  notes?: string;
}

export type SamlStatus = 'SP_METADATA_GENERATED' | 'CLIENT_METADATA_CONFIGURED' | 'ACTIVE_LINKED';

export interface SamlMetadataConfig {
  id: string;
  domain: string; // The primary single domain for this SAML metadata setup
  domains?: string[]; // Optional array of domains referencing/sharing this setup
  ticketId: string;
  samlRegistrationId: string;
  osttraMetadataUrl: string;
  spEntityId: string;
  spAcsUrl: string;
  
  // Client IdP Metadata fields
  clientMetadataType?: 'URL' | 'MANUAL';
  clientMetadataUrl?: string;
  clientEntityId?: string;
  clientSsoUrl?: string;
  clientPublicCert?: string;
  
  status: SamlStatus;
  createdBy: string;
  createdOn: string;
  updatedBy?: string;
  updatedOn?: string;
  linkedDomainIds?: number[];
  notes?: string;
}

export type ApiHealthStatus = 'Healthy' | 'Degraded' | 'Down';

export type ApiCategory = 
  | 'User Management'
  | 'Active Directory & Groups'
  | 'Domain Setup & Migration'
  | 'Authentication & Federation'
  | 'Security & Whitelisting';

export interface ApiDependency {
  name: string;
  type: 'Database' | 'LDAP/AD' | 'Azure Entra' | 'Cache' | 'Crypto/HSM' | 'Queue';
  status: 'Healthy' | 'Degraded' | 'Down';
  latencyMs: number;
}

export interface ApiProbeLog {
  id: string;
  endpointId: string;
  endpointName: string;
  method: string;
  path: string;
  timestamp: string;
  status: ApiHealthStatus;
  httpStatus: number;
  latencyMs: number;
  message: string;
}

export interface ApiEndpointHealth {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  category: ApiCategory;
  description: string;
  status: ApiHealthStatus;
  httpStatus: number;
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
  sampleRequestPayload?: string;
  sampleResponsePayload?: string;
  dependencies: ApiDependency[];
  recentLatencies: number[];
  errorRate: number;
  rateLimit: string;
  authRequired: string;
  environment: 'UAT' | 'PROD';
  docsUrl?: string;
}

export type SecretType = 'Client Secret' | 'SAML X.509 Certificate' | 'mTLS Client Cert' | 'JWT Token Signing Key' | 'API Key';

export type SecretExpiryStatus = 'Expired' | 'Critical' | 'Warning' | 'Healthy';

export interface AppSecretAuditRecord {
  id: string;
  secretId: string;
  applicationName: string;
  clientId: string;
  environment: 'PROD' | 'UAT' | 'DEV';
  version: string;
  timestamp: string;
  action: 'CLIENT_SECRET_ROTATED' | 'CLIENT_SECRET_CREATED' | 'EXPIRY_DATE_UPDATED' | 'SECRET_ACCESSED' | 'POLICY_ENFORCEMENT';
  actor: string;
  ticketId: string;
  ipAddress: string;
  details: {
    secretHint: string;
    expiryDate: string;
    createdDate: string;
    status: 'Expired' | 'Critical' | 'Warning' | 'Healthy';
    daysRemaining: number;
    ownerEmail: string;
    notes?: string;
    rotationReason: string;
    authAlgorithm?: string;
  };
}

export interface AppSecret {
  id: string;
  secretId?: number; // DB sequence like 74, 75 in pgAdmin screenshot
  clientId: string; // character varying (255) - UUID format e.g. 'bd1afe1d-c204-436b-af6c-cd664234018f'
  applicationName: string; // Application name e.g. 'OSTTRA TradeServ Gateway'
  environment: 'PROD' | 'UAT' | 'DEV'; // Environment
  clientSecret: string; // character varying (512) - hex hash string like in screenshot
  secretHint: string; // character varying (10) - e.g. '8Vj*******'
  createdDate: string; // Timestamp with time zone e.g. '2026-06-30 03:43:38+00'
  expiryDate: string; // Timestamp with time zone e.g. '2026-09-28 03:43:38+00'
  daysRemaining: number;
  status: SecretExpiryStatus; // Computed: Critical/Warning if <= 90 days (3 months), Expired if <= 0
  ownerEmail?: string;
  secondaryContact?: string;
  domainsAssociated?: string[];
  lastRotated?: string;
  notes?: string;
}

export interface GChatWebhookConfig {
  webhookUrl: string;
  spaceName: string;
  enabled: boolean;
  alertThresholdDays: number; // default 90 days
  notifyOnCriticalOnly: boolean;
  channelMentions?: string; // e.g. '<users/all>' or '@sso-secops'
  includeRunbookLink: boolean;
  lastTestSentAt?: string;
}

export interface GChatAlertLog {
  id: string;
  timestamp: string;
  secretId: string;
  applicationName: string;
  secretName: string;
  secretType: SecretType;
  daysRemaining: number;
  expiryDate: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  spaceName: string;
  targetWebhookUrl: string;
  summary: string;
  deliveredPayloadPreview?: string;
}

export type TraianaApp = 'CFD' | 'Harmony' | 'TradeServ' | 'CreditLink' | 'Netting' | 'TRM' | 'CRDS';

export type VerificationStatus = 
  | 'VERIFIED_BY_ADMIN'
  | 'VERIFIED_BY_OTP'
  | 'PENDING_VERIFICATION'
  | 'LOCKED_EXHAUSTED';

export interface TraianaUserSkipRecord {
  id: string;
  userName: string;
  application: string;
  verifiedEmail: string | null;
  currentProvidedEmail?: string | null;
  skipCount: number; // 0, 1, 2, or 3
  maxSkips: number; // default 3
  status: VerificationStatus;
  isLocked: boolean;
  lastLoginAttempt: string;
  lastSkipTimestamp?: string | null;
  verifiedOn?: string | null;
  verifiedBy?: string | null; // e.g. "OSTTRA Admin (ajay.swarnkar@osttra.com)"
  ticketId?: string;
  resetCountHistory: number;
  lastResetOn?: string | null;
  lastResetBy?: string | null;
  notes?: string;
}

export interface TraianaSkipAuditRecord {
  id: string;
  recordId: string;
  userName: string;
  application: string;
  action: 'RESET_SKIP_COUNTER' | 'ADMIN_VERIFY_EMAIL' | 'USER_SKIP_INCREMENTED' | 'OTP_VERIFIED' | 'USER_UNLOCKED';
  performedBy: string;
  timestamp: string;
  ticketId: string;
  previousSkipCount: number;
  newSkipCount: number;
  previousEmail: string | null;
  newVerifiedEmail: string | null;
  previousStatus: VerificationStatus;
  newStatus: VerificationStatus;
  reason?: string;
  notes?: string;
}

export type MfaCollaborationType = 'Fed' | 'Non-Fed' | 'SAML' | 'OTP';

export interface UserMfaRecord {
  id: string;
  email: string;
  displayName: string;
  domain: string;
  mfaStatus: 'Enable' | 'Disable';
  collaborationType: MfaCollaborationType;
  deviceModel?: string;
  deviceRegisteredOn?: string;
  lastMfaAuth?: string;
  mfaMethod?: 'Microsoft Authenticator' | 'Hardware Security Key (FIDO2)' | 'SMS OTP' | 'Email OTP' | 'Google Authenticator';
  lastResetOn?: string | null;
  lastResetBy?: string | null;
  lastResetTicket?: string | null;
  resetCount: number;
  requiresReEnrollment: boolean;
  notes?: string;
}

export interface MfaResetAuditRecord {
  id: string;
  scope: 'USER' | 'MULTI_USER' | 'DOMAIN';
  target: string;
  emails: string[];
  performedBy: string;
  timestamp: string;
  ticketId: string;
  status: 'Successful' | 'Failed';
  collaborationType: string;
  reason: string;
  details?: string;
  failureReason?: string;
}

// --- SSO User Login Detail & Activity Log Types ---

export type SsoAuthProtocol = 'SAML 2.0' | 'Entra ID (Fed)' | 'Entra ID (Non-Fed)' | 'B2B Guest' | 'OTP / MFA';
export type SsoLoginStatus = 'SUCCESS' | 'MFA_REQUIRED' | 'FAILED';

export interface SsoUserLoginRecord {
  id: string;
  email: string;
  displayName?: string;
  domain: string;
  applicationName: string;
  environment: 'PROD' | 'UAT';
  lastLoginTimestamp: string;
  rawTimestamp: number;
  protocol: SsoAuthProtocol;
  status: SsoLoginStatus;
  clientIp: string;
  location: string;
  sessionId: string;
  idpEntityId?: string;
  userAgent?: string;
  failureReason?: string;
}

export interface UserAppLoginSummary {
  email: string;
  displayName: string;
  domain: string;
  applicationName: string;
  environment: 'PROD' | 'UAT';
  lastLoginTimestamp: string;
  rawTimestamp: number;
  totalLogins: number;
  lastClientIp: string;
  lastProtocol: SsoAuthProtocol;
  lastStatus: SsoLoginStatus;
}

