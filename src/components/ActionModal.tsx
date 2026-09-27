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
import * as ImagePicker from 'expo-image-picker';
import Animated, {
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
import { useFinanceStore } from '@/store/useFinanceStore';
import { ActionModalProps, TagihanFrequency, TransaksiType } from '@/types';
import { ThemedButton } from './ThemedButton';
import { ThemedText } from './ThemedText';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 280,
  mass: 0.8,
};

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

export function ActionModal({ visible, mode, onClose }: ActionModalProps) {
  const colors = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { kantongs, addKantong, addTransaksi, addTagihan, addWishlist } = useFinanceStore();

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
  const [tagihanDueDate, setTagihanDueDate] = useState('');
  const [tagihanIsRecurring, setTagihanIsRecurring] = useState(false);
  const [tagihanFrequency, setTagihanFrequency] = useState<TagihanFrequency>('MONTHLY');

  // Form State: Wishlist
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [wishlistDescription, setWishlistDescription] = useState('');
  const [wishlistPrice, setWishlistPrice] = useState('');
  const [wishlistImageUrl, setWishlistImageUrl] = useState('');
  const [wishlistPurchaseLink, setWishlistPurchaseLink] = useState('');

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
        onClose();
      }
    });
  };

  const handleCreateKantong = async () => {
    if (!kantongName.trim()) {
      setErrorMessage('ERROR: KANTONG NAME IS REQUIRED');
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
      const msg = err instanceof Error ? err.message : 'FAILED TO CREATE KANTONG';
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleCreateTransaksi = async () => {
    if (!selectedKantongId) {
      setErrorMessage('ERROR: SELECT A TARGET KANTONG');
      return;
    }

    const parsedAmount = Number.parseFloat(transaksiAmount.replace(/[^0-9.-]+/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('ERROR: AMOUNT MUST BE GREATER THAN 0');
      return;
    }

    if (!transaksiDescription.trim()) {
      setErrorMessage('ERROR: DESCRIPTION IS REQUIRED');
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
      const msg = err instanceof Error ? err.message : 'FAILED TO SUBMIT TRANSAKSI';
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleCreateTagihan = async () => {
    if (!tagihanTitle.trim()) {
      setErrorMessage('ERROR: BILL TITLE IS REQUIRED');
      return;
    }

    const parsedAmount = Number.parseFloat(tagihanAmount.replace(/[^0-9.-]+/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('ERROR: AMOUNT MUST BE GREATER THAN 0');
      return;
    }

    if (!tagihanDueDate.trim()) {
      setErrorMessage('ERROR: DUE DATE IS REQUIRED (YYYY-MM-DD)');
      return;
    }

    // Format validation: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tagihanDueDate.trim())) {
      setErrorMessage('ERROR: INVALID DATE FORMAT (USE YYYY-MM-DD)');
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
      setTagihanDueDate('');
      setTagihanIsRecurring(false);
      setTagihanFrequency('MONTHLY');
      setIsSubmitting(false);
      smoothClose();
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'FAILED TO CREATE BILL';
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('ERROR: PHOTO LIBRARY ACCESS IS REQUIRED');
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
      const msg = err instanceof Error ? err.message : 'FAILED TO PICK IMAGE';
      setErrorMessage(`ERROR: ${msg.toUpperCase()}`);
    }
  };

  const handleCreateWishlist = async () => {
    if (!wishlistTitle.trim()) {
      setErrorMessage('ERROR: WISHLIST TITLE IS REQUIRED');
      return;
    }

    const parsedPrice = Number.parseFloat(wishlistPrice.replace(/[^0-9.-]+/g, ''));
    if (!parsedPrice || parsedPrice <= 0) {
      setErrorMessage('ERROR: PRICE MUST BE GREATER THAN 0');
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
      });

      setWishlistTitle('');
      setWishlistDescription('');
      setWishlistPrice('');
      setWishlistImageUrl('');
      setWishlistPurchaseLink('');
      setIsSubmitting(false);
      smoothClose();
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'FAILED TO CREATE WISHLIST TARGET';
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
    let title = 'CREATE KANTONG';
    let icon = <FolderPlus size={18} color={colors.accent} />;

    if (mode === 'TRANSAKSI') {
      title = 'RECORD TRANSACTION';
      icon = <CreditCard size={18} color={colors.accent} />;
    } else if (mode === 'TAGIHAN') {
      title = 'NEW BILL OBLIGATION';
      icon = <Receipt size={18} color={colors.warning} />;
    } else if (mode === 'WISHLIST') {
      title = 'NEW WISHLIST GOAL';
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
                    KANTONG NAME
                  </ThemedText>
                  <TextInput
                    value={kantongName}
                    onChangeText={setKantongName}
                    placeholder="e.g. TABUNGAN, OPERASIONAL, GAJI"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    autoCapitalize="characters"
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    INITIAL BALANCE (IDR)
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
                      title="CREATE KANTONG"
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
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    SELECT KANTONG
                  </ThemedText>
                  {kantongs.length === 0 ? (
                    <View style={styles.noKantongNotice}>
                      <ThemedText variant="caption" style={styles.noKantongText}>
                        No kantong available. Create one first.
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
                            onPress={() => setSelectedKantongId(k.id)}
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

                  {/* Transaction Type: Expense vs Income */}
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    TRANSACTION TYPE
                  </ThemedText>
                  <View style={styles.typeSelectorRow}>
                    <Pressable
                      onPress={() => handleSelectTransaksiType('EXPENSE')}
                      style={[
                        styles.typeButton,
                        transaksiType === 'EXPENSE' && styles.typeButtonExpenseSelected,
                      ]}
                    >
                      <ArrowUpRight
                        size={16}
                        color={
                          transaksiType === 'EXPENSE'
                            ? '#FFFFFF'
                            : colors.danger
                        }
                      />
                      <ThemedText
                        variant="caption"
                        weight={transaksiType === 'EXPENSE' ? 'bold' : 'medium'}
                        style={[
                          styles.typeButtonText,
                          transaksiType === 'EXPENSE' && styles.typeButtonTextSelected,
                        ]}
                      >
                        EXPENSE
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => handleSelectTransaksiType('INCOME')}
                      style={[
                        styles.typeButton,
                        transaksiType === 'INCOME' && styles.typeButtonIncomeSelected,
                      ]}
                    >
                      <ArrowDownLeft
                        size={16}
                        color={
                          transaksiType === 'INCOME'
                            ? '#FFFFFF'
                            : colors.success
                        }
                      />
                      <ThemedText
                        variant="caption"
                        weight={transaksiType === 'INCOME' ? 'bold' : 'medium'}
                        style={[
                          styles.typeButtonText,
                          transaksiType === 'INCOME' && styles.typeButtonTextSelected,
                        ]}
                      >
                        INCOME
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Category Selection with Lucide Icons */}
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    CATEGORY
                  </ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryPillsRow}
                  >
                    {(transaksiType === 'EXPENSE'
                      ? EXPENSE_CATEGORIES
                      : INCOME_CATEGORIES
                    ).map((cat) => {
                      const isSelected = transaksiCategory === cat;
                      const defaultColor = transaksiType === 'EXPENSE'
                        ? colors.accent
                        : colors.success;
                      const iconColor = isSelected ? '#FFFFFF' : defaultColor;

                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setTransaksiCategory(cat)}
                          style={[
                            styles.categoryPill,
                            isSelected &&
                              (transaksiType === 'EXPENSE'
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

                  {/* Amount Input */}
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    AMOUNT (IDR)
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
                    DESCRIPTION
                  </ThemedText>
                  <TextInput
                    value={transaksiDescription}
                    onChangeText={setTransaksiDescription}
                    placeholder="e.g. Groceries, Cloud server, Client invoice"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <View style={styles.submitContainer}>
                    <ThemedButton
                      title="SUBMIT TRANSACTION"
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
                    BILL TITLE
                  </ThemedText>
                  <TextInput
                    value={tagihanTitle}
                    onChangeText={setTagihanTitle}
                    placeholder="e.g. WiFi Fiber, Apartment Rent, Spotify"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    AMOUNT (IDR)
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
                    DUE DATE (YYYY-MM-DD)
                  </ThemedText>
                  <TextInput
                    value={tagihanDueDate}
                    onChangeText={setTagihanDueDate}
                    placeholder="2026-10-01"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, styles.monoInput]}
                    autoCapitalize="none"
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    BILL RECURRENCE
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
                        ONE-OFF
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
                        RECURRING
                      </ThemedText>
                    </Pressable>
                  </View>

                  {tagihanIsRecurring && (
                    <>
                      <ThemedText variant="caption" style={styles.fieldLabel}>
                        FREQUENCY
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
                      title="CREATE BILL"
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
                    TARGET TITLE
                  </ThemedText>
                  <TextInput
                    value={wishlistTitle}
                    onChangeText={setWishlistTitle}
                    placeholder="e.g. Mechanical Keyboard, Sony WH-1000XM5"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    DESCRIPTION (OPTIONAL)
                  </ThemedText>
                  <TextInput
                    value={wishlistDescription}
                    onChangeText={setWishlistDescription}
                    placeholder="e.g. Custom build with tactile switches"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    TARGET PRICE (IDR)
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
                    IMAGE ATTACHMENT
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
                          Image Attached
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
                            title="CHANGE"
                            variant="outline"
                            size="sm"
                            style={styles.imageBtn}
                            onPress={handlePickImage}
                          />
                          <ThemedButton
                            title="REMOVE"
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
                      title="+ PICK IMAGE FROM GALLERY"
                      variant="outline"
                      size="md"
                      onPress={handlePickImage}
                    />
                  )}

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    OR ENTER IMAGE URL / PATH
                  </ThemedText>
                  <TextInput
                    value={wishlistImageUrl}
                    onChangeText={setWishlistImageUrl}
                    placeholder="file:///... or https://example.com/image.png"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    autoCapitalize="none"
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    PURCHASE LINK (OPTIONAL)
                  </ThemedText>
                  <TextInput
                    value={wishlistPurchaseLink}
                    onChangeText={setWishlistPurchaseLink}
                    placeholder="https://tokopedia.com/..."
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="url"
                  />

                  <View style={styles.submitContainer}>
                    <ThemedButton
                      title="CREATE WISHLIST TARGET"
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
  });

