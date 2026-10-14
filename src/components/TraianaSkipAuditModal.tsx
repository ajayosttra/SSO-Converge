import React, { useState } from 'react';
import { 
  History, 
  X, 
  Search, 
  RotateCcw, 
  Mail, 
  CheckCircle2, 
  ShieldAlert, 
  Filter, 
  Download,
  Calendar,
  Ticket,
  User,
  Layers
} from 'lucide-react';
import { TraianaSkipAuditRecord } from '../types';

interface TraianaSkipAuditModalProps {
  logs: TraianaSkipAuditRecord[];
  filterUserName?: string | null;
  onClose: () => void;
}

export const TraianaSkipAuditModal: React.FC<TraianaSkipAuditModalProps> = ({
  logs,
  filterUserName,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState(filterUserName || '');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'RESET_SKIP_COUNTER' | 'ADMIN_VERIFY_EMAIL' | 'OTP_VERIFIED'>('ALL');

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.application.toLowerCase().includes(q) ||
        log.ticketId.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        (log.newVerifiedEmail && log.newVerifiedEmail.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportAuditCsv = () => {
    const headers = ['Timestamp', 'Action', 'User Name', 'Application', 'Performed By', 'Ticket ID', 'Previous Skips', 'New Skips', 'Verified Email', 'Reason'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.userName}"`,
      `"${l.application}"`,
      `"${l.performedBy}"`,
      `"${l.ticketId}"`,
      l.previousSkipCount,
      l.newSkipCount,
      `"${l.newVerifiedEmail || 'N/A'}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `traiana_skip_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 overflow-hidden border border-gray-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-800 rounded-lg text-teal-400">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Traiana Skip Counter &amp; Email Verification Audit Trail</h2>
              <p className="text-xs text-slate-400">Comprehensive compliance log of resets and admin overrides</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, ticket, email, or admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e: any) => setActionFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none"
            >
              <option value="ALL">All Actions ({logs.length})</option>
              <option value="RESET_SKIP_COUNTER">Reset Skip Counter</option>
              <option value="ADMIN_VERIFY_EMAIL">Admin Verified Email</option>
              <option value="OTP_VERIFIED">Self OTP Verified</option>
            </select>

            <button
              type="button"
              onClick={exportAuditCsv}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Audit List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No audit records matching your search filters.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs hover:border-gray-300 transition-all space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    {log.action === 'RESET_SKIP_COUNTER' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <RotateCcw size={12} />
                        <span>RESET SKIP COUNTER</span>
                      </span>
                    ) : log.action === 'ADMIN_VERIFY_EMAIL' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1">
                        <Mail size={12} />
                        <span>ADMIN VERIFIED EMAIL</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>{log.action}</span>
                      </span>
                    )}

                    <span className="font-mono font-bold text-xs text-gray-900">{log.userName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {log.application}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xxs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Ticket size={11} className="text-gray-400" />
                      <strong className="text-gray-700">{log.ticketId}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400" />
                      <span>{log.timestamp}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold">Performed By:</span>
                    <span className="font-medium text-gray-800">{log.performedBy}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold">Skip Counter Transition:</span>
                    <span className="font-semibold text-gray-800">
                      {log.previousSkipCount} skips &rarr; <span className="text-emerald-700 font-bold">{log.newSkipCount} skips</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold">Verified Email ID:</span>
                    <span className="font-mono text-gray-800 font-semibold">
                      {log.newVerifiedEmail || 'None'}
                    </span>
                  </div>
                </div>

                {log.reason && (
                  <div className="text-xs bg-slate-50 border border-slate-200/80 rounded p-2 text-slate-700 mt-1">
                    <span className="font-bold text-slate-900">Reason / Notes: </span>
                    <span>{log.reason}</span>
                    {log.notes && <span className="block text-xxs text-slate-500 mt-0.5">{log.notes}</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-gray-500">
          <span>Displaying {filteredLogs.length} of {logs.length} audit records</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
