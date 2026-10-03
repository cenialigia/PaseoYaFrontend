import { Text, type TextProps } from 'react-native';

import { Colors, Typography, type ColorToken, type TypographyVariant } from '@/constants/theme';

export type AppTextProps = TextProps & { variant?: TypographyVariant; color?: ColorToken };

export function AppText({ variant = 'body', color = 'onSurface', style, ...rest }: AppTextProps) {
  return <Text style={[Typography[variant], { color: Colors[color] }, style]} {...rest} />;
}
