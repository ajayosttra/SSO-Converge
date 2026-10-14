import React, { useState, useMemo } from 'react';
import { 
  X, 
  Mail, 
  User, 
  Server, 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { discoverUserEntitledApplications } from '../data/emailSyncData';

interface InitiateEmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateSync: (data: {
    oldEmail: string;
    newEmail: string;
    selectedApps: { name: string; env: 'PROD' | 'UAT' }[];
    notes?: string;
  }) => void;
  currentUserEmail?: string;
}

export const InitiateEmailSyncModal: React.FC<InitiateEmailSyncModalProps> = ({
  isOpen,
  onClose,
  onInitiateSync,
  currentUserEmail = 'ajay.swarnkar@osttra.com'
}) => {
  const [oldEmail, setOldEmail] = useState('ajay.swarnkar@osttra.com');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Automatically discover active application entitlements whenever oldEmail changes
  const discoveredEntitlements = useMemo(() => {
    return discoverUserEntitledApplications(oldEmail);
  }, [oldEmail]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOld = oldEmail.trim().toLowerCase();
    const cleanNew = newEmail.trim().toLowerCase();

    if (!cleanOld.includes('@') || !cleanNew.includes('@')) {
      setError('Please provide valid current and new email addresses.');
      return;
    }
    if (cleanOld === cleanNew) {
      setError('New email address must be different from current email.');
      return;
    }
    if (discoveredEntitlements.length === 0) {
      setError('No entitled downstream applications found for this user.');
      return;
    }

    onInitiateSync({
      oldEmail: cleanOld,
      newEmail: cleanNew,
      selectedApps: discoveredEntitlements.map(e => ({ name: e.name, env: e.env })),
      notes: `Admin email update initiated via SSO Converge for ${cleanOld}`
    });

    onClose();
  };

  const sampleUsers = [
    { old: 'ajay.swarnkar@osttra.com', suggestedNew: 'ajay.swarnkar@spglobal.com' },
    { old: 'alex.taylor@osttra.com', suggestedNew: 'alex.taylor@spglobal.com' },
    { old: 'sarah.jenkins@traiana.com', suggestedNew: 'sarah.j@traiana.com' },
    { old: 'john.doe@barclays.com', suggestedNew: 'john.doe@barclays-corp.com' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 border border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)]">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">Dispatch User Email Update</h2>
              <p className="text-xs text-gray-400">Trigger email update across SSO and all entitled applications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center">
              <AlertCircle size={15} className="mr-2 text-red-600 shrink-0" />
              {error}
            </div>
          )}

          {/* Quick select users */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Quick Pick Demo User:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleUsers.map(u => (
                <button
                  key={u.old}
                  type="button"
                  onClick={() => {
                    setOldEmail(u.old);
                    setNewEmail(u.suggestedNew);
                    setError(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                    oldEmail === u.old 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {u.old.split('@')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Old Email & New Email Inputs */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Old Email ID (Current User Email) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={oldEmail}
                  onChange={(e) => {
                    setOldEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. user.name@osttra.com"
                  className="w-full pl-3 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none font-mono"
                />
                <User size={15} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                New Email ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. user.name@spglobal.com"
                  className="w-full pl-3 pr-9 py-2 text-sm border border-emerald-300 bg-emerald-50/30 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none font-mono font-bold text-emerald-900"
                />
                <Mail size={15} className="absolute right-3 top-2.5 text-emerald-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Automatic User Entitlement Discovery Card */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center">
                <Sparkles size={14} className="mr-1.5 text-blue-600" />
                Active User Entitlements Detected
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                {discoveredEntitlements.length} Applications
              </span>
            </div>

            <p className="text-[11px] text-blue-700">
              Based on the user's active domain and access profile, SSO Converge will automatically propagate this update to the following relevant systems:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {discoveredEntitlements.map(app => (
                <span
                  key={`${app.name}-${app.env}`}
                  className="inline-flex items-center text-[11px] font-bold bg-white text-gray-800 px-2 py-1 rounded-md border border-blue-200 shadow-2xs"
                  title={app.reason}
                >
                  <Server size={11} className="mr-1 text-blue-600" />
                  {app.name}
                  <span className={`ml-1 text-[9px] px-1 rounded font-black ${
                    app.env === 'PROD' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {app.env}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="accent-button text-xs py-2 px-5 cursor-pointer flex items-center shadow-xs"
            >
              <Send size={14} className="mr-1.5" />
              Trigger Update to All Relevant Applications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
