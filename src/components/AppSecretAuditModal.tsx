import React, { useState, useMemo } from 'react';
import { 
  History, 
  ArrowLeftRight, 
  Check, 
  Copy, 
  Calendar, 
  User, 
  Tag, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  X, 
  GitCompare, 
  Layers,
  Info,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { AppSecret, AppSecretAuditRecord } from '../types';

interface AppSecretAuditModalProps {
  secret: AppSecret;
  auditRecords: AppSecretAuditRecord[];
  onClose: () => void;
  onRotate?: (secret: AppSecret) => void;
}

export const AppSecretAuditModal: React.FC<AppSecretAuditModalProps> = ({
  secret,
  auditRecords,
  onClose,
  onRotate
}) => {
  const [activeTab, setActiveTab] = useState<'compare' | 'timeline'>('compare');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Revisions to compare (default to newest two records, or first two)
  const [recordAId, setRecordAId] = useState<string>(
    auditRecords.length > 1 ? auditRecords[1].id : (auditRecords[0]?.id || '')
  );
  const [recordBId, setRecordBId] = useState<string>(
    auditRecords[0]?.id || ''
  );

  const recordA = useMemo(() => {
    return auditRecords.find(r => r.id === recordAId) || auditRecords[1] || auditRecords[0];
  }, [auditRecords, recordAId]);

  const recordB = useMemo(() => {
    return auditRecords.find(r => r.id === recordBId) || auditRecords[0];
  }, [auditRecords, recordBId]);

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(identifier);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate field differences between Record A and Record B
  const fieldComparisons = useMemo(() => {
    if (!recordA || !recordB) return [];

    const fields = [
      {
        key: 'version',
        label: 'Audit Version',
        valA: recordA.version,
        valB: recordB.version,
        isDiff: recordA.version !== recordB.version,
        category: 'Metadata'
      },
      {
        key: 'timestamp',
        label: 'Timestamp (UTC)',
        valA: recordA.timestamp,
        valB: recordB.timestamp,
        isDiff: recordA.timestamp !== recordB.timestamp,
        category: 'Audit Event'
      },
      {
        key: 'action',
        label: 'Audit Action Type',
        valA: recordA.action.replace(/_/g, ' '),
        valB: recordB.action.replace(/_/g, ' '),
        isDiff: recordA.action !== recordB.action,
        category: 'Audit Event'
      },
      {
        key: 'actor',
        label: 'Action Performed By (Actor)',
        valA: recordA.actor,
        valB: recordB.actor,
        isDiff: recordA.actor !== recordB.actor,
        category: 'Audit Event'
      },
      {
        key: 'ticketId',
        label: 'Security / Change Ticket ID',
        valA: recordA.ticketId,
        valB: recordB.ticketId,
        isDiff: recordA.ticketId !== recordB.ticketId,
        category: 'Audit Event'
      },
      {
        key: 'ipAddress',
        label: 'Origin Network / IP Address',
        valA: recordA.ipAddress,
        valB: recordB.ipAddress,
        isDiff: recordA.ipAddress !== recordB.ipAddress,
        category: 'Audit Event'
      },
      {
        key: 'secretHint',
        label: 'Secret Hint',
        valA: recordA.details.secretHint,
        valB: recordB.details.secretHint,
        isDiff: recordA.details.secretHint !== recordB.details.secretHint,
        category: 'Credential State'
      },
      {
        key: 'expiryDate',
        label: 'Expiry Date',
        valA: recordA.details.expiryDate,
        valB: recordB.details.expiryDate,
        isDiff: recordA.details.expiryDate !== recordB.details.expiryDate,
        category: 'Credential State'
      },
      {
        key: 'createdDate',
        label: 'Creation Date',
        valA: recordA.details.createdDate,
        valB: recordB.details.createdDate,
        isDiff: recordA.details.createdDate !== recordB.details.createdDate,
        category: 'Credential State'
      },
      {
        key: 'status',
        label: 'Lifecycle Status',
        valA: recordA.details.status,
        valB: recordB.details.status,
        isDiff: recordA.details.status !== recordB.details.status,
        category: 'Credential State'
      },
      {
        key: 'daysRemaining',
        label: 'Days Remaining',
        valA: `${recordA.details.daysRemaining} days`,
        valB: `${recordB.details.daysRemaining} days`,
        isDiff: recordA.details.daysRemaining !== recordB.details.daysRemaining,
        category: 'Credential State'
      },
      {
        key: 'ownerEmail',
        label: 'Service Account Owner',
        valA: recordA.details.ownerEmail,
        valB: recordB.details.ownerEmail,
        isDiff: recordA.details.ownerEmail !== recordB.details.ownerEmail,
        category: 'Credential State'
      },
      {
        key: 'rotationReason',
        label: 'Rotation Reason / Compliance Justification',
        valA: recordA.details.rotationReason,
        valB: recordB.details.rotationReason,
        isDiff: recordA.details.rotationReason !== recordB.details.rotationReason,
        category: 'Governance'
      },
      {
        key: 'authAlgorithm',
        label: 'Hash Algorithm & Format',
        valA: recordA.details.authAlgorithm || 'HMAC-SHA512 (512-bit)',
        valB: recordB.details.authAlgorithm || 'HMAC-SHA512 (512-bit)',
        isDiff: (recordA.details.authAlgorithm || '') !== (recordB.details.authAlgorithm || ''),
        category: 'Governance'
      }
    ];

    return fields;
  }, [recordA, recordB]);

  const diffCount = useMemo(() => {
    return fieldComparisons.filter(f => f.isDiff).length;
  }, [fieldComparisons]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <History size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Audit Records &amp; Revision Diff
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  {secret.environment}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5 font-mono">
                <span className="font-semibold text-white">{secret.applicationName}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-400 text-[11px]">Client ID: {secret.clientId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Audit Records"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Summary Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              <GitCompare size={14} />
              <span>Compare Two Records ({diffCount} Differences)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              <Layers size={14} />
              <span>Audit Timeline ({auditRecords.length} Events)</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Current Hint: <code className="font-mono font-bold ml-1">{secret.secretHint}</code>
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {activeTab === 'compare' ? (
            /* ========================================================================= */
            /* TAB 1: COMPARE TWO RECORDS (DIFF VIEW)                                    */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Record Selector Headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                {/* Record A Selector (Base) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      Record A (Base Revision)
                    </label>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {recordA?.timestamp}
                    </span>
                  </div>
                  <select
                    value={recordAId}
                    onChange={(e) => setRecordAId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {auditRecords.map((rec) => (
                      <option key={`a-${rec.id}`} value={rec.id}>
                        {rec.version} &mdash; {rec.action} ({rec.timestamp.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500">
                    By <span className="font-semibold text-gray-700">{recordA?.actor}</span> &bull; Ticket: <code className="bg-gray-100 px-1 py-0.5 rounded">{recordA?.ticketId}</code>
                  </p>
                </div>

                {/* Record B Selector (Comparison Target) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      Record B (Comparison Revision)
                    </label>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {recordB?.timestamp}
                    </span>
                  </div>
                  <select
                    value={recordBId}
                    onChange={(e) => setRecordBId(e.target.value)}
                    className="w-full bg-white border border-indigo-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {auditRecords.map((rec) => (
                      <option key={`b-${rec.id}`} value={rec.id}>
                        {rec.version} &mdash; {rec.action} ({rec.timestamp.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500">
                    By <span className="font-semibold text-gray-700">{recordB?.actor}</span> &bull; Ticket: <code className="bg-gray-100 px-1 py-0.5 rounded">{recordB?.ticketId}</code>
                  </p>
                </div>
              </div>

              {/* Differences Summary Pill */}
              <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>
                    Comparing <strong>{recordA?.version}</strong> with <strong>{recordB?.version}</strong>: 
                    Found <strong>{diffCount} field{diffCount !== 1 ? 's' : ''} modified</strong>.
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Swap Record A and Record B
                      const temp = recordAId;
                      setRecordAId(recordBId);
                      setRecordBId(temp);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 text-amber-800 rounded text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight size={12} />
                    <span>Swap A &harr; B</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Diff Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                      <th className="py-2.5 px-4 w-1/4">Field / Attribute</th>
                      <th className="py-2.5 px-4 w-1/3 bg-slate-50/70 border-r border-gray-200">
                        Record A: {recordA?.version}
                      </th>
                      <th className="py-2.5 px-4 w-1/3 bg-indigo-50/50">
                        Record B: {recordB?.version}
                      </th>
                      <th className="py-2.5 px-3 text-center w-24">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fieldComparisons.map((item) => (
                      <tr
                        key={item.key}
                        className={`transition-colors ${
                          item.isDiff 
                            ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                            : 'hover:bg-gray-50/60'
                        }`}
                      >
                        {/* Field Label */}
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          <div>{item.label}</div>
                          <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">
                            {item.category}
                          </span>
                        </td>

                        {/* Record A Value */}
                        <td className={`py-3 px-4 font-mono text-[11.5px] border-r border-gray-100 ${
                          item.isDiff ? 'text-gray-900 bg-amber-50/20' : 'text-gray-600'
                        }`}>
                          <div className="flex items-center justify-between group">
                            <span className="break-all">{String(item.valA)}</span>
                            <button
                              onClick={() => handleCopy(String(item.valA), `a-${item.key}`)}
                              className="text-gray-300 group-hover:text-gray-600 transition-colors p-1"
                              title="Copy value"
                            >
                              {copiedField === `a-${item.key}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Record B Value */}
                        <td className={`py-3 px-4 font-mono text-[11.5px] ${
                          item.isDiff ? 'text-indigo-950 font-bold bg-indigo-50/30' : 'text-gray-600'
                        }`}>
                          <div className="flex items-center justify-between group">
                            <span className="break-all">{String(item.valB)}</span>
                            <button
                              onClick={() => handleCopy(String(item.valB), `b-${item.key}`)}
                              className="text-gray-300 group-hover:text-gray-600 transition-colors p-1"
                              title="Copy value"
                            >
                              {copiedField === `b-${item.key}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status Diff Badge */}
                        <td className="py-3 px-3 text-center">
                          {item.isDiff ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                              CHANGED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                              Unchanged
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB 2: AUDIT TIMELINE VIEW                                                */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="text-xs text-gray-500">
                Complete sequential audit history for <strong className="text-gray-900">{secret.applicationName}</strong>.
                Select any record to inspect snapshot parameters or set as comparison targets.
              </div>

              <div className="space-y-3">
                {auditRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-xs transition-all bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-bold text-gray-900 text-sm">
                            {record.version}
                          </span>
                          <span className="ml-2 text-xs font-mono text-gray-500">
                            {record.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          record.action === 'CLIENT_SECRET_ROTATED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : record.action === 'EXPIRY_DATE_UPDATED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {record.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                          Ticket: {record.ticketId}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10.5px]">Actor / Performed By:</span>
                        <span className="font-semibold text-gray-800">{record.actor}</span>
                        <span className="text-[11px] text-gray-500 block truncate" title={record.ipAddress}>
                          IP: {record.ipAddress}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10.5px]">Secret Hint &amp; Status:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">
                            {record.details.secretHint}
                          </code>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            record.details.status === 'Expired'
                              ? 'bg-rose-600 text-white'
                              : record.details.status === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {record.details.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10.5px]">Expiry Timestamp:</span>
                        <span className="font-mono text-gray-700 text-[11.5px]">
                          {record.details.expiryDate}
                        </span>
                      </div>
                    </div>

                    {record.details.rotationReason && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <strong className="text-gray-700">Reason:</strong> {record.details.rotationReason}
                      </div>
                    )}

                    {/* Action Bar for this Record */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-end space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setRecordAId(record.id);
                          setActiveTab('compare');
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                      >
                        Set as Record A
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordBId(record.id);
                          setActiveTab('compare');
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded border border-indigo-200 transition-colors cursor-pointer"
                      >
                        Set as Record B &amp; Compare &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            Audit logs are cryptographically sealed in compliance with ISO 27001 &amp; SOC2 Type II credential access requirements.
          </div>

          <div className="flex items-center space-x-2.5">
            {onRotate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRotate(secret);
                }}
                className="px-3.5 py-2 bg-[var(--color-primary)] hover:bg-opacity-90 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Rotate Secret</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
