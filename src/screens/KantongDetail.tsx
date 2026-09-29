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
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Car,
  Edit2,
  Inbox,
  Laptop,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  X,
  Zap,
} from 'lucide-react-native';
import { ActionModal } from '@/components/ActionModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { BorderRadius, ColorTheme, MonospaceFamily, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { KantongDetailProps, Transaksi, TransaksiType } from '@/types';

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

function getTransactionCategoryIcon(
  category: string | null | undefined,
  type: 'INCOME' | 'EXPENSE',
  size = 16,
  color = '#6B7280'
) {
  const cat = category?.toUpperCase() || '';
  if (cat.includes('FOOD') || cat.includes('BEVERAGE') || cat.includes('MAKAN')) {
    return <Utensils size={size} color={color} />;
  }
  if (cat.includes('BILL') || cat.includes('UTILITIES') || cat.includes('LISTRIK') || cat.includes('TAGIHAN')) {
    return <Zap size={size} color={color} />;
  }
  if (cat.includes('DEBT') || cat.includes('OBLIGATION') || cat.includes('HUTANG') || cat.includes('CICILAN')) {
    return <ShieldAlert size={size} color={color} />;
  }
  if (cat.includes('TRANSPORT') || cat.includes('KENDARAAN') || cat.includes('BENSIN')) {
    return <Car size={size} color={color} />;
  }
  if (cat.includes('LIFESTYLE') || cat.includes('HOBBY') || cat.includes('BELANJA') || cat.includes('SHOPPING')) {
    return <ShoppingBag size={size} color={color} />;
  }
  if (cat.includes('SALARY') || cat.includes('GAJI')) {
    return <Briefcase size={size} color={color} />;
  }
  if (cat.includes('FREELANCE') || cat.includes('PROJECT')) {
    return <Laptop size={size} color={color} />;
  }
  if (cat.includes('INVEST') || cat.includes('SAHAM') || cat.includes('CRYPTO')) {
    return <TrendingUp size={size} color={color} />;
  }
  return type === 'INCOME' ? (
    <ArrowDownLeft size={size} color={color} />
  ) : (
    <ArrowUpRight size={size} color={color} />
  );
}

export default function KantongDetail({ kantongId, onBack }: Readonly<KantongDetailProps>) {
  const colors = useTheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { kantongs, transaksis, updateKantong, deleteKantong } = useFinanceStore();

  const kantong = useMemo(
    () => kantongs.find((k) => k.id === kantongId),
    [kantongs, kantongId]
  );

  const kantongTransaksis = useMemo(() => {
    return transaksis
      .filter((item) => item.kantongId === kantongId)
      .sort((a, b) => {
        const timeA = new Date(a.date || a.createdAt).getTime();
        const timeB = new Date(b.date || b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [transaksis, kantongId]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const item of kantongTransaksis) {
      if (item.type === 'INCOME') {
        income += item.amount;
      } else {
        expense += item.amount;
      }
    }
    return { totalIncome: income, totalExpense: expense };
  }, [kantongTransaksis]);

  // Action Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState<TransaksiType>('EXPENSE');

  const handleOpenActionModal = (type: TransaksiType) => {
    setActionModalType(type);
    setIsActionModalOpen(true);
  };

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
      setEditError(t('kantongErrNameRequired'));
      return;
    }

    const parsedBalance = Number.parseFloat(editBalance.replace(/[^0-9.-]+/g, ''));
    if (Number.isNaN(parsedBalance)) {
      setEditError(t('kantongErrInvalidBalance'));
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
        <StatusBar
          backgroundColor={colors.background}
          style={themeMode === 'light' ? 'dark' : 'light'}
        />
        <ScreenHeader
          title={t('kantongNotFound')}
          showBack
          onBack={onBack}
        />
        <View style={styles.notFoundContainer}>
          <View style={styles.notFoundIconBox}>
            <Inbox size={32} color={colors.textSecondary} />
          </View>
          <ThemedText weight="bold" style={styles.notFoundTitle}>
            {t('kantongNotFound')}
          </ThemedText>
          <ThemedText variant="caption" style={styles.notFoundDesc}>
            {t('kantongNotFoundDesc')}
          </ThemedText>
          <ThemedButton
            title={t('kantongReturnDashboard')}
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
            <Wallet size={13} color={colors.accent} />
            <ThemedText variant="caption" weight="semibold" style={styles.nameTagText}>
              {t('kantongEnvelope')}
            </ThemedText>
          </View>
          <ThemedText variant="caption" style={styles.idText}>
            {`#${kantong.id.slice(0, 8)}`}
          </ThemedText>
        </View>

        <ThemedText weight="bold" style={styles.kantongName}>
          {kantong.name}
        </ThemedText>

        <View style={styles.balanceSection}>
          <ThemedText variant="caption" style={styles.balanceLabel}>
            {t('kantongCurrentBalance')}
          </ThemedText>
          <ThemedText variant="title" style={styles.balanceAmount}>
            {formatCurrency(kantong.balance)}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.analyticsRow}>
          <View style={styles.analyticCol}>
            <View style={styles.analyticLabelRow}>
              <ArrowDownLeft size={13} color={colors.success} />
              <ThemedText variant="caption" style={styles.analyticLabel}>
                {t('kantongTotalIn')}
              </ThemedText>
            </View>
            <ThemedText
              variant="caption"
              weight="bold"
              style={[styles.analyticValue, { color: colors.success }]}
            >
              {formatCurrency(totalIncome)}
            </ThemedText>
          </View>

          <View style={styles.analyticCol}>
            <View style={styles.analyticLabelRow}>
              <ArrowUpRight size={13} color={colors.danger} />
              <ThemedText variant="caption" style={styles.analyticLabel}>
                {t('kantongTotalOut')}
              </ThemedText>
            </View>
            <ThemedText
              variant="caption"
              weight="bold"
              style={[styles.analyticValue, { color: colors.danger }]}
            >
              {formatCurrency(totalExpense)}
            </ThemedText>
          </View>
        </View>

        {/* Transaction Action Shortcuts */}
        <View style={styles.transactionShortcutsRow}>
          <ThemedButton
            variant="outline"
            size="lg"
            style={[styles.transactionShortcutBtn, styles.incomeShortcutBtn]}
            onPress={() => handleOpenActionModal('INCOME')}
          >
            <View style={styles.btnContentRow}>
              <ArrowDownLeft size={18} color={colors.success} />
              <ThemedText weight="bold" style={[styles.shortcutBtnText, { color: colors.success }]}>
                {t('income')}
              </ThemedText>
            </View>
          </ThemedButton>

          <ThemedButton
            variant="outline"
            size="lg"
            style={[styles.transactionShortcutBtn, styles.expenseShortcutBtn]}
            onPress={() => handleOpenActionModal('EXPENSE')}
          >
            <View style={styles.btnContentRow}>
              <ArrowUpRight size={18} color={colors.danger} />
              <ThemedText weight="bold" style={[styles.shortcutBtnText, { color: colors.danger }]}>
                {t('expense')}
              </ThemedText>
            </View>
          </ThemedButton>
        </View>

        {/* Secondary Management Row: Edit & Delete */}
        <View style={styles.secondaryActionsRow}>
          <ThemedButton
            variant="secondary"
            size="sm"
            style={styles.secondaryActionBtn}
            onPress={openEditModal}
          >
            <View style={styles.secondaryBtnContentRow}>
              <Edit2 size={13} color={colors.textSecondary} />
              <ThemedText weight="medium" style={styles.secondaryBtnText}>
                {t('kantongEditTitle')}
              </ThemedText>
            </View>
          </ThemedButton>

          <ThemedButton
            variant="ghost"
            size="sm"
            style={[styles.secondaryActionBtn, styles.secondaryDeleteBtn]}
            onPress={() => setIsDeleteModalVisible(true)}
          >
            <View style={styles.secondaryBtnContentRow}>
              <Trash2 size={13} color={colors.danger} />
              <ThemedText weight="medium" style={styles.secondaryDeleteText}>
                {t('kantongDeleteTitle')}
              </ThemedText>
            </View>
          </ThemedButton>
        </View>
      </View>

      {/* Transactions Section Title */}
      <View style={styles.sectionHeader}>
        <ThemedText weight="bold" style={styles.sectionTitle}>
          {t('kantongTransactions')}
        </ThemedText>
        <View style={styles.countBadge}>
          <ThemedText variant="caption" weight="bold" style={styles.countBadgeText}>
            {kantongTransaksis.length}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderTransactionItem = ({ item, index }: { item: Transaksi; index: number }) => {
    const isIncome = item.type === 'INCOME';
    const amountColor = isIncome ? colors.success : colors.danger;
    const iconColor = isIncome ? colors.success : colors.accent;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40).duration(250).springify().damping(16)}
      >
        <View style={styles.txCard}>
          <View style={styles.txLeftCol}>
          <View
            style={[
              styles.txIconContainer,
              {
                backgroundColor: isIncome
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(99, 102, 241, 0.12)',
              },
            ]}
          >
            {getTransactionCategoryIcon(item.category, item.type, 16, iconColor)}
          </View>
          <View style={styles.txMetaCol}>
            <ThemedText weight="semibold" style={styles.txDescription} numberOfLines={1}>
              {item.description || item.category || 'Transaksi'}
            </ThemedText>
            <View style={styles.txSubRow}>
              {Boolean(item.category) && (
                <View style={styles.categoryBadge}>
                  <ThemedText variant="caption" style={styles.categoryBadgeText}>
                    {item.category}
                  </ThemedText>
                </View>
              )}
              <ThemedText variant="caption" style={styles.txDate}>
                {formatDate(item.date || item.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText
          weight="bold"
          style={[styles.txAmount, { color: amountColor }]}
        >
          {`${isIncome ? '+ ' : '- '}${formatCurrency(item.amount)}`}
        </ThemedText>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Inbox size={28} color={colors.textSecondary} />
      </View>
      <ThemedText weight="bold" style={styles.emptyTitle}>
        {t('kantongNoTransactions')}
      </ThemedText>
      <ThemedText variant="caption" style={styles.emptySubtitle}>
        {t('kantongNoTransactionsDesc')}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar
        backgroundColor={colors.background}
        style={themeMode === 'light' ? 'dark' : 'light'}
      />

      {/* Top App Bar */}
      <ScreenHeader
        title={kantong.name}
        showBack
        onBack={onBack}
      />

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
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText weight="bold" style={styles.modalTitle}>
                  {t('kantongEditTitle')}
                </ThemedText>
                <Pressable
                  onPress={() => setIsEditModalVisible(false)}
                  style={styles.modalCloseBtn}
                  hitSlop={8}
                >
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={[styles.modalBody, { flexGrow: 1, paddingBottom: 60 }]}>
                {Boolean(editError) && (
                  <View style={styles.errorBox}>
                    <ThemedText variant="caption" style={styles.errorText}>
                      {editError}
                    </ThemedText>
                  </View>
                )}

                <ThemedText variant="caption" style={styles.modalFieldLabel}>
                  {t('kantongNameLabel')}
                </ThemedText>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. TABUNGAN"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.modalInput}
                  autoCapitalize="characters"
                />

                <ThemedText variant="caption" style={styles.modalFieldLabel}>
                  {t('kantongBalanceLabel')}
                </ThemedText>
                <TextInput
                  value={editBalance}
                  onChangeText={setEditBalance}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={styles.modalInput}
                />

                <View style={styles.modalActionsRow}>
                  <ThemedButton
                    title={t('billsCancel')}
                    variant="outline"
                    size="lg"
                    style={styles.modalActionBtn}
                    onPress={() => setIsEditModalVisible(false)}
                  />
                  <ThemedButton
                    title={t('kantongUpdateBtn')}
                    variant="primary"
                    size="lg"
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
                {t('kantongDeleteTitle')}
              </ThemedText>
              <Pressable
                onPress={() => setIsDeleteModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {Boolean(deleteError) && (
                <View style={styles.errorBox}>
                  <ThemedText variant="caption" style={styles.errorText}>
                    {deleteError}
                  </ThemedText>
                </View>
              )}

              <ThemedText variant="caption" style={styles.warningMessage}>
                {`${t('kantongDeleteConfirm')} "${kantong.name}"?`}
              </ThemedText>

              <ThemedText variant="caption" style={styles.warningSubMessage}>
                {t('kantongDeleteWarning')}
              </ThemedText>

              <View style={styles.modalActionsRow}>
                <ThemedButton
                  title={t('billsCancel')}
                  variant="outline"
                  size="lg"
                  disabled={isDeleting}
                  style={styles.modalActionBtn}
                  onPress={() => setIsDeleteModalVisible(false)}
                />
                <ThemedButton
                  title={t('kantongDeleteBtn')}
                  variant="danger"
                  size="lg"
                  loading={isDeleting}
                  style={styles.modalActionBtn}
                  onPress={handleDelete}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      {/* Action Modal for Transactions */}
      {kantong && (
        <ActionModal
          visible={isActionModalOpen}
          mode="TRANSAKSI"
          defaultKantongId={kantong.id}
          defaultTransactionType={actionModalType}
          onClose={() => setIsActionModalOpen(false)}
        />
      )}
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
      padding: Spacing.three,
      paddingBottom: Spacing.six * 2,
    },
    headerContent: {
      marginBottom: Spacing.three,
    },
    overviewCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.xl,
      padding: Spacing.four,
      marginBottom: Spacing.three,
    },
    overviewTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.two,
    },
    nameTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.half,
      backgroundColor: colors.backgroundSelected,
    },
    nameTagText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      letterSpacing: 0.3,
    },
    idText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    kantongName: {
      fontSize: Typography.scale.xl.fontSize,
      color: colors.text,
      marginBottom: Spacing.two,
      letterSpacing: 0.3,
    },
    balanceSection: {
      marginBottom: Spacing.two,
    },
    balanceLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      letterSpacing: 0.5,
      marginBottom: Spacing.half,
    },
    balanceAmount: {
      fontSize: Typography.scale['3xl'].fontSize,
      lineHeight: Typography.scale['3xl'].lineHeight,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: Spacing.two,
    },
    analyticsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    analyticCol: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
      padding: Spacing.two * 1.25,
      gap: 4,
    },
    analyticLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    analyticLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    analyticValue: {
      fontSize: Typography.scale.sm.fontSize,
    },
    transactionShortcutsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: Spacing.three,
    },
    transactionShortcutBtn: {
      flex: 1,
      height: 52,
      minHeight: 52,
      borderRadius: BorderRadius.lg,
    },
    incomeShortcutBtn: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.28)',
      borderWidth: 1,
    },
    expenseShortcutBtn: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.28)',
      borderWidth: 1,
    },
    shortcutBtnText: {
      fontSize: Typography.scale.sm.fontSize,
      letterSpacing: 0.3,
    },
    secondaryActionsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: Spacing.two,
    },
    secondaryActionBtn: {
      flex: 1,
      height: 38,
      minHeight: 38,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.border,
      borderWidth: 1,
    },
    secondaryDeleteBtn: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    btnContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    secondaryBtnContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    secondaryBtnText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    secondaryDeleteText: {
      color: colors.danger,
      fontSize: Typography.scale.xs.fontSize,
    },
    sectionHeader: {
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
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    countBadgeText: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    txCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.md,
      padding: Spacing.two * 1.5,
      marginBottom: Spacing.two,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    txLeftCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      flex: 1,
      marginRight: Spacing.two,
    },
    txIconContainer: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txMetaCol: {
      flex: 1,
      gap: 3,
    },
    txDescription: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
    },
    txSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    categoryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundSelected,
    },
    categoryBadgeText: {
      color: colors.textSecondary,
      fontSize: 10,
    },
    txDate: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    txAmount: {
      fontSize: Typography.scale.sm.fontSize,
    },
    emptyContainer: {
      padding: Spacing.four,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.card,
      alignItems: 'center',
      marginTop: Spacing.two,
      gap: Spacing.one,
    },
    emptyIconBox: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.one,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: Typography.scale.sm.fontSize,
    },
    emptySubtitle: {
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: Typography.scale.xs.fontSize,
    },
    notFoundContainer: {
      flex: 1,
      padding: Spacing.four,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notFoundIconBox: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.two,
    },
    notFoundTitle: {
      color: colors.text,
      fontSize: Typography.scale.lg.fontSize,
      marginBottom: Spacing.two,
    },
    notFoundDesc: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.four,
    },
    returnButton: {
      minWidth: 200,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
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
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.lg,
      padding: Spacing.three,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      paddingBottom: Spacing.two,
      marginBottom: Spacing.two,
    },
    modalTitle: {
      color: colors.text,
      fontSize: Typography.scale.md.fontSize,
      letterSpacing: 0.5,
    },
    deleteModalTitle: {
      color: colors.danger,
      fontSize: Typography.scale.md.fontSize,
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
      gap: Spacing.two,
    },
    modalFieldLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      marginTop: Spacing.one,
    },
    modalInput: {
      fontFamily: MonospaceFamily,
      fontSize: Typography.scale.base.fontSize,
      color: colors.text,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.md,
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
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: BorderRadius.md,
      padding: Spacing.two,
    },
    errorText: {
      color: colors.danger,
      letterSpacing: 0.5,
    },
    warningMessage: {
      color: colors.text,
      fontSize: Typography.scale.base.fontSize,
      lineHeight: Typography.scale.base.lineHeight,
      marginVertical: Spacing.one,
    },
    warningSubMessage: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      lineHeight: Typography.scale.sm.lineHeight,
      marginBottom: Spacing.two,
    },
  });
