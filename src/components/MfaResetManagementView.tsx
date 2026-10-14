import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RotateCcw, 
  User, 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Check, 
  Copy
} from 'lucide-react';
import { UserMfaRecord, MfaResetAuditRecord, Domain, User as CurrentUserType } from '../types';
import { findOrGenerateMfaUser, saveMfaUsers, saveMfaAuditLogs } from '../data/mfaResetData';

interface MfaResetManagementViewProps {
  users: UserMfaRecord[];
  onUpdateUsers: (users: UserMfaRecord[]) => void;
  auditLogs: MfaResetAuditRecord[];
  onAddAuditLog: (log: MfaResetAuditRecord) => void;
  domains: Domain[];
  currentUser: CurrentUserType | null;
  onNavigateHome?: () => void;
  initialTargetEmail?: string;
  initialTargetDomain?: string;
}

export const MfaResetManagementView: React.FC<MfaResetManagementViewProps> = ({
  users,
  onUpdateUsers,
  auditLogs,
  onAddAuditLog,
  domains,
  currentUser,
  onNavigateHome,
  initialTargetEmail = ''
}) => {
  // Only two options as requested: 1. User Level, 2. Multiple Users
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');

  // --- 1. USER LEVEL STATE ---
  const [singleEmailInput, setSingleEmailInput] = useState(initialTargetEmail || '');
  const [searchedUser, setSearchedUser] = useState<UserMfaRecord | null>(() => {
    if (initialTargetEmail) {
      return findOrGenerateMfaUser(initialTargetEmail, users, domains);
    }
    return null;
  });
  const [hasSearchedSingle, setHasSearchedSingle] = useState(Boolean(initialTargetEmail));
  const [singleMessage, setSingleMessage] = useState<{
    type: 'successful' | 'failed';
    text: string;
    details?: string;
  } | null>(null);
  const [singleIsProcessing, setSingleIsProcessing] = useState(false);

  // --- 2. MULTIPLE USERS STATE ---
  const [multipleEmailsInput, setMultipleEmailsInput] = useState('');
  const [searchedMultipleUsers, setSearchedMultipleUsers] = useState<UserMfaRecord[]>([]);
  const [hasSearchedMultiple, setHasSearchedMultiple] = useState(false);
  const [multipleMessage, setMultipleMessage] = useState<{
    type: 'successful' | 'failed';
    text: string;
    details?: string;
  } | null>(null);
  const [multipleIsProcessing, setMultipleIsProcessing] = useState(false);

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // --- USER LEVEL HANDLERS ---
  const handleSearchSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleMessage(null);
    const cleanEmail = singleEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    const user = findOrGenerateMfaUser(cleanEmail, users, domains);
    setSearchedUser(user);
    setHasSearchedSingle(true);
  };

  const handleResetSingle = () => {
    if (!searchedUser) return;

    setSingleIsProcessing(true);
    setSingleMessage(null);

    setTimeout(() => {
      const adminEmail = currentUser?.email || 'admin@osttra.com';
      const timestamp = new Date().toLocaleString('en-GB') + ' (UTC)';

      // Perform reset: invalidate prior device binding, mark pending re-enrollment
      const updated: UserMfaRecord = {
        ...searchedUser,
        requiresReEnrollment: true,
        lastResetOn: timestamp,
        lastResetBy: adminEmail,
        resetCount: (searchedUser.resetCount || 0) + 1,
        deviceModel: 'Pending Re-Enrollment (Device Revoked)',
        lastMfaAuth: 'Revoked - Pending New Device Setup'
      };

      const existingIdx = users.findIndex(u => u.email.toLowerCase() === searchedUser.email.toLowerCase());
      let nextUsers: UserMfaRecord[];
      if (existingIdx >= 0) {
        nextUsers = users.map((u, i) => i === existingIdx ? updated : u);
      } else {
        nextUsers = [updated, ...users];
      }

      onUpdateUsers(nextUsers);
      saveMfaUsers(nextUsers);
      setSearchedUser(updated);

      // Audit log
      const auditEntry: MfaResetAuditRecord = {
        id: `mfa-aud-${Date.now()}`,
        scope: 'USER',
        target: updated.email,
        emails: [updated.email],
        performedBy: adminEmail,
        timestamp,
        ticketId: 'INC-MFA-RESET',
        status: 'Successful',
        collaborationType: updated.collaborationType,
        reason: 'User device changed or MFA not working',
        details: `MFA reset successfully for ${updated.email}`
      };
      onAddAuditLog(auditEntry);
      saveMfaAuditLogs([auditEntry, ...auditLogs]);

      setSingleMessage({
        type: 'successful',
        text: `MFA Reset Successful for ${updated.email}`,
        details: `Previous MFA credentials have been revoked. The user will be required to register their new device on their next login.`
      });
      setSingleIsProcessing(false);
    }, 400);
  };

  // --- MULTIPLE USERS HANDLERS ---
  const handleSearchMultiple = (e: React.FormEvent) => {
    e.preventDefault();
    setMultipleMessage(null);
    const lines = multipleEmailsInput
      .split(/[\n,; ]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const uniqueEmails: string[] = Array.from(new Set(lines));
    if (uniqueEmails.length === 0) return;

    const resolved = uniqueEmails.map(email => findOrGenerateMfaUser(email, users, domains));
    setSearchedMultipleUsers(resolved);
    setHasSearchedMultiple(true);
  };

  const handleResetMultipleUser = (emailToReset: string) => {
    const adminEmail = currentUser?.email || 'admin@osttra.com';
    const timestamp = new Date().toLocaleString('en-GB') + ' (UTC)';

    let nextUsers = [...users];
    const targetObj = findOrGenerateMfaUser(emailToReset, nextUsers, domains);

    const updated: UserMfaRecord = {
      ...targetObj,
      requiresReEnrollment: true,
      lastResetOn: timestamp,
      lastResetBy: adminEmail,
      resetCount: (targetObj.resetCount || 0) + 1,
      deviceModel: 'Pending Re-Enrollment (Device Revoked)',
      lastMfaAuth: 'Revoked - Pending New Device Setup'
    };

    const idx = nextUsers.findIndex(u => u.email.toLowerCase() === emailToReset.toLowerCase());
    if (idx >= 0) {
      nextUsers[idx] = updated;
    } else {
      nextUsers.push(updated);
    }

    onUpdateUsers(nextUsers);
    saveMfaUsers(nextUsers);

    // Update in searched list
    setSearchedMultipleUsers(prev => prev.map(u => u.email.toLowerCase() === emailToReset.toLowerCase() ? updated : u));

    // Audit log
    const auditEntry: MfaResetAuditRecord = {
      id: `mfa-aud-${Date.now()}`,
      scope: 'USER',
      target: updated.email,
      emails: [updated.email],
      performedBy: adminEmail,
      timestamp,
      ticketId: 'INC-MFA-RESET',
      status: 'Successful',
      collaborationType: updated.collaborationType,
      reason: 'User device changed or MFA not working',
      details: `MFA reset successfully for ${updated.email}`
    };
    onAddAuditLog(auditEntry);
    saveMfaAuditLogs([auditEntry, ...auditLogs]);

    setMultipleMessage({
      type: 'successful',
      text: `MFA Reset Successful for ${emailToReset}`
    });
  };

  const handleResetAllMultiple = () => {
    if (searchedMultipleUsers.length === 0) return;

    setMultipleIsProcessing(true);
    setMultipleMessage(null);

    setTimeout(() => {
      const adminEmail = currentUser?.email || 'admin@osttra.com';
      const timestamp = new Date().toLocaleString('en-GB') + ' (UTC)';

      let nextUsers = [...users];
      const updatedSearched = searchedMultipleUsers.map(userObj => {
        const updated: UserMfaRecord = {
          ...userObj,
          requiresReEnrollment: true,
          lastResetOn: timestamp,
          lastResetBy: adminEmail,
          resetCount: (userObj.resetCount || 0) + 1,
          deviceModel: 'Pending Re-Enrollment (Device Revoked)',
          lastMfaAuth: 'Revoked - Pending New Device Setup'
        };

        const idx = nextUsers.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
        if (idx >= 0) {
          nextUsers[idx] = updated;
        } else {
          nextUsers.push(updated);
        }
        return updated;
      });

      onUpdateUsers(nextUsers);
      saveMfaUsers(nextUsers);
      setSearchedMultipleUsers(updatedSearched);

      // Audit log
      const auditEntry: MfaResetAuditRecord = {
        id: `mfa-aud-${Date.now()}`,
        scope: 'MULTI_USER',
        target: `${updatedSearched.length} users reset`,
        emails: updatedSearched.map(u => u.email),
        performedBy: adminEmail,
        timestamp,
        ticketId: 'INC-BATCH-MFA',
        status: 'Successful',
        collaborationType: 'Multiple',
        reason: 'Multiple users device changed / MFA not working',
        details: `Reset MFA for ${updatedSearched.length} users.`
      };
      onAddAuditLog(auditEntry);
      saveMfaAuditLogs([auditEntry, ...auditLogs]);

      setMultipleMessage({
        type: 'successful',
        text: `MFA Reset Successful for all ${updatedSearched.length} users!`,
        details: `MFA credentials have been revoked. All users will be prompted to re-register their new devices upon next login.`
      });
      setMultipleIsProcessing(false);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="text-emerald-700" size={22} />
            Reset MFA
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Reset Multi-Factor Authentication for users who have changed devices or when MFA is not working.
          </p>
        </div>

        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            ← Back to Blotter
          </button>
        )}
      </div>

      {/* The Two Options Switcher: 1. User Level, 2. Multiple Users */}
      <div className="flex items-center gap-2 bg-gray-200/80 p-1.5 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('single');
            setSingleMessage(null);
          }}
          className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'single'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <User size={15} />
          <span>1. User Level</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('multiple');
            setMultipleMessage(null);
          }}
          className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'multiple'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <Users size={15} />
          <span>2. Multiple Users</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* OPTION 1: USER LEVEL                                           */}
      {/* ============================================================== */}
      {activeTab === 'single' && (
        <div className="space-y-5">
          {/* Search Box */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Search User by Email ID
            </h2>

            <form onSubmit={handleSearchSingle} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  placeholder="Enter user email ID (e.g. john.doe@osttra.com, sarah.jenkins@traiana.com)..."
                  value={singleEmailInput}
                  onChange={(e) => setSingleEmailInput(e.target.value)}
                  className="w-full form-input-light pl-3.5 pr-8 py-2.5 text-xs font-mono font-medium rounded-lg"
                />
                {singleEmailInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSingleEmailInput('');
                      setSearchedUser(null);
                      setHasSearchedSingle(false);
                      setSingleMessage(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <Search size={14} /> Search
              </button>
            </form>

            {/* Quick-click sample emails */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Quick Select:</span>
              {['john.doe@osttra.com', 'sarah.jenkins@traiana.com', 'ajay.swarnkar@osttra.com', 'brian.conner@citi.com', 'michael.ross@abc.com', 'trader1@partnerbank.com'].map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => {
                    setSingleEmailInput(email);
                    const user = findOrGenerateMfaUser(email, users, domains);
                    setSearchedUser(user);
                    setHasSearchedSingle(true);
                    setSingleMessage(null);
                  }}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    singleEmailInput.toLowerCase() === email.toLowerCase()
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {email}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome Message (Successful / Failed) */}
          {singleMessage && (
            <div
              className={`p-4 rounded-xl border flex items-start space-x-3 shadow-xs ${
                singleMessage.type === 'successful'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              {singleMessage.type === 'successful' ? (
                <CheckCircle2 size={20} className="text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-extrabold text-sm">{singleMessage.text}</h3>
                {singleMessage.details && (
                  <p className="text-xs mt-1 leading-relaxed">{singleMessage.details}</p>
                )}
              </div>
            </div>
          )}

          {/* User Details & Reset Option (Shown after search) */}
          {hasSearchedSingle && searchedUser && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">{searchedUser.displayName}</h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono mt-0.5">
                    <span>{searchedUser.email}</span>
                    <button
                      onClick={() => handleCopy(searchedUser.email)}
                      className="text-gray-400 hover:text-gray-700"
                      title="Copy Email"
                    >
                      {copiedEmail === searchedUser.email ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {searchedUser.requiresReEnrollment ? (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                    Pending Device Re-enrollment
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    Enrolled
                  </span>
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* User Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* MFA Status */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      MFA Status
                    </span>
                    <div className="flex items-center gap-2">
                      {searchedUser.mfaStatus === 'Enable' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck size={14} className="text-emerald-700" />
                          Enable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          <ShieldAlert size={14} className="text-amber-700" />
                          Disable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Collaboration Type */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Collaboration Type
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${
                      searchedUser.collaborationType === 'Fed' 
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : searchedUser.collaborationType === 'SAML'
                        ? 'bg-teal-100 text-teal-800 border-teal-300'
                        : searchedUser.collaborationType === 'OTP'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                    }`}>
                      {searchedUser.collaborationType}
                    </span>
                  </div>

                  {/* Enrolled Device */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Registered Device
                    </span>
                    <span className="text-xs font-bold text-gray-800">
                      {searchedUser.deviceModel || 'None / Not enrolled'}
                    </span>
                  </div>

                  {/* Domain */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Domain
                    </span>
                    <span className="text-xs font-bold text-gray-800 font-mono">
                      {searchedUser.domain}
                    </span>
                  </div>
                </div>

                {/* Option to Reset MFA */}
                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                      Reset MFA for this User
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Clears current device binding and prompts user to re-register MFA on their next login.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={singleIsProcessing}
                    onClick={handleResetSingle}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <RotateCcw size={15} className={singleIsProcessing ? 'animate-spin' : ''} />
                    <span>{singleIsProcessing ? 'Resetting...' : 'Reset MFA'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasSearchedSingle && !searchedUser && (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-xs text-gray-500">
              No user found matching that email.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* OPTION 2: MULTIPLE USERS                                       */}
      {/* ============================================================== */}
      {activeTab === 'multiple' && (
        <div className="space-y-5">
          {/* Multiple Input Form */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Enter Multiple User Email IDs
            </h2>
            <p className="text-xs text-gray-500">
              Provide multiple email IDs separated by commas, spaces, or new lines.
            </p>

            <form onSubmit={handleSearchMultiple} className="space-y-3">
              <textarea
                rows={3}
                required
                value={multipleEmailsInput}
                onChange={(e) => setMultipleEmailsInput(e.target.value)}
                placeholder="e.g.&#10;john.doe@osttra.com&#10;sarah.jenkins@traiana.com&#10;brian.conner@citi.com"
                className="w-full form-input-light text-xs font-mono py-2 rounded-lg"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Search size={14} /> Search Users
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMultipleEmailsInput(
                        'john.doe@osttra.com\nsarah.jenkins@traiana.com\nbrian.conner@citi.com\nalex.turner@jpmorgan.com'
                      );
                    }}
                    className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Load Sample List
                  </button>
                </div>

                {hasSearchedMultiple && (
                  <span className="text-xs font-semibold text-gray-500">
                    {searchedMultipleUsers.length} user{searchedMultipleUsers.length === 1 ? '' : 's'} found
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Outcome Message (Successful / Failed) */}
          {multipleMessage && (
            <div
              className={`p-4 rounded-xl border flex items-start space-x-3 shadow-xs ${
                multipleMessage.type === 'successful'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              {multipleMessage.type === 'successful' ? (
                <CheckCircle2 size={20} className="text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-extrabold text-sm">{multipleMessage.text}</h3>
                {multipleMessage.details && (
                  <p className="text-xs mt-1 leading-relaxed">{multipleMessage.details}</p>
                )}
              </div>
            </div>
          )}

          {/* Multiple Users Details Table & Reset Options */}
          {hasSearchedMultiple && searchedMultipleUsers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  User Details ({searchedMultipleUsers.length})
                </h3>

                <button
                  type="button"
                  disabled={multipleIsProcessing}
                  onClick={handleResetAllMultiple}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RotateCcw size={13} className={multipleIsProcessing ? 'animate-spin' : ''} />
                  <span>{multipleIsProcessing ? 'Resetting All...' : 'Reset MFA for All Users'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left">
                    <tr>
                      <th className="p-3">User Email</th>
                      <th className="p-3">User Name</th>
                      <th className="p-3">MFA Status</th>
                      <th className="p-3">Collaboration Type</th>
                      <th className="p-3">Device / Status</th>
                      <th className="p-3 text-right">Option</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {searchedMultipleUsers.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-gray-900">{u.email}</td>
                        <td className="p-3 font-semibold text-gray-700">{u.displayName}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.mfaStatus === 'Enable'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {u.mfaStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-gray-700 px-2 py-0.5 bg-gray-100 rounded text-[10px]">
                            {u.collaborationType}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">
                          {u.requiresReEnrollment ? (
                            <span className="text-teal-700 font-bold">Pending Re-enrollment</span>
                          ) : (
                            <span>{u.deviceModel || 'Enrolled'}</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleResetMultipleUser(u.email)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] px-3 py-1 rounded transition-colors cursor-pointer"
                          >
                            Reset MFA
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasSearchedMultiple && searchedMultipleUsers.length === 0 && (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-xs text-gray-500">
              No users found matching the entered emails.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
