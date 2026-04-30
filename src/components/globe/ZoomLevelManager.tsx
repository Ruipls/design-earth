import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { ZOOM } from '../../lib/constants';
import { computeZoomTier, useGlobeStore, type ZoomTier } from '../../stores/useGlobeStore';

export default function ZoomLevelManager() {
  const { camera } = useThree();
  const pendingTierRef = useRef<ZoomTier | null>(null);
  const pendingSinceRef = useRef<number>(0);
  const lastDistanceRef = useRef<number>(useGlobeStore.getState().cameraDistance);

  useFrame(({ clock }) => {
    const globeState = useGlobeStore.getState();
    const distance = camera.position.length();

    if (Math.abs(distance - lastDistanceRef.current) > ZOOM.HYSTERESIS / 10) {
      lastDistanceRef.current = distance;
      globeState.setCameraDistance(distance);
    }

    const nextTier = computeZoomTier(distance, globeState.zoomTier);
    if (nextTier === globeState.zoomTier) {
      pendingTierRef.current = null;
      return;
    }

    const now = clock.elapsedTime * 1000;
    if (pendingTierRef.current !== nextTier) {
      pendingTierRef.current = nextTier;
      pendingSinceRef.current = now;
      return;
    }

    if (now - pendingSinceRef.current >= ZOOM.TIER_DEBOUNCE_MS) {
      globeState.setZoomTier(nextTier);
      pendingTierRef.current = null;
    }
  });

  return null;
}
