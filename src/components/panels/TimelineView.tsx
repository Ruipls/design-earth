import { useMemo, useRef, useState } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS, YEAR_RANGE } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useUIStore } from '../../stores/useUIStore';
import type { Category, DesignAsset } from '../../types/DesignAsset';
import {
  CATEGORY_ORDER,
  filterAssets,
  formatAssetYear,
  getAssetYear,
} from './panelData';
import { useViewportBand } from './useViewportBand';

const BASE_TIMELINE_WIDTH = 1760;
const LANE_HEIGHT = 60;
const TIMELINE_HEADER_HEIGHT = 56;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3.5;
const ZOOM_STEP = 0.18;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function yearToX(year: number, width: number): number {
  const progress = (year - YEAR_RANGE.MIN) / (YEAR_RANGE.MAX - YEAR_RANGE.MIN);
  return progress * width;
}

function decadeTicks(): number[] {
  const ticks: number[] = [];
  for (let year = YEAR_RANGE.MIN; year <= YEAR_RANGE.MAX; year += 10) {
    ticks.push(year);
  }
  if (ticks[ticks.length - 1] !== YEAR_RANGE.MAX) {
    ticks.push(YEAR_RANGE.MAX);
  }
  return ticks;
}

function groupAssetsByLane(assets: DesignAsset[]): Record<Category, DesignAsset[]> {
  const lanes = CATEGORY_ORDER.reduce(
    (acc, category) => ({ ...acc, [category]: [] }),
    {} as Record<Category, DesignAsset[]>,
  );

  for (const asset of assets) {
    lanes[asset.category].push(asset);
  }

  for (const laneAssets of Object.values(lanes)) {
    laneAssets.sort((a, b) => (getAssetYear(a) ?? 0) - (getAssetYear(b) ?? 0));
  }

  return lanes;
}

export default function TimelineView() {
  const [zoom, setZoom] = useState(1.25);
  const [isDragging, setIsDragging] = useState(false);
  const viewportBand = useViewportBand();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const assets = useAssetStore((state) => state.assets);
  const activeCategories = useFilterStore((state) => state.activeCategories);
  const yearRange = useFilterStore((state) => state.yearRange);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const viewMode = useUIStore((state) => state.viewMode);
  const selectAsset = useUIStore((state) => state.selectAsset);

  const visibleAssets = useMemo(() => {
    return filterAssets(assets, activeCategories, yearRange, searchQuery);
  }, [activeCategories, assets, searchQuery, yearRange]);

  const lanes = useMemo(() => groupAssetsByLane(visibleAssets), [visibleAssets]);
  const ticks = useMemo(() => decadeTicks(), []);
  const timelineWidth = Math.round(BASE_TIMELINE_WIDTH * zoom);
  const timelineHeight = TIMELINE_HEADER_HEIGHT + CATEGORY_ORDER.length * LANE_HEIGHT;
  const isOpen = viewMode === 'timeline';

  const setZoomFromWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const container = scrollRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const progressAtPointer = (container.scrollLeft + pointerX) / timelineWidth;
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = clamp(zoom + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
    const nextWidth = Math.round(BASE_TIMELINE_WIDTH * nextZoom);

    setZoom(nextZoom);

    window.requestAnimationFrame(() => {
      container.scrollLeft = progressAtPointer * nextWidth - pointerX;
    });
  };

  const adjustZoom = (direction: -1 | 1) => {
    setZoom((current) => clamp(current + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) {
      drag.moved = true;
      suppressClickRef.current = true;
    }

    event.currentTarget.scrollLeft = drag.scrollLeft - deltaX;
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const handleAssetClick = (assetId: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    selectAsset(assetId);
  };

  return (
    <section
      className={`de-view-panel de-timeline-panel${isOpen ? ' is-open' : ''}`}
      data-viewport={viewportBand}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className="de-panel-shell">
        <header className="de-panel-header">
          <div>
            <p className="de-panel-kicker">Chronological lanes</p>
            <h2>Timeline</h2>
          </div>

          <div className="de-timeline-tools" aria-label="Timeline zoom controls">
            <button type="button" onClick={() => adjustZoom(-1)} aria-label="Zoom out">
              -
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => adjustZoom(1)} aria-label="Zoom in">
              +
            </button>
          </div>
        </header>

        <div className="de-panel-body">
          <div className="de-results-row">
            <span>{visibleAssets.length} dated assets</span>
            <span>
              {yearRange[0]}-{yearRange[1]}
            </span>
          </div>

          <div
            ref={scrollRef}
            className={`de-timeline-scroll${isDragging ? ' is-dragging' : ''}`}
            onWheel={setZoomFromWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            <div
              className="de-timeline-canvas"
              style={{
                width: timelineWidth,
                height: timelineHeight,
              }}
            >
              <div className="de-timeline-axis" style={{ width: timelineWidth }}>
                {ticks.map((year) => (
                  <span
                    key={year}
                    className="de-timeline-tick"
                    style={{ left: yearToX(year, timelineWidth) }}
                  >
                    <span>{year}</span>
                  </span>
                ))}
              </div>

              {CATEGORY_ORDER.map((category, laneIndex) => (
                <div
                  key={category}
                  className="de-timeline-lane"
                  style={{
                    top: TIMELINE_HEADER_HEIGHT + laneIndex * LANE_HEIGHT,
                    height: LANE_HEIGHT,
                  }}
                >
                  <div className="de-timeline-lane__label">
                    {CATEGORY_LABELS[category]}
                  </div>

                  {lanes[category].map((asset, assetIndex) => {
                    const year = getAssetYear(asset);
                    if (year === null) return null;

                    const stackOffset = ((assetIndex % 3) - 1) * 12;
                    const tooltip = `${asset.name} | ${asset.country} | ${formatAssetYear(asset)}`;

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        className="de-timeline-dot"
                        data-tooltip={tooltip}
                        aria-label={tooltip}
                        onClick={() => handleAssetClick(asset.id)}
                        style={{
                          left: yearToX(year, timelineWidth),
                          top: LANE_HEIGHT / 2 + stackOffset,
                          '--asset-category-color': CATEGORY_COLORS[asset.category],
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {visibleAssets.length === 0 ? (
            <div className="de-empty-state" role="status">
              <strong>No timeline points</strong>
              <span>Adjust filters or expand the year range to reveal assets.</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
