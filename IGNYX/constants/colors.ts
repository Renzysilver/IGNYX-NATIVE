// IGNYX Color System
// Reference this everywhere. Do not hardcode colors.

export const Colors = {
  // Primary
  cyan: '#00F5FF',
  cyanDim: 'rgba(0, 245, 255, 0.3)',
  cyanFaint: 'rgba(0, 245, 255, 0.1)',
  cyanBright: 'rgba(0, 245, 255, 0.8)',

  // Status
  amber: '#FFBF00',
  amberDim: 'rgba(255, 191, 0, 0.3)',
  red: '#FF0000',
  redDim: 'rgba(255, 0, 0, 0.3)',
  darkRed: '#8B0000',
  darkRedOpacity: 'rgba(139, 0, 0, 0.6)',

  // Text
  textPrimary: '#E8F4F8',
  textCyan: '#00F5FF',
  textRed: '#FF0000',
  textAmber: '#FFBF00',
  textDim: 'rgba(232, 244, 248, 0.4)',

  // Backgrounds
  black: '#000000',
  bgDark: 'rgba(10, 22, 40, 0.75)',
  bgDarkActive: 'rgba(10, 22, 40, 0.95)',
  overlayDark: 'rgba(0, 0, 0, 0.4)',
  overlayExtraDark: 'rgba(0, 0, 0, 0.3)',

  // Circuit
  circuitNode: 'rgba(0, 245, 255, 0.2)',
  circuitLine: 'rgba(0, 245, 255, 0.1)',

  // Glass Panel
  glassBg: 'rgba(10, 22, 40, 0.75)',
  glassBgActive: 'rgba(10, 22, 40, 0.95)',
  glassBorder: 'rgba(0, 245, 255, 0.3)',
  glassBorderActive: 'rgba(0, 245, 255, 0.8)',

  // Breakdown
  purple: '#8B00FF',
  purpleShift: 'rgba(139, 0, 255, 0.4)',

  // XP Bar
  xpFill: '#00F5FF',
  xpEmpty: 'rgba(0, 245, 255, 0.1)',

  // Module health dots
  dotHealthy: '#00F5FF',
  dotWarning: '#FFBF00',
  dotCritical: '#FF0000',
  dotOffline: 'rgba(232, 244, 248, 0.15)',
} as const;

export type ColorKey = keyof typeof Colors;
