import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  runOnJS, // NOSONAR
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Car,
  CreditCard,
  FolderPlus,
  Laptop,
  MoreHorizontal,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  X,
  Zap,
} from 'lucide-react-native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { BorderRadius, ColorTheme, MonospaceFamily, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ActionModalProps, Kantong, TagihanFrequency, TransaksiType } from '@/types';
import { ThemedButton } from './ThemedButton';
import { ThemedText } from './ThemedText';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 280,
  mass: 0.8,
};

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string): Date {
  if (!iso) return new Date();
  const parts = iso.split('-');
  if (parts.length === 3) {
    const year = Number.parseInt(parts[0], 10);
    const month = Number.parseInt(parts[1], 10) - 1;
    const day = Number.parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) {
      return d;
    }
  }
  return new Date();
}

function formatDisplayDate(iso: string, locale: string): string {
  const d = parseIsoDate(iso);
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getCategoryIcon(category: string, size = 15, color = '#6B7280') {
  switch (category) {
    case 'FOOD & BEVERAGE':
      return <Utensils size={size} color={color} />;
    case 'BILLS & UTILITIES':
      return <Zap size={size} color={color} />;
    case 'OBLIGATIONS / DEBTS':
      return <ShieldAlert size={size} color={color} />;
    case 'TRANSPORTATION':
      return <Car size={size} color={color} />;
    case 'LIFESTYLE & HOBBY':
      return <ShoppingBag size={size} color={color} />;
    case 'SALARY':
      return <Briefcase size={size} color={color} />;
    case 'FREELANCE':
      return <Laptop size={size} color={color} />;
    case 'INVESTMENT':
      return <TrendingUp size={size} color={color} />;
    default:
      return <MoreHorizontal size={size} color={color} />;
  }
}

type ActionModalStyles = ReturnType<typeof getStyles>;

interface KantongSelectorProps {
  readonly kantongs: readonly Kantong[];
  readonly selectedKantongId: string;
  readonly onSelectKantong: (id: string) => void;
  readonly label: string;
  readonly noKantongText: string;
  readonly colors: ColorTheme;
  readonly styles: ActionModalStyles;
}

function KantongSelector({
  kantongs,
  selectedKantongId,
  onSelectKantong,
  label,
  noKantongText,
  colors,
  styles,
}: Readonly<KantongSelectorProps>) {
  return (
    <>
      <ThemedText variant="caption" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      {kantongs.length === 0 ? (
        <View style={styles.noKantongNotice}>
          <ThemedText variant="caption" style={styles.noKantongText}>
            {noKantongText}
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kantongPillsRow}
        >
          {kantongs.map((k) => {
            const isSelected = k.id === selectedKantongId;
            return (
              <Pressable
                key={k.id}
                onPress={() => onSelectKantong(k.id)}
                style={[
                  styles.kantongPill,
                  isSelected && styles.kantongPillSelected,
                ]}
              >
                <Wallet
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
                <ThemedText
                  variant="caption"
                  weight={isSelected ? 'bold' : 'regular'}
                  style={[
                    styles.kantongPillText,
                    isSelected && styles.kantongPillTextSelected,
                  ]}
                >
                  {k.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </>
  );
}

interface TransactionTypeSelectorProps {
  readonly activeType: TransaksiType;
  readonly onSelectType: (type: TransaksiType) => void;
  readonly label: string;
  readonly expenseLabel: string;
  readonly incomeLabel: string;
  readonly colors: ColorTheme;
  readonly styles: ActionModalStyles;
}

function TransactionTypeSelector({
  activeType,
  onSelectType,
  label,
  expenseLabel,
  incomeLabel,
  colors,
  styles,
}: Readonly<TransactionTypeSelectorProps>) {
  return (
    <>
      <ThemedText variant="caption" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <View style={styles.typeSelectorRow}>
        <Pressable
          onPress={() => onSelectType('EXPENSE')}
          style={[
            styles.typeButton,
            activeType === 'EXPENSE' && styles.typeButtonExpenseSelected,
          ]}
        >
          <ArrowUpRight
            size={16}
            color={
              activeType === 'EXPENSE'
                ? '#FFFFFF'
                : colors.danger
            }
          />
          <ThemedText
            variant="caption"
            weight={activeType === 'EXPENSE' ? 'bold' : 'medium'}
            style={[
              styles.typeButtonText,
              activeType === 'EXPENSE' && styles.typeButtonTextSelected,
            ]}
          >
            {expenseLabel}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => onSelectType('INCOME')}
          style={[
            styles.typeButton,
            activeType === 'INCOME' && styles.typeButtonIncomeSelected,
          ]}
        >
          <ArrowDownLeft
            size={16}
            color={
              activeType === 'INCOME'
                ? '#FFFFFF'
                : colors.success
            }
          />
          <ThemedText
            variant="caption"
            weight={activeType === 'INCOME' ? 'bold' : 'medium'}
            style={[
              styles.typeButtonText,
              activeType === 'INCOME' && styles.typeButtonTextSelected,
            ]}
          >
            {incomeLabel}
          </ThemedText>
        </Pressable>
      </View>
    </>
  );
}

interface CategoryPickerProps {
  readonly activeType: TransaksiType;
  readonly activeCategory: string;
  readonly onSelectCategory: (category: string) => void;
  readonly label: string;
  readonly colors: ColorTheme;
  readonly styles: ActionModalStyles;
}

function CategoryPicker({
  activeType,
  activeCategory,
  onSelectCategory,
  label,
  colors,
  styles,
}: Readonly<CategoryPickerProps>) {
  const categories =
    activeType === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <>
      <ThemedText variant="caption" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPillsRow}
      >
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          const defaultColor =
            activeType === 'EXPENSE' ? colors.accent : colors.success;
          const iconColor = isSelected ? '#FFFFFF' : defaultColor;

          return (
            <Pressable
              key={cat}
              onPress={() => onSelectCategory(cat)}
              style={[
                styles.categoryPill,
                isSelected &&
                  (activeType === 'EXPENSE'
                    ? styles.categoryPillExpenseSelected
                    : styles.categoryPillIncomeSelected),
              ]}
            >
              {getCategoryIcon(cat, 15, iconColor)}
              <ThemedText
                variant="caption"
                weight={isSelected ? 'bold' : 'regular'}
                style={[
                  styles.categoryPillText,
                  isSelected && styles.categoryPillTextSelected,
                ]}
              >
                {cat}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

export function ActionModal({ visible, mode, onClose }: Readonly<ActionModalProps>) {
  const colors = useTheme();
  const { t, language } = useTranslation();

  // Resolve all translated strings at the top component level (outside any worklet scope)
  const strings = useMemo(
    () => ({
      // Errors
      errKantongNameRequired: t('errKantongNameRequired'),
      errFailedCreateKantong: t('errFailedCreateKantong'),
      errSelectKantong: t('errSelectKantong'),
      errAmountGreaterZero: t('errAmountGreaterZero'),
      errDescriptionRequired: t('errDescriptionRequired'),
      errFailedSubmitTransaction: t('errFailedSubmitTransaction'),
      errBillTitleRequired: t('errBillTitleRequired'),
      errDueDateRequired: t('errDueDateRequired'),
      errInvalidDateFormat: t('errInvalidDateFormat'),
      errFailedCreateBill: t('errFailedCreateBill'),
      errPhotoAccess: t('errPhotoAccess'),
      errFailedPickImage: t('errFailedPickImage'),
      errWishlistTitleRequired: t('errWishlistTitleRequired'),
      errPriceGreaterZero: t('errPriceGreaterZero'),
      errFailedCreateWishlist: t('errFailedCreateWishlist'),

      // Modal Headers
      modalCreateKantong: t('modalCreateKantong'),
      modalRecordTransaction: t('modalRecordTransaction'),
      modalNewBill: t('modalNewBill'),
      modalNewWishlist: t('modalNewWishlist'),

      // Kantong Form
      modalKantongName: t('modalKantongName'),
      modalKantongNamePlaceholder: t('modalKantongNamePlaceholder'),
      modalInitialBalance: t('modalInitialBalance'),
      modalCreateKantongBtn: t('modalCreateKantongBtn'),

      // Transaksi Form
      modalSelectKantong: t('modalSelectKantong'),
      modalNoKantong: t('modalNoKantong'),
      modalTransactionType: t('modalTransactionType'),
      modalExpense: t('modalExpense'),
      modalIncome: t('modalIncome'),
      modalCategory: t('modalCategory'),
      modalAmountIdr: t('modalAmountIdr'),
      modalDescription: t('modalDescription'),
      modalDescPlaceholder: t('modalDescPlaceholder'),
      modalSubmitTransaction: t('modalSubmitTransaction'),

      // Tagihan Form
      modalBillTitle: t('modalBillTitle'),
      modalBillTitlePlaceholder: t('modalBillTitlePlaceholder'),
      modalDueDate: t('modalDueDate'),
      modalBillRecurrence: t('modalBillRecurrence'),
      modalOneOff: t('modalOneOff'),
      modalRecurring: t('modalRecurring'),
      modalFrequency: t('modalFrequency'),
      modalCreateBill: t('modalCreateBill'),

      // Wishlist Form
      modalTargetTitle: t('modalTargetTitle'),
      modalTargetTitlePlaceholder: t('modalTargetTitlePlaceholder'),
      modalDescOptional: t('modalDescOptional'),
      modalDescOptionalPlaceholder: t('modalDescOptionalPlaceholder'),
      modalTargetPrice: t('modalTargetPrice'),
      modalImageAttachment: t('modalImageAttachment'),
      modalImageAttached: t('modalImageAttached'),
      modalChangeImage: t('modalChangeImage'),
      modalRemoveImage: t('modalRemoveImage'),
      modalPickImage: t('modalPickImage'),
      modalImageUrlLabel: t('modalImageUrlLabel'),
      modalImageUrlPlaceholder: t('modalImageUrlPlaceholder'),
      modalPurchaseLink: t('modalPurchaseLink'),
      modalPurchaseLinkPlaceholder: t('modalPurchaseLinkPlaceholder'),
      modalCreateWishlistBtn: t('modalCreateWishlistBtn'),
      wishlistFundingSourceLabel: t('wishlistFundingSourceLabel'),
      wishlistFundingSourcePlaceholder: t('wishlistFundingSourcePlaceholder'),
    }),
    [t],
  );

  const styles = useMemo(() => getStyles(colors), [colors]);
  const { kantongs, addKantong, addTransaksi, addTagihan, addWishlist } = useFinanceStore();
  const themeMode = useFinanceStore((state) => state.themeMode);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Form State: Kantong
  const [kantongName, setKantongName] = useState('');
  const [kantongBalance, setKantongBalance] = useState('');

  // Form State: Transaksi
  const [selectedKantongId, setSelectedKantongId] = useState<string>('');
  const [transaksiAmount, setTransaksiAmount] = useState('');
  const [transaksiType, setTransaksiType] = useState<TransaksiType>('EXPENSE');
  const [transaksiCategory, setTransaksiCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [transaksiDescription, setTransaksiDescription] = useState('');

  const handleSelectTransaksiType = (type: TransaksiType) => {
    setTransaksiType(type);
    if (type === 'EXPENSE') {
      if (!(EXPENSE_CATEGORIES as readonly string[]).includes(transaksiCategory)) {
        setTransaksiCategory(EXPENSE_CATEGORIES[0]);
      }
    } else if (!(INCOME_CATEGORIES as readonly string[]).includes(transaksiCategory)) {
      setTransaksiCategory(INCOME_CATEGORIES[0]);
    }
  };

  // Form State: Tagihan
  const [tagihanTitle, setTagihanTitle] = useState('');
  const [tagihanAmount, setTagihanAmount] = useState('');
  const [tagihanDueDate, setTagihanDueDate] = useState(() => formatIsoDate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tagihanIsRecurring, setTagihanIsRecurring] = useState(false);
  const [tagihanFrequency, setTagihanFrequency] = useState<TagihanFrequency>('MONTHLY');

  const handleDateValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (selectedDate) {
      setTagihanDueDate(formatIsoDate(selectedDate));
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleDatePickerDismiss = () => {
    setShowDatePicker(false);
  };

  // Form State: Wishlist
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [wishlistDescription, setWishlistDescription] = useState('');
  const [wishlistPrice, setWishlistPrice] = useState('');
  const [wishlistImageUrl, setWishlistImageUrl] = useState('');
  const [wishlistPurchaseLink, setWishlistPurchaseLink] = useState('');
  const [wishlistFundingSource, setWishlistFundingSource] = useState('');

  // UI State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      if (mode === 'TRANSAKSI' && kantongs.length > 0 && !selectedKantongId) {
        setSelectedKantongId(kantongs[0].id);
      }
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, SPRING_CONFIG);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
    }
  }, [visible, mode, kantongs, selectedKantongId]);

  const smoothClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, (finished) => {
      'worklet';
      if (finished) {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        runOnJS(onClose)(); // NOSONAR
      }
    });
  };

  const handleCreateKantong = async () => {
    if (!kantongName.trim()) {
      setErrorMessage(strings.errKantongNameRequired);
      return;
    }

    const parsedBalance = Number.parseFloat(kantongBalance.replace(/[^0-9.-]+/g, '')) || 0;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await addKantong({
        name: kantongName.trim(),
        balance: parsedBalance,
      });

      setKantongName('');
      setKantongBalance('');
      setIsSubmitting(false);
      smoothClose();
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : strings.errFailedCreateKantong;
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleCreateTransaksi = async () => {
    if (!selectedKantongId) {
      setErrorMessage(strings.errSelectKantong);
      return;
    }

    const parsedAmount = Number.parseFloat(transaksiAmount.replace(/[^0-9.-]+/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage(strings.errAmountGreaterZero);
      return;
    }

    if (!transaksiDescription.trim()) {
      setErrorMessage(strings.errDescriptionRequired);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await addTransaksi({
        kantongId: selectedKantongId,
        amount: parsedAmount,
        type: transaksiType,
        category: transaksiCategory,
        description: transaksiDescription.trim(),
      });

      setTransaksiAmount('');
      setTransaksiDescription('');
      setTransaksiCategory(
        transaksiType === 'EXPENSE' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]
      );
      setIsSubmitting(false);
      smoothClose();
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : strings.errFailedSubmitTransaction;
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleCreateTagihan = async () => {
    if (!tagihanTitle.trim()) {
      setErrorMessage(strings.errBillTitleRequired);
      return;
    }

    const parsedAmount = Number.parseFloat(tagihanAmount.replace(/[^0-9.-]+/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage(strings.errAmountGreaterZero);
      return;
    }

    if (!tagihanDueDate.trim()) {
      setErrorMessage(strings.errDueDateRequired);
      return;
    }

    // Format validation: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tagihanDueDate.trim())) {
      setErrorMessage(strings.errInvalidDateFormat);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await addTagihan({
        title: tagihanTitle.trim(),
        amount: parsedAmount,
        dueDate: tagihanDueDate.trim(),
        isRecurring: tagihanIsRecurring,
        frequency: tagihanIsRecurring ? tagihanFrequency : null,
      });

      setTagihanTitle('');
      setTagihanAmount('');
      setTagihanDueDate(formatIsoDate(new Date()));
      setTagihanIsRecurring(false);
      setTagihanFrequency('MONTHLY');
      setIsSubmitting(false);
      smoothClose();
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : strings.errFailedCreateBill;
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage(strings.errPhotoAccess);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setWishlistImageUrl(result.assets[0].uri);
        setErrorMessage(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : strings.errFailedPickImage;
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleCreateWishlist = async () => {
    if (!wishlistTitle.trim()) {
      setErrorMessage(strings.errWishlistTitleRequired);
      return;
    }

    const parsedPrice = Number.parseFloat(wishlistPrice.replace(/[^0-9.-]+/g, ''));
    if (!parsedPrice || parsedPrice <= 0) {
      setErrorMessage(strings.errPriceGreaterZero);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await addWishlist({
        title: wishlistTitle.trim(),
        description: wishlistDescription.trim(),
        price: parsedPrice,
        imageUrl: wishlistImageUrl.trim(),
        imageUri: wishlistImageUrl.trim(),
        purchaseLink: wishlistPurchaseLink.trim() || null,
        funding_source: wishlistFundingSource.trim() || null,
      });

      setWishlistTitle('');
      setWishlistDescription('');
      setWishlistPrice('');
      setWishlistImageUrl('');
      setWishlistPurchaseLink('');
      setWishlistFundingSource('');
      setIsSubmitting(false);
      smoothClose();
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : strings.errFailedCreateWishlist;
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const renderModalHeader = () => {
    let title = strings.modalCreateKantong;
    let icon = <FolderPlus size={18} color={colors.accent} />;

    if (mode === 'TRANSAKSI') {
      title = strings.modalRecordTransaction;
      icon = <CreditCard size={18} color={colors.accent} />;
    } else if (mode === 'TAGIHAN') {
      title = strings.modalNewBill;
      icon = <Receipt size={18} color={colors.warning} />;
    } else if (mode === 'WISHLIST') {
      title = strings.modalNewWishlist;
      icon = <Sparkles size={18} color={colors.accent} />;
    }

    return (
      <View style={styles.sheetHeader}>
        <View style={styles.sheetHeaderLeft}>
          <View style={styles.headerIconContainer}>{icon}</View>
          <ThemedText weight="bold" style={styles.sheetTitle}>
            {title}
          </ThemedText>
        </View>
        <Pressable
          onPress={smoothClose}
          style={({ pressed }) => [styles.closePressable, pressed && styles.closePressed]}
          hitSlop={8}
        >
          <X size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={smoothClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={styles.backdropPressable} onPress={smoothClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <View style={styles.dragIndicatorWrapper}>
              <View style={styles.dragIndicator} />
            </View>

            {renderModalHeader()}

            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {Boolean(errorMessage) && (
                <View style={styles.errorBox}>
                  <ThemedText variant="caption" style={styles.errorText}>
                    {errorMessage}
                  </ThemedText>
                </View>
              )}

              {mode === 'KANTONG' && (
                <View style={styles.formGroup}>
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalKantongName}
                  </ThemedText>
                  <TextInput
                    value={kantongName}
                    onChangeText={setKantongName}
                    placeholder={strings.modalKantongNamePlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    autoCapitalize="characters"
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalInitialBalance}
                  </ThemedText>
                  <TextInput
                    value={kantongBalance}
                    onChangeText={setKantongBalance}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    style={[styles.input, styles.monoInput]}
                  />

                  <View style={styles.submitContainer}>
                    <ThemedButton
                      title={strings.modalCreateKantongBtn}
                      variant="primary"
                      size="lg"
                      loading={isSubmitting}
                      onPress={handleCreateKantong}
                    />
                  </View>
                </View>
              )}

              {mode === 'TRANSAKSI' && (
                <View style={styles.formGroup}>
                  {/* Kantong Selection */}
                  <KantongSelector
                    kantongs={kantongs}
                    selectedKantongId={selectedKantongId}
                    onSelectKantong={setSelectedKantongId}
                    label={strings.modalSelectKantong}
                    noKantongText={strings.modalNoKantong}
                    colors={colors}
                    styles={styles}
                  />

                  {/* Transaction Type: Expense vs Income */}
                  <TransactionTypeSelector
                    activeType={transaksiType}
                    onSelectType={handleSelectTransaksiType}
                    label={strings.modalTransactionType}
                    expenseLabel={strings.modalExpense}
                    incomeLabel={strings.modalIncome}
                    colors={colors}
                    styles={styles}
                  />

                  {/* Category Selection with Lucide Icons */}
                  <CategoryPicker
                    activeType={transaksiType}
                    activeCategory={transaksiCategory}
                    onSelectCategory={setTransaksiCategory}
                    label={strings.modalCategory}
                    colors={colors}
                    styles={styles}
                  />

                  {/* Amount Input */}
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalAmountIdr}
                  </ThemedText>
                  <TextInput
                    value={transaksiAmount}
                    onChangeText={setTransaksiAmount}
                    placeholder="50000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    style={[styles.input, styles.monoInput]}
                  />

                  {/* Description Input */}
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalDescription}
                  </ThemedText>
                  <TextInput
                    value={transaksiDescription}
                    onChangeText={setTransaksiDescription}
                    placeholder={strings.modalDescPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <View style={styles.submitContainer}>
                    <ThemedButton
                      title={strings.modalSubmitTransaction}
                      variant={transaksiType === 'EXPENSE' ? 'primary' : 'success'}
                      size="lg"
                      disabled={kantongs.length === 0}
                      loading={isSubmitting}
                      onPress={handleCreateTransaksi}
                    />
                  </View>
                </View>
              )}

              {mode === 'TAGIHAN' && (
                <View style={styles.formGroup}>
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalBillTitle}
                  </ThemedText>
                  <TextInput
                    value={tagihanTitle}
                    onChangeText={setTagihanTitle}
                    placeholder={strings.modalBillTitlePlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalAmountIdr}
                  </ThemedText>
                  <TextInput
                    value={tagihanAmount}
                    onChangeText={setTagihanAmount}
                    placeholder="150000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    style={[styles.input, styles.monoInput]}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalDueDate}
                  </ThemedText>
                  <Pressable
                    style={[
                      styles.input,
                      styles.datePickerTrigger,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View style={styles.datePickerTriggerLeft}>
                      <Calendar size={18} color={colors.accent} />
                      <ThemedText variant="body" weight="medium" style={styles.datePickerValueText}>
                        {formatDisplayDate(tagihanDueDate, language)}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.datePickerBadge,
                        {
                          backgroundColor: colors.backgroundSelected,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
                        {language === 'id' ? 'Ubah' : 'Change'}
                      </ThemedText>
                    </View>
                  </Pressable>

                  {Platform.OS === 'android' && showDatePicker && (
                    <DateTimePicker
                      value={parseIsoDate(tagihanDueDate)}
                      mode="date"
                      display="default"
                      onValueChange={handleDateValueChange}
                      onDismiss={handleDatePickerDismiss}
                    />
                  )}

                  {Platform.OS === 'ios' && (
                    <Modal
                      visible={showDatePicker}
                      transparent
                      animationType="fade"
                      onRequestClose={() => setShowDatePicker(false)}
                    >
                      <Pressable
                        style={styles.datePickerBackdrop}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Pressable
                          style={[
                            styles.datePickerModalContent,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={(e) => e.stopPropagation()}
                        >
                          <View style={styles.datePickerModalHeader}>
                            <ThemedText variant="body" weight="bold">
                              {strings.modalDueDate}
                            </ThemedText>
                            <ThemedButton
                              title={language === 'id' ? 'Selesai' : 'Done'}
                              size="sm"
                              variant="primary"
                              onPress={() => setShowDatePicker(false)}
                            />
                          </View>
                          <DateTimePicker
                            value={parseIsoDate(tagihanDueDate)}
                            mode="date"
                            display="inline"
                            themeVariant={themeMode === 'light' ? 'light' : 'dark'}
                            onValueChange={handleDateValueChange}
                          />
                        </Pressable>
                      </Pressable>
                    </Modal>
                  )}

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalBillRecurrence}
                  </ThemedText>
                  <View style={styles.typeSelectorRow}>
                    <Pressable
                      onPress={() => setTagihanIsRecurring(false)}
                      style={[
                        styles.typeButton,
                        !tagihanIsRecurring && styles.typeButtonSelected,
                      ]}
                    >
                      <Calendar
                        size={15}
                        color={!tagihanIsRecurring ? '#FFFFFF' : colors.textSecondary}
                      />
                      <ThemedText
                        variant="caption"
                        weight={!tagihanIsRecurring ? 'bold' : 'medium'}
                        style={[
                          styles.typeButtonText,
                          !tagihanIsRecurring && styles.typeButtonTextSelected,
                        ]}
                      >
                        {strings.modalOneOff}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => setTagihanIsRecurring(true)}
                      style={[
                        styles.typeButton,
                        tagihanIsRecurring && styles.typeButtonSelected,
                      ]}
                    >
                      <RotateCcw
                        size={15}
                        color={tagihanIsRecurring ? '#FFFFFF' : colors.textSecondary}
                      />
                      <ThemedText
                        variant="caption"
                        weight={tagihanIsRecurring ? 'bold' : 'medium'}
                        style={[
                          styles.typeButtonText,
                          tagihanIsRecurring && styles.typeButtonTextSelected,
                        ]}
                      >
                        {strings.modalRecurring}
                      </ThemedText>
                    </Pressable>
                  </View>

                  {tagihanIsRecurring && (
                    <>
                      <ThemedText variant="caption" style={styles.fieldLabel}>
                        {strings.modalFrequency}
                      </ThemedText>
                      <View style={styles.frequencyRow}>
                        {(['WEEKLY', 'MONTHLY', 'YEARLY'] as TagihanFrequency[]).map((freq) => {
                          const isSelected = tagihanFrequency === freq;
                          return (
                            <Pressable
                              key={freq}
                              onPress={() => setTagihanFrequency(freq)}
                              style={[
                                styles.freqButton,
                                isSelected && styles.freqButtonSelected,
                              ]}
                            >
                              <ThemedText
                                variant="caption"
                                weight={isSelected ? 'bold' : 'regular'}
                                style={[
                                  styles.freqButtonText,
                                  isSelected && styles.freqButtonTextSelected,
                                ]}
                              >
                                {freq}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  <View style={styles.submitContainer}>
                    <ThemedButton
                      title={strings.modalCreateBill}
                      variant="primary"
                      size="lg"
                      loading={isSubmitting}
                      onPress={handleCreateTagihan}
                    />
                  </View>
                </View>
              )}

              {mode === 'WISHLIST' && (
                <View style={styles.formGroup}>
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalTargetTitle}
                  </ThemedText>
                  <TextInput
                    value={wishlistTitle}
                    onChangeText={setWishlistTitle}
                    placeholder={strings.modalTargetTitlePlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalDescOptional}
                  </ThemedText>
                  <TextInput
                    value={wishlistDescription}
                    onChangeText={setWishlistDescription}
                    placeholder={strings.modalDescOptionalPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalTargetPrice}
                  </ThemedText>
                  <TextInput
                    value={wishlistPrice}
                    onChangeText={setWishlistPrice}
                    placeholder="2500000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    style={[styles.input, styles.monoInput]}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.wishlistFundingSourceLabel}
                  </ThemedText>
                  <TextInput
                    value={wishlistFundingSource}
                    onChangeText={setWishlistFundingSource}
                    placeholder={strings.wishlistFundingSourcePlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalImageAttachment}
                  </ThemedText>

                  {wishlistImageUrl ? (
                    <View style={styles.imagePreviewBox}>
                      <Image
                        source={{ uri: wishlistImageUrl }}
                        style={styles.imageThumbnail}
                        resizeMode="cover"
                      />
                      <View style={styles.imagePreviewMeta}>
                        <ThemedText
                          variant="caption"
                          weight="bold"
                          style={styles.imageSelectedLabel}
                          numberOfLines={1}
                        >
                          {strings.modalImageAttached}
                        </ThemedText>
                        <ThemedText
                          variant="caption"
                          style={styles.imageUriLabel}
                          numberOfLines={1}
                        >
                          {wishlistImageUrl}
                        </ThemedText>
                        <View style={styles.imageActionButtons}>
                          <ThemedButton
                            title={strings.modalChangeImage}
                            variant="outline"
                            size="sm"
                            style={styles.imageBtn}
                            onPress={handlePickImage}
                          />
                          <ThemedButton
                            title={strings.modalRemoveImage}
                            variant="outline"
                            size="sm"
                            style={styles.imageBtn}
                            onPress={() => setWishlistImageUrl('')}
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <ThemedButton
                      title={strings.modalPickImage}
                      variant="outline"
                      size="md"
                      onPress={handlePickImage}
                    />
                  )}

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalImageUrlLabel}
                  </ThemedText>
                  <TextInput
                    value={wishlistImageUrl}
                    onChangeText={setWishlistImageUrl}
                    placeholder={strings.modalImageUrlPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    autoCapitalize="none"
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    {strings.modalPurchaseLink}
                  </ThemedText>
                  <TextInput
                    value={wishlistPurchaseLink}
                    onChangeText={setWishlistPurchaseLink}
                    placeholder={strings.modalPurchaseLinkPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="url"
                  />

                  <View style={styles.submitContainer}>
                    <ThemedButton
                      title={strings.modalCreateWishlistBtn}
                      variant="primary"
                      size="lg"
                      loading={isSubmitting}
                      onPress={handleCreateWishlist}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    backdropPressable: {
      flex: 1,
    },
    keyboardAvoid: {
      width: '100%',
    },
    sheetContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius['2xl'],
      borderTopRightRadius: BorderRadius['2xl'],
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingBottom: Platform.OS === 'ios' ? Spacing.six : Spacing.four,
      maxHeight: SCREEN_HEIGHT * 0.88,
    },
    dragIndicatorWrapper: {
      alignItems: 'center',
      paddingTop: Spacing.two,
      paddingBottom: Spacing.one,
    },
    dragIndicator: {
      width: 36,
      height: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.border,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two * 1.5,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    sheetHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    headerIconContainer: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetTitle: {
      fontSize: Typography.scale.sm.fontSize,
      color: colors.text,
      letterSpacing: 0.5,
    },
    closePressable: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closePressed: {
      opacity: 0.7,
    },
    sheetContent: {
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
    },
    errorBox: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: BorderRadius.md,
      padding: Spacing.two,
      marginBottom: Spacing.three,
    },
    errorText: {
      color: colors.danger,
      letterSpacing: 0.3,
    },
    formGroup: {
      gap: Spacing.two,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      fontWeight: Typography.weight.semibold,
      letterSpacing: 0.8,
      marginTop: Spacing.one,
      textTransform: 'uppercase',
    },
    input: {
      fontFamily: Typography.sans,
      fontSize: Typography.scale.base.fontSize,
      color: colors.text,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two * 1.25,
      borderRadius: BorderRadius.md,
    },
    monoInput: {
      fontFamily: MonospaceFamily,
    },
    kantongPillsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      paddingVertical: Spacing.half,
    },
    kantongPill: {
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
    kantongPillSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    kantongPillText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
    },
    kantongPillTextSelected: {
      color: '#FFFFFF',
    },
    noKantongNotice: {
      padding: Spacing.two,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSelected,
    },
    noKantongText: {
      color: colors.textMuted,
    },
    typeSelectorRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    typeButton: {
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.one * 1.5,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSelected,
      paddingVertical: Spacing.two * 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
    },
    typeButtonExpenseSelected: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    typeButtonIncomeSelected: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    typeButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    typeButtonText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      letterSpacing: 0.5,
    },
    typeButtonTextSelected: {
      color: '#FFFFFF',
    },
    categoryPillsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      paddingVertical: Spacing.half,
    },
    categoryPill: {
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
    categoryPillExpenseSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    categoryPillIncomeSelected: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    categoryPillText: {
      color: colors.textSecondary,
      fontSize: Typography.scale.xs.fontSize,
      letterSpacing: 0.2,
    },
    categoryPillTextSelected: {
      color: '#FFFFFF',
      fontSize: Typography.scale.xs.fontSize,
      letterSpacing: 0.2,
    },
    frequencyRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    freqButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSelected,
      paddingVertical: Spacing.two,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
    },
    freqButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    freqButtonText: {
      color: colors.textSecondary,
    },
    freqButtonTextSelected: {
      color: '#FFFFFF',
    },
    submitContainer: {
      marginTop: Spacing.three,
    },
    imagePreviewBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSelected,
      padding: Spacing.two,
      borderRadius: BorderRadius.md,
    },
    imageThumbnail: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundElement,
    },
    imagePreviewMeta: {
      flex: 1,
      gap: Spacing.one,
    },
    imageSelectedLabel: {
      color: colors.text,
      letterSpacing: 0.3,
    },
    imageUriLabel: {
      color: colors.textMuted,
      fontSize: Typography.scale.xs.fontSize,
    },
    imageActionButtons: {
      flexDirection: 'row',
      gap: Spacing.one,
      marginTop: Spacing.half,
    },
    imageBtn: {
      flex: 1,
    },
    datePickerTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    datePickerTriggerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    datePickerValueText: {
      fontSize: Typography.scale.base.fontSize,
    },
    datePickerBadge: {
      paddingHorizontal: Spacing.two,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
    },
    datePickerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
    },
    datePickerModalContent: {
      width: '100%',
      maxWidth: 360,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      padding: Spacing.three,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    datePickerModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Spacing.two,
      marginBottom: Spacing.two,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });

