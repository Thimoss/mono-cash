import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Palette, Spacing } from '@/constants/theme';
import { ThemedButtonProps } from '@/types';
import { ThemedText } from './ThemedText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
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
}: ThemedButtonProps) {
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

  const contentColor =
    variant === 'primary' ? Palette.black : Palette.white;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isInteractionDisabled}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : children ? (
        children
      ) : (
        <ThemedText
          weight="semibold"
          style={[styles.textBase, { color: contentColor }, textSizeStyles[size], textStyle]}
        >
          {title}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 0,
  },
  textBase: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.two * 1.5,
    minHeight: 34,
  },
  md: {
    paddingVertical: Spacing.two * 1.25,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
  },
  lg: {
    paddingVertical: Spacing.two * 2,
    paddingHorizontal: Spacing.four,
    minHeight: 52,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 12,
    lineHeight: 16,
  },
  md: {
    fontSize: 14,
    lineHeight: 20,
  },
  lg: {
    fontSize: 16,
    lineHeight: 24,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  secondary: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: Palette.white,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});
