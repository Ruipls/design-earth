import type { Category } from '../types/DesignAsset';

// --- Zoom thresholds ---
export const ZOOM = {
  FAR_MIN: 2.2,
  FAR_MAX: 3.5,
  MID_MIN: 1.4,
  MID_MAX: 2.2,
  NEAR_MIN: 1.05,
  NEAR_MAX: 1.4,
  /** Hysteresis buffer to prevent tier flickering */
  HYSTERESIS: 0.1,
  /** Debounce ms for tier change events */
  TIER_DEBOUNCE_MS: 300,
} as const;

export const CAMERA = {
  INITIAL_DISTANCE: 3.0,
  FOV: 45,
  MIN_DISTANCE: ZOOM.NEAR_MIN,
  MAX_DISTANCE: ZOOM.FAR_MAX,
  FLY_TO_DURATION_MS: 600,
  AUTO_ROTATE_SPEED: 0.1,
  DAMPING_FACTOR: 0.05,
  ROTATE_SPEED: 0.5,
} as const;

// --- Color palette ---
export const COLORS = {
  ink: '#0a0f0d',
  inkDeep: '#050808',
  gold: '#d4a853',
  terracotta: '#c4704b',
  ivory: '#f5f0e8',
  ivoryMuted: '#b8b0a4',
  hud: 'rgba(10, 15, 13, 0.75)',
  hudBorder: 'rgba(212, 168, 83, 0.2)',
  atmosphere: '#1a3a2a',
} as const;

export const CATEGORY_COLORS: Record<Category, string> = {
  architecture: '#c4704b',
  graphic: '#d4a853',
  industrial: '#7a9bb5',
  interior: '#e8dcc8',
  fashion: '#c47a8a',
} as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  architecture: 'Architecture',
  graphic: 'Graphic',
  industrial: 'Industrial',
  interior: 'Interior',
  fashion: 'Fashion',
} as const;

// --- Animation durations ---
export const ANIMATION = {
  TIER_TRANSITION_MS: 400,
  TIER_CROSSFADE_MS: 200,
  VIEW_SWITCH_MS: 500,
  DETAIL_PANEL_MS: 300,
  LOADING_FADE_MS: 500,
} as const;

// --- Performance limits ---
export const LIMITS = {
  MAX_FAR_DOTS: 500,
  MAX_MID_THUMBNAILS: 80,
  MAX_NEAR_CARDS: 30,
  MAX_COUNTRY_LABELS: 20,
  /** Screen-space px for thumbnail clustering */
  CLUSTER_RADIUS_PX: 30,
  /** Sidebar update debounce ms */
  SIDEBAR_DEBOUNCE_MS: 500,
} as const;

// --- Year range ---
export const YEAR_RANGE = {
  MIN: 1850,
  MAX: 2026,
} as const;

// --- Globe geometry ---
export const GLOBE = {
  RADIUS: 1.0,
  SEGMENTS: 64,
  ATMOSPHERE_RADIUS: 1.02,
  /** Landmass outline color (faint gold) */
  LAND_OUTLINE_COLOR: 'rgba(212, 168, 83, 0.15)',
  LAND_OUTLINE_COLOR_HEX: '#d4a853',
  LAND_OUTLINE_OPACITY: 0.15,
} as const;

// --- Breakpoints ---
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;
