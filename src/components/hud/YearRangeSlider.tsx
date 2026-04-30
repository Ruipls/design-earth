import { YEAR_RANGE } from '../../lib/constants';
import { useFilterStore } from '../../stores/useFilterStore';
import { HUDKicker } from '../ui/hud';

const MIN = YEAR_RANGE.MIN;
const MAX = YEAR_RANGE.MAX;
const DECADES = [1850, 1900, 1950, 2000, 2026];

function toPercent(value: number) {
  return ((value - MIN) / (MAX - MIN)) * 100;
}

export default function YearRangeSlider() {
  const yearRange = useFilterStore((s) => s.yearRange);
  const setYearRange = useFilterStore((s) => s.setYearRange);
  const [minYear, maxYear] = yearRange;
  const left = toPercent(minYear);
  const right = 100 - toPercent(maxYear);

  return (
    <div className="min-w-[16rem] flex-1">
      <div className="mb-2 flex items-end justify-between gap-4">
        <HUDKicker>Years</HUDKicker>
        <p className="text-xs tabular-nums text-ivory">
          {minYear} - {maxYear}
        </p>
      </div>
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ivory/15" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gold"
          style={{ left: `${left}%`, right: `${right}%` }}
        />
        <input
          aria-label="Minimum year"
          className="absolute inset-0 h-8 w-full appearance-none bg-transparent accent-gold"
          max={MAX}
          min={MIN}
          onChange={(event) => {
            const nextMin = Math.min(Number(event.target.value), maxYear - 1);
            setYearRange([nextMin, maxYear]);
          }}
          step={1}
          type="range"
          value={minYear}
        />
        <input
          aria-label="Maximum year"
          className="absolute inset-0 h-8 w-full appearance-none bg-transparent accent-gold"
          max={MAX}
          min={MIN}
          onChange={(event) => {
            const nextMax = Math.max(Number(event.target.value), minYear + 1);
            setYearRange([minYear, nextMax]);
          }}
          step={1}
          type="range"
          value={maxYear}
        />
      </div>
      <div className="relative mt-1 h-4 text-[0.62rem] tabular-nums text-ivory-muted/80">
        {DECADES.map((year) => (
          <span
            className="absolute -translate-x-1/2"
            key={year}
            style={{ left: `${toPercent(year)}%` }}
          >
            {year}
          </span>
        ))}
      </div>
    </div>
  );
}
