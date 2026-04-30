import { HUDPanel } from '../ui/hud';

export default function Logo() {
  return (
    <HUDPanel className="pointer-events-auto flex items-center gap-3 px-4 py-3">
      <div className="grid size-10 place-items-center rounded-md border border-gold/40 bg-gold/10 text-sm font-black tracking-[0.08em] text-gold">
        DE
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ivory">
          Design Earth
        </p>
        <p className="mt-0.5 text-xs text-ivory-muted">Global design atlas</p>
      </div>
    </HUDPanel>
  );
}
