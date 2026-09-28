import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ScreenHeaderProps {
  readonly title?: string;
  readonly titleComponent?: React.ReactNode;
  readonly rightElement?: React.ReactNode;
  readonly showBack?: boolean;
  readonly onBack?: () => void;
  readonly accessibilityLabel?: string;
  readonly borderBottom?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({
  title,
  titleComponent,
  rightElement,
  showBack = false,
  onBack,
  accessibilityLabel,
  borderBottom = true,
  style,
}: ScreenHeaderProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
        },
        borderBottom && {
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.leftContainer}>
        {showBack && (
          <HeaderBackButton onBack={onBack} accessibilityLabel={accessibilityLabel} />
        )}
        {titleComponent ?? (
          <ThemedText variant="h3" weight="bold" numberOfLines={1} style={styles.title}>
            {title}
          </ThemedText>
        )}
      </View>
      {rightElement ? <View style={styles.rightContainer}>{rightElement}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two * 1.5,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two * 1.5,
  },
  title: {
    flex: 1,
    letterSpacing: -0.2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.two,
  },
});
