import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Server, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  FileText, 
  ExternalLink,
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';
import { UserEmailSyncRequest, AppEmailSyncDetail } from '../types';

interface EmailSyncDetailModalProps {
  request: UserEmailSyncRequest | null;
  onClose: () => void;
  onRetriggerApp: (requestId: string, applicationName: string) => void;
  onRetriggerAllFailed: (requestId: string) => void;
}

export const EmailSyncDetailModal: React.FC<EmailSyncDetailModalProps> = ({
  request,
  onClose,
  onRetriggerApp,
  onRetriggerAllFailed
}) => {
  const [retriggeringApp, setRetriggeringApp] = useState<string | null>(null);
  const [isRetriggeringAll, setIsRetriggeringAll] = useState(false);

  if (!request) return null;

  const failedApps = request.applications.filter(a => a.status === 'FAILED');
  const successApps = request.applications.filter(a => a.status === 'SUCCESS');
  const inProgressApps = request.applications.filter(a => a.status === 'IN_PROGRESS');

  const handleSingleAppRetrigger = (appName: string) => {
    setRetriggeringApp(appName);
    setTimeout(() => {
      onRetriggerApp(request.id, appName);
      setRetriggeringApp(null);
    }, 600);
  };

  const handleAllRetrigger = () => {
    setIsRetriggeringAll(true);
    setTimeout(() => {
      onRetriggerAllFailed(request.id);
      setIsRetriggeringAll(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              request.overallStatus === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : request.overallStatus === 'PARTIALLY_FAILED'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">Email Propagation Orchestration Status</h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  request.overallStatus === 'COMPLETED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : request.overallStatus === 'PARTIALLY_FAILED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {request.overallStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Request ID: <span className="font-mono text-gray-300">{request.id}</span> &bull; Ticket: <span className="font-mono text-gray-300">{request.ticketReference}</span>
              </p>
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

          {/* Email Update Transformation Banner */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                User Identity &amp; Email Transformation
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{request.userName}</span>
                <span className="text-xs text-gray-400">({request.domain})</span>
                <span className="mx-1 text-gray-300">&bull;</span>
                <span className="font-mono text-xs line-through text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {request.oldEmail}
                </span>
                <ArrowRight size={14} className="text-gray-400 shrink-0" />
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {request.newEmail}
                </span>
              </div>
            </div>

            {failedApps.length > 0 && (
              <button
                onClick={handleAllRetrigger}
                disabled={isRetriggeringAll}
                className="accent-button text-xs py-2 px-3.5 shadow-sm hover:shadow flex items-center cursor-pointer shrink-0"
              >
                <RotateCcw size={14} className={`mr-1.5 ${isRetriggeringAll ? 'animate-spin' : ''}`} />
                {isRetriggeringAll ? 'Retriggering All...' : `Retrigger All Failed (${failedApps.length})`}
              </button>
            )}
          </div>

          {/* End-to-End Orchestration Pipeline Architecture */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center">
              <Layers size={14} className="mr-1.5 text-gray-500" />
              Propagation Pipeline Flow
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Step 1: User Management System */}
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Step 1 &bull; Initiator</span>
                  <CheckCircle2 size={15} className="text-emerald-500" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 truncate" title={request.initiatingSystem}>
                  {request.initiatingSystem}
                </h4>
                <p className="text-[11px] text-gray-500">
                  Ticket: <code className="bg-gray-100 px-1 py-0.2 rounded font-mono text-[10px]">{request.ticketReference}</code>
                </p>
                <span className="text-[10px] text-gray-400 block pt-1">{request.requestedAt}</span>
              </div>

              {/* Step 2: SSO Gateway Central Directory */}
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Step 2 &bull; SSO Gateway</span>
                  <CheckCircle2 size={15} className="text-emerald-500" />
                </div>
                <h4 className="text-xs font-bold text-gray-800">SSO Central Directory</h4>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center">
                  <Check size={13} className="mr-1 text-emerald-600" />
                  Primary Identity &amp; Federation Mapped
                </p>
                <span className="text-[10px] text-gray-400 block pt-1">Entitlements Resolved: {request.applications.length} Downstream Apps</span>
              </div>

              {/* Step 3: Target Downstream Applications */}
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Step 3 &bull; Target Systems</span>
                  {failedApps.length > 0 ? (
                    <AlertTriangle size={15} className="text-rose-500" />
                  ) : inProgressApps.length > 0 ? (
                    <Clock size={15} className="text-amber-500" />
                  ) : (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-gray-800">
                  {successApps.length} of {request.applications.length} Systems Acknowledged
                </h4>
                <div className="flex items-center space-x-1.5 pt-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    {successApps.length} OK
                  </span>
                  {failedApps.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                      {failedApps.length} Failed
                    </span>
                  )}
                  {inProgressApps.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      {inProgressApps.length} In-Flight
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Downstream Applications Status & Acknowledgment Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
                <Server size={14} className="mr-1.5 text-gray-500" />
                Downstream Applications &amp; Acknowledgment Registry
              </h3>
              <span className="text-xs text-gray-500">
                {request.applications.length} application{request.applications.length > 1 ? 's' : ''} monitored
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Application</th>
                    <th className="px-3 py-2.5 text-center">Environment</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Attempts</th>
                    <th className="px-3 py-2.5">Dispatched / ACK Time</th>
                    <th className="px-3 py-2.5">Response Diagnostics</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {request.applications.map((app) => {
                    const isRetrying = retriggeringApp === app.applicationName;

                    return (
                      <tr key={`${app.applicationName}-${app.environment}`} className="hover:bg-gray-50/70">
                        {/* App Name */}
                        <td className="px-3.5 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                            <div>
                              <span className="font-extrabold text-gray-900 block">{app.applicationName}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{app.payloadTraceId || 'TRC-N/A'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Environment */}
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.environment === 'PROD' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.environment}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          {app.status === 'SUCCESS' && (
                            <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 size={12} className="mr-1 text-emerald-600" />
                              Success ({app.responseCode || 200})
                            </span>
                          )}
                          {app.status === 'FAILED' && (
                            <span className="inline-flex items-center text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <AlertCircle size={12} className="mr-1 text-rose-600" />
                              Failed ({app.responseCode || 500})
                            </span>
                          )}
                          {app.status === 'IN_PROGRESS' && (
                            <span className="inline-flex items-center text-blue-700 font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 animate-pulse">
                              <Clock size={12} className="mr-1 text-blue-600" />
                              Awaiting ACK ({app.responseCode || 202})
                            </span>
                          )}
                        </td>

                        {/* Attempt Count */}
                        <td className="px-3 py-3 text-gray-600 font-medium">
                          {app.attemptCount} attempt{app.attemptCount > 1 ? 's' : ''}
                        </td>

                        {/* Timestamps */}
                        <td className="px-3 py-3 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                          <div>Dispatched: {app.lastAttemptTimestamp}</div>
                          {app.acknowledgedTimestamp && (
                            <div className="text-emerald-700 font-semibold">ACK: {app.acknowledgedTimestamp}</div>
                          )}
                        </td>

                        {/* Response / Diagnostics */}
                        <td className="px-3 py-3 text-xs max-w-xs">
                          {app.status === 'SUCCESS' ? (
                            <span className="text-gray-600 text-[11px] line-clamp-2" title={app.responseMessage}>
                              {app.responseMessage}
                            </span>
                          ) : app.status === 'FAILED' ? (
                            <div className="bg-rose-50 text-rose-800 p-2 rounded border border-rose-200 text-[11px]">
                              <p className="font-semibold">{app.responseMessage}</p>
                              <p className="text-[10px] text-rose-700 mt-0.5">{app.failureReason}</p>
                            </div>
                          ) : (
                            <span className="text-blue-700 text-[11px]">
                              {app.responseMessage || 'Processing async payload across message queue...'}
                            </span>
                          )}
                        </td>

                        {/* Action: Retrigger */}
                        <td className="px-3 py-3 text-right">
                          {app.status === 'FAILED' ? (
                            <button
                              type="button"
                              onClick={() => handleSingleAppRetrigger(app.applicationName)}
                              disabled={isRetrying}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] shadow-xs inline-flex items-center transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw size={11} className={`mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                              {isRetrying ? 'Retrying...' : 'Retrigger'}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Note */}
          {request.notes && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-start space-x-2">
              <FileText size={15} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-700">Audit Notes: </span>
                {request.notes}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Total Retries Logged: {request.retryCount}
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
