import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CAMERA, COLORS, GLOBE, LIMITS } from '../../lib/constants';
import { isPointFacingCamera } from '../../lib/geo';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useGlobeStore } from '../../stores/useGlobeStore';
import {
  assetMatchesFilters,
  createPositionedAssets,
} from './assetUtils';

type CountryLabel = {
  countryCode: string;
  count: number;
  position: THREE.Vector3;
};

export default function CountryLabels() {
  const { camera } = useThree();
  const assets = useAssetStore((state) => state.assets);
  const activeCategories = useFilterStore((state) => state.activeCategories);
  const yearRange = useFilterStore((state) => state.yearRange);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const groupRefs = useRef<Array<THREE.Group | null>>([]);

  const labels = useMemo<CountryLabel[]>(() => {
    const filters = { activeCategories, yearRange, searchQuery };
    const countries = new Map<
      string,
      { count: number; position: THREE.Vector3; countryCode: string }
    >();

    for (const item of createPositionedAssets(assets)) {
      if (!assetMatchesFilters(item.asset, filters)) continue;

      const current = countries.get(item.asset.countryCode) ?? {
        count: 0,
        position: new THREE.Vector3(),
        countryCode: item.asset.countryCode,
      };

      current.count += 1;
      current.position.add(item.normal);
      countries.set(item.asset.countryCode, current);
    }

    return [...countries.values()]
      .filter((country) => country.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, LIMITS.MAX_COUNTRY_LABELS)
      .map((country) => ({
        countryCode: country.countryCode,
        count: country.count,
        position: country.position.normalize().multiplyScalar(GLOBE.ATMOSPHERE_RADIUS),
      }));
  }, [activeCategories, assets, searchQuery, yearRange]);

  useFrame(() => {
    const isFarTier = useGlobeStore.getState().zoomTier === 'far';

    for (const [index, label] of labels.entries()) {
      const group = groupRefs.current[index];
      if (!group) continue;

      group.visible =
        isFarTier && isPointFacingCamera(label.position, camera.position);
    }
  });

  return (
    <group>
      {labels.map((label, index) => (
        <group
          key={label.countryCode}
          ref={(node) => {
            groupRefs.current[index] = node;
          }}
          position={label.position}
          visible={false}
        >
          <Html
            center
            occlude
            transform
            sprite
            distanceFactor={CAMERA.INITIAL_DISTANCE}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                background: COLORS.hud,
                border: `1px solid ${COLORS.hudBorder}`,
                color: COLORS.ivory,
              }}
              className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] shadow-lg"
            >
              {label.countryCode} {label.count}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
