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
  restrictedReason: string | null;
  restrictedEmail: string | null;
  clearRestricted: () => void;
  branches: Branch[];
  terminals: POSTerminal[];
  
  // Actions
  setSession: (session: FranchiseSession | null) => void;
  setBranches: (branches: Branch[]) => void;
  setTerminals: (terminals: POSTerminal[]) => void;
  initAuth: () => () => void;
  logout: () => Promise<void>;
}

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'main_branch',
    name: 'Olive Pizza — Rajnandgaon HQ',
    address: 'Dongargaon Rd, near Saraswati school, Rajnandgaon',
    phone: '+91 91799 44445',
    managerName: 'Sunil Verma',
    managerEmail: 'manager.rjn@olivepizza.in',
    activeOrdersCount: 4,
    todaySales: 28450,
    isOpen: true
  },
  {
    id: 'durg_branch',
    name: 'Olive Pizza — Durg Station Rd',
    address: 'Shop 12, Station Rd, Durg, CG',
    phone: '+91 91799 44446',
    managerName: 'Pooja Sharma',
    managerEmail: 'manager.durg@olivepizza.in',
    activeOrdersCount: 2,
    todaySales: 16900,
    isOpen: true
  }
];

export const useFranchiseStore = create<FranchiseState>((set) => ({
  user: null,
  session: null,
  isAuthChecking: true,
  isAuthorized: false,
  restrictedReason: null,
  restrictedEmail: null,
  clearRestricted: () => set({ restrictedReason: null, restrictedEmail: null }),
  branches: DEFAULT_BRANCHES,
  terminals: [],
  setSession: (session) => set({ session, isAuthorized: !!session }),
  setBranches: (branches) => set({ branches }),
  setTerminals: (terminals) => set({ terminals }),

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({
          user: null,
          session: null,
          isAuthChecking: false,
          isAuthorized: false,
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
          const newSession: FranchiseSession = {
            uid: firebaseUser.uid,
            email: emailLower,
            franchiseId: u.franchiseId || 'fra_primary',
            franchiseName: u.franchiseName || 'Olive Pizza — Rajnandgaon Franchise',
            role: u.role as any,
            branchIds: u.branchIds || ['main_branch', 'durg_branch'],
            isAuthenticated: true
          };
          localStorage.setItem('franchise_id', newSession.franchiseId);
          set({
            user: firebaseUser,
            session: newSession,
            isAuthChecking: false,
            isAuthorized: true,
            restrictedReason: null,
            restrictedEmail: null
          });
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
            franchiseId: 'fra_primary',
            franchiseName: 'Olive Pizza — Rajnandgaon Franchise',
            role: 'owner',
            branchIds: ['main_branch', 'durg_branch'],
            isAuthenticated: true
          };
          set({
            user: firebaseUser,
            session: fallbackSession,
            isAuthChecking: false,
            isAuthorized: true,
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