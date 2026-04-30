import { create } from 'zustand';
import { CAMERA, ZOOM } from '../lib/constants';

export type ZoomTier = 'far' | 'mid' | 'near';

interface GlobeState {
  cameraDistance: number;
  zoomTier: ZoomTier;
  cameraTarget: { lat: number; lng: number } | null;
  autoRotate: boolean;
  visibleAssetIds: string[];

  setCameraDistance: (d: number) => void;
  setZoomTier: (tier: ZoomTier) => void;
  setCameraTarget: (lat: number, lng: number) => void;
  clearCameraTarget: () => void;
  stopAutoRotate: () => void;
  setVisibleAssetIds: (ids: string[]) => void;
}

export const useGlobeStore = create<GlobeState>((set) => ({
  cameraDistance: CAMERA.INITIAL_DISTANCE,
  zoomTier: 'far',
  cameraTarget: null,
  autoRotate: true,
  visibleAssetIds: [],

  setCameraDistance: (d) => set({ cameraDistance: d }),
  setZoomTier: (tier) => set({ zoomTier: tier }),
  setCameraTarget: (lat, lng) => set({ cameraTarget: { lat, lng } }),
  clearCameraTarget: () => set({ cameraTarget: null }),
  stopAutoRotate: () => set({ autoRotate: false }),
  setVisibleAssetIds: (ids) => set({ visibleAssetIds: ids }),
}));

/**
 * Compute zoom tier from camera distance with hysteresis.
 * Call this from useFrame in ZoomLevelManager.
 */
export function computeZoomTier(
  distance: number,
  currentTier: ZoomTier,
): ZoomTier {
  const h = ZOOM.HYSTERESIS;

  if (currentTier === 'far') {
    if (distance < ZOOM.MID_MAX) return 'mid';
  } else if (currentTier === 'mid') {
    if (distance > ZOOM.MID_MAX + h) return 'far';
    if (distance < ZOOM.NEAR_MAX) return 'near';
  } else {
    // near
    if (distance > ZOOM.NEAR_MAX + h) return 'mid';
  }

  return currentTier;
}
