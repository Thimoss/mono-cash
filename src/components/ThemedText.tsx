import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedTextProps, ThemedTextVariant } from '@/types';

export function ThemedText({
  variant,
  type,
  color,
  themeColor,
  weight,
  mono,
  style,
  ...rest
}: ThemedTextProps) {
  const colors = useTheme();
  const selectedVariant: ThemedTextVariant = variant ?? type ?? 'body';

  const getDefaultColor = (v: ThemedTextVariant) => {
    switch (v) {
      case 'caption':
      case 'code':
        return colors.textSecondary;
      case 'link':
      case 'linkPrimary':
        return colors.accent;
      default:
        return colors.text;
    }
  };

  const textColor =
    color ??
    (themeColor ? colors[themeColor] : getDefaultColor(selectedVariant));

  const weightStyle = weight ? weightStyles[weight] : null;

  const isMonospace =
    mono || selectedVariant === 'amount' || selectedVariant === 'code';

  return (
    <Text
      style={[
        styles.base,
        isMonospace && styles.mono,
        variantStyles[selectedVariant],
        { color: textColor },
        weightStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Typography.sans,
  },
  mono: {
    fontFamily: Typography.mono,
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
  h1: {
    fontSize: Typography.scale['3xl'].fontSize,
    lineHeight: Typography.scale['3xl'].lineHeight,
    letterSpacing: Typography.scale['3xl'].letterSpacing,
    fontWeight: Typography.weight.bold,
  },
  h2: {
    fontSize: Typography.scale['2xl'].fontSize,
    lineHeight: Typography.scale['2xl'].lineHeight,
    letterSpacing: Typography.scale['2xl'].letterSpacing,
    fontWeight: Typography.weight.bold,
  },
  h3: {
    fontSize: Typography.scale.xl.fontSize,
    lineHeight: Typography.scale.xl.lineHeight,
    letterSpacing: Typography.scale.xl.letterSpacing,
    fontWeight: Typography.weight.semibold,
  },
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
  },
  small: {
    fontSize: Typography.scale.xs.fontSize,
    lineHeight: Typography.scale.xs.lineHeight,
    letterSpacing: Typography.scale.xs.letterSpacing,
    fontWeight: Typography.weight.regular,
  },
  smallBold: {
    fontSize: Typography.scale.xs.fontSize,
    lineHeight: Typography.scale.xs.lineHeight,
    letterSpacing: Typography.scale.xs.letterSpacing,
    fontWeight: Typography.weight.bold,
  },
  amount: {
    fontSize: Typography.scale['2xl'].fontSize,
    lineHeight: Typography.scale['2xl'].lineHeight,
    letterSpacing: -0.5,
    fontFamily: Typography.mono,
    fontWeight: Typography.weight.bold,
  },
  code: {
    fontSize: Typography.scale.sm.fontSize,
    lineHeight: Typography.scale.sm.lineHeight,
    letterSpacing: 0,
    fontFamily: Typography.mono,
    fontWeight: Typography.weight.regular,
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
