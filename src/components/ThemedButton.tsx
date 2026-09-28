import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BorderRadius, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedButtonProps } from '@/types';
import { ThemedText } from './ThemedText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

export const PRIMARY_ACTION_BUTTON_STYLE = {
  height: 52,
  minHeight: 52,
  borderRadius: BorderRadius.lg,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  flexDirection: 'row' as const,
  gap: 8,
};

export function ThemedButton({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  primaryAction = false,
}: Readonly<ThemedButtonProps>) {
  const colors = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const isInteractionDisabled = disabled || loading;

  const getContentColor = () => {
    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return Palette.pureWhite;
      case 'secondary':
      case 'outline':
        return colors.text;
      case 'ghost':
        return colors.textSecondary;
      default:
        return colors.text;
    }
  };

  const getDynamicVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.accent, borderColor: colors.accent };
      case 'secondary':
        return { backgroundColor: colors.backgroundSelected, borderColor: colors.border };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.border };
      case 'ghost':
        return { backgroundColor: 'transparent', borderColor: 'transparent' };
      case 'success':
        return { backgroundColor: colors.success, borderColor: colors.success };
      case 'danger':
        return { backgroundColor: colors.danger, borderColor: colors.danger };
    }
  };

  const contentColor = getContentColor();
  const isPrimaryAction = primaryAction || size === 'lg';

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={contentColor} />;
    }
    if (children) {
      return children;
    }
    return (
      <ThemedText
        weight="semibold"
        style={[styles.textBase, { color: contentColor }, textSizeStyles[size], textStyle]}
      >
        {title}
      </ThemedText>
    );
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isInteractionDisabled}
      style={[
        styles.base,
        sizeStyles[size],
        getDynamicVariantStyle(),
        isPrimaryAction && styles.primaryActionBase,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  primaryActionBase: {
    height: 52,
    minHeight: 52,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textBase: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.45,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.two * 1.5,
    minHeight: 36,
    borderRadius: BorderRadius.sm,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    borderRadius: BorderRadius.md,
  },
  lg: {
    height: 52,
    minHeight: 52,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 13,
    lineHeight: 18,
  },
  md: {
    fontSize: 15,
    lineHeight: 20,
  },
  lg: {
    fontSize: 16,
    lineHeight: 24,
  },
});
