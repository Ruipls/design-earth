import { useEffect, useMemo } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useGlobeStore } from '../../stores/useGlobeStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatAssetYear } from '../ui/assetFormat';
import { cn, HUDButton, HUDKicker, HUDPanel } from '../ui/hud';

export default function AssetDetailPanel() {
  const assets = useAssetStore((s) => s.assets);
  const selectedAssetId = useUIStore((s) => s.selectedAssetId);
  const detailPanelOpen = useUIStore((s) => s.detailPanelOpen);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const setCameraTarget = useGlobeStore((s) => s.setCameraTarget);
  const stopAutoRotate = useGlobeStore((s) => s.stopAutoRotate);

  const asset = useMemo(
    () => assets.find((item) => item.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  useEffect(() => {
    if (!detailPanelOpen || !asset) return;

    setCameraTarget(asset.latitude, asset.longitude);
    stopAutoRotate();
  }, [asset, detailPanelOpen, setCameraTarget, stopAutoRotate]);

  const open = detailPanelOpen && asset;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center md:inset-y-0 md:left-auto md:right-0 md:items-stretch md:justify-end">
      <HUDPanel
        className={cn(
          'pointer-events-auto flex max-h-[82vh] w-full max-w-[34rem] flex-col overflow-hidden rounded-b-none transition duration-300 md:h-full md:max-h-none md:rounded-l-lg md:rounded-r-none',
          open
            ? 'translate-y-0 opacity-100 md:translate-x-0'
            : 'pointer-events-none translate-y-full opacity-0 md:translate-x-full md:translate-y-0',
        )}
      >
        {asset ? (
          <>
            <div className="relative h-44 overflow-hidden bg-ink md:h-56">
              <img
                alt=""
                className="h-full w-full object-cover opacity-80"
                src={asset.imageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
              <HUDButton
                aria-label="Close detail panel"
                className="absolute right-3 top-3 size-10 px-0"
                onClick={closeDetail}
                type="button"
              >
                x
              </HUDButton>
              <div className="absolute bottom-4 left-4 right-16">
                <HUDKicker>{CATEGORY_LABELS[asset.category]}</HUDKicker>
                <h2 className="mt-2 text-2xl font-semibold leading-tight text-ivory">
                  {asset.name}
                </h2>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-hud-border bg-ink/30 p-3">
                  <HUDKicker>Location</HUDKicker>
                  <p className="mt-2 text-sm text-ivory">
                    {asset.city}, {asset.country}
                  </p>
                </div>
                <div className="rounded-md border border-hud-border bg-ink/30 p-3">
                  <HUDKicker>Year</HUDKicker>
                  <p className="mt-2 text-sm tabular-nums text-ivory">
                    {formatAssetYear(asset)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-ivory-muted">
                {asset.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ivory"
                  style={{
                    borderColor: CATEGORY_COLORS[asset.category],
                    backgroundColor: `${CATEGORY_COLORS[asset.category]}22`,
                  }}
                >
                  {CATEGORY_LABELS[asset.category]}
                </span>
                <span className="rounded-full border border-hud-border bg-ink/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ivory-muted">
                  {asset.authority}
                </span>
                <span className="rounded-full border border-hud-border bg-ink/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ivory-muted">
                  {asset.visitType}
                </span>
                {asset.isEndangered ? (
                  <span className="rounded-full border border-terracotta/60 bg-terracotta/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ivory">
                    Endangered
                  </span>
                ) : null}
              </div>

              {asset.isDisputed && asset.disputedNote ? (
                <div className="mt-5 rounded-md border border-terracotta/50 bg-terracotta/10 p-3 text-sm leading-6 text-ivory-muted">
                  {asset.disputedNote}
                </div>
              ) : null}

              {asset.isEndangered && asset.extinctionNote ? (
                <div className="mt-5 rounded-md border border-terracotta/50 bg-terracotta/10 p-3 text-sm leading-6 text-ivory-muted">
                  {asset.extinctionNote}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <span
                    className="rounded border border-hud-border bg-ink/25 px-2 py-1 text-xs text-ivory-muted"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                className="mt-6 inline-flex min-h-10 items-center rounded-md border border-gold/45 bg-gold/10 px-4 text-sm font-semibold text-gold transition hover:bg-gold/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                href={asset.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open source
              </a>
            </div>
          </>
        ) : null}
      </HUDPanel>
    </div>
  );
}
