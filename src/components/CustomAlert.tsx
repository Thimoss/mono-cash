import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { BorderRadius, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedButton } from './ThemedButton';
import { ThemedText } from './ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type CustomAlertType = 'info' | 'success' | 'error' | 'warning';

export interface CustomAlertProps {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly onConfirm: () => void;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly onCancel?: () => void;
  readonly type?: CustomAlertType;
}

export function CustomAlert({
  visible,
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  cancelText,
  onCancel,
  type = 'info',
}: Readonly<CustomAlertProps>) {
  const colors = useTheme();

  const getAlertBadge = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={24} color={Palette.emerald} />,
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
        };
      case 'error':
        return {
          icon: <AlertCircle size={24} color={Palette.rose} />,
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.25)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} color={Palette.amber} />,
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.25)',
        };
      default:
        return {
          icon: <Bell size={24} color={Palette.indigo} />,
          bg: 'rgba(99, 102, 241, 0.12)',
          border: 'rgba(99, 102, 241, 0.25)',
        };
    }
  };

  const badge = getAlertBadge();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel ?? onConfirm}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Icon Badge */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: badge.bg,
                borderColor: badge.border,
              },
            ]}
          >
            {badge.icon}
          </View>

          {/* Title */}
          <ThemedText
            variant="h4"
            weight="bold"
            style={styles.title}
          >
            {title}
          </ThemedText>

          {/* Message */}
          <ThemedText
            variant="body"
            style={[styles.message, { color: colors.textSecondary }]}
          >
            {message}
          </ThemedText>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {Boolean(onCancel && cancelText) && (
              <View style={styles.buttonFlex}>
                <ThemedButton
                  title={cancelText ?? 'Batal'}
                  variant="outline"
                  onPress={onCancel}
                />
              </View>
            )}
            <View style={styles.buttonFlex}>
              <ThemedButton
                title={confirmText}
                variant="primary"
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: Math.min(SCREEN_WIDTH - 48, 360),
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.two,
  },
  buttonFlex: {
    flex: 1,
  },
});
