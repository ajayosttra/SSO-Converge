import React, { useState } from 'react';
import { 
  RotateCcw, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Ticket,
  FileText,
  ShieldCheck,
  User,
  Layers
} from 'lucide-react';
import { TraianaUserSkipRecord } from '../types';

interface ResetSkipCounterModalProps {
  userRecord: TraianaUserSkipRecord;
  onClose: () => void;
  onConfirmReset: (params: {
    recordId: string;
    newSkipCount: number;
    ticketId: string;
    reason: string;
    notes?: string;
  }) => void;
}

export const ResetSkipCounterModal: React.FC<ResetSkipCounterModalProps> = ({
  userRecord,
  onClose,
  onConfirmReset
}) => {
  const [newSkipCount, setNewSkipCount] = useState<number>(0);
  const [ticketId, setTicketId] = useState<string>(userRecord.ticketId || 'SUP-' + Math.floor(1000 + Math.random() * 9000));
  const [reasonCategory, setReasonCategory] = useState<string>('User exhausted 3 skips due to OTP email delivery issues');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const REASON_OPTIONS = [
    'User exhausted 3 skips due to OTP email delivery issues',
    'Corporate firewall / spam filter blocked verification OTP emails',
    'User locked out during critical trading / market open hours',
    'User requested reset via authorized IT support service desk',
    'Temporary email routing outage resolved',
    'Corporate mailbox alias updated - fresh attempts needed',
    'Other / Custom support exception'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) {
      setError('A valid Support Ticket ID (e.g. SUP-XXXX or SSOOB-XXXX) is required for audit compliance.');
      return;
    }
    if (!reasonCategory) {
      setError('Please select a valid support reason for resetting the counter.');
      return;
    }

    onConfirmReset({
      recordId: userRecord.id,
      newSkipCount,
      ticketId: ticketId.trim(),
      reason: reasonCategory,
      notes: customNotes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/40 rounded-lg">
              <RotateCcw size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Reset Skip Counter &amp; Unlock User</h2>
              <p className="text-xs text-amber-100">OSTTRA Support Personnel Action</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-amber-200 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User & App Info Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={15} className="text-slate-500" />
                <span className="text-xs text-slate-500 font-semibold">User Name:</span>
                <span className="text-xs font-bold text-slate-900 font-mono">{userRecord.userName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-slate-500" />
                <span className="text-xs text-slate-500 font-semibold">Application:</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  {userRecord.application}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-500">Current Skips Used: </span>
                <span className={`font-black ${userRecord.skipCount >= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                  {userRecord.skipCount} of {userRecord.maxSkips}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Status: </span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  userRecord.isLocked 
                    ? 'bg-red-100 text-red-800 border border-red-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {userRecord.isLocked ? 'Locked (Exhausted)' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* New Skip Count Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Reset Counter To
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setNewSkipCount(0)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                  newSkipCount === 0
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-extrabold text-sm text-teal-700">0 Skips Used</div>
                <div className="text-[10px] text-gray-500 font-normal mt-0.5">3 fresh chances (Full)</div>
              </button>

              <button
                type="button"
                onClick={() => setNewSkipCount(1)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                  newSkipCount === 1
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-extrabold text-sm text-amber-700">1 Skip Used</div>
                <div className="text-[10px] text-gray-500 font-normal mt-0.5">2 chances remaining</div>
              </button>

              <button
                type="button"
                onClick={() => setNewSkipCount(2)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                  newSkipCount === 2
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-extrabold text-sm text-rose-700">2 Skips Used</div>
                <div className="text-[10px] text-gray-500 font-normal mt-0.5">1 chance remaining</div>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Resetting to <span className="font-semibold text-teal-700">{newSkipCount}</span> will instantly unlock the user and permit access to {userRecord.application} with {3 - newSkipCount} remaining skip chance(s).
            </p>
          </div>

          {/* Ticket ID */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Ticket size={13} className="text-gray-500" />
              <span>Support Ticket ID <span className="text-red-500">*</span></span>
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. SUP-4502 or SSOOB-6401"
              className="w-full form-input-light text-xs rounded-md py-2"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-gray-500" />
              <span>Support Reason <span className="text-red-500">*</span></span>
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full form-input-light text-xs rounded-md py-2 bg-white"
            >
              {REASON_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Support Notes / Client Verification Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Client confirmed identity via phone and requested reset to enable login..."
              className="w-full form-input-light text-xs rounded-md py-1.5"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
            />
          </div>

          {/* Impact Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-950">Immediate Unlock Effect</p>
              <p className="text-[11px] text-emerald-800">
                User <span className="font-mono font-bold">{userRecord.userName}</span> will be unblocked immediately. During their next login to <span className="font-semibold">{userRecord.application}</span>, they will be given {3 - newSkipCount} more chances to skip or complete email OTP verification.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Confirm Reset &amp; Unlock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
