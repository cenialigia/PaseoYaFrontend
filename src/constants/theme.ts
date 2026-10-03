// Tokens aprobados en DEC-11 (Core: 02-Arquitectura/Especificacion UI LUI-01). Sólo tema claro.
export const Colors = {
  primary: '#00236F',
  onPrimary: '#FFFFFF',
  primaryContainer: '#1E3A8A',
  primaryFixed: '#DCE1FF',
  onPrimaryFixedVariant: '#264191',
  secondary: '#006A61',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#86F2E4',
  onSecondaryContainer: '#006F66',
  secondaryFixed: '#89F5E7',
  onSecondaryFixedVariant: '#005049',
  tertiaryFixed: '#FFDDB8',
  onTertiaryFixedVariant: '#653E00',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  surface: '#FAF8FF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2F3FF',
  surfaceContainer: '#EAEDFF',
  surfaceContainerHigh: '#E2E7FF',
  onSurface: '#131B2E',
  onSurfaceVariant: '#444651',
  outline: '#757682',
  outlineVariant: '#C5C5D3',
  scrim: 'rgba(19, 27, 46, 0.4)',
} as const;

export type ColorToken = keyof typeof Colors;

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Typography = {
  display: { fontFamily: FontFamily.extraBold, fontSize: 36, lineHeight: 44, letterSpacing: -0.7 },
  headline: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.2 },
  title: { fontFamily: FontFamily.semiBold, fontSize: 20, lineHeight: 28 },
  titleSm: { fontFamily: FontFamily.semiBold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: FontFamily.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelSm: { fontFamily: FontFamily.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontFamily: FontFamily.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
} as const;

export type TypographyVariant = keyof typeof Typography;

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, gutter: 12, screen: 16 } as const;

export const Radius = { control: 12, card: 16, sheet: 24, pill: 9999 } as const;

// Android recomienda 48 dp; DESIGN.md decía 44 y se toma el mayor.
export const TouchTarget = 48;
export const ButtonHeight = 50;

export const Elevation = {
  card: { elevation: 1 },
  raised: { elevation: 4 },
  overlay: { elevation: 12 },
} as const;

export type StatusTone = 'confirmado' | 'preparando' | 'listo' | 'entregado' | 'cerrado';

export const StatusColors: Record<StatusTone, { bg: string; fg: string }> = {
  confirmado: { bg: Colors.primaryFixed, fg: Colors.onPrimaryFixedVariant },
  preparando: { bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant },
  listo: { bg: Colors.secondaryFixed, fg: Colors.onSecondaryFixedVariant },
  entregado: { bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant },
  cerrado: { bg: Colors.errorContainer, fg: Colors.onErrorContainer },
};
