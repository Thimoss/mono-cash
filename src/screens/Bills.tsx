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

const StatusBar = ExpoStatusBar as React.ComponentType<
  React.ComponentProps<typeof ExpoStatusBar> & { backgroundColor?: string }
>;
import { ActionModal } from '@/components/ActionModal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Palette, Spacing, Typography } from '@/constants/theme';
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

function TagihanCard({ tagihan, index, onPayPress }: TagihanCardProps) {
  const daysRemaining = calculateDaysRemaining(tagihan.dueDate);
  const isOverdue = !tagihan.isPaid && daysRemaining < 0;
  const isDueSoon = !tagihan.isPaid && daysRemaining >= 0 && daysRemaining <= 3;
  const isWarning = isOverdue || isDueSoon;

  const cardStyle = tagihan.isPaid
    ? styles.cardPaid
    : isWarning
    ? styles.cardWarning
    : styles.cardNormal;

  const textColor = isWarning ? Palette.black : tagihan.isPaid ? Palette.gray500 : Palette.white;
  const mutedTextColor = isWarning ? Palette.gray700 : tagihan.isPaid ? Palette.gray600 : Palette.gray400;

  const renderBadgeText = () => {
    if (tagihan.isPaid) {
      return '[ PAID ]';
    }
    if (isOverdue) {
      return `[ OVERDUE ${Math.abs(daysRemaining)}D ]`;
    }
    if (daysRemaining === 0) {
      return '[ DUE TODAY ]';
    }
    return `[ DUE IN ${daysRemaining}D ]`;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300).springify().damping(15)}
      style={[styles.cardContainer, cardStyle]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBox}>
          <ThemedText
            weight="bold"
            style={[styles.cardTitle, { color: textColor }]}
          >
            {tagihan.title.toUpperCase()}
          </ThemedText>
          {tagihan.isRecurring && (
            <ThemedText
              variant="caption"
              style={[styles.recurringLabel, { color: mutedTextColor }]}
            >
              {`// RECURRING: ${tagihan.frequency ?? 'MONTHLY'}`}
            </ThemedText>
          )}
        </View>

        <View
          style={[
            styles.badgeContainer,
            isWarning && styles.badgeContainerWarning,
            tagihan.isPaid && styles.badgeContainerPaid,
          ]}
        >
          <ThemedText
            variant="caption"
            weight="bold"
            style={[
              styles.badgeText,
              isWarning ? styles.badgeTextWarning : tagihan.isPaid ? styles.badgeTextPaid : styles.badgeTextNormal,
            ]}
          >
            {renderBadgeText()}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.cardDivider, isWarning ? styles.dividerWarning : styles.dividerNormal]} />

      <View style={styles.cardBody}>
        <View>
          <ThemedText variant="caption" style={{ color: mutedTextColor }}>
            AMOUNT DUE
          </ThemedText>
          <ThemedText variant="amount" style={[styles.amountText, { color: textColor }]}>
            {formatCurrency(tagihan.amount)}
          </ThemedText>
        </View>

        {!tagihan.isPaid && onPayPress && (
          <ThemedButton
            title="PAY"
            size="sm"
            variant={isWarning ? 'secondary' : 'primary'}
            onPress={() => onPayPress(tagihan)}
            style={styles.payButton}
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <ThemedText variant="caption" style={{ color: mutedTextColor }}>
          {`DEADLINE: ${formatDueDate(tagihan.dueDate)}`}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

export default function BillsScreen({ onBack }: BillsScreenProps) {
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
      setPayError('SELECT A KANTONG FOR DEDUCTION');
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
          <Pressable onPress={onBack} style={styles.navButton}>
            <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
              [ &larr; DASHBOARD ]
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText variant="caption" style={styles.appBarTitle}>
            MONOCASH // BILLS
          </ThemedText>
        )}
        <ThemedText variant="caption" style={styles.activeTag}>
          {`TOTAL: ${tagihans.length}`}
        </ThemedText>
      </View>

      <View style={styles.summaryBox}>
        <ThemedText variant="caption" style={styles.summaryLabel}>
          TOTAL UNPAID OBLIGATIONS
        </ThemedText>
        <ThemedText variant="title" style={styles.summaryAmount}>
          {formatCurrency(totalUnpaidAmount)}
        </ThemedText>
        <View style={styles.metaRow}>
          <ThemedText variant="caption" style={styles.metaWarning}>
            {`OVERDUE: ${overdueCount}`}
          </ThemedText>
          <ThemedText variant="caption" style={styles.metaAlert}>
            {`DUE <= 3D: ${upcomingCount}`}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <ThemedButton
          title="+ TAGIHAN"
          variant="primary"
          size="sm"
          style={styles.actionButton}
          onPress={() => setIsActionModalOpen(true)}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <ThemedText weight="bold" style={styles.sectionTitle}>
          UPCOMING BILLS SCHEDULE
        </ThemedText>
        <ThemedText variant="caption" style={styles.sectionCount}>
          PRIORITY SORT
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText variant="caption">LOADING BILLS DATA...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <ThemedText variant="caption" style={styles.emptyText}>
          NO BILLS RECORDED
        </ThemedText>
        <ThemedText variant="caption" style={styles.emptySubtext}>
          ALL OBLIGATIONS ARE CLEARED
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor="#000000" style="light" />

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Palette.white}
            colors={[Palette.black]}
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
              <ThemedText weight="bold" style={styles.modalTitle}>
                // CONFIRM BILL PAYMENT
              </ThemedText>
              <Pressable onPress={() => setSelectedTagihan(null)}>
                <ThemedText variant="caption">[ ESC ]</ThemedText>
              </Pressable>
            </View>

            {selectedTagihan && (
              <View style={styles.modalContent}>
                <ThemedText variant="caption" style={styles.modalLabel}>
                  BILL TITLE
                </ThemedText>
                <ThemedText weight="bold" style={styles.modalValue}>
                  {selectedTagihan.title.toUpperCase()}
                </ThemedText>

                <ThemedText variant="caption" style={styles.modalLabel}>
                  AMOUNT
                </ThemedText>
                <ThemedText variant="amount" style={styles.modalValue}>
                  {formatCurrency(selectedTagihan.amount)}
                </ThemedText>

                <ThemedText variant="caption" style={styles.modalLabel}>
                  DEDUCT FROM KANTONG
                </ThemedText>
                {kantongs.length === 0 ? (
                  <ThemedText variant="caption" style={styles.noKantongText}>
                    NO KANTONG AVAILABLE. CREATE ONE FIRST.
                  </ThemedText>
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

                {payError && (
                  <View style={styles.payErrorBox}>
                    <ThemedText variant="caption" style={styles.payErrorText}>
                      {payError}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <ThemedButton
                    title="CONFIRM & PAY"
                    variant="primary"
                    size="lg"
                    disabled={kantongs.length === 0}
                    loading={isPaying}
                    onPress={handleConfirmPayment}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.black,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
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
    borderBottomColor: Palette.gray800,
    marginBottom: Spacing.three,
  },
  appBarTitle: {
    letterSpacing: 1.5,
    color: Palette.white,
    fontWeight: Typography.weight.semibold,
  },
  navButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Palette.gray700,
    backgroundColor: Colors.dark.backgroundElement,
  },
  navButtonText: {
    color: Palette.white,
    letterSpacing: 1,
  },
  activeTag: {
    color: Palette.gray400,
  },
  summaryBox: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  summaryLabel: {
    color: Palette.gray400,
    letterSpacing: 1,
    marginBottom: Spacing.half,
  },
  summaryAmount: {
    fontSize: Typography.scale['3xl'].fontSize,
    lineHeight: Typography.scale['3xl'].lineHeight,
    color: Palette.white,
    marginBottom: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.gray800,
    paddingTop: Spacing.one,
  },
  metaWarning: {
    color: Palette.white,
    fontWeight: Typography.weight.bold,
  },
  metaAlert: {
    color: Palette.gray400,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.four,
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
    borderBottomColor: Palette.gray700,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    color: Palette.white,
    fontSize: Typography.scale.sm.fontSize,
    letterSpacing: 1,
  },
  sectionCount: {
    color: Palette.gray400,
  },
  cardContainer: {
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  cardNormal: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
  },
  cardWarning: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  cardPaid: {
    backgroundColor: '#0A0A0A',
    borderColor: Palette.gray800,
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleBox: {
    flex: 1,
    marginRight: Spacing.two,
  },
  cardTitle: {
    fontSize: Typography.scale.base.fontSize,
    letterSpacing: 0.5,
  },
  recurringLabel: {
    fontSize: Typography.scale.xs.fontSize,
    marginTop: 2,
  },
  badgeContainer: {
    borderWidth: 1,
    borderColor: Palette.gray700,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeContainerWarning: {
    backgroundColor: Palette.black,
    borderColor: Palette.black,
  },
  badgeContainerPaid: {
    borderColor: Palette.gray800,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 0.5,
  },
  badgeTextNormal: {
    color: Palette.white,
  },
  badgeTextWarning: {
    color: Palette.white,
  },
  badgeTextPaid: {
    color: Palette.gray500,
  },
  cardDivider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  dividerNormal: {
    backgroundColor: Palette.gray800,
  },
  dividerWarning: {
    backgroundColor: Palette.gray300,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.one,
  },
  amountText: {
    fontSize: Typography.scale.xl.fontSize,
    lineHeight: Typography.scale.xl.lineHeight,
  },
  payButton: {
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  cardFooter: {
    marginTop: Spacing.one,
  },
  emptyContainer: {
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: Palette.gray800,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  emptyText: {
    color: Palette.gray300,
    marginBottom: Spacing.half,
  },
  emptySubtext: {
    color: Palette.gray600,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalSheet: {
    backgroundColor: Palette.black,
    borderTopWidth: 1,
    borderColor: Palette.white,
    paddingBottom: Spacing.six,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray800,
  },
  modalTitle: {
    color: Palette.white,
    fontSize: Typography.scale.sm.fontSize,
    letterSpacing: 1,
  },
  modalContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modalLabel: {
    color: Palette.gray400,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 1,
    marginTop: Spacing.one,
  },
  modalValue: {
    color: Palette.white,
  },
  kantongSelectRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  kantongOption: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two * 1.5,
  },
  kantongOptionSelected: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  kantongOptionText: {
    color: Palette.white,
  },
  kantongOptionTextSelected: {
    color: Palette.black,
  },
  noKantongText: {
    color: Palette.gray500,
  },
  payErrorBox: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Palette.white,
    padding: Spacing.two,
    marginTop: Spacing.one,
  },
  payErrorText: {
    color: Palette.white,
  },
  modalActions: {
    marginTop: Spacing.three,
  },
});
