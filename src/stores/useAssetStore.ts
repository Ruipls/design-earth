import { create } from 'zustand';
import type { DesignAsset } from '../types/DesignAsset';
import { seedAssets } from '../data/seed-assets';

interface AssetState {
  assets: DesignAsset[];
  loading: boolean;
  error: string | null;

  fetchAssets: () => Promise<void>;
}

export const useAssetStore = create<AssetState>((set) => ({
  assets: [],
  loading: true,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      // MVP: load from seed data. Phase 3: replace with Supabase fetch.
      set({ assets: seedAssets, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
}));
