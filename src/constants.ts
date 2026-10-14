import { Domain, PendingRequest, AuditRecord, UserAuditRecord, BlacklistedDomain, SamlMetadataConfig } from './types';

export const INITIAL_DOMAIN_DATA: Domain[] = [
  {
    id: 1,
    domain: 'osttra.com',
    federated: 'Yes',
    mfaStatus: 'Enabled',
    registeredBy: 'ajay.swarnkar@osttra.com',
    registeredOn: '12-08-2025',
    updatedBy: 'ajay.swarnkar@osttra.com',
    updatedOn: '12-08-2025',
    approvedBy: 'superadmin@osttra.com',
    approvedOn: '13-08-2025',
    ssoobTicket: 'DMGS-6400',
    infosecTicket: 'SEC-8921',
    status: 'Enabled',
    collaborationType: 'B2B',
    samlRegistrationId: '',
    migratedUsers: ['user1@osttra.com', 'user2@osttra.com'],
    whitelistedIps: ['192.168.1.0/24', '10.200.15.50']
  },
  {
    id: 2,
    domain: 'traiana.com',
    federated: 'Yes',
    mfaStatus: 'Enabled',
    registeredBy: 'admin@traiana.com',
    registeredOn: '10-09-2025',
    updatedBy: 'admin@traiana.com',
    updatedOn: '15-09-2025',
    approvedBy: 'superadmin@osttra.com',
    approvedOn: '16-09-2025',
    ssoobTicket: 'SSOOB-500',
    status: 'Pending',
    collaborationType: 'SAML',
    samlRegistrationId: '166528bf-8a97-42a1-b206-05efd9a790c4',
    migratedUsers: [],
    whitelistedIps: ['172.16.0.0/16']
  },
  {
    id: 3,
    domain: 'trioptima.com',
    federated: 'Yes',
    mfaStatus: 'Disabled',
    registeredBy: 'ops@trioptima.com',
    registeredOn: '01-10-2025',
    updatedBy: 'ops@trioptima.com',
    updatedOn: '01-10-2025',
    approvedBy: 'superadmin@osttra.com',
    approvedOn: '02-10-2025',
    ssoobTicket: 'SSOOB-612',
    status: 'Enabled',
    collaborationType: 'B2B',
    samlRegistrationId: '',
    migratedUsers: [],
    whitelistedIps: ['198.51.100.0/24']
  },
  {
    id: 4,
    domain: 'abc.com',
    federated: 'No',
    mfaStatus: 'Disabled',
    registeredBy: 'support@osttra.com',
    registeredOn: '20-10-2025',
    updatedBy: 'support@osttra.com',
    updatedOn: '20-10-2025',
    approvedBy: 'superadmin@osttra.com',
    approvedOn: '21-10-2025',
    ssoobTicket: 'SSOOB-789',
    status: 'Enabled',
    collaborationType: 'ENTRA_NON_FED',
    samlRegistrationId: '',
    migratedUsers: [],
    whitelistedIps: ['10.0.0.1 - 10.0.0.254']
  }
];

export const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'aud-osttra-3',
    domainId: 1,
    domain: 'osttra.com',
    timestamp: '10 Aug 2026, 11:44:02 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '123456',
    description: 'Updated domain osttra.com IP whitelisting rules. Added 192.168.1.0/24 and 10.200.15.50.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      domain: 'osttra.com',
      federated: 'Yes',
      collaborationType: 'B2B',
      samlRegistrationId: '',
      mfaStatus: 'Enabled',
      whitelistedIps: ['192.168.1.0/24', '10.200.15.50'],
      status: 'Enabled',
      ssoobTicket: '123456',
      infosecTicket: 'SEC-8921',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '10 Aug 2026, 11:44:02 (UTC)'
    }
  },
  {
    id: 'aud-osttra-2',
    domainId: 1,
    domain: 'osttra.com',
    timestamp: '10 Aug 2026, 11:34:39 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Updated domain osttra.com status from Non-Fed to Fed. Updated Collaboration type of domain osttra.com from ENTRA_NON_FED to B2B.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      domain: 'osttra.com',
      federated: 'Yes',
      collaborationType: 'B2B',
      samlRegistrationId: '',
      mfaStatus: 'Enabled',
      whitelistedIps: ['192.168.1.0/24'],
      status: 'Enabled',
      ssoobTicket: '12345',
      infosecTicket: 'SEC-8921',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '10 Aug 2026, 11:34:39 (UTC)'
    }
  },
  {
    id: 'aud-osttra-1',
    domainId: 1,
    domain: 'osttra.com',
    timestamp: '10 Aug 2026, 11:31:04 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Configured domain osttra.com with isFederated as false, MFA as Disabled.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      domain: 'osttra.com',
      federated: 'No',
      collaborationType: 'ENTRA_NON_FED',
      samlRegistrationId: '',
      mfaStatus: 'Disabled',
      whitelistedIps: [],
      status: 'Enabled',
      ssoobTicket: '12345',
      infosecTicket: '',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '10 Aug 2026, 11:31:04 (UTC)'
    }
  },
  {
    id: 'aud-traiana-2',
    domainId: 2,
    domain: 'traiana.com',
    timestamp: '07 Aug 2026, 12:20:03 (UTC)',
    actionBy: 'kanika.bhardwaj@osttra.com',
    reviewer: 'ritik.bansal@osttra.com',
    ticketId: '1234',
    description: 'Updated domain traiana.com collaboration type to SAML with registration ID SAML-TR-001.',
    status: 'Pending',
    actionType: 'Update',
    snapshot: {
      domain: 'traiana.com',
      federated: 'Yes',
      collaborationType: 'SAML',
      samlRegistrationId: 'SAML-TR-001',
      mfaStatus: 'Enabled',
      whitelistedIps: ['172.16.0.0/16'],
      status: 'Pending',
      ssoobTicket: '1234',
      infosecTicket: '',
      actionBy: 'kanika.bhardwaj@osttra.com',
      reviewer: 'ritik.bansal@osttra.com',
      timestamp: '07 Aug 2026, 12:20:03 (UTC)'
    }
  },
  {
    id: 'aud-traiana-1',
    domainId: 2,
    domain: 'traiana.com',
    timestamp: '07 Aug 2026, 07:22:16 (UTC)',
    actionBy: 'ritik.bansal@osttra.com',
    reviewer: 'ritik.bansal@osttra.com',
    ticketId: '1234',
    description: 'Configured domain traiana.com initial registration with Non-Fed mode.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      domain: 'traiana.com',
      federated: 'No',
      collaborationType: 'ENTRA_NON_FED',
      samlRegistrationId: '',
      mfaStatus: 'Disabled',
      whitelistedIps: [],
      status: 'Enabled',
      ssoobTicket: '1234',
      infosecTicket: '',
      actionBy: 'ritik.bansal@osttra.com',
      reviewer: 'ritik.bansal@osttra.com',
      timestamp: '07 Aug 2026, 07:22:16 (UTC)'
    }
  },
  {
    id: 'aud-trioptima-2',
    domainId: 3,
    domain: 'trioptima.com',
    timestamp: '06 Aug 2026, 11:12:09 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Migrated domain trioptima.com to B2B Federation with IP restriction 198.51.100.0/24.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      domain: 'trioptima.com',
      federated: 'Yes',
      collaborationType: 'B2B',
      samlRegistrationId: '',
      mfaStatus: 'Disabled',
      whitelistedIps: ['198.51.100.0/24'],
      status: 'Enabled',
      ssoobTicket: '12345',
      infosecTicket: '',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '06 Aug 2026, 11:12:09 (UTC)'
    }
  },
  {
    id: 'aud-trioptima-1',
    domainId: 3,
    domain: 'trioptima.com',
    timestamp: '06 Aug 2026, 11:00:31 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Configured domain trioptima.com with isFederated as false.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      domain: 'trioptima.com',
      federated: 'No',
      collaborationType: 'ENTRA_NON_FED',
      samlRegistrationId: '',
      mfaStatus: 'Disabled',
      whitelistedIps: [],
      status: 'Enabled',
      ssoobTicket: '12345',
      infosecTicket: '',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '06 Aug 2026, 11:00:31 (UTC)'
    }
  },
  {
    id: 'aud-abc-2',
    domainId: 4,
    domain: 'abc.com',
    timestamp: '06 Aug 2026, 08:31:38 (UTC)',
    actionBy: 'Richard.Crossley@osttra.com',
    reviewer: 'Richard.Crossley@osttra.com',
    ticketId: 'CRDS_98',
    description: 'Updated IP whitelist range for abc.com: 10.0.0.1 - 10.0.0.254.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      domain: 'abc.com',
      federated: 'No',
      collaborationType: 'ENTRA_NON_FED',
      samlRegistrationId: '',
      mfaStatus: 'Disabled',
      whitelistedIps: ['10.0.0.1 - 10.0.0.254'],
      status: 'Enabled',
      ssoobTicket: 'CRDS_98',
      infosecTicket: '',
      actionBy: 'Richard.Crossley@osttra.com',
      reviewer: 'Richard.Crossley@osttra.com',
      timestamp: '06 Aug 2026, 08:31:38 (UTC)'
    }
  },
  {
    id: 'aud-abc-1',
    domainId: 4,
    domain: 'abc.com',
    timestamp: '06 Aug 2026, 08:30:45 (UTC)',
    actionBy: 'Richard.Crossley@osttra.com',
    reviewer: 'Richard.Crossley@osttra.com',
    ticketId: 'CRDS_98',
    description: 'Configured domain abc.com with isFederated as false.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      domain: 'abc.com',
      federated: 'No',
      collaborationType: 'ENTRA_NON_FED',
      samlRegistrationId: '',
      mfaStatus: 'Disabled',
      whitelistedIps: [],
      status: 'Enabled',
      ssoobTicket: 'CRDS_98',
      infosecTicket: '',
      actionBy: 'Richard.Crossley@osttra.com',
      reviewer: 'Richard.Crossley@osttra.com',
      timestamp: '06 Aug 2026, 08:30:45 (UTC)'
    }
  },
  {
    id: 'aud-millennium-1',
    domainId: 5,
    domain: 'millenniumcap.com',
    timestamp: '06 Aug 2026, 06:03:47 (UTC)',
    actionBy: 'sushant.pandey@osttra.com',
    reviewer: 'Richard.Crossley@osttra.com',
    ticketId: 'CRDS_102',
    description: 'Updated domain federation status to B2B and configured MFA enforcement.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      domain: 'millenniumcap.com',
      federated: 'Yes',
      collaborationType: 'B2B',
      samlRegistrationId: '',
      mfaStatus: 'Enabled',
      whitelistedIps: ['52.14.0.0/16'],
      status: 'Enabled',
      ssoobTicket: 'CRDS_102',
      infosecTicket: 'SEC-9901',
      actionBy: 'sushant.pandey@osttra.com',
      reviewer: 'Richard.Crossley@osttra.com',
      timestamp: '06 Aug 2026, 06:03:47 (UTC)'
    }
  },
  {
    id: 'aud-fundadmin-1',
    domainId: 6,
    domain: 'fundadmin.com',
    timestamp: '05 Aug 2026, 12:30:29 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Initial registration of fundadmin.com domain.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      domain: 'fundadmin.com',
      federated: 'No',
      collaborationType: 'ENTRA_NON_FED',
      samlRegistrationId: '',
      mfaStatus: 'Disabled',
      whitelistedIps: [],
      status: 'Enabled',
      ssoobTicket: '12345',
      infosecTicket: '',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '05 Aug 2026, 12:30:29 (UTC)'
    }
  }
];

export const INITIAL_USER_AUDIT_LOGS: UserAuditRecord[] = [
  {
    id: 'uaud-john-3',
    email: 'john.doe@osttra.com',
    domain: 'osttra.com',
    timestamp: '10 Aug 2026, 11:40:15 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '123456',
    description: 'Enforced MFA and added Settlement application entitlement for user john.doe@osttra.com.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      email: 'john.doe@osttra.com',
      displayName: 'John Doe',
      domain: 'osttra.com',
      status: 'Enabled',
      mfaStatus: 'Enabled',
      collaborationType: 'B2B',
      roles: ['Trade Operator', 'SSO User', 'Approver'],
      applications: ['TradeX', 'Clearing Portal', 'Settlement'],
      ticketId: '123456',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '10 Aug 2026, 11:40:15 (UTC)'
    }
  },
  {
    id: 'uaud-john-2',
    email: 'john.doe@osttra.com',
    domain: 'osttra.com',
    timestamp: '10 Aug 2026, 11:25:30 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Updated user federation link to B2B SSO authentication.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      email: 'john.doe@osttra.com',
      displayName: 'John Doe',
      domain: 'osttra.com',
      status: 'Enabled',
      mfaStatus: 'Disabled',
      collaborationType: 'B2B',
      roles: ['Trade Operator', 'SSO User'],
      applications: ['TradeX', 'Clearing Portal'],
      ticketId: '12345',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '10 Aug 2026, 11:25:30 (UTC)'
    }
  },
  {
    id: 'uaud-john-1',
    email: 'john.doe@osttra.com',
    domain: 'osttra.com',
    timestamp: '10 Aug 2026, 11:15:00 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Initial account provisioning for john.doe@osttra.com under Non-Fed authentication.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      email: 'john.doe@osttra.com',
      displayName: 'John Doe',
      domain: 'osttra.com',
      status: 'Enabled',
      mfaStatus: 'Disabled',
      collaborationType: 'ENTRA_NON_FED',
      roles: ['SSO User'],
      applications: ['TradeX'],
      ticketId: '12345',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '10 Aug 2026, 11:15:00 (UTC)'
    }
  },
  {
    id: 'uaud-sarah-2',
    email: 'sarah.jenkins@traiana.com',
    domain: 'traiana.com',
    timestamp: '07 Aug 2026, 12:15:40 (UTC)',
    actionBy: 'kanika.bhardwaj@osttra.com',
    reviewer: 'ritik.bansal@osttra.com',
    ticketId: '1234',
    description: 'Migrated user to SAML authentication (SAML-TR-001) and assigned Compliance Viewer role.',
    status: 'Pending',
    actionType: 'Update',
    snapshot: {
      email: 'sarah.jenkins@traiana.com',
      displayName: 'Sarah Jenkins',
      domain: 'traiana.com',
      status: 'Pending',
      mfaStatus: 'Enabled',
      collaborationType: 'SAML',
      roles: ['Compliance Viewer', 'Trading Desk'],
      applications: ['TradeX', 'Reporting Hub'],
      ticketId: '1234',
      actionBy: 'kanika.bhardwaj@osttra.com',
      reviewer: 'ritik.bansal@osttra.com',
      timestamp: '07 Aug 2026, 12:15:40 (UTC)'
    }
  },
  {
    id: 'uaud-sarah-1',
    email: 'sarah.jenkins@traiana.com',
    domain: 'traiana.com',
    timestamp: '07 Aug 2026, 07:18:10 (UTC)',
    actionBy: 'ritik.bansal@osttra.com',
    reviewer: 'ritik.bansal@osttra.com',
    ticketId: '1234',
    description: 'Initial creation of user sarah.jenkins@traiana.com with Trading Desk access.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      email: 'sarah.jenkins@traiana.com',
      displayName: 'Sarah Jenkins',
      domain: 'traiana.com',
      status: 'Enabled',
      mfaStatus: 'Disabled',
      collaborationType: 'ENTRA_NON_FED',
      roles: ['Trading Desk'],
      applications: ['TradeX'],
      ticketId: '1234',
      actionBy: 'ritik.bansal@osttra.com',
      reviewer: 'ritik.bansal@osttra.com',
      timestamp: '07 Aug 2026, 07:18:10 (UTC)'
    }
  },
  {
    id: 'uaud-alex-2',
    email: 'alex.chen@osttra.com',
    domain: 'osttra.com',
    timestamp: '06 Aug 2026, 11:08:45 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Granted Risk Management application privileges and enabled MFA enforcement.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      email: 'alex.chen@osttra.com',
      displayName: 'Alex Chen',
      domain: 'osttra.com',
      status: 'Enabled',
      mfaStatus: 'Enabled',
      collaborationType: 'B2B',
      roles: ['Risk Officer', 'Admin'],
      applications: ['TradeX', 'Risk Analytics', 'Clearing Portal'],
      ticketId: '12345',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '06 Aug 2026, 11:08:45 (UTC)'
    }
  },
  {
    id: 'uaud-alex-1',
    email: 'alex.chen@osttra.com',
    domain: 'osttra.com',
    timestamp: '06 Aug 2026, 10:55:12 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Initial creation of user alex.chen@osttra.com.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      email: 'alex.chen@osttra.com',
      displayName: 'Alex Chen',
      domain: 'osttra.com',
      status: 'Enabled',
      mfaStatus: 'Disabled',
      collaborationType: 'ENTRA_NON_FED',
      roles: ['Risk Officer'],
      applications: ['Risk Analytics'],
      ticketId: '12345',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '06 Aug 2026, 10:55:12 (UTC)'
    }
  },
  {
    id: 'uaud-emma-1',
    email: 'emma.watson@trioptima.com',
    domain: 'trioptima.com',
    timestamp: '06 Aug 2026, 08:35:10 (UTC)',
    actionBy: 'Richard.Crossley@osttra.com',
    reviewer: 'Richard.Crossley@osttra.com',
    ticketId: 'CRDS_98',
    description: 'Initial registration for emma.watson@trioptima.com with TriOptima B2B SSO access.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      email: 'emma.watson@trioptima.com',
      displayName: 'Emma Watson',
      domain: 'trioptima.com',
      status: 'Enabled',
      mfaStatus: 'Disabled',
      collaborationType: 'B2B',
      roles: ['TriReduce Analyst'],
      applications: ['triReduce', 'triResolve'],
      ticketId: 'CRDS_98',
      actionBy: 'Richard.Crossley@osttra.com',
      reviewer: 'Richard.Crossley@osttra.com',
      timestamp: '06 Aug 2026, 08:35:10 (UTC)'
    }
  },
  {
    id: 'uaud-michael-2',
    email: 'michael.ross@abc.com',
    domain: 'abc.com',
    timestamp: '06 Aug 2026, 06:10:00 (UTC)',
    actionBy: 'sushant.pandey@osttra.com',
    reviewer: 'Richard.Crossley@osttra.com',
    ticketId: 'CRDS_102',
    description: 'Added IP restriction verification rule and updated roles for michael.ross@abc.com.',
    status: 'Enabled',
    actionType: 'Update',
    snapshot: {
      email: 'michael.ross@abc.com',
      displayName: 'Michael Ross',
      domain: 'abc.com',
      status: 'Enabled',
      mfaStatus: 'Disabled',
      collaborationType: 'ENTRA_NON_FED',
      roles: ['External Trader', 'Reporting Viewer'],
      applications: ['TradeX', 'Market Data'],
      ticketId: 'CRDS_102',
      actionBy: 'sushant.pandey@osttra.com',
      reviewer: 'Richard.Crossley@osttra.com',
      timestamp: '06 Aug 2026, 06:10:00 (UTC)'
    }
  },
  {
    id: 'uaud-michael-1',
    email: 'michael.ross@abc.com',
    domain: 'abc.com',
    timestamp: '05 Aug 2026, 12:28:10 (UTC)',
    actionBy: 'Anthony.McCormac@osttra.com',
    reviewer: 'Anthony.McCormac@osttra.com',
    ticketId: '12345',
    description: 'Initial account creation for external client user michael.ross@abc.com.',
    status: 'Enabled',
    actionType: 'Initial',
    snapshot: {
      email: 'michael.ross@abc.com',
      displayName: 'Michael Ross',
      domain: 'abc.com',
      status: 'Enabled',
      mfaStatus: 'Disabled',
      collaborationType: 'ENTRA_NON_FED',
      roles: ['External Trader'],
      applications: ['TradeX'],
      ticketId: '12345',
      actionBy: 'Anthony.McCormac@osttra.com',
      reviewer: 'Anthony.McCormac@osttra.com',
      timestamp: '05 Aug 2026, 12:28:10 (UTC)'
    }
  }
];

export const INITIAL_PENDING_REQUESTS: PendingRequest[] = [
  {
    requestId: 100,
    operation: 'Domain Registration',
    operationType: 'Create',
    initiatedBy: 'testuser@osttra.com',
    initiatedOn: '24-11-2025',
    domainId: 99,
    domainName: 'pendingreg.com',
    payload: {
      domain: 'pendingreg.com', federated: 'Yes', mfaStatus: 'Enabled', ssoobTicket: 'SSOOB-PRG',
      registeredBy: 'testuser@osttra.com', registeredOn: '24-11-2025', collaborationType: 'B2B', samlRegistrationId: ''
    },
    approvedBy: null, approvedOn: null
  },
  {
    requestId: 101,
    operation: 'Domain Migration',
    operationType: 'Update',
    initiatedBy: 'admin@osttra.com',
    initiatedOn: '25-11-2025',
    domainId: 4,
    domainName: 'yahoo.com',
    payload: {
      federated: 'Yes',
      collaborationType: 'B2B',
      samlRegistrationId: ''
    },
    approvedBy: null, approvedOn: null
  }
];

export const AZURE_WHITELISTED_DOMAINS = ['osttra.com', 'traiana.com', 'abc.com'];

export const DEFAULT_PASSWORD = 'password123';

export const INITIAL_BLACKLISTED_DOMAINS: BlacklistedDomain[] = [
  {
    id: 'blk-gmail',
    domain: 'gmail.com',
    reason: 'Public webmail provider (Personal consumer accounts prohibited for enterprise B2B federation)',
    category: 'Public Webmail',
    ticketId: 'SEC-BLK-001',
    addedBy: 'security-admin@osttra.com',
    addedOn: '01-08-2025',
    enabled: true,
    notes: 'Blocked in accordance with Infosec policy SEC-POL-441: No personal webmail domain registrations.'
  },
  {
    id: 'blk-yahoo',
    domain: 'yahoo.com',
    reason: 'Public webmail provider',
    category: 'Public Webmail',
    ticketId: 'SEC-BLK-002',
    addedBy: 'security-admin@osttra.com',
    addedOn: '01-08-2025',
    enabled: true,
    notes: 'Consumer email accounts are blocked from direct corporate domain onboarding.'
  },
  {
    id: 'blk-hotmail',
    domain: 'hotmail.com',
    reason: 'Legacy public consumer email domain',
    category: 'Public Webmail',
    ticketId: 'SEC-BLK-003',
    addedBy: 'security-admin@osttra.com',
    addedOn: '01-08-2025',
    enabled: true,
    notes: 'Consumer accounts must use corporate identity provider.'
  },
  {
    id: 'blk-outlook',
    domain: 'outlook.com',
    reason: 'Consumer Microsoft personal account domain',
    category: 'Public Webmail',
    ticketId: 'SEC-BLK-004',
    addedBy: 'security-admin@osttra.com',
    addedOn: '01-08-2025',
    enabled: true,
    notes: 'Must use enterprise tenant domain instead of outlook.com consumer space.'
  },
  {
    id: 'blk-mailinator',
    domain: 'mailinator.com',
    reason: 'Disposable / Temporary disposable email service posing identity fraud risk',
    category: 'Disposable/Temporary',
    ticketId: 'SEC-BLK-005',
    addedBy: 'ajay.swarnkar@osttra.com',
    addedOn: '15-08-2025',
    enabled: true,
    notes: 'High security risk disposable inbox provider.'
  },
  {
    id: 'blk-10minutemail',
    domain: '10minutemail.com',
    reason: 'Burner disposable email domain prohibited under SOC2 compliance',
    category: 'Disposable/Temporary',
    ticketId: 'SEC-BLK-006',
    addedBy: 'ajay.swarnkar@osttra.com',
    addedOn: '15-08-2025',
    enabled: true,
    notes: 'Burner addresses violate auditability requirements.'
  },
  {
    id: 'blk-tempmail',
    domain: 'temp-mail.org',
    reason: 'Anonymous temporary email hosting service',
    category: 'Disposable/Temporary',
    ticketId: 'SEC-BLK-007',
    addedBy: 'security-admin@osttra.com',
    addedOn: '20-08-2025',
    enabled: true,
    notes: 'Strictly prohibited from SSO provisioning.'
  },
  {
    id: 'blk-qq',
    domain: 'qq.com',
    reason: 'Unverified consumer public email domain',
    category: 'Public Webmail',
    ticketId: 'SEC-BLK-008',
    addedBy: 'security-admin@osttra.com',
    addedOn: '01-09-2025',
    enabled: true,
    notes: 'Personal consumer domains blocked.'
  }
];

export const checkIsDomainBlocked = (
  rawDomain: string,
  blacklistedDomains: BlacklistedDomain[]
): { isBlocked: boolean; rule?: BlacklistedDomain; normalizedDomain: string } => {
  if (!rawDomain) return { isBlocked: false, normalizedDomain: '' };
  
  // Normalize domain
  let clean = rawDomain.toLowerCase().trim();
  // Remove protocol
  clean = clean.replace(/^[a-zA-Z]+:\/\//, '');
  // Remove user prefix if email was entered
  if (clean.includes('@')) {
    clean = clean.split('@')[1];
  }
  // Remove paths or trailing slashes
  clean = clean.split('/')[0].split(':')[0];

  const matchedRule = blacklistedDomains.find(rule => {
    if (!rule.enabled) return false;
    const blockedDomain = rule.domain.toLowerCase().trim();
    
    // Direct exact match (e.g. gmail.com === gmail.com)
    if (clean === blockedDomain) return true;
    
    // Wildcard match (e.g. *.spam.com or .spam.com)
    if (blockedDomain.startsWith('*.')) {
      const base = blockedDomain.slice(2);
      if (clean === base || clean.endsWith('.' + base)) return true;
    }
    
    // Subdomain match (e.g. mail.gmail.com matches gmail.com)
    if (clean.endsWith('.' + blockedDomain)) return true;
    
    return false;
  });

  return {
    isBlocked: !!matchedRule,
    rule: matchedRule,
    normalizedDomain: clean
  };
};

export const generateSamlUuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const buildOsttraSamlMetadataUrl = (samlRegistrationId: string): string => {
  return `https://sso.osttra.com/api/saml/auth/v1/metadata/${samlRegistrationId}`;
};

export const INITIAL_SAML_CONFIGS: SamlMetadataConfig[] = [
  {
    id: 'saml-cfg-1',
    domain: 'traiana.com',
    ticketId: 'SSOOB-500',
    samlRegistrationId: '166528bf-8a97-42a1-b206-05efd9a790c4',
    osttraMetadataUrl: 'https://sso.osttra.com/api/saml/auth/v1/metadata/166528bf-8a97-42a1-b206-05efd9a790c4',
    spEntityId: 'https://sso.osttra.com/api/saml/auth/v1/metadata/166528bf-8a97-42a1-b206-05efd9a790c4',
    spAcsUrl: 'https://sso.osttra.com/api/saml/auth/v1/consume/166528bf-8a97-42a1-b206-05efd9a790c4',
    clientMetadataType: 'URL',
    clientMetadataUrl: 'https://login.microsoftonline.com/e7892f13-4fab-4aab-8dad-0a1408a6ad38/federationmetadata/2007-06/federationmetadata.xml?appid=abaaf263-8152-40ff-b659-39367f25e6b1',
    clientEntityId: 'https://sts.windows.net/e7892f13-4fab-4aab-8dad-0a1408a6ad38/',
    clientSsoUrl: 'https://login.microsoftonline.com/e7892f13-4fab-4aab-8dad-0a1408a6ad38/saml2',
    clientPublicCert: `-----BEGIN CERTIFICATE-----\nMIIC8DCCAdigAwIBAgIQN2uQ6R/yI5FLoN9k4T2q9zANBgkqhkiG9w0BAQsFADA0\nMTIwMAYDVQQDEylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGlvbiBJZFAgQ2VydGlm\naWNhdGUwHhcNMjQwMTAxMDAwMDAwWhcNMjkwMTAxMDAwMDAwWjA0MTIwMAYDVQQD\nEylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGlvbiBJZFAgQ2VydGlmaWNhdGUwggEi\nMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDE2JqQk0xWqK...\n-----END CERTIFICATE-----`,
    status: 'ACTIVE_LINKED',
    createdBy: 'ajay.swarnkar@osttra.com',
    createdOn: '10-09-2025',
    updatedBy: 'admin@traiana.com',
    updatedOn: '15-09-2025',
    linkedDomainIds: [2],
    notes: 'Traiana production SAML 2.0 federation with Microsoft Entra ID'
  },
  {
    id: 'saml-cfg-2',
    domain: 'ubs.com',
    ticketId: 'SSOOB-8921',
    samlRegistrationId: '9a71b234-8cde-4512-b345-9876543210ab',
    osttraMetadataUrl: 'https://sso.osttra.com/api/saml/auth/v1/metadata/9a71b234-8cde-4512-b345-9876543210ab',
    spEntityId: 'https://sso.osttra.com/api/saml/auth/v1/metadata/9a71b234-8cde-4512-b345-9876543210ab',
    spAcsUrl: 'https://sso.osttra.com/api/saml/auth/v1/consume/9a71b234-8cde-4512-b345-9876543210ab',
    clientMetadataType: 'MANUAL',
    clientEntityId: 'https://idp.ubs.com/affwebservices/public/saml2sso',
    clientSsoUrl: 'https://idp.ubs.com/affwebservices/public/saml2sso',
    clientPublicCert: `-----BEGIN CERTIFICATE-----\nMIIDVDCCAjygAwIBAgIJAJa6p+v9m/oNMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\nBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMQ0wCwYDVQQKDARVQk1BMRQwEgYD\nVQQDDAtpZHAudWJzLmNvbTAeFw0yNTAxMDEwMDAwMDBaFw0zMDAxMDEwMDAwMDBa\nMEUxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMQ0wCwYDVQQKDARV\nQk1BMRQwEgYDVQQDDAtpZHAudWJzLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEP\nADCCAQoCggEBAL05...-----END CERTIFICATE-----`,
    status: 'CLIENT_METADATA_CONFIGURED',
    createdBy: 'ajay.swarnkar@osttra.com',
    createdOn: '18-08-2026',
    updatedBy: 'ajay.swarnkar@osttra.com',
    updatedOn: '19-08-2026',
    notes: 'UBS global enterprise PingFederate SAML setup. Shared by subsidiary bank domains.'
  },
  {
    id: 'saml-cfg-3',
    domain: 'barclays.com',
    ticketId: 'INF-3819',
    samlRegistrationId: '3f829d10-4122-48a2-a982-cb123e456789',
    osttraMetadataUrl: 'https://sso.osttra.com/api/saml/auth/v1/metadata/3f829d10-4122-48a2-a982-cb123e456789',
    spEntityId: 'https://sso.osttra.com/api/saml/auth/v1/metadata/3f829d10-4122-48a2-a982-cb123e456789',
    spAcsUrl: 'https://sso.osttra.com/api/saml/auth/v1/consume/3f829d10-4122-48a2-a982-cb123e456789',
    status: 'SP_METADATA_GENERATED',
    createdBy: 'ajay.swarnkar@osttra.com',
    createdOn: '20-08-2026',
    notes: 'SP Metadata generated and URL shared with Barclays InfoSec team. Awaiting their IdP federation metadata.'
  }
];

export const generateSpMetadataXml = (config: {
  samlRegistrationId: string;
  domain: string;
  spEntityId: string;
  spAcsUrl: string;
}): string => {
  const domainName = config.domain || 'client.com';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- OSTTRA SAML 2.0 SP Metadata Configuration -->
<!-- SAML Domain: ${domainName} -->
<!-- SAML Registration ID: ${config.samlRegistrationId} -->
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${config.spEntityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="true"
                      WantAssertionsSigned="true"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>
MIIDWzCCAkOgAwIBAgIEW+8b3TANBgkqhkiG9w0BAQsFADBLMQswCQYDVQQGEwJHQjEP
MA0GA1UEChMGT1NUVFJBMSwwKgYDVQQDEyNTU08gT1NUVFJBIElkZW50aXR5IFNlcnZp
Y2VzIFNpZ25lcjAeFw0yNTAxMDEwMDAwMDBaFw0zNTAxMDEwMDAwMDBaMEsxCzAJBgNV
BAYTAkdCMQ8wDQYDVQQKEwZPU1RUUkExLDAqBgNVBAMTI1NTTyBPU1RUUkEgSWRlbnRp
dHkgU2VydmljZXMgU2lnbmVyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
          </ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                            Location="https://sso.osttra.com/api/saml/auth/v1/slo/${config.samlRegistrationId}" />
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${config.spAcsUrl}"
                                 index="1"
                                 isDefault="true" />
  </md:SPSSODescriptor>
  <md:Organization>
    <md:OrganizationName xml:lang="en">OSTTRA Services</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="en">OSTTRA SSO Gateway (${domainName})</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="en">https://www.osttra.com</md:OrganizationURL>
  </md:Organization>
</md:EntityDescriptor>`;
};
