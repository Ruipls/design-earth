import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import { CATEGORY_COLORS, GLOBE, LIMITS } from '../../lib/constants';
import { isPointFacingCamera, latLngToVector3 } from '../../lib/geo';
import { useGlobeStore } from '../../stores/useGlobeStore';
import type { Category, DesignAsset } from '../../types/DesignAsset';

type FilterSnapshot = {
  activeCategories: Set<Category>;
  yearRange: [number, number];
  searchQuery: string;
};

export type PositionedAsset = {
  asset: DesignAsset;
  position: THREE.Vector3;
  normal: THREE.Vector3;
};

export type ClusterCandidate = PositionedAsset & {
  index: number;
};

export function createPositionedAssets(
  assets: DesignAsset[],
  altitude: number = GLOBE.ATMOSPHERE_RADIUS - GLOBE.RADIUS,
): PositionedAsset[] {
  return assets.map((asset) => {
    const position = latLngToVector3(asset.latitude, asset.longitude, altitude);
    return {
      asset,
      position,
      normal: position.clone().normalize(),
    };
  });
}

export function assetMatchesFilters(
  asset: DesignAsset,
  filters: FilterSnapshot,
): boolean {
  if (!filters.activeCategories.has(asset.category)) return false;

  const assetYear = asset.year;
  if (
    assetYear !== null &&
    (assetYear < filters.yearRange[0] || assetYear > filters.yearRange[1])
  ) {
    return false;
  }

  const query = filters.searchQuery.trim().toLowerCase();
  if (!query) return true;

  return [
    asset.name,
    asset.nameLocal,
    asset.nameZh,
    asset.country,
    asset.city,
    asset.category,
    ...asset.tags,
  ]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export function isPositionedAssetVisible(
  item: PositionedAsset,
  camera: THREE.Camera,
  filters: FilterSnapshot,
): boolean {
  return (
    assetMatchesFilters(item.asset, filters) &&
    isPointFacingCamera(item.position, camera.position)
  );
}

export function authorityRank(asset: DesignAsset): number {
  if (asset.authority === 'unesco') return 3;
  if (asset.authority === 'museum') return 2;
  return 1;
}

export function stablePhase(id: string): number {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  }
  return (hash / 9973) * Math.PI * 2;
}

export function selectClusteredCandidates(
  candidates: ClusterCandidate[],
  camera: THREE.Camera,
  size: { width: number; height: number },
): Set<number> {
  const selected = new Set<number>();
  const occupied: THREE.Vector2[] = [];
  const sorted = [...candidates].sort((a, b) => {
    const authorityDelta = authorityRank(b.asset) - authorityRank(a.asset);
    if (authorityDelta !== 0) return authorityDelta;
    return (b.asset.year ?? 0) - (a.asset.year ?? 0);
  });

  for (const item of sorted) {
    const projected = item.position.clone().project(camera);
    if (projected.z < -1 || projected.z > 1) continue;

    const screenPoint = new THREE.Vector2(
      ((projected.x + 1) / 2) * size.width,
      ((-projected.y + 1) / 2) * size.height,
    );

    const overlaps = occupied.some(
      (point) => point.distanceTo(screenPoint) < LIMITS.CLUSTER_RADIUS_PX,
    );

    if (!overlaps) {
      selected.add(item.index);
      occupied.push(screenPoint);
    }
  }

  return selected;
}

export function categoryColor(category: Category): string {
  return CATEGORY_COLORS[category];
}

export function commitVisibleAssetIds(
  ids: string[],
  previousSignature: MutableRefObject<string>,
): void {
  const signature = ids.join('|');
  const currentSignature = useGlobeStore.getState().visibleAssetIds.join('|');

  if (
    signature !== previousSignature.current ||
    signature !== currentSignature
  ) {
    previousSignature.current = signature;
    useGlobeStore.getState().setVisibleAssetIds(ids);
  }
}
