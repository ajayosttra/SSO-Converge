import React, { useState, useEffect } from 'react';
import { Mail, User, Layers, CheckCircle2, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TraianaUserSkipRecord } from '../types';
import { TRAIANA_APPLICATIONS } from '../data/traianaSkipData';

interface VerifyEmailModalProps {
  isOpen: boolean;
  user: TraianaUserSkipRecord | null;
  onClose: () => void;
  onSubmitEmail: (params: {
    userName: string;
    application: string;
    verifiedEmail: string;
    ticketId?: string;
  }) => void;
}

export const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({
  isOpen,
  user,
  onClose,
  onSubmitEmail
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [appInput, setAppInput] = useState('CFD');
  const [ticketIdInput, setTicketIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmailInput(user.verifiedEmail || user.currentProvidedEmail || '');
      setUserNameInput(user.userName);
      setAppInput(user.application);
      setTicketIdInput(user.ticketId || `SSOOB-${Math.floor(4000 + Math.random() * 5000)}`);
    } else {
      setEmailInput('');
      setUserNameInput('');
      setAppInput('CFD');
      setTicketIdInput(`SSOOB-${Math.floor(4000 + Math.random() * 5000)}`);
    }
    setError(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanUserName = userNameInput.trim();
    const cleanApp = appInput.trim();

    if (!cleanUserName) {
      setError('User Name is required.');
      return;
    }
    if (!cleanApp) {
      setError('Application is required.');
      return;
    }
    if (!cleanEmail) {
      setError('Please provide the Verified Email ID.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please provide a valid corporate email address (e.g. user@bank.com).');
      return;
    }

    onSubmitEmail({
      userName: cleanUserName,
      application: cleanApp,
      verifiedEmail: cleanEmail,
      ticketId: ticketIdInput.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-600/50 rounded-lg">
              <Mail size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Verify Email ID</h2>
              <p className="text-xs text-teal-100">Update verified corporate email address</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-teal-200 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Details Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                <User size={13} className="text-gray-600" />
                User Name:
              </span>
              <span className="font-mono font-bold text-gray-900">{userNameInput || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                <Layers size={13} className="text-gray-600" />
                Application:
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                {appInput}
              </span>
            </div>
            {user && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
                <span className="text-gray-500 font-semibold">Current Skip Count:</span>
                <span className={`font-bold ${user.isLocked ? 'text-red-600' : 'text-gray-700'}`}>
                  {user.skipCount} / {user.maxSkips} {user.isLocked ? '(Locked)' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Input: Verified Email ID */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-teal-700" />
                Verified Email ID <span className="text-red-500">*</span>
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Official Corporate Email</span>
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="e.g. user@institution.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full text-xs font-mono border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-xxs text-gray-500 mt-1">
              Saving this email will mark the account as Verified by Admin and reset the skip counter to 0.
            </p>
          </div>

          {/* Optional Support Ticket ID */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Support Ticket ID <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SSOOB-1042 / SUP-5812"
              value={ticketIdInput}
              onChange={(e) => setTicketIdInput(e.target.value)}
              className="w-full text-xs font-mono border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Submit &amp; Update Email</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
