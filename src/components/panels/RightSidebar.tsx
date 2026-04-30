import { useMemo } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useGlobeStore } from '../../stores/useGlobeStore';
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
  const visibleAssetIds = useGlobeStore((s) => s.visibleAssetIds);
  const setCameraTarget = useGlobeStore((s) => s.setCameraTarget);
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded);
  const selectedAssetId = useUIStore((s) => s.selectedAssetId);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const selectAsset = useUIStore((s) => s.selectAsset);

  const filteredAssets = useMemo(
    () => filterAssets(assets, activeCategories, yearRange, searchQuery),
    [activeCategories, assets, searchQuery, yearRange],
  );

  const visibleAssets = useMemo(() => {
    const visible = new Set(visibleAssetIds);
    return filteredAssets.filter((asset) => visible.has(asset.id));
  }, [filteredAssets, visibleAssetIds]);

  const countryRank = useMemo(() => {
    const byCountry = new Map<
      string,
      { count: number; country: string; lat: number; lng: number }
    >();

    visibleAssets.forEach((asset) => {
      const key = asset.countryCode || asset.country;
      const current = byCountry.get(key) ?? {
        count: 0,
        country: asset.country,
        lat: 0,
        lng: 0,
      };

      current.count += 1;
      current.lat += asset.latitude;
      current.lng += asset.longitude;
      byCountry.set(key, current);
    });

    return Array.from(byCountry.entries())
      .map(([code, item]) => ({
        code,
        count: item.count,
        country: item.country,
        lat: item.lat / item.count,
        lng: item.lng / item.count,
      }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
      .slice(0, 5);
  }, [visibleAssets]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <HUDButton
        aria-expanded={sidebarExpanded}
        aria-label="Toggle asset index"
        className="pointer-events-auto fixed bottom-24 right-4 h-12 w-12 px-0 md:bottom-auto md:right-0 md:top-1/2 md:h-[120px] md:w-10 md:-translate-y-1/2 md:rounded-r-none"
        onClick={toggleSidebar}
        type="button"
      >
        <span aria-hidden="true" className="text-lg leading-none md:hidden">
          {sidebarExpanded ? 'v' : '^'}
        </span>
        <span aria-hidden="true" className="hidden text-lg leading-none md:block">
          {sidebarExpanded ? '>' : '<'}
        </span>
      </HUDButton>

      <HUDPanel
        className={cn(
          'pointer-events-auto fixed flex flex-col overflow-hidden transition duration-300',
          'inset-x-0 bottom-0 max-h-[72vh] rounded-b-none md:inset-x-auto md:bottom-auto md:right-0 md:top-24 md:h-[calc(100vh-10rem)] md:w-80 md:rounded-l-lg md:rounded-r-none',
          sidebarExpanded
            ? 'translate-y-0 opacity-100 md:translate-x-0'
            : 'pointer-events-none translate-y-full opacity-0 md:translate-x-full md:translate-y-0',
        )}
      >
        <div className="border-b border-hud-border px-4 py-4">
          <HUDKicker>Viewport records</HUDKicker>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tabular-nums">
              {visibleAssets.length}
            </h2>
            <p className="text-xs text-ivory-muted">
              {filteredAssets.length} filtered / {assets.length} loaded
            </p>
          </div>
        </div>

        <div className="border-b border-hud-border px-4 py-3">
          <HUDKicker>Countries</HUDKicker>
          <div className="mt-3 space-y-2">
            {countryRank.length === 0 ? (
              <p className="text-xs text-ivory-muted">No countries in view.</p>
            ) : (
              countryRank.map((country) => (
                <button
                  className="flex w-full items-center justify-between rounded-md border border-hud-border bg-ink/25 px-3 py-2 text-left text-sm transition hover:border-gold/45 hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  key={country.code}
                  onClick={() => setCameraTarget(country.lat, country.lng)}
                  type="button"
                >
                  <span className="font-semibold text-ivory">{country.code}</span>
                  <span className="min-w-0 flex-1 truncate px-3 text-ivory-muted">
                    {country.country}
                  </span>
                  <span className="tabular-nums text-gold">{country.count}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {visibleAssets.length === 0 ? (
            <div className="grid h-full place-items-center px-6 text-center text-sm leading-6 text-ivory-muted">
              No records match the active HUD filters.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleAssets.map((asset) => {
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
                    onClick={() => {
                      selectAsset(asset.id);
                    }}
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
