import { useMemo, useState } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useUIStore } from '../../stores/useUIStore';
import type { DesignAsset } from '../../types/DesignAsset';
import {
  CATEGORY_MARKS,
  type GallerySortMode,
  filterAssets,
  formatAssetYear,
  sortAssets,
} from './panelData';
import { useViewportBand } from './useViewportBand';

const SORT_OPTIONS: { value: GallerySortMode; label: string }[] = [
  { value: 'year', label: 'Year' },
  { value: 'country', label: 'Country' },
  { value: 'name', label: 'Name' },
];

function GalleryCard({
  asset,
  onSelect,
}: {
  asset: DesignAsset;
  onSelect: (id: string) => void;
}) {
  const categoryColor = CATEGORY_COLORS[asset.category];

  return (
    <button
      type="button"
      className="de-gallery-card"
      onClick={() => onSelect(asset.id)}
      aria-label={`Open ${asset.name}`}
    >
      <span
        className="de-gallery-card__image"
        style={{ '--asset-category-color': categoryColor } as React.CSSProperties}
      >
        <img
          src={asset.imageUrl}
          alt={asset.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        <span className="de-category-mark" aria-label={CATEGORY_LABELS[asset.category]}>
          {CATEGORY_MARKS[asset.category]}
        </span>
      </span>

      <span className="de-gallery-card__body">
        <span className="de-gallery-card__title">{asset.name}</span>
        <span className="de-gallery-card__meta">
          <span>{asset.country}</span>
          <span>{formatAssetYear(asset)}</span>
        </span>
      </span>
    </button>
  );
}

export default function GalleryView() {
  const [sortMode, setSortMode] = useState<GallerySortMode>('year');
  const viewportBand = useViewportBand();
  const assets = useAssetStore((state) => state.assets);
  const activeCategories = useFilterStore((state) => state.activeCategories);
  const yearRange = useFilterStore((state) => state.yearRange);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const viewMode = useUIStore((state) => state.viewMode);
  const selectAsset = useUIStore((state) => state.selectAsset);

  const visibleAssets = useMemo(() => {
    return sortAssets(
      filterAssets(assets, activeCategories, yearRange, searchQuery),
      sortMode,
    );
  }, [activeCategories, assets, searchQuery, sortMode, yearRange]);

  const isOpen = viewMode === 'gallery';

  return (
    <section
      className={`de-view-panel de-gallery-panel${isOpen ? ' is-open' : ''}`}
      data-viewport={viewportBand}
      aria-hidden={!isOpen}
    >
      <div className="de-panel-shell">
        <header className="de-panel-header">
          <div>
            <p className="de-panel-kicker">Filtered archive</p>
            <h2>Gallery</h2>
          </div>

          <label className="de-sort-control">
            <span>Sort</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as GallerySortMode)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="de-panel-body">
          <div className="de-results-row">
            <span>{visibleAssets.length} assets</span>
            <span>
              {yearRange[0]}-{yearRange[1]}
            </span>
          </div>

          {visibleAssets.length > 0 ? (
            <div className="de-gallery-grid">
              {visibleAssets.map((asset) => (
                <GalleryCard key={asset.id} asset={asset} onSelect={selectAsset} />
              ))}
            </div>
          ) : (
            <div className="de-empty-state" role="status">
              <strong>No assets in this view</strong>
              <span>Adjust the active filters or year range to widen the archive.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
