import { useRef, useState } from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import { cn, HUDButton, HUDPanel } from '../ui/hud';

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m20 20-4.4-4.4m2.1-5.1a7.2 7.2 0 1 1-14.4 0 7.2 7.2 0 0 1 14.4 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function SearchBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);

  const input = (
    <label className="flex min-h-11 items-center gap-3 px-3 text-ivory-muted">
      <SearchIcon />
      <span className="sr-only">Search design assets</span>
      <input
        ref={inputRef}
        className="w-full bg-transparent text-sm text-ivory placeholder:text-ivory-muted/70 focus:outline-none"
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search place, object, country..."
        type="search"
        value={searchQuery}
      />
    </label>
  );

  return (
    <div className="pointer-events-auto relative">
      <HUDPanel className="hidden w-[280px] md:block">{input}</HUDPanel>

      <HUDButton
        aria-expanded={mobileOpen}
        aria-label="Toggle search"
        className="size-11 px-0 md:hidden"
        onClick={() => {
          const nextOpen = !mobileOpen;
          setMobileOpen(nextOpen);
          if (nextOpen) {
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        type="button"
      >
        <SearchIcon />
      </HUDButton>

      <HUDPanel
        className={cn(
          'fixed left-4 right-4 top-20 origin-top-left md:hidden',
          'transition duration-200',
          mobileOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-2 scale-95 opacity-0',
        )}
      >
        {input}
      </HUDPanel>
    </div>
  );
}
