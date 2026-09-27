import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Database,
  Download,
  Globe,
  Info,
  Moon,
  Palette as PaletteIcon,
  Sun,
  Trash2,
  X,
  Zap,
} from 'lucide-react-native';

const StatusBar = ExpoStatusBar as React.ComponentType<
  React.ComponentProps<typeof ExpoStatusBar> & { backgroundColor?: string }
>;

import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { BorderRadius, ColorTheme, Palette, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Language, SettingsScreenProps, ThemeMode } from '@/types';

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const colors = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const {
    kantongs,
    transaksis,
    tagihans,
    wishlists,
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    resetAllData,
    exportFinanceData,
  } = useFinanceStore();

  const { t } = useTranslation();

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      setResetError(null);
      await resetAllData();
      setIsResetting(false);
      setIsResetModalVisible(false);
      setResetFeedback(t('settingsResetSuccess'));
      setTimeout(() => {
        setResetFeedback(null);
      }, 5000);
    } catch (err) {
      setIsResetting(false);
      const msg = err instanceof Error ? err.message : 'FAILED TO RESET DATABASE';
      setResetError(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      setExportFeedback(null);
      const result = await exportFinanceData();
      setIsExporting(false);
      if (result.success) {
        setExportFeedback(t('settingsExportSuccess'));
        setTimeout(() => setExportFeedback(null), 4000);
      }
    } catch {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor={colors.background} style={themeMode === 'light' ? 'dark' : 'light'} />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.navButton} hitSlop={8}>
              <ArrowLeft size={16} color={colors.text} />
              <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
                {t('navDashboard').toUpperCase()}
              </ThemedText>
            </Pressable>
          )}
          <ThemedText variant="caption" weight="bold" style={styles.appBarTitle}>
            {t('settingsPageTitle')}
          </ThemedText>
        </View>
        <View style={styles.versionBadge}>
          <Info size={12} color={colors.textSecondary} />
          <ThemedText variant="caption" style={styles.versionText}>
            v2.1.0
          </ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feedback Alerts */}
        {resetFeedback && (
          <Animated.View
            entering={FadeInDown.duration(300).springify().damping(18)}
            style={styles.feedbackSuccessCard}
          >
            <CheckCircle2 size={18} color={colors.success} />
            <View style={styles.feedbackTextWrapper}>
              <ThemedText weight="bold" style={styles.feedbackSuccessTitle}>
                {t('settingsResetComplete')}
              </ThemedText>
              <ThemedText variant="caption" style={styles.feedbackSuccessText}>
                {resetFeedback}
              </ThemedText>
            </View>
          </Animated.View>
        )}

        {/* Section 1: Theme Preference */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBox}>
              <PaletteIcon size={16} color={colors.accent} />
            </View>
            <View style={styles.sectionTitleWrapper}>
              <ThemedText weight="bold" style={styles.sectionTitle}>
                {t('settingsThemePreference')}
              </ThemedText>
              <ThemedText variant="caption" style={styles.sectionDesc}>
                {t('settingsThemeDesc')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.themeOptionsRow}>
            {/* Neo-Fintech / Pure Black Theme */}
            <Pressable
              onPress={() => handleSelectTheme('dark')}
              style={[
                styles.themeCard,
                themeMode === 'dark' && styles.themeCardActive,
              ]}
            >
              <View style={styles.themeCardHeader}>
                <View style={styles.themeCardTitleRow}>
                  <Moon size={16} color={themeMode === 'dark' ? colors.accent : colors.textSecondary} />
                  <ThemedText weight="bold" style={styles.themeCardTitle}>
                    {t('settingsNeoDark')}
                  </ThemedText>
                </View>
                {themeMode === 'dark' && (
                  <View style={styles.activePill}>
                    <Check size={11} color={Palette.pureWhite} />
                    <ThemedText variant="caption" weight="bold" style={styles.activePillText}>
                      {t('settingsActive')}
                    </ThemedText>
                  </View>
                )}
              </View>
              <ThemedText variant="caption" style={styles.themeCardDesc}>
                {t('settingsNeoDarkDesc')}
              </ThemedText>
            </Pressable>

            {/* Inverted Light Theme */}
            <Pressable
              onPress={() => handleSelectTheme('light')}
              style={[
                styles.themeCard,
                themeMode === 'light' && styles.themeCardActive,
              ]}
            >
              <View style={styles.themeCardHeader}>
                <View style={styles.themeCardTitleRow}>
                  <Sun size={16} color={themeMode === 'light' ? colors.accent : colors.textSecondary} />
                  <ThemedText weight="bold" style={styles.themeCardTitle}>
                    {t('settingsCleanLight')}
                  </ThemedText>
                </View>
                {themeMode === 'light' && (
                  <View style={styles.activePill}>
                    <Check size={11} color={Palette.pureWhite} />
                    <ThemedText variant="caption" weight="bold" style={styles.activePillText}>
                      {t('settingsActive')}
                    </ThemedText>
                  </View>
                )}
              </View>
              <ThemedText variant="caption" style={styles.themeCardDesc}>
                {t('settingsCleanLightDesc')}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Section 2: Language */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBox}>
              <Globe size={16} color={colors.accent} />
            </View>
            <View style={styles.sectionTitleWrapper}>
              <ThemedText weight="bold" style={styles.sectionTitle}>
                {t('settingsLanguage')}
              </ThemedText>
              <ThemedText variant="caption" style={styles.sectionDesc}>
                {t('settingsLanguageDesc')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.themeOptionsRow}>
            {(['id', 'en'] as Language[]).map((lang) => {
              const isSelected = language === lang;
              const label = lang === 'id' ? t('settingsLangId') : t('settingsLangEn');
              return (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[
                    styles.themeCard,
                    isSelected && styles.themeCardActive,
                  ]}
                >
                  <View style={styles.themeCardHeader}>
                    <View style={styles.themeCardTitleRow}>
                      <Globe size={16} color={isSelected ? colors.accent : colors.textSecondary} />
                      <ThemedText weight="bold" style={styles.themeCardTitle}>
                        {`[ ${lang.toUpperCase()} ] ${label}`}
                      </ThemedText>
                    </View>
                    {isSelected && (
                      <View style={styles.activePill}>
                        <Check size={11} color={Palette.pureWhite} />
                        <ThemedText variant="caption" weight="bold" style={styles.activePillText}>
                          {t('settingsActive')}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 3: System Diagnostics */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBox}>
              <Database size={16} color={colors.accent} />
            </View>
            <View style={styles.sectionTitleWrapper}>
              <ThemedText weight="bold" style={styles.sectionTitle}>
                {t('settingsDiagnostics')}
              </ThemedText>
              <ThemedText variant="caption" style={styles.sectionDesc}>
                {t('settingsDiagDesc')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.diagnosticsCard}>
            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={styles.diagLabel}>
                {t('settingsStorageEngine')}
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={styles.diagValue}>
                {t('settingsStorageValue')}
              </ThemedText>
            </View>

            <View style={styles.diagDivider} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={styles.diagLabel}>
                {t('settingsEnvelopes')}
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={styles.diagValue}>
                {`${kantongs.length} ${t('settingsActive_')}`}
              </ThemedText>
            </View>

            <View style={styles.diagDivider} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={styles.diagLabel}>
                {t('settingsTransactions')}
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={styles.diagValue}>
                {`${transaksis.length} ${t('settingsRecords')}`}
              </ThemedText>
            </View>

            <View style={styles.diagDivider} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={styles.diagLabel}>
                {t('settingsBillObligations')}
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={styles.diagValue}>
                {`${tagihans.length} ${t('settingsScheduled')}`}
              </ThemedText>
            </View>

            <View style={styles.diagDivider} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={styles.diagLabel}>
                {t('settingsWishlistTargets')}
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={styles.diagValue}>
                {`${wishlists.length} ${t('settingsGoals')}`}
              </ThemedText>
            </View>

            <View style={styles.diagDivider} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={styles.diagLabel}>
                {t('settingsConnectivity')}
              </ThemedText>
              <View style={styles.offlineBadge}>
                <Zap size={11} color={colors.success} />
                <ThemedText variant="caption" weight="bold" style={styles.offlineText}>
                  {t('settingsOfflineAirGapped')}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: Backup & Sharing */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBox}>
              <Download size={16} color={colors.accent} />
            </View>
            <View style={styles.sectionTitleWrapper}>
              <ThemedText weight="bold" style={styles.sectionTitle}>
                {t('settingsDataExport')}
              </ThemedText>
              <ThemedText variant="caption" style={styles.sectionDesc}>
                {t('settingsExportDesc')}
              </ThemedText>
            </View>
          </View>

          <ThemedButton
            title={isExporting ? t('settingsExportGenerating') : t('settingsExportBtn')}
            variant="outline"
            size="md"
            loading={isExporting}
            onPress={handleExportData}
          />
          {exportFeedback && (
            <ThemedText variant="caption" style={styles.exportFeedbackText}>
              {exportFeedback}
            </ThemedText>
          )}
        </View>

        {/* Section 5: Danger Zone (Reset Data) */}
        <View style={[styles.section, styles.dangerSection]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.dangerIconBox}>
              <AlertTriangle size={16} color={colors.danger} />
            </View>
            <View style={styles.sectionTitleWrapper}>
              <ThemedText weight="bold" style={styles.dangerTitle}>
                {t('settingsDangerZone')}
              </ThemedText>
              <ThemedText variant="caption" style={styles.sectionDesc}>
                {t('settingsDangerDesc')}
              </ThemedText>
            </View>
          </View>

          <ThemedButton
            title={t('settingsResetBtn')}
            variant="danger"
            size="lg"
            style={styles.resetButton}
            onPress={() => setIsResetModalVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={isResetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsResetModalVisible(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Trash2 size={18} color={colors.danger} />
                <ThemedText weight="bold" style={styles.modalWarningTitle}>
                  {t('settingsConfirmPurge')}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setIsResetModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {resetError && (
                <View style={styles.errorBox}>
                  <ThemedText variant="caption" style={styles.errorText}>
                    {resetError}
                  </ThemedText>
                </View>
              )}

              <View style={styles.warningAlertBox}>
                <AlertTriangle size={20} color={colors.danger} />
                <ThemedText weight="bold" style={styles.modalWarningHeadline}>
                  {t('settingsResetWarning')}
                </ThemedText>
              </View>

              <ThemedText variant="caption" style={styles.modalWarningDetail}>
                {t('settingsResetDetail')}
                {'\n'}{t('settingsResetItem1')}
                {'\n'}{t('settingsResetItem2')}
                {'\n'}{t('settingsResetItem3')}
                {'\n'}{t('settingsResetItem4')}
              </ThemedText>

              <ThemedText variant="caption" style={styles.modalWarningConfirm}>
                {t('settingsResetIrreversible')}
              </ThemedText>

              <View style={styles.modalActionsRow}>
                <ThemedButton
                  title={t('billsCancel')}
                  variant="outline"
                  size="md"
                  disabled={isResetting}
                  style={styles.modalBtn}
                  onPress={() => setIsResetModalVisible(false)}
                />
                <ThemedButton
                  title={t('settingsConfirmWipeAll')}
                  variant="danger"
                  size="md"
                  loading={isResetting}
                  style={styles.modalBtn}
                  onPress={handleConfirmReset}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    appBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two * 1.25,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    appBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.one * 1.5,
      paddingVertical: Spacing.one,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonText: {
      color: colors.text,
      letterSpacing: 0.5,
    },
    appBarTitle: {
      letterSpacing: 1,
      color: colors.text,
    },
    versionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 2,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    versionText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    content: {
      padding: Spacing.three,
      paddingBottom: Spacing.six * 1.5,
      gap: Spacing.four,
    },
    feedbackSuccessCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
      borderRadius: BorderRadius.lg,
      padding: Spacing.three,
    },
    feedbackTextWrapper: {
      flex: 1,
    },
    feedbackSuccessTitle: {
      color: colors.success,
      fontSize: Typography.scale.sm.fontSize,
      marginBottom: 2,
    },
    feedbackSuccessText: {
      color: colors.text,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: Spacing.three,
      gap: Spacing.two * 1.25,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    sectionIconBox: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitleWrapper: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: Typography.scale.sm.fontSize,
      color: colors.text,
      letterSpacing: 0.5,
    },
    sectionDesc: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    themeOptionsRow: {
      gap: Spacing.two,
      marginTop: Spacing.one,
    },
    themeCard: {
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSelected,
      padding: Spacing.three,
      gap: Spacing.one,
    },
    themeCardActive: {
      borderColor: colors.accent,
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    themeCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    themeCardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.one * 1.5,
    },
    themeCardTitle: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
      letterSpacing: 0.3,
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      borderRadius: BorderRadius.full,
      paddingVertical: 2,
      paddingHorizontal: Spacing.two,
    },
    activePillText: {
      color: Palette.pureWhite,
      fontSize: Typography.scale.xs.fontSize,
    },
    themeCardDesc: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    diagnosticsCard: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.three,
      gap: Spacing.two,
    },
    diagRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    diagLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    diagValue: {
      color: colors.text,
      fontSize: Typography.scale.xs.fontSize,
    },
    diagDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    offlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingVertical: 2,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    offlineText: {
      color: colors.success,
      fontSize: Typography.scale.xs.fontSize,
    },
    exportFeedbackText: {
      color: colors.success,
      marginTop: Spacing.one,
      textAlign: 'center',
    },
    dangerSection: {
      borderColor: 'rgba(239, 68, 68, 0.3)',
      backgroundColor: 'rgba(239, 68, 68, 0.04)',
    },
    dangerIconBox: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerTitle: {
      color: colors.danger,
      fontSize: Typography.scale.sm.fontSize,
      letterSpacing: 0.5,
    },
    resetButton: {
      marginTop: Spacing.one,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.three,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    modalContainer: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.4)',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.three,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    modalHeaderTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    modalWarningTitle: {
      color: colors.danger,
      fontSize: Typography.scale.sm.fontSize,
      letterSpacing: 0.5,
    },
    modalCloseBtn: {
      width: 30,
      height: 30,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBody: {
      padding: Spacing.three * 1.2,
      gap: Spacing.three,
    },
    warningAlertBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      padding: Spacing.two * 1.25,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    modalWarningHeadline: {
      flex: 1,
      color: colors.danger,
      fontSize: Typography.scale.xs.fontSize,
      lineHeight: 18,
    },
    modalWarningDetail: {
      color: colors.textSecondary,
      lineHeight: 20,
      backgroundColor: colors.backgroundSelected,
      padding: Spacing.two * 1.25,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalWarningConfirm: {
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: Typography.scale.xs.fontSize,
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    modalBtn: {
      flex: 1,
    },
    errorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: BorderRadius.md,
      padding: Spacing.two,
    },
    errorText: {
      color: colors.danger,
    },
  });
