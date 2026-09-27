import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors, MonospaceFamily, Typography } from '@/constants/theme';
import { ThemedTextProps, ThemedTextVariant } from '@/types';

export function ThemedText({
  variant,
  type,
  color,
  themeColor,
  weight,
  style,
  ...rest
}: ThemedTextProps) {
  const selectedVariant: ThemedTextVariant = variant ?? type ?? 'body';

  const textColor =
    color ??
    (themeColor ? Colors.dark[themeColor] : Colors.dark.text);

  const weightStyle = weight ? weightStyles[weight] : null;

  return (
    <Text
      style={[
        styles.base,
        { color: textColor },
        variantStyles[selectedVariant],
        weightStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: MonospaceFamily,
    color: Colors.dark.text,
  },
});

const weightStyles = StyleSheet.create({
  regular: {
    fontWeight: Typography.weight.regular,
  },
  medium: {
    fontWeight: Typography.weight.medium,
  },
  semibold: {
    fontWeight: Typography.weight.semibold,
  },
  bold: {
    fontWeight: Typography.weight.bold,
  },
});

const variantStyles = StyleSheet.create({
  title: {
    fontSize: Typography.scale['3xl'].fontSize,
    lineHeight: Typography.scale['3xl'].lineHeight,
    letterSpacing: Typography.scale['3xl'].letterSpacing,
    fontWeight: Typography.weight.bold,
  },
  subtitle: {
    fontSize: Typography.scale.xl.fontSize,
    lineHeight: Typography.scale.xl.lineHeight,
    letterSpacing: Typography.scale.xl.letterSpacing,
    fontWeight: Typography.weight.semibold,
  },
  body: {
    fontSize: Typography.scale.base.fontSize,
    lineHeight: Typography.scale.base.lineHeight,
    letterSpacing: Typography.scale.base.letterSpacing,
    fontWeight: Typography.weight.regular,
  },
  default: {
    fontSize: Typography.scale.base.fontSize,
    lineHeight: Typography.scale.base.lineHeight,
    letterSpacing: Typography.scale.base.letterSpacing,
    fontWeight: Typography.weight.regular,
  },
  caption: {
    fontSize: Typography.scale.sm.fontSize,
    lineHeight: Typography.scale.sm.lineHeight,
    letterSpacing: Typography.scale.sm.letterSpacing,
    fontWeight: Typography.weight.regular,
    color: Colors.dark.textSecondary,
  },
  small: {
    fontSize: Typography.scale.sm.fontSize,
    lineHeight: Typography.scale.sm.lineHeight,
    letterSpacing: Typography.scale.sm.letterSpacing,
    fontWeight: Typography.weight.regular,
  },
  smallBold: {
    fontSize: Typography.scale.sm.fontSize,
    lineHeight: Typography.scale.sm.lineHeight,
    letterSpacing: Typography.scale.sm.letterSpacing,
    fontWeight: Typography.weight.bold,
  },
  amount: {
    fontSize: Typography.scale['2xl'].fontSize,
    lineHeight: Typography.scale['2xl'].lineHeight,
    letterSpacing: Typography.scale['2xl'].letterSpacing,
    fontWeight: Typography.weight.bold,
  },
  code: {
    fontSize: Typography.scale.sm.fontSize,
    lineHeight: Typography.scale.sm.lineHeight,
    letterSpacing: Typography.scale.sm.letterSpacing,
    fontWeight: Typography.weight.regular,
    color: Colors.dark.textSecondary,
  },
  link: {
    fontSize: Typography.scale.base.fontSize,
    lineHeight: Typography.scale.base.lineHeight,
    textDecorationLine: 'underline',
  },
  linkPrimary: {
    fontSize: Typography.scale.base.fontSize,
    lineHeight: Typography.scale.base.lineHeight,
    fontWeight: Typography.weight.semibold,
    textDecorationLine: 'underline',
  },
});
