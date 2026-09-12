import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFranchiseStore } from '../store/franchiseStore';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { Key, Sparkles, User, ShieldCheck, Lock } from 'lucide-react';
import { AppLogo } from '../components/common/AppLogo';
import { getApiUrl } from '../lib/api';
import toast from 'react-hot-toast';
import { requestPostLoginNotificationPermissions } from '../services/notificationPermissionService';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const setSession = useFranchiseStore((s) => s.setSession);
  const verifyPin = useFranchiseStore((s) => s.verifyPin);
  const navigate = useNavigate();

  const formatAuthError = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This franchise account has been disabled. Please contact Olive Pizza administration.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/popup-closed-by-user':
        return '';
      default:
        return err?.message || 'Franchise login failed. Please try again.';
    }
  };

  const verifyFranchiseRole = async (firebaseUser: any) => {
    const userEmail = firebaseUser.email || '';
    const normalized = userEmail.toLowerCase().trim();
    const uid = firebaseUser.uid;
    const isGlobalOwner = normalized === 'olivepizzarjn@gmail.com' || normalized === 'webhub2811@gmail.com' || normalized === 'olivepizzamaker@gmail.com';

    let isAuthorized = false;
    let denialReason = 'This account is not authorized to use the Olive Pizza Franchise Management portal.';
    let sessionData: any = null;

    try {
      const idToken = await firebaseUser.getIdToken();
      const resp = await fetch(getApiUrl('api/auth/authorize-app'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetApp: 'FRANCHISE_MANAGER'
        })
      });

      const authData = await resp.json().catch(() => null);

      if (resp.ok && authData?.authorized) {
        const u = authData.user;
        isAuthorized = true;
        sessionData = {
          uid,
          email: normalized,
          franchiseId: u.franchiseId || 'fra_rajnandgaon',
          franchiseName: u.franchiseName || 'Olive Pizza — Rajnandgaon Franchise',
          role: u.role as any,
          branchIds: u.branchIds || ['main_branch'],
          isAuthenticated: true
        };
      } else {
        denialReason = authData?.reason || denialReason;
        if (resp.status !== 403 && isGlobalOwner) {
          isAuthorized = true;
          sessionData = {
            uid,
            email: normalized,
            franchiseId: 'fra_rajnandgaon',
            franchiseName: 'Olive Pizza — Rajnandgaon Franchise',
            role: 'owner',
            branchIds: ['main_branch'],
            isAuthenticated: true
          };
        }
      }
    } catch (netErr) {
      console.warn('[LoginPage] Server check network error:', netErr);
      if (isGlobalOwner) {
        isAuthorized = true;
        sessionData = {
          uid,
          email: normalized,
          franchiseId: 'fra_rajnandgaon',
          franchiseName: 'Olive Pizza — Rajnandgaon Franchise',
          role: 'owner',
          branchIds: ['main_branch'],
          isAuthenticated: true
        };
      }
    }

    if (!isAuthorized) {
      await signOut(auth).catch(() => {});
      localStorage.removeItem('franchise_id');
      sessionStorage.clear();
      useFranchiseStore.setState({
        user: null,
        session: null,
        isAuthorized: false,
        restrictedReason: denialReason,
        restrictedEmail: normalized
      });
      throw new Error(denialReason);
    }

    setSession(sessionData);
    localStorage.setItem('franchise_id', sessionData.franchiseId);

    // If role is manager (not owner), require PIN unlock before navigating
    if (sessionData.role !== 'owner' && sessionData.role !== 'platform_owner') {
      setShowPinModal(true);
      return false;
    }
    return true;
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput || pinInput.length < 4) {
      toast.error('Please enter your 4 to 6 digit security PIN.');
      return;
    }
    setPinLoading(true);
    try {
      const res = await verifyPin(pinInput);
      if (res.success) {
        toast.success('PIN verified! Unlocking franchise dashboard... 🍕');
        setShowPinModal(false);
        requestPostLoginNotificationPermissions().catch(() => {});
        navigate('/dashboard');
      } else {
        toast.error(res.error || 'Incorrect PIN');
      }
    } finally {
      setPinLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your franchise email address.');
      return;
    }
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const ready = await verifyFranchiseRole(cred.user);
      if (ready) {
        toast.success('Welcome to Franchise Management! 🍕');
        requestPostLoginNotificationPermissions().catch(() => {});
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = formatAuthError(err);
      if (msg) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      let user: any = null;
      if (Capacitor.isNativePlatform()) {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const res = await FirebaseAuthentication.signInWithGoogle();
        const idToken = res.credential?.idToken;
        if (!idToken) throw new Error('Failed to get Google ID token on mobile device.');
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        user = userCredential.user;
      } else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      }

      if (!user?.email) throw new Error('Google account missing email address.');

      const ready = await verifyFranchiseRole(user);
      if (ready) {
        toast.success(`Welcome back, ${user.displayName || 'Franchise Partner'}! 🍕`);
        requestPostLoginNotificationPermissions().catch(() => {});
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = formatAuthError(err);
      if (msg) toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white flex flex-col items-center justify-center p-3.5 sm:p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-3">
          <AppLogo variant="full" size="xl" subtitle="Franchise Management" />
          <p className="text-xs text-slate-400 pt-1">Franchise Owner & Multi-Branch Portal</p>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md shadow-white/5 active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {googleLoading ? (
            <span>Connecting with Google...</span>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (Franchise Partner)</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] uppercase font-bold text-slate-500">Or sign in with email</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
              <User size={13} className="text-amber-400" /> Franchise Account Email
            </label>
            <input
              type="email"
              required
              placeholder="franchise@olivepizza.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Key size={13} className="text-amber-400" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={16} /> {loading ? 'Authenticating...' : 'Sign In to Franchise Portal'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Franchise Multi-Tenancy Scoped & Protected
          </p>
        </div>
      </div>

      {/* Security PIN Entry Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Security PIN Verification</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your 4 to 6 digit manager security PIN to access this franchise terminal.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                required
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-center text-2xl tracking-[0.5em] font-mono text-amber-400 focus:outline-none focus:border-amber-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    signOut(auth).catch(() => {});
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinLoading || pinInput.length < 4}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {pinLoading ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
