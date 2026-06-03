// IGNYX Typography System — Module 16
// Every character matters. Every line height is deliberate.
// Space Mono is the voice of the system. It speaks in precision.

// ─── Font Family ──────────────────────────────────────────────

export const FONT = 'SpaceMono-Regular';

// ─── Font Size Scale ──────────────────────────────────────────
// Named sizes for consistent usage across all screens.
// Base size: 11px. Scale follows a modular rhythm.

export const FONT_SIZE = {
  // Micro — timestamps, IDs, tags
  micro: 7,
  // Tiny — secondary metadata, stack traces
  tiny: 8,
  // Small — labels, settings values, counts
  small: 9,
  // Caption — section descriptions, detail text
  caption: 10,
  // Body — primary reading text, info values
  body: 11,
  // Subtitle — tool labels, mission IDs
  subtitle: 12,
  // Title — screen titles, module names
  title: 14,
  // Headline — prominent text, timer
  headline: 18,
  // Display — hero text, "SYSTEM COLLAPSE"
  display: 24,
  // Mega — rank badge, boot title
  mega: 32,
  // Giga — maximum emphasis
  giga: 40,
} as const;

// ─── Letter Spacing ────────────────────────────────────────────
// IGNYX uses generous letter spacing. The system breathes.

export const LETTER_SPACING = {
  // Compact — long words, body text
  compact: 0.3,
  // Normal — most text
  normal: 1,
  // Medium — labels, values
  medium: 2,
  // Wide — section titles, tags
  wide: 3,
  // Extra — screen titles, status
  extra: 4,
  // Ultra — hero text, badges
  ultra: 6,
  // Mega — maximum emphasis
  mega: 8,
} as const;

// ─── Line Heights ──────────────────────────────────────────────
// Line height = font size × multiplier. IGNYX is airy.

export const LINE_HEIGHT = {
  // Tight — single-line elements, badges
  tight: 12,
  // Compact — short labels
  compact: 14,
  // Normal — body text
  normal: 16,
  // Relaxed — paragraph text
  relaxed: 18,
  // Spacious — narrative text
  spacious: 22,
} as const;

// ─── Font Size by Accessibility ────────────────────────────────
// Scales font sizes based on the user's accessibility preference.

export type FontSizeSetting = 'small' | 'medium' | 'large';

const SIZE_MULTIPLIERS: Record<FontSizeSetting, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

/**
 * Get the scaled font size based on accessibility setting.
 * Prevents sizes from going below 7px (minimum readability).
 */
export const getScaledSize = (baseSize: number, setting: FontSizeSetting): number => {
  const scaled = Math.round(baseSize * SIZE_MULTIPLIERS[setting]);
  return Math.max(7, scaled);
};

/**
 * Get the scaled line height based on accessibility setting.
 */
export const getScaledLineHeight = (baseLineHeight: number, setting: FontSizeSetting): number => {
  const scaled = Math.round(baseLineHeight * SIZE_MULTIPLIERS[setting]);
  return Math.max(10, scaled);
};

// ─── Common Text Style Presets ────────────────────────────────
// Pre-composed styles for common text patterns.

export const TEXT_PRESETS = {
  /** Section label — "MODULES", "SYSTEM TOOLS" */
  sectionLabel: {
    fontSize: FONT_SIZE.small,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.wide,
    color: undefined, // Set per-use
  },
  /** Info label — "INTEGRITY", "LEVEL" */
  infoLabel: {
    fontSize: FONT_SIZE.small,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.medium,
    color: undefined,
  },
  /** Info value — "87%", "LEVEL 5" */
  infoValue: {
    fontSize: FONT_SIZE.body,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.normal,
    color: undefined,
  },
  /** Tool label — "TERMINAL", "FILES" */
  toolLabel: {
    fontSize: FONT_SIZE.caption,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.wide,
    color: undefined,
  },
  /** Card title — module name, achievement name */
  cardTitle: {
    fontSize: FONT_SIZE.caption,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.normal,
    color: undefined,
  },
  /** Narrative — OS voice lines, story text */
  narrative: {
    fontSize: FONT_SIZE.caption,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.compact,
    lineHeight: LINE_HEIGHT.normal,
    color: undefined,
  },
  /** Error message — failure feedback */
  errorMessage: {
    fontSize: FONT_SIZE.body,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: LINE_HEIGHT.compact,
    color: undefined,
  },
  /** Badge text — "[KRN]", "[OK]" */
  badge: {
    fontSize: FONT_SIZE.micro,
    fontFamily: FONT,
    letterSpacing: LETTER_SPACING.medium,
    color: undefined,
  },
} as const;
