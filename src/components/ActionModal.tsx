import React, { useEffect, useState } from 'react';
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
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { Colors, MonospaceFamily, Palette, Spacing, Typography } from '@/constants/theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ActionModalProps, TagihanFrequency, TransaksiType } from '@/types';
import { ThemedButton } from './ThemedButton';
import { ThemedText } from './ThemedText';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const SPRING_CONFIG = {
  damping: 22,
  stiffness: 280,
  mass: 0.8,
};

export function ActionModal({ visible, mode, onClose }: ActionModalProps) {
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
    } else {
      if (!(INCOME_CATEGORIES as readonly string[]).includes(transaksiCategory)) {
        setTransaksiCategory(INCOME_CATEGORIES[0]);
      }
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
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const handleCreateKantong = async () => {
    if (!kantongName.trim()) {
      setErrorMessage('ERROR: KANTONG NAME IS REQUIRED');
      return;
    }

    const parsedBalance = parseFloat(kantongBalance.replace(/[^0-9.-]+/g, '')) || 0;

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

    const parsedAmount = parseFloat(transaksiAmount.replace(/[^0-9.-]+/g, ''));
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

    const parsedAmount = parseFloat(tagihanAmount.replace(/[^0-9.-]+/g, ''));
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

    const parsedPrice = parseFloat(wishlistPrice.replace(/[^0-9.-]+/g, ''));
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

  const getSheetTitle = () => {
    switch (mode) {
      case 'KANTONG':
        return '// CREATE NEW KANTONG';
      case 'TRANSAKSI':
        return '// RECORD TRANSAKSI';
      case 'TAGIHAN':
        return '// NEW BILL OBLIGATION';
      case 'WISHLIST':
        return '// NEW WISHLIST TARGET';
    }
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
            <View style={styles.sheetHeader}>
              <ThemedText weight="bold" style={styles.sheetTitle}>
                {getSheetTitle()}
              </ThemedText>
              <Pressable onPress={smoothClose} style={styles.closePressable}>
                <ThemedText variant="caption" style={styles.closeText}>
                  [ ESC ]
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
            >
              {errorMessage && (
                <View style={styles.errorBox}>
                  <ThemedText variant="caption" style={styles.errorText}>
                    {errorMessage}
                  </ThemedText>
                </View>
              )}

              {mode === 'KANTONG' && (
                <View style={styles.formGroup}>
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    NAME
                  </ThemedText>
                  <TextInput
                    value={kantongName}
                    onChangeText={setKantongName}
                    placeholder="e.g. TABUNGAN, OPERASIONAL"
                    placeholderTextColor={Palette.gray600}
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
                    placeholderTextColor={Palette.gray600}
                    keyboardType="numeric"
                    style={styles.input}
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
                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    SELECT KANTONG
                  </ThemedText>
                  {kantongs.length === 0 ? (
                    <View style={styles.noKantongNotice}>
                      <ThemedText variant="caption" style={styles.noKantongText}>
                        NO KANTONG AVAILABLE. CREATE ONE FIRST.
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

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    TRANSACTION TYPE
                  </ThemedText>
                  <View style={styles.typeSelectorRow}>
                    <Pressable
                      onPress={() => handleSelectTransaksiType('EXPENSE')}
                      style={[
                        styles.typeButton,
                        transaksiType === 'EXPENSE' && styles.typeButtonSelected,
                      ]}
                    >
                      <ThemedText
                        variant="caption"
                        weight={transaksiType === 'EXPENSE' ? 'bold' : 'regular'}
                        style={[
                          styles.typeButtonText,
                          transaksiType === 'EXPENSE' && styles.typeButtonTextSelected,
                        ]}
                      >
                        [ - ] EXPENSE
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => handleSelectTransaksiType('INCOME')}
                      style={[
                        styles.typeButton,
                        transaksiType === 'INCOME' && styles.typeButtonSelected,
                      ]}
                    >
                      <ThemedText
                        variant="caption"
                        weight={transaksiType === 'INCOME' ? 'bold' : 'regular'}
                        style={[
                          styles.typeButtonText,
                          transaksiType === 'INCOME' && styles.typeButtonTextSelected,
                        ]}
                      >
                        [ + ] INCOME
                      </ThemedText>
                    </Pressable>
                  </View>

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
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setTransaksiCategory(cat)}
                          style={[
                            styles.categoryPill,
                            isSelected && styles.categoryPillSelected,
                          ]}
                        >
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

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    AMOUNT (IDR)
                  </ThemedText>
                  <TextInput
                    value={transaksiAmount}
                    onChangeText={setTransaksiAmount}
                    placeholder="50000"
                    placeholderTextColor={Palette.gray600}
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    DESCRIPTION
                  </ThemedText>
                  <TextInput
                    value={transaksiDescription}
                    onChangeText={setTransaksiDescription}
                    placeholder="e.g. Groceries, Cloud bill, Salary"
                    placeholderTextColor={Palette.gray600}
                    style={styles.input}
                  />

                  <View style={styles.submitContainer}>
                    <ThemedButton
                      title="SUBMIT TRANSAKSI"
                      variant="primary"
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
                    TITLE
                  </ThemedText>
                  <TextInput
                    value={tagihanTitle}
                    onChangeText={setTagihanTitle}
                    placeholder="e.g. WiFi Indiehome, Kosan, Spotify"
                    placeholderTextColor={Palette.gray600}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    AMOUNT (IDR)
                  </ThemedText>
                  <TextInput
                    value={tagihanAmount}
                    onChangeText={setTagihanAmount}
                    placeholder="150000"
                    placeholderTextColor={Palette.gray600}
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    DUE DATE (YYYY-MM-DD)
                  </ThemedText>
                  <TextInput
                    value={tagihanDueDate}
                    onChangeText={setTagihanDueDate}
                    placeholder="2026-10-01"
                    placeholderTextColor={Palette.gray600}
                    style={styles.input}
                    autoCapitalize="none"
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    IS RECURRING BILL?
                  </ThemedText>
                  <View style={styles.typeSelectorRow}>
                    <Pressable
                      onPress={() => setTagihanIsRecurring(false)}
                      style={[
                        styles.typeButton,
                        !tagihanIsRecurring && styles.typeButtonSelected,
                      ]}
                    >
                      <ThemedText
                        variant="caption"
                        weight={!tagihanIsRecurring ? 'bold' : 'regular'}
                        style={[
                          styles.typeButtonText,
                          !tagihanIsRecurring && styles.typeButtonTextSelected,
                        ]}
                      >
                        [ ONE-OFF ]
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => setTagihanIsRecurring(true)}
                      style={[
                        styles.typeButton,
                        tagihanIsRecurring && styles.typeButtonSelected,
                      ]}
                    >
                      <ThemedText
                        variant="caption"
                        weight={tagihanIsRecurring ? 'bold' : 'regular'}
                        style={[
                          styles.typeButtonText,
                          tagihanIsRecurring && styles.typeButtonTextSelected,
                        ]}
                      >
                        [ RECURRING ]
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
                    TITLE
                  </ThemedText>
                  <TextInput
                    value={wishlistTitle}
                    onChangeText={setWishlistTitle}
                    placeholder="e.g. Mechanical Keyboard, Sony WH-1000XM5"
                    placeholderTextColor={Palette.gray600}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    DESCRIPTION (OPTIONAL)
                  </ThemedText>
                  <TextInput
                    value={wishlistDescription}
                    onChangeText={setWishlistDescription}
                    placeholder="e.g. Custom build with tactile switches"
                    placeholderTextColor={Palette.gray600}
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    TARGET PRICE (IDR)
                  </ThemedText>
                  <TextInput
                    value={wishlistPrice}
                    onChangeText={setWishlistPrice}
                    placeholder="2500000"
                    placeholderTextColor={Palette.gray600}
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    IMAGE ATTACHMENT (OFFLINE STORAGE)
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
                          [ IMAGE ATTACHED ]
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
                            title="[ CHANGE ]"
                            variant="outline"
                            size="sm"
                            style={styles.imageBtn}
                            onPress={handlePickImage}
                          />
                          <ThemedButton
                            title="[ REMOVE ]"
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
                      title="+ PICK IMAGE FROM DEVICE GALLERY"
                      variant="outline"
                      size="md"
                      onPress={handlePickImage}
                    />
                  )}

                  <ThemedText variant="caption" style={styles.fieldLabel}>
                    OR ENTER IMAGE URL / LOCAL FILE PATH
                  </ThemedText>
                  <TextInput
                    value={wishlistImageUrl}
                    onChangeText={setWishlistImageUrl}
                    placeholder="file:///... or https://example.com/image.png"
                    placeholderTextColor={Palette.gray600}
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
                    placeholderTextColor={Palette.gray600}
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdropPressable: {
    flex: 1,
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: Palette.black,
    borderTopWidth: 1,
    borderColor: Palette.white,
    paddingBottom: Spacing.six,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray800,
  },
  sheetTitle: {
    fontSize: Typography.scale.sm.fontSize,
    color: Palette.white,
    letterSpacing: 1,
  },
  closePressable: {
    padding: Spacing.one,
  },
  closeText: {
    color: Palette.gray400,
  },
  sheetContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  errorBox: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Palette.white,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  errorText: {
    color: Palette.white,
    letterSpacing: 0.5,
  },
  formGroup: {
    gap: Spacing.two,
  },
  fieldLabel: {
    color: Palette.gray400,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 1,
    marginTop: Spacing.one,
  },
  input: {
    fontFamily: MonospaceFamily,
    fontSize: Typography.scale.base.fontSize,
    color: Palette.white,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two * 1.25,
    borderRadius: 0,
  },
  kantongPillsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  kantongPill: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.two * 1.5,
  },
  kantongPillSelected: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  kantongPillText: {
    color: Palette.gray400,
  },
  kantongPillTextSelected: {
    color: Palette.black,
  },
  noKantongNotice: {
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: Palette.gray800,
  },
  noKantongText: {
    color: Palette.gray500,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonSelected: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  typeButtonText: {
    color: Palette.white,
  },
  typeButtonTextSelected: {
    color: Palette.black,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  categoryPill: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.two * 1.5,
  },
  categoryPillSelected: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  categoryPillText: {
    color: Palette.gray400,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 0.5,
  },
  categoryPillTextSelected: {
    color: Palette.black,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 0.5,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  freqButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqButtonSelected: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  freqButtonText: {
    color: Palette.gray400,
  },
  freqButtonTextSelected: {
    color: Palette.black,
  },
  submitContainer: {
    marginTop: Spacing.three,
  },
  imagePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    padding: Spacing.two,
  },
  imageThumbnail: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: Palette.gray700,
    backgroundColor: Palette.black,
  },
  imagePreviewMeta: {
    flex: 1,
    gap: Spacing.one,
  },
  imageSelectedLabel: {
    color: Palette.white,
    letterSpacing: 0.5,
  },
  imageUriLabel: {
    color: Palette.gray500,
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
