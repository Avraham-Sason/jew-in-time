export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
} as const;

export const elevation = {
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 2,
  },
  raised: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;

export const durations = {
  fast: 180,
  base: 250,
  slow: 400,
  stamp: 1300,
} as const;

export const ribbonThresholds = {
  safe: 0.5,
  warning: 0.25,
} as const;
