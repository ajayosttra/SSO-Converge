import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  X, 
  ArrowLeftRight, 
  Check, 
  AlertCircle, 
  Download, 
  ShieldCheck, 
  Network,
  Clock,
  User as UserIcon,
  Tag,
  FileText
} from 'lucide-react';
import { Domain, AuditRecord } from '../types';

interface AuditCompareViewProps {
  domain: Domain;
  recordA: AuditRecord;
  recordB: AuditRecord;
  onBack: () => void;
  onClose: () => void;
}

export const AuditCompareView: React.FC<AuditCompareViewProps> = ({
  domain,
  recordA,
  recordB,
  onBack,
  onClose
}) => {
  const [isSwapped, setIsSwapped] = useState(false);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

  // Determine chronological order: earlier is baseline (left), later is compared (right)
  const [leftRecord, rightRecord] = useMemo(() => {
    if (isSwapped) {
      return [recordB, recordA];
    }
    return [recordA, recordB];
  }, [recordA, recordB, isSwapped]);

  const snapL = leftRecord.snapshot || ({} as any);
  const snapR = rightRecord.snapshot || ({} as any);

  // Field comparisons definition
  const fields = useMemo(() => {
    const list = [
      {
        key: 'domain',
        label: 'Domain Name',
        left: snapL.domain || domain.domain,
        right: snapR.domain || domain.domain,
        type: 'text'
      },
      {
        key: 'federated',
        label: 'Federated Status',
        left: snapL.federated || 'No',
        right: snapR.federated || 'No',
        type: 'badge',
        isDifferent: (snapL.federated || 'No') !== (snapR.federated || 'No')
      },
      {
        key: 'collaborationType',
        label: 'Collaboration Type',
        left: snapL.collaborationType || '-',
        right: snapR.collaborationType || '-',
        type: 'badge',
        isDifferent: (snapL.collaborationType || '') !== (snapR.collaborationType || '')
      },
      {
        key: 'samlRegistrationId',
        label: 'SAML Registration ID',
        left: snapL.samlRegistrationId || '-',
        right: snapR.samlRegistrationId || '-',
        type: 'text',
        isDifferent: (snapL.samlRegistrationId || '') !== (snapR.samlRegistrationId || '')
      },
      {
        key: 'mfaStatus',
        label: 'MFA Status',
        left: snapL.mfaStatus || 'Disabled',
        right: snapR.mfaStatus || 'Disabled',
        type: 'mfa',
        isDifferent: (snapL.mfaStatus || 'Disabled') !== (snapR.mfaStatus || 'Disabled')
      },
      {
        key: 'whitelistedIps',
        label: 'Whitelisted IPs',
        left: snapL.whitelistedIps || [],
        right: snapR.whitelistedIps || [],
        type: 'ips',
        isDifferent: JSON.stringify(snapL.whitelistedIps || []) !== JSON.stringify(snapR.whitelistedIps || [])
      },
      {
        key: 'status',
        label: 'Domain Status',
        left: leftRecord.status || snapL.status || 'Enabled',
        right: rightRecord.status || snapR.status || 'Enabled',
        type: 'status',
        isDifferent: (leftRecord.status || snapL.status) !== (rightRecord.status || snapR.status)
      },
      {
        key: 'ticketId',
        label: 'Ticket Id',
        left: leftRecord.ticketId || snapL.ssoobTicket || 'N/A',
        right: rightRecord.ticketId || snapR.ssoobTicket || 'N/A',
        type: 'text',
        isDifferent: (leftRecord.ticketId || snapL.ssoobTicket) !== (rightRecord.ticketId || snapR.ssoobTicket)
      },
      {
        key: 'infosecTicket',
        label: 'INFOSEC Ticket Reference',
        left: snapL.infosecTicket || '-',
        right: snapR.infosecTicket || '-',
        type: 'text',
        isDifferent: (snapL.infosecTicket || '') !== (snapR.infosecTicket || '')
      },
      {
        key: 'actionType',
        label: 'Action Type',
        left: leftRecord.actionType,
        right: rightRecord.actionType,
        type: 'actionType',
        isDifferent: leftRecord.actionType !== rightRecord.actionType
      },
      {
        key: 'actionBy',
        label: 'Action By',
        left: leftRecord.actionBy,
        right: rightRecord.actionBy,
        type: 'user',
        isDifferent: leftRecord.actionBy !== rightRecord.actionBy
      },
      {
        key: 'timestamp',
        label: 'Timestamp',
        left: leftRecord.timestamp,
        right: rightRecord.timestamp,
        type: 'timestamp',
        isDifferent: leftRecord.timestamp !== rightRecord.timestamp
      },
      {
        key: 'description',
        label: 'Change Description',
        left: leftRecord.description || '(No description provided)',
        right: rightRecord.description || '(No description provided)',
        type: 'text',
        isDifferent: (leftRecord.description || '') !== (rightRecord.description || '')
      }
    ];

    return list.map(item => ({
      ...item,
      isDifferent: item.isDifferent !== undefined ? item.isDifferent : item.left !== item.right
    }));
  }, [snapL, snapR, leftRecord, rightRecord, domain]);

  const diffCount = fields.filter(f => f.isDifferent).length;
  const filteredFields = showOnlyDiffs ? fields.filter(f => f.isDifferent) : fields;

  const handleExportComparison = () => {
    const csvRows = [
      ['Attribute', `Version 1 (${leftRecord.timestamp})`, `Version 2 (${rightRecord.timestamp})`, 'Status'],
      ...fields.map(f => [
        f.label,
        Array.isArray(f.left) ? f.left.join('; ') : String(f.left),
        Array.isArray(f.right) ? f.right.join('; ') : String(f.right),
        f.isDifferent ? 'MODIFIED' : 'UNCHANGED'
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Comparison_${domain.domain}_${leftRecord.id}_vs_${rightRecord.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderValue = (field: typeof fields[0], val: any, isRightSide: boolean) => {
    if (field.type === 'ips') {
      const ips = Array.isArray(val) ? val : [];
      if (ips.length === 0) {
        return <span className="text-gray-400 italic text-xs">No IP restrictions (Unrestricted)</span>;
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {ips.map((ip: string, i: number) => {
            const otherIps = Array.isArray(isRightSide ? field.left : field.right) ? (isRightSide ? field.left : field.right) : [];
            const isAdded = isRightSide && !otherIps.includes(ip);
            const isRemoved = !isRightSide && !otherIps.includes(ip);
            return (
              <span 
                key={i} 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                  isAdded 
                    ? 'bg-green-100 text-green-900 border-green-300' 
                    : isRemoved
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                <Network size={11} className="text-emerald-700 shrink-0" />
                {ip}
                {isAdded && <span className="text-[9px] bg-green-200 text-green-800 px-1 rounded font-sans ml-0.5">+Added</span>}
                {isRemoved && <span className="text-[9px] bg-red-200 text-red-800 px-1 rounded font-sans ml-0.5">-Removed</span>}
              </span>
            );
          })}
        </div>
      );
    }

    if (field.type === 'mfa') {
      const isEnabled = val === 'Enabled';
      return (
        <span className={`inline-flex items-center gap-1 font-bold text-xs ${isEnabled ? 'text-green-700' : 'text-gray-500'}`}>
          <ShieldCheck size={14} className={isEnabled ? 'text-green-600' : 'text-gray-400'} />
          {val}
        </span>
      );
    }

    if (field.type === 'status') {
      return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          val === 'Enabled' ? 'bg-[#3f8318] text-white' :
          val === 'Pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
          'bg-gray-200 text-gray-700'
        }`}>
          {val}
        </span>
      );
    }

    if (field.type === 'actionType') {
      return (
        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
          val === 'Initial' 
            ? 'bg-blue-50 text-blue-800 border-blue-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {val}
        </span>
      );
    }

    return (
      <span className="text-gray-800 text-xs font-medium">
        {String(val || '-')}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top action / Sub-header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md border border-teal-200 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Audit Log
          </button>
          <div className="h-4 w-[1px] bg-gray-300" />
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-500">Domain:</span>
            <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{domain.domain}</span>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${diffCount > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-green-100 text-green-900 border border-green-300'}`}>
            {diffCount} {diffCount === 1 ? 'Difference' : 'Differences'} Found
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-300 px-2.5 py-1.5 rounded-md cursor-pointer hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={showOnlyDiffs} 
              onChange={e => setShowOnlyDiffs(e.target.checked)} 
              className="accent-teal-700 rounded"
            />
            <span>Show Only Modified ({diffCount})</span>
          </label>

          <button 
            type="button"
            onClick={() => setIsSwapped(!isSwapped)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Swap columns order"
          >
            <ArrowLeftRight size={13} /> Swap Columns
          </button>

          <button 
            type="button"
            onClick={handleExportComparison}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Export Comparison Report (CSV)"
          >
            <Download size={13} /> Export Diff
          </button>
        </div>
      </div>

      {/* Side by side Version Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Version */}
        <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-3.5 space-y-2 relative shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
              Version 1 (Left)
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 px-2 py-0.5 rounded">
              {leftRecord.actionType}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                <Clock size={11} /> Timestamp
              </p>
              <p className="font-bold text-gray-800">{leftRecord.timestamp}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                <UserIcon size={11} /> Action By
              </p>
              <p className="font-bold text-gray-800">{leftRecord.actionBy}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                <Tag size={11} /> Ticket ID
              </p>
              <p className="font-bold text-gray-800">{leftRecord.ticketId}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                <FileText size={11} /> Status
              </p>
              <p className="font-bold text-green-700">{leftRecord.status}</p>
            </div>
          </div>
        </div>

        {/* Right Version */}
        <div className="bg-teal-50/50 border-2 border-teal-400 rounded-lg p-3.5 space-y-2 relative shadow-xs">
          <div className="flex items-center justify-between border-b border-teal-200 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Version 2 (Right)
            </span>
            <span className="text-xs font-mono font-bold text-teal-900 bg-white border border-teal-300 px-2 py-0.5 rounded">
              {rightRecord.actionType}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                <Clock size={11} className="text-teal-700" /> Timestamp
              </p>
              <p className="font-bold text-gray-900">{rightRecord.timestamp}</p>
            </div>
            <div>
              <p className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                <UserIcon size={11} className="text-teal-700" /> Action By
              </p>
              <p className="font-bold text-gray-900">{rightRecord.actionBy}</p>
            </div>
            <div>
              <p className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                <Tag size={11} className="text-teal-700" /> Ticket ID
              </p>
              <p className="font-bold text-gray-900">{rightRecord.ticketId}</p>
            </div>
            <div>
              <p className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                <FileText size={11} className="text-teal-700" /> Status
              </p>
              <p className="font-bold text-green-700">{rightRecord.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Table Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex-1 overflow-y-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-[#f0f8f8] border-b border-gray-300 sticky top-0 z-10">
            <tr>
              <th className="p-3 font-bold text-gray-700 w-1/4">Field / Property</th>
              <th className="p-3 font-bold text-slate-800 w-[35%] bg-slate-100/70 border-r border-gray-200">
                Version 1 ({leftRecord.timestamp})
              </th>
              <th className="p-3 font-bold text-teal-950 w-[35%] bg-teal-100/60 border-r border-gray-200">
                Version 2 ({rightRecord.timestamp})
              </th>
              <th className="p-3 font-bold text-gray-700 w-[5%] text-center">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredFields.map((field, idx) => {
              const isDiff = field.isDifferent;
              return (
                <tr 
                  key={field.key} 
                  className={`${
                    isDiff 
                      ? 'bg-amber-50/40 hover:bg-amber-100/40 font-medium' 
                      : idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/50'
                  } transition-colors`}
                >
                  <td className="p-3 font-semibold text-gray-700 border-r border-gray-200 flex items-center gap-1.5">
                    {field.label}
                    {isDiff && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" title="Field changed" />
                    )}
                  </td>

                  {/* Left Column Value */}
                  <td className="p-3 border-r border-gray-200 bg-slate-50/30">
                    <div className="space-y-1">
                      {renderValue(field, field.left, false)}
                    </div>
                  </td>

                  {/* Right Column Value */}
                  <td className={`p-3 border-r border-gray-200 ${isDiff ? 'bg-teal-50/50' : ''}`}>
                    <div className="space-y-1">
                      {renderValue(field, field.right, true)}
                    </div>
                  </td>

                  {/* Diff Status Tag */}
                  <td className="p-3 text-center">
                    {isDiff ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                        <AlertCircle size={10} /> Modified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                        <Check size={10} className="text-gray-400" /> Match
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredFields.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                  No differences found between these two versions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
