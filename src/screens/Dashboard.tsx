import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Folder,
  Heart,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  Share2,
  Wallet,
} from 'lucide-react-native';
import { ActionModal } from '@/components/ActionModal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { BorderRadius, ColorTheme, Palette, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ActionModalMode, DashboardProps, KantongCardProps } from '@/types';

const StatusBar = ExpoStatusBar as React.ComponentType<
  React.ComponentProps<typeof ExpoStatusBar> & { backgroundColor?: string }
>;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toISOString().split('T')[0];
  } catch {
    return isoString;
  }
}

function getKantongIcon(name: string) {
  const upper = name.toUpperCase();
  if (upper.includes('TABUNG') || upper.includes('SAVE') || upper.includes('INVEST')) {
    return PiggyBank;
  }
  if (upper.includes('KREDIT') || upper.includes('CARD') || upper.includes('HUTANG') || upper.includes('DEBT')) {
    return CreditCard;
  }
  if (upper.includes('DOMPET') || upper.includes('CASH') || upper.includes('OPERASIONAL') || upper.includes('MAIN')) {
    return Wallet;
  }
  return Folder;
}

function KantongCard({ kantong, index, onPress }: KantongCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const IconComponent = getKantongIcon(kantong.name);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300).springify().damping(16)}
    >
      <Pressable
        style={styles.cardContainer}
        onPress={() => onPress?.(kantong)}
        accessibilityRole="button"
        accessibilityLabel={`View Kantong ${kantong.name}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <IconComponent size={18} color={colors.accent} />
            </View>
            <View style={styles.cardTitleBox}>
              <ThemedText weight="semibold" style={styles.cardTitle}>
                {kantong.name}
              </ThemedText>
              <ThemedText variant="caption" style={styles.cardIndex}>
                {`${t('dashboardEnvelopeIndex')} #${String(index + 1).padStart(2, '0')}`}
              </ThemedText>
            </View>
          </View>
          <View style={styles.cardChevronBox}>
            <ChevronRight size={18} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <ThemedText variant="caption" style={styles.balanceLabel}>
            {t('dashboardAvailableBalance')}
          </ThemedText>
          <ThemedText variant="amount" style={styles.cardBalance}>
            {formatCurrency(kantong.balance)}
          </ThemedText>
        </View>

        <View style={styles.cardFooter}>
          <Clock size={12} color={colors.textSecondary} />
          <ThemedText variant="caption" style={styles.cardDate}>
            {`${t('dashboardUpdated')}: ${formatDate(kantong.updatedAt)}`}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Dashboard({
  onNavigateBills,
  onNavigateWishlist,
  onNavigateSettings,
  onSelectKantong,
}: DashboardProps) {
  const colors = useTheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { kantongs, isLoading, loadInitialData, exportFinanceData } = useFinanceStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ActionModalMode>('KANTONG');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportFeedback(null);
    setExportError(null);
    try {
      const result = await exportFinanceData();
      setIsExporting(false);
      if (result.success) {
        setExportFeedback(t('dashboardBackupReady'));
        setTimeout(() => {
          setExportFeedback(null);
        }, 4500);
      } else if (result.error && result.error !== 'SHARING_NOT_AVAILABLE_ON_DEVICE') {
        setExportError(`Export failed: ${result.error}`);
      } else if (result.fileUri) {
        setExportFeedback(`Saved to cache: ${result.fileUri.split('/').pop()}`);
        setTimeout(() => {
          setExportFeedback(null);
        }, 4500);
      }
    } catch (err) {
      setIsExporting(false);
      const msg = err instanceof Error ? err.message : 'Export failed';
      setExportError(`Error: ${msg}`);
    }
  };

  const totalBalance = useMemo(
    () => kantongs.reduce((acc, curr) => acc + curr.balance, 0),
    [kantongs]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const openActionModal = (mode: ActionModalMode) => {
    setModalMode(mode);
    setModalVisible(true);
  };

  const closeActionModal = () => {
    setModalVisible(false);
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* App Bar / Top Navigation */}
      <View style={styles.appBar}>
        <View style={styles.appBarBranding}>
          <View style={styles.brandIconBox}>
            <Wallet size={18} color={Palette.pureWhite} />
          </View>
          <View>
            <ThemedText weight="bold" style={styles.appBarTitle}>
              {t('appName')}
            </ThemedText>
            <ThemedText variant="caption" style={styles.appBarSubtitle}>
              {t('appSubtitle')}
            </ThemedText>
          </View>
        </View>

        <View style={styles.navRow}>
          {Boolean(onNavigateBills) && (
            <Pressable onPress={onNavigateBills} style={styles.navButton}>
              <Receipt size={14} color={colors.textSecondary} />
              <ThemedText variant="caption" weight="semibold" style={styles.navButtonText}>
                {t('navBills')}
              </ThemedText>
            </Pressable>
          )}
          {Boolean(onNavigateWishlist) && (
            <Pressable onPress={onNavigateWishlist} style={styles.navButton}>
              <Heart size={14} color={colors.textSecondary} />
              <ThemedText variant="caption" weight="semibold" style={styles.navButtonText}>
                {t('navWishlist')}
              </ThemedText>
            </Pressable>
          )}
          {Boolean(onNavigateSettings) && (
            <Pressable onPress={onNavigateSettings} style={styles.iconNavButton}>
              <Settings size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Aggregated Total Balance Hero Card */}
      <View style={styles.totalBalanceBox}>
        <View style={styles.totalBalanceHeader}>
          <View style={styles.balanceBadge}>
            <View style={styles.livePulseDot} />
            <ThemedText variant="caption" weight="bold" style={styles.balanceBadgeText}>
              {t('dashboardTotalAssets')}
            </ThemedText>
          </View>
          <View style={styles.walletIconBox}>
            <Wallet size={18} color={colors.accent} />
          </View>
        </View>

        <ThemedText variant="caption" style={styles.totalBalanceLabel}>
          {t('dashboardNetBalance')}
        </ThemedText>
        <ThemedText variant="title" style={styles.totalBalanceAmount}>
          {formatCurrency(totalBalance)}
        </ThemedText>

        <View style={styles.balanceMetaRow}>
          <View style={styles.metaItem}>
            <Folder size={14} color={colors.textSecondary} />
            <ThemedText variant="caption" style={styles.metaText}>
              {`${kantongs.length} ${t('dashboardActiveEnvelopes')}`}
            </ThemedText>
          </View>
          <View style={styles.metaBadge}>
            <ThemedText variant="caption" weight="bold" style={styles.metaBadgeText}>
              {t('dashboardOfflineReady')}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Main Quick Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <ThemedButton
          variant="primary"
          size="md"
          style={styles.actionButton}
          onPress={() => openActionModal('KANTONG')}
        >
          <View style={styles.btnContentRow}>
            <Plus size={16} color={Palette.pureWhite} />
            <ThemedText weight="semibold" style={styles.btnPrimaryText}>
              {t('dashboardNewKantong')}
            </ThemedText>
          </View>
        </ThemedButton>

        <ThemedButton
          variant="secondary"
          size="md"
          style={styles.actionButton}
          onPress={() => openActionModal('TRANSAKSI')}
        >
          <View style={styles.btnContentRow}>
            <ArrowUpRight size={16} color={colors.text} />
            <ThemedText weight="semibold" style={styles.btnSecondaryText}>
              {t('dashboardRecordEntry')}
            </ThemedText>
          </View>
        </ThemedButton>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText weight="bold" style={styles.sectionHeaderTitle}>
          {t('dashboardEnvelopesTitle')}
        </ThemedText>
        <ThemedText variant="caption" style={styles.sectionHeaderCount}>
          {`${kantongs.length} ${t('dashboardTotal')}`}
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText variant="caption">Loading Kantong data...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Folder size={24} color={colors.textSecondary} />
        </View>
        <ThemedText weight="semibold" style={styles.emptyText}>
          {t('dashboardNoEnvelopes')}
        </ThemedText>
        <ThemedText variant="caption" style={styles.emptySubtext}>
          {t('dashboardNoEnvelopesDesc')}
        </ThemedText>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footerSection}>
      <View style={styles.utilityCard}>
        <View style={styles.utilityHeaderRow}>
          <View style={styles.utilityTitleGroup}>
            <Share2 size={16} color={colors.accent} />
            <ThemedText weight="bold" style={styles.utilityTitle}>
              {t('dashboardDataBackup')}
            </ThemedText>
          </View>
          <View style={styles.offlinePill}>
            <ThemedText variant="caption" weight="bold" style={styles.offlinePillText}>
              {t('dashboardOffline')}
            </ThemedText>
          </View>
        </View>

        <ThemedText variant="caption" style={styles.utilityDesc}>
          {t('dashboardExportDesc')}
        </ThemedText>

        <View style={styles.utilityMetaRow}>
          <ThemedText variant="caption" style={styles.utilityMeta}>
            {t('dashboardEngineSqlite')}
          </ThemedText>
          <ThemedText variant="caption" style={styles.utilityMeta}>
            {t('dashboardFormatCsv')}
          </ThemedText>
        </View>

        <ThemedButton
          variant="outline"
          size="md"
          loading={isExporting}
          disabled={isExporting}
          onPress={handleExport}
        >
          <View style={styles.btnContentRow}>
            <Share2 size={16} color={colors.text} />
            <ThemedText weight="semibold" style={styles.exportBtnText}>
              {isExporting ? t('dashboardExporting') : t('dashboardExportBtn')}
            </ThemedText>
          </View>
        </ThemedButton>

        {Boolean(exportFeedback) && (
          <Animated.View
            entering={FadeInDown.duration(300).springify().damping(18)}
            style={styles.feedbackSuccessCard}
          >
            <View style={styles.feedbackIconRow}>
              <CheckCircle2 size={16} color={colors.success} />
              <ThemedText weight="bold" style={styles.feedbackSuccessTitle}>
                {t('dashboardBackupComplete')}
              </ThemedText>
            </View>
            <ThemedText variant="caption" style={styles.feedbackSuccessText}>
              {exportFeedback}
            </ThemedText>
          </Animated.View>
        )}

        {Boolean(exportError) && (
          <Animated.View
            entering={FadeInDown.duration(300).springify().damping(18)}
            style={styles.feedbackErrorCard}
          >
            <View style={styles.feedbackIconRow}>
              <AlertCircle size={16} color={colors.danger} />
              <ThemedText weight="bold" style={styles.feedbackErrorTitle}>
                {t('dashboardExportNotice')}
              </ThemedText>
            </View>
            <ThemedText variant="caption" style={styles.feedbackErrorText}>
              {exportError}
            </ThemedText>
          </Animated.View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor={colors.background} style={themeMode === 'light' ? 'dark' : 'light'} />

      <FlatList
        data={kantongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <KantongCard
            kantong={item}
            index={index}
            onPress={onSelectKantong}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />

      <ActionModal
        visible={modalVisible}
        mode={modalMode}
        onClose={closeActionModal}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: Spacing.three,
      paddingBottom: Spacing.six,
    },
    headerSection: {
      paddingTop: Spacing.one,
      paddingBottom: Spacing.two,
    },
    appBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.two,
      marginBottom: Spacing.three,
    },
    appBarBranding: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    brandIconBox: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appBarTitle: {
      fontSize: Typography.scale.base.fontSize,
      color: colors.text,
    },
    appBarSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.one * 1.5,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconNavButton: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navButtonText: {
      color: colors.text,
    },
    totalBalanceBox: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: Spacing.four,
      marginBottom: Spacing.three,
    },
    totalBalanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.two,
    },
    balanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    livePulseDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    balanceBadgeText: {
      color: colors.text,
      fontSize: Typography.scale.xs.fontSize,
      letterSpacing: 0.5,
    },
    walletIconBox: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalBalanceLabel: {
      color: colors.textSecondary,
      marginBottom: Spacing.half,
    },
    totalBalanceAmount: {
      fontSize: Typography.scale['3xl'].fontSize,
      lineHeight: Typography.scale['3xl'].lineHeight,
      color: colors.text,
      fontFamily: Typography.mono,
      marginBottom: Spacing.two,
    },
    balanceMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: Spacing.two,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      color: colors.textSecondary,
    },
    metaBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundSelected,
    },
    metaBadgeText: {
      color: colors.success,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginBottom: Spacing.four,
    },
    actionButton: {
      flex: 1,
    },
    btnContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.one * 1.5,
    },
    btnPrimaryText: {
      color: Palette.pureWhite,
    },
    btnSecondaryText: {
      color: colors.text,
    },
    exportBtnText: {
      color: colors.text,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: Spacing.one,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: Spacing.two,
    },
    sectionHeaderTitle: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
    },
    sectionHeaderCount: {
      color: colors.textSecondary,
    },
    cardContainer: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: Spacing.three,
      marginBottom: Spacing.two,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitleBox: {
      gap: 2,
    },
    cardTitle: {
      fontSize: Typography.scale.base.fontSize,
      color: colors.text,
    },
    cardIndex: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    cardChevronBox: {
      padding: Spacing.half,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.two,
    },
    cardBody: {
      marginBottom: Spacing.one,
    },
    balanceLabel: {
      color: colors.textSecondary,
      marginBottom: Spacing.half,
      fontSize: Typography.scale.xs.fontSize,
    },
    cardBalance: {
      color: colors.text,
      fontFamily: Typography.mono,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: Spacing.one,
    },
    cardDate: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    emptyContainer: {
      padding: Spacing.five,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.two,
      gap: Spacing.one,
    },
    emptyIconCircle: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.one,
    },
    emptyText: {
      color: colors.text,
    },
    emptySubtext: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    footerSection: {
      marginTop: Spacing.four,
      paddingBottom: Spacing.four,
    },
    utilityCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: Spacing.three,
    },
    utilityHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.one,
    },
    utilityTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    utilityTitle: {
      fontSize: Typography.scale.sm.fontSize,
      color: colors.text,
    },
    offlinePill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    offlinePillText: {
      color: colors.textSecondary,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    utilityDesc: {
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: Spacing.two,
    },
    utilityMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    utilityMeta: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    feedbackSuccessCard: {
      marginTop: Spacing.two,
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.success,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      padding: Spacing.two,
      gap: 4,
    },
    feedbackIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    feedbackSuccessTitle: {
      color: colors.success,
      fontSize: Typography.scale.xs.fontSize,
    },
    feedbackSuccessText: {
      color: colors.text,
      fontSize: Typography.scale.xs.fontSize,
    },
    feedbackErrorCard: {
      marginTop: Spacing.two,
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.danger,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      padding: Spacing.two,
      gap: 4,
    },
    feedbackErrorTitle: {
      color: colors.danger,
      fontSize: Typography.scale.xs.fontSize,
    },
    feedbackErrorText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
  });
