import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Key, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Globe, 
  Mail, 
  FileText, 
  ArrowRight,
  Info,
  Server,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SamlMetadataConfig, Domain } from '../types';
import { generateSpMetadataXml } from '../constants';

interface SamlMetadataBlotterProps {
  samlConfigs: SamlMetadataConfig[];
  domains: Domain[];
  onGenerate: (domain: string, ticketId: string, notes?: string) => SamlMetadataConfig;
  onUpdateClientMetadata: (id: string, updates: Partial<SamlMetadataConfig>) => void;
  onDelete: (id: string) => void;
  onQuickRegisterDomain?: (domain: string, samlRegistrationId: string, ticketId: string) => void;
  currentUserEmail: string;
}

export const SamlMetadataBlotter: React.FC<SamlMetadataBlotterProps> = ({
  samlConfigs,
  domains,
  onGenerate,
  onUpdateClientMetadata,
  onDelete,
  onQuickRegisterDomain,
  currentUserEmail
}) => {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatedSuccessConfig, setGeneratedSuccessConfig] = useState<SamlMetadataConfig | null>(null);
  const [editingClientConfig, setEditingClientConfig] = useState<SamlMetadataConfig | null>(null);
  const [viewingConfig, setViewingConfig] = useState<SamlMetadataConfig | null>(null);
  const [configToDelete, setConfigToDelete] = useState<SamlMetadataConfig | null>(null);

  // Single-Domain Generate Form State
  const [genDomainInput, setGenDomainInput] = useState('');
  const [genTicketId, setGenTicketId] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [genError, setGenError] = useState('');

  // Update Client Metadata Form State
  const [updateMode, setUpdateMode] = useState<'URL' | 'MANUAL'>('URL');
  const [clientMetaUrl, setClientMetaUrl] = useState('');
  const [clientEntityId, setClientEntityId] = useState('');
  const [clientSsoUrl, setClientSsoUrl] = useState('');
  const [clientCert, setClientCert] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [isSimulatingFetch, setIsSimulatingFetch] = useState(false);
  const [isTestPassed, setIsTestPassed] = useState(false);

  // Copied State Tracker
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper: Normalize domain string
  const cleanDomainString = (d: string) => {
    return d.toLowerCase().trim().replace(/^[a-zA-Z]+:\/\//, '').replace(/@.*/, '').replace(/\/.*$/, '');
  };

  // Open Generate Modal
  const handleOpenGenerateModal = () => {
    setGenDomainInput('');
    setGenTicketId('');
    setGenNotes('');
    setGenError('');
    setIsGenerateModalOpen(true);
  };

  // Open Update Modal
  const handleOpenUpdateModal = (config: SamlMetadataConfig) => {
    setEditingClientConfig(config);
    setUpdateMode(config.clientMetadataType || (config.clientMetadataUrl ? 'URL' : 'MANUAL'));
    setClientMetaUrl(config.clientMetadataUrl || '');
    setClientEntityId(config.clientEntityId || '');
    setClientSsoUrl(config.clientSsoUrl || '');
    setClientCert(config.clientPublicCert || '');
    setUpdateNotes(config.notes || '');
    setUpdateError('');
    setIsTestPassed(!!config.clientEntityId && !!config.clientSsoUrl);
  };

  // Handle Generate Submit (Single Domain Only)
  const handleSubmitGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDomain = cleanDomainString(genDomainInput);
    if (!cleanDomain) {
      setGenError('Please enter a valid client domain name (e.g. ubs.com).');
      return;
    }

    if (!cleanDomain.includes('.') || cleanDomain.startsWith('.') || cleanDomain.endsWith('.')) {
      setGenError('Please enter a fully qualified domain name (e.g. company.com).');
      return;
    }

    const cleanTicket = genTicketId.toUpperCase().trim();
    if (!cleanTicket) {
      setGenError('Ticket ID reference is required (e.g. SSOOB-8921).');
      return;
    }

    const createdConfig = onGenerate(cleanDomain, cleanTicket, genNotes.trim());
    setIsGenerateModalOpen(false);
    setGeneratedSuccessConfig(createdConfig);
  };

  // Handle Simulate Fetch from Client URL
  const handleSimulateFetchFromUrl = () => {
    if (!clientMetaUrl.trim()) {
      setUpdateError('Please enter a valid Client Metadata URL.');
      return;
    }

    setIsSimulatingFetch(true);
    setUpdateError('');

    setTimeout(() => {
      setIsSimulatingFetch(false);
      const tenantId = 'e7892f13-4fab-4aab-8dad-0a1408a6ad38';
      
      // Auto-extract and populate
      setClientEntityId(`https://sts.windows.net/${tenantId}/`);
      setClientSsoUrl(`https://login.microsoftonline.com/${tenantId}/saml2`);
      setClientCert(`-----BEGIN CERTIFICATE-----\nMIIC8DCCAdigAwIBAgIQN2uQ6R/yI5FLoN9k4T2q9zANBgkqhkiG9w0BAQsFADA0\nMTIwMAYDVQQDEylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGlvbiBJZFAgQ2VydGlm\naWNhdGUwHhcNMjQwMTAxMDAwMDAwWhcNMjkwMTAxMDAwMDAwWjA0MTIwMAYDVQQD\nEylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGlvbiBJZFAgQ2VydGlmaWNhdGUwggEi\nMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDE2JqQk0xWqK...\n-----END CERTIFICATE-----`);
      setIsTestPassed(true);
    }, 600);
  };

  // Handle Submit Update
  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientConfig) return;

    if (updateMode === 'URL') {
      if (!clientMetaUrl.trim()) {
        setUpdateError('Client Metadata URL is required.');
        return;
      }
    } else {
      if (!clientEntityId.trim() || !clientSsoUrl.trim() || !clientCert.trim()) {
        setUpdateError('Entity ID, SSO URL, and Public Certificate are all required.');
        return;
      }
    }

    onUpdateClientMetadata(editingClientConfig.id, {
      clientMetadataType: updateMode,
      clientMetadataUrl: updateMode === 'URL' ? clientMetaUrl.trim() : undefined,
      clientEntityId: clientEntityId.trim(),
      clientSsoUrl: clientSsoUrl.trim(),
      clientPublicCert: clientCert.trim(),
      notes: updateNotes.trim(),
      status: 'CLIENT_METADATA_CONFIGURED'
    });

    setEditingClientConfig(null);
  };

  // Filtered SAML List
  const filteredList = useMemo(() => {
    return samlConfigs.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const domainName = item.domain || (item.domains && item.domains[0]) || '';
      
      // Also match against registered domains reusing this SAML ID
      const sharingDomains = domains
        .filter(d => d.samlRegistrationId === item.samlRegistrationId)
        .map(d => d.domain.toLowerCase());

      const matchSearch = !q ||
        domainName.toLowerCase().includes(q) ||
        sharingDomains.some(d => d.includes(q)) ||
        item.ticketId.toLowerCase().includes(q) ||
        item.samlRegistrationId.toLowerCase().includes(q) ||
        item.createdBy.toLowerCase().includes(q) ||
        (item.clientEntityId && item.clientEntityId.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [samlConfigs, searchQuery, statusFilter, domains]);

  // Quick stats
  const stats = useMemo(() => {
    const totalSetups = samlConfigs.length;
    // Count all registered domains that are using any SAML setup
    const samlRegistrationIds = new Set(samlConfigs.map(c => c.samlRegistrationId));
    const linkedRegisteredDomains = domains.filter(d => d.samlRegistrationId && samlRegistrationIds.has(d.samlRegistrationId)).length;
    const awaitingClient = samlConfigs.filter(c => c.status === 'SP_METADATA_GENERATED').length;
    const configured = samlConfigs.filter(c => c.status === 'CLIENT_METADATA_CONFIGURED').length;
    const activeLinked = samlConfigs.filter(c => c.status === 'ACTIVE_LINKED').length;
    return { totalSetups, linkedRegisteredDomains, awaitingClient, configured, activeLinked };
  }, [samlConfigs, domains]);

  // Helper: Get registered domains sharing a specific SAML registration ID
  const getSharingDomains = (samlRegistrationId: string, primaryDomain: string) => {
    return domains.filter(d => d.samlRegistrationId === samlRegistrationId && d.domain !== primaryDomain);
  };

  // Download XML Helper
  const downloadSpMetadataXml = (config: SamlMetadataConfig) => {
    const xmlContent = generateSpMetadataXml({
      samlRegistrationId: config.samlRegistrationId,
      domain: config.domain,
      spEntityId: config.spEntityId,
      spAcsUrl: config.spAcsUrl
    });
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const domainName = config.domain || 'saml';
    link.download = `osttra_sp_metadata_${domainName.replace(/[^a-zA-Z0-9]/g, '_')}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
          <p className="text-xs text-gray-500 font-medium">SAML Endpoints (Setups)</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold text-gray-900">{stats.totalSetups}</span>
            {stats.linkedRegisteredDomains > 0 && (
              <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                {stats.linkedRegisteredDomains} Linked Domains
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">OSTTRA SAML 2.0 endpoints</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-amber-200 bg-amber-50/30 shadow-2xs">
          <p className="text-xs text-amber-800 font-medium">Awaiting Client Metadata</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{stats.awaitingClient}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">SP URL shared with client</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-teal-200 bg-teal-50/30 shadow-2xs">
          <p className="text-xs text-teal-800 font-medium">Client Metadata Ready</p>
          <p className="text-xl font-bold text-teal-700 mt-1">{stats.configured}</p>
          <p className="text-[11px] text-teal-600 mt-0.5">IdP configured & validated</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <p className="text-xs text-emerald-800 font-medium">Active (Linked to Domain)</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{stats.activeLinked}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Live in domain registry</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Domain Name, Ticket ID, or SAML Registration ID..." 
            className="w-full form-input-light pl-9 pr-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input-light text-xs py-2 h-[38px] min-w-[150px]"
          >
            <option value="ALL">All SAML Status</option>
            <option value="SP_METADATA_GENERATED">Awaiting Client Metadata</option>
            <option value="CLIENT_METADATA_CONFIGURED">Client Configured (Ready)</option>
            <option value="ACTIVE_LINKED">Active (Linked to Domain)</option>
          </select>

          <button
            onClick={handleOpenGenerateModal}
            className="flex items-center text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded px-3.5 py-2 h-[38px] transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={15} className="mr-1.5" />
            Generate SAML Metadata
          </button>
        </div>
      </div>

      {/* Info Callout explaining single-domain generation & copy capability */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-3 text-xs text-teal-900 flex items-start space-x-2.5">
        <Info size={16} className="text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-teal-950">SAML Single-Domain Architecture & ID Reuse</p>
          <p className="text-[11px] text-teal-800 leading-relaxed">
            Generate SAML metadata for a single domain. When onboarding secondary subsidiary or regional domains that share the same Identity Provider (IdP), use the <strong>"Copy SAML Registration ID from Existing SAML Domain"</strong> option in the Domain Registration form.
          </p>
        </div>
      </div>

      {/* SAML Configurations Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-table-header-bg)] border-b border-gray-300 sticky top-0">
            <tr>
              <th className="p-3 font-semibold text-gray-700">Domain Name</th>
              <th className="p-3 font-semibold text-gray-700">Ticket Ref</th>
              <th className="p-3 font-semibold text-gray-700">SAML Registration ID</th>
              <th className="p-3 font-semibold text-gray-700">OSTTRA SP Metadata URL</th>
              <th className="p-3 font-semibold text-gray-700">Client IdP Metadata</th>
              <th className="p-3 font-semibold text-gray-700 text-center">Status</th>
              <th className="p-3 font-semibold text-gray-700 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-xs">
                  <Key size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-600">No SAML Metadata configurations found</p>
                  <p className="text-gray-400 mt-1">Click "Generate SAML Metadata" above to create an SP metadata URL for a domain.</p>
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => {
                const domainName = item.domain || 'N/A';
                const sharing = getSharingDomains(item.samlRegistrationId, domainName);

                return (
                  <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100/80 transition-colors`}>
                    {/* Domain Name */}
                    <td className="p-3 font-medium text-gray-900 max-w-[260px]">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <div className="p-1 rounded bg-blue-50 text-[var(--color-accent)] shrink-0">
                            <Globe size={13} />
                          </div>
                          <span className="font-bold text-xs text-gray-900 truncate">{domainName}</span>
                        </div>

                        {/* Reusing domains tag if any other domains share this SAML ID */}
                        {sharing.length > 0 && (
                          <div className="flex items-center gap-1 pl-5">
                            <span 
                              className="text-[10px] bg-teal-50 text-teal-800 font-medium px-1.5 py-0.5 rounded border border-teal-200 flex items-center gap-1"
                              title={`Shared by registered domains: ${sharing.map(s => s.domain).join(', ')}`}
                            >
                              <Share2 size={10} className="text-teal-600" />
                              Reused by {sharing.length} domain{sharing.length > 1 ? 's' : ''}: {sharing.map(s => s.domain).slice(0, 2).join(', ')}{sharing.length > 2 ? '...' : ''}
                            </span>
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-gray-400 line-clamp-1 pl-5">{item.notes}</p>
                        )}
                      </div>
                    </td>

                    {/* Ticket */}
                    <td className="p-3 text-xs font-mono font-semibold text-gray-700">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        {item.ticketId}
                      </span>
                    </td>

                    {/* Registration ID with 1-click Copy */}
                    <td className="p-3 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <code className="font-mono text-[11px] text-gray-700 bg-slate-100 px-1.5 py-0.5 rounded max-w-[130px] truncate" title={item.samlRegistrationId}>
                          {item.samlRegistrationId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(item.samlRegistrationId, `id-${item.id}`)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 cursor-pointer"
                          title="Copy SAML Registration ID"
                        >
                          {copiedKey === `id-${item.id}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* SP Metadata URL */}
                    <td className="p-3 text-xs max-w-[200px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] text-teal-700 truncate" title={item.osttraMetadataUrl}>
                          {item.osttraMetadataUrl}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.osttraMetadataUrl, `url-${item.id}`)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 shrink-0 cursor-pointer"
                          title="Copy SP Metadata URL"
                        >
                          {copiedKey === `url-${item.id}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Client IdP Metadata */}
                    <td className="p-3 text-xs text-gray-600 max-w-[180px]">
                      {item.clientMetadataUrl ? (
                        <span className="text-[11px] font-mono text-blue-700 truncate block" title={item.clientMetadataUrl}>
                          URL: {item.clientMetadataUrl.slice(0, 24)}...
                        </span>
                      ) : item.clientEntityId ? (
                        <span className="text-[11px] font-mono text-purple-700 truncate block" title={item.clientEntityId}>
                          ID: {item.clientEntityId.slice(0, 22)}...
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Not configured</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'ACTIVE_LINKED' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'CLIENT_METADATA_CONFIGURED'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status === 'ACTIVE_LINKED' 
                          ? 'Active (Linked)' 
                          : item.status === 'CLIENT_METADATA_CONFIGURED'
                          ? 'Client Ready'
                          : 'Awaiting Client'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right pr-4">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Update Client Metadata */}
                        <button
                          onClick={() => handleOpenUpdateModal(item)}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-xs font-semibold flex items-center gap-1 border border-teal-200 transition-colors cursor-pointer"
                          title="Update Client IdP Metadata"
                        >
                          <Edit2 size={12} />
                          <span>Update</span>
                        </button>

                        {/* View Details / Share */}
                        <button
                          onClick={() => setViewingConfig(item)}
                          className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                          title="View Details & Share Pack"
                        >
                          <FileText size={15} />
                        </button>

                        {/* Quick Register Another Domain with this SAML ID */}
                        {onQuickRegisterDomain && (
                          <button
                            onClick={() => onQuickRegisterDomain(domainName, item.samlRegistrationId, item.ticketId)}
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                            title={`Register a new domain reusing SAML Registration ID from '${domainName}'`}
                          >
                            <ArrowRight size={15} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setConfigToDelete(item)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete SAML Configuration"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer Summary */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>
            Showing <strong>{filteredList.length}</strong> of <strong>{samlConfigs.length}</strong> SAML configurations
          </span>
          <span className="text-gray-400 text-[11px]">
            * Each SAML metadata endpoint is generated for one domain. Other domains can copy the SAML ID during registration.
          </span>
        </div>
      </div>

      {/* Modal 1: Generate SAML Metadata (Single Domain Only) */}
      <AnimatePresence>
        {isGenerateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-[var(--color-primary)] text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Key size={20} className="text-teal-300" />
                  <div>
                    <h3 className="font-bold text-base">Generate SAML Metadata</h3>
                    <p className="text-[11px] text-gray-200">Create OSTTRA Service Provider (SP) Metadata URL for a client domain</p>
                  </div>
                </div>
                <button onClick={() => setIsGenerateModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitGenerate} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                {genError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{genError}</span>
                  </div>
                )}

                <div className="bg-teal-50/60 border border-teal-200 rounded-lg p-3 text-xs text-teal-950 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5 text-teal-900">
                    <Info size={14} className="text-teal-700" />
                    Single Domain SAML Generation:
                  </p>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    Provide the single primary domain name for this SAML setup. If the enterprise client has multiple subsidiary or regional domains sharing this Identity Provider (IdP), you can copy this SAML Registration ID when registering those other domains.
                  </p>
                </div>

                {/* Single Domain Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Client Domain Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Globe size={14} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ubs.com"
                      value={genDomainInput}
                      onChange={(e) => {
                        setGenDomainInput(e.target.value);
                        if (genError) setGenError('');
                      }}
                      className="w-full form-input-light pl-9 text-xs font-mono"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Enter one domain (e.g. company.com). Only one domain is permitted per SAML generation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ticket ID Reference (SSOOB / InfoSec) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSOOB-8921, INF-3819"
                    value={genTicketId}
                    onChange={(e) => {
                      setGenTicketId(e.target.value);
                      if (genError) setGenError('');
                    }}
                    className="w-full form-input-light text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Notes / Organization Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. UBS Global Enterprise PingFederate SAML Setup"
                    value={genNotes}
                    onChange={(e) => setGenNotes(e.target.value)}
                    className="w-full form-input-light text-xs resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded transition-colors shadow-xs flex items-center cursor-pointer"
                  >
                    <Key size={14} className="mr-1.5" />
                    Generate Metadata URL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Generated Success & Client Handoff Pack */}
      <AnimatePresence>
        {generatedSuccessConfig && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-emerald-700 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={22} className="text-emerald-200" />
                  <div>
                    <h3 className="font-bold text-base">SAML Metadata Generated Successfully!</h3>
                    <p className="text-[11px] text-emerald-100">
                      Configured for domain: <span className="font-bold font-mono">{generatedSuccessConfig.domain}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setGeneratedSuccessConfig(null)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Domain info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe size={16} className="text-teal-600" />
                    <span className="text-xs font-semibold text-gray-600">Configured Domain:</span>
                    <span className="font-mono text-xs font-bold text-gray-900">{generatedSuccessConfig.domain}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {generatedSuccessConfig.ticketId}
                  </span>
                </div>

                {/* Highlighted Outcome Metadata URL */}
                <div className="bg-slate-900 text-white rounded-lg p-4 space-y-2 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                      OSTTRA SP Metadata URL (Share with Client)
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedSuccessConfig.osttraMetadataUrl, 'gen-url')}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'gen-url' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'gen-url' ? 'Copied!' : 'Copy Metadata URL'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-emerald-300 break-all bg-slate-950 p-2.5 rounded border border-slate-800 select-all">
                    {generatedSuccessConfig.osttraMetadataUrl}
                  </p>
                </div>

                {/* SAML Registration ID */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">SAML Registration ID</p>
                    <p className="font-mono text-xs font-bold text-gray-800 mt-0.5">{generatedSuccessConfig.samlRegistrationId}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedSuccessConfig.samlRegistrationId, 'gen-id')}
                    className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded border border-gray-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'gen-id' ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    <span>{copiedKey === 'gen-id' ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>

                {/* Reusing ID helper */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 flex items-start gap-2">
                  <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Registering another domain?</strong> When registering secondary domains for this client, choose <em>"Copy SAML Registration ID from Existing SAML Domain"</em> in the domain registration form and select <strong>{generatedSuccessConfig.domain}</strong>.
                  </p>
                </div>

                {/* Ready-to-Send Email Template */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Mail size={14} className="text-[var(--color-primary)]" />
                      Client Email Template
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(
                          `Hi Team,\n\nHere is the OSTTRA SAML 2.0 Service Provider (SP) Metadata URL for domain ${generatedSuccessConfig.domain}:\n\nSP Metadata URL:\n${generatedSuccessConfig.osttraMetadataUrl}\n\nSAML Registration ID:\n${generatedSuccessConfig.samlRegistrationId}\n\nOnce configured on your identity provider side, please reply with either:\n1. Your IdP Federation Metadata URL (e.g. Microsoft Entra ID / Ping / Okta), OR\n2. Client Entity ID, Single Sign-On (SSO) URL, and your IdP Public Certificate (X.509 Base64).\n\nBest regards,\nOSTTRA Identity Operations`,
                          'gen-email'
                        );
                      }}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'gen-email' ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                      <span>{copiedKey === 'gen-email' ? 'Email Copied!' : 'Copy Template'}</span>
                    </button>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-gray-200 font-mono text-[11px] text-gray-600 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
{`Hi Team,

Here is the OSTTRA SAML 2.0 Service Provider (SP) Metadata URL for domain ${generatedSuccessConfig.domain}:

SP Metadata URL:
${generatedSuccessConfig.osttraMetadataUrl}

SAML Registration ID:
${generatedSuccessConfig.samlRegistrationId}

Once configured on your side, please provide either:
1. Your IdP Federation Metadata URL, OR
2. Entity ID, Single Sign-On (SSO) URL, and IdP Public Certificate.`}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => downloadSpMetadataXml(generatedSuccessConfig)}
                    className="text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 cursor-pointer"
                  >
                    <Download size={13} />
                    Download SP Metadata XML
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const cfg = generatedSuccessConfig;
                        setGeneratedSuccessConfig(null);
                        handleOpenUpdateModal(cfg);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors shadow-xs cursor-pointer"
                    >
                      Update Client Metadata Now
                    </button>
                    <button
                      onClick={() => setGeneratedSuccessConfig(null)}
                      className="px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Update Client IdP Metadata */}
      <AnimatePresence>
        {editingClientConfig && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-[var(--color-primary)] text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Edit2 size={18} className="text-teal-300" />
                  <div>
                    <h3 className="font-bold text-base">Update Client SAML Metadata</h3>
                    <p className="text-[11px] text-gray-200">
                      Domain: <span className="font-mono font-bold text-teal-300">{editingClientConfig.domain}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingClientConfig(null)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {updateError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                {/* Input Method Toggle */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateMode('URL');
                      setUpdateError('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      updateMode === 'URL' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Option A: Client Metadata URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateMode('MANUAL');
                      setUpdateError('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      updateMode === 'MANUAL' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Option B: Manual Entity ID & Cert
                  </button>
                </div>

                {/* Option A: Metadata URL */}
                {updateMode === 'URL' && (
                  <div className="space-y-3 bg-blue-50/40 p-3.5 rounded-lg border border-blue-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Client Federation Metadata URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        required={updateMode === 'URL'}
                        placeholder="https://login.microsoftonline.com/.../federationmetadata.xml?appid=..."
                        value={clientMetaUrl}
                        onChange={(e) => {
                          setClientMetaUrl(e.target.value);
                          if (updateError) setUpdateError('');
                        }}
                        className="w-full form-input-light text-xs font-mono"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        Example: Microsoft Entra / Okta / PingFederate federation metadata URL.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleSimulateFetchFromUrl}
                        disabled={isSimulatingFetch || !clientMetaUrl.trim()}
                        className={`text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                          clientMetaUrl.trim() 
                            ? 'bg-teal-700 text-white hover:bg-teal-800 cursor-pointer' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Server size={13} />
                        {isSimulatingFetch ? 'Parsing XML Metadata...' : 'Fetch & Auto-Extract Details'}
                      </button>

                      {isTestPassed && (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          XML Parsed Successfully
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Extracted or Manual Fields */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Client Entity ID / Issuer URI {updateMode === 'MANUAL' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={updateMode === 'MANUAL'}
                      placeholder="e.g. https://sts.windows.net/e7892f13-4fab-4aab-8dad-0a1408a6ad38/ or https://idp.client.com"
                      value={clientEntityId}
                      onChange={(e) => setClientEntityId(e.target.value)}
                      className="w-full form-input-light text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Single Sign-On (SSO) URL {updateMode === 'MANUAL' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="url"
                      required={updateMode === 'MANUAL'}
                      placeholder="e.g. https://login.microsoftonline.com/e7892f13-4fab-4aab-8dad-0a1408a6ad38/saml2"
                      value={clientSsoUrl}
                      onChange={(e) => setClientSsoUrl(e.target.value)}
                      className="w-full form-input-light text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Public Certificate (X.509 Base64) {updateMode === 'MANUAL' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      rows={3}
                      required={updateMode === 'MANUAL'}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;MIIC8DCCAdigAwIBAgIQN2uQ6R...&#10;-----END CERTIFICATE-----"
                      value={clientCert}
                      onChange={(e) => setClientCert(e.target.value)}
                      className="w-full form-input-light text-xs font-mono resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Update Notes / Change Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Client metadata updated from Microsoft Entra XML provided by InfoSec"
                      value={updateNotes}
                      onChange={(e) => setUpdateNotes(e.target.value)}
                      className="w-full form-input-light text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingClientConfig(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors shadow-xs flex items-center cursor-pointer"
                  >
                    <Check size={14} className="mr-1.5" />
                    Save Client Metadata
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Full Metadata Details & XML View */}
      <AnimatePresence>
        {viewingConfig && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileCode size={20} className="text-teal-400" />
                  <div>
                    <h3 className="font-bold text-base">
                      SAML Configuration: {viewingConfig.domain}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono">ID: {viewingConfig.samlRegistrationId}</p>
                  </div>
                </div>
                <button onClick={() => setViewingConfig(null)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Registered Domains Sharing this SAML ID */}
                {(() => {
                  const sharing = getSharingDomains(viewingConfig.samlRegistrationId, viewingConfig.domain);
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">Configured & Sharing Domains:</span>
                        {onQuickRegisterDomain && (
                          <button
                            type="button"
                            onClick={() => {
                              const cfg = viewingConfig;
                              setViewingConfig(null);
                              onQuickRegisterDomain('', cfg.samlRegistrationId, cfg.ticketId);
                            }}
                            className="text-xs text-teal-700 hover:text-teal-900 font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={12} />
                            Register Another Domain with this SAML ID
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-white text-gray-900 border border-gray-300 px-2 py-0.5 rounded text-xs font-mono font-semibold flex items-center gap-1 shadow-2xs">
                          <Globe size={11} className="text-teal-600" />
                          {viewingConfig.domain}
                          <span className="text-[9px] bg-teal-100 text-teal-800 px-1 rounded font-sans">Primary</span>
                        </span>
                        {sharing.map((d, dIdx) => (
                          <span key={dIdx} className="bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 shadow-2xs">
                            <Share2 size={11} className="text-blue-500" />
                            {d.domain}
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-1 rounded font-sans">Shared</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Side-by-side Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OSTTRA SP Side */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-xs font-bold text-slate-900">OSTTRA SP Details</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">Service Provider</span>
                    </div>
                    <div className="text-[11px] space-y-1.5">
                      <p><span className="text-gray-500 font-semibold">Entity ID:</span> <span className="font-mono text-gray-800 break-all">{viewingConfig.spEntityId}</span></p>
                      <p><span className="text-gray-500 font-semibold">ACS URL:</span> <span className="font-mono text-gray-800 break-all">{viewingConfig.spAcsUrl}</span></p>
                      <p><span className="text-gray-500 font-semibold">Metadata URL:</span> <span className="font-mono text-teal-700 break-all">{viewingConfig.osttraMetadataUrl}</span></p>
                    </div>
                  </div>

                  {/* Client IdP Side */}
                  <div className="bg-blue-50/40 border border-blue-200 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                      <span className="text-xs font-bold text-blue-950">Client IdP Details</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">Identity Provider</span>
                    </div>
                    <div className="text-[11px] space-y-1.5">
                      <p><span className="text-gray-500 font-semibold">Type:</span> {viewingConfig.clientMetadataType || 'Not Configured'}</p>
                      <p><span className="text-gray-500 font-semibold">Entity ID:</span> <span className="font-mono text-gray-800 break-all">{viewingConfig.clientEntityId || 'Awaiting client'}</span></p>
                      <p><span className="text-gray-500 font-semibold">SSO URL:</span> <span className="font-mono text-gray-800 break-all">{viewingConfig.clientSsoUrl || 'Awaiting client'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Audit & Metadata Notes */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-gray-500">Created by: </span>
                    <span className="font-semibold text-gray-800">{viewingConfig.createdBy}</span>
                    <span className="text-gray-400 ml-1">({viewingConfig.createdOn})</span>
                  </div>
                  {viewingConfig.updatedBy && (
                    <div>
                      <span className="text-gray-500">Updated by: </span>
                      <span className="font-semibold text-gray-800">{viewingConfig.updatedBy}</span>
                      <span className="text-gray-400 ml-1">({viewingConfig.updatedOn})</span>
                    </div>
                  )}
                </div>

                {/* SP XML Viewer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">SP Metadata XML Preview</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(generateSpMetadataXml(viewingConfig), 'view-xml')}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'view-xml' ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                        <span>{copiedKey === 'view-xml' ? 'XML Copied' : 'Copy XML'}</span>
                      </button>
                      <button
                        onClick={() => downloadSpMetadataXml(viewingConfig)}
                        className="text-xs text-gray-700 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                    {generateSpMetadataXml(viewingConfig)}
                  </pre>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setViewingConfig(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 5: Delete Confirmation */}
      <AnimatePresence>
        {configToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-red-100 text-red-700 rounded-full">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete SAML Configuration</h3>
                  <p className="text-xs text-gray-500">Confirm deletion</p>
                </div>
              </div>

              <p className="text-xs text-gray-700 mb-4">
                Are you sure you want to delete the SAML setup for domain{' '}
                <strong className="font-semibold text-gray-900">{configToDelete.domain}</strong>{' '}
                (Registration ID: <code className="font-mono text-[11px]">{configToDelete.samlRegistrationId}</code>)?
              </p>

              <div className="flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setConfigToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(configToDelete.id);
                    setConfigToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
