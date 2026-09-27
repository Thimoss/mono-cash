import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
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
import { useFinanceStore } from '@/store/useFinanceStore';
import { Wishlist, WishlistCardProps, WishlistScreenProps } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch {
    return isoString;
  }
}

type WishlistFilter = 'ALL' | 'PENDING' | 'ACHIEVED';

function WishlistCard({
  wishlist,
  index,
  totalBalance = 0,
  onToggleAchieve,
  onDelete,
}: WishlistCardProps) {
  const colors = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isAffordable = totalBalance >= wishlist.price;
  const progressRatio = wishlist.price > 0 ? Math.min(1, totalBalance / wishlist.price) : 1;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));
  const deficit = Math.max(0, wishlist.price - totalBalance);

  const cardStyle = wishlist.isAchieved
    ? styles.cardAchieved
    : isAffordable
    ? styles.cardAffordable
    : styles.cardNormal;

  const handleOpenLink = () => {
    if (!wishlist.purchaseLink) return;
    const url = wishlist.purchaseLink.startsWith('http')
      ? wishlist.purchaseLink
      : `https://${wishlist.purchaseLink}`;
    Linking.openURL(url).catch(() => {});
  };

  const renderBadge = () => {
    if (wishlist.isAchieved) {
      return (
        <View style={styles.badgeAchieved}>
          <CheckCircle2 size={12} color={colors.success} />
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextAchieved}>
            ACHIEVED
          </ThemedText>
        </View>
      );
    }

    if (isAffordable) {
      return (
        <View style={styles.badgeAffordable}>
          <Sparkles size={12} color={colors.success} />
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextAffordable}>
            READY TO BUY
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.badgeProgress}>
        <ThemedText variant="caption" weight="bold" style={styles.badgeTextProgress}>
          {`${progressPercent}% FUNDED`}
        </ThemedText>
      </View>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300).springify().damping(15)}
      style={[styles.cardContainer, cardStyle]}
    >
      {/* Top Header: Title and Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBox}>
          <ThemedText
            weight="bold"
            style={[
              styles.cardTitle,
              wishlist.isAchieved && styles.titleAchieved,
            ]}
          >
            {wishlist.title.toUpperCase()}
          </ThemedText>
          {wishlist.description.trim().length > 0 && (
            <ThemedText variant="caption" style={styles.cardDescription}>
              {wishlist.description}
            </ThemedText>
          )}
        </View>
        {renderBadge()}
      </View>

      {/* Image Preview or Fallback Box */}
      {wishlist.imageUrl ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: wishlist.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={styles.cardDivider} />

      {/* Price & Target Info */}
      <View style={styles.priceRow}>
        <View>
          <ThemedText variant="caption" style={styles.priceLabel}>
            TARGET PRICE
          </ThemedText>
          <ThemedText
            variant="amount"
            style={[
              styles.amountText,
              wishlist.isAchieved && styles.amountTextAchieved,
            ]}
          >
            {formatCurrency(wishlist.price)}
          </ThemedText>
        </View>

        {wishlist.purchaseLink ? (
          <Pressable onPress={handleOpenLink} style={styles.linkButton} hitSlop={8}>
            <ExternalLink size={13} color={colors.accent} />
            <ThemedText variant="caption" weight="semibold" style={styles.linkText}>
              STORE LINK
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {/* Progress Bar & Stackup Comparison */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeaderRow}>
          <ThemedText variant="caption" style={styles.progressLabel}>
            {wishlist.isAchieved
              ? `Acquired on ${formatDate(wishlist.createdAt)}`
              : `Wallet Coverage: ${progressPercent}%`}
          </ThemedText>
          {!wishlist.isAchieved && (
            <ThemedText
              variant="caption"
              weight="bold"
              style={isAffordable ? styles.fundedSuccessText : styles.deficitText}
            >
              {isAffordable ? 'Fully Funded' : `Deficit: ${formatCurrency(deficit)}`}
            </ThemedText>
          )}
        </View>

        {!wishlist.isAchieved && (
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                isAffordable && styles.progressBarFillComplete,
              ]}
            />
          </View>
        )}
      </View>

      {/* Card Actions */}
      <View style={styles.cardActionsRow}>
        {onToggleAchieve && (
          <ThemedButton
            title={wishlist.isAchieved ? 'MARK AS UNFINISHED' : '✓ MARK ACHIEVED'}
            size="sm"
            variant={wishlist.isAchieved ? 'ghost' : isAffordable ? 'success' : 'outline'}
            onPress={() => onToggleAchieve(wishlist)}
            style={styles.achieveButton}
          />
        )}

        {onDelete && (
          <Pressable
            onPress={() => onDelete(wishlist)}
            style={({ pressed }) => [styles.deleteIconButton, pressed && styles.deleteIconPressed]}
            hitSlop={8}
          >
            <Trash2 size={16} color={colors.danger} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export default function WishlistScreen({ onBack }: WishlistScreenProps) {
  const colors = useTheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const {
    wishlists,
    kantongs,
    isLoading,
    loadWishlists,
    loadInitialData,
    toggleAchievedWishlist,
    deleteWishlist,
  } = useFinanceStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<WishlistFilter>('ALL');
  const [itemToDelete, setItemToDelete] = useState<Wishlist | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  useEffect(() => {
    loadWishlists();
    if (kantongs.length === 0) {
      loadInitialData();
    }
  }, [loadWishlists, loadInitialData, kantongs.length]);

  const totalBalance = useMemo(() => {
    return kantongs.reduce((sum, k) => sum + k.balance, 0);
  }, [kantongs]);

  const { totalTargetCost, achievedCount, activeCount } = useMemo(() => {
    let cost = 0;
    let achieved = 0;
    let active = 0;

    wishlists.forEach((w) => {
      if (w.isAchieved) {
        achieved += 1;
      } else {
        cost += w.price;
        active += 1;
      }
    });

    return {
      totalTargetCost: cost,
      achievedCount: achieved,
      activeCount: active,
    };
  }, [wishlists]);

  const overallCoveragePercent = useMemo(() => {
    if (totalTargetCost === 0) return 100;
    return Math.min(100, Math.round((totalBalance / totalTargetCost) * 100));
  }, [totalBalance, totalTargetCost]);

  const filteredWishlists = useMemo(() => {
    return wishlists.filter((w) => {
      if (activeFilter === 'PENDING') return !w.isAchieved;
      if (activeFilter === 'ACHIEVED') return w.isAchieved;
      return true;
    });
  }, [wishlists, activeFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadWishlists(), loadInitialData()]);
    setIsRefreshing(false);
  };

  const handleToggleAchieve = async (item: Wishlist) => {
    try {
      await toggleAchievedWishlist(item.id);
    } catch {
      // Error handled by store
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteWishlist(itemToDelete.id);
      setItemToDelete(null);
    } catch {
      // Error handled by store
    }
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* App Bar Navigation */}
      <View style={styles.appBar}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.navButton} hitSlop={8}>
            <ArrowLeft size={16} color={colors.text} />
            <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
              DASHBOARD
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText variant="caption" weight="bold" style={styles.appBarTitle}>
            MONOCASH // WISHLIST
          </ThemedText>
        )}
        <View style={styles.countBadge}>
          <ThemedText variant="caption" style={styles.activeTag}>
            {`TOTAL: ${wishlists.length}`}
          </ThemedText>
        </View>
      </View>

      {/* Aggregate Balance vs Wishlist Stackup Box */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryTopRow}>
          <View>
            <ThemedText variant="caption" style={styles.summaryLabel}>
              AGGREGATED KANTONG BALANCE
            </ThemedText>
            <ThemedText variant="amount" style={styles.summaryAmount}>
              {formatCurrency(totalBalance)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCompareRow}>
          <View style={styles.compareItem}>
            <ThemedText variant="caption" style={styles.compareLabel}>
              ACTIVE TARGETS COST
            </ThemedText>
            <ThemedText weight="bold" style={styles.compareValue}>
              {formatCurrency(totalTargetCost)}
            </ThemedText>
          </View>
          <View style={styles.compareItemRight}>
            <ThemedText variant="caption" style={styles.compareLabel}>
              OVERALL COVERAGE
            </ThemedText>
            <ThemedText weight="bold" style={styles.compareValue}>
              {`${overallCoveragePercent}%`}
            </ThemedText>
          </View>
        </View>

        {/* Global Progress Bar */}
        <View style={styles.globalProgressBarTrack}>
          <View
            style={[
              styles.globalProgressBarFill,
              { width: `${overallCoveragePercent}%` },
            ]}
          />
        </View>

        <View style={styles.summaryFooterRow}>
          <ThemedText variant="caption" style={styles.summaryFooterText}>
            {`Achieved: ${achievedCount} / ${wishlists.length}`}
          </ThemedText>
          <ThemedText variant="caption" style={styles.summaryFooterText}>
            {totalBalance >= totalTargetCost
              ? 'Status: 100% Covered'
              : `Deficit: -${formatCurrency(totalTargetCost - totalBalance)}`}
          </ThemedText>
        </View>
      </View>

      {/* Action Button Row */}
      <View style={styles.actionButtonsRow}>
        <ThemedButton
          title="+ NEW WISHLIST TARGET"
          variant="primary"
          size="md"
          style={styles.actionButton}
          onPress={() => setIsActionModalOpen(true)}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setActiveFilter('ALL')}
          style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
        >
          <ThemedText
            variant="caption"
            weight={activeFilter === 'ALL' ? 'bold' : 'medium'}
            style={activeFilter === 'ALL' ? styles.filterTextActive : styles.filterText}
          >
            {`ALL (${wishlists.length})`}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('PENDING')}
          style={[styles.filterTab, activeFilter === 'PENDING' && styles.filterTabActive]}
        >
          <ThemedText
            variant="caption"
            weight={activeFilter === 'PENDING' ? 'bold' : 'medium'}
            style={activeFilter === 'PENDING' ? styles.filterTextActive : styles.filterText}
          >
            {`PENDING (${activeCount})`}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('ACHIEVED')}
          style={[styles.filterTab, activeFilter === 'ACHIEVED' && styles.filterTabActive]}
        >
          <ThemedText
            variant="caption"
            weight={activeFilter === 'ACHIEVED' ? 'bold' : 'medium'}
            style={activeFilter === 'ACHIEVED' ? styles.filterTextActive : styles.filterText}
          >
            {`ACHIEVED (${achievedCount})`}
          </ThemedText>
        </Pressable>
      </View>

      {/* Section Subheader */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText weight="bold" style={styles.sectionTitle}>
          TARGETS & DESIRES
        </ThemedText>
        <ThemedText variant="caption" style={styles.sectionCount}>
          {`SHOWING ${filteredWishlists.length}`}
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText variant="caption" style={styles.emptySubtext}>
            LOADING WISHLIST ITEMS...
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Sparkles size={36} color={colors.accent} />
        <ThemedText weight="bold" style={styles.emptyText}>
          NO WISHLIST ITEMS
        </ThemedText>
        <ThemedText variant="caption" style={styles.emptySubtext}>
          Dream big — add your personal savings targets and desires.
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor={colors.background} style={themeMode === 'light' ? 'dark' : 'light'} />

      <FlatList
        data={filteredWishlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <WishlistCard
            wishlist={item}
            index={index}
            totalBalance={totalBalance}
            onToggleAchieve={handleToggleAchieve}
            onDelete={(w) => setItemToDelete(w)}
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
        mode="WISHLIST"
        onClose={() => setIsActionModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={Boolean(itemToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setItemToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setItemToDelete(null)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Trash2 size={18} color={colors.danger} />
                <ThemedText weight="bold" style={styles.modalTitle}>
                  DELETE WISHLIST ITEM
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setItemToDelete(null)}
                style={styles.modalCloseButton}
                hitSlop={8}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {itemToDelete && (
              <View style={styles.modalContent}>
                <ThemedText variant="caption" style={styles.modalLabel}>
                  ARE YOU SURE YOU WANT TO DELETE:
                </ThemedText>
                <View style={styles.deleteItemPreview}>
                  <ThemedText weight="bold" style={styles.modalValue}>
                    {itemToDelete.title.toUpperCase()}
                  </ThemedText>
                  <ThemedText variant="amount" style={styles.modalPrice}>
                    {formatCurrency(itemToDelete.price)}
                  </ThemedText>
                </View>

                <View style={styles.modalActions}>
                  <ThemedButton
                    title="DELETE ITEM"
                    variant="danger"
                    size="lg"
                    onPress={handleConfirmDelete}
                  />
                  <ThemedButton
                    title="CANCEL"
                    variant="outline"
                    size="md"
                    onPress={() => setItemToDelete(null)}
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
    summaryTopRow: {
      marginBottom: Spacing.two,
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
    },
    summaryDivider: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: Spacing.two,
    },
    summaryCompareRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.two,
    },
    compareItem: {
      flex: 1,
    },
    compareItemRight: {
      alignItems: 'flex-end',
    },
    compareLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    compareValue: {
      color: colors.text,
      fontSize: Typography.scale.base.fontSize,
    },
    globalProgressBarTrack: {
      height: 6,
      backgroundColor: colors.backgroundSelected,
      borderRadius: BorderRadius.full,
      marginBottom: Spacing.two,
      overflow: 'hidden',
    },
    globalProgressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: BorderRadius.full,
    },
    summaryFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: Spacing.one,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    summaryFooterText: {
      color: colors.textMuted,
      fontSize: Typography.scale.xs.fontSize,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      marginBottom: Spacing.three,
    },
    actionButton: {
      flex: 1,
    },
    filterRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    filterTab: {
      flex: 1,
      paddingVertical: Spacing.two,
      paddingHorizontal: Spacing.two,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
    },
    filterTabActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    filterTextActive: {
      color: Palette.pureWhite,
      fontSize: Typography.scale.xs.fontSize,
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
    cardAffordable: {
      backgroundColor: colors.card,
      borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    cardAchieved: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.cardBorder,
      opacity: 0.75,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.two,
    },
    cardTitleBox: {
      flex: 1,
      marginRight: Spacing.two,
    },
    cardTitle: {
      fontSize: Typography.scale.base.fontSize,
      color: colors.text,
      letterSpacing: 0.3,
    },
    titleAchieved: {
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    cardDescription: {
      color: colors.textSecondary,
      marginTop: 4,
    },
    badgeAchieved: {
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
    badgeTextAchieved: {
      color: colors.success,
      fontSize: Typography.scale.xs.fontSize,
    },
    badgeAffordable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingVertical: 3,
      paddingHorizontal: Spacing.one * 1.5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    badgeTextAffordable: {
      color: colors.success,
      fontSize: Typography.scale.xs.fontSize,
    },
    badgeProgress: {
      backgroundColor: colors.backgroundSelected,
      paddingVertical: 3,
      paddingHorizontal: Spacing.one * 1.5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeTextProgress: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    imageWrapper: {
      height: 140,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.two,
      overflow: 'hidden',
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginBottom: Spacing.two,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: Spacing.two,
    },
    priceLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      marginBottom: 2,
    },
    amountText: {
      fontSize: Typography.scale.xl.fontSize,
      lineHeight: Typography.scale.xl.lineHeight,
      color: colors.text,
    },
    amountTextAchieved: {
      color: colors.textMuted,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.backgroundSelected,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 4,
      paddingHorizontal: Spacing.two,
    },
    linkText: {
      color: colors.accent,
      fontSize: Typography.scale.xs.fontSize,
    },
    progressSection: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.two,
      marginBottom: Spacing.two,
    },
    progressHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.one,
    },
    progressLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    fundedSuccessText: {
      color: colors.success,
      fontSize: Typography.scale.xs.fontSize,
    },
    deficitText: {
      color: colors.warning,
      fontSize: Typography.scale.xs.fontSize,
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: colors.backgroundSelected,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: BorderRadius.full,
    },
    progressBarFillComplete: {
      backgroundColor: colors.success,
    },
    cardActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.two,
    },
    achieveButton: {
      flex: 1,
      minHeight: 36,
    },
    deleteIconButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteIconPressed: {
      opacity: 0.7,
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
    deleteItemPreview: {
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
    },
    modalValue: {
      color: colors.text,
      fontSize: Typography.scale.base.fontSize,
      marginBottom: Spacing.one,
    },
    modalPrice: {
      color: colors.danger,
      fontSize: Typography.scale.xl.fontSize,
      lineHeight: Typography.scale.xl.lineHeight,
    },
    modalActions: {
      gap: Spacing.two,
      marginTop: Spacing.two,
    },
  });
