import type { DesignAsset } from '../../types/DesignAsset';

type YearParts = Pick<DesignAsset, 'year' | 'yearEnd' | 'yearCirca'>;

export function formatAssetYear(asset: YearParts) {
  if (!asset.year) return 'Unknown year';

  const prefix = asset.yearCirca ? 'c. ' : '';

  if (asset.yearEnd) {
    return `${prefix}${asset.year}-${asset.yearEnd}`;
  }

  return `${prefix}${asset.year}`;
}
