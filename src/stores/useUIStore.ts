import { create } from 'zustand';

export type ViewMode = 'globe' | 'gallery' | 'timeline';

interface UIState {
  viewMode: ViewMode;
  selectedAssetId: string | null;
  detailPanelOpen: boolean;
  sidebarExpanded: boolean;

  setViewMode: (mode: ViewMode) => void;
  selectAsset: (id: string) => void;
  closeDetail: () => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'globe',
  selectedAssetId: null,
  detailPanelOpen: false,
  sidebarExpanded: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  selectAsset: (id) =>
    set({ selectedAssetId: id, detailPanelOpen: true }),

  closeDetail: () =>
    set({ selectedAssetId: null, detailPanelOpen: false }),

  toggleSidebar: () =>
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
}));
