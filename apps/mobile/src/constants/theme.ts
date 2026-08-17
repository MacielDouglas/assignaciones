export const Colors = {
  light: {
    background: "#FFFFFF",
    foreground: "#0A0A0A",
    card: "#FFFFFF",
    cardForeground: "#0A0A0A",
    muted: "#F5F5F5",
    mutedForeground: "#737373",
    border: "#E5E5E5",
    input: "#E5E5E5",
    primary: "#0A0A0A",
    primaryForeground: "#FAFAFA",
    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",
    ring: "#B4B4B4",
  },
  dark: {
    background: "#0A0A0A",
    foreground: "#FAFAFA",
    card: "#1A1A1A",
    cardForeground: "#FAFAFA",
    muted: "#262626",
    mutedForeground: "#A3A3A3",
    border: "#262626",
    input: "#262626",
    primary: "#FAFAFA",
    primaryForeground: "#0A0A0A",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    ring: "#525252",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  "3xl": 48,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;
