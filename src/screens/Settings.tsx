import React, { useState } from 'react';
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
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Palette, Spacing, Typography } from '@/constants/theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { SettingsScreenProps, ThemeMode } from '@/types';

const StatusBar = ExpoStatusBar as React.ComponentType<
  React.ComponentProps<typeof ExpoStatusBar> & { backgroundColor?: string }
>;

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const {
    kantongs,
    transaksis,
    tagihans,
    wishlists,
    themeMode,
    setThemeMode,
    resetAllData,
    exportFinanceData,
  } = useFinanceStore();

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
      setResetFeedback('SYSTEM DATABASE WIPED & RE-INITIALIZED SUCCESSFULLY.');
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
        setExportFeedback('BACKUP SHARED // READY IN CACHE');
        setTimeout(() => setExportFeedback(null), 4000);
      }
    } catch {
      setIsExporting(false);
    }
  };

  const isLight = themeMode === 'light';
  const containerBg = isLight ? Palette.white : Palette.black;
  const cardBg = isLight ? Palette.gray100 : Colors.dark.backgroundElement;
  const borderColor = isLight ? Palette.gray300 : Palette.gray800;
  const activeBorderColor = isLight ? Palette.black : Palette.white;
  const textColor = isLight ? Palette.black : Palette.white;
  const mutedTextColor = isLight ? Palette.gray600 : Palette.gray400;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: containerBg }]}>
      <StatusBar backgroundColor={containerBg} style={isLight ? 'dark' : 'light'} />

      {/* Top App Bar */}
      <View style={[styles.appBar, { borderBottomColor: borderColor, backgroundColor: containerBg }]}>
        <View style={styles.appBarLeft}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <ThemedText variant="caption" weight="bold" style={{ color: textColor }}>
                [ &larr; CORE ]
              </ThemedText>
            </Pressable>
          )}
          <ThemedText variant="caption" weight="bold" style={[styles.appBarTitle, { color: textColor }]}>
            SETTINGS // SYSTEM HUB
          </ThemedText>
        </View>
        <ThemedText variant="caption" style={[styles.versionBadge, { color: mutedTextColor }]}>
          v1.0.0
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Feedback Alerts */}
        {resetFeedback && (
          <Animated.View
            entering={FadeInDown.duration(300).springify().damping(18)}
            style={[styles.feedbackSuccessCard, { borderColor: activeBorderColor }]}
          >
            <ThemedText weight="bold" style={styles.feedbackSuccessTitle}>
              ✓ DATABASE RESET COMPLETE
            </ThemedText>
            <ThemedText variant="caption" style={styles.feedbackSuccessText}>
              {resetFeedback}
            </ThemedText>
          </Animated.View>
        )}

        {/* Section 1: Theme Preference */}
        <View style={styles.section}>
          <ThemedText weight="bold" style={[styles.sectionTitle, { color: textColor }]}>
            // THEME PREFERENCE
          </ThemedText>
          <ThemedText variant="caption" style={[styles.sectionDesc, { color: mutedTextColor }]}>
            Configure high-contrast monochrome aesthetic for device interface.
          </ThemedText>

          <View style={styles.themeOptionsRow}>
            {/* Pure Black Dark Theme */}
            <Pressable
              onPress={() => handleSelectTheme('dark')}
              style={[
                styles.themeCard,
                { backgroundColor: Palette.black, borderColor: themeMode === 'dark' ? Palette.white : Palette.gray700 },
                themeMode === 'dark' && styles.themeCardActive,
              ]}
            >
              <View style={styles.themeCardHeader}>
                <ThemedText weight="bold" style={styles.themeCardTitleDark}>
                  PURE BLACK
                </ThemedText>
                {themeMode === 'dark' && (
                  <ThemedText variant="caption" weight="bold" style={styles.activeTagDark}>
                    [ ACTIVE ]
                  </ThemedText>
                )}
              </View>
              <ThemedText variant="caption" style={styles.themeCardDescDark}>
                OLED true black (#000000) with crisp white typography.
              </ThemedText>
            </Pressable>

            {/* Inverted Light Theme */}
            <Pressable
              onPress={() => handleSelectTheme('light')}
              style={[
                styles.themeCard,
                { backgroundColor: Palette.white, borderColor: themeMode === 'light' ? Palette.black : Palette.gray300 },
                themeMode === 'light' && styles.themeCardActiveLight,
              ]}
            >
              <View style={styles.themeCardHeader}>
                <ThemedText weight="bold" style={styles.themeCardTitleLight}>
                  INVERTED MONO
                </ThemedText>
                {themeMode === 'light' && (
                  <ThemedText variant="caption" weight="bold" style={styles.activeTagLight}>
                    [ ACTIVE ]
                  </ThemedText>
                )}
              </View>
              <ThemedText variant="caption" style={styles.themeCardDescLight}>
                High-contrast white (#FFFFFF) with solid black typography.
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Section 2: System Diagnostics */}
        <View style={styles.section}>
          <ThemedText weight="bold" style={[styles.sectionTitle, { color: textColor }]}>
            // SYSTEM DIAGNOSTICS & TELEMETRY
          </ThemedText>
          <ThemedText variant="caption" style={[styles.sectionDesc, { color: mutedTextColor }]}>
            Current runtime metrics and local SQLite instance state.
          </ThemedText>

          <View style={[styles.diagnosticsCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={[styles.diagLabel, { color: mutedTextColor }]}>
                STORAGE ENGINE
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={{ color: textColor }}>
                SQLite (WAL MODE)
              </ThemedText>
            </View>

            <View style={[styles.diagDivider, { backgroundColor: borderColor }]} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={[styles.diagLabel, { color: mutedTextColor }]}>
                ENVELOPES (KANTONG)
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={{ color: textColor }}>
                {`${kantongs.length} ENVELOPES`}
              </ThemedText>
            </View>

            <View style={[styles.diagDivider, { backgroundColor: borderColor }]} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={[styles.diagLabel, { color: mutedTextColor }]}>
                TRANSACTIONS LOGGED
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={{ color: textColor }}>
                {`${transaksis.length} RECORDS`}
              </ThemedText>
            </View>

            <View style={[styles.diagDivider, { backgroundColor: borderColor }]} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={[styles.diagLabel, { color: mutedTextColor }]}>
                BILLS (TAGIHAN)
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={{ color: textColor }}>
                {`${tagihans.length} OBLIGATIONS`}
              </ThemedText>
            </View>

            <View style={[styles.diagDivider, { backgroundColor: borderColor }]} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={[styles.diagLabel, { color: mutedTextColor }]}>
                WISHLIST TARGETS
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={{ color: textColor }}>
                {`${wishlists.length} ITEMS`}
              </ThemedText>
            </View>

            <View style={[styles.diagDivider, { backgroundColor: borderColor }]} />

            <View style={styles.diagRow}>
              <ThemedText variant="caption" style={[styles.diagLabel, { color: mutedTextColor }]}>
                CONNECTIVITY
              </ThemedText>
              <ThemedText variant="caption" weight="bold" style={{ color: textColor }}>
                OFFLINE ONLY (AIR-GAPPED)
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Section 3: Backup & Sharing */}
        <View style={styles.section}>
          <ThemedText weight="bold" style={[styles.sectionTitle, { color: textColor }]}>
            // DATA EXPORT UTILITY
          </ThemedText>
          <ThemedText variant="caption" style={[styles.sectionDesc, { color: mutedTextColor }]}>
            Create an RFC 4180 compliant CSV backup of all SQLite tables.
          </ThemedText>

          <ThemedButton
            title={isExporting ? 'GENERATING EXPORT...' : 'EXPORT BACKUP (.CSV)'}
            variant="outline"
            size="md"
            loading={isExporting}
            onPress={handleExportData}
          />
          {exportFeedback && (
            <ThemedText variant="caption" style={[styles.exportFeedbackText, { color: textColor }]}>
              {exportFeedback}
            </ThemedText>
          )}
        </View>

        {/* Section 4: Danger Zone (Reset Data) */}
        <View style={[styles.section, styles.dangerSection]}>
          <ThemedText weight="bold" style={styles.dangerTitle}>
            ! DANGER ZONE // FACTORY RESET
          </ThemedText>
          <ThemedText variant="caption" style={[styles.sectionDesc, { color: mutedTextColor }]}>
            Wipe all databases and restore the application to initial clean state.
          </ThemedText>

          <ThemedButton
            title="[ ! ] RESET DATABASE DATA"
            variant="primary"
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText weight="bold" style={styles.modalWarningTitle}>
                ! CONFIRM DATA PURGE
              </ThemedText>
              <Pressable onPress={() => setIsResetModalVisible(false)} style={styles.modalCloseBtn}>
                <ThemedText variant="caption">[ ESC ]</ThemedText>
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

              <ThemedText weight="bold" style={styles.modalWarningHeadline}>
                ALL LOCAL SQLITE DATA WILL BE DESTROYED PERMANENTLY.
              </ThemedText>

              <ThemedText variant="caption" style={styles.modalWarningDetail}>
                This operation drops and re-creates all SQLite tables:
                {'\n'}• All Envelopes & Kantong balances
                {'\n'}• All Transaction records & categories
                {'\n'}• All Bill obligations & schedules
                {'\n'}• All Wishlist items & attached images
              </ThemedText>

              <ThemedText variant="caption" style={styles.modalWarningConfirm}>
                This action is IRREVERSIBLE. Are you sure you want to proceed?
              </ThemedText>

              <View style={styles.modalActionsRow}>
                <ThemedButton
                  title="CANCEL"
                  variant="outline"
                  size="md"
                  disabled={isResetting}
                  style={styles.modalBtn}
                  onPress={() => setIsResetModalVisible(false)}
                />
                <ThemedButton
                  title="CONFIRM WIPE ALL"
                  variant="primary"
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backButton: {
    paddingVertical: Spacing.half,
    paddingRight: Spacing.two,
  },
  appBarTitle: {
    letterSpacing: 1,
  },
  versionBadge: {
    letterSpacing: 0.5,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six * 1.5,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: Typography.scale.sm.fontSize,
    letterSpacing: 1,
  },
  sectionDesc: {
    letterSpacing: 0.25,
    lineHeight: 18,
  },
  themeOptionsRow: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  themeCard: {
    borderWidth: 1,
    padding: Spacing.three,
  },
  themeCardActive: {
    borderWidth: 2,
    borderColor: Palette.white,
  },
  themeCardActiveLight: {
    borderWidth: 2,
    borderColor: Palette.black,
  },
  themeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  themeCardTitleDark: {
    color: Palette.white,
    fontSize: Typography.scale.base.fontSize,
    letterSpacing: 0.5,
  },
  activeTagDark: {
    color: Palette.white,
    letterSpacing: 1,
  },
  themeCardDescDark: {
    color: Palette.gray400,
  },
  themeCardTitleLight: {
    color: Palette.black,
    fontSize: Typography.scale.base.fontSize,
    letterSpacing: 0.5,
  },
  activeTagLight: {
    color: Palette.black,
    letterSpacing: 1,
  },
  themeCardDescLight: {
    color: Palette.gray600,
  },
  diagnosticsCard: {
    borderWidth: 1,
    padding: Spacing.three,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
  diagLabel: {
    letterSpacing: 0.5,
  },
  diagDivider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  exportFeedbackText: {
    letterSpacing: 0.5,
    marginTop: Spacing.one,
  },
  dangerSection: {
    borderTopWidth: 1,
    borderTopColor: Palette.gray800,
    paddingTop: Spacing.three,
  },
  dangerTitle: {
    color: Palette.white,
    letterSpacing: 1,
    fontSize: Typography.scale.sm.fontSize,
  },
  resetButton: {
    marginTop: Spacing.one,
  },
  feedbackSuccessCard: {
    backgroundColor: Palette.black,
    borderWidth: 1,
    borderColor: Palette.white,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  feedbackSuccessTitle: {
    color: Palette.white,
    letterSpacing: 0.5,
  },
  feedbackSuccessText: {
    color: Palette.gray300,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Palette.black,
    borderWidth: 2,
    borderColor: Palette.white,
    padding: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray800,
    paddingBottom: Spacing.two,
  },
  modalWarningTitle: {
    color: Palette.white,
    letterSpacing: 1,
    fontSize: Typography.scale.md.fontSize,
  },
  modalCloseBtn: {
    padding: Spacing.half,
  },
  modalBody: {
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: Palette.white,
    padding: Spacing.two,
  },
  errorText: {
    color: Palette.white,
  },
  modalWarningHeadline: {
    color: Palette.white,
    fontSize: Typography.scale.base.fontSize,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  modalWarningDetail: {
    color: Palette.gray400,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  modalWarningConfirm: {
    color: Palette.white,
    letterSpacing: 0.5,
    marginTop: Spacing.one,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalBtn: {
    flex: 1,
  },
});
