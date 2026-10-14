import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  RotateCcw, 
  Download, 
  Info,
  GitCompare,
  User as UserIcon,
  Mail
} from 'lucide-react';
import { UserAuditRecord } from '../types';
import { UserAuditCompareView } from './UserAuditCompareView';

interface UserAuditLogModalProps {
  userEmail: string;
  auditRecords: UserAuditRecord[];
  onClose: () => void;
}

export const UserAuditLogModal: React.FC<UserAuditLogModalProps> = ({
  userEmail,
  auditRecords,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Filter records specifically for this user email
  const userAudits = useMemo(() => {
    const directAudits = auditRecords.filter(r => 
      r.email.toLowerCase() === userEmail.toLowerCase()
    );

    // If no audits exist yet for this user, provide fallback Initial record
    if (directAudits.length === 0) {
      const domain = userEmail.split('@')[1] || 'osttra.com';
      return [
        {
          id: `uaud-${userEmail.replace(/[^a-zA-Z0-9]/g, '')}-init`,
          email: userEmail,
          domain,
          timestamp: '15 Jan 2025, 09:00:00 (UTC)',
          actionBy: 'admin@osttra.com',
          reviewer: 'superadmin@osttra.com',
          ticketId: 'INITIAL-USR',
          description: `Initial provisioning of user ${userEmail}.`,
          status: 'Enabled' as const,
          actionType: 'Initial' as const,
          snapshot: {
            email: userEmail,
            domain,
            status: 'Enabled' as const,
            mfaStatus: 'Disabled' as const,
            collaborationType: 'ENTRA_NON_FED',
            roles: ['SSO User'],
            applications: ['TradeX'],
            ticketId: 'INITIAL-USR',
            actionBy: 'admin@osttra.com',
            reviewer: 'superadmin@osttra.com',
            timestamp: '15 Jan 2025, 09:00:00 (UTC)'
          }
        }
      ];
    }

    return directAudits;
  }, [auditRecords, userEmail]);

  // Apply search & action type filter
  const filteredAudits = useMemo(() => {
    return userAudits.filter(record => {
      const matchesSearch = 
        !searchQuery.trim() ||
        record.timestamp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.actionBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.reviewer && record.reviewer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        record.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.actionType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = actionTypeFilter === 'ALL' || record.actionType === actionTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [userAudits, searchQuery, actionTypeFilter]);

  // Toggle selection for comparison (max 2)
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionTypeFilter('ALL');
    setSelectedIds([]);
  };

  const handleStartCompare = () => {
    if (selectedIds.length === 2) {
      setIsComparing(true);
    }
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['Timestamp', 'Action By', 'Reviewer', 'Ticket Id', 'Description', 'Action Type'],
      ...filteredAudits.map(r => [
        r.timestamp,
        r.actionBy,
        r.reviewer || 'N/A',
        r.ticketId,
        r.description,
        r.actionType
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `User_Audit_Log_${userEmail}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedRecords = useMemo(() => {
    if (selectedIds.length !== 2) return null;
    const r1 = userAudits.find(r => r.id === selectedIds[0]);
    const r2 = userAudits.find(r => r.id === selectedIds[1]);
    if (!r1 || !r2) return null;
    return { r1, r2 };
  }, [selectedIds, userAudits]);

  const latestRecord = userAudits[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              {isComparing ? `User Audit Comparison - ${userEmail}` : `User Audit View - ${userEmail}`}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-teal-100 text-teal-900 border border-teal-200">
              {userAudits.length} {userAudits.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-white">
          {isComparing && selectedRecords ? (
            <UserAuditCompareView 
              userEmail={userEmail}
              recordA={selectedRecords.r1}
              recordB={selectedRecords.r2}
              onBack={() => setIsComparing(false)}
              onClose={onClose}
            />
          ) : (
            <>
              {/* Top Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white">
                {/* Search & Filter inputs */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search timestamp, action by, ticket id, or description..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full form-input-light pl-9 py-1.5 text-xs rounded-md"
                    />
                  </div>

                  <select
                    value={actionTypeFilter}
                    onChange={e => setActionTypeFilter(e.target.value)}
                    className="form-input-light py-1.5 text-xs rounded-md bg-white text-gray-700 border-gray-300"
                  >
                    <option value="ALL">All Action Types</option>
                    <option value="Initial">Initial</option>
                    <option value="Update">Update</option>
                  </select>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="border border-[#0e8787] text-[#0e8787] hover:bg-[#e6f4f4] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw size={13} /> Reset All Filters
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCompare}
                    disabled={selectedIds.length !== 2}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                      selectedIds.length === 2
                        ? 'bg-[#0e8787] hover:bg-[#0b6d6d] text-white cursor-pointer ring-2 ring-teal-600/30'
                        : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
                    }`}
                    title={selectedIds.length === 2 ? "Compare the 2 selected versions side by side" : "Select any 2 records using checkboxes to compare"}
                  >
                    <GitCompare size={14} /> Compare Selected {selectedIds.length > 0 && `(${selectedIds.length}/2)`}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="border border-gray-300 hover:bg-gray-100 text-gray-700 p-2 rounded-md transition-colors cursor-pointer shadow-2xs"
                    title="Export User Audit Log to CSV"
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>

              {/* User Details Card */}
              <div className="bg-[#f2f8f8] border border-teal-100 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2.5">User Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="border-r border-teal-200/60 pr-4">
                    <p className="text-gray-500 font-medium mb-1">Email Id</p>
                    <p className="font-bold text-gray-900 text-sm tracking-tight">{userEmail}</p>
                  </div>
                  <div className="border-r border-teal-200/60 pr-4">
                    <p className="text-gray-500 font-medium mb-1">Domain</p>
                    <p className="font-bold text-teal-900 text-sm">{latestRecord?.domain || userEmail.split('@')[1] || 'osttra.com'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Status</p>
                    <div>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold inline-block ${
                        (latestRecord?.status || 'Enabled') === 'Enabled' ? 'bg-[#3f8318] text-white' :
                        latestRecord?.status === 'Pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {latestRecord?.status || 'Enabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Helper Guidance banner */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-md text-xs">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Info size={14} className="text-teal-700 shrink-0" />
                  <span>
                    {selectedIds.length === 0 && "Select any two records using the checkboxes below to compare changes side-by-side."}
                    {selectedIds.length === 1 && "1 record selected. Select 1 more record to enable 'Compare Selected'."}
                    {selectedIds.length === 2 && (
                      <span className="text-teal-900 font-semibold">
                        2 versions selected! Click <strong className="underline">Compare Selected</strong> above to review field-level differences.
                      </span>
                    )}
                  </span>
                </div>
                {selectedIds.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedIds([])}
                    className="text-[11px] text-gray-500 hover:text-red-700 font-medium underline cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* User Audit Blotter Table */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-[#f0f8f8] border-b border-gray-300">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="p-3 font-semibold text-gray-700 whitespace-nowrap">Timestamp</th>
                        <th className="p-3 font-semibold text-gray-700 whitespace-nowrap">Action By</th>
                        <th className="p-3 font-semibold text-gray-700 whitespace-nowrap">Ticket Id</th>
                        <th className="p-3 font-semibold text-gray-700">Description</th>
                        <th className="p-3 font-semibold text-gray-700 whitespace-nowrap">Action Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAudits.map((record) => {
                        const isSelected = selectedIds.includes(record.id);

                        return (
                          <tr 
                            key={record.id}
                            onClick={() => handleToggleSelect(record.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-[#e6f4f4] hover:bg-[#d9efef]' 
                                : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(record.id)}
                                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-gray-300 cursor-pointer accent-[#0e8787]"
                              />
                            </td>

                            <td className="p-3 font-medium text-gray-900 whitespace-nowrap">
                              {record.timestamp}
                            </td>

                            <td className="p-3 text-gray-800 whitespace-nowrap font-medium">
                              {record.actionBy}
                            </td>

                            <td className="p-3 font-mono text-gray-800 whitespace-nowrap">
                              {record.ticketId}
                            </td>

                            <td className="p-3 text-gray-700 leading-relaxed max-w-lg">
                              {record.description || (
                                <span className="text-gray-400 italic">No description provided</span>
                              )}
                            </td>

                            <td className="p-3 font-mono font-bold whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded text-[11px] border ${
                                record.actionType === 'Initial' 
                                  ? 'bg-blue-50 text-blue-800 border-blue-200' 
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {record.actionType}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredAudits.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                            No audit records found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-800">{filteredAudits.length}</strong> of <strong className="text-gray-800">{userAudits.length}</strong> audit records for {userEmail}
          </div>
          <div className="flex items-center space-x-2">
            {isComparing && (
              <button
                type="button"
                onClick={() => setIsComparing(false)}
                className="px-3.5 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
              >
                Back to List
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-gray-800 hover:bg-gray-900 text-white font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
