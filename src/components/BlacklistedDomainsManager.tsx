import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Filter, 
  RefreshCw,
  Ban,
  Tag,
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BlacklistedDomain, BlocklistCategory } from '../types';
import { checkIsDomainBlocked } from '../constants';

interface BlacklistedDomainsManagerProps {
  blacklistedDomains: BlacklistedDomain[];
  onAdd: (newDomain: Omit<BlacklistedDomain, 'id' | 'addedOn'>) => void;
  onUpdate: (id: string, updates: Partial<BlacklistedDomain>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  currentUserEmail: string;
}

const CATEGORIES: BlocklistCategory[] = [
  'Public Webmail',
  'Security Risk',
  'Disposable/Temporary',
  'Competitor',
  'Regulatory',
  'Custom'
];

const PRESET_REASONS: { [key in BlocklistCategory]: string[] } = {
  'Public Webmail': [
    'Public webmail provider (Personal accounts prohibited for enterprise B2B federation)',
    'Consumer email service; corporate SSO IDP domain required',
    'Free public email domain not eligible for business federation'
  ],
  'Security Risk': [
    'High-risk unverified domain identified by Infosec',
    'Known domain impersonation or phishing vector',
    'Unencrypted or unauthenticated mail exchange infrastructure'
  ],
  'Disposable/Temporary': [
    'Disposable / temporary burner mailbox service',
    'Anonymous short-lived email host violating SOC2 retention policies',
    'Disposable email address domain posing identity fraud risk'
  ],
  'Competitor': [
    'Direct competitor platform domain excluded by commercial policy',
    'Restricted business entity domain'
  ],
  'Regulatory': [
    'Sanctioned or restricted jurisdiction domain under compliance mandate',
    'Regulatory compliance restriction'
  ],
  'Custom': [
    'Custom organization security exclusion policy',
    'Administrative restriction'
  ]
};

export const BlacklistedDomainsManager: React.FC<BlacklistedDomainsManagerProps> = ({
  blacklistedDomains,
  onAdd,
  onUpdate,
  onDelete,
  onToggleStatus,
  currentUserEmail
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Interactive Live Domain Tester State
  const [testDomainInput, setTestDomainInput] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<BlacklistedDomain | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<BlacklistedDomain | null>(null);

  // Form State for Add / Edit
  const [formDomain, setFormDomain] = useState('');
  const [formCategory, setFormCategory] = useState<BlocklistCategory>('Public Webmail');
  const [formReason, setFormReason] = useState('');
  const [formTicketId, setFormTicketId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formError, setFormError] = useState('');

  // Reset Add Form
  const resetAddForm = () => {
    setFormDomain('');
    setFormCategory('Public Webmail');
    setFormReason(PRESET_REASONS['Public Webmail'][0]);
    setFormTicketId('');
    setFormNotes('');
    setFormEnabled(true);
    setFormError('');
  };

  // Open Edit Modal
  const handleOpenEdit = (item: BlacklistedDomain) => {
    setEditingDomain(item);
    setFormDomain(item.domain);
    setFormCategory(item.category || 'Custom');
    setFormReason(item.reason);
    setFormTicketId(item.ticketId || '');
    setFormNotes(item.notes || '');
    setFormEnabled(item.enabled);
    setFormError('');
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return blacklistedDomains.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ticketId && item.ticketId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.addedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || 
        (selectedStatus === 'ACTIVE' && item.enabled) ||
        (selectedStatus === 'INACTIVE' && !item.enabled);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [blacklistedDomains, searchTerm, selectedCategory, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = blacklistedDomains.length;
    const active = blacklistedDomains.filter(d => d.enabled).length;
    const webmail = blacklistedDomains.filter(d => d.category === 'Public Webmail').length;
    const disposable = blacklistedDomains.filter(d => d.category === 'Disposable/Temporary' || d.category === 'Security Risk').length;
    return { total, active, webmail, disposable };
  }, [blacklistedDomains]);

  // Live test result
  const testResult = useMemo(() => {
    if (!testDomainInput.trim()) return null;
    return checkIsDomainBlocked(testDomainInput, blacklistedDomains);
  }, [testDomainInput, blacklistedDomains]);

  // Submit Add
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = formDomain.toLowerCase().trim().replace(/^[a-zA-Z]+:\/\//, '').replace(/@.*/, '');
    
    if (!cleanDomain) {
      setFormError('Please enter a valid domain name.');
      return;
    }

    // Check if domain already exists in list
    const existing = blacklistedDomains.find(d => d.domain.toLowerCase() === cleanDomain);
    if (existing) {
      setFormError(`Domain '${cleanDomain}' is already in the blocklist.`);
      return;
    }

    onAdd({
      domain: cleanDomain,
      category: formCategory,
      reason: formReason || 'Security blocklist restriction',
      ticketId: formTicketId.trim().toUpperCase() || undefined,
      notes: formNotes.trim() || undefined,
      enabled: formEnabled,
      addedBy: currentUserEmail,
    });

    setIsAddModalOpen(false);
    resetAddForm();
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain) return;

    const cleanDomain = formDomain.toLowerCase().trim().replace(/^[a-zA-Z]+:\/\//, '').replace(/@.*/, '');
    if (!cleanDomain) {
      setFormError('Please enter a valid domain name.');
      return;
    }

    // Check if domain clashes with another item
    const existing = blacklistedDomains.find(d => d.id !== editingDomain.id && d.domain.toLowerCase() === cleanDomain);
    if (existing) {
      setFormError(`Another blocklist entry already exists for domain '${cleanDomain}'.`);
      return;
    }

    onUpdate(editingDomain.id, {
      domain: cleanDomain,
      category: formCategory,
      reason: formReason || 'Security blocklist restriction',
      ticketId: formTicketId.trim().toUpperCase() || undefined,
      notes: formNotes.trim() || undefined,
      enabled: formEnabled,
      updatedBy: currentUserEmail,
      updatedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    });

    setEditingDomain(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Domain', 'Category', 'Reason', 'Ticket Ref', 'Status', 'Added By', 'Added On', 'Notes'];
    const rows = filteredList.map(item => [
      item.domain,
      item.category,
      `"${item.reason.replace(/"/g, '""')}"`,
      item.ticketId || 'N/A',
      item.enabled ? 'Active' : 'Disabled',
      item.addedBy,
      item.addedOn,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `blacklisted_domains_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Blocked Domains</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Ban size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Rules</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.active}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Public Webmail</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.webmail}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Tag size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Disposable / Security Risks</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{stats.disposable}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Interactive Live Domain Tester Card */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="text-[var(--color-primary)]" size={20} />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Domain Blocklist Checker</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Verify instantly whether a prospective domain or email address matches an active registration blocklist rule.
            </p>
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Test domain or email (e.g. user@gmail.com, fake.mailinator.com)"
                value={testDomainInput}
                onChange={(e) => setTestDomainInput(e.target.value)}
                className="w-full text-sm pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all bg-white"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              {testDomainInput && (
                <button
                  onClick={() => setTestDomainInput('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Test Outcome */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-lg border text-xs flex items-start justify-between ${
              testResult.isBlocked
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start space-x-2">
              {testResult.isBlocked ? (
                <Ban size={18} className="text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {testResult.isBlocked
                    ? `🚫 Registration Prohibited: Domain "${testResult.normalizedDomain}" is on the Blocklist`
                    : `✅ Allowed: Domain "${testResult.normalizedDomain}" is not restricted by any active block rule.`}
                </p>
                {testResult.isBlocked && testResult.rule && (
                  <p className="mt-1 text-red-700">
                    <span className="font-medium">Rule Matched:</span> {testResult.rule.domain} ({testResult.rule.category}) — <span className="font-medium">Reason:</span> {testResult.rule.reason}
                    {testResult.rule.ticketId && <span className="ml-2 font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-800">Ref: {testResult.rule.ticketId}</span>}
                  </p>
                )}
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
              testResult.isBlocked ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'
            }`}>
              {testResult.isBlocked ? 'Blocked' : 'Eligible'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Actions & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search domain, reason, ticket, added by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter size={15} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Rules</option>
            <option value="INACTIVE">Disabled Rules</option>
          </select>

          {/* Reset Filters */}
          {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center px-2 py-2"
              title="Reset all filters"
            >
              <RefreshCw size={14} className="mr-1" />
              Reset
            </button>
          )}

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="text-xs text-gray-700 hover:text-gray-900 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg flex items-center font-medium shadow-sm transition-colors"
          >
            <Download size={14} className="mr-1.5" />
            Export CSV
          </button>

          {/* Add Blacklisted Domain Button */}
          <button
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            className="accent-button text-xs py-2 px-3.5 shadow-sm"
          >
            <Plus size={16} className="mr-1.5" />
            Add Blocked Domain
          </button>
        </div>
      </div>

      {/* Main Blotter Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[var(--color-table-header-bg)] border-b border-gray-300 text-gray-700">
              <tr>
                <th className="p-3.5 font-semibold">Domain Name</th>
                <th className="p-3.5 font-semibold">Category</th>
                <th className="p-3.5 font-semibold">Block Reason / Justification</th>
                <th className="p-3.5 font-semibold">Ticket Ref</th>
                <th className="p-3.5 font-semibold">Added By</th>
                <th className="p-3.5 font-semibold">Added On</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredList.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50/80 transition-colors ${!item.enabled ? 'opacity-60 bg-gray-50/50' : ''}`}
                >
                  {/* Domain Name */}
                  <td className="p-3.5 font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-red-500' : 'bg-gray-300'}`} />
                      <span className="font-mono font-semibold text-gray-900">{item.domain}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="p-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      item.category === 'Public Webmail' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      item.category === 'Disposable/Temporary' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      item.category === 'Security Risk' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {item.category}
                    </span>
                  </td>

                  {/* Reason */}
                  <td className="p-3.5 text-gray-700 max-w-xs truncate" title={item.reason + (item.notes ? `\nNotes: ${item.notes}` : '')}>
                    {item.reason}
                    {item.notes && (
                      <p className="text-[10px] text-gray-400 truncate italic mt-0.5">{item.notes}</p>
                    )}
                  </td>

                  {/* Ticket Reference */}
                  <td className="p-3.5 font-mono text-gray-600">
                    {item.ticketId ? (
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-semibold text-gray-800">
                        {item.ticketId}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Added By */}
                  <td className="p-3.5 text-gray-600 truncate max-w-[140px]" title={item.addedBy}>
                    {item.addedBy}
                  </td>

                  {/* Added On */}
                  <td className="p-3.5 text-gray-600 whitespace-nowrap">
                    {item.addedOn}
                  </td>

                  {/* Status Toggle */}
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => onToggleStatus(item.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.enabled ? 'bg-red-600' : 'bg-gray-300'
                      }`}
                      title={item.enabled ? 'Block rule is Active (click to pause)' : 'Block rule is Disabled (click to activate)'}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          item.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Blacklisted Domain"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingDomain(item)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete from Blocklist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldCheck size={36} className="text-gray-400" />
                      <p className="font-semibold text-gray-700 text-sm">No blocked domains matched your filter criteria.</p>
                      <p className="text-xs text-gray-400">Try adjusting your search query or click "Add Blocked Domain" to create a new rule.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD BLACKLISTED DOMAIN */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl z-50 max-w-lg w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Ban size={20} />
                  <h3 className="font-bold text-base">Add Domain to Blocklist</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveNew} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Domain Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., mailinator.com or *.spamhost.net"
                    value={formDomain}
                    onChange={(e) => {
                      setFormDomain(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full form-input-light text-sm"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Enter exact domain (e.g. <code className="font-mono bg-gray-100 px-1 rounded">yahoo.com</code>) or wildcard pattern (e.g. <code className="font-mono bg-gray-100 px-1 rounded">*.disposable.net</code>). Subdomains will automatically be blocked.
                  </p>
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        const cat = e.target.value as BlocklistCategory;
                        setFormCategory(cat);
                        if (PRESET_REASONS[cat] && PRESET_REASONS[cat].length > 0) {
                          setFormReason(PRESET_REASONS[cat][0]);
                        }
                      }}
                      className="w-full form-input-light text-sm"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Ticket Ref (Infosec / SSOOB)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SEC-BLK-104"
                      value={formTicketId}
                      onChange={(e) => setFormTicketId(e.target.value)}
                      className="w-full form-input-light text-sm uppercase"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Block Reason <span className="text-red-500">*</span>
                    </label>
                    {PRESET_REASONS[formCategory] && (
                      <span className="text-[10px] text-gray-500">Preset suggestions available</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason for blocking this domain"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full form-input-light text-sm"
                  />
                  {PRESET_REASONS[formCategory] && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {PRESET_REASONS[formCategory].map((preset, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setFormReason(preset)}
                          className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors text-left"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Compliance & Security Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide additional justification, ticket background or audit notes..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full form-input-light text-sm"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Enforce Rule Immediately</p>
                    <p className="text-[11px] text-gray-500">When enabled, attempts to register this domain will be blocked immediately.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormEnabled(!formEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formEnabled ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        formEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Modal Buttons */}
                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center"
                  >
                    <Ban size={14} className="mr-1.5" />
                    Save & Block Domain
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT BLACKLISTED DOMAIN */}
      <AnimatePresence>
        {editingDomain && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDomain(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl z-50 max-w-lg w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Edit size={18} />
                  <h3 className="font-bold text-base">Edit Blocked Domain: {editingDomain.domain}</h3>
                </div>
                <button
                  onClick={() => setEditingDomain(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Domain Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDomain}
                    onChange={(e) => {
                      setFormDomain(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full form-input-light text-sm font-mono"
                  />
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as BlocklistCategory)}
                      className="w-full form-input-light text-sm"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Ticket Ref
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SEC-BLK-104"
                      value={formTicketId}
                      onChange={(e) => setFormTicketId(e.target.value)}
                      className="w-full form-input-light text-sm uppercase"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Block Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full form-input-light text-sm"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Compliance & Security Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full form-input-light text-sm"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Rule Status</p>
                    <p className="text-[11px] text-gray-500">{formEnabled ? 'Active (prohibiting domain registration)' : 'Disabled / Paused'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormEnabled(!formEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formEnabled ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        formEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Modal Buttons */}
                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditingDomain(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {deletingDomain && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingDomain(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl z-50 max-w-md w-full p-6 border border-gray-200"
            >
              <div className="flex items-center space-x-3 text-red-600 mb-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Remove from Blocklist?</h3>
                  <p className="text-xs text-gray-500">Confirm domain restriction removal</p>
                </div>
              </div>

              <div className="my-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-1.5">
                <p><span className="font-semibold text-gray-900">Domain:</span> <span className="font-mono text-red-600 font-bold">{deletingDomain.domain}</span></p>
                <p><span className="font-semibold text-gray-900">Reason:</span> {deletingDomain.reason}</p>
                {deletingDomain.ticketId && <p><span className="font-semibold text-gray-900">Ticket:</span> {deletingDomain.ticketId}</p>}
              </div>

              <p className="text-xs text-gray-600 mb-6">
                Are you sure you want to remove this domain from the blacklisted domains registry? Once removed, users will be permitted to submit domain registration requests for this domain.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingDomain(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(deletingDomain.id);
                    setDeletingDomain(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center"
                >
                  <Trash2 size={14} className="mr-1.5" />
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
