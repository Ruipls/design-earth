import { useUIStore, type ViewMode } from '../../stores/useUIStore';
import { cn } from '../ui/hud';

const MODES: Array<{ label: string; value: ViewMode }> = [
  { label: 'Globe', value: 'globe' },
  { label: 'Gallery', value: 'gallery' },
  { label: 'Timeline', value: 'timeline' },
];

export default function ViewModeSwitcher() {
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);

  return (
    <div className="grid grid-cols-3 rounded-md border border-hud-border bg-ink/45 p-1">
      {MODES.map((mode) => (
        <button
          className={cn(
            'min-h-9 rounded-[0.35rem] px-3 text-xs font-semibold uppercase tracking-[0.14em] transition',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
            viewMode === mode.value
              ? 'bg-gold text-ink shadow-[0_0_24px_rgba(212,168,83,0.24)]'
              : 'text-ivory-muted hover:bg-gold/10 hover:text-ivory',
          )}
          key={mode.value}
          onClick={() => setViewMode(mode.value)}
          type="button"
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
