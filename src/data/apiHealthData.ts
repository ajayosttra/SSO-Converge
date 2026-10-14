import { ApiEndpointHealth, ApiProbeLog } from '../types';

export const INITIAL_API_ENDPOINTS: ApiEndpointHealth[] = [
  {
    id: 'api-user-create',
    name: 'Create User in SSO',
    method: 'POST',
    path: '/api/v1/sso/users',
    category: 'User Management',
    description: 'Provisions a new federated or non-federated user identity in the SSO directory, triggers invitation or activation emails, and links initial application permissions.',
    status: 'Healthy',
    httpStatus: 201,
    latencyMs: 42,
    uptimePercent: 99.98,
    lastChecked: 'Just now',
    errorRate: 0.02,
    rateLimit: '1200 req/min',
    authRequired: 'Bearer Token (Scope: sso.users.write)',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      email: "alex.mercer@osttra.com",
      displayName: "Alex Mercer",
      domain: "osttra.com",
      collaborationType: "SAML",
      applications: [
        { name: "CFD", environment: "PROD" },
        { name: "CRDS", environment: "PROD" }
      ],
      mfaEnforced: true,
      ticketReference: "SSOOB-1049"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      result: "success",
      userId: "usr_ost_993410",
      email: "alex.mercer@osttra.com",
      domain: "osttra.com",
      collaborationType: "SAML",
      samlRegistrationId: "166528bf-8a97-42a1-b206-05efd9a790c4",
      mfaEnforced: true,
      provisionedAt: "2026-09-04T07:30:15.120Z",
      status: "Active"
    }, null, 2),
    dependencies: [
      { name: 'SSO Primary PostgreSQL', type: 'Database', status: 'Healthy', latencyMs: 4 },
      { name: 'Azure Entra ID Graph API', type: 'Azure Entra', status: 'Healthy', latencyMs: 28 },
      { name: 'Audit & Telemetry Bus', type: 'Queue', status: 'Healthy', latencyMs: 10 }
    ],
    recentLatencies: [45, 41, 44, 48, 39, 43, 40, 42, 46, 42]
  },
  {
    id: 'api-ad-group-assign',
    name: 'Assign AD Security Group to User',
    method: 'POST',
    path: '/api/v1/ad/groups/assign',
    category: 'Active Directory & Groups',
    description: 'Binds Active Directory / Azure Entra ID security groups to a target user, establishing role-based application entitlements and group claims in SSO assertion tokens.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 38,
    uptimePercent: 99.96,
    lastChecked: 'Just now',
    errorRate: 0.04,
    rateLimit: '800 req/min',
    authRequired: 'Bearer Token (Scope: directory.groups.write)',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      userId: "usr_ost_993410",
      userEmail: "alex.mercer@osttra.com",
      groupDn: "CN=SEC-OSTTRA-TRADERS-PROD,OU=Trading,DC=osttra,DC=com",
      groupId: "grp_osttra_traders_01",
      reason: "Trader onboarding for MarkitWire & Traiana Harmony",
      ticketReference: "SEC-8921"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      status: "success",
      message: "Security group membership assigned successfully",
      assignmentId: "asgn_9482103",
      userId: "usr_ost_993410",
      groupName: "SEC-OSTTRA-TRADERS-PROD",
      assignedAt: "2026-09-04T07:31:02.842Z",
      directorySyncState: "Synchronized"
    }, null, 2),
    dependencies: [
      { name: 'Active Directory Domain Controller (DC-01)', type: 'LDAP/AD', status: 'Healthy', latencyMs: 15 },
      { name: 'Azure Entra Directory Sync', type: 'Azure Entra', status: 'Healthy', latencyMs: 20 },
      { name: 'Redis Cache Cluster', type: 'Cache', status: 'Healthy', latencyMs: 3 }
    ],
    recentLatencies: [36, 42, 39, 37, 45, 38, 41, 35, 40, 38]
  },
  {
    id: 'api-domain-enquiry',
    name: 'Domain Setup Enquiry',
    method: 'GET',
    path: '/api/v1/domains/enquiry',
    category: 'Domain Setup & Migration',
    description: 'Enquires and resolves SSO domain federation attributes, collaboration type (SAML / ENTRA_FED / ENTRA_NON_FED / OTP), MFA requirement, SAML SP registration ID, and whitelisted IP ranges.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 18,
    uptimePercent: 100.0,
    lastChecked: 'Just now',
    errorRate: 0.0,
    rateLimit: '5000 req/min',
    authRequired: 'Bearer Token (Scope: sso.domain.read)',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      enquiryQuery: "?domain=osttra.com&includeWhitelistedIps=true&includeSamlMetadata=true"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      domain: "osttra.com",
      federated: "Yes",
      collaborationType: "B2B",
      mfaStatus: "Enabled",
      status: "Enabled",
      samlRegistrationId: "166528bf-8a97-42a1-b206-05efd9a790c4",
      whitelistedIps: ["192.168.1.0/24", "10.200.15.50"],
      ssoobTicket: "DMGS-6400",
      infosecTicket: "SEC-8921",
      lastUpdated: "2026-08-12T14:22:00Z"
    }, null, 2),
    dependencies: [
      { name: 'SSO Metadata Registry', type: 'Database', status: 'Healthy', latencyMs: 3 },
      { name: 'Edge Redis Cache (Multi-Region)', type: 'Cache', status: 'Healthy', latencyMs: 2 },
      { name: 'DNS & Cert Validator', type: 'Crypto/HSM', status: 'Healthy', latencyMs: 13 }
    ],
    recentLatencies: [18, 17, 19, 21, 16, 18, 20, 17, 18, 18]
  },
  {
    id: 'api-domain-migration',
    name: 'Domain & User Migration',
    method: 'POST',
    path: '/api/v1/domains/migration',
    category: 'Domain Setup & Migration',
    description: 'Executes atomic transition of domain authentication mode (e.g. Non-Federated to Entra ID or SAML 2.0) and reconciles user credentials and identity claims.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 84,
    uptimePercent: 99.92,
    lastChecked: 'Just now',
    errorRate: 0.08,
    rateLimit: '300 req/min',
    authRequired: 'mTLS + Admin API Key',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      domain: "abc.com",
      sourceCollaborationType: "ENTRA_NON_FED",
      targetCollaborationType: "ENTRA_FED",
      targetSamlRegistrationId: "",
      targetWhitelistedIps: ["10.0.0.1 - 10.0.0.254"],
      migrateUsers: true,
      selectedUserEmails: ["john.doe@abc.com", "jane.smith@abc.com"],
      ssoobTicket: "MIG-9820",
      initiatedBy: "ajay.swarnkar@osttra.com"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      migrationJobId: "mig_job_8391032",
      domain: "abc.com",
      status: "Completed",
      federated: "Yes",
      collaborationType: "ENTRA_FED",
      migratedUsersCount: 2,
      executionDurationMs: 84,
      initiatedOn: "2026-09-04T07:32:10.450Z",
      completedOn: "2026-09-04T07:32:10.534Z"
    }, null, 2),
    dependencies: [
      { name: 'Migration Workflow Coordinator', type: 'Queue', status: 'Healthy', latencyMs: 18 },
      { name: 'Azure Entra ID Management API', type: 'Azure Entra', status: 'Healthy', latencyMs: 46 },
      { name: 'SSO Database Transaction Manager', type: 'Database', status: 'Healthy', latencyMs: 20 }
    ],
    recentLatencies: [82, 85, 91, 79, 88, 84, 86, 81, 89, 84]
  },
  {
    id: 'api-ad-group-remove',
    name: 'Remove User from Security Group',
    method: 'DELETE',
    path: '/api/v1/ad/groups/remove',
    category: 'Active Directory & Groups',
    description: 'Revokes membership of a specified user identity from an Active Directory or Azure Entra ID security group, immediately invalidating scoped SSO permissions.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 36,
    uptimePercent: 99.97,
    lastChecked: 'Just now',
    errorRate: 0.03,
    rateLimit: '800 req/min',
    authRequired: 'Bearer Token (Scope: directory.groups.write)',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      userId: "usr_ost_993410",
      userEmail: "alex.mercer@osttra.com",
      groupId: "grp_osttra_traders_01",
      groupName: "SEC-OSTTRA-TRADERS-PROD",
      reason: "Departed Trading Desk / Offboarded from FX Connect",
      ticketReference: "SEC-9012"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      status: "success",
      message: "User successfully removed from security group",
      revocationId: "rev_89321",
      groupId: "grp_osttra_traders_01",
      revokedAt: "2026-09-04T07:33:00.102Z",
      activeMembershipsCount: 2
    }, null, 2),
    dependencies: [
      { name: 'Active Directory Domain Controller (DC-01)', type: 'LDAP/AD', status: 'Healthy', latencyMs: 14 },
      { name: 'Azure Entra Directory Sync', type: 'Azure Entra', status: 'Healthy', latencyMs: 19 },
      { name: 'Token Cache Invalidation Hook', type: 'Cache', status: 'Healthy', latencyMs: 3 }
    ],
    recentLatencies: [35, 38, 34, 40, 37, 35, 39, 36, 33, 36]
  },
  {
    id: 'api-auth-token-introspect',
    name: 'SSO Token Introspection & Validation',
    method: 'POST',
    path: '/api/v1/auth/token/introspect',
    category: 'Authentication & Federation',
    description: 'Introspects and cryptographically verifies active SSO bearer tokens, checking JWT/SAML signature, issuer authority, expiration timestamp, and claims.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 14,
    uptimePercent: 99.99,
    lastChecked: 'Just now',
    errorRate: 0.01,
    rateLimit: '10000 req/min',
    authRequired: 'OAuth2 Client Credentials',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      token: "eyJhbGciOiJSUzI1NiIsImtpZCI6Im9zdHRyYS1zcy0yMDI2In0.ey...",
      tokenTypeHint: "access_token"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      active: true,
      scope: "read:applications write:trades",
      client_id: "osttra_markitwire_client",
      sub: "ajay.swarnkar@osttra.com",
      domain: "osttra.com",
      federated: true,
      collaborationType: "B2B",
      exp: 1788514800,
      iss: "https://sso.osttra.com/auth"
    }, null, 2),
    dependencies: [
      { name: 'OSTTRA Key Vault / HSM', type: 'Crypto/HSM', status: 'Healthy', latencyMs: 4 },
      { name: 'Token Revocation Blacklist', type: 'Cache', status: 'Healthy', latencyMs: 2 }
    ],
    recentLatencies: [15, 14, 13, 16, 14, 14, 15, 13, 14, 14]
  },
  {
    id: 'api-saml-metadata-sp',
    name: 'SAML 2.0 SP Metadata Discovery',
    method: 'GET',
    path: '/api/v1/saml/metadata/sp',
    category: 'Authentication & Federation',
    description: 'Serves the official OSTTRA Service Provider (SP) XML entity descriptor metadata containing public signing X.509 certs, ACS URLs, and Single Logout endpoints.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 12,
    uptimePercent: 100.0,
    lastChecked: 'Just now',
    errorRate: 0.0,
    rateLimit: '10000 req/min',
    authRequired: 'Public / Unauthenticated',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      query: "?registrationId=166528bf-8a97-42a1-b206-05efd9a790c4&format=xml"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      entityID: "https://sso.osttra.com/saml/sp/166528bf-8a97-42a1-b206-05efd9a790c4",
      acsUrl: "https://sso.osttra.com/saml/acs/166528bf-8a97-42a1-b206-05efd9a790c4",
      binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
      signingCertificateValidUntil: "2029-06-30T23:59:59Z",
      status: "ACTIVE_LINKED"
    }, null, 2),
    dependencies: [
      { name: 'SAML SP Metadata Engine', type: 'Cache', status: 'Healthy', latencyMs: 2 },
      { name: 'X.509 Certificate Keystore', type: 'Crypto/HSM', status: 'Healthy', latencyMs: 3 }
    ],
    recentLatencies: [12, 11, 14, 12, 13, 12, 11, 13, 12, 12]
  },
  {
    id: 'api-ip-whitelist-evaluate',
    name: 'IP Whitelist Policy Evaluation',
    method: 'POST',
    path: '/api/v1/security/ip-whitelist/evaluate',
    category: 'Security & Whitelisting',
    description: 'Evaluates an incoming client IP address against the target domain whitelisting rules and CIDR ranges to authorize login packets.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 8,
    uptimePercent: 100.0,
    lastChecked: 'Just now',
    errorRate: 0.0,
    rateLimit: '20000 req/min',
    authRequired: 'Internal Service Token',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      clientIp: "192.168.1.100",
      targetDomain: "osttra.com",
      application: "CFD",
      environment: "PROD"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      allowed: true,
      matchedRule: "192.168.1.0/24",
      ruleType: "CIDR_SUBNET",
      domain: "osttra.com",
      evaluatedInMs: 2.1,
      verdict: "PERMIT"
    }, null, 2),
    dependencies: [
      { name: 'In-Memory Radix Tree IP Matcher', type: 'Cache', status: 'Healthy', latencyMs: 1 },
      { name: 'Domain Policy Cache', type: 'Cache', status: 'Healthy', latencyMs: 1 }
    ],
    recentLatencies: [8, 9, 8, 7, 8, 8, 9, 7, 8, 8]
  },
  {
    id: 'api-ad-connector-health',
    name: 'AD & Entra ID Connector Sync Health',
    method: 'GET',
    path: '/api/v1/ad/connector/sync-health',
    category: 'Active Directory & Groups',
    description: 'Monitors real-time directory synchronization heartbeats, replication deltas, and password hash sync between on-premise AD and Azure Entra ID.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 24,
    uptimePercent: 99.95,
    lastChecked: 'Just now',
    errorRate: 0.05,
    rateLimit: '600 req/min',
    authRequired: 'Bearer Token (Scope: directory.monitor.read)',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      connectorQuery: "?cluster=eu-west-1&includeHeartbeat=true"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      connectorId: "conn_osttra_prod_01",
      syncState: "HEALTHY_IN_SYNC",
      lastSuccessfulSync: "2026-09-04T07:33:45Z",
      syncCycleDeltaSeconds: 32,
      objectsPendingSync: 0,
      domainControllersOnline: ["DC-01.osttra.com", "DC-02.osttra.com", "DC-03.osttra.com"],
      version: "2.3.0020.0"
    }, null, 2),
    dependencies: [
      { name: 'AD Connect Agent Bus', type: 'Queue', status: 'Healthy', latencyMs: 12 },
      { name: 'Domain Controller DC-01', type: 'LDAP/AD', status: 'Healthy', latencyMs: 16 },
      { name: 'Entra Graph Heartbeat', type: 'Azure Entra', status: 'Healthy', latencyMs: 18 }
    ],
    recentLatencies: [24, 26, 22, 25, 23, 27, 24, 25, 22, 24]
  },
  {
    id: 'api-sso-user-deprovision',
    name: 'User Offboarding & Session Revocation',
    method: 'POST',
    path: '/api/v1/sso/users/deprovision',
    category: 'User Management',
    description: 'Instantly revokes all active session tokens, terminates connected application sessions, and disables the user identity across OSTTRA SSO portals.',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 52,
    uptimePercent: 99.98,
    lastChecked: 'Just now',
    errorRate: 0.02,
    rateLimit: '600 req/min',
    authRequired: 'Bearer Token (Scope: sso.users.deprovision)',
    environment: 'PROD',
    sampleRequestPayload: JSON.stringify({
      userEmail: "contractor@external-partner.com",
      immediateRevocation: true,
      reason: "Contract expired / Infosec termination",
      ticketReference: "SEC-9088"
    }, null, 2),
    sampleResponsePayload: JSON.stringify({
      status: "success",
      userEmail: "contractor@external-partner.com",
      sessionsTerminated: 4,
      tokensRevoked: 6,
      directoryStatus: "Disabled",
      revokedAt: "2026-09-04T07:34:02Z"
    }, null, 2),
    dependencies: [
      { name: 'Distributed Redis Session Store', type: 'Cache', status: 'Healthy', latencyMs: 3 },
      { name: 'Azure Entra RevokeSignInSessions API', type: 'Azure Entra', status: 'Healthy', latencyMs: 38 },
      { name: 'Audit & Compliance Log Engine', type: 'Queue', status: 'Healthy', latencyMs: 11 }
    ],
    recentLatencies: [50, 54, 49, 53, 52, 56, 51, 55, 52, 52]
  }
];

export const INITIAL_PROBE_LOGS: ApiProbeLog[] = [
  {
    id: 'prb-1001',
    endpointId: 'api-domain-enquiry',
    endpointName: 'Domain Setup Enquiry',
    method: 'GET',
    path: '/api/v1/domains/enquiry',
    timestamp: '04 Sep 2026, 07:34:10 (UTC)',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 18,
    message: 'HTTP 200 OK — Resolved osttra.com configuration and metadata.'
  },
  {
    id: 'prb-1002',
    endpointId: 'api-user-create',
    endpointName: 'Create User in SSO',
    method: 'POST',
    path: '/api/v1/sso/users',
    timestamp: '04 Sep 2026, 07:33:55 (UTC)',
    status: 'Healthy',
    httpStatus: 201,
    latencyMs: 42,
    message: 'HTTP 201 Created — Identity provisioned with SAML registration ID.'
  },
  {
    id: 'prb-1003',
    endpointId: 'api-ad-group-assign',
    endpointName: 'Assign AD Security Group to User',
    method: 'POST',
    path: '/api/v1/ad/groups/assign',
    timestamp: '04 Sep 2026, 07:33:40 (UTC)',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 38,
    message: 'HTTP 200 OK — User bound to SEC-OSTTRA-TRADERS-PROD.'
  },
  {
    id: 'prb-1004',
    endpointId: 'api-domain-migration',
    endpointName: 'Domain & User Migration',
    method: 'POST',
    path: '/api/v1/domains/migration',
    timestamp: '04 Sep 2026, 07:32:15 (UTC)',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 84,
    message: 'HTTP 200 OK — Batch migration probe executed successfully.'
  },
  {
    id: 'prb-1005',
    endpointId: 'api-ad-group-remove',
    endpointName: 'Remove User from Security Group',
    method: 'DELETE',
    path: '/api/v1/ad/groups/remove',
    timestamp: '04 Sep 2026, 07:31:00 (UTC)',
    status: 'Healthy',
    httpStatus: 200,
    latencyMs: 36,
    message: 'HTTP 200 OK — Group membership revocation verified.'
  }
];
