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

const StatusBar = ExpoStatusBar as React.ComponentType<
  React.ComponentProps<typeof ExpoStatusBar> & { backgroundColor?: string }
>;

import { ActionModal } from '@/components/ActionModal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Palette, Spacing, Typography } from '@/constants/theme';
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
  const isAffordable = totalBalance >= wishlist.price;
  const progressRatio = wishlist.price > 0 ? Math.min(1, totalBalance / wishlist.price) : 1;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));
  const deficit = Math.max(0, wishlist.price - totalBalance);

  const cardStyle = wishlist.isAchieved
    ? styles.cardAchieved
    : isAffordable
    ? styles.cardAffordable
    : styles.cardNormal;

  const textColor = wishlist.isAchieved ? Palette.gray500 : Palette.white;
  const mutedTextColor = wishlist.isAchieved ? Palette.gray600 : Palette.gray400;

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
        <View style={[styles.badgeContainer, styles.badgeAchieved]}>
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextAchieved}>
            [ ACHIEVED ]
          </ThemedText>
        </View>
      );
    }

    if (isAffordable) {
      return (
        <View style={[styles.badgeContainer, styles.badgeAffordable]}>
          <ThemedText variant="caption" weight="bold" style={styles.badgeTextAffordable}>
            [ READY TO BUY ]
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.badgeContainer}>
        <ThemedText variant="caption" weight="bold" style={styles.badgeTextNormal}>
          {`[ ${progressPercent}% FUNDED ]`}
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
              { color: textColor },
              wishlist.isAchieved && styles.titleAchieved,
            ]}
          >
            {wishlist.title.toUpperCase()}
          </ThemedText>
          {wishlist.description.trim().length > 0 && (
            <ThemedText variant="caption" style={[styles.cardDescription, { color: mutedTextColor }]}>
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
          <ThemedText variant="caption" style={{ color: mutedTextColor }}>
            TARGET PRICE
          </ThemedText>
          <ThemedText variant="amount" style={[styles.amountText, { color: textColor }]}>
            {formatCurrency(wishlist.price)}
          </ThemedText>
        </View>

        {wishlist.purchaseLink && (
          <Pressable onPress={handleOpenLink} style={styles.linkButton}>
            <ThemedText variant="caption" weight="bold" style={styles.linkText}>
              [ LINK ↗ ]
            </ThemedText>
          </Pressable>
        )}
      </View>

      {/* Stackup Comparison Bar against Total Kantong Balance */}
      <View style={styles.stackupSection}>
        <View style={styles.stackupHeader}>
          <ThemedText variant="caption" style={{ color: mutedTextColor }}>
            {wishlist.isAchieved
              ? `ACQUIRED ON: ${formatDate(wishlist.createdAt)}`
              : `TOTAL KANTONG COVERAGE: ${progressPercent}%`}
          </ThemedText>
          {!wishlist.isAchieved && (
            <ThemedText
              variant="caption"
              weight="bold"
              style={{ color: isAffordable ? Palette.white : Palette.gray400 }}
            >
              {isAffordable ? 'FULLY FUNDED' : `NEED ${formatCurrency(deficit)}`}
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
            title={wishlist.isAchieved ? '[ UNCHECK ]' : '✓ MARK ACHIEVED'}
            size="sm"
            variant={wishlist.isAchieved ? 'ghost' : isAffordable ? 'primary' : 'outline'}
            onPress={() => onToggleAchieve(wishlist)}
            style={styles.achieveButton}
          />
        )}

        {onDelete && (
          <Pressable
            onPress={() => onDelete(wishlist)}
            style={styles.deleteIconButton}
            hitSlop={8}
          >
            <ThemedText variant="caption" style={styles.deleteIconText}>
              [ DEL ]
            </ThemedText>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export default function WishlistScreen({ onBack }: WishlistScreenProps) {
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
          <Pressable onPress={onBack} style={styles.navButton}>
            <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
              [ &larr; DASHBOARD ]
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText variant="caption" style={styles.appBarTitle}>
            MONOCASH // WISHLIST
          </ThemedText>
        )}
        <ThemedText variant="caption" style={styles.activeTag}>
          {`TOTAL: ${wishlists.length}`}
        </ThemedText>
      </View>

      {/* Aggregate Balance vs Wishlist Stackup Box */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryTopRow}>
          <View>
            <ThemedText variant="caption" style={styles.summaryLabel}>
              AGGREGATED KANTONG BALANCE
            </ThemedText>
            <ThemedText variant="title" style={styles.summaryAmount}>
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
            {`ACHIEVED: ${achievedCount} / ${wishlists.length}`}
          </ThemedText>
          <ThemedText variant="caption" style={styles.summaryFooterText}>
            {totalBalance >= totalTargetCost
              ? 'STATUS: 100% COVERED'
              : `DEFICIT: -${formatCurrency(totalTargetCost - totalBalance)}`}
          </ThemedText>
        </View>
      </View>

      {/* Action Button Row */}
      <View style={styles.actionButtonsRow}>
        <ThemedButton
          title="+ WISHLIST"
          variant="primary"
          size="sm"
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
            weight={activeFilter === 'ALL' ? 'bold' : 'regular'}
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
            weight={activeFilter === 'PENDING' ? 'bold' : 'regular'}
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
            weight={activeFilter === 'ACHIEVED' ? 'bold' : 'regular'}
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
          <ThemedText variant="caption">LOADING WISHLIST ITEMS...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <ThemedText variant="caption" style={styles.emptyText}>
          NO WISHLIST ITEMS
        </ThemedText>
        <ThemedText variant="caption" style={styles.emptySubtext}>
          DREAM BIG // ADD YOUR SAVINGS GOALS
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor="#000000" style="light" />

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
              <ThemedText weight="bold" style={styles.modalTitle}>
                // DELETE WISHLIST ITEM
              </ThemedText>
              <Pressable onPress={() => setItemToDelete(null)}>
                <ThemedText variant="caption">[ ESC ]</ThemedText>
              </Pressable>
            </View>

            {itemToDelete && (
              <View style={styles.modalContent}>
                <ThemedText variant="caption" style={styles.modalLabel}>
                  ARE YOU SURE YOU WANT TO DELETE:
                </ThemedText>
                <ThemedText weight="bold" style={styles.modalValue}>
                  {itemToDelete.title.toUpperCase()}
                </ThemedText>
                <ThemedText variant="amount" style={styles.modalPrice}>
                  {formatCurrency(itemToDelete.price)}
                </ThemedText>

                <View style={styles.modalActions}>
                  <ThemedButton
                    title="DELETE ITEM"
                    variant="primary"
                    size="md"
                    onPress={handleConfirmDelete}
                  />
                  <ThemedButton
                    title="CANCEL"
                    variant="outline"
                    size="md"
                    onPress={() => setItemToDelete(null)}
                    style={styles.cancelButton}
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
  summaryTopRow: {
    marginBottom: Spacing.two,
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
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Palette.gray800,
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
    color: Palette.gray400,
    marginBottom: 2,
  },
  compareValue: {
    color: Palette.white,
    fontSize: Typography.scale.base.fontSize,
  },
  globalProgressBarTrack: {
    height: 6,
    backgroundColor: Palette.gray900,
    borderWidth: 1,
    borderColor: Palette.gray700,
    marginBottom: Spacing.two,
  },
  globalProgressBarFill: {
    height: '100%',
    backgroundColor: Palette.white,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Palette.gray800,
  },
  summaryFooterText: {
    color: Palette.gray400,
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
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: Palette.gray800,
    backgroundColor: Colors.dark.backgroundElement,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  filterText: {
    color: Palette.gray400,
  },
  filterTextActive: {
    color: Palette.black,
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
  cardAffordable: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Palette.white,
  },
  cardAchieved: {
    backgroundColor: '#0A0A0A',
    borderColor: Palette.gray800,
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
    letterSpacing: 0.5,
  },
  titleAchieved: {
    textDecorationLine: 'line-through',
  },
  cardDescription: {
    marginTop: 4,
  },
  badgeContainer: {
    borderWidth: 1,
    borderColor: Palette.gray700,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeAchieved: {
    borderColor: Palette.gray800,
    backgroundColor: 'transparent',
  },
  badgeAffordable: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  badgeTextNormal: {
    color: Palette.gray300,
    fontSize: Typography.scale.xs.fontSize,
  },
  badgeTextAchieved: {
    color: Palette.gray500,
    fontSize: Typography.scale.xs.fontSize,
  },
  badgeTextAffordable: {
    color: Palette.black,
    fontSize: Typography.scale.xs.fontSize,
  },
  imageWrapper: {
    height: 120,
    borderWidth: 1,
    borderColor: Palette.gray800,
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Palette.gray800,
    marginBottom: Spacing.two,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.two,
  },
  amountText: {
    fontSize: Typography.scale.xl.fontSize,
    lineHeight: Typography.scale.xl.lineHeight,
  },
  linkButton: {
    borderWidth: 1,
    borderColor: Palette.gray700,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  linkText: {
    color: Palette.white,
  },
  stackupSection: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: Palette.gray800,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  stackupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Palette.gray900,
    borderWidth: 1,
    borderColor: Palette.gray700,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Palette.gray400,
  },
  progressBarFillComplete: {
    backgroundColor: Palette.white,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  achieveButton: {
    flex: 1,
    minHeight: 32,
    paddingVertical: 4,
  },
  deleteIconButton: {
    borderWidth: 1,
    borderColor: Palette.gray800,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.dark.backgroundElement,
  },
  deleteIconText: {
    color: Palette.gray500,
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
  },
  modalValue: {
    color: Palette.white,
    fontSize: Typography.scale.base.fontSize,
  },
  modalPrice: {
    color: Palette.white,
    marginBottom: Spacing.two,
  },
  modalActions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelButton: {
    marginTop: Spacing.half,
  },
});
