import { HUDPanel } from '../ui/hud';

export default function Logo() {
  return (
    <HUDPanel className="pointer-events-auto px-4 py-3">
      <p className="text-sm font-semibold uppercase tracking-widest text-ivory">
        DESIGN EARTH
      </p>
      <p className="mt-0.5 text-xs text-ivory-muted">Global design atlas</p>
    </HUDPanel>
  );
}
