import { create } from 'zustand';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { FranchiseSession, POSTerminal, Branch } from '../types/franchise';

interface FranchiseState {
  user: User | null;
  session: FranchiseSession | null;
  isAuthChecking: boolean;
  isAuthorized: boolean;
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
          isAuthorized: false
        });
        return;
      }

      try {
        const emailLower = (firebaseUser.email || '').toLowerCase().trim();
        const isMasterOwner = emailLower === 'olivepizzarjn@gmail.com' || emailLower === 'webhub2811@gmail.com' || emailLower === 'olivepizzamaker@gmail.com';

        let franchiseId = 'fra_primary';
        let franchiseName = 'Olive Pizza — Rajnandgaon Franchise';
        let role = isMasterOwner ? 'owner' : 'franchise_manager';
        let branchIds = ['main_branch', 'durg_branch'];
        let isAuthorized = isMasterOwner;

        // 1. Try reading doc(db, 'users', uid)
        try {
          const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.franchiseId) franchiseId = data.franchiseId;
            if (data.franchiseName) franchiseName = data.franchiseName;
            if (data.role) role = data.role;
            if (data.branchIds) branchIds = data.branchIds;
            if (['franchise_owner', 'franchise_manager', 'owner', 'admin', 'developer'].includes(data.role)) {
              isAuthorized = true;
            }
          }
        } catch (e) {
          console.warn('[FranchiseStore] User doc lookup notice:', e);
        }

        // 2. Also check franchise_users collection
        if (!isAuthorized) {
          try {
            const fraDocSnap = await getDoc(doc(db, 'franchise_users', firebaseUser.uid));
            if (fraDocSnap.exists()) {
              const data = fraDocSnap.data();
              franchiseId = data.franchiseId || franchiseId;
              franchiseName = data.franchiseName || franchiseName;
              role = data.role || 'franchise_manager';
              branchIds = data.branchIds || branchIds;
              isAuthorized = true;
            } else {
              const q = query(collection(db, 'franchise_users'), where('email', '==', emailLower));
              const snap = await getDocs(q).catch(() => null);
              if (snap && !snap.empty) {
                const data = snap.docs[0].data();
                franchiseId = data.franchiseId || franchiseId;
                franchiseName = data.franchiseName || franchiseName;
                role = data.role || 'franchise_manager';
                branchIds = data.branchIds || branchIds;
                isAuthorized = true;
              }
            }
          } catch (e) {
            console.warn('[FranchiseStore] Franchise doc lookup notice:', e);
          }
        }

        if (isAuthorized) {
          const newSession: FranchiseSession = {
            uid: firebaseUser.uid,
            email: emailLower,
            franchiseId,
            franchiseName,
            role: role as any,
            branchIds,
            isAuthenticated: true
          };
          localStorage.setItem('franchise_id', franchiseId);
          set({
            user: firebaseUser,
            session: newSession,
            isAuthChecking: false,
            isAuthorized: true
          });
        } else {
          set({
            user: firebaseUser,
            session: null,
            isAuthChecking: false,
            isAuthorized: false
          });
        }
      } catch (err) {
        console.error('[FranchiseStore] Auth initialization error:', err);
        set({
          user: firebaseUser,
          session: null,
          isAuthChecking: false,
          isAuthorized: false
        });
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