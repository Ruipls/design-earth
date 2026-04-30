import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, GLOBE, LIMITS } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useGlobeStore } from '../../stores/useGlobeStore';
import {
  categoryColor,
  commitVisibleAssetIds,
  createPositionedAssets,
  isPositionedAssetVisible,
  selectClusteredCandidates,
  type ClusterCandidate,
} from './assetUtils';
import { useRemoteTextureMap } from './useRemoteTextureMap';

const CAMERA_ASPECT_WIDTH = 4;
const CAMERA_ASPECT_HEIGHT = 3;
const thumbnailWidth = GLOBE.RADIUS * (LIMITS.CLUSTER_RADIUS_PX / 150);
const thumbnailHeight = thumbnailWidth * (CAMERA_ASPECT_HEIGHT / CAMERA_ASPECT_WIDTH);
const borderScale = GLOBE.ATMOSPHERE_RADIUS;

export default function MidTierThumbnails() {
  const { camera, size } = useThree();
  const assets = useAssetStore((state) => state.assets);
  const groupRefs = useRef<Array<THREE.Group | null>>([]);
  const previousVisibleIdsRef = useRef('');

  const thumbnailAssets = useMemo(
    () => assets.slice(0, LIMITS.MAX_MID_THUMBNAILS),
    [assets],
  );
  const thumbnailData = useMemo(
    () => createPositionedAssets(thumbnailAssets),
    [thumbnailAssets],
  );
  const textures = useRemoteTextureMap(thumbnailAssets);

  useFrame(() => {
    const isMidTier = useGlobeStore.getState().zoomTier === 'mid';
    const filters = useFilterStore.getState();
    const candidates: ClusterCandidate[] = [];

    for (const [index, item] of thumbnailData.entries()) {
      const group = groupRefs.current[index];
      if (!group) continue;

      group.visible = false;
      if (!isMidTier) continue;

      group.quaternion.copy(camera.quaternion);
      if (isPositionedAssetVisible(item, camera, filters)) {
        candidates.push({ ...item, index });
      }
    }

    if (!isMidTier) return;

    const selected = selectClusteredCandidates(candidates, camera, size);
    const visibleIds: string[] = [];

    for (const index of selected) {
      const group = groupRefs.current[index];
      if (!group) continue;

      group.visible = true;
      visibleIds.push(thumbnailData[index].asset.id);
    }

    commitVisibleAssetIds(visibleIds, previousVisibleIdsRef);
  });

  return (
    <group>
      {thumbnailData.map((item, index) => {
        const texture = textures[item.asset.id];
        return (
          <group
            key={item.asset.id}
            ref={(node) => {
              groupRefs.current[index] = node;
            }}
            position={item.position}
            visible={false}
          >
            <mesh position={[0, 0, -(GLOBE.ATMOSPHERE_RADIUS - GLOBE.RADIUS) / 10]}>
              <planeGeometry
                args={[thumbnailWidth * borderScale, thumbnailHeight * borderScale]}
              />
              <meshBasicMaterial
                color={categoryColor(item.asset.category)}
                side={THREE.DoubleSide}
                transparent
                opacity={GLOBE.LAND_OUTLINE_OPACITY}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <planeGeometry args={[thumbnailWidth, thumbnailHeight]} />
              <meshBasicMaterial
                color={texture ? COLORS.ivory : categoryColor(item.asset.category)}
                map={texture ?? null}
                side={THREE.DoubleSide}
                transparent
                opacity={1}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
