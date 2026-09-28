import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
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
import { WishlistDetailProps, WishlistProgressLog } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLogDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatQuickAmount(amt: number): string {
  if (amt >= 1000) {
    return `+${amt / 1000}k`;
  }
  return `+${amt}`;
}

const QUICK_AMOUNTS = [25000, 50000, 100000, 250000, 500000];

export default function WishlistDetail({ wishlistId, onBack }: Readonly<WishlistDetailProps>) {
  const colors = useTheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const {
    wishlists,
    wishlistLogs,
    fetchWishlistLogs,
    addWishlistProgress,
  } = useFinanceStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const wishlist = useMemo(
    () => wishlists.find((w) => w.id === wishlistId),
    [wishlists, wishlistId],
  );

  const logs = useMemo(
    () => wishlistLogs[wishlistId] ?? [],
    [wishlistLogs, wishlistId],
  );

  useEffect(() => {
    fetchWishlistLogs(wishlistId);
  }, [wishlistId, fetchWishlistLogs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWishlistLogs(wishlistId);
    setIsRefreshing(false);
  };

  const savedAmount = wishlist?.saved_amount ?? 0;
  const targetPrice = wishlist?.price ?? 0;
  const isCompleted = wishlist?.isAchieved || (targetPrice > 0 && savedAmount >= targetPrice);
  const progressRatio = targetPrice > 0 ? Math.min(1, savedAmount / targetPrice) : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));
  const remainingDeficit = Math.max(0, targetPrice - savedAmount);

  const handleOpenLink = () => {
    if (!wishlist?.purchaseLink) return;
    const url = wishlist.purchaseLink.startsWith('http')
      ? wishlist.purchaseLink
      : `https://${wishlist.purchaseLink}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleOpenModal = () => {
    setAmountInput('');
    setModalError(null);
    setIsModalVisible(true);
  };

  const handleQuickAdd = (amount: number) => {
    const current = Number.parseFloat(amountInput.replace(/[^0-9.-]+/g, '')) || 0;
    setAmountInput(String(current + amount));
  };

  const handleSaveProgress = async () => {
    const parsedAmount = Number.parseFloat(amountInput.replace(/[^0-9.-]+/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      setModalError(t('errAmountGreaterZero'));
      return;
    }

    try {
      setIsSaving(true);
      setModalError(null);
      await addWishlistProgress(wishlistId, parsedAmount);
      setIsSaving(false);
      setIsModalVisible(false);
      setAmountInput('');
    } catch (err) {
      setIsSaving(false);
      const msg = err instanceof Error ? err.message : 'Failed to save progress';
      setModalError(msg);
    }
  };

  if (!wishlist) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <StatusBar backgroundColor={colors.background} style={themeMode === 'light' ? 'dark' : 'light'} />
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <ThemedText weight="bold" style={styles.headerTitle}>
            {t('wishlistDetailTitle')}
          </ThemedText>
        </View>

        <View style={styles.notFoundContainer}>
          <Sparkles size={40} color={colors.textSecondary} />
          <ThemedText weight="bold" style={styles.notFoundTitle}>
            {t('wishlistNotFound')}
          </ThemedText>
          <ThemedText variant="caption" style={styles.notFoundDesc}>
            {t('wishlistNotFoundDesc')}
          </ThemedText>
          <ThemedButton
            title={t('wishlistReturnList')}
            variant="primary"
            size="lg"
            onPress={onBack}
            style={styles.returnBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderHeaderComponent = () => (
    <View style={styles.headerContentContainer}>
      {/* Overview Card */}
      <View style={styles.overviewCard}>
        {/* Top Header Row with Title & Badge */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleBox}>
            <ThemedText weight="bold" style={styles.wishlistName}>
              {wishlist.title.toUpperCase()}
            </ThemedText>
            {wishlist.description.trim().length > 0 && (
              <ThemedText variant="caption" style={styles.wishlistDesc}>
                {wishlist.description}
              </ThemedText>
            )}

            {/* Funding Source Tag */}
            {Boolean(wishlist.funding_source) && (
              <View style={styles.fundingSourceTag}>
                <Wallet size={12} color={colors.accent} />
                <ThemedText variant="caption" weight="medium" style={styles.fundingSourceText}>
                  {wishlist.funding_source}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Status Badge */}
          {isCompleted ? (
            <View style={styles.badgeAchieved}>
              <CheckCircle2 size={13} color={colors.success} />
              <ThemedText variant="caption" weight="bold" style={styles.badgeTextAchieved}>
                {t('wishlistAchieved')}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.badgeProgress}>
              <ThemedText variant="caption" weight="bold" style={styles.badgeTextProgress}>
                {`${progressPercent}%`}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Wishlist Image */}
        {wishlist.imageUrl ? (
          <View style={styles.imageBox}>
            <Image
              source={{ uri: wishlist.imageUrl }}
              style={styles.detailImage}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* Store Link if present */}
        {wishlist.purchaseLink ? (
          <Pressable onPress={handleOpenLink} style={styles.storeLinkButton} hitSlop={8}>
            <ExternalLink size={14} color={colors.accent} />
            <ThemedText variant="caption" weight="semibold" style={styles.storeLinkText}>
              {t('wishlistStoreLink')}
            </ThemedText>
          </Pressable>
        ) : null}

        <View style={styles.divider} />

        {/* Price & Saved Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <ThemedText variant="caption" style={styles.statLabel}>
              {t('wishlistTargetPrice')}
            </ThemedText>
            <ThemedText variant="amount" weight="bold" style={styles.statAmount}>
              {formatCurrency(wishlist.price)}
            </ThemedText>
          </View>

          <View style={styles.statCol}>
            <ThemedText variant="caption" style={styles.statLabel}>
              {t('wishlistSavedAmount')}
            </ThemedText>
            <ThemedText
              variant="amount"
              weight="bold"
              style={[styles.statAmount, { color: isCompleted ? colors.success : colors.accent }]}
            >
              {formatCurrency(savedAmount)}
            </ThemedText>
          </View>
        </View>

        {/* Visual Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressMetaRow}>
            <ThemedText variant="caption" style={styles.progressMetaLabel}>
              {t('wishlistProgress')}
            </ThemedText>
            <ThemedText
              variant="caption"
              weight="bold"
              style={isCompleted ? styles.fundedSuccessText : styles.deficitText}
            >
              {isCompleted
                ? t('wishlistFullyFunded')
                : `${t('wishlistRemaining')}: ${formatCurrency(remainingDeficit)}`}
            </ThemedText>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                isCompleted && styles.progressBarFillSuccess,
              ]}
            />
          </View>
        </View>
      </View>

      {/* Action Button: + Update Progress (Nabung) */}
      <View style={styles.actionBtnContainer}>
        <ThemedButton
          variant="primary"
          size="lg"
          onPress={handleOpenModal}
          style={styles.updateProgressBtn}
        >
          <Plus size={18} color={Palette.pureWhite} strokeWidth={2.5} />
          <ThemedText weight="bold" style={styles.updateProgressBtnText}>
            {t('wishlistUpdateProgress')}
          </ThemedText>
        </ThemedButton>
      </View>

      {/* Progress Logs Section Header */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText weight="bold" style={styles.sectionTitle}>
          {t('wishlistProgressLogs')}
        </ThemedText>
        <ThemedText variant="caption" style={styles.sectionCount}>
          {`${logs.length} Log`}
        </ThemedText>
      </View>
    </View>
  );

  const renderLogItem = ({ item, index }: { item: WishlistProgressLog; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(200)}
      style={styles.logItemContainer}
    >
      <View style={styles.logLeft}>
        <View style={styles.logIconBox}>
          <TrendingUp size={16} color={colors.success} />
        </View>
        <View>
          <ThemedText weight="semibold" style={styles.logAmount}>
            {`+ ${formatCurrency(item.amount_added)}`}
          </ThemedText>
          <View style={styles.logDateRow}>
            <Calendar size={11} color={colors.textSecondary} />
            <ThemedText variant="caption" style={styles.logDateText}>
              {formatLogDate(item.created_at)}
            </ThemedText>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderEmptyLogs = () => (
    <View style={styles.emptyLogsBox}>
      <TrendingUp size={32} color={colors.textSecondary} style={{ marginBottom: 8 }} />
      <ThemedText weight="semibold" style={styles.emptyLogsTitle}>
        {t('wishlistNoProgressLogs')}
      </ThemedText>
      <ThemedText variant="caption" style={styles.emptyLogsDesc}>
        {t('wishlistNoProgressLogsDesc')}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor={colors.background} style={themeMode === 'light' ? 'dark' : 'light'} />

      {/* Screen Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <ThemedText weight="bold" numberOfLines={1} style={styles.headerTitle}>
          {wishlist.title.toUpperCase()}
        </ThemedText>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Content List with Logs */}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        ListHeaderComponent={renderHeaderComponent}
        ListEmptyComponent={renderEmptyLogs}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />

      {/* Nabung / Update Progress Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText weight="bold" style={styles.modalTitle}>
                  {t('wishlistNabungModalTitle')}
                </ThemedText>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={styles.modalCloseBtn}
                  hitSlop={8}
                >
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                {Boolean(modalError) && (
                  <View style={styles.errorBox}>
                    <ThemedText variant="caption" style={styles.errorText}>
                      {modalError}
                    </ThemedText>
                  </View>
                )}

                <ThemedText variant="caption" style={styles.modalLabel}>
                  {t('wishlistAmountToAdd')}
                </ThemedText>
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholder={t('wishlistAmountToAddPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  autoFocus
                  style={[styles.modalInput, styles.monoInput]}
                />

                {/* Quick Add Chips */}
                <View style={styles.quickChipsRow}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <Pressable
                      key={amt}
                      onPress={() => handleQuickAdd(amt)}
                      style={styles.quickChip}
                    >
                      <ThemedText variant="caption" weight="medium" style={styles.quickChipText}>
                        {formatQuickAmount(amt)}
                      </ThemedText>
                    </Pressable>
                  ))}
                  {remainingDeficit > 0 && (
                    <Pressable
                      onPress={() => setAmountInput(String(remainingDeficit))}
                      style={[styles.quickChip, styles.quickChipFull]}
                    >
                      <ThemedText variant="caption" weight="bold" style={styles.quickChipFullText}>
                        Full Sisa
                      </ThemedText>
                    </Pressable>
                  )}
                </View>

                {/* Modal Buttons */}
                <View style={styles.modalActionsRow}>
                  <ThemedButton
                    title={t('billsCancel')}
                    variant="outline"
                    size="lg"
                    style={styles.modalActionBtn}
                    onPress={() => setIsModalVisible(false)}
                  />
                  <ThemedButton
                    title={t('wishlistAddProgressBtn')}
                    variant="primary"
                    size="lg"
                    loading={isSaving}
                    style={styles.modalActionBtn}
                    onPress={handleSaveProgress}
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two * 1.5,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      padding: Spacing.one,
      marginRight: Spacing.two,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.scale.base.fontSize,
      color: colors.text,
      letterSpacing: 0.3,
    },
    headerRightSpacer: {
      width: 24,
    },
    listContent: {
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.three,
      paddingBottom: 100,
    },
    headerContentContainer: {
      marginBottom: Spacing.two,
    },
    overviewCard: {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: BorderRadius.lg,
      padding: Spacing.four,
      marginBottom: Spacing.three,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.two,
    },
    cardTitleBox: {
      flex: 1,
      marginRight: Spacing.two,
    },
    wishlistName: {
      fontSize: Typography.scale.lg.fontSize,
      color: colors.text,
      letterSpacing: 0.3,
    },
    wishlistDesc: {
      color: colors.textSecondary,
      marginTop: 4,
    },
    fundingSourceTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.backgroundSelected,
      paddingVertical: 4,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.sm,
      alignSelf: 'flex-start',
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    fundingSourceText: {
      color: colors.accent,
      fontSize: 12,
    },
    badgeAchieved: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingVertical: 4,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    badgeTextAchieved: {
      color: colors.success,
      fontSize: Typography.scale.xs.fontSize,
    },
    badgeProgress: {
      backgroundColor: colors.backgroundSelected,
      paddingVertical: 4,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeTextProgress: {
      color: colors.accent,
      fontSize: Typography.scale.xs.fontSize,
    },
    imageBox: {
      width: '100%',
      height: 180,
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
      marginTop: Spacing.two,
      marginBottom: Spacing.two,
      backgroundColor: colors.backgroundSelected,
    },
    detailImage: {
      width: '100%',
      height: '100%',
    },
    storeLinkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: Spacing.one,
      marginBottom: Spacing.two,
      alignSelf: 'flex-start',
    },
    storeLinkText: {
      color: colors.accent,
      textDecorationLine: 'underline',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.two * 1.25,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    statCol: {
      flex: 1,
    },
    statLabel: {
      color: colors.textSecondary,
      marginBottom: 2,
    },
    statAmount: {
      fontSize: Typography.scale.xl.fontSize,
      color: colors.text,
      fontFamily: Typography.mono,
    },
    progressContainer: {
      marginTop: Spacing.one,
    },
    progressMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressMetaLabel: {
      color: colors.textSecondary,
    },
    fundedSuccessText: {
      color: colors.success,
    },
    deficitText: {
      color: colors.warning,
    },
    progressBarTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.backgroundSelected,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 5,
    },
    progressBarFillSuccess: {
      backgroundColor: colors.success,
    },
    actionBtnContainer: {
      marginBottom: Spacing.four,
    },
    updateProgressBtn: {
      width: '100%',
      height: 52,
      borderRadius: BorderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    updateProgressBtnText: {
      color: Palette.pureWhite,
      fontSize: Typography.scale.base.fontSize,
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
    sectionTitle: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
      letterSpacing: 0.5,
    },
    sectionCount: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    logItemContainer: {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.three,
      marginBottom: Spacing.two,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two * 1.5,
    },
    logIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logAmount: {
      color: colors.success,
      fontSize: Typography.scale.base.fontSize,
      fontFamily: Typography.mono,
    },
    logDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    logDateText: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    emptyLogsBox: {
      paddingVertical: Spacing.five,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyLogsTitle: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
      marginBottom: 4,
    },
    emptyLogsDesc: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    notFoundContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.four,
    },
    notFoundTitle: {
      color: colors.text,
      fontSize: Typography.scale.lg.fontSize,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
    },
    notFoundDesc: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.four,
    },
    returnBtn: {
      minWidth: 200,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.three,
    },
    keyboardAvoid: {
      width: '100%',
      maxWidth: 440,
    },
    modalContainer: {
      width: '100%',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.lg,
      padding: Spacing.four,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: Spacing.two,
      marginBottom: Spacing.three,
    },
    modalTitle: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
      letterSpacing: 0.5,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalBody: {
      gap: Spacing.two,
    },
    modalLabel: {
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    modalInput: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      color: colors.text,
      fontSize: Typography.scale.base.fontSize,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two * 1.5,
    },
    monoInput: {
      fontFamily: Typography.mono,
    },
    quickChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.one * 1.5,
      marginTop: Spacing.one,
      marginBottom: Spacing.two,
    },
    quickChip: {
      paddingHorizontal: Spacing.two,
      paddingVertical: 6,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickChipText: {
      color: colors.text,
      fontSize: 12,
    },
    quickChipFull: {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      borderColor: colors.accent,
    },
    quickChipFullText: {
      color: colors.accent,
      fontSize: 12,
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: Spacing.two,
    },
    modalActionBtn: {
      flex: 1,
    },
    errorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: BorderRadius.md,
      padding: Spacing.two,
      marginBottom: Spacing.two,
    },
    errorText: {
      color: colors.danger,
      fontSize: Typography.scale.xs.fontSize,
    },
  });
