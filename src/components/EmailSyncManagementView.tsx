import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  RotateCcw, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Server, 
  Eye, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Send,
  AlertCircle,
  User,
  Check
} from 'lucide-react';
import { UserEmailSyncRequest } from '../types';
import { EmailSyncDetailModal } from './EmailSyncDetailModal';
import { InitiateEmailSyncModal } from './InitiateEmailSyncModal';

interface EmailSyncManagementViewProps {
  requests: UserEmailSyncRequest[];
  onRetriggerApp: (requestId: string, applicationName: string) => void;
  onRetriggerAllFailed: (requestId: string) => void;
  onInitiateSync: (data: {
    oldEmail: string;
    newEmail: string;
    selectedApps: { name: string; env: 'PROD' | 'UAT' }[];
    notes?: string;
  }) => void;
  onNavigateHome?: () => void;
  currentUserEmail?: string;
}

export const EmailSyncManagementView: React.FC<EmailSyncManagementViewProps> = ({
  requests,
  onRetriggerApp,
  onRetriggerAllFailed,
  onInitiateSync,
  onNavigateHome,
  currentUserEmail = 'ajay.swarnkar@osttra.com'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [initiatorFilter, setInitiatorFilter] = useState<string>('ALL');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<UserEmailSyncRequest | null>(null);
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);

  // Unique Initiating Systems
  const availableInitiators = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => set.add(r.initiatingSystem));
    return Array.from(set).sort();
  }, [requests]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        req.id.toLowerCase().includes(q) ||
        req.oldEmail.toLowerCase().includes(q) ||
        req.newEmail.toLowerCase().includes(q) ||
        (req.userName && req.userName.toLowerCase().includes(q)) ||
        (req.initiatedByEmail && req.initiatedByEmail.toLowerCase().includes(q)) ||
        req.ticketReference.toLowerCase().includes(q) ||
        req.initiatingSystem.toLowerCase().includes(q) ||
        req.applications.some(a => a.applicationName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || req.overallStatus === statusFilter;
      const matchesInitiator = initiatorFilter === 'ALL' || req.initiatingSystem === initiatorFilter;

      return matchesSearch && matchesStatus && matchesInitiator;
    });
  }, [requests, searchQuery, statusFilter, initiatorFilter]);

  // Pagination
  const totalRecords = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRequests.slice(start, start + rowsPerPage);
  }, [filteredRequests, currentPage, rowsPerPage]);

  // KPI Stats
  const stats = useMemo(() => {
    const completed = requests.filter(r => r.overallStatus === 'COMPLETED').length;
    const partiallyFailed = requests.filter(r => r.overallStatus === 'PARTIALLY_FAILED').length;
    const inProgress = requests.filter(r => r.overallStatus === 'IN_PROGRESS').length;
    return {
      total: requests.length,
      completed,
      partiallyFailed,
      inProgress
    };
  }, [requests]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setInitiatorFilter('ALL');
    setCurrentPage(1);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Request Id,Old Email,New Email,Initiating system,Initiated by,Initiated on,SSO Status,Application status,Overall status\n";
    filteredRequests.forEach(r => {
      const appSummary = r.applications.map(a => `${a.applicationName}(${a.environment}):${a.status}`).join('; ');
      csvContent += `"${r.id}","${r.oldEmail}","${r.newEmail}","${r.initiatingSystem}","${r.initiatedByEmail || ''}","${r.requestedAt}","${r.ssoDirectoryUpdated ? 'Updated' : 'Pending'}","${appSummary}","${r.overallStatus}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sso_email_propagation_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f6f6f6] overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
              {onNavigateHome && (
                <button onClick={onNavigateHome} className="hover:text-gray-800 transition-colors">
                  Home
                </button>
              )}
              {onNavigateHome && <span>/</span>}
              <span className="font-semibold text-gray-700">User Identity Lifecycle</span>
              <span>/</span>
              <span className="text-[var(--color-primary)] font-bold">Email Propagation &amp; Sync</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center">
              <Mail className="mr-2 text-[var(--color-primary)]" size={24} />
              Cross-Application User Email Propagation Hub
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage user email update requests, monitor downstream application acknowledgments, and re-trigger sync for failed systems.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsInitiateModalOpen(true)}
              className="accent-button text-xs py-2 px-3.5 shadow-sm hover:shadow flex items-center cursor-pointer"
            >
              <Send size={14} className="mr-1.5" />
              Dispatch Email Update
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center shadow-xs transition-colors cursor-pointer"
            >
              <Download size={14} className="mr-1.5 text-gray-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Total Requests</span>
              <span className="text-2xl font-black text-gray-900">{stats.total}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">100% Completed</span>
              <span className="text-2xl font-black text-emerald-700">{stats.completed}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Partially Failed (Retrigger)</span>
              <span className="text-2xl font-black text-rose-600">{stats.partiallyFailed}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">In-Flight / Awaiting ACK</span>
              <span className="text-2xl font-black text-blue-700">{stats.inProgress}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Request ID, Old/New Email, Initiator, or App..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--color-accent)]"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed (All ACKs Success)</option>
                <option value="PARTIALLY_FAILED">Partially Failed (Needs Retrigger)</option>
                <option value="IN_PROGRESS">In Progress (Awaiting ACKs)</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Initiating System Filter */}
            <div className="md:col-span-2">
              <select
                value={initiatorFilter}
                onChange={(e) => {
                  setInitiatorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--color-accent)] truncate"
              >
                <option value="ALL">All Initiators</option>
                {availableInitiators.map(init => (
                  <option key={init} value={init}>{init}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-2 rounded-lg flex items-center w-full justify-center hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} className="mr-1.5" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Data Table with Exact Requested Headers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-table-header-bg)] text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                  <th className="px-3 py-3 whitespace-nowrap">Request Id</th>
                  <th className="px-3 py-3 whitespace-nowrap">Old Email</th>
                  <th className="px-3 py-3 whitespace-nowrap">New Email</th>
                  <th className="px-3 py-3 whitespace-nowrap">Initiating system</th>
                  <th className="px-3 py-3 whitespace-nowrap">Initiated by</th>
                  <th className="px-3 py-3 whitespace-nowrap">Initiated on</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">SSO Status</th>
                  <th className="px-3 py-3 whitespace-nowrap">Application status</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Overall status</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      <Mail size={36} className="mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-600">No email update requests found</p>
                      <p className="text-[11px] text-gray-400 mt-1">Try adjusting your filters or click "Dispatch Email Update".</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map(req => {
                    const failedApps = req.applications.filter(a => a.status === 'FAILED');

                    return (
                      <tr 
                        key={req.id} 
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedRequestForDetail(req)}
                      >
                        {/* 1. Request Id */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-gray-900 block">{req.id}</span>
                          <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1 py-0.2 rounded border border-gray-200 inline-block mt-0.5">
                            {req.ticketReference}
                          </span>
                        </td>

                        {/* 2. Old Email */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 font-medium" title={req.oldEmail}>
                              {req.oldEmail}
                            </span>
                          </div>
                          {req.userName && (
                            <span className="text-[10px] text-gray-400 block mt-0.5 truncate max-w-[150px]">{req.userName}</span>
                          )}
                        </td>

                        {/* 3. New Email */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block" title={req.newEmail}>
                            {req.newEmail}
                          </span>
                        </td>

                        {/* 4. Initiating system */}
                        <td className="px-3 py-3 text-gray-700 text-[11px]">
                          <span className="font-medium text-gray-800 block truncate max-w-[140px]" title={req.initiatingSystem}>
                            {req.initiatingSystem}
                          </span>
                        </td>

                        {/* 5. Initiated by */}
                        <td className="px-3 py-3 text-[11px] whitespace-nowrap">
                          <div className="flex items-center space-x-1 text-gray-700 font-mono">
                            <User size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate max-w-[160px]" title={req.initiatedByEmail || 'admin.sso@osttra.com'}>
                              {req.initiatedByEmail || 'admin.sso@osttra.com'}
                            </span>
                          </div>
                        </td>

                        {/* 6. Initiated on */}
                        <td className="px-3 py-3 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Clock size={12} className="text-gray-400 shrink-0" />
                            <span>{req.requestedAt}</span>
                          </div>
                        </td>

                        {/* 7. SSO Status */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check size={11} className="mr-1 text-emerald-600" />
                            Updated
                          </span>
                        </td>

                        {/* 8. Application status */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {req.applications.map(app => (
                              <span 
                                key={`${app.applicationName}-${app.environment}`}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  app.status === 'SUCCESS' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                    : app.status === 'FAILED'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 font-black'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                                title={`${app.applicationName} (${app.environment}): ${app.status} - ${app.responseMessage || ''}`}
                              >
                                {app.status === 'SUCCESS' && <CheckCircle2 size={10} className="mr-1 text-emerald-600" />}
                                {app.status === 'FAILED' && <AlertCircle size={10} className="mr-1 text-rose-600" />}
                                {app.status === 'IN_PROGRESS' && <Clock size={10} className="mr-1 text-blue-600" />}
                                {app.applicationName}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 9. Overall status */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            req.overallStatus === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : req.overallStatus === 'PARTIALLY_FAILED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {req.overallStatus.replace('_', ' ')}
                          </span>
                        </td>

                        {/* 10. Action */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            {failedApps.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRetriggerAllFailed(req.id);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs inline-flex items-center transition-colors cursor-pointer"
                                title={`Retrigger ${failedApps.length} failed application(s)`}
                              >
                                <RotateCcw size={11} className="mr-1" />
                                Retrigger
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequestForDetail(req);
                              }}
                              className="text-xs text-[var(--color-primary)] font-bold hover:underline inline-flex items-center cursor-pointer"
                            >
                              <Eye size={12} className="mr-1" />
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <span>Showing</span>
              <span className="font-bold text-gray-900">
                {totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
              </span>
              <span>to</span>
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * rowsPerPage, totalRecords)}
              </span>
              <span>of</span>
              <span className="font-bold text-gray-900">{totalRecords}</span>
              <span>requests</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Rows:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      <EmailSyncDetailModal
        request={selectedRequestForDetail}
        onClose={() => setSelectedRequestForDetail(null)}
        onRetriggerApp={onRetriggerApp}
        onRetriggerAllFailed={onRetriggerAllFailed}
      />

      {/* Simplified Initiate Modal with Automatic Entitlement Resolution */}
      <InitiateEmailSyncModal
        isOpen={isInitiateModalOpen}
        onClose={() => setIsInitiateModalOpen(false)}
        onInitiateSync={onInitiateSync}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
};
