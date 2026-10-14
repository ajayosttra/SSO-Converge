import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  KeyRound, 
  Mail, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  User, 
  Lock, 
  Unlock,
  Check
} from 'lucide-react';
import { TraianaUserSkipRecord } from '../types';

interface TraianaLoginJourneySimulatorModalProps {
  users: TraianaUserSkipRecord[];
  onClose: () => void;
  onResetUser: (recordId: string) => void;
  onCaptureEmail: (record: TraianaUserSkipRecord) => void;
}

export const TraianaLoginJourneySimulatorModal: React.FC<TraianaLoginJourneySimulatorModalProps> = ({
  users,
  onClose,
  onResetUser,
  onCaptureEmail
}) => {
  // Select which user to test with
  const [selectedUserId, setSelectedUserId] = useState<string>(
    users.find(u => u.isLocked)?.id || users[0]?.id || ''
  );

  const currentUserRecord = users.find(u => u.id === selectedUserId) || users[0];

  // Simulator stage: 'CREDENTIALS' | 'EMAIL_OTP_PROMPT' | 'OTP_ENTRY' | 'LOCKED_SCREEN' | 'SUCCESS_APP'
  const [stage, setStage] = useState<'CREDENTIALS' | 'EMAIL_OTP_PROMPT' | 'OTP_ENTRY' | 'LOCKED_SCREEN' | 'SUCCESS_APP'>('CREDENTIALS');
  
  // Simulated form states
  const [simPassword, setSimPassword] = useState('••••••••••••');
  const [simEmail, setSimEmail] = useState(currentUserRecord?.verifiedEmail || currentUserRecord?.currentProvidedEmail || `${currentUserRecord?.userName || 'user'}@barclays.com`);
  const [simOtpCode, setSimOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // When selected user changes, reset simulation stage appropriately
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const rec = users.find(u => u.id === userId);
    if (rec) {
      setSimEmail(rec.verifiedEmail || rec.currentProvidedEmail || `${rec.userName}@institution.com`);
      if (rec.isLocked) {
        setStage('LOCKED_SCREEN');
      } else {
        setStage('CREDENTIALS');
      }
    }
  };

  // Handle Login button (Credentials step)
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRecord?.isLocked) {
      setStage('LOCKED_SCREEN');
      return;
    }
    // If user is already verified by admin or OTP, they can enter directly
    if (currentUserRecord?.status === 'VERIFIED_BY_ADMIN' || currentUserRecord?.status === 'VERIFIED_BY_OTP') {
      setStage('SUCCESS_APP');
      return;
    }
    // Otherwise, user enters the Email Confirmation & OTP Skip workflow!
    setStage('EMAIL_OTP_PROMPT');
  };

  // Handle Skip
  const handleSkip = () => {
    if (!currentUserRecord) return;
    const currentSkips = currentUserRecord.skipCount;
    const nextSkips = currentSkips + 1;

    // Mutate state locally for simulation visual feedback
    currentUserRecord.skipCount = nextSkips;
    if (nextSkips >= 3) {
      currentUserRecord.isLocked = true;
      currentUserRecord.status = 'LOCKED_EXHAUSTED';
      setStage('LOCKED_SCREEN');
    } else {
      currentUserRecord.status = 'PENDING_VERIFICATION';
      // User proceeds to application using their skip
      setStage('SUCCESS_APP');
    }
  };

  // Handle Send OTP
  const handleSendOtp = () => {
    if (!simEmail || !simEmail.includes('@')) {
      setOtpError('Please provide a valid corporate email address.');
      return;
    }
    setOtpError('');
    setIsSendingOtp(true);
    setTimeout(() => {
      setIsSendingOtp(false);
      setOtpSent(true);
      setStage('OTP_ENTRY');
    }, 600);
  };

  // Handle OTP Verify
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (simOtpCode.trim().length < 4) {
      setOtpError('Please enter the 6-digit OTP received via email (e.g. 582914).');
      return;
    }
    // Mark verified
    if (currentUserRecord) {
      currentUserRecord.verifiedEmail = simEmail;
      currentUserRecord.status = 'VERIFIED_BY_OTP';
      currentUserRecord.isLocked = false;
      currentUserRecord.verifiedBy = 'Self-Service (OTP Verified)';
    }
    setStage('SUCCESS_APP');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
      />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden border border-gray-300 flex flex-col max-h-[90vh]">
        {/* Simulator Control Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-lg text-teal-400">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Traiana Legacy App Login Journey Simulator</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Interactive Test Rig
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Experience the exact 3-chance skip journey, OTP lockout, and admin unlock flow.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Selector Bar */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Simulate as User:</span>
            <select
              value={selectedUserId}
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.userName} ({u.application} - {u.isLocked ? '🔴 LOCKED (3/3 Skips)' : `${u.skipCount}/3 Skips, ${u.status}`})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Live Status:</span>
            {currentUserRecord?.isLocked ? (
              <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-200">
                🔴 Locked (Skips Exhausted: 3/3)
              </span>
            ) : currentUserRecord?.status === 'VERIFIED_BY_ADMIN' || currentUserRecord?.status === 'VERIFIED_BY_OTP' ? (
              <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                🟢 Verified ({currentUserRecord.verifiedEmail})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                🟡 {currentUserRecord?.skipCount || 0} of 3 Skips Used
              </span>
            )}
          </div>
        </div>

        {/* Simulator Viewport Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex items-center justify-center min-h-[420px]">
          {/* STAGE 1: Standard Traiana CFD Login Screen */}
          {stage === 'CREDENTIALS' && (
            <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-5">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-800 text-white font-black text-xl mb-1 shadow-sm">
                  T
                </div>
                <h3 className="text-lg font-black text-slate-900">Traiana {currentUserRecord?.application || 'CFD'}</h3>
                <p className="text-xs text-slate-500 font-medium">Enterprise Post-Trade &amp; Risk Platform</p>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">User Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUserRecord?.userName} 
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      value={simPassword} 
                      onChange={(e) => setSimPassword(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Log In to Traiana {currentUserRecord?.application}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-400">
                  Secured by OSTTRA Converge SSO Gateway
                </p>
              </form>
            </div>
          )}

          {/* STAGE 2: Email Confirmation & OTP Challenge (With 3-Skip Counter) */}
          {stage === 'EMAIL_OTP_PROMPT' && (
            <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-100 rounded-md text-teal-800">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Email Verification Required</h3>
                    <p className="text-[11px] text-slate-500">Traiana Login Security Policy</p>
                  </div>
                </div>
                {/* Skip Progress Badge */}
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {currentUserRecord?.skipCount || 0} of 3 Skips Used
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle size={14} className="text-amber-700" />
                  <span>Notice: 3 Skip Maximum Policy</span>
                </div>
                <p className="text-xxs leading-relaxed text-amber-800">
                  You may skip email verification up to <strong>3 times</strong>. After 3 skips, your login will be locked until an OSTTRA support admin verifies your email or resets your counter.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Work Email Address
                  </label>
                  <input 
                    type="email"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    placeholder="e.g. user@barclays.com"
                    className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                  {otpError && (
                    <p className="text-xxs text-red-600 mt-1 font-semibold">{otpError}</p>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 disabled:bg-teal-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {isSendingOtp ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Sending One-Time Passcode...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Send OTP &amp; Verify Email Now</span>
                      </>
                    )}
                  </button>

                  {/* The Skip Option (Max 3 Chances) */}
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Skip for Now ({3 - (currentUserRecord?.skipCount || 0)} chance(s) remaining)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: OTP Code Entry Screen */}
          {stage === 'OTP_ENTRY' && (
            <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 text-teal-800 mb-1">
                  <KeyRound size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Enter Verification Code</h3>
                <p className="text-xs text-slate-500">
                  We sent a 6-digit OTP passcode to <span className="font-bold text-slate-800">{simEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-center mb-1">
                    <input 
                      type="text" 
                      maxLength={6}
                      autoFocus
                      placeholder="582914"
                      value={simOtpCode}
                      onChange={(e) => setSimOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-48 text-center tracking-widest text-xl font-mono font-bold bg-white border-2 border-teal-600 rounded-lg py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <p className="text-[11px] text-center text-slate-400">
                    Enter any 6-digit test code (e.g. 582914)
                  </p>
                  {otpError && (
                    <p className="text-xxs text-red-600 text-center mt-1 font-semibold">{otpError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm &amp; Unlock Traiana Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStage('EMAIL_OTP_PROMPT')}
                    className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Back to email entry
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STAGE 4: USER LOCKED OUT (3/3 Skips Exhausted!) */}
          {stage === 'LOCKED_SCREEN' && (
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border-2 border-red-300 p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 text-red-700 mx-auto animate-pulse">
                  <ShieldAlert size={28} />
                </div>
                <h3 className="text-base font-black text-red-950">
                  Login Locked: Email Verification Required
                </h3>
                <p className="text-xs text-red-800 font-semibold">
                  You have exhausted all 3 skips for verifying your email in Traiana {currentUserRecord?.application}.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold border-b border-red-200 pb-1">
                  <span>User Name: {currentUserRecord?.userName}</span>
                  <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded">Skips Used: 3 / 3</span>
                </div>
                <p className="text-xxs text-red-800 leading-relaxed">
                  For regulatory and security governance, access is suspended until your work email is verified. You cannot skip any further.
                </p>
              </div>

              {/* Support Contact Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                <p className="font-bold text-slate-800">Need Immediate Help?</p>
                <p className="text-xxs text-slate-600">
                  Contact the OSTTRA Support Desk at <span className="font-bold text-teal-800">support@osttra.com</span> or call the 24/7 hotline to have an authorized admin reset your skip counter or verify your email on your behalf.
                </p>
              </div>

              {/* OSTTRA Admin Quick Unlock Actions (Built directly into the test rig!) */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">
                  Support Personnel Actions (Admin Tools)
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUserRecord) {
                        onResetUser(currentUserRecord.id);
                        currentUserRecord.skipCount = 0;
                        currentUserRecord.isLocked = false;
                        currentUserRecord.status = 'PENDING_VERIFICATION';
                        setStage('EMAIL_OTP_PROMPT');
                      }
                    }}
                    className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Skip Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentUserRecord) {
                        onCaptureEmail(currentUserRecord);
                        onClose();
                      }
                    }}
                    className="py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Mail size={13} />
                    <span>Verify Email on Behalf</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: SUCCESSFUL LOGIN TO TRAIANA APP */}
          {stage === 'SUCCESS_APP' && (
            <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-emerald-300 p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <h3 className="text-base font-black text-emerald-950">
                  Welcome to Traiana {currentUserRecord?.application || 'CFD'}!
                </h3>
                <p className="text-xs text-emerald-800 font-medium">
                  Authentication Successful. Session established.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs space-y-1.5 text-emerald-900">
                <div className="flex justify-between items-center text-[11px] font-bold border-b border-emerald-200 pb-1">
                  <span>User: {currentUserRecord?.userName}</span>
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Status: {currentUserRecord?.status}
                  </span>
                </div>
                <div className="text-xxs space-y-1 pt-0.5">
                  <p>
                    <strong>Email:</strong> {currentUserRecord?.verifiedEmail || 'Skipped for this session'}
                  </p>
                  <p>
                    <strong>Skips Used:</strong> {currentUserRecord?.skipCount || 0} / 3
                  </p>
                  {currentUserRecord?.verifiedBy && (
                    <p>
                      <strong>Verified By:</strong> {currentUserRecord.verifiedBy}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStage('CREDENTIALS')}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Restart Simulation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>Simulating workflow: Legacy User &rarr; Email Confirm &rarr; 3 Skips &rarr; Support Admin Override</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
