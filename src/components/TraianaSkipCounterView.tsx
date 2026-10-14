import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, 
  Mail, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  User, 
  Lock, 
  Unlock, 
  History, 
  Play,
  X,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { TraianaUserSkipRecord, TraianaSkipAuditRecord, User as LoggedInUser } from '../types';
import { TRAIANA_APPLICATIONS } from '../data/traianaSkipData';
import { VerifyEmailModal } from './VerifyEmailModal';
import { TraianaLoginJourneySimulatorModal } from './TraianaLoginJourneySimulatorModal';
import { TraianaSkipAuditModal } from './TraianaSkipAuditModal';

interface TraianaSkipCounterViewProps {
  users: TraianaUserSkipRecord[];
  onUpdateUsers: (users: TraianaUserSkipRecord[]) => void;
  auditLogs: TraianaSkipAuditRecord[];
  onAddAuditLog: (log: TraianaSkipAuditRecord) => void;
  currentUser: LoggedInUser | null;
  onNavigateHome: () => void;
}

export const TraianaSkipCounterView: React.FC<TraianaSkipCounterViewProps> = ({
  users,
  onUpdateUsers,
  auditLogs,
  onAddAuditLog,
  currentUser,
  onNavigateHome
}) => {
  // Search Inputs (Requested: User Name & Application drop down)
  const [searchUserName, setSearchUserName] = useState<string>('');
  const [searchApp, setSearchApp] = useState<string>('ALL');
  
  // Track whether search has been executed
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Modals state
  const [verifyModalUser, setVerifyModalUser] = useState<TraianaUserSkipRecord | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditFilterUser, setAuditFilterUser] = useState<string | null>(null);

  // Feedback Toast Banner
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showBanner = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setBanner({ message, type });
    setTimeout(() => setBanner(null), 6000);
  };

  // Metrics overview
  const lockedCount = useMemo(() => users.filter(u => u.isLocked).length, [users]);

  // Execute Search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
  };

  // Clear Search
  const handleClearSearch = () => {
    setSearchUserName('');
    setSearchApp('ALL');
    setHasSearched(false);
  };

  // Quick Search Shortcut (for rapid testing with popular users)
  const handleQuickSearch = (userName: string, app: string) => {
    setSearchUserName(userName);
    setSearchApp(app);
    setHasSearched(true);
  };

  // Filtered results based on search criteria
  const searchResults = useMemo(() => {
    if (!hasSearched) return [];

    return users.filter(user => {
      // 1. User Name match
      if (searchUserName.trim()) {
        const query = searchUserName.trim().toLowerCase();
        if (!user.userName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Application match
      if (searchApp !== 'ALL') {
        if (user.application.toLowerCase() !== searchApp.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [users, hasSearched, searchUserName, searchApp]);

  // Reset Skip Counter directly to 0
  const handleResetSkipCounter = (user: TraianaUserSkipRecord) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const updated = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          skipCount: 0,
          isLocked: false,
          status: u.verifiedEmail ? u.status : ('PENDING_VERIFICATION' as const),
          resetCountHistory: (u.resetCountHistory || 0) + 1,
          lastResetOn: timestamp,
          lastResetBy: currentUser?.email || 'ajay.swarnkar@osttra.com'
        };
      }
      return u;
    });

    // Add audit log
    onAddAuditLog({
      id: `aud-skip-${Date.now()}-${user.id}`,
      recordId: user.id,
      userName: user.userName,
      application: user.application,
      action: 'RESET_SKIP_COUNTER',
      performedBy: currentUser?.email || 'ajay.swarnkar@osttra.com (OSTTRA Support)',
      timestamp,
      ticketId: user.ticketId || `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      previousSkipCount: user.skipCount,
      newSkipCount: 0,
      previousEmail: user.verifiedEmail,
      newVerifiedEmail: user.verifiedEmail,
      previousStatus: user.status,
      newStatus: user.verifiedEmail ? user.status : 'PENDING_VERIFICATION',
      reason: 'Skip counter reset to 0 by OSTTRA support. User unlocked with 3 fresh skip chances.'
    });

    onUpdateUsers(updated);
    showBanner(
      `Skip counter reset to 0 for "${user.userName}" (${user.application}). Account is now unlocked!`,
      'success'
    );
  };

  // Open Verify Email Modal
  const handleOpenVerifyEmail = (user: TraianaUserSkipRecord) => {
    setVerifyModalUser(user);
    setIsVerifyModalOpen(true);
  };

  // Submit and update verified email
  const handleSubmitVerifiedEmail = ({
    userName,
    application,
    verifiedEmail,
    ticketId
  }: {
    userName: string;
    application: string;
    verifiedEmail: string;
    ticketId?: string;
  }) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' (UTC)';

    const effectiveTicketId = ticketId || `SSOOB-${Math.floor(4000 + Math.random() * 5000)}`;
    const existingIndex = users.findIndex(
      u => u.userName.toLowerCase() === userName.toLowerCase() && u.application.toLowerCase() === application.toLowerCase()
    );

    let updatedUsers: TraianaUserSkipRecord[];

    if (existingIndex >= 0) {
      const prev = users[existingIndex];
      onAddAuditLog({
        id: `aud-skip-${Date.now()}-${prev.id}`,
        recordId: prev.id,
        userName,
        application,
        action: 'ADMIN_VERIFY_EMAIL',
        performedBy: currentUser?.email || 'ajay.swarnkar@osttra.com (OSTTRA Admin)',
        timestamp,
        ticketId: effectiveTicketId,
        previousSkipCount: prev.skipCount,
        newSkipCount: 0,
        previousEmail: prev.verifiedEmail,
        newVerifiedEmail: verifiedEmail,
        previousStatus: prev.status,
        newStatus: 'VERIFIED_BY_ADMIN',
        reason: 'Corporate verified email updated directly by OSTTRA Admin on behalf of user.'
      });

      updatedUsers = users.map((u, idx) => {
        if (idx === existingIndex) {
          return {
            ...u,
            verifiedEmail,
            currentProvidedEmail: verifiedEmail,
            skipCount: 0,
            isLocked: false,
            status: 'VERIFIED_BY_ADMIN' as const,
            verifiedOn: timestamp,
            verifiedBy: `${currentUser?.email || 'ajay.swarnkar@osttra.com'} (OSTTRA Admin)`,
            ticketId: effectiveTicketId
          };
        }
        return u;
      });
    } else {
      // Create new record for this user & application
      const newId = `traiana-usr-${Date.now()}`;
      const newRecord: TraianaUserSkipRecord = {
        id: newId,
        userName,
        application,
        verifiedEmail,
        currentProvidedEmail: verifiedEmail,
        skipCount: 0,
        maxSkips: 3,
        status: 'VERIFIED_BY_ADMIN',
        isLocked: false,
        lastLoginAttempt: timestamp,
        verifiedOn: timestamp,
        verifiedBy: `${currentUser?.email || 'ajay.swarnkar@osttra.com'} (OSTTRA Admin)`,
        ticketId: effectiveTicketId,
        resetCountHistory: 0
      };

      onAddAuditLog({
        id: `aud-skip-${Date.now()}`,
        recordId: newId,
        userName,
        application,
        action: 'ADMIN_VERIFY_EMAIL',
        performedBy: currentUser?.email || 'ajay.swarnkar@osttra.com (OSTTRA Admin)',
        timestamp,
        ticketId: effectiveTicketId,
        previousSkipCount: 0,
        newSkipCount: 0,
        previousEmail: null,
        newVerifiedEmail: verifiedEmail,
        previousStatus: 'PENDING_VERIFICATION',
        newStatus: 'VERIFIED_BY_ADMIN',
        reason: 'New user verified email registered and saved by OSTTRA Admin.'
      });

      updatedUsers = [newRecord, ...users];
    }

    onUpdateUsers(updatedUsers);
    setIsVerifyModalOpen(false);
    setVerifyModalUser(null);
    showBanner(
      `Verified Email ID updated to "${verifiedEmail}" for "${userName}" (${application}). Account is verified & unlocked.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {banner && (
        <div 
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs border transition-all ${
            banner.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
            banner.type === 'warning' ? 'bg-amber-50 text-amber-900 border-amber-300' :
            'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
            <span>{banner.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setBanner(null)} 
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header & Quick Tools */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl border border-teal-200">
              <RotateCcw size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                  Traiana Legacy App Skip Counter &amp; Verification
                </h1>
                {lockedCount > 0 && (
                  <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    {lockedCount} Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Search by User Name and Application to look up user skip counts, reset counters to 0, or verify email IDs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Simulator Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              title="Test the 3-step Traiana login journey with 3 skips and lockout simulation"
            >
              <Play size={13} className="text-teal-700" />
              <span>Login Simulator</span>
            </button>

            {/* Audit Log Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                setAuditFilterUser(null);
                setIsAuditModalOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              title="View comprehensive audit history for skip resets and email verifications"
            >
              <History size={13} className="text-slate-600" />
              <span>Audit Log ({auditLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Controls Card (User Name & Application drop down) */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Search size={15} className="text-teal-700" />
            <span>Search Traiana User Skip Counter</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Provide the User Name and select an Application below to load matching records into the blotter.
          </p>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* 1. User Name Input */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <User size={13} className="text-teal-700" />
              <span>User Name</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter User Name (e.g. jdoe, sarah.connor, david.k)..."
                value={searchUserName}
                onChange={(e) => setSearchUserName(e.target.value)}
                className="w-full text-xs font-mono border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              {searchUserName && (
                <button
                  type="button"
                  onClick={() => setSearchUserName('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 2. Application Drop Down */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Layers size={13} className="text-teal-700" />
              <span>Application</span>
            </label>
            <select
              value={searchApp}
              onChange={(e) => setSearchApp(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="ALL">All Applications</option>
              {TRAIANA_APPLICATIONS.map((app) => (
                <option key={app} value={app}>
                  {app}
                </option>
              ))}
            </select>
          </div>

          {/* Search & Clear Buttons */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search size={14} />
              <span>Search</span>
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all border border-gray-300 cursor-pointer"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Quick Suggestion Chips for One-Click Testing */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 text-xxs font-semibold uppercase tracking-wider">Quick Lookups:</span>
          <button
            type="button"
            onClick={() => handleQuickSearch('jdoe', 'CFD')}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
          >
            jdoe (CFD - 🔒 Locked)
          </button>
          <button
            type="button"
            onClick={() => handleQuickSearch('sarah.connor', 'TradeServ')}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
          >
            sarah.connor (TradeServ - 🔒 Locked)
          </button>
          <button
            type="button"
            onClick={() => handleQuickSearch('david.k', 'CreditLink')}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
          >
            david.k (CreditLink - 🔒 Locked)
          </button>
          <button
            type="button"
            onClick={() => handleQuickSearch('alex.turner', 'Harmony')}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
          >
            alex.turner (Harmony - 1/3 Skips)
          </button>
          <button
            type="button"
            onClick={() => handleQuickSearch('', 'ALL')}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer"
          >
            View All ({users.length})
          </button>
        </div>
      </div>

      {/* Blotter Container */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Blotter Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-gray-900 tracking-tight">
              Traiana Skip Counter Blotter
            </h2>
            {hasSearched && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {searchResults.length} {searchResults.length === 1 ? 'Record' : 'Records'} Found
              </span>
            )}
          </div>
          {hasSearched && (
            <div className="text-xxs text-gray-500">
              Filter: User <span className="font-bold text-gray-700">{searchUserName || 'Any'}</span> | App <span className="font-bold text-gray-700">{searchApp}</span>
            </div>
          )}
        </div>

        {/* State 1: Search Not Yet Performed */}
        {!hasSearched ? (
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto border border-teal-200 shadow-2xs">
              <Search size={26} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-black text-gray-900">
                Search to Load Blotter
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Please provide a <strong>User Name</strong> and select an <strong>Application</strong> from the dropdown above, then click <strong>Search</strong> to load the skip counter record.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setHasSearched(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-300 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Load All Users Overview</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          /* State 2: No Matching Records Found */
          <div className="py-14 px-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle size={22} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-gray-900">
                No Record Found
              </h3>
              <p className="text-xs text-gray-500">
                No Traiana user matched User Name &quot;<span className="font-bold text-gray-800">{searchUserName}</span>&quot; on Application &quot;<span className="font-bold text-gray-800">{searchApp}</span>&quot;.
              </p>
            </div>
            {searchUserName && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const fallbackApp = searchApp === 'ALL' ? 'CFD' : searchApp;
                    setVerifyModalUser({
                      id: `temp-${Date.now()}`,
                      userName: searchUserName.trim(),
                      application: fallbackApp,
                      verifiedEmail: null,
                      currentProvidedEmail: null,
                      skipCount: 0,
                      maxSkips: 3,
                      status: 'PENDING_VERIFICATION',
                      isLocked: false,
                      lastLoginAttempt: 'Never'
                    });
                    setIsVerifyModalOpen(true);
                  }}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail size={13} />
                  <span>Verify Email &amp; Register &quot;{searchUserName}&quot;</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* State 3: Blotter Table with Requested Fields Only:
             1. User Name
             2. Application
             3. Verified Email Id
             4. Skip Counter
             5. Action (Reset Skip Counter, Verify Email)
          */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase text-[10px] font-black tracking-wider border-b border-gray-200">
                  <th className="p-3.5 pl-5">User Name</th>
                  <th className="p-3.5">Application</th>
                  <th className="p-3.5">Verified Email Id</th>
                  <th className="p-3.5">Skip Counter</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {searchResults.map((user) => {
                  const isLocked = user.isLocked;
                  const isVerified = Boolean(user.verifiedEmail);

                  return (
                    <tr 
                      key={user.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isLocked ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* 1. User Name */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isLocked 
                              ? 'bg-red-100 text-red-700 border border-red-300' 
                              : isVerified 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {user.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-900 text-xs">
                                {user.userName}
                              </span>
                              {isLocked && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                                  <Lock size={10} />
                                  <span>Locked</span>
                                </span>
                              )}
                            </div>
                            {user.resetCountHistory > 0 && (
                              <span className="text-[10px] text-amber-700 font-semibold block">
                                Reset {user.resetCountHistory}x
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Application */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                          {user.application}
                        </span>
                      </td>

                      {/* 3. Verified Email Id */}
                      <td className="p-3.5">
                        {user.verifiedEmail ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-gray-900 font-bold">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            <span>{user.verifiedEmail}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                            <span className="italic">Not Verified</span>
                            {user.currentProvidedEmail && (
                              <span className="text-[10px] font-mono text-gray-400 ml-1">
                                ({user.currentProvidedEmail})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 4. Skip Counter */}
                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetSkipCounter(user)}
                            title="Click to reset skip counter to 0"
                            className={`px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs hover:scale-102 ${
                              isLocked
                                ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                                : user.skipCount >= 2
                                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                : user.skipCount === 1
                                ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            }`}
                          >
                            <span>{user.skipCount} / {user.maxSkips} Skips</span>
                            {isLocked && <Lock size={11} className="text-red-700" />}
                          </button>
                        </div>
                      </td>

                      {/* 5. Action: Reset Skip Counter & Verify Email */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Action 1: Reset Skip Counter */}
                          <button
                            type="button"
                            onClick={() => handleResetSkipCounter(user)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            title="Reset Skip Counter to 0 and unlock user account"
                          >
                            <RotateCcw size={12} />
                            <span>Reset Skip Counter</span>
                          </button>

                          {/* Action 2: Verify Email */}
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyEmail(user)}
                            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            title="Provide or update verified corporate email ID for this user"
                          >
                            <Mail size={12} />
                            <span>Verify Email</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Blotter Footer */}
        {hasSearched && searchResults.length > 0 && (
          <div className="p-3.5 border-t border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <div>
              Showing <span className="font-bold text-gray-800">{searchResults.length}</span> user {searchResults.length === 1 ? 'record' : 'records'} matching your search.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">
                Total legacy users in database: {users.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Verify Email Modal */}
      <VerifyEmailModal
        isOpen={isVerifyModalOpen}
        user={verifyModalUser}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setVerifyModalUser(null);
        }}
        onSubmitEmail={handleSubmitVerifiedEmail}
      />

      {/* Simulator Modal */}
      {isSimulatorOpen && (
        <TraianaLoginJourneySimulatorModal
          users={users}
          onClose={() => setIsSimulatorOpen(false)}
          onUpdateUserSkip={(userId, newCount, isLocked) => {
            const updated = users.map(u => u.id === userId ? { ...u, skipCount: newCount, isLocked } : u);
            onUpdateUsers(updated);
          }}
          onVerifyEmailDirectly={(userId, email) => {
            const targetUser = users.find(u => u.id === userId);
            if (targetUser) {
              handleSubmitVerifiedEmail({
                userName: targetUser.userName,
                application: targetUser.application,
                verifiedEmail: email
              });
            }
          }}
        />
      )}

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <TraianaSkipAuditModal
          auditLogs={auditLogs}
          onClose={() => setIsAuditModalOpen(false)}
          filterUserName={auditFilterUser}
        />
      )}
    </div>
  );
};
