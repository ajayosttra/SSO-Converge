import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  User, 
  Server, 
  Globe, 
  ShieldCheck, 
  Laptop, 
  AlertCircle 
} from 'lucide-react';
import { SsoAuthProtocol, SsoLoginStatus } from '../types';
import { KNOWN_APPLICATIONS } from '../data/userLoginData';

interface SimulateSsoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordLogin: (data: {
    email: string;
    applicationName: string;
    environment: 'PROD' | 'UAT';
    protocol: SsoAuthProtocol;
    clientIp: string;
    location: string;
  }) => void;
  knownUsers?: { email: string; domain: string }[];
}

export const SimulateSsoLoginModal: React.FC<SimulateSsoLoginModalProps> = ({
  isOpen,
  onClose,
  onRecordLogin,
  knownUsers = []
}) => {
  const [email, setEmail] = useState('ajay.swarnkar@osttra.com');
  const [applicationName, setApplicationName] = useState('CFD');
  const [environment, setEnvironment] = useState<'PROD' | 'UAT'>('PROD');
  const [protocol, setProtocol] = useState<SsoAuthProtocol>('Entra ID (Fed)');
  const [clientIp, setClientIp] = useState('194.28.112.45');
  const [location, setLocation] = useState('London, United Kingdom');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid user email address.');
      return;
    }
    if (!applicationName.trim()) {
      setError('Please specify an application.');
      return;
    }

    onRecordLogin({
      email: email.trim(),
      applicationName: applicationName.trim(),
      environment,
      protocol,
      clientIp: clientIp.trim() || '194.28.112.45',
      location: location.trim() || 'London, United Kingdom',
    });
    onClose();
  };

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
              <LogIn size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">Simulate &amp; Record SSO Login</h2>
              <p className="text-xs text-gray-400">Trigger an enterprise SSO authentication event for any application</p>
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

          {/* User Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              User Email ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. user.name@domain.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none"
              />
              <User size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
            </div>
            {knownUsers.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="text-[11px] text-gray-500 mr-1">Quick pick:</span>
                {knownUsers.slice(0, 4).map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => setEmail(u.email)}
                    className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                  >
                    {u.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Application & Environment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Application <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={applicationName}
                  onChange={(e) => setApplicationName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none appearance-none bg-white pr-8"
                >
                  {KNOWN_APPLICATIONS.map(app => (
                    <option key={app.name} value={app.name}>
                      {app.name}
                    </option>
                  ))}
                  <option value="Custom App">Other / Custom App</option>
                </select>
                <Server size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Environment <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnvironment('PROD')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                    environment === 'PROD' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  PROD
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironment('UAT')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                    environment === 'UAT' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  UAT
                </button>
              </div>
            </div>
          </div>

          {/* SSO Protocol */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              SSO Protocol / Authentication Method
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as SsoAuthProtocol)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none bg-white"
            >
              <option value="Entra ID (Fed)">Entra ID (Federated SSO)</option>
              <option value="SAML 2.0">SAML 2.0 (Identity Provider Fed)</option>
              <option value="Entra ID (Non-Fed)">Entra ID (Non-Federated Cloud)</option>
              <option value="B2B Guest">Azure AD B2B Guest Account</option>
              <option value="OTP / MFA">One-Time Passcode (OTP / MFA)</option>
            </select>
          </div>

          {/* Client IP & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Client IP Address
              </label>
              <input
                type="text"
                value={clientIp}
                onChange={(e) => setClientIp(e.target.value)}
                placeholder="194.28.112.45"
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="London, UK"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-1">
            <span className="font-bold flex items-center">
              <ShieldCheck size={14} className="mr-1.5 text-blue-600" />
              Live Audit Recording
            </span>
            <p className="text-[11px] text-blue-700">
              Submitting will immediately record this login event with the current timestamp into the SSO audit log and update the user's latest login status.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
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
              <LogIn size={15} className="mr-1.5" />
              Record SSO Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
