import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Receipt,
  RotateCcw,
  Wallet,
  X,
} from 'lucide-react-native';

const StatusBar = ExpoStatusBar as React.ComponentType<
  React.ComponentProps<typeof ExpoStatusBar> & { backgroundColor?: string }
>;
import { ActionModal } from '@/components/ActionModal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { BorderRadius, ColorTheme, Palette, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { BillsScreenProps, Tagihan, TagihanCardProps } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateDaysRemaining(dueDateStr: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function formatDueDate(isoString: string): string {
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch {
    return isoString;
  }
}

function getCardStyle(
  styles: ReturnType<typeof getStyles>,
  isPaid: boolean,
  isOverdue: boolean,
  isDueSoon: boolean,
) {
  if (isPaid) return styles.cardPaid;
  if (isOverdue) return styles.cardOverdue;
  if (isDueSoon) return styles.cardDueSoon;
  return styles.cardNormal;
}

function getBillIconStyle(
  styles: ReturnType<typeof getStyles>,
  isPaid: boolean,
  isOverdue: boolean,
  isDueSoon: boolean,
) {
  if (isPaid) return styles.billIconPaid;
  if (isOverdue) return styles.billIconOverdue;
  if (isDueSoon) return styles.billIconDueSoon;
  return styles.billIconNormal;
}

function getBillIconColor(
  colors: ReturnType<typeof useTheme>,
  isPaid: boolean,
  isOverdue: boolean,
  isDueSoon: boolean,
) {
  if (isPaid) return colors.textMuted;
  if (isOverdue) return colors.danger;
  if (isDueSoon) return colors.warning;
  return colors.accent;
}

function getAmountStyle(
  styles: ReturnType<typeof getStyles>,
  isPaid: boolean,
  isOverdue: boolean,
) {
  if (isPaid) return styles.amountTextPaid;
  if (isOverdue) return styles.amountTextOverdue;
  return styles.amountTextActive;
}

function getPayVariant(
  isOverdue: boolean,
  isDueSoon: boolean,
): 'danger' | 'primary' | 'outline' {
  if (isOverdue) return 'danger';
  if (isDueSoon) return 'primary';
  return 'outline';
}

function TagihanCard({ tagihan, index, onPayPress }: Readonly<TagihanCardProps>) {
  const colors = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const daysRemaining = calculateDaysRemaining(tagihan.dueDate);
  const isOverdue = !tagihan.isPaid && daysRemaining < 0;
  const isDueSoon = !tagihan.isPaid && daysRemaining >= 0 && daysRemaining <= 3;

  const cardStyle = getCardStyle(styles, tagihan.isPaid, isOverdue, isDueSoon);
  const billIconStyle = getBillIconStyle(styles, tagihan.isPaid, isOverdue, isDueSoon);
  const billIconColor = getBillIconColor(colors, tagihan.isPaid, isOverdue, isDueSoon);
  const amountStyle = getAmountStyle(styles, tagihan.isPaid, isOverdue);
  const payVariant = getPayVariant(isOverdue, isDueSoon);

  const renderBadge = () => {
    if (tagihan.isPaid) {
      return (
        <View style={styles.badgePaid}>
          <CheckCircle2 size={12} color={colors.success} />
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextPaid}>
            {t('billsPaid')}
          </ThemedText>
        </View>
      );
    }
    if (isOverdue) {
      return (
        <View style={styles.badgeOverdue}>
          <AlertCircle size={12} color={colors.danger} />
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextOverdue}>
            {`${t('billsOverdue')} ${Math.abs(daysRemaining)}D`}
          </ThemedText>
        </View>
      );
    }
    if (daysRemaining === 0) {
      return (
        <View style={styles.badgeDueSoon}>
          <Clock size={12} color={colors.warning} />
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextDueSoon}>
            {t('billsDueToday')}
          </ThemedText>
        </View>
      );
    }
    if (isDueSoon) {
      return (
        <View style={styles.badgeDueSoon}>
          <Clock size={12} color={colors.warning} />
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextDueSoon}>
            {`${t('billsDueSoon')} ${daysRemaining}D`}
          </ThemedText>
        </View>
      );
    }
    return (
      <View style={styles.badgeNormal}>
        <Calendar size={12} color={colors.textSecondary} />
        <ThemedText variant="caption" style={styles.badgeTextNormal}>
          {`IN ${daysRemaining}D`}
        </ThemedText>
      </View>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300).springify().damping(15)}
      style={[styles.cardContainer, cardStyle]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBox}>
          <View style={styles.titleIconRow}>
            <View
              style={[
                styles.billIconBox,
                billIconStyle,
              ]}
            >
              <Receipt
                size={16}
                color={billIconColor}
              />
            </View>
            <View style={styles.titleTextContainer}>
              <ThemedText
                weight="bold"
                style={[
                  styles.cardTitle,
                  tagihan.isPaid && styles.titlePaidText,
                ]}
              >
                {tagihan.title.toUpperCase()}
              </ThemedText>
              {tagihan.isRecurring && (
                <View style={styles.recurringBox}>
                  <RotateCcw size={10} color={colors.textSecondary} />
                  <ThemedText variant="caption" style={styles.recurringLabel}>
                    {tagihan.frequency ?? 'MONTHLY'}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        {renderBadge()}
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <View>
          <ThemedText variant="caption" style={styles.amountLabel}>
            {t('billsAmountDue')}
          </ThemedText>
          <ThemedText
            variant="amount"
            style={[
              styles.amountText,
              amountStyle,
            ]}
          >
            {formatCurrency(tagihan.amount)}
          </ThemedText>
        </View>

        {!tagihan.isPaid && onPayPress && (
          <ThemedButton
            title={t('billsPayNow')}
            size="sm"
            variant={payVariant}
            onPress={() => onPayPress(tagihan)}
            style={styles.payButton}
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerDateRow}>
          <Clock size={12} color={colors.textMuted} />
          <ThemedText variant="caption" style={styles.footerDateText}>
            {`${t('billsDeadline')}: ${formatDueDate(tagihan.dueDate)}`}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

export default function BillsScreen({ onBack }: Readonly<BillsScreenProps>) {
  const colors = useTheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { tagihans, kantongs, isLoading, loadTagihans, loadInitialData, payTagihan } =
    useFinanceStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState<Tagihan | null>(null);
  const [selectedKantongId, setSelectedKantongId] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  useEffect(() => {
    loadTagihans();
    if (kantongs.length === 0) {
      loadInitialData();
    }
  }, [loadTagihans, loadInitialData, kantongs.length]);

  const sortedTagihans = useMemo(() => {
    return [...tagihans].sort((a, b) => {
      // Unpaid first
      if (a.isPaid !== b.isPaid) {
        return a.isPaid ? 1 : -1;
      }
      // Earliest due date first
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tagihans]);

  const { totalUnpaidAmount, overdueCount, upcomingCount } = useMemo(() => {
    let unpaidTotal = 0;
    let overdue = 0;
    let upcoming = 0;

    tagihans.forEach((t) => {
      if (!t.isPaid) {
        unpaidTotal += t.amount;
        const days = calculateDaysRemaining(t.dueDate);
        if (days < 0) {
          overdue += 1;
        } else if (days <= 3) {
          upcoming += 1;
        }
      }
    });

    return {
      totalUnpaidAmount: unpaidTotal,
      overdueCount: overdue,
      upcomingCount: upcoming,
    };
  }, [tagihans]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTagihans();
    setIsRefreshing(false);
  };

  const handleOpenPayModal = (tagihan: Tagihan) => {
    setSelectedTagihan(tagihan);
    setPayError(null);
    if (kantongs.length > 0) {
      setSelectedKantongId(kantongs[0].id);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTagihan || !selectedKantongId) {
      setPayError(t('errSelectKantong'));
      return;
    }

    try {
      setIsPaying(true);
      setPayError(null);
      await payTagihan(selectedTagihan.id, selectedKantongId);
      setIsPaying(false);
      setSelectedTagihan(null);
    } catch (err) {
      setIsPaying(false);
      const msg = err instanceof Error ? err.message : 'PAYMENT FAILED';
      setPayError(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.appBar}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.navButton} hitSlop={8}>
            <ArrowLeft size={16} color={colors.text} />
            <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
              {t('navDashboard').toUpperCase()}
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText variant="caption" weight="bold" style={styles.appBarTitle}>
            {t('billsPageTitle')}
          </ThemedText>
        )}
        <View style={styles.countBadge}>
          <ThemedText variant="caption" style={styles.activeTag}>
            {`${t('dashboardTotal').toUpperCase()}: ${tagihans.length}`}
          </ThemedText>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <ThemedText variant="caption" style={styles.summaryLabel}>
          {t('billsTotalUnpaid')}
        </ThemedText>
        <ThemedText variant="amount" style={styles.summaryAmount}>
          {formatCurrency(totalUnpaidAmount)}
        </ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.metaBadgeOverdue}>
            <AlertCircle size={12} color={colors.danger} />
            <ThemedText variant="caption" weight="bold" style={styles.metaWarning}>
              {`${t('billsOverdue')}: ${overdueCount}`}
            </ThemedText>
          </View>
          <View style={styles.metaBadgeDueSoon}>
            <Clock size={12} color={colors.warning} />
            <ThemedText variant="caption" weight="bold" style={styles.metaAlert}>
              {`${t('billsDueSoon')} 3D: ${upcomingCount}`}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <ThemedButton
          title={t('billsNewBill')}
          variant="primary"
          size="lg"
          style={styles.actionButton}
          onPress={() => setIsActionModalOpen(true)}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <ThemedText weight="bold" style={styles.sectionTitle}>
          {t('billsScheduleTitle')}
        </ThemedText>
        <ThemedText variant="caption" style={styles.sectionCount}>
          {t('billsPrioritySort')}
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText variant="caption" style={styles.emptySubtext}>
            {t('billsLoading')}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <CheckCircle2 size={36} color={colors.success} />
        <ThemedText weight="bold" style={styles.emptyText}>
          {t('billsNoBills')}
        </ThemedText>
        <ThemedText variant="caption" style={styles.emptySubtext}>
          {t('billsNoBillsDesc')}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor={colors.background} style={themeMode === 'light' ? 'dark' : 'light'} />

      <FlatList
        data={sortedTagihans}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TagihanCard
            tagihan={item}
            index={index}
            onPayPress={handleOpenPayModal}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
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

      <ActionModal
        visible={isActionModalOpen}
        mode="TAGIHAN"
        onClose={() => setIsActionModalOpen(false)}
      />

      {/* Payment Selection Modal */}
      <Modal
        visible={Boolean(selectedTagihan)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTagihan(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedTagihan(null)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Receipt size={18} color={colors.accent} />
                <ThemedText weight="bold" style={styles.modalTitle}>
                  {t('billsConfirmPayment')}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setSelectedTagihan(null)}
                style={styles.modalCloseButton}
                hitSlop={8}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selectedTagihan && (
              <View style={styles.modalContent}>
                <View style={styles.modalSummaryBox}>
                  <ThemedText variant="caption" style={styles.modalLabel}>
                    {t('modalBillTitle')}
                  </ThemedText>
                  <ThemedText weight="bold" style={styles.modalValue}>
                    {selectedTagihan.title.toUpperCase()}
                  </ThemedText>

                  <ThemedText variant="caption" style={styles.modalLabel}>
                    {t('billsAmountDue')}
                  </ThemedText>
                  <ThemedText variant="amount" style={styles.modalPriceValue}>
                    {formatCurrency(selectedTagihan.amount)}
                  </ThemedText>
                </View>

                <ThemedText variant="caption" style={styles.modalLabel}>
                  {t('billsSelectKantong')}
                </ThemedText>
                {kantongs.length === 0 ? (
                  <View style={styles.noKantongNotice}>
                    <ThemedText variant="caption" style={styles.noKantongText}>
                      {t('modalNoKantong')}
                    </ThemedText>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.kantongSelectRow}
                  >
                    {kantongs.map((k) => {
                      const isSelected = k.id === selectedKantongId;
                      return (
                        <Pressable
                          key={k.id}
                          onPress={() => setSelectedKantongId(k.id)}
                          style={[
                            styles.kantongOption,
                            isSelected && styles.kantongOptionSelected,
                          ]}
                        >
                          <Wallet
                            size={14}
                            color={isSelected ? Palette.pureWhite : colors.textSecondary}
                          />
                          <ThemedText
                            variant="caption"
                            weight={isSelected ? 'bold' : 'regular'}
                            style={[
                              styles.kantongOptionText,
                              isSelected && styles.kantongOptionTextSelected,
                            ]}
                          >
                            {`${k.name} (${formatCurrency(k.balance)})`}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                {Boolean(payError) && (
                  <View style={styles.payErrorBox}>
                    <ThemedText variant="caption" style={styles.payErrorText}>
                      {payError}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <ThemedButton
                    title={t('billsConfirmPay')}
                    variant="primary"
                    size="lg"
                    disabled={kantongs.length === 0}
                    loading={isPaying}
                    onPress={handleConfirmPayment}
                  />
                  <ThemedButton
                    title={t('billsCancel')}
                    variant="outline"
                    size="md"
                    onPress={() => setSelectedTagihan(null)}
                  />
                </View>
              </View>
            )}
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
    listContent: {
      paddingHorizontal: Spacing.three,
      paddingBottom: Spacing.six * 2,
    },
    headerSection: {
      paddingTop: Spacing.two,
      paddingBottom: Spacing.three,
    },
    appBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: Spacing.two,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      marginBottom: Spacing.three,
    },
    appBarTitle: {
      letterSpacing: 1,
      color: colors.text,
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
    countBadge: {
      paddingVertical: 2,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeTag: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    summaryBox: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: Spacing.three * 1.25,
      marginBottom: Spacing.three,
    },
    summaryLabel: {
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: Spacing.one,
      textTransform: 'uppercase',
    },
    summaryAmount: {
      fontSize: Typography.scale['3xl'].fontSize,
      lineHeight: Typography.scale['3xl'].lineHeight,
      color: colors.text,
      marginBottom: Spacing.three,
    },
    metaRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingTop: Spacing.two,
    },
    metaBadgeOverdue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      paddingVertical: 4,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    metaWarning: {
      color: colors.danger,
      fontSize: Typography.scale.xs.fontSize,
    },
    metaBadgeDueSoon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      paddingVertical: 4,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    metaAlert: {
      color: colors.warning,
      fontSize: Typography.scale.xs.fontSize,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      marginBottom: Spacing.three,
    },
    actionButton: {
      flex: 1,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: Spacing.one,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
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
    cardContainer: {
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      padding: Spacing.three,
      marginBottom: Spacing.two * 1.5,
    },
    cardNormal: {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
    },
    cardOverdue: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    cardDueSoon: {
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    cardPaid: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.cardBorder,
      opacity: 0.75,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitleBox: {
      flex: 1,
      marginRight: Spacing.two,
    },
    titleIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    billIconBox: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    billIconNormal: {
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
    },
    billIconOverdue: {
      backgroundColor: 'rgba(239, 68, 68, 0.16)',
    },
    billIconDueSoon: {
      backgroundColor: 'rgba(245, 158, 11, 0.16)',
    },
    billIconPaid: {
      backgroundColor: colors.backgroundSelected,
    },
    titleTextContainer: {
      flex: 1,
    },
    cardTitle: {
      fontSize: Typography.scale.base.fontSize,
      color: colors.text,
      letterSpacing: 0.3,
    },
    titlePaidText: {
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    recurringBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    recurringLabel: {
      fontSize: Typography.scale.xs.fontSize,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    badgePaid: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingVertical: 3,
      paddingHorizontal: Spacing.one * 1.5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    badgeTextPaid: {
      color: colors.success,
      fontSize: Typography.scale.xs.fontSize,
    },
    badgeOverdue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      paddingVertical: 3,
      paddingHorizontal: Spacing.one * 1.5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    badgeTextOverdue: {
      color: colors.danger,
      fontSize: Typography.scale.xs.fontSize,
    },
    badgeDueSoon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      paddingVertical: 3,
      paddingHorizontal: Spacing.one * 1.5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    badgeTextDueSoon: {
      color: colors.warning,
      fontSize: Typography.scale.xs.fontSize,
    },
    badgeNormal: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.backgroundSelected,
      paddingVertical: 3,
      paddingHorizontal: Spacing.one * 1.5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeTextNormal: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: Spacing.two,
    },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    amountLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      marginBottom: 2,
    },
    amountText: {
      fontSize: Typography.scale.xl.fontSize,
      lineHeight: Typography.scale.xl.lineHeight,
    },
    amountTextActive: {
      color: colors.text,
    },
    amountTextOverdue: {
      color: colors.danger,
    },
    amountTextPaid: {
      color: colors.textMuted,
    },
    payButton: {
      minWidth: 90,
    },
    cardFooter: {
      marginTop: Spacing.two,
    },
    footerDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    footerDateText: {
      color: colors.textMuted,
      fontSize: Typography.scale.xs.fontSize,
    },
    emptyContainer: {
      padding: Spacing.six,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.three,
      gap: Spacing.two,
    },
    emptyText: {
      color: colors.text,
      fontSize: Typography.scale.base.fontSize,
    },
    emptySubtext: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius['2xl'],
      borderTopRightRadius: BorderRadius['2xl'],
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingBottom: Spacing.six,
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
    modalTitle: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
      letterSpacing: 0.5,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      padding: Spacing.three,
      gap: Spacing.two,
    },
    modalSummaryBox: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: BorderRadius.md,
      padding: Spacing.three,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      textTransform: 'uppercase',
      marginTop: Spacing.one,
    },
    modalValue: {
      color: colors.text,
      fontSize: Typography.scale.base.fontSize,
      marginBottom: Spacing.two,
    },
    modalPriceValue: {
      color: colors.accent,
      fontSize: Typography.scale.xl.fontSize,
      lineHeight: Typography.scale.xl.lineHeight,
    },
    noKantongNotice: {
      padding: Spacing.two,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noKantongText: {
      color: colors.textMuted,
    },
    kantongSelectRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      paddingVertical: Spacing.half,
    },
    kantongOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.one * 1.5,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSelected,
      paddingVertical: Spacing.one * 1.5,
      paddingHorizontal: Spacing.two * 1.5,
      borderRadius: BorderRadius.full,
    },
    kantongOptionSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    kantongOptionText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    kantongOptionTextSelected: {
      color: Palette.pureWhite,
    },
    payErrorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: BorderRadius.md,
      padding: Spacing.two,
    },
    payErrorText: {
      color: colors.danger,
    },
    modalActions: {
      gap: Spacing.two,
      marginTop: Spacing.two,
    },
  });
