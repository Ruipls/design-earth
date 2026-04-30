import { create } from 'zustand';
import type { Category } from '../types/DesignAsset';
import { YEAR_RANGE } from '../lib/constants';

interface FilterState {
  activeCategories: Set<Category>;
  yearRange: [number, number];
  searchQuery: string;

  toggleCategory: (cat: Category) => void;
  setAllCategories: () => void;
  setYearRange: (range: [number, number]) => void;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
}

const ALL_CATEGORIES: Set<Category> = new Set([
  'architecture',
  'graphic',
  'industrial',
  'interior',
  'fashion',
]);

export const useFilterStore = create<FilterState>((set) => ({
  activeCategories: new Set(ALL_CATEGORIES),
  yearRange: [YEAR_RANGE.MIN, YEAR_RANGE.MAX],
  searchQuery: '',

  toggleCategory: (cat) =>
    set((state) => {
      const next = new Set(state.activeCategories);
      if (next.has(cat)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return { activeCategories: next };
    }),

  setAllCategories: () => set({ activeCategories: new Set(ALL_CATEGORIES) }),

  setYearRange: (range) => set({ yearRange: range }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  resetFilters: () =>
    set({
      activeCategories: new Set(ALL_CATEGORIES),
      yearRange: [YEAR_RANGE.MIN, YEAR_RANGE.MAX],
      searchQuery: '',
    }),
}));
