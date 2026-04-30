import type { Category } from '../../types/DesignAsset';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants';
import { useFilterStore } from '../../stores/useFilterStore';
import { cn, HUDPanel } from '../ui/hud';

const CATEGORIES: Category[] = [
  'architecture',
  'graphic',
  'industrial',
  'interior',
  'fashion',
];

export default function CategoryFilter() {
  const activeCategories = useFilterStore((s) => s.activeCategories);
  const toggleCategory = useFilterStore((s) => s.toggleCategory);

  return (
    <HUDPanel className="pointer-events-auto flex max-w-[calc(100vw-2rem)] gap-2 overflow-x-auto px-2 py-2">
      {CATEGORIES.map((category) => {
        const active = activeCategories.has(category);
        const color = CATEGORY_COLORS[category];

        return (
          <button
            className={cn(
              'inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
              active
                ? 'bg-ink/50 text-ivory shadow-[0_0_20px_rgba(212,168,83,0.12)]'
                : 'border-hud-border bg-ink/25 text-ivory-muted hover:text-ivory',
            )}
            key={category}
            onClick={() => toggleCategory(category)}
            style={{
              borderColor: active ? color : undefined,
              boxShadow: active ? `0 0 22px ${color}26` : undefined,
            }}
            type="button"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </HUDPanel>
  );
}
