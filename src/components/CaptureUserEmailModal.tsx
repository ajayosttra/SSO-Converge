import React, { useState } from 'react';
import { 
  Mail, 
  User, 
  Layers, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Ticket,
  FileText,
  Send,
  Info
} from 'lucide-react';
import { TraianaUserSkipRecord, TraianaApp } from '../types';
import { TRAIANA_APPLICATIONS } from '../data/traianaSkipData';

interface CaptureUserEmailModalProps {
  existingRecord?: TraianaUserSkipRecord | null;
  allRecords: TraianaUserSkipRecord[];
  onClose: () => void;
  onSaveVerifiedEmail: (params: {
    userName: string;
    application: string;
    verifiedEmail: string;
    ticketId: string;
    verificationMethod: string;
    notes?: string;
  }) => void;
}

export const CaptureUserEmailModal: React.FC<CaptureUserEmailModalProps> = ({
  existingRecord,
  allRecords,
  onClose,
  onSaveVerifiedEmail
}) => {
  // Required Inputs as specified by user:
  // 1. User Name
  // 2. Application
  // 3. Verified email id
  const [userName, setUserName] = useState<string>(existingRecord?.userName || '');
  const [application, setApplication] = useState<string>(existingRecord?.application || 'CFD');
  const [verifiedEmail, setVerifiedEmail] = useState<string>(
    existingRecord?.verifiedEmail || existingRecord?.currentProvidedEmail || ''
  );
  
  // Operational compliance inputs
  const [ticketId, setTicketId] = useState<string>(
    existingRecord?.ticketId || 'SSOOB-' + Math.floor(5000 + Math.random() * 4000)
  );
  const [verificationMethod, setVerificationMethod] = useState<string>(
    'Client provided verified email directly to OSTTRA Support Desk'
  );
  const [notes, setNotes] = useState<string>('');
  const [autoUnlockAndVerify, setAutoUnlockAndVerify] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Email format validation
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  // Quick select existing user helper
  const handleSelectUser = (selectedName: string) => {
    setUserName(selectedName);
    const found = allRecords.find(r => r.userName.toLowerCase() === selectedName.toLowerCase());
    if (found) {
      setApplication(found.application);
      if (found.currentProvidedEmail || found.verifiedEmail) {
        setVerifiedEmail(found.verifiedEmail || found.currentProvidedEmail || '');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUserName = userName.trim();
    const cleanApp = application.trim();
    const cleanEmail = verifiedEmail.trim().toLowerCase();

    if (!cleanUserName) {
      setError('User Name is required.');
      return;
    }
    if (!cleanApp) {
      setError('Application is required.');
      return;
    }
    if (!cleanEmail) {
      setError('Verified email id is required.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Please provide a valid corporate email address (e.g. user@bank.com).');
      return;
    }
    if (!ticketId.trim()) {
      setError('Support Ticket ID (e.g. SSOOB-XXXX or SUP-XXXX) is required for audit traceability.');
      return;
    }

    onSaveVerifiedEmail({
      userName: cleanUserName,
      application: cleanApp,
      verifiedEmail: cleanEmail,
      ticketId: ticketId.trim(),
      verificationMethod,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-600/50 rounded-lg">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Capture &amp; Verify User Email</h2>
              <p className="text-xs text-teal-100">OSTTRA Admin Email Verification on Behalf of User</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-teal-200 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Context Explainer */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
            <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-950">OSTTRA Support Verification Workflow</p>
              <p className="text-xxs text-blue-800 leading-relaxed">
                When a user is unable to complete self-service OTP verification or is locked after exhausting 3 skips, OSTTRA support admins can provide and verify the official email ID on their behalf.
              </p>
            </div>
          </div>

          {/* Mandatory Inputs Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3.5">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Required Verification Inputs</span>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Admin Mandatory
              </span>
            </div>

            {/* 1. User Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-teal-700" />
                  User Name <span className="text-red-500">*</span>
                </span>
                {!existingRecord && (
                  <span className="text-[10px] text-gray-400 font-normal">Select existing or type new</span>
                )}
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="e.g. jdoe, alex.turner, mwallace"
                  className="w-full form-input-light text-xs rounded-md py-2 font-mono font-bold text-gray-800"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  list="existing-traiana-users"
                />
                <datalist id="existing-traiana-users">
                  {allRecords.map((r, i) => (
                    <option key={i} value={r.userName}>
                      {r.userName} ({r.application} - {r.isLocked ? 'LOCKED' : r.status})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* 2. Application */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Layers size={13} className="text-teal-700" />
                Application <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TRAIANA_APPLICATIONS.slice(0, 6).map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setApplication(app)}
                    className={`py-1.5 px-2 text-xs font-bold rounded border text-center transition-all cursor-pointer ${
                      application === app
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>
              <div className="mt-1.5">
                <input
                  type="text"
                  placeholder="Or enter custom application name..."
                  className="w-full form-input-light text-xs rounded-md py-1.5 text-gray-700"
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                />
              </div>
            </div>

            {/* 3. Verified email id */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-teal-700" />
                Verified email id <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                required
                placeholder="e.g. user.name@institution.com"
                className="w-full form-input-light text-xs rounded-md py-2 font-mono text-teal-950 font-bold"
                value={verifiedEmail}
                onChange={(e) => setVerifiedEmail(e.target.value)}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                This email address will be permanently linked and marked as <span className="text-emerald-700 font-bold">Verified by OSTTRA Admin</span>.
              </p>
            </div>
          </div>

          {/* Audit & Compliance Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Ticket size={13} className="text-gray-500" />
                Support Ticket ID <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. SSOOB-5921 or SUP-8812"
                className="w-full form-input-light text-xs rounded-md py-1.5 font-mono"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-gray-500" />
                Verification Method
              </label>
              <select
                value={verificationMethod}
                onChange={(e) => setVerificationMethod(e.target.value)}
                className="w-full form-input-light text-xs rounded-md py-1.5 bg-white"
              >
                <option value="Client provided verified email directly to OSTTRA Support Desk">
                  Direct support desk communication
                </option>
                <option value="Authorized IT manager request ticket">
                  Authorized IT manager ticket
                </option>
                <option value="Corporate domain verified directory lookup">
                  Corporate directory / HR lookup
                </option>
                <option value="Security operations emergency override">
                  SecOps emergency override
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Admin Verification Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Confirmed user corporate identity and email ownership. Unlocked account."
              className="w-full form-input-light text-xs rounded-md py-1.5"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Unlock & Verification Guarantee Checkbox */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
            <input 
              type="checkbox"
              id="auto-unlock-check"
              checked={autoUnlockAndVerify}
              onChange={(e) => setAutoUnlockAndVerify(e.target.checked)}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="auto-unlock-check" className="text-xs text-emerald-950 font-semibold cursor-pointer">
              <span>Automatically unlock user and reset skip counter to 0 upon saving</span>
              <p className="text-[11px] text-emerald-800 font-normal mt-0.5">
                The user will be immediately exempt from OTP lockout and can log in straight into {application} with verified credentials.
              </p>
            </label>
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
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>Verify Email on Behalf of User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
