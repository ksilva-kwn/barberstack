import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BranchState {
  activeBranchId: string | null;
  setActiveBranch: (id: string | null) => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      activeBranchId: null,
      setActiveBranch: (id) => set({ activeBranchId: id }),
    }),
    { name: 'barberstack-branch' },
  ),
);
