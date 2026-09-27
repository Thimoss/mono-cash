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

const StatusBar = ExpoStatusBar as React.ComponentType<
  React.ComponentProps<typeof ExpoStatusBar> & { backgroundColor?: string }
>;
import { ActionModal } from '@/components/ActionModal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Palette, Spacing, Typography } from '@/constants/theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ActionModalMode, DashboardProps, KantongCardProps } from '@/types';

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

function KantongCard({ kantong, index, onPress }: KantongCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350).springify().damping(15)}
    >
      <Pressable
        style={styles.cardContainer}
        onPress={() => onPress?.(kantong)}
        accessibilityRole="button"
        accessibilityLabel={`View Kantong ${kantong.name}`}
      >
        <View style={styles.cardHeader}>
          <ThemedText weight="semibold" style={styles.cardTitle}>
            {kantong.name.toUpperCase()}
          </ThemedText>
          <View style={styles.cardHeaderRight}>
            <ThemedText variant="caption" style={styles.cardIndex}>
              {`[ ${String(index + 1).padStart(2, '0')} ]`}
            </ThemedText>
            <ThemedText variant="caption" style={styles.cardChevron}>
              [ &rarr; ]
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <ThemedText variant="caption" style={styles.balanceLabel}>
            AVAILABLE BALANCE
          </ThemedText>
          <ThemedText variant="amount" style={styles.cardBalance}>
            {formatCurrency(kantong.balance)}
          </ThemedText>
        </View>

        <View style={styles.cardFooter}>
          <ThemedText variant="caption" style={styles.cardDate}>
            {`UPDATED: ${formatDate(kantong.updatedAt)}`}
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
        setExportFeedback('BACKUP GENERATED // NATIVE SHARE SHEET OPENED');
        setTimeout(() => {
          setExportFeedback(null);
        }, 4500);
      } else if (result.error && result.error !== 'SHARING_NOT_AVAILABLE_ON_DEVICE') {
        setExportError(`EXPORT FAILED: ${result.error.toUpperCase()}`);
      } else if (result.fileUri) {
        setExportFeedback(`SAVED TO CACHE: ${result.fileUri.split('/').pop()}`);
        setTimeout(() => {
          setExportFeedback(null);
        }, 4500);
      }
    } catch (err) {
      setIsExporting(false);
      const msg = err instanceof Error ? err.message : 'EXPORT FAILED';
      setExportError(`ERROR: ${msg.toUpperCase()}`);
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
      <View style={styles.appBar}>
        <ThemedText variant="caption" style={styles.appBarTitle}>
          MONOCASH // CORE
        </ThemedText>
        <View style={styles.navRow}>
          {Boolean(onNavigateBills) && (
            <Pressable onPress={onNavigateBills} style={styles.navButton}>
              <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
                [ BILLS &rarr; ]
              </ThemedText>
            </Pressable>
          )}
          {Boolean(onNavigateWishlist) && (
            <Pressable onPress={onNavigateWishlist} style={styles.navButton}>
              <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
                [ WISHLIST &rarr; ]
              </ThemedText>
            </Pressable>
          )}
          {Boolean(onNavigateSettings) && (
            <Pressable onPress={onNavigateSettings} style={styles.navButton}>
              <ThemedText variant="caption" weight="bold" style={styles.navButtonText}>
                [ CONFIG ]
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.totalBalanceBox}>
        <ThemedText variant="caption" style={styles.totalBalanceLabel}>
          TOTAL AGGREGATED BALANCE
        </ThemedText>
        <ThemedText variant="title" style={styles.totalBalanceAmount}>
          {formatCurrency(totalBalance)}
        </ThemedText>
        <View style={styles.balanceMetaRow}>
          <ThemedText variant="caption" style={styles.metaText}>
            {`KANTONG: ${kantongs.length}`}
          </ThemedText>
          <ThemedText variant="caption" style={styles.metaText}>
            STATUS: ACTIVE
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <ThemedButton
          title="+ KANTONG"
          variant="primary"
          size="sm"
          style={styles.actionButton}
          onPress={() => openActionModal('KANTONG')}
        />
        <ThemedButton
          title="+ TRANSAKSI"
          variant="outline"
          size="sm"
          style={styles.actionButton}
          onPress={() => openActionModal('TRANSAKSI')}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <ThemedText weight="bold" style={styles.sectionHeaderTitle}>
          ENVELOPES & KANTONG
        </ThemedText>
        <ThemedText variant="caption" style={styles.sectionHeaderCount}>
          {`COUNT: ${kantongs.length}`}
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText variant="caption">LOADING KANTONG DATA...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <ThemedText variant="caption" style={styles.emptyText}>
          NO KANTONG REGISTERED
        </ThemedText>
        <ThemedText variant="caption" style={styles.emptySubtext}>
          CREATE AN ENVELOPE TO BEGIN TRACKING
        </ThemedText>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footerSection}>
      <View style={styles.utilityCard}>
        <View style={styles.utilityHeaderRow}>
          {/* SETTINGS & DATA UTILITIES */}
          <ThemedText weight="bold" style={styles.utilityTitle}>
            {'// SETTINGS & DATA UTILITIES'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.utilityTag}>
            OFFLINE
          </ThemedText>
        </View>

        <ThemedText variant="caption" style={styles.utilityDesc}>
          Export all SQLite data (Kantongs, Transaksis, Tagihans, Wishlists) to spreadsheet-compatible CSV format for sharing or local backup.
        </ThemedText>

        <View style={styles.utilityDivider} />

        <View style={styles.utilityMetaRow}>
          <ThemedText variant="caption" style={styles.utilityMeta}>
            STORAGE: SQLite (WAL)
          </ThemedText>
          <ThemedText variant="caption" style={styles.utilityMeta}>
            FORMAT: RFC 4180
          </ThemedText>
        </View>

        <View style={styles.exportButtonWrapper}>
          <ThemedButton
            title={isExporting ? 'GENERATING EXPORT...' : 'EXPORT DATA (.CSV / .XLSX)'}
            variant="outline"
            size="md"
            loading={isExporting}
            disabled={isExporting}
            onPress={handleExport}
          />
        </View>

        {Boolean(exportFeedback) && (
          <Animated.View
            entering={FadeInDown.duration(300).springify().damping(18)}
            style={styles.feedbackSuccessCard}
          >
            <View style={styles.feedbackIconRow}>
              <ThemedText weight="bold" style={styles.feedbackSuccessTitle}>
                ✓ EXPORT COMPLETE
              </ThemedText>
              <ThemedText variant="caption" style={styles.feedbackSuccessBadge}>
                [ READY ]
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
            <ThemedText weight="bold" style={styles.feedbackErrorTitle}>
              ! EXPORT NOTICE
            </ThemedText>
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
      <StatusBar backgroundColor="#000000" style="light" />

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
            tintColor={Palette.white}
            colors={[Palette.black]}
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
  navRow: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  totalBalanceBox: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  totalBalanceLabel: {
    color: Palette.gray400,
    letterSpacing: 1,
    marginBottom: Spacing.half,
  },
  totalBalanceAmount: {
    fontSize: Typography.scale['3xl'].fontSize,
    lineHeight: Typography.scale['3xl'].lineHeight,
    color: Palette.white,
    marginBottom: Spacing.two,
  },
  balanceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.gray800,
    paddingTop: Spacing.one,
  },
  metaText: {
    color: Palette.gray500,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  sectionHeaderTitle: {
    color: Palette.white,
    fontSize: Typography.scale.sm.fontSize,
    letterSpacing: 1,
  },
  sectionHeaderCount: {
    color: Palette.gray400,
  },
  cardContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Typography.scale.base.fontSize,
    color: Palette.white,
    letterSpacing: 0.5,
  },
  cardIndex: {
    color: Palette.gray500,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one * 1.5,
  },
  cardChevron: {
    color: Palette.white,
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Palette.gray800,
    marginVertical: Spacing.two,
  },
  cardBody: {
    marginBottom: Spacing.one,
  },
  balanceLabel: {
    color: Palette.gray500,
    marginBottom: Spacing.half,
    fontSize: Typography.scale.xs.fontSize,
  },
  cardBalance: {
    color: Palette.white,
  },
  cardFooter: {
    marginTop: Spacing.one,
  },
  cardDate: {
    color: Palette.gray600,
    fontSize: Typography.scale.xs.fontSize,
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
  footerSection: {
    marginTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  utilityCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
  },
  utilityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  utilityTitle: {
    fontSize: Typography.scale.sm.fontSize,
    color: Palette.white,
    letterSpacing: 1,
  },
  utilityTag: {
    color: Palette.gray500,
  },
  utilityDesc: {
    color: Palette.gray400,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  utilityDivider: {
    height: 1,
    backgroundColor: Palette.gray800,
    marginBottom: Spacing.two,
  },
  utilityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  utilityMeta: {
    color: Palette.gray500,
  },
  exportButtonWrapper: {
    width: '100%',
  },
  feedbackSuccessCard: {
    marginTop: Spacing.three,
    backgroundColor: Palette.white,
    borderColor: Palette.white,
    borderWidth: 1,
    padding: Spacing.two,
  },
  feedbackIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  feedbackSuccessTitle: {
    color: Palette.black,
    letterSpacing: 1,
  },
  feedbackSuccessBadge: {
    color: Palette.gray700,
  },
  feedbackSuccessText: {
    color: Palette.gray800,
  },
  feedbackErrorCard: {
    marginTop: Spacing.three,
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Palette.gray700,
    borderWidth: 1,
    padding: Spacing.two,
  },
  feedbackErrorTitle: {
    color: Palette.white,
    letterSpacing: 1,
    marginBottom: 2,
  },
  feedbackErrorText: {
    color: Palette.gray400,
  },
});
