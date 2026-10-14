import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Ban, 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  CheckCircle2,
  AlertTriangle,
  Download,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BlacklistedDomain } from '../types';
import { checkIsDomainBlocked } from '../constants';

interface BlockedDomainsBlotterProps {
  blacklistedDomains: BlacklistedDomain[];
  onAdd: (domain: Omit<BlacklistedDomain, 'id' | 'addedOn'>) => void;
  onAddBatch?: (domains: Array<Omit<BlacklistedDomain, 'id' | 'addedOn'>>) => void;
  onUpdate: (id: string, updates: Partial<BlacklistedDomain>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  currentUserEmail: string;
}

export const BlockedDomainsBlotter: React.FC<BlockedDomainsBlotterProps> = ({
  blacklistedDomains,
  onAdd,
  onAddBatch,
  onUpdate,
  onDelete,
  onToggleStatus,
  currentUserEmail
}) => {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showChecker, setShowChecker] = useState(false);
  const [testDomainInput, setTestDomainInput] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<BlacklistedDomain | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<BlacklistedDomain | null>(null);

  // Form State
  const [formDomainInput, setFormDomainInput] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formError, setFormError] = useState('');

  // Parsed domains from comma-separated input in Add modal
  const parsedDomains = useMemo(() => {
    if (!formDomainInput.trim()) return [];
    const rawTokens = formDomainInput.split(/[\n,;]+/).map(t => t.trim()).filter(Boolean);
    const cleaned = rawTokens.map(token => 
      token.toLowerCase().replace(/^[a-zA-Z]+:\/\//, '').replace(/@.*/, '').trim()
    ).filter(Boolean);
    // Unique list
    return Array.from(new Set(cleaned));
  }, [formDomainInput]);

  // Reset Add Form
  const handleOpenAddModal = () => {
    setFormDomainInput('');
    setFormEnabled(true);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (domain: BlacklistedDomain) => {
    setEditingDomain(domain);
    setFormDomainInput(domain.domain);
    setFormEnabled(domain.enabled);
    setFormError('');
  };

  // Submit Add (Single or Multiple)
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parsedDomains.length === 0) {
      setFormError('Please enter at least one valid domain name.');
      return;
    }

    const existingSet = new Set(blacklistedDomains.map(d => d.domain.toLowerCase()));
    const duplicates = parsedDomains.filter(d => existingSet.has(d));
    const newDomains = parsedDomains.filter(d => !existingSet.has(d));

    if (newDomains.length === 0) {
      setFormError(`All entered domain(s) (${duplicates.join(', ')}) are already in the blocklist.`);
      return;
    }

    const entriesToAdd = newDomains.map(cleanDomain => ({
      domain: cleanDomain,
      category: 'Custom' as const,
      reason: 'Blocked by administrator',
      enabled: formEnabled,
      addedBy: currentUserEmail
    }));

    if (onAddBatch) {
      onAddBatch(entriesToAdd);
    } else {
      entriesToAdd.forEach(entry => onAdd(entry));
    }

    setIsAddModalOpen(false);
  };

  // Submit Edit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain) return;

    const cleanDomain = formDomainInput.toLowerCase().trim().replace(/^[a-zA-Z]+:\/\//, '').replace(/@.*/, '');
    if (!cleanDomain) {
      setFormError('Please enter a valid domain name.');
      return;
    }

    onUpdate(editingDomain.id, {
      domain: cleanDomain,
      enabled: formEnabled
    });

    setEditingDomain(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (domainToDelete) {
      onDelete(domainToDelete.id);
      setDomainToDelete(null);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return blacklistedDomains.filter(item => {
      const matchSearch = !searchQuery.trim() ||
        item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.addedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' ||
        (statusFilter === 'BLOCKED' && item.enabled) ||
        (statusFilter === 'DISABLED' && !item.enabled);

      return matchSearch && matchStatus;
    });
  }, [blacklistedDomains, searchQuery, statusFilter]);

  // Live test result
  const testResult = useMemo(() => {
    if (!testDomainInput.trim()) return null;
    return checkIsDomainBlocked(testDomainInput, blacklistedDomains);
  }, [testDomainInput, blacklistedDomains]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Domain', 'Status', 'Added By', 'Added On'];
    const rows = filteredList.map(item => [
      item.domain,
      item.enabled ? 'Blocked' : 'Disabled',
      item.addedBy,
      item.addedOn
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `blocked_domains_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Lightweight Control & Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Blocked Domain or Added By..." 
            className="w-full form-input-light pl-9 pr-8"
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
            className="form-input-light text-xs py-2 h-[38px] min-w-[120px]"
          >
            <option value="ALL">All Status</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <button
            onClick={() => setShowChecker(!showChecker)}
            className={`flex items-center text-xs font-semibold px-3 py-2 h-[38px] border rounded transition-colors cursor-pointer ${
              showChecker ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Toggle Live Domain Block Checker"
          >
            <ShieldCheck size={14} className="mr-1.5 text-teal-600" />
            Check Domain
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded px-3 py-2 h-[38px] hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
            title="Export Blocklist to CSV"
          >
            <Download size={14} className="mr-1.5 text-gray-500" />
            Export
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center text-xs font-semibold text-white bg-red-600 hover:bg-red-700 border border-red-700 rounded px-3.5 py-2 h-[38px] transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={15} className="mr-1" />
            Add to Blocklist
          </button>
        </div>
      </div>

      {/* Collapsible Domain Checker Tool */}
      <AnimatePresence>
        {showChecker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-teal-50/50 border border-teal-200 rounded-lg p-3.5 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert size={16} className="text-teal-700 shrink-0" />
                <span className="text-xs font-bold text-gray-800">Live Blocklist Checker:</span>
                <span className="text-xs text-gray-600 hidden md:inline">Test if a prospective domain or email is blocked.</span>
              </div>
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="e.g. user@gmail.com, spammer.com"
                  value={testDomainInput}
                  onChange={(e) => setTestDomainInput(e.target.value)}
                  className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-teal-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-600" />
                {testDomainInput && (
                  <button onClick={() => setTestDomainInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {testResult && (
              <div className={`mt-2.5 p-2.5 rounded border text-xs flex items-center justify-between ${
                testResult.isBlocked ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.isBlocked ? <Ban size={15} className="text-red-600 shrink-0" /> : <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />}
                  <span>
                    <span className="font-bold">{testDomainInput}</span> is {testResult.isBlocked ? 'BLOCKED' : 'ALLOWED'}. 
                    {testResult.rule && <span className="ml-1 text-[11px] text-red-700">Matched rule: <strong>{testResult.rule.domain}</strong></span>}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocked Domains Blotter Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-table-header-bg)] border-b border-gray-300 sticky top-0">
            <tr>
              <th className="p-3 font-semibold text-gray-700">Blocked Domain</th>
              <th className="p-3 font-semibold text-gray-700">Added By</th>
              <th className="p-3 font-semibold text-gray-700">Added On</th>
              <th className="p-3 font-semibold text-gray-700 text-center">Status</th>
              <th className="p-3 font-semibold text-gray-700 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400 text-xs">
                  <Ban size={28} className="mx-auto mb-2 text-gray-300" />
                  No blocked domains match your search criteria.
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => (
                <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100/80 transition-colors`}>
                  <td className="p-3 font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${item.enabled ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Ban size={14} />
                      </div>
                      <span className="font-mono text-xs font-semibold">{item.domain}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-600">{item.addedBy}</td>
                  <td className="p-3 text-xs text-gray-500">{item.addedOn}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onToggleStatus(item.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        item.enabled 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={item.enabled ? "Click to deactivate rule" : "Click to activate rule"}
                    >
                      {item.enabled ? 'Blocked' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-3 text-right pr-4">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="text-gray-400 hover:text-teal-600 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Edit Block Rule"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDomainToDelete(item)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove Domain from Blocklist"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer Summary */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>
            Showing <strong>{filteredList.length}</strong> of <strong>{blacklistedDomains.length}</strong> blocked rules
          </span>
          <span className="text-gray-400 text-[11px]">
            * All additions and removals are recorded in the User Audit Log.
          </span>
        </div>
      </div>

      {/* Add Blocked Domain(s) Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-red-600 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Ban size={20} />
                  <h3 className="font-bold text-base">Add Domain(s) to Blocklist</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Domain Names / Patterns <span className="text-red-500">*</span>
                    </label>
                    {parsedDomains.length > 0 && (
                      <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {parsedDomains.length} domain{parsedDomains.length > 1 ? 's' : ''} detected
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    required
                    placeholder="Enter one or multiple domains separated by commas (e.g. mailinator.com, spammer.org, *.burner.net)"
                    value={formDomainInput}
                    onChange={(e) => {
                      setFormDomainInput(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full form-input-light text-xs font-mono resize-y"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tip: Enter multiple domains separated by commas (<code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[10px]">,</code>) or newlines.
                  </p>
                </div>

                {/* Parsed Chips Preview */}
                {parsedDomains.length > 0 && (
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                      <Layers size={12} />
                      Preview ({parsedDomains.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedDomains.map((dom, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-white text-gray-800 border border-gray-300 shadow-2xs">
                          <Ban size={10} className="text-red-600" />
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="add-enabled"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="add-enabled" className="text-xs font-medium text-gray-700 cursor-pointer">
                    Enforce immediately (Status: Blocked)
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-xs flex items-center cursor-pointer"
                  >
                    <Plus size={14} className="mr-1" />
                    {parsedDomains.length > 1 ? `Add ${parsedDomains.length} Domains` : 'Add Domain'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Blocked Domain Modal */}
      <AnimatePresence>
        {editingDomain && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Edit2 size={18} />
                  <h3 className="font-bold text-base">Edit Blocked Domain</h3>
                </div>
                <button onClick={() => setEditingDomain(null)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Domain Name</label>
                  <input
                    type="text"
                    required
                    value={formDomainInput}
                    onChange={(e) => setFormDomainInput(e.target.value)}
                    className="w-full form-input-light text-sm font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit-enabled"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="edit-enabled" className="text-xs font-medium text-gray-700 cursor-pointer">
                    Status: Blocked (Enforced)
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingDomain(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Domain Confirmation Modal */}
      <AnimatePresence>
        {domainToDelete && (
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
                  <h3 className="text-base font-bold text-gray-900">Remove from Blocklist</h3>
                  <p className="text-xs text-gray-500">Confirm domain unblocking</p>
                </div>
              </div>

              <div className="bg-red-50/60 border border-red-200 rounded-lg p-3.5 mb-4 text-xs space-y-1.5 text-gray-700">
                <p>
                  Are you sure you want to remove <strong className="font-mono text-red-900">{domainToDelete.domain}</strong> from the security blocklist?
                </p>
                <p className="text-[11px] text-red-700 font-medium pt-1">
                  Once removed, this domain will be eligible for standard registration again.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setDomainToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-xs cursor-pointer"
                >
                  Confirm Removal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
