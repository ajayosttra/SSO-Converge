import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  User, 
  Server, 
  Send, 
  Building2, 
  FileText, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { KNOWN_APPLICATIONS } from '../data/userLoginData';
import { AppEmailSyncDetail } from '../types';

interface InitiateEmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateSync: (data: {
    initiatingSystem: string;
    ticketReference: string;
    userName: string;
    oldEmail: string;
    newEmail: string;
    selectedApps: { name: string; env: 'PROD' | 'UAT' }[];
    notes?: string;
  }) => void;
}

export const InitiateEmailSyncModal: React.FC<InitiateEmailSyncModalProps> = ({
  isOpen,
  onClose,
  onInitiateSync
}) => {
  const [initiatingSystem, setInitiatingSystem] = useState('CRDS (Central Reference Data)');
  const [ticketReference, setTicketReference] = useState(`CRDS-REQ-${Math.floor(10000 + Math.random() * 90000)}`);
  const [userName, setUserName] = useState('Ajay Swarnkar');
  const [oldEmail, setOldEmail] = useState('ajay.swarnkar@osttra.com');
  const [newEmail, setNewEmail] = useState('ajay.swarnkar@spglobal.com');
  const [notes, setNotes] = useState('Rebranding email domain update requested by client management');
  const [selectedApps, setSelectedApps] = useState<{ [key: string]: boolean }>({
    'CFD-PROD': true,
    'CRDS-PROD': true,
    'TradeServ-PROD': true,
    'MarkitWire-PROD': true
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleApp = (key: string) => {
    setSelectedApps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldEmail.includes('@') || !newEmail.includes('@')) {
      setError('Please provide valid old and new email addresses.');
      return;
    }
    if (oldEmail.toLowerCase() === newEmail.toLowerCase()) {
      setError('New email must be different from current email.');
      return;
    }

    const appsToSync: { name: string; env: 'PROD' | 'UAT' }[] = [];
    Object.entries(selectedApps).forEach(([key, isChecked]) => {
      if (isChecked) {
        const [name, env] = key.split('-');
        appsToSync.push({ name, env: env as 'PROD' | 'UAT' });
      }
    });

    if (appsToSync.length === 0) {
      setError('Please select at least one downstream application to propagate the email update.');
      return;
    }

    onInitiateSync({
      initiatingSystem,
      ticketReference: ticketReference.trim() || `TKT-${Date.now().toString().slice(-5)}`,
      userName: userName.trim() || oldEmail.split('@')[0],
      oldEmail: oldEmail.trim().toLowerCase(),
      newEmail: newEmail.trim().toLowerCase(),
      selectedApps: appsToSync,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 border border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)]">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">Simulate / Dispatch User Email Update</h2>
              <p className="text-xs text-gray-400">Trigger user email update propagation across SSO and downstream applications</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center">
              <AlertCircle size={15} className="mr-2 text-red-600 shrink-0" />
              {error}
            </div>
          )}

          {/* Initiating System & Ticket Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Initiating System <span className="text-red-500">*</span>
              </label>
              <select
                value={initiatingSystem}
                onChange={(e) => setInitiatingSystem(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none bg-white"
              >
                <option value="CRDS (Central Reference Data)">CRDS (Central Reference Data)</option>
                <option value="Active Directory / Entra ID Federation">Active Directory / Entra ID Federation</option>
                <option value="Service Management (ServiceNow)">Service Management (ServiceNow)</option>
                <option value="Workday HCM Webhook">Workday HCM Webhook</option>
                <option value="SSO Converge Admin Console">SSO Converge Admin Console</option>
                <option value="External Customer API">External Customer API</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Ticket Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ticketReference}
                onChange={(e) => setTicketReference(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* User Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              User Display Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Ajay Swarnkar"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none"
            />
          </div>

          {/* Old Email & New Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Current / Old Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={oldEmail}
                onChange={(e) => setOldEmail(e.target.value)}
                placeholder="current.user@domain.com"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                New Target Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new.user@domain.com"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none font-semibold text-emerald-800"
              />
            </div>
          </div>

          {/* Target Applications Checkbox Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Target Applications with User Entitlements <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {[
                { name: 'CFD', env: 'PROD' },
                { name: 'CRDS', env: 'PROD' },
                { name: 'TradeServ', env: 'PROD' },
                { name: 'MarkitWire', env: 'PROD' },
                { name: 'Traiana Harmony', env: 'PROD' },
                { name: 'FX Connect', env: 'PROD' },
                { name: 'triReduce', env: 'PROD' },
                { name: 'CFD', env: 'UAT' },
                { name: 'TradeServ', env: 'UAT' }
              ].map(app => {
                const key = `${app.name}-${app.env}`;
                const checked = !!selectedApps[key];

                return (
                  <label 
                    key={key} 
                    className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                      checked ? 'bg-white border-[var(--color-primary)] shadow-2xs' : 'bg-transparent border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleApp(key)}
                      className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-3.5 w-3.5"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-gray-800 block truncate">{app.name}</span>
                      <span className={`text-[10px] font-semibold px-1 rounded ${
                        app.env === 'PROD' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {app.env}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Audit Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Initiated per customer change ticket"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="accent-button text-xs py-2 px-5 cursor-pointer flex items-center shadow-xs"
            >
              <Send size={14} className="mr-1.5" />
              Dispatch Email Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
