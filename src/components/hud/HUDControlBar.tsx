import { useFilterStore } from '../../stores/useFilterStore';
import { HUDButton, HUDPanel } from '../ui/hud';
import ViewModeSwitcher from './ViewModeSwitcher';
import YearRangeSlider from './YearRangeSlider';

export default function HUDControlBar() {
  const resetFilters = useFilterStore((s) => s.resetFilters);

  return (
    <HUDPanel className="pointer-events-auto mx-auto flex w-[min(calc(100vw-2rem),58rem)] flex-col gap-4 p-3 md:flex-row md:items-center">
      <ViewModeSwitcher />
      <YearRangeSlider />
      <HUDButton
        className="min-w-24 text-xs uppercase tracking-[0.14em]"
        onClick={resetFilters}
        type="button"
      >
        Reset
      </HUDButton>
    </HUDPanel>
  );
}
