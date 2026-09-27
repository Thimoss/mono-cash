import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors, MonospaceFamily, Palette, Spacing, Typography } from '@/constants/theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { KantongDetailProps, Transaksi } from '@/types';

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

export default function KantongDetail({ kantongId, onBack }: KantongDetailProps) {
  const { kantongs, transaksis, updateKantong, deleteKantong } = useFinanceStore();

  const kantong = useMemo(
    () => kantongs.find((k) => k.id === kantongId),
    [kantongs, kantongId]
  );

  const kantongTransaksis = useMemo(() => {
    return transaksis
      .filter((t) => t.kantongId === kantongId)
      .sort((a, b) => {
        const timeA = new Date(a.date || a.createdAt).getTime();
        const timeB = new Date(b.date || b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [transaksis, kantongId]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of kantongTransaksis) {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }
    return { totalIncome: income, totalExpense: expense };
  }, [kantongTransaksis]);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(kantong?.name ?? '');
  const [editBalance, setEditBalance] = useState(kantong?.balance.toString() ?? '0');
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation State
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openEditModal = () => {
    if (!kantong) return;
    setEditName(kantong.name);
    setEditBalance(kantong.balance.toString());
    setEditError(null);
    setIsEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!kantong) return;

    if (!editName.trim()) {
      setEditError('ERROR: KANTONG NAME IS REQUIRED');
      return;
    }

    const parsedBalance = parseFloat(editBalance.replace(/[^0-9.-]+/g, ''));
    if (isNaN(parsedBalance)) {
      setEditError('ERROR: ENTER A VALID NUMERIC BALANCE');
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);
      await updateKantong(kantong.id, {
        name: editName.trim(),
        balance: parsedBalance,
      });
      setIsUpdating(false);
      setIsEditModalVisible(false);
    } catch (err) {
      setIsUpdating(false);
      const msg = err instanceof Error ? err.message : 'FAILED TO UPDATE KANTONG';
      setEditError(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleDelete = async () => {
    if (!kantong) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteKantong(kantong.id);
      setIsDeleting(false);
      setIsDeleteModalVisible(false);
      onBack();
    } catch (err) {
      setIsDeleting(false);
      const msg = err instanceof Error ? err.message : 'FAILED TO DELETE KANTONG';
      setDeleteError(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  if (!kantong) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <StatusBar backgroundColor="#000000" style="light" />
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ThemedText variant="caption" weight="bold">
              [ &larr; BACK ]
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.notFoundContainer}>
          <ThemedText weight="bold" style={styles.notFoundTitle}>
            // KANTONG NOT FOUND
          </ThemedText>
          <ThemedText variant="caption" style={styles.notFoundDesc}>
            This envelope may have been deleted or removed from SQLite.
          </ThemedText>
          <ThemedButton
            title="RETURN TO DASHBOARD"
            variant="primary"
            size="md"
            onPress={onBack}
            style={styles.returnButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Overview Hero Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewTopRow}>
          <View style={styles.nameTag}>
            <ThemedText variant="caption" style={styles.nameTagText}>
              // ENVELOPE
            </ThemedText>
          </View>
          <ThemedText variant="caption" style={styles.idText}>
            {`ID: ${kantong.id.slice(0, 8)}`}
          </ThemedText>
        </View>

        <ThemedText weight="bold" style={styles.kantongName}>
          {kantong.name.toUpperCase()}
        </ThemedText>

        <View style={styles.balanceSection}>
          <ThemedText variant="caption" style={styles.balanceLabel}>
            CURRENT BALANCE
          </ThemedText>
          <ThemedText variant="title" style={styles.balanceAmount}>
            {formatCurrency(kantong.balance)}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.analyticsRow}>
          <View style={styles.analyticCol}>
            <ThemedText variant="caption" style={styles.analyticLabel}>
              [ + ] TOTAL IN
            </ThemedText>
            <ThemedText variant="caption" weight="bold" style={styles.analyticValue}>
              {formatCurrency(totalIncome)}
            </ThemedText>
          </View>

          <View style={styles.analyticCol}>
            <ThemedText variant="caption" style={styles.analyticLabel}>
              [ - ] TOTAL OUT
            </ThemedText>
            <ThemedText variant="caption" weight="bold" style={styles.analyticValue}>
              {formatCurrency(totalExpense)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metaRow}>
          <ThemedText variant="caption" style={styles.metaText}>
            {`CREATED: ${formatDate(kantong.createdAt)}`}
          </ThemedText>
          <ThemedText variant="caption" style={styles.metaText}>
            {`UPDATED: ${formatDate(kantong.updatedAt)}`}
          </ThemedText>
        </View>

        <View style={styles.cardActionsRow}>
          <ThemedButton
            title="[ EDIT KANTONG ]"
            variant="outline"
            size="sm"
            style={styles.cardActionBtn}
            onPress={openEditModal}
          />
          <ThemedButton
            title="[ DELETE KANTONG ]"
            variant="outline"
            size="sm"
            style={styles.cardActionBtn}
            onPress={() => setIsDeleteModalVisible(true)}
          />
        </View>
      </View>

      {/* Transactions Section Title */}
      <View style={styles.sectionHeader}>
        <ThemedText weight="bold" style={styles.sectionTitle}>
          TRANSACTION HISTORY
        </ThemedText>
        <ThemedText variant="caption" style={styles.sectionCount}>
          {`LOGGED: ${kantongTransaksis.length}`}
        </ThemedText>
      </View>
    </View>
  );

  const renderTransactionItem = ({ item, index }: { item: Transaksi; index: number }) => {
    const isIncome = item.type === 'INCOME';

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40).duration(250).springify().damping(16)}
        style={styles.txCard}
      >
        <View style={styles.txHeaderRow}>
          <View style={styles.categoryBadge}>
            <ThemedText variant="caption" weight="bold" style={styles.categoryBadgeText}>
              {`[ ${item.category || 'GENERAL'} ]`}
            </ThemedText>
          </View>
          <ThemedText variant="caption" style={styles.txDate}>
            {formatDate(item.date || item.createdAt)}
          </ThemedText>
        </View>

        <View style={styles.txBodyRow}>
          <ThemedText weight="medium" style={styles.txDescription} numberOfLines={2}>
            {item.description || 'NO DESCRIPTION'}
          </ThemedText>
          <ThemedText
            weight="bold"
            style={[styles.txAmount, isIncome ? styles.txAmountIncome : styles.txAmountExpense]}
          >
            {`${isIncome ? '+ ' : '- '}${formatCurrency(item.amount)}`}
          </ThemedText>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <ThemedText variant="caption" style={styles.emptyTitle}>
        NO TRANSACTIONS RECORDED
      </ThemedText>
      <ThemedText variant="caption" style={styles.emptySubtitle}>
        Transactions assigned to this Kantong will appear here chronologically.
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar backgroundColor="#000000" style="light" />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ThemedText variant="caption" weight="bold" style={styles.backText}>
            [ &larr; CORE ]
          </ThemedText>
        </Pressable>
        <ThemedText variant="caption" style={styles.appBarTitle}>
          KANTONG // DETAILS
        </ThemedText>
      </View>

      <FlatList
        data={kantongTransaksis}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
      />

      {/* Edit Kantong Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText weight="bold" style={styles.modalTitle}>
                  // EDIT KANTONG
                </ThemedText>
                <Pressable onPress={() => setIsEditModalVisible(false)} style={styles.modalCloseBtn}>
                  <ThemedText variant="caption">[ ESC ]</ThemedText>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                {editError && (
                  <View style={styles.errorBox}>
                    <ThemedText variant="caption" style={styles.errorText}>
                      {editError}
                    </ThemedText>
                  </View>
                )}

                <ThemedText variant="caption" style={styles.modalFieldLabel}>
                  NAME
                </ThemedText>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. TABUNGAN"
                  placeholderTextColor={Palette.gray600}
                  style={styles.modalInput}
                  autoCapitalize="characters"
                />

                <ThemedText variant="caption" style={styles.modalFieldLabel}>
                  BALANCE (IDR)
                </ThemedText>
                <TextInput
                  value={editBalance}
                  onChangeText={setEditBalance}
                  placeholder="0"
                  placeholderTextColor={Palette.gray600}
                  keyboardType="numeric"
                  style={styles.modalInput}
                />

                <View style={styles.modalActionsRow}>
                  <ThemedButton
                    title="CANCEL"
                    variant="outline"
                    size="md"
                    style={styles.modalActionBtn}
                    onPress={() => setIsEditModalVisible(false)}
                  />
                  <ThemedButton
                    title="SAVE CHANGES"
                    variant="primary"
                    size="md"
                    loading={isUpdating}
                    style={styles.modalActionBtn}
                    onPress={handleUpdate}
                  />
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText weight="bold" style={styles.deleteModalTitle}>
                ! CONFIRM DELETION
              </ThemedText>
              <Pressable
                onPress={() => setIsDeleteModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <ThemedText variant="caption">[ ESC ]</ThemedText>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {deleteError && (
                <View style={styles.errorBox}>
                  <ThemedText variant="caption" style={styles.errorText}>
                    {deleteError}
                  </ThemedText>
                </View>
              )}

              <ThemedText variant="caption" style={styles.warningMessage}>
                {`Are you sure you want to delete Kantong "${kantong.name}"?`}
              </ThemedText>

              <ThemedText variant="caption" style={styles.warningSubMessage}>
                {`This will permanently remove this envelope and ${kantongTransaksis.length} associated transaction records from SQLite. This action cannot be reversed.`}
              </ThemedText>

              <View style={styles.modalActionsRow}>
                <ThemedButton
                  title="CANCEL"
                  variant="outline"
                  size="md"
                  disabled={isDeleting}
                  style={styles.modalActionBtn}
                  onPress={() => setIsDeleteModalVisible(false)}
                />
                <ThemedButton
                  title="CONFIRM DELETE"
                  variant="primary"
                  size="md"
                  loading={isDeleting}
                  style={styles.modalActionBtn}
                  onPress={handleDelete}
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
    backgroundColor: Palette.black,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray800,
    backgroundColor: Palette.black,
  },
  appBarTitle: {
    color: Palette.gray400,
    letterSpacing: 1,
  },
  backButton: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  backText: {
    color: Palette.white,
    letterSpacing: 1,
  },
  listContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  headerContent: {
    marginBottom: Spacing.three,
  },
  overviewCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  nameTag: {
    borderWidth: 1,
    borderColor: Palette.gray700,
    paddingHorizontal: Spacing.one * 1.5,
    paddingVertical: Spacing.half,
    backgroundColor: Palette.gray900,
  },
  nameTagText: {
    color: Palette.gray400,
    fontSize: Typography.scale.xs.fontSize,
  },
  idText: {
    color: Palette.gray600,
  },
  kantongName: {
    fontSize: Typography.scale['2xl'].fontSize,
    lineHeight: Typography.scale['2xl'].lineHeight,
    color: Palette.white,
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  balanceSection: {
    marginBottom: Spacing.two,
  },
  balanceLabel: {
    color: Palette.gray500,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 1,
    marginBottom: Spacing.half,
  },
  balanceAmount: {
    fontSize: Typography.scale['3xl'].fontSize,
    lineHeight: Typography.scale['3xl'].lineHeight,
    color: Palette.white,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.gray800,
    marginVertical: Spacing.two,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  analyticCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: Palette.gray800,
    backgroundColor: Palette.gray900,
    padding: Spacing.two,
  },
  analyticLabel: {
    color: Palette.gray500,
    fontSize: Typography.scale.xs.fontSize,
    marginBottom: Spacing.half,
  },
  analyticValue: {
    color: Palette.white,
    fontSize: Typography.scale.sm.fontSize,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Palette.gray800,
    marginBottom: Spacing.two * 1.5,
  },
  metaText: {
    color: Palette.gray500,
    fontSize: Typography.scale.xs.fontSize,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cardActionBtn: {
    flex: 1,
  },
  sectionHeader: {
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
  txCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Palette.gray800,
    padding: Spacing.two * 1.5,
    marginBottom: Spacing.two,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: Palette.gray700,
    paddingHorizontal: Spacing.one * 1.5,
    paddingVertical: Spacing.half,
    backgroundColor: Palette.black,
  },
  categoryBadgeText: {
    color: Palette.gray300,
    fontSize: Typography.scale.xs.fontSize,
  },
  txDate: {
    color: Palette.gray500,
    fontSize: Typography.scale.xs.fontSize,
  },
  txBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  txDescription: {
    flex: 1,
    color: Palette.white,
    fontSize: Typography.scale.sm.fontSize,
  },
  txAmount: {
    fontSize: Typography.scale.base.fontSize,
  },
  txAmountIncome: {
    color: Palette.white,
  },
  txAmountExpense: {
    color: Palette.gray300,
  },
  emptyContainer: {
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Palette.gray800,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  emptyTitle: {
    color: Palette.gray400,
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  emptySubtitle: {
    color: Palette.gray600,
    textAlign: 'center',
  },
  notFoundContainer: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundTitle: {
    color: Palette.white,
    fontSize: Typography.scale.lg.fontSize,
    marginBottom: Spacing.two,
  },
  notFoundDesc: {
    color: Palette.gray400,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  returnButton: {
    minWidth: 200,
  },
  header: {
    padding: Spacing.three,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 480,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Palette.black,
    borderWidth: 1,
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
    marginBottom: Spacing.two,
  },
  modalTitle: {
    color: Palette.white,
    fontSize: Typography.scale.md.fontSize,
    letterSpacing: 1,
  },
  deleteModalTitle: {
    color: Palette.white,
    fontSize: Typography.scale.md.fontSize,
    letterSpacing: 1,
  },
  modalCloseBtn: {
    padding: Spacing.half,
  },
  modalBody: {
    gap: Spacing.two,
  },
  modalFieldLabel: {
    color: Palette.gray400,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 1,
    marginTop: Spacing.one,
  },
  modalInput: {
    fontFamily: MonospaceFamily,
    fontSize: Typography.scale.base.fontSize,
    color: Palette.white,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two * 1.25,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  modalActionBtn: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: Palette.black,
    borderWidth: 1,
    borderColor: Palette.white,
    padding: Spacing.two,
  },
  errorText: {
    color: Palette.white,
    letterSpacing: 0.5,
  },
  warningMessage: {
    color: Palette.white,
    fontSize: Typography.scale.base.fontSize,
    lineHeight: Typography.scale.base.lineHeight,
    letterSpacing: 0.5,
    marginVertical: Spacing.one,
  },
  warningSubMessage: {
    color: Palette.gray400,
    fontSize: Typography.scale.xs.fontSize,
    lineHeight: Typography.scale.sm.lineHeight,
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
});
