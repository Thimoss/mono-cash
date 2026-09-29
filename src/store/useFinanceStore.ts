import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AddKantongInput,
  AddTagihanInput,
  AddTransaksiInput,
  AddWishlistInput,
  ExportResult,
  FinanceState,
  Kantong,
  Language,
  Tagihan,
  ThemeMode,
  Transaksi,
  UpdateKantongInput,
  Wishlist,
  WishlistProgressLog,
} from '@/types';
import { exportAndShareFullData } from '@/utils/exportUtils';
import {
  createKantong,
  createTagihan,
  createTransaksi,
  createWishlist,
  createWishlistProgressLog,
  deleteKantong as deleteKantongDb,
  deleteWishlist as deleteWishlistDb,
  getAllKantong,
  getAllTagihan,
  getAllTransaksi,
  getAllWishlist,
  getWishlistById,
  getWishlistProgressLogs,
  initDatabase,
  resetDatabase,
  updateKantong,
  updateTagihan,
  updateWishlist,
} from '@/db/init';

function generateUniqueId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // NOSONAR
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      kantongs: [],
      transaksis: [],
      tagihans: [],
      wishlists: [],
      wishlistLogs: {},
      themeMode: 'dark',
      language: 'id',
      isLoading: false,
      error: null,

  setThemeMode: (mode: ThemeMode) => set({ themeMode: mode }),
  toggleTheme: () =>
    set((state) => ({
      themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
    })),

  setLanguage: (lang: Language) => set({ language: lang }),

  resetAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      await resetDatabase();
      set({
        kantongs: [],
        transaksis: [],
        tagihans: [],
        wishlists: [],
        wishlistLogs: {},
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset all data';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  loadInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      await initDatabase();
      const [kantongs, transaksis, tagihans, wishlists] = await Promise.all([
        getAllKantong(),
        getAllTransaksi(),
        getAllTagihan(),
        getAllWishlist(),
      ]);
      set({ kantongs, transaksis, tagihans, wishlists, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load initial data';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addKantong: async (input: AddKantongInput): Promise<Kantong> => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const newKantong: Kantong = {
        id: input.id ?? generateUniqueId(),
        name: input.name.trim(),
        balance: input.balance ?? 0,
        createdAt: now,
        updatedAt: now,
      };

      await createKantong(newKantong);

      set((state) => ({
        kantongs: [...state.kantongs, newKantong],
        isLoading: false,
      }));

      return newKantong;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add kantong';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  updateKantong: async (id: string, input: UpdateKantongInput): Promise<Kantong | null> => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateKantong(id, input);
      if (!updated) {
        throw new Error(`Kantong with id "${id}" not found`);
      }

      set((state) => ({
        kantongs: state.kantongs.map((k) => (k.id === id ? updated : k)),
        isLoading: false,
      }));

      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update kantong';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  deleteKantong: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const success = await deleteKantongDb(id);
      if (success) {
        set((state) => ({
          kantongs: state.kantongs.filter((k) => k.id !== id),
          transaksis: state.transaksis.filter((t) => t.kantongId !== id),
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete kantong';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  addTransaksi: async (input: AddTransaksiInput): Promise<Transaksi> => {
    set({ isLoading: true, error: null });
    try {
      const { kantongs } = get();
      const targetKantong = kantongs.find((k) => k.id === input.kantongId);

      if (!targetKantong) {
        throw new Error(`Kantong with id "${input.kantongId}" not found`);
      }

      const balanceDelta = input.type === 'INCOME' ? input.amount : -input.amount;
      const newBalance = targetKantong.balance + balanceDelta;
      const now = new Date().toISOString();

      const newTransaksi: Transaksi = {
        id: input.id ?? generateUniqueId(),
        kantongId: input.kantongId,
        amount: input.amount,
        type: input.type,
        description: input.description.trim(),
        category: (input.category ?? 'GENERAL').trim().toUpperCase(),
        date: input.date ?? now,
        createdAt: now,
      };

      await createTransaksi(newTransaksi);
      await updateKantong(targetKantong.id, { balance: newBalance });

      set((state) => ({
        transaksis: [newTransaksi, ...state.transaksis],
        kantongs: state.kantongs.map((k) =>
          k.id === targetKantong.id
            ? { ...k, balance: newBalance, updatedAt: now }
            : k
        ),
        isLoading: false,
      }));

      return newTransaksi;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add transaksi';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  loadTagihans: async () => {
    set({ isLoading: true, error: null });
    try {
      await initDatabase();
      const tagihans = await getAllTagihan();
      set({ tagihans, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tagihans';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addTagihan: async (input: AddTagihanInput): Promise<Tagihan> => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const newTagihan: Tagihan = {
        id: input.id ?? generateUniqueId(),
        title: input.title.trim(),
        amount: input.amount,
        dueDate: input.dueDate,
        isRecurring: input.isRecurring ?? false,
        frequency: input.frequency ?? null,
        isPaid: false,
        createdAt: now,
      };

      await createTagihan(newTagihan);

      set((state) => ({
        tagihans: [...state.tagihans, newTagihan],
        isLoading: false,
      }));

      return newTagihan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add tagihan';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  payBill: async (
    billId: string,
    kantongId: string,
    amount: number,
    billTitle: string,
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { kantongs, addTransaksi } = get();
      const kantongExists = kantongs.some((k) => k.id === kantongId);

      if (!kantongExists) {
        throw new Error(`Kantong with id "${kantongId}" not found`);
      }

      // Mark the bill as paid
      await updateTagihan(billId, { isPaid: true });

      // Deduct balance and record transaction
      await addTransaksi({
        kantongId,
        amount,
        type: 'EXPENSE',
        description: `Bayar Tagihan: ${billTitle}`,
        category: 'TAGIHAN',
      });

      set((state) => ({
        tagihans: state.tagihans.map((t) =>
          t.id === billId ? { ...t, isPaid: true } : t
        ),
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pay bill';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  payTagihan: async (tagihanId: string, kantongId: string): Promise<void> => {
    const { tagihans, payBill } = get();
    const target = tagihans.find((t) => t.id === tagihanId);
    if (!target) {
      throw new Error(`Tagihan with id "${tagihanId}" not found`);
    }
    await payBill(tagihanId, kantongId, target.amount, target.title);
  },

  loadWishlists: async () => {
    set({ isLoading: true, error: null });
    try {
      await initDatabase();
      const wishlists = await getAllWishlist();
      set({ wishlists, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load wishlists';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addWishlist: async (input: AddWishlistInput): Promise<Wishlist> => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const resolvedImage = (input.imageUri?.trim() || input.imageUrl?.trim()) ?? '';
      const savedAmount = input.saved_amount ?? 0;
      const isAchieved = savedAmount >= input.price;

      const newWishlist: Wishlist = {
        id: input.id ?? generateUniqueId(),
        title: input.title.trim(),
        description: input.description?.trim() ?? '',
        price: input.price,
        imageUrl: resolvedImage,
        imageUri: resolvedImage || undefined,
        purchaseLink: input.purchaseLink?.trim() || null,
        funding_source: input.funding_source?.trim() || null,
        saved_amount: savedAmount,
        isAchieved,
        createdAt: now,
      };

      await createWishlist(newWishlist);

      set((state) => ({
        wishlists: [newWishlist, ...state.wishlists],
        isLoading: false,
      }));

      return newWishlist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add wishlist';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  fetchWishlistLogs: async (wishlistId: string): Promise<WishlistProgressLog[]> => {
    try {
      const logs = await getWishlistProgressLogs(wishlistId);
      set((state) => ({
        wishlistLogs: {
          ...state.wishlistLogs,
          [wishlistId]: logs,
        },
      }));
      return logs;
    } catch (err) {
      console.error('Failed to fetch wishlist logs:', err);
      return [];
    }
  },

  addWishlistProgress: async (id: string, amount: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      if (amount <= 0) {
        throw new Error('Progress amount must be greater than 0');
      }

      const { wishlists } = get();
      const existing = wishlists.find((w) => w.id === id) ?? (await getWishlistById(id));
      if (!existing) {
        throw new Error(`Wishlist with id "${id}" not found`);
      }

      const currentSaved = existing.saved_amount ?? 0;
      const newSavedAmount = currentSaved + amount;
      const isNowAchieved = newSavedAmount >= existing.price ? true : existing.isAchieved;

      const log: WishlistProgressLog = {
        id: generateUniqueId(),
        wishlist_id: id,
        amount_added: amount,
        created_at: new Date().toISOString(),
      };

      await createWishlistProgressLog(log);
      const updatedWishlist = await updateWishlist(id, {
        saved_amount: newSavedAmount,
        isAchieved: isNowAchieved,
      });

      if (!updatedWishlist) {
        throw new Error(`Failed to update progress for wishlist "${id}"`);
      }

      set((state) => {
        const existingLogs = state.wishlistLogs[id] ?? [];
        return {
          wishlists: state.wishlists.map((w) => (w.id === id ? updatedWishlist : w)),
          wishlistLogs: {
            ...state.wishlistLogs,
            [id]: [log, ...existingLogs],
          },
          isLoading: false,
        };
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add wishlist progress';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  toggleAchievedWishlist: async (id: string): Promise<Wishlist> => {
    set({ isLoading: true, error: null });
    try {
      const { wishlists } = get();
      const existing = wishlists.find((w) => w.id === id) ?? (await getWishlistById(id));

      if (!existing) {
        throw new Error(`Wishlist with id "${id}" not found`);
      }

      const nextAchieved = !existing.isAchieved;
      const updatedWishlist = await updateWishlist(id, { isAchieved: nextAchieved });

      if (!updatedWishlist) {
        throw new Error(`Failed to update wishlist with id "${id}"`);
      }

      set((state) => {
        const existsInState = state.wishlists.some((w) => w.id === id);
        return {
          wishlists: existsInState
            ? state.wishlists.map((w) => (w.id === id ? updatedWishlist : w))
            : [updatedWishlist, ...state.wishlists],
          isLoading: false,
        };
      });

      return updatedWishlist;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to toggle wishlist status';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  deleteWishlist: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const success = await deleteWishlistDb(id);
      if (success) {
        set((state) => {
          const newWishlistLogs = { ...state.wishlistLogs };
          delete newWishlistLogs[id];
          return {
            wishlists: state.wishlists.filter((w) => w.id !== id),
            wishlistLogs: newWishlistLogs,
            isLoading: false,
          };
        });
      } else {
        set({ isLoading: false });
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete wishlist';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  exportFinanceData: async (): Promise<ExportResult> => {
    set({ isLoading: true, error: null });
    try {
      await initDatabase();
      const [kantongs, transaksis, tagihans, wishlists] = await Promise.all([
        getAllKantong(),
        getAllTransaksi(),
        getAllTagihan(),
        getAllWishlist(),
      ]);

      const result = await exportAndShareFullData({
        kantongs,
        transaksis,
        tagihans,
        wishlists,
      });

      if (!result.success && result.error) {
        set({ error: result.error, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to export finance data';
      set({ error: errorMessage, isLoading: false });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  transferBalance: async (
    fromKantongId: string,
    toKantongId: string,
    amount: number,
    note: string,
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { kantongs } = get();
      const fromKantong = kantongs.find((k) => k.id === fromKantongId);
      const toKantong = kantongs.find((k) => k.id === toKantongId);

      if (!fromKantong) throw new Error(`Source kantong "${fromKantongId}" not found`);
      if (!toKantong) throw new Error(`Destination kantong "${toKantongId}" not found`);

      const now = new Date().toISOString();
      const newFromBalance = fromKantong.balance - amount;
      const newToBalance = toKantong.balance + amount;

      const outDesc = note.trim() || `Transfer ke ${toKantong.name}`;
      const inDesc = note.trim() || `Transfer dari ${fromKantong.name}`;

      const outTx: Transaksi = {
        id: generateUniqueId(),
        kantongId: fromKantongId,
        amount,
        type: 'EXPENSE',
        description: outDesc,
        category: 'TRANSFER',
        date: now,
        createdAt: now,
      };

      const inTx: Transaksi = {
        id: generateUniqueId(),
        kantongId: toKantongId,
        amount,
        type: 'INCOME',
        description: inDesc,
        category: 'TRANSFER',
        date: now,
        createdAt: now,
      };

      await createTransaksi(outTx);
      await createTransaksi(inTx);
      await updateKantong(fromKantongId, { balance: newFromBalance });
      await updateKantong(toKantongId, { balance: newToBalance });

      set((state) => ({
        transaksis: [outTx, inTx, ...state.transaksis],
        kantongs: state.kantongs.map((k) => {
          if (k.id === fromKantongId) return { ...k, balance: newFromBalance, updatedAt: now };
          if (k.id === toKantongId) return { ...k, balance: newToBalance, updatedAt: now };
          return k;
        }),
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer balance';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },
  }),
  {
    name: 'monocash-settings-storage',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
      themeMode: state.themeMode,
      language: state.language,
    }),
  }
)
);

export const useSettingsStore = useFinanceStore;
