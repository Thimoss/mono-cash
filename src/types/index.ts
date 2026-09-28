import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle, ViewStyle } from 'react-native';
import type { ThemeColor } from '@/constants/theme';

export type TransaksiType = 'INCOME' | 'EXPENSE';

export type TagihanFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Kantong {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaksi {
  id: string;
  kantongId: string;
  amount: number;
  type: TransaksiType;
  description: string;
  category: string;
  date: string;
  createdAt: string;
}

export interface Tagihan {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  frequency: TagihanFrequency | null;
  isPaid: boolean;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUri?: string;
  purchaseLink: string | null;
  funding_source?: string | null;
  saved_amount: number;
  isAchieved: boolean;
  createdAt: string;
}

export interface WishlistProgressLog {
  id: string;
  wishlist_id: string;
  amount_added: number;
  created_at: string;
}

export type CreateKantongInput = Omit<Kantong, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateKantongInput = Partial<CreateKantongInput>;

export type CreateTransaksiInput = Omit<Transaksi, 'id' | 'createdAt'>;
export type UpdateTransaksiInput = Partial<CreateTransaksiInput>;

export type CreateTagihanInput = Omit<Tagihan, 'id' | 'createdAt'>;
export type UpdateTagihanInput = Partial<CreateTagihanInput>;

export type CreateWishlistInput = Omit<Wishlist, 'id' | 'createdAt'>;
export type UpdateWishlistInput = Partial<CreateWishlistInput>;

export interface AddKantongInput {
  name: string;
  balance?: number;
  id?: string;
}

export interface AddTransaksiInput {
  kantongId: string;
  amount: number;
  type: TransaksiType;
  description: string;
  category?: string;
  date?: string;
  id?: string;
}

export interface AddTagihanInput {
  title: string;
  amount: number;
  dueDate: string;
  isRecurring?: boolean;
  frequency?: TagihanFrequency | null;
  id?: string;
}

export interface AddWishlistInput {
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageUri?: string;
  purchaseLink?: string | null;
  funding_source?: string | null;
  saved_amount?: number;
  id?: string;
}

export interface ExportResult {
  success: boolean;
  fileUri?: string;
  error?: string;
}

export type ThemeMode = 'dark' | 'light';
export type Language = 'id' | 'en';

export interface FinanceState {
  kantongs: Kantong[];
  transaksis: Transaksi[];
  tagihans: Tagihan[];
  wishlists: Wishlist[];
  wishlistLogs: Record<string, WishlistProgressLog[]>;
  themeMode: ThemeMode;
  language: Language;
  isLoading: boolean;
  error: string | null;
  loadInitialData: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  resetAllData: () => Promise<void>;
  addKantong: (input: AddKantongInput) => Promise<Kantong>;
  updateKantong: (id: string, input: UpdateKantongInput) => Promise<Kantong | null>;
  deleteKantong: (id: string) => Promise<boolean>;
  addTransaksi: (input: AddTransaksiInput) => Promise<Transaksi>;
  loadTagihans: () => Promise<void>;
  addTagihan: (input: AddTagihanInput) => Promise<Tagihan>;
  payTagihan: (tagihanId: string, kantongId: string) => Promise<void>;
  payBill: (
    billId: string,
    kantongId: string,
    amount: number,
    billTitle: string,
  ) => Promise<void>;
  loadWishlists: () => Promise<void>;
  addWishlist: (input: AddWishlistInput) => Promise<Wishlist>;
  toggleAchievedWishlist: (id: string) => Promise<Wishlist>;
  deleteWishlist: (id: string) => Promise<boolean>;
  fetchWishlistLogs: (wishlistId: string) => Promise<WishlistProgressLog[]>;
  addWishlistProgress: (id: string, amount: number) => Promise<void>;
  exportFinanceData: () => Promise<ExportResult>;
}

// ---------------------------------------------------------------------------
// UI Component Types
// ---------------------------------------------------------------------------

export type ThemedTextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'amount'
  | 'code'
  | 'default'
  | 'small'
  | 'smallBold'
  | 'link'
  | 'linkPrimary';

export type ThemedTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface ThemedTextProps extends TextProps {
  variant?: ThemedTextVariant;
  type?: ThemedTextVariant;
  color?: string;
  themeColor?: ThemeColor;
  weight?: ThemedTextWeight;
  mono?: boolean;
}

export type ThemedButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
export type ThemedButtonSize = 'sm' | 'md' | 'lg';

export interface ThemedButtonProps {
  title?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: ThemedButtonVariant;
  size?: ThemedButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  primaryAction?: boolean;
}

export interface KantongCardProps {
  kantong: Kantong;
  index: number;
  onPress?: (kantong: Kantong) => void;
}

export type ActionModalMode = 'KANTONG' | 'TRANSAKSI' | 'TAGIHAN' | 'WISHLIST';

export interface ActionModalProps {
  visible: boolean;
  mode: ActionModalMode;
  onClose: () => void;
}

export interface TagihanCardProps {
  tagihan: Tagihan;
  index: number;
  onPayPress?: (tagihan: Tagihan) => void;
  onAddToCalendar?: (tagihan: Tagihan) => void;
}

export interface WishlistCardProps {
  wishlist: Wishlist;
  index: number;
  totalBalance?: number;
  targetKantongBalance?: number;
  onToggleAchieve?: (wishlist: Wishlist) => void;
  onDelete?: (wishlist: Wishlist) => void;
  onPress?: (wishlist: Wishlist) => void;
}

export type ActiveScreen =
  | 'DASHBOARD'
  | 'BILLS'
  | 'WISHLIST'
  | 'KANTONG_DETAIL'
  | 'SETTINGS'
  | 'WISHLIST_DETAIL';

export interface DashboardProps {
  onNavigateBills?: () => void;
  onNavigateWishlist?: () => void;
  onNavigateSettings?: () => void;
  onSelectKantong?: (kantong: Kantong) => void;
}

export interface BillsScreenProps {
  onBack?: () => void;
}

export interface WishlistScreenProps {
  onBack?: () => void;
  onSelectWishlist?: (wishlist: Wishlist) => void;
}

export interface WishlistDetailProps {
  wishlistId: string;
  onBack: () => void;
}

export interface KantongDetailProps {
  kantongId: string;
  onBack: () => void;
}

export interface SettingsScreenProps {
  onBack?: () => void;
}

