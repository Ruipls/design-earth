import { useMemo } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useUIStore } from '../../stores/useUIStore';
import type { DesignAsset } from '../../types/DesignAsset';
import { formatAssetYear } from '../ui/assetFormat';
import { cn, HUDButton, HUDKicker, HUDPanel } from '../ui/hud';

function matchesSearch(asset: DesignAsset, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    asset.name,
    asset.nameLocal,
    asset.nameZh,
    asset.country,
    asset.city,
    asset.category,
    ...asset.tags,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
}

function filterAssets(
  assets: DesignAsset[],
  activeCategories: Set<DesignAsset['category']>,
  yearRange: [number, number],
  searchQuery: string,
) {
  return assets.filter((asset) => {
    const inCategory = activeCategories.has(asset.category);
    const inYear =
      !asset.year || (asset.year >= yearRange[0] && asset.year <= yearRange[1]);

    return inCategory && inYear && matchesSearch(asset, searchQuery);
  });
}

export default function RightSidebar() {
  const assets = useAssetStore((s) => s.assets);
  const activeCategories = useFilterStore((s) => s.activeCategories);
  const yearRange = useFilterStore((s) => s.yearRange);
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded);
  const selectedAssetId = useUIStore((s) => s.selectedAssetId);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const selectAsset = useUIStore((s) => s.selectAsset);

  const filteredAssets = useMemo(
    () => filterAssets(assets, activeCategories, yearRange, searchQuery),
    [activeCategories, assets, searchQuery, yearRange],
  );

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-30 flex max-h-[calc(100vh-11rem)] items-start gap-3 md:top-28">
      <HUDButton
        aria-expanded={sidebarExpanded}
        aria-label="Toggle asset index"
        className="pointer-events-auto h-12 w-12 px-0"
        onClick={toggleSidebar}
        type="button"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          {sidebarExpanded ? '>' : '<'}
        </span>
      </HUDButton>

      <HUDPanel
        className={cn(
          'pointer-events-auto flex h-[calc(100vh-11rem)] w-[min(calc(100vw-5.5rem),23rem)] flex-col overflow-hidden transition duration-300',
          sidebarExpanded
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-6 opacity-0',
        )}
      >
        <div className="border-b border-hud-border px-4 py-4">
          <HUDKicker>Visible records</HUDKicker>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tabular-nums">
              {filteredAssets.length}
            </h2>
            <p className="text-xs text-ivory-muted">
              of {assets.length} loaded
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filteredAssets.length === 0 ? (
            <div className="grid h-full place-items-center px-6 text-center text-sm leading-6 text-ivory-muted">
              No records match the active HUD filters.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => {
                const selected = asset.id === selectedAssetId;

                return (
                  <button
                    className={cn(
                      'w-full rounded-md border p-3 text-left transition',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
                      selected
                        ? 'border-gold/60 bg-gold/10'
                        : 'border-hud-border bg-ink/30 hover:border-gold/35 hover:bg-gold/10',
                    )}
                    key={asset.id}
                    onClick={() => selectAsset(asset.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ivory">
                          {asset.name}
                        </p>
                        <p className="mt-1 text-xs text-ivory-muted">
                          {asset.city}, {asset.country}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-gold">
                        {formatAssetYear(asset)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: CATEGORY_COLORS[asset.category],
                        }}
                      />
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ivory-muted">
                        {CATEGORY_LABELS[asset.category]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </HUDPanel>
    </div>
  );
}
