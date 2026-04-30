import type { Category, DesignAsset } from '../../types/DesignAsset';
import { CATEGORY_LABELS } from '../../lib/constants';

export type GallerySortMode = 'year' | 'country' | 'name';

export const CATEGORY_ORDER: Category[] = [
  'architecture',
  'graphic',
  'industrial',
  'interior',
  'fashion',
];

export const CATEGORY_MARKS: Record<Category, string> = {
  architecture: 'AR',
  graphic: 'GR',
  industrial: 'ID',
  interior: 'IN',
  fashion: 'FA',
};

export function formatAssetYear(asset: DesignAsset): string {
  if (asset.year === null) return 'Year unknown';
  return asset.yearCirca ? `c. ${asset.year}` : `${asset.year}`;
}

export function getAssetYear(asset: DesignAsset): number | null {
  return asset.year ?? asset.yearEnd ?? null;
}

export function filterAssets(
  assets: DesignAsset[],
  activeCategories: ReadonlySet<Category>,
  yearRange: [number, number],
  searchQuery: string,
): DesignAsset[] {
  const query = searchQuery.trim().toLowerCase();

  return assets.filter((asset) => {
    const year = getAssetYear(asset);
    if (year === null || year < yearRange[0] || year > yearRange[1]) {
      return false;
    }

    if (!activeCategories.has(asset.category)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchable = [
      asset.name,
      asset.nameLocal,
      asset.nameZh,
      asset.country,
      asset.countryCode,
      asset.city,
      CATEGORY_LABELS[asset.category],
      ...asset.tags,
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(query);
  });
}

export function sortAssets(
  assets: DesignAsset[],
  sortMode: GallerySortMode,
): DesignAsset[] {
  const sorted = [...assets];

  sorted.sort((a, b) => {
    if (sortMode === 'country') {
      return (
        a.country.localeCompare(b.country) ||
        (getAssetYear(a) ?? 0) - (getAssetYear(b) ?? 0) ||
        a.name.localeCompare(b.name)
      );
    }

    if (sortMode === 'name') {
      return a.name.localeCompare(b.name);
    }

    return (
      (getAssetYear(b) ?? 0) - (getAssetYear(a) ?? 0) ||
      a.name.localeCompare(b.name)
    );
  });

  return sorted;
}
