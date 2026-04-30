import { useRef, useState, type PointerEvent } from 'react';
import { YEAR_RANGE } from '../../lib/constants';
import { useFilterStore } from '../../stores/useFilterStore';
import { HUDKicker } from '../ui/hud';

const MIN = YEAR_RANGE.MIN;
const MAX = YEAR_RANGE.MAX;
const DECADES = [1850, 1900, 1950, 2000, 2026];

function toPercent(value: number) {
  return ((value - MIN) / (MAX - MIN)) * 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function YearRangeSlider() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<'min' | 'max' | null>(null);
  const [activeHandle, setActiveHandle] = useState<'min' | 'max' | null>(null);
  const yearRange = useFilterStore((s) => s.yearRange);
  const setYearRange = useFilterStore((s) => s.setYearRange);
  const [minYear, maxYear] = yearRange;
  const left = toPercent(minYear);
  const right = 100 - toPercent(maxYear);

  const getPointerYear = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return null;

    const rect = track.getBoundingClientRect();
    const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
    return Math.round(MIN + percent * (MAX - MIN));
  };

  const setHandleYear = (handle: 'min' | 'max', year: number) => {
    const [currentMin, currentMax] = useFilterStore.getState().yearRange;

    if (handle === 'min') {
      setYearRange([Math.min(year, currentMax - 1), currentMax]);
    } else {
      setYearRange([currentMin, Math.max(year, currentMin + 1)]);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const year = getPointerYear(event.clientX);
    if (year === null) return;

    const [currentMin, currentMax] = useFilterStore.getState().yearRange;
    const handle =
      Math.abs(year - currentMin) <= Math.abs(year - currentMax)
        ? 'min'
        : 'max';

    dragHandleRef.current = handle;
    setActiveHandle(handle);
    setHandleYear(handle, year);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const handle = dragHandleRef.current;
    if (!handle) return;

    const year = getPointerYear(event.clientX);
    if (year === null) return;

    setHandleYear(handle, year);
  };

  const stopPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragHandleRef.current = null;
    setActiveHandle(null);
  };

  return (
    <div className="min-w-[16rem] flex-1">
      <div className="mb-2 flex items-end justify-between gap-4">
        <HUDKicker>Years</HUDKicker>
        <p className="text-xs tabular-nums text-ivory">
          {minYear} - {maxYear}
        </p>
      </div>
      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopPointerDrag}
        onPointerCancel={stopPointerDrag}
      >
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ivory/15" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gold"
          style={{ left: `${left}%`, right: `${right}%` }}
        />
        <input
          aria-label="Minimum year"
          className="de-range-input absolute inset-0 h-8 w-full appearance-none bg-transparent accent-gold"
          max={MAX}
          min={MIN}
          onChange={(event) => {
            const nextMin = Math.min(Number(event.target.value), maxYear - 1);
            setYearRange([nextMin, maxYear]);
          }}
          onFocus={() => setActiveHandle('min')}
          onBlur={() => setActiveHandle(null)}
          step={1}
          style={{ zIndex: activeHandle === 'min' ? 3 : 1 }}
          type="range"
          value={minYear}
        />
        <input
          aria-label="Maximum year"
          className="de-range-input absolute inset-0 h-8 w-full appearance-none bg-transparent accent-gold"
          max={MAX}
          min={MIN}
          onChange={(event) => {
            const nextMax = Math.max(Number(event.target.value), minYear + 1);
            setYearRange([minYear, nextMax]);
          }}
          onFocus={() => setActiveHandle('max')}
          onBlur={() => setActiveHandle(null)}
          step={1}
          style={{ zIndex: activeHandle === 'max' ? 3 : 2 }}
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
