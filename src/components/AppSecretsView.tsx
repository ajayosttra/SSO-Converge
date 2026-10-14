import React, { useState, useMemo } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff,
  RefreshCw, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  X, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  History,
  GitCompare,
  Layers
} from 'lucide-react';
import { AppSecret, AppSecretAuditRecord } from '../types';
import { generateNewClientSecret, getAuditRecordsForApp, SPECIALIZED_APP_AUDIT_LOGS } from '../data/appSecretsData';
import { AppSecretAuditModal } from './AppSecretAuditModal';

interface AppSecretsViewProps {
  secrets: AppSecret[];
  onUpdateSecrets: React.Dispatch<React.SetStateAction<AppSecret[]>>;
  onNavigateHome: () => void;
}

interface ActiveRotationState {
  secret: AppSecret;
  newSecret: string;
  newHint: string;
  newExpiryDate: string;
  createdDate: string;
}

export const AppSecretsView: React.FC<AppSecretsViewProps> = ({
  secrets,
  onUpdateSecrets,
  onNavigateHome
}) => {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'ALL' | 'PROD' | 'UAT' | 'DEV'>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<'ALL' | 'EXPIRING_90_DAYS' | 'EXPIRED' | 'HEALTHY'>('ALL');

  // Toggle mask state per secret
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Copied toast/state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // View Detail Modal State
  const [viewingSecret, setViewingSecret] = useState<AppSecret | null>(null);
  const [viewSecretRevealed, setViewSecretRevealed] = useState(false);

  // Audit Records & Compare Modal State
  const [viewingAuditSecret, setViewingAuditSecret] = useState<AppSecret | null>(null);
  const [auditLogsBySecret, setAuditLogsBySecret] = useState<Record<string, AppSecretAuditRecord[]>>(SPECIALIZED_APP_AUDIT_LOGS);

  // Rotate Modal State
  const [rotationState, setRotationState] = useState<ActiveRotationState | null>(null);
  const [hasCopiedNewSecret, setHasCopiedNewSecret] = useState(false);
  const [showCloseWarningPrompt, setShowCloseWarningPrompt] = useState(false);

  // Delete Expired Modal State
  const [deletingSecret, setDeletingSecret] = useState<AppSecret | null>(null);

  // Flash Message/Notification
  const [alertBanner, setAlertBanner] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setAlertBanner({ message, type });
    setTimeout(() => setAlertBanner(null), 6000);
  };

  // Metrics
  const expiringWithin90DaysSecrets = useMemo(() => {
    return secrets.filter(s => s.daysRemaining <= 90);
  }, [secrets]);

  const expiringIn90DaysCount = useMemo(() => {
    return secrets.filter(s => s.daysRemaining <= 90 && s.daysRemaining > 0).length;
  }, [secrets]);

  const expiredCount = useMemo(() => {
    return secrets.filter(s => s.daysRemaining <= 0 || s.status === 'Expired' || s.applicationName === 'OSTTRA TradeServ Gateway').length;
  }, [secrets]);

  const healthyCount = useMemo(() => {
    return secrets.filter(s => s.daysRemaining > 90).length;
  }, [secrets]);

  // Dedicated check for OSTTRA TradeServ Gateway
  const tradeServSecret = useMemo(() => {
    return secrets.find(s => s.applicationName === 'OSTTRA TradeServ Gateway');
  }, [secrets]);

  // Filtered Secrets
  const filteredSecrets = useMemo(() => {
    return secrets.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.applicationName.toLowerCase().includes(q) ||
        item.clientId.toLowerCase().includes(q) ||
        item.clientSecret.toLowerCase().includes(q) ||
        item.secretHint.toLowerCase().includes(q);

      const matchesEnv = envFilter === 'ALL' || item.environment === envFilter;

      let matchesExpiry = true;
      if (expiryFilter === 'EXPIRING_90_DAYS') {
        matchesExpiry = item.daysRemaining <= 90;
      } else if (expiryFilter === 'EXPIRED') {
        matchesExpiry = item.daysRemaining <= 0 || item.status === 'Expired' || item.applicationName === 'OSTTRA TradeServ Gateway';
      } else if (expiryFilter === 'HEALTHY') {
        matchesExpiry = item.daysRemaining > 90;
      }

      return matchesSearch && matchesEnv && matchesExpiry;
    });
  }, [secrets, searchQuery, envFilter, expiryFilter]);

  // Copy helper
  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(identifier);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle Mask
  const toggleReveal = (id: string) => {
    setRevealedSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Start Secret Rotation
  const handleStartRotation = (secret: AppSecret) => {
    const { clientSecret, secretHint } = generateNewClientSecret();
    const createdDate = '2026-09-04 06:07:23+00';
    const newExpiryDate = '2027-09-04 06:07:23+00';

    setRotationState({
      secret,
      newSecret: clientSecret,
      newHint: secretHint,
      newExpiryDate,
      createdDate
    });
    setHasCopiedNewSecret(false);
    setShowCloseWarningPrompt(false);
  };

  // User attempts to close the New Secret Modal
  const handleRequestCloseRotation = () => {
    // When user closing the new secret icon user will be prompted with the message
    // "Make sure you copied the new secret, once closed you will loose the secret information."
    setShowCloseWarningPrompt(true);
  };

  // Confirmed close of rotation modal: apply new secret to state
  const handleConfirmCloseRotation = () => {
    if (!rotationState) return;

    const { secret, newSecret, newHint, newExpiryDate, createdDate } = rotationState;

    onUpdateSecrets(prev => prev.map(s => {
      if (s.id === secret.id) {
        return {
          ...s,
          clientSecret: newSecret,
          secretHint: newHint,
          createdDate,
          expiryDate: newExpiryDate,
          daysRemaining: 365,
          status: 'Healthy',
          lastRotated: createdDate
        };
      }
      return s;
    }));

    // Record audit event for this rotation
    const newAuditRecord: AppSecretAuditRecord = {
      id: `aud-${secret.id}-${Date.now()}`,
      secretId: secret.id,
      applicationName: secret.applicationName,
      clientId: secret.clientId,
      environment: secret.environment,
      version: `v${(auditLogsBySecret[secret.applicationName]?.length || 2) + 1} (Rotated)`,
      timestamp: createdDate,
      action: 'CLIENT_SECRET_ROTATED',
      actor: 'ajay.swarnkar@osttra.com',
      ticketId: `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
      ipAddress: '192.168.4.112 (London HQ Corporate SSO)',
      details: {
        secretHint: newHint,
        expiryDate: newExpiryDate,
        createdDate,
        status: 'Healthy',
        daysRemaining: 365,
        ownerEmail: secret.ownerEmail || 'secops@osttra.com',
        notes: 'Rotated credential via SSO Central console.',
        rotationReason: 'Quarterly compliance credential rotation following financial market infrastructure policy.',
        authAlgorithm: 'HMAC-SHA512 (512-bit Secret)'
      }
    };

    setAuditLogsBySecret(prev => ({
      ...prev,
      [secret.applicationName]: [newAuditRecord, ...(prev[secret.applicationName] || getAuditRecordsForApp(secret))]
    }));

    showNotification(`New secret successfully generated and activated for ${secret.applicationName}. Expiry renewed for 12 months.`);
    setRotationState(null);
    setShowCloseWarningPrompt(false);
  };

  // Confirm Deletion of Expired Secret
  const handleConfirmDelete = () => {
    if (!deletingSecret) return;

    onUpdateSecrets(prev => prev.filter(s => s.id !== deletingSecret.id));
    showNotification(`Expired secret for ${deletingSecret.applicationName} (Client ID: ${deletingSecret.clientId}) has been deleted.`);
    setDeletingSecret(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Secret ID', 'Client ID', 'Application Name', 'Environment', 'Secret Hint', 'Client Secret', 'Created Date', 'Expiring On', 'Days Remaining', 'Status'];
    const rows = filteredSecrets.map(s => [
      s.secretId || '',
      `"${s.clientId}"`,
      `"${s.applicationName.replace(/"/g, '""')}"`,
      s.environment,
      s.secretHint,
      `"${s.clientSecret}"`,
      s.createdDate,
      s.expiryDate,
      s.daysRemaining,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `osttra_app_secrets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <button 
            onClick={onNavigateHome}
            className="flex items-center text-xs font-semibold text-gray-500 hover:text-[var(--color-primary)] transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft size={14} className="mr-1" /> Back to Dashboard
          </button>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Key className="text-[var(--color-accent)]" size={22} />
              Application Secrets &amp; Expiry
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {secrets.length} Total Registered
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor client credentials and manage secret lifecycles across external institutional integrations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Export secrets report as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {alertBanner && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{alertBanner.message}</span>
          </div>
          <button onClick={() => setAlertBanner(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Critical Alert for OSTTRA TradeServ Gateway Expired Secret */}
      {tradeServSecret && (tradeServSecret.daysRemaining <= 0 || tradeServSecret.expiryDate.includes('2026-09-01')) && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-500 text-red-950 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-700 text-white tracking-wider">
                  CRITICAL OUTAGE RISK
                </span>
                <h3 className="text-sm font-bold text-red-950">
                  OSTTRA TradeServ Gateway Secret Expired on 01 Sep 2026
                </h3>
              </div>
              <p className="text-xs text-red-900 mt-1 leading-relaxed">
                The client secret for <strong>OSTTRA TradeServ Gateway</strong> ({tradeServSecret.environment}) expired on <strong>01 Sep 2026</strong>. 
                Secret Hint: <code className="font-mono bg-red-100 text-red-900 px-1.5 py-0.5 rounded font-bold border border-red-200">{tradeServSecret.secretHint}</code> (Client ID: <code className="font-mono bg-red-100 text-red-900 px-1.5 py-0.5 rounded border border-red-200">{tradeServSecret.clientId}</code>). 
                Immediate rotation is required to prevent automated token rejection by connected financial institutions.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => setDeletingSecret(tradeServSecret)}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Delete Expired Secret Record"
            >
              <Trash2 size={13} />
              <span>Delete Secret</span>
            </button>
            <button
              type="button"
              onClick={() => handleStartRotation(tradeServSecret)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Rotate Secret Now</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('OSTTRA TradeServ');
                setExpiryFilter('ALL');
              }}
              className="px-3 py-2 bg-white hover:bg-red-100 border border-red-300 text-red-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Locate in Blotter
            </button>
          </div>
        </div>
      )}

      {/* Prominent Alert Panel on Top of Blotter for Expiring Secrets (Expiring in 90 Days) */}
      {expiringWithin90DaysSecrets.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/90 via-rose-50/90 to-orange-50/90 border border-amber-300 text-gray-900 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3.5 flex-1">
              <div className="p-2.5 rounded-xl bg-amber-100/90 text-amber-800 border border-amber-200 shrink-0 mt-0.5">
                <AlertTriangle size={22} className="text-amber-700 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                    Expiring Secrets Alert (Expiring within 90 Days)
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {expiringWithin90DaysSecrets.length} Application{expiringWithin90DaysSecrets.length !== 1 ? 's' : ''} Require Attention
                  </span>
                  {expiredCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                      {expiredCount} Expired (Delete Available)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                  There are <strong>{expiringWithin90DaysSecrets.length} application secret{expiringWithin90DaysSecrets.length !== 1 ? 's' : ''}</strong> expiring within 90 days or already expired. 
                  Review the audit history, rotate client secrets before expiration to maintain continuous gateway connectivity, or permanently remove expired credentials using the <span className="font-semibold text-rose-700">Delete icon</span>.
                </p>

                {/* Clickable Quick Tags for Expiring Applications */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[11px] text-gray-500 font-semibold">Expiring Applications:</span>
                  {expiringWithin90DaysSecrets.map(s => {
                    const isItemExpired = s.daysRemaining <= 0 || s.status === 'Expired' || s.applicationName === 'OSTTRA TradeServ Gateway';
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(s.applicationName);
                          setExpiryFilter('ALL');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/95 hover:bg-white text-gray-800 border border-amber-300 shadow-2xs cursor-pointer transition-all hover:border-amber-400"
                        title={`Locate ${s.applicationName} in blotter`}
                      >
                        <span className="font-semibold">{s.applicationName}</span>
                        <span className={`text-[9.5px] font-bold px-1 rounded ${isItemExpired ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200'}`}>
                          {isItemExpired ? 'Expired' : `${s.daysRemaining}d`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Direct Action Links */}
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-amber-200/70 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setExpiryFilter('EXPIRING_90_DAYS');
                    }}
                    className={`inline-flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      expiryFilter === 'EXPIRING_90_DAYS'
                        ? 'text-rose-900 underline decoration-2 decoration-rose-600 font-extrabold'
                        : 'text-rose-700 hover:text-rose-900 hover:underline'
                    }`}
                  >
                    <Clock size={14} className="text-rose-600" />
                    <span>See All Expiring Application Secrets ({expiringWithin90DaysSecrets.length}) &rarr;</span>
                  </button>

                  <span className="text-gray-300">|</span>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setExpiryFilter('EXPIRED');
                    }}
                    className={`inline-flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      expiryFilter === 'EXPIRED'
                        ? 'text-red-900 underline decoration-2 decoration-red-700 font-extrabold'
                        : 'text-red-700 hover:text-red-900 hover:underline'
                    }`}
                    title="List expired secrets to see the Delete icon"
                  >
                    <Trash2 size={14} className="text-rose-600" />
                    <span>List Expired Secrets ({expiredCount} Delete Available) &rarr;</span>
                  </button>

                  {expiryFilter !== 'ALL' && (
                    <>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setExpiryFilter('ALL')}
                        className="font-medium text-gray-600 hover:text-gray-900 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <X size={13} />
                        <span>Show All Secrets ({secrets.length})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setExpiryFilter(expiryFilter === 'EXPIRING_90_DAYS' ? 'ALL' : 'EXPIRING_90_DAYS');
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                  expiryFilter === 'EXPIRING_90_DAYS'
                    ? 'bg-rose-700 text-white hover:bg-rose-800'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
              >
                <Clock size={14} />
                <span>{expiryFilter === 'EXPIRING_90_DAYS' ? 'Showing Expiring' : 'View Expiring Secrets'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by Client ID, Application Name, Secret or Hint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-gray-50/50"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Expiry Filter Tabs */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
            <button
              onClick={() => setExpiryFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                expiryFilter === 'ALL' 
                  ? 'bg-white text-gray-900 font-bold shadow-2xs' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({secrets.length})
            </button>
            <button
              onClick={() => setExpiryFilter('EXPIRING_90_DAYS')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                expiryFilter === 'EXPIRING_90_DAYS' 
                  ? 'bg-rose-600 text-white font-bold shadow-2xs' 
                  : 'text-rose-700 hover:text-rose-900 hover:bg-rose-100/50'
              }`}
            >
              <Clock size={12} />
              Expiring in &le;90 Days ({expiringIn90DaysCount})
            </button>
            {expiredCount > 0 && (
              <button
                onClick={() => setExpiryFilter('EXPIRED')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  expiryFilter === 'EXPIRED' 
                    ? 'bg-red-700 text-white font-bold shadow-2xs' 
                    : 'text-red-700 hover:text-red-900 hover:bg-red-50'
                }`}
                title="View expired secrets - Delete icon active"
              >
                <Trash2 size={12} />
                Expired ({expiredCount})
              </button>
            )}
            <button
              onClick={() => setExpiryFilter('HEALTHY')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                expiryFilter === 'HEALTHY' 
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Healthy ({healthyCount})
            </button>
          </div>

          {/* Environment Selector */}
          <div className="flex items-center space-x-1.5 border-l border-gray-200 pl-3">
            <span className="text-xs text-gray-500 font-medium">Env:</span>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value as any)}
              className="text-xs border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
            >
              <option value="ALL">All Envs</option>
              <option value="PROD">PROD</option>
              <option value="UAT">UAT</option>
              <option value="DEV">DEV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listing Blotter Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center text-[11px]">#</th>
                <th className="py-3 px-4 min-w-[240px] text-[11px]">Client Id</th>
                <th className="py-3 px-4 min-w-[220px] text-[11px]">Application name</th>
                <th className="py-3 px-3 w-28 text-[11px]">Environment</th>
                <th className="py-3 px-4 min-w-[170px] text-[11px]">Secret Hint</th>
                <th className="py-3 px-4 min-w-[170px] text-[11px]">Create Date</th>
                <th className="py-3 px-4 min-w-[200px] text-[11px]">Expiring On</th>
                <th className="py-3 px-4 w-36 text-center text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSecrets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Key size={32} className="mx-auto mb-2 text-gray-300 opacity-60" />
                    <p className="text-sm font-medium text-gray-600">No application secrets found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms or filter selection.</p>
                  </td>
                </tr>
              ) : (
                filteredSecrets.map((secret, index) => {
                  const isExpiringIn3Months = secret.daysRemaining <= 90 && secret.daysRemaining > 0;
                  const isExpired = secret.daysRemaining <= 0 || secret.status === 'Expired' || secret.applicationName === 'OSTTRA TradeServ Gateway' || (secret.expiryDate && secret.expiryDate.includes('2026-09-01'));
                  const isHighlightedRed = isExpiringIn3Months || isExpired;
                  const isRevealed = !!revealedSecrets[secret.id];

                  return (
                    <tr 
                      key={secret.id}
                      className={`transition-colors duration-150 ${
                        isExpired
                          ? 'bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-l-rose-700'
                          : isExpiringIn3Months
                          ? 'bg-rose-50/50 hover:bg-rose-100/60 border-l-4 border-l-rose-500'
                          : 'hover:bg-gray-50/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Row Index / Secret ID */}
                      <td className="py-3.5 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {secret.secretId ?? (index + 1)}
                      </td>

                      {/* Client Id */}
                      <td className="py-3.5 px-4 font-mono text-gray-800">
                        <div className="flex items-center space-x-1.5 group">
                          <span className="select-all font-medium text-[11.5px]" title={secret.clientId}>
                            {secret.clientId}
                          </span>
                          <button
                            onClick={() => handleCopy(secret.clientId, `client-${secret.id}`)}
                            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-200/60 cursor-pointer"
                            title="Copy Client ID"
                          >
                            {copiedId === `client-${secret.id}` ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Application name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 text-xs leading-tight">
                          {secret.applicationName}
                        </div>
                        {secret.ownerEmail && (
                          <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]" title={secret.ownerEmail}>
                            {secret.ownerEmail}
                          </div>
                        )}
                      </td>

                      {/* Environment */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-extrabold tracking-wide uppercase border ${
                          secret.environment === 'PROD' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : secret.environment === 'UAT'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {secret.environment}
                        </span>
                      </td>

                      {/* Secret Hint */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center space-x-1.5 group">
                          <span 
                            className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200 font-semibold select-all inline-block tracking-wider" 
                            title={`Secret Hint: ${secret.secretHint}`}
                          >
                            {secret.secretHint}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(secret.secretHint, `hint-${secret.id}`)}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Copy Secret Hint"
                          >
                            {copiedId === `hint-${secret.id}` ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Create Date */}
                      <td className="py-3.5 px-4 font-mono text-[11.5px] text-gray-600 whitespace-nowrap">
                        {secret.createdDate}
                      </td>

                      {/* Expiring On (Highlighted in RED if expiring in 3 months) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className={`font-mono text-[11.5px] ${
                            isHighlightedRed 
                              ? 'text-rose-700 font-bold' 
                              : 'text-gray-700 font-medium'
                          }`}>
                            {secret.expiryDate}
                          </div>

                          {/* Expiration Status Pill */}
                          <div>
                            {isExpired ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs animate-pulse">
                                ❌ Expired ({Math.abs(secret.daysRemaining)}d ago)
                              </span>
                            ) : isExpiringIn3Months ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                🚨 Expires in {secret.daysRemaining} days
                              </span>
                            ) : secret.daysRemaining <= 180 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                ⚠️ {secret.daysRemaining} days remaining
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active ({secret.daysRemaining}d left)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* View Icon */}
                          <button
                            type="button"
                            onClick={() => {
                              setViewingSecret(secret);
                              setViewSecretRevealed(false);
                            }}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="View Secret Details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Rotate Icon */}
                          <button
                            type="button"
                            onClick={() => handleStartRotation(secret)}
                            className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Rotate Secret (Generate New Secret)"
                          >
                            <RefreshCw size={16} />
                          </button>

                          {/* Audit Icon (USER REQUESTED: View Audit Records & Compare Two Records) */}
                          <button
                            type="button"
                            onClick={() => setViewingAuditSecret(secret)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title={`View Audit Records & Diff Changes (${secret.applicationName})`}
                          >
                            <History size={16} />
                          </button>

                          {/* Delete Icon (ONLY FOR EXPIRED SECRETS e.g. OSTTRA TradeServ Gateway) */}
                          {isExpired && (
                            <button
                              type="button"
                              onClick={() => setDeletingSecret(secret)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                              title={`Delete Expired Secret Record (${secret.applicationName})`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Showing <strong>{filteredSecrets.length}</strong> of <strong>{secrets.length}</strong> application secrets
          </span>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Red: Expiring in &le;3 Months or Expired
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Healthy (&gt;3 Months)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AUDIT RECORDS & REVISION DIFF MODAL (USER REQUESTED)                      */}
      {/* ========================================================================= */}
      {viewingAuditSecret && (
        <AppSecretAuditModal
          secret={viewingAuditSecret}
          auditRecords={auditLogsBySecret[viewingAuditSecret.applicationName] || getAuditRecordsForApp(viewingAuditSecret)}
          onClose={() => setViewingAuditSecret(null)}
          onRotate={(sec) => handleStartRotation(sec)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW SECRET DETAILS MODAL                                              */}
      {/* ========================================================================= */}
      {viewingSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Secret Details: {viewingSecret.applicationName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Registered Application Credentials &amp; Metadata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingSecret(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              {viewingSecret.daysRemaining <= 90 ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold">
                        {viewingSecret.daysRemaining <= 0 
                          ? 'This credential has EXPIRED' 
                          : `Expiring Soon (${viewingSecret.daysRemaining} days remaining)`}
                      </span>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {viewingSecret.daysRemaining <= 0 
                          ? 'Immediate action required: Delete or rotate this secret to restore connectivity.' 
                          : 'Ensure to rotate this client secret before the expiry deadline.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const sec = viewingSecret;
                      setViewingSecret(null);
                      handleStartRotation(sec);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all shrink-0 cursor-pointer text-xs"
                  >
                    Rotate Now
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="font-medium">
                    This credential is in healthy state ({viewingSecret.daysRemaining} days remaining).
                  </span>
                </div>
              )}

              {/* Grid of Key Properties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Application Name</span>
                  <div className="font-bold text-gray-900 text-sm">{viewingSecret.applicationName}</div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Environment</span>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold uppercase border ${
                      viewingSecret.environment === 'PROD' 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : viewingSecret.environment === 'UAT'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {viewingSecret.environment}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Client ID</span>
                    <button
                      onClick={() => handleCopy(viewingSecret.clientId, 'modal-client-id')}
                      className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'modal-client-id' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedId === 'modal-client-id' ? 'Copied' : 'Copy Client ID'}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold text-gray-800 break-all select-all bg-white p-2 rounded border border-gray-200">
                    {viewingSecret.clientId}
                  </div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Client Secret (character varying 512)</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded">
                        hint: {viewingSecret.secretHint}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewSecretRevealed(!viewSecretRevealed)}
                        className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                      >
                        {viewSecretRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                        {viewSecretRevealed ? 'Mask' : 'Reveal Full Secret'}
                      </button>
                      <button
                        onClick={() => handleCopy(viewingSecret.clientSecret, 'modal-secret-val')}
                        className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copiedId === 'modal-secret-val' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copiedId === 'modal-secret-val' ? 'Copied Secret' : 'Copy Secret'}
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-medium text-gray-900 break-all select-all bg-white p-3 rounded-lg border border-gray-200">
                    {viewSecretRevealed 
                      ? viewingSecret.clientSecret 
                      : `${viewingSecret.clientSecret.slice(0, 8)}••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••`}
                  </div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Create Date</span>
                  <div className="font-mono font-medium text-gray-800 text-xs">{viewingSecret.createdDate}</div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Expiring On</span>
                  <div className={`font-mono font-bold text-xs ${
                    viewingSecret.daysRemaining <= 90 ? 'text-rose-600' : 'text-gray-800'
                  }`}>
                    {viewingSecret.expiryDate}
                  </div>
                </div>

                {viewingSecret.ownerEmail && (
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1 md:col-span-2">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Owner / SecOps Contact</span>
                    <div className="font-medium text-gray-800 text-xs">{viewingSecret.ownerEmail}</div>
                  </div>
                )}

                {viewingSecret.notes && (
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1 md:col-span-2">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Service Description &amp; Notes</span>
                    <p className="text-gray-700 text-xs leading-relaxed">{viewingSecret.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const sec = viewingSecret;
                  setViewingSecret(null);
                  handleStartRotation(sec);
                }}
                className="btn btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Rotate Credential</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSecret(null)}
                className="btn btn-primary text-xs cursor-pointer px-5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ROTATE SECRET MODAL (Presents New Secret with Copy Icon)                */}
      {/* ========================================================================= */}
      {rotationState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    New Generated Client Secret
                  </h3>
                  <p className="text-xs text-gray-500">
                    {rotationState.secret.applicationName} ({rotationState.secret.environment})
                  </p>
                </div>
              </div>
              <button
                onClick={handleRequestCloseRotation}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Alert notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">Important Security Notice:</span>
                  <p className="mt-0.5 text-amber-800">
                    This new client secret is only presented right now. Please copy it and update your external application service configuration before closing this window.
                  </p>
                </div>
              </div>

              {/* Target Client ID */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-1">
                  Target Client ID
                </label>
                <div className="font-mono text-xs font-semibold bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-800 break-all select-all">
                  {rotationState.secret.clientId}
                </div>
              </div>

              {/* New Secret Box with Copy Icon */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Key size={13} className="text-emerald-600" />
                    New Client Secret (512-bit Hex)
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-gray-600">
                    Hint: {rotationState.newHint}
                  </span>
                </div>

                <div className="relative group bg-emerald-50/50 p-4 rounded-xl border-2 border-emerald-300">
                  <div className="font-mono text-xs font-bold text-gray-900 break-all select-all leading-relaxed pr-10">
                    {rotationState.newSecret}
                  </div>

                  {/* Prominent Copy Button */}
                  <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-800">
                      {hasCopiedNewSecret ? '✓ Secret copied to clipboard' : 'Click to copy to clipboard:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopy(rotationState.newSecret, 'rotate-new-secret');
                        setHasCopiedNewSecret(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      {copiedId === 'rotate-new-secret' || hasCopiedNewSecret ? (
                        <>
                          <Check size={14} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy New Secret</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Secret Validity & New Expiry Details */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide block">
                    Created Date
                  </span>
                  <span className="font-mono text-xs text-gray-800">
                    {rotationState.createdDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide block">
                    New Expiry Date (1 Year)
                  </span>
                  <span className="font-mono text-xs text-emerald-700 font-bold">
                    {rotationState.newExpiryDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                <Info size={13} className="text-gray-400" />
                <span>Closing will activate this secret</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRequestCloseRotation}
                  className="btn btn-primary text-xs px-5 cursor-pointer font-bold"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CLOSE WARNING PROMPT MODAL (Exact requested confirmation message)       */}
      {/* ========================================================================= */}
      {showCloseWarningPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border-2 border-amber-300 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Confirm Secret Copy
                </h3>
                {/* EXACT USER REQUESTED PROMPT MESSAGE */}
                <p className="text-sm font-medium text-gray-700 mt-2 leading-relaxed">
                  Make sure you copied the new secret, once closed you will loose the secret information.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCloseWarningPrompt(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Go Back &amp; Copy Secret
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseRotation}
                className="px-4 py-2 bg-[var(--color-primary)] hover:bg-opacity-90 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Yes, I Have Copied It (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE EXPIRED SECRET CONFIRMATION MODAL                               */}
      {/* ========================================================================= */}
      {deletingSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete Expired Secret
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete the expired secret for{' '}
                  <strong className="text-gray-900">{deletingSecret.applicationName}</strong>?
                </p>
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 font-mono text-[11px] text-gray-700 break-all select-all">
                  Client ID: {deletingSecret.clientId}
                </div>
                <p className="text-[11px] text-rose-700 mt-2 font-medium">
                  This action cannot be undone and will purge the expired credential record from SSO Central.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingSecret(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Delete Secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
