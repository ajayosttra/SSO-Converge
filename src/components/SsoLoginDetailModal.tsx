import React from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Server, 
  Clock, 
  MapPin, 
  Globe, 
  Key, 
  CheckCircle2, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import { SsoUserLoginRecord } from '../types';

interface SsoLoginDetailModalProps {
  record: SsoUserLoginRecord | null;
  userOtherLogins?: SsoUserLoginRecord[];
  onClose: () => void;
  onFilterUser?: (email: string) => void;
}

export const SsoLoginDetailModal: React.FC<SsoLoginDetailModalProps> = ({
  record,
  userOtherLogins = [],
  onClose,
  onFilterUser
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/20 border border-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent)]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">SSO Authentication Details</h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  record.environment === 'PROD' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {record.environment}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {record.protocol}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Event ID: {record.id} &bull; Session: {record.sessionId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Login Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">User Email ID</span>
              <div className="flex items-center space-x-1.5">
                <User size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm font-bold text-gray-900 truncate" title={record.email}>
                  {record.email}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Application</span>
              <div className="flex items-center space-x-1.5">
                <Server size={14} className="text-blue-500 shrink-0" />
                <span className="text-sm font-bold text-blue-700">
                  {record.applicationName}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Environment</span>
              <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                record.environment === 'PROD' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {record.environment}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Last Login Timestamp</span>
              <div className="flex items-center space-x-1.5">
                <Clock size={14} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-700">
                  {record.lastLoginTimestamp}
                </span>
              </div>
            </div>
          </div>

          {/* User & Identity Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center">
              <User size={14} className="mr-1.5 text-gray-500" />
              Identity & Federation Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-gray-200 rounded-lg p-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-0.5">Display Name</span>
                <span className="font-semibold text-gray-800">{record.displayName || 'Standard User'}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-0.5">Domain</span>
                <span className="font-semibold text-gray-800">{record.domain}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-0.5">SSO Protocol</span>
                <span className="font-semibold text-gray-800">{record.protocol}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-0.5">Authentication Status</span>
                <span className="inline-flex items-center text-emerald-700 font-semibold">
                  <CheckCircle2 size={13} className="mr-1 text-emerald-600" />
                  {record.status}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-500 block mb-0.5">Identity Provider Entity ID (IdP)</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-[11px] block overflow-x-auto">
                  {record.idpEntityId || 'https://sts.windows.net/osttra-corp-aad/'}
                </code>
              </div>
            </div>
          </div>

          {/* Client & Network Telemetry */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center">
              <MapPin size={14} className="mr-1.5 text-gray-500" />
              Client & Network Telemetry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-gray-200 rounded-lg p-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-0.5">Source IP Address</span>
                <span className="font-mono font-semibold text-gray-800">{record.clientIp}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-0.5">Estimated Geo-Location</span>
                <span className="font-semibold text-gray-800">{record.location}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-500 block mb-0.5">Client User Agent</span>
                <span className="font-mono text-gray-600 text-[11px] block truncate" title={record.userAgent}>
                  {record.userAgent || 'Chrome 130.0 / Windows 10'}
                </span>
              </div>
            </div>
          </div>

          {/* User's Recent Logins across other applications */}
          {userOtherLogins.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center">
                  <Server size={14} className="mr-1.5 text-gray-500" />
                  Other Recorded SSO Logins for {record.email}
                </h3>
                {onFilterUser && (
                  <button 
                    onClick={() => {
                      onFilterUser(record.email);
                      onClose();
                    }}
                    className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center"
                  >
                    View all in table <ExternalLink size={12} className="ml-1" />
                  </button>
                )}
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2">Application</th>
                      <th className="px-3 py-2">Environment</th>
                      <th className="px-3 py-2">Last Login Timestamp</th>
                      <th className="px-3 py-2">Source IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {userOtherLogins.slice(0, 5).map(other => (
                      <tr key={other.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-semibold text-gray-800">{other.applicationName}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            other.environment === 'PROD' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {other.environment}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 font-mono text-[11px]">{other.lastLoginTimestamp}</td>
                        <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{other.clientIp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Recorded via SSO Central Federated Gateway
          </span>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
