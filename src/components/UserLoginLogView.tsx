import React, { useState, useMemo } from 'react';
import { 
  Search, 
  RotateCcw, 
  Download, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Eye, 
  Activity,
  Server
} from 'lucide-react';
import { SsoUserLoginRecord, SsoAuthProtocol } from '../types';
import { SsoLoginDetailModal } from './SsoLoginDetailModal';

interface UserLoginLogViewProps {
  loginRecords: SsoUserLoginRecord[];
  onRecordLogin?: (data: {
    email: string;
    applicationName: string;
    environment: 'PROD' | 'UAT';
    protocol: SsoAuthProtocol;
    clientIp: string;
    location: string;
  }) => void;
  onNavigateHome?: () => void;
}

export const UserLoginLogView: React.FC<UserLoginLogViewProps> = ({
  loginRecords,
  onRecordLogin,
  onNavigateHome
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('ALL');
  const [selectedEnv, setSelectedEnv] = useState<string>('ALL');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<SsoUserLoginRecord | null>(null);

  // Extract each user's latest login record per application & environment
  const userLastLoginRecords = useMemo(() => {
    const map = new Map<string, SsoUserLoginRecord>();
    // Sort descending by timestamp so first occurrence is the latest login
    const sorted = [...loginRecords].sort((a, b) => b.rawTimestamp - a.rawTimestamp);
    for (const rec of sorted) {
      const key = `${rec.email.toLowerCase()}::${rec.applicationName}::${rec.environment}`;
      if (!map.has(key)) {
        map.set(key, rec);
      }
    }
    return Array.from(map.values());
  }, [loginRecords]);

  // Extract unique applications present in data
  const availableApps = useMemo(() => {
    const set = new Set<string>();
    loginRecords.forEach(r => set.add(r.applicationName));
    return Array.from(set).sort();
  }, [loginRecords]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedApp('ALL');
    setSelectedEnv('ALL');
    setCurrentPage(1);
  };

  // Filtered Last Login Records
  const filteredRecords = useMemo(() => {
    return userLastLoginRecords.filter(record => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        record.email.toLowerCase().includes(q) ||
        record.applicationName.toLowerCase().includes(q) ||
        record.domain.toLowerCase().includes(q) ||
        (record.displayName && record.displayName.toLowerCase().includes(q)) ||
        record.lastLoginTimestamp.toLowerCase().includes(q) ||
        record.clientIp.toLowerCase().includes(q) ||
        record.sessionId.toLowerCase().includes(q);

      const matchesApp = selectedApp === 'ALL' || record.applicationName === selectedApp;
      const matchesEnv = selectedEnv === 'ALL' || record.environment === selectedEnv;

      return matchesSearch && matchesApp && matchesEnv;
    });
  }, [userLastLoginRecords, searchQuery, selectedApp, selectedEnv]);

  // Pagination
  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  // Quick Stats based on user last login records
  const stats = useMemo(() => {
    const uniqueUsers = new Set(userLastLoginRecords.map(r => r.email.toLowerCase())).size;
    const prodCount = userLastLoginRecords.filter(r => r.environment === 'PROD').length;
    const uatCount = userLastLoginRecords.filter(r => r.environment === 'UAT').length;
    return {
      total: userLastLoginRecords.length,
      users: uniqueUsers,
      prod: prodCount,
      uat: uatCount
    };
  }, [userLastLoginRecords]);

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "User Email ID,User Name,Domain,Application Name,Environment,Last Login Timestamp,SSO Protocol,Status,Source IP,Location,Session ID\n";
    filteredRecords.forEach(r => {
      csvContent += `"${r.email}","${r.displayName || ''}","${r.domain}","${r.applicationName}","${r.environment}","${r.lastLoginTimestamp}","${r.protocol}","${r.status}","${r.clientIp}","${r.location}","${r.sessionId}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sso_user_last_login_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for user details in detail modal
  const userOtherLogins = useMemo(() => {
    if (!selectedRecordForDetail) return [];
    return loginRecords.filter(r => r.email.toLowerCase() === selectedRecordForDetail.email.toLowerCase() && r.id !== selectedRecordForDetail.id);
  }, [loginRecords, selectedRecordForDetail]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f6f6f6] overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
              {onNavigateHome && (
                <button onClick={onNavigateHome} className="hover:text-gray-800 transition-colors cursor-pointer">
                  Home
                </button>
              )}
              {onNavigateHome && <span>/</span>}
              <span className="font-semibold text-gray-700">Audit &amp; Telemetry</span>
              <span>/</span>
              <span className="text-[var(--color-primary)] font-bold">User Login Log</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center">
              <Clock className="mr-2 text-[var(--color-primary)]" size={24} />
              User Last Login Blotter
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Consolidated view of each user's latest recorded SSO authentication timestamp across all applications and environments.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center shadow-xs transition-colors cursor-pointer"
            >
              <Download size={15} className="mr-1.5 text-gray-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Total Last Login Records</span>
              <span className="text-2xl font-black text-gray-900">{stats.total}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Distinct Users</span>
              <span className="text-2xl font-black text-gray-900">{stats.users}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">PROD Entitlements</span>
              <span className="text-2xl font-black text-emerald-700">{stats.prod}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              PROD
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">UAT Entitlements</span>
              <span className="text-2xl font-black text-amber-700">{stats.uat}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              UAT
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
                placeholder="Search by User Email, Application, Domain, or IP..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Application Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedApp}
                onChange={(e) => {
                  setSelectedApp(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--color-accent)]"
              >
                <option value="ALL">All Applications (Any)</option>
                {availableApps.map(app => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
            </div>

            {/* Environment Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedEnv}
                onChange={(e) => {
                  setSelectedEnv(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-[var(--color-accent)]"
              >
                <option value="ALL">All Environments</option>
                <option value="PROD">PROD Only</option>
                <option value="UAT">UAT Only</option>
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

          {/* Active filter badges */}
          {(searchQuery || selectedApp !== 'ALL' || selectedEnv !== 'ALL') && (
            <div className="flex items-center space-x-2 text-[11px] text-gray-500 pt-1">
              <span>Active filters:</span>
              {searchQuery && (
                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-700 font-medium">
                  Query: "{searchQuery}"
                </span>
              )}
              {selectedApp !== 'ALL' && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                  App: {selectedApp}
                </span>
              )}
              {selectedEnv !== 'ALL' && (
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  selectedEnv === 'PROD' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Env: {selectedEnv}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Single Unified Data Table with User Last Login Records */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-table-header-bg)] text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">User Email ID</th>
                  <th className="px-4 py-3">Application Name</th>
                  <th className="px-4 py-3 text-center">Environment</th>
                  <th className="px-4 py-3">Last Login Timestamp</th>
                  <th className="px-4 py-3">SSO Protocol</th>
                  <th className="px-4 py-3">Source IP &amp; Location</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <Clock size={36} className="mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-600">No user last login records found</p>
                      <p className="text-[11px] text-gray-400 mt-1">Try adjusting your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map(record => (
                    <tr 
                      key={`${record.email}-${record.applicationName}-${record.environment}`}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedRecordForDetail(record)}
                    >
                      {/* User Email ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-700 shrink-0 uppercase">
                            {record.email.substring(0, 2)}
                          </div>
                          <div className="truncate max-w-[220px]">
                            <span className="font-bold text-gray-900 block truncate" title={record.email}>
                              {record.email}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {record.displayName ? `${record.displayName} • ` : ''}{record.domain}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Application Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                          <span className="font-extrabold text-blue-900">
                            {record.applicationName}
                          </span>
                        </div>
                      </td>

                      {/* Environment */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          record.environment === 'PROD'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {record.environment}
                        </span>
                      </td>

                      {/* Last Login Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock size={13} className="text-emerald-600 shrink-0" />
                          <span className="font-bold text-gray-900 font-mono text-xs">
                            {record.lastLoginTimestamp}
                          </span>
                        </div>
                      </td>

                      {/* SSO Protocol */}
                      <td className="px-4 py-3 text-gray-700">
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium text-[11px]">
                          {record.protocol}
                        </span>
                      </td>

                      {/* Source IP & Location */}
                      <td className="px-4 py-3 text-gray-600 text-[11px]">
                        <span className="font-mono text-gray-800 block">{record.clientIp}</span>
                        <span className="text-gray-400 truncate block max-w-[150px]" title={record.location}>
                          {record.location}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={11} className="mr-1 text-emerald-600" />
                          {record.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordForDetail(record);
                          }}
                          className="text-xs text-[var(--color-primary)] font-bold hover:underline inline-flex items-center cursor-pointer"
                        >
                          <Eye size={12} className="mr-1" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
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
              <span>records</span>
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
                  className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      <SsoLoginDetailModal
        record={selectedRecordForDetail}
        userOtherLogins={userOtherLogins}
        onClose={() => setSelectedRecordForDetail(null)}
        onFilterUser={(email) => {
          setSearchQuery(email);
          setSelectedRecordForDetail(null);
        }}
      />
    </div>
  );
};
