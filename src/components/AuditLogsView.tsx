import React, { useState, useMemo } from 'react';
import { 
  Download, 
  RotateCcw, 
  Search, 
  ExternalLink,
  Filter,
  Layers,
  Users,
  Globe,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { Domain, AuditRecord, UserAuditRecord } from '../types';
import { AuditLogModal } from './AuditLogModal';
import { UserAuditLogModal } from './UserAuditLogModal';

interface AuditLogsViewProps {
  domains: Domain[];
  domainAuditLogs: AuditRecord[];
  userAuditLogs: UserAuditRecord[];
  onNavigateHome?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  domains,
  domainAuditLogs,
  userAuditLogs,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<'Domain' | 'User'>('Domain');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal open states
  const [selectedDomainForAudit, setSelectedDomainForAudit] = useState<Domain | null>(null);
  const [selectedUserEmailForAudit, setSelectedUserEmailForAudit] = useState<string | null>(null);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setActionTypeFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Filtered Domain Audit records
  const filteredDomainAudits = useMemo(() => {
    return domainAuditLogs.filter(record => {
      const matchesSearch = 
        !searchQuery.trim() ||
        record.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.timestamp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.actionBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.reviewer && record.reviewer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        record.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesActionType = actionTypeFilter === 'ALL' || record.actionType === actionTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;

      return matchesSearch && matchesActionType && matchesStatus;
    });
  }, [domainAuditLogs, searchQuery, actionTypeFilter, statusFilter]);

  // Filtered User Audit records
  const filteredUserAudits = useMemo(() => {
    return userAuditLogs.filter(record => {
      const matchesSearch = 
        !searchQuery.trim() ||
        record.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.timestamp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.actionBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.reviewer && record.reviewer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        record.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesActionType = actionTypeFilter === 'ALL' || record.actionType === actionTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;

      return matchesSearch && matchesActionType && matchesStatus;
    });
  }, [userAuditLogs, searchQuery, actionTypeFilter, statusFilter]);

  // Current active list & pagination
  const currentList = activeTab === 'Domain' ? filteredDomainAudits : filteredUserAudits;
  const totalRecords = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return currentList.slice(start, start + rowsPerPage);
  }, [currentList, currentPage, rowsPerPage]);

  // Click on Action icon for Domain row
  const handleOpenDomainAudit = (domainName: string, domainId: number) => {
    const matchedDomain = domains.find(d => 
      d.id === domainId || d.domain.toLowerCase() === domainName.toLowerCase()
    ) || {
      id: domainId || 999,
      domain: domainName,
      federated: 'Yes',
      mfaStatus: 'Enabled',
      registeredBy: 'System',
      registeredOn: '2025-01-01',
      updatedBy: 'System',
      updatedOn: '2025-01-01',
      approvedBy: null,
      approvedOn: null,
      ssoobTicket: 'AUDIT',
      status: 'Enabled',
      collaborationType: 'B2B',
      samlRegistrationId: ''
    };

    setSelectedDomainForAudit(matchedDomain);
  };

  // Click on Action icon for User row
  const handleOpenUserAudit = (email: string) => {
    setSelectedUserEmailForAudit(email);
  };

  // Export full table
  const handleExportConsolidatedCsv = () => {
    if (activeTab === 'Domain') {
      const csvRows = [
        ['Ticket Id', 'Timestamp', 'Domain Name', 'Action By', 'Action Type', 'Reviewer', 'Status', 'Description'],
        ...filteredDomainAudits.map(r => [
          r.ticketId,
          r.timestamp,
          r.domain,
          r.actionBy,
          r.actionType,
          r.reviewer || 'N/A',
          r.status,
          r.description
        ])
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Domain_Audit_Logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const csvRows = [
        ['Ticket Id', 'Timestamp', 'Email Id', 'Action By', 'Action Type', 'Reviewer', 'Status', 'Description'],
        ...filteredUserAudits.map(r => [
          r.ticketId,
          r.timestamp,
          r.email,
          r.actionBy,
          r.actionType,
          r.reviewer || 'N/A',
          r.status,
          r.description
        ])
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `User_Audit_Logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#f8fafc] min-h-full">
      {/* Header Container */}
      <div className="bg-white border-b border-gray-200 px-8 pt-5 pb-0 shadow-2xs">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-2 font-medium">
          <button 
            type="button"
            onClick={onNavigateHome}
            className="hover:text-teal-700 cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-gray-700">Audit Logs</span>
        </div>

        {/* Title and Top Export */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
          </div>

          <button
            type="button"
            onClick={handleExportConsolidatedCsv}
            className="p-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Download consolidated audit logs as CSV"
          >
            <Download size={18} />
          </button>
        </div>

        {/* Audit Tabs (Domain, User) */}
        <div className="flex space-x-8 border-b border-gray-200 -mb-[1px]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('Domain');
              setCurrentPage(1);
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
              activeTab === 'Domain'
                ? 'text-teal-700 border-b-2 border-teal-600 font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Domain
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('User');
              setCurrentPage(1);
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
              activeTab === 'User'
                ? 'text-teal-700 border-b-2 border-teal-600 font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            User
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8 space-y-4 max-w-[1600px] w-full mx-auto">
        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Reset All Filters Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="border border-[#0e8787] text-[#0e8787] hover:bg-[#e6f4f4] px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RotateCcw size={13} /> Reset All Filters
          </button>

          {/* Right: Search & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[260px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'Domain' ? 'Search ticket, domain, user...' : 'Search ticket, email, user...'}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full form-input-light pl-9 py-1.5 text-xs rounded-md"
              />
            </div>

            <select
              value={actionTypeFilter}
              onChange={e => {
                setActionTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input-light py-1.5 text-xs rounded-md bg-white text-gray-700 border-gray-300"
            >
              <option value="ALL">All Action Types</option>
              <option value="Initial">Initial</option>
              <option value="Update">Update</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input-light py-1.5 text-xs rounded-md bg-white text-gray-700 border-gray-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="Enabled">Enabled</option>
              <option value="Pending">Pending</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Audit Blotter Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs border-collapse">
              <thead className="bg-[#f9fafb] border-b border-gray-300">
                {activeTab === 'Domain' ? (
                  <tr>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Ticket Id
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Timestamp
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Domain Name
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Action By
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Action Type
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Reviewer
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 text-center">
                      Status
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap text-center w-16">
                      Action
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Ticket Id
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Timestamp
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Email Id
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Action By
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Action Type
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Reviewer
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 text-center">
                      Status
                    </th>
                    <th className="p-3.5 font-semibold text-gray-700 whitespace-nowrap text-center w-16">
                      Action
                    </th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-gray-200">
                {activeTab === 'Domain' ? (
                  // DOMAIN BLOTTER ROWS
                  paginatedList.map((rec) => {
                    const record = rec as AuditRecord;
                    return (
                      <tr key={record.id} className="bg-white hover:bg-teal-50/30 transition-colors">
                        {/* Ticket Id */}
                        <td className="p-3.5 font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 font-medium">
                          {record.ticketId}
                        </td>

                        {/* Timestamp */}
                        <td className="p-3.5 text-gray-800 whitespace-nowrap border-r border-gray-100">
                          {record.timestamp}
                        </td>

                        {/* Domain Name */}
                        <td className="p-3.5 font-semibold text-gray-900 whitespace-nowrap border-r border-gray-100">
                          {record.domain}
                        </td>

                        {/* Action By */}
                        <td className="p-3.5 text-gray-700 whitespace-nowrap border-r border-gray-100 font-mono text-[11px]">
                          {record.actionBy}
                        </td>

                        {/* Action Type */}
                        <td className="p-3.5 whitespace-nowrap border-r border-gray-100">
                          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${
                            record.actionType === 'Initial'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {record.actionType}
                          </span>
                        </td>

                        {/* Reviewer */}
                        <td className="p-3.5 text-gray-700 whitespace-nowrap border-r border-gray-100 font-mono text-[11px]">
                          {record.reviewer || record.actionBy || 'N/A'}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center whitespace-nowrap border-r border-gray-100">
                          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold inline-block ${
                            record.status === 'Enabled' ? 'bg-[#3f8318] text-white' :
                            record.status === 'Pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>

                        {/* Action Column */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDomainAudit(record.domain, record.domainId)}
                            className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                            title={`View audit log and history for domain ${record.domain}`}
                          >
                            <ExternalLink size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // USER BLOTTER ROWS
                  paginatedList.map((rec) => {
                    const record = rec as UserAuditRecord;
                    return (
                      <tr key={record.id} className="bg-white hover:bg-teal-50/30 transition-colors">
                        {/* Ticket Id */}
                        <td className="p-3.5 font-mono text-gray-900 whitespace-nowrap border-r border-gray-100 font-medium">
                          {record.ticketId}
                        </td>

                        {/* Timestamp */}
                        <td className="p-3.5 text-gray-800 whitespace-nowrap border-r border-gray-100">
                          {record.timestamp}
                        </td>

                        {/* Email Id */}
                        <td className="p-3.5 font-semibold text-gray-900 whitespace-nowrap border-r border-gray-100">
                          {record.email}
                        </td>

                        {/* Action By */}
                        <td className="p-3.5 text-gray-700 whitespace-nowrap border-r border-gray-100 font-mono text-[11px]">
                          {record.actionBy}
                        </td>

                        {/* Action Type */}
                        <td className="p-3.5 whitespace-nowrap border-r border-gray-100">
                          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${
                            record.actionType === 'Initial'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {record.actionType}
                          </span>
                        </td>

                        {/* Reviewer */}
                        <td className="p-3.5 text-gray-700 whitespace-nowrap border-r border-gray-100 font-mono text-[11px]">
                          {record.reviewer || record.actionBy || 'N/A'}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center whitespace-nowrap border-r border-gray-100">
                          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold inline-block ${
                            record.status === 'Enabled' ? 'bg-[#3f8318] text-white' :
                            record.status === 'Pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>

                        {/* Action Column */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenUserAudit(record.email)}
                            className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                            title={`View audit log and history for user ${record.email}`}
                          >
                            <ExternalLink size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}

                {paginatedList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500 italic">
                      No audit records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Bar (Matching Screenshot) */}
        <div className="flex flex-wrap items-center justify-end gap-6 text-xs text-gray-600 pt-2 pb-6">
          {/* Rows per page */}
          <div className="flex items-center space-x-2">
            <span>Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 bg-white rounded px-2 py-1 text-xs font-semibold text-gray-700 cursor-pointer focus:ring-1 focus:ring-teal-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#0e8787] text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {totalPages > 5 && <span className="px-1 text-gray-400">...</span>}

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Total records */}
          <div>
            Total records: <strong className="text-gray-900">{totalRecords}</strong>
          </div>
        </div>
      </div>

      {/* Domain Audit Modal */}
      {selectedDomainForAudit && (
        <AuditLogModal
          domain={selectedDomainForAudit}
          auditRecords={domainAuditLogs}
          onClose={() => setSelectedDomainForAudit(null)}
        />
      )}

      {/* User Audit Modal */}
      {selectedUserEmailForAudit && (
        <UserAuditLogModal
          userEmail={selectedUserEmailForAudit}
          auditRecords={userAuditLogs}
          onClose={() => setSelectedUserEmailForAudit(null)}
        />
      )}
    </div>
  );
};
