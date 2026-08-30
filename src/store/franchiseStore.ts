import { create } from 'zustand';
import { FranchiseSession, POSTerminal, Branch } from '../types/franchise';

interface FranchiseState {
  session: FranchiseSession | null;
  setSession: (session: FranchiseSession | null) => void;
  branches: Branch[];
  setBranches: (branches: Branch[]) => void;
  terminals: POSTerminal[];
  setTerminals: (terminals: POSTerminal[]) => void;
}

export const useFranchiseStore = create<FranchiseState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  branches: [
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
  ],
  setBranches: (branches) => set({ branches }),
  terminals: [],
  setTerminals: (terminals) => set({ terminals })
}));