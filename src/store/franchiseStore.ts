import { create } from 'zustand';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getApiUrl } from '../lib/api';
import { FranchiseSession, POSTerminal, Branch } from '../types/franchise';

interface FranchiseState {
  user: User | null;
  session: FranchiseSession | null;
  isAuthChecking: boolean;
  isAuthorized: boolean;
  isPinVerified: boolean;
  requiresPin: boolean;
  restrictedReason: string | null;
  restrictedEmail: string | null;
  clearRestricted: () => void;
  branches: Branch[];
  terminals: POSTerminal[];
  
  // Actions
  setSession: (session: FranchiseSession | null) => void;
  setBranches: (branches: Branch[]) => void;
  setTerminals: (terminals: POSTerminal[]) => void;
  setPinVerified: (verified: boolean) => void;
  verifyPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  fetchBranches: () => Promise<void>;
  initAuth: () => () => void;
  logout: () => Promise<void>;
}

// Canonical Rajnandgaon HQ is the single primary location. No fake branches.
const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'main_branch',
    name: 'Olive Pizza — Rajnandgaon HQ',
    address: 'Dongargaon Rd, near Saraswati school, Rajnandgaon, CG',
    phone: '+91 91799 44445',
    managerName: 'Branch Manager',
    managerEmail: 'manager.rjn@olivepizza.in',
    activeOrdersCount: 0,
    todaySales: 0,
    isOpen: true
  }
];

export const useFranchiseStore = create<FranchiseState>((set, get) => ({
  user: null,
  session: null,
  isAuthChecking: true,
  isAuthorized: false,
  isPinVerified: false,
  requiresPin: false,
  restrictedReason: null,
  restrictedEmail: null,
  clearRestricted: () => set({ restrictedReason: null, restrictedEmail: null }),
  branches: INITIAL_BRANCHES,
  terminals: [],
  setSession: (session) => set({ session, isAuthorized: !!session }),
  setBranches: (branches) => set({ branches }),
  setTerminals: (terminals) => set({ terminals }),
  setPinVerified: (verified) => set({ isPinVerified: verified }),

  fetchBranches: async () => {
    try {
      const fId = get().session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetch(getApiUrl(`api/franchises/${fId}/branches`), {
        headers: {
          'x-franchise-id': fId,
          ...(get().user ? { 'Authorization': `Bearer ${await get().user?.getIdToken()}` } : {})
        }
      });
      const data = await res.json().catch(() => null);
      if (data?.success && Array.isArray(data?.branches) && data.branches.length > 0) {
        set({ branches: data.branches });
      }
    } catch (e) {
      console.warn('[FranchiseStore] Notice fetching branches:', e);
    }
  },

  verifyPin: async (pin: string) => {
    try {
      const token = await get().user?.getIdToken();
      if (!token) {
        return { success: false, error: 'User is not authenticated' };
      }
      const resp = await fetch(getApiUrl('api/franchises/verify-pin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });
      const data = await resp.json().catch(() => null);
      if (resp.ok && data?.success) {
        set({ isPinVerified: true });
        return { success: true };
      }
      return { success: false, error: data?.error || 'PIN verification failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error verifying PIN' };
    }
  },

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({
          user: null,
          session: null,
          isAuthChecking: false,
          isAuthorized: false,
          isPinVerified: false,
          requiresPin: false,
          restrictedReason: null,
          restrictedEmail: null
        });
        return;
      }

      const emailLower = (firebaseUser.email || '').toLowerCase().trim();

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
          const isOwnerRole = u.role === 'owner' || u.role === 'platform_owner';
          const newSession: FranchiseSession = {
            uid: firebaseUser.uid,
            email: emailLower,
            franchiseId: u.franchiseId || 'fra_rajnandgaon',
            franchiseName: u.franchiseName || 'Olive Pizza — Rajnandgaon Franchise',
            role: u.role as any,
            branchIds: u.branchIds || ['main_branch'],
            isAuthenticated: true
          };
          localStorage.setItem('franchise_id', newSession.franchiseId);
          set({
            user: firebaseUser,
            session: newSession,
            isAuthChecking: false,
            isAuthorized: true,
            requiresPin: !isOwnerRole && !!u.hasPin,
            isPinVerified: isOwnerRole, // Master owners don't require PIN gate
            restrictedReason: null,
            restrictedEmail: null
          });

          // Dynamically load real branches for this franchise
          get().fetchBranches();
        } else {
          // Unauthorized account — wipe session and enforce immediate sign out
          const denialReason = authData?.reason || 'This account is not authorized to use this Olive Pizza application.';
          console.warn('[FranchiseStore] Access restricted for account:', emailLower, denialReason);

          await signOut(auth).catch(() => {});
          localStorage.removeItem('franchise_id');
          sessionStorage.clear();

          set({
            user: null,
            session: null,
            isAuthChecking: false,
            isAuthorized: false,
            isPinVerified: false,
            requiresPin: false,
            restrictedReason: denialReason,
            restrictedEmail: emailLower
          });
        }
      } catch (err: any) {
        console.error('[FranchiseStore] Auth handshake network error:', err);

        const isMasterOwner = emailLower === 'olivepizzarjn@gmail.com' || emailLower === 'webhub2811@gmail.com' || emailLower === 'olivepizzamaker@gmail.com';
        if (isMasterOwner) {
          const fallbackSession: FranchiseSession = {
            uid: firebaseUser.uid,
            email: emailLower,
            franchiseId: 'fra_rajnandgaon',
            franchiseName: 'Olive Pizza — Rajnandgaon Franchise',
            role: 'owner',
            branchIds: ['main_branch'],
            isAuthenticated: true
          };
          set({
            user: firebaseUser,
            session: fallbackSession,
            isAuthChecking: false,
            isAuthorized: true,
            isPinVerified: true,
            requiresPin: false,
            restrictedReason: null,
            restrictedEmail: null
          });
        } else {
          await signOut(auth).catch(() => {});
          set({
            user: null,
            session: null,
            isAuthChecking: false,
            isAuthorized: false,
            isPinVerified: false,
            requiresPin: false,
            restrictedReason: 'This account is not authorized to use this Olive Pizza application.',
            restrictedEmail: emailLower
          });
        }
      }
    });

    return () => unsubscribe();
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[FranchiseStore] Logout error:', e);
    }
    localStorage.removeItem('franchise_id');
    set({
      user: null,
      session: null,
      isAuthChecking: false,
      isAuthorized: false
    });
  }
}));