import { useAssetStore } from '../../stores/useAssetStore';

export default function LoadingScreen() {
  const loading = useAssetStore((s) => s.loading);
  const error = useAssetStore((s) => s.error);

  if (!loading && !error) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-ink-deep/95 text-ivory backdrop-blur">
      <div className="w-[min(22rem,calc(100vw-2rem))] text-center">
        <div className="mx-auto mb-6 h-1 w-44 overflow-hidden rounded-full bg-ivory/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gold" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          Design Earth
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          {error ? 'Atlas unavailable' : 'Calibrating atlas'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ivory-muted">
          {error ?? 'Loading global design records and spatial controls.'}
        </p>
      </div>
    </div>
  );
}
