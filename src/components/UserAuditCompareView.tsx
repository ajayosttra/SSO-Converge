import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  X, 
  ArrowLeftRight, 
  Check, 
  AlertCircle, 
  Download, 
  ShieldCheck, 
  Clock, 
  User as UserIcon, 
  Tag, 
  FileText,
  Mail,
  Layers,
  KeyRound
} from 'lucide-react';
import { UserAuditRecord } from '../types';

interface UserAuditCompareViewProps {
  userEmail: string;
  recordA: UserAuditRecord;
  recordB: UserAuditRecord;
  onBack: () => void;
  onClose: () => void;
}

export const UserAuditCompareView: React.FC<UserAuditCompareViewProps> = ({
  userEmail,
  recordA,
  recordB,
  onBack,
  onClose
}) => {
  const [isSwapped, setIsSwapped] = useState(false);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

  const [leftRecord, rightRecord] = useMemo(() => {
    if (isSwapped) {
      return [recordB, recordA];
    }
    return [recordA, recordB];
  }, [recordA, recordB, isSwapped]);

  const snapL = leftRecord.snapshot || ({} as any);
  const snapR = rightRecord.snapshot || ({} as any);

  const fields = useMemo(() => {
    const list = [
      {
        key: 'email',
        label: 'Email Id',
        left: snapL.email || userEmail,
        right: snapR.email || userEmail,
        type: 'text'
      },
      {
        key: 'domain',
        label: 'Domain Name',
        left: snapL.domain || userEmail.split('@')[1] || '-',
        right: snapR.domain || userEmail.split('@')[1] || '-',
        type: 'text',
        isDifferent: (snapL.domain || '') !== (snapR.domain || '')
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
        key: 'mfaStatus',
        label: 'MFA Status',
        left: snapL.mfaStatus || 'Disabled',
        right: snapR.mfaStatus || 'Disabled',
        type: 'mfa',
        isDifferent: (snapL.mfaStatus || 'Disabled') !== (snapR.mfaStatus || 'Disabled')
      },
      {
        key: 'roles',
        label: 'Assigned Roles',
        left: snapL.roles || [],
        right: snapR.roles || [],
        type: 'tags',
        isDifferent: JSON.stringify(snapL.roles || []) !== JSON.stringify(snapR.roles || [])
      },
      {
        key: 'applications',
        label: 'Application Access',
        left: snapL.applications || [],
        right: snapR.applications || [],
        type: 'tags',
        isDifferent: JSON.stringify(snapL.applications || []) !== JSON.stringify(snapR.applications || [])
      },
      {
        key: 'status',
        label: 'User Status',
        left: leftRecord.status || snapL.status || 'Enabled',
        right: rightRecord.status || snapR.status || 'Enabled',
        type: 'status',
        isDifferent: (leftRecord.status || snapL.status) !== (rightRecord.status || snapR.status)
      },
      {
        key: 'ticketId',
        label: 'Ticket Id',
        left: leftRecord.ticketId || snapL.ticketId || 'N/A',
        right: rightRecord.ticketId || snapR.ticketId || 'N/A',
        type: 'text',
        isDifferent: (leftRecord.ticketId || snapL.ticketId) !== (rightRecord.ticketId || snapR.ticketId)
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
        key: 'reviewer',
        label: 'Reviewer',
        left: leftRecord.reviewer || 'N/A',
        right: rightRecord.reviewer || 'N/A',
        type: 'user',
        isDifferent: (leftRecord.reviewer || '') !== (rightRecord.reviewer || '')
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
        label: 'Audit Description / Notes',
        left: leftRecord.description,
        right: rightRecord.description,
        type: 'text',
        isDifferent: leftRecord.description !== rightRecord.description
      }
    ];

    return list;
  }, [leftRecord, rightRecord, snapL, snapR, userEmail]);

  const diffCount = useMemo(() => {
    return fields.filter(f => f.isDifferent).length;
  }, [fields]);

  const visibleFields = useMemo(() => {
    if (showOnlyDiffs) {
      return fields.filter(f => f.isDifferent);
    }
    return fields;
  }, [fields, showOnlyDiffs]);

  const handleExportComparison = () => {
    const csvRows = [
      ['Attribute', `Version 1 (${leftRecord.timestamp})`, `Version 2 (${rightRecord.timestamp})`, 'Modified?'],
      ...fields.map(f => [
        f.label,
        Array.isArray(f.left) ? f.left.join('; ') : String(f.left ?? ''),
        Array.isArray(f.right) ? f.right.join('; ') : String(f.right ?? ''),
        f.isDifferent ? 'YES' : 'NO'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `User_Audit_Comparison_${userEmail}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderValue = (field: any, val: any, isRight: boolean, isDiff: boolean) => {
    if (val === undefined || val === null || val === '') {
      return <span className="text-gray-400 italic">None / Not specified</span>;
    }

    if (field.type === 'mfa') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full ${
          val === 'Enabled' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
        }`}>
          <ShieldCheck size={13} /> {val}
        </span>
      );
    }

    if (field.type === 'badge') {
      return (
        <span className="font-semibold text-xs bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md border border-teal-200">
          {val}
        </span>
      );
    }

    if (field.type === 'status') {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

    if (field.type === 'tags') {
      const arr = Array.isArray(val) ? val : [val];
      if (arr.length === 0) {
        return <span className="text-gray-400 italic">None</span>;
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {arr.map((item: string, idx: number) => (
            <span 
              key={idx} 
              className={`text-xs px-2 py-0.5 rounded border font-medium ${
                isDiff && isRight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (field.type === 'timestamp') {
      return (
        <span className="font-mono text-xs text-gray-900 flex items-center gap-1.5">
          <Clock size={13} className="text-gray-400" />
          {val}
        </span>
      );
    }

    if (field.type === 'user') {
      return (
        <span className="text-xs text-gray-800 font-medium flex items-center gap-1.5">
          <UserIcon size={13} className="text-gray-400" />
          {val}
        </span>
      );
    }

    return <span className="text-xs text-gray-900 font-normal leading-relaxed">{String(val)}</span>;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Audit List
          </button>

          <span className="text-xs text-gray-400">|</span>

          <span className="text-xs text-gray-700 font-medium">
            Comparing <strong className="text-teal-800">{userEmail}</strong> audit revisions
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={showOnlyDiffs}
              onChange={e => setShowOnlyDiffs(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4 cursor-pointer accent-[#0e8787]"
            />
            <span>Show Only Differences ({diffCount})</span>
          </label>

          <button
            type="button"
            onClick={() => setIsSwapped(!isSwapped)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Swap left and right columns"
          >
            <ArrowLeftRight size={13} /> Swap Columns
          </button>

          <button
            type="button"
            onClick={handleExportComparison}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0e8787] hover:bg-[#0b6d6d] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Download comparison table as CSV"
          >
            <Download size={13} /> Export Diff Report
          </button>
        </div>
      </div>

      {/* Difference summary banner */}
      <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
        diffCount > 0 
          ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center space-x-2">
          {diffCount > 0 ? (
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
          ) : (
            <Check size={16} className="text-emerald-600 shrink-0" />
          )}
          <span>
            {diffCount > 0 
              ? `Found ${diffCount} modified field${diffCount === 1 ? '' : 's'} between the selected versions.` 
              : 'Both audit records are identical across all compared configuration parameters.'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-100 border border-amber-300 inline-block"></span>
            Modified Attribute
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f0f8f8] border-b border-gray-300">
                <th className="p-3 w-1/4 font-bold text-gray-800 border-r border-gray-300">
                  Configuration Attribute
                </th>
                <th className="p-3 w-[37.5%] font-bold text-gray-800 border-r border-gray-300 bg-teal-50/40">
                  <div className="flex items-center justify-between">
                    <span>Version A (Baseline)</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] border ${
                      leftRecord.actionType === 'Initial' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {leftRecord.actionType}
                    </span>
                  </div>
                  <div className="text-[11px] font-normal text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock size={11} /> {leftRecord.timestamp}
                  </div>
                </th>
                <th className="p-3 w-[37.5%] font-bold text-gray-800 bg-amber-50/40">
                  <div className="flex items-center justify-between">
                    <span>Version B (Comparison)</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] border ${
                      rightRecord.actionType === 'Initial' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {rightRecord.actionType}
                    </span>
                  </div>
                  <div className="text-[11px] font-normal text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock size={11} /> {rightRecord.timestamp}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleFields.map((field) => {
                const isDiff = !!field.isDifferent;

                return (
                  <tr 
                    key={field.key}
                    className={`transition-colors ${
                      isDiff 
                        ? 'bg-amber-50/30 hover:bg-amber-50/60' 
                        : 'bg-white hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Field label */}
                    <td className="p-3 font-semibold text-gray-700 border-r border-gray-200 flex items-center justify-between">
                      <span>{field.label}</span>
                      {isDiff && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                          DIFF
                        </span>
                      )}
                    </td>

                    {/* Left Record Value */}
                    <td className={`p-3 border-r border-gray-200 ${
                      isDiff ? 'bg-amber-50/20' : ''
                    }`}>
                      {renderValue(field, field.left, false, isDiff)}
                    </td>

                    {/* Right Record Value */}
                    <td className={`p-3 ${
                      isDiff ? 'bg-amber-100/40 font-medium' : ''
                    }`}>
                      {renderValue(field, field.right, true, isDiff)}
                    </td>
                  </tr>
                );
              })}

              {visibleFields.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                    No differences found between Version A and Version B.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
