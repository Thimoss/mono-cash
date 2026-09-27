import * as SQLite from 'expo-sqlite';
import {
  Kantong,
  Tagihan,
  TagihanFrequency,
  Transaksi,
  UpdateKantongInput,
  UpdateTagihanInput,
  UpdateTransaksiInput,
  UpdateWishlistInput,
  Wishlist,
} from '@/types';

const DB_NAME = 'monocash.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

interface TagihanRow {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isRecurring: number;
  frequency: TagihanFrequency | null;
  isPaid: number;
  createdAt: string;
}

interface WishlistRow {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  purchaseLink: string | null;
  isAchieved: number;
  createdAt: string;
}

function mapTagihanRow(row: TagihanRow): Tagihan {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    dueDate: row.dueDate,
    isRecurring: Boolean(row.isRecurring),
    frequency: row.frequency,
    isPaid: Boolean(row.isPaid),
    createdAt: row.createdAt,
  };
}

function mapWishlistRow(row: WishlistRow): Wishlist {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    imageUrl: row.imageUrl,
    purchaseLink: row.purchaseLink,
    isAchieved: Boolean(row.isAchieved),
    createdAt: row.createdAt,
  };
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return databasePromise;
}

export async function initDatabase(dbInstance?: SQLite.SQLiteDatabase): Promise<SQLite.SQLiteDatabase> {
  const db = dbInstance ?? (await getDatabase());

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS kantong (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaksi (
      id TEXT PRIMARY KEY NOT NULL,
      kantongId TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'GENERAL',
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (kantongId) REFERENCES kantong(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tagihan (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      dueDate TEXT NOT NULL,
      isRecurring INTEGER NOT NULL DEFAULT 0,
      frequency TEXT CHECK(frequency IN ('WEEKLY', 'MONTHLY', 'YEARLY') OR frequency IS NULL),
      isPaid INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      imageUrl TEXT NOT NULL,
      purchaseLink TEXT,
      isAchieved INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transaksi_kantongId ON transaksi(kantongId);
    CREATE INDEX IF NOT EXISTS idx_transaksi_date ON transaksi(date);
    CREATE INDEX IF NOT EXISTS idx_transaksi_category ON transaksi(category);
    CREATE INDEX IF NOT EXISTS idx_tagihan_dueDate ON tagihan(dueDate);
    CREATE INDEX IF NOT EXISTS idx_tagihan_isPaid ON tagihan(isPaid);
    CREATE INDEX IF NOT EXISTS idx_wishlist_isAchieved ON wishlist(isAchieved);
  `);

  // Migration: Ensure category column exists in transaksi table on existing SQLite databases
  try {
    await db.execAsync(`ALTER TABLE transaksi ADD COLUMN category TEXT NOT NULL DEFAULT 'GENERAL';`);
  } catch {
    // Column already exists, safe to ignore
  }

  return db;
}

// ---------------------------------------------------------------------------
// CRUD Helpers: Kantong
// ---------------------------------------------------------------------------

export async function createKantong(
  kantong: Kantong,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Kantong> {
  const db = dbInstance ?? (await getDatabase());

  await db.runAsync(
    `INSERT INTO kantong (id, name, balance, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?);`,
    [kantong.id, kantong.name, kantong.balance, kantong.createdAt, kantong.updatedAt]
  );

  return kantong;
}

export async function getKantongById(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Kantong | null> {
  const db = dbInstance ?? (await getDatabase());

  return await db.getFirstAsync<Kantong>(
    `SELECT id, name, balance, createdAt, updatedAt FROM kantong WHERE id = ?;`,
    [id]
  );
}

export async function getAllKantong(
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Kantong[]> {
  const db = dbInstance ?? (await getDatabase());

  return await db.getAllAsync<Kantong>(
    `SELECT id, name, balance, createdAt, updatedAt FROM kantong ORDER BY createdAt ASC;`
  );
}

export async function updateKantong(
  id: string,
  input: UpdateKantongInput,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Kantong | null> {
  const db = dbInstance ?? (await getDatabase());

  const current = await getKantongById(id, db);
  if (!current) {
    return null;
  }

  const updated: Kantong = {
    id: current.id,
    name: input.name !== undefined ? input.name.trim() : current.name,
    balance: input.balance !== undefined ? input.balance : current.balance,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await db.runAsync(
    `UPDATE kantong
     SET name = ?, balance = ?, updatedAt = ?
     WHERE id = ?;`,
    [updated.name, updated.balance, updated.updatedAt, id]
  );

  return updated;
}

export async function deleteKantong(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<boolean> {
  const db = dbInstance ?? (await getDatabase());

  const result = await db.runAsync(`DELETE FROM kantong WHERE id = ?;`, [id]);
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// CRUD Helpers: Transaksi
// ---------------------------------------------------------------------------

export async function createTransaksi(
  transaksi: Transaksi,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Transaksi> {
  const db = dbInstance ?? (await getDatabase());

  await db.runAsync(
    `INSERT INTO transaksi (id, kantongId, amount, type, description, category, date, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      transaksi.id,
      transaksi.kantongId,
      transaksi.amount,
      transaksi.type,
      transaksi.description,
      transaksi.category ?? 'GENERAL',
      transaksi.date,
      transaksi.createdAt,
    ]
  );

  return transaksi;
}

export async function getTransaksiById(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Transaksi | null> {
  const db = dbInstance ?? (await getDatabase());

  return await db.getFirstAsync<Transaksi>(
    `SELECT id, kantongId, amount, type, description, category, date, createdAt
     FROM transaksi
     WHERE id = ?;`,
    [id]
  );
}

export async function getAllTransaksi(
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Transaksi[]> {
  const db = dbInstance ?? (await getDatabase());

  return await db.getAllAsync<Transaksi>(
    `SELECT id, kantongId, amount, type, description, category, date, createdAt
     FROM transaksi
     ORDER BY date DESC, createdAt DESC;`
  );
}

export async function getTransaksiByKantongId(
  kantongId: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Transaksi[]> {
  const db = dbInstance ?? (await getDatabase());

  return await db.getAllAsync<Transaksi>(
    `SELECT id, kantongId, amount, type, description, category, date, createdAt
     FROM transaksi
     WHERE kantongId = ?
     ORDER BY date DESC, createdAt DESC;`,
    [kantongId]
  );
}

export async function updateTransaksi(
  id: string,
  input: UpdateTransaksiInput,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Transaksi | null> {
  const db = dbInstance ?? (await getDatabase());

  const current = await getTransaksiById(id, db);
  if (!current) {
    return null;
  }

  const updated: Transaksi = {
    id: current.id,
    kantongId: input.kantongId !== undefined ? input.kantongId : current.kantongId,
    amount: input.amount !== undefined ? input.amount : current.amount,
    type: input.type !== undefined ? input.type : current.type,
    description: input.description !== undefined ? input.description.trim() : current.description,
    category: input.category !== undefined ? input.category.trim() : current.category,
    date: input.date !== undefined ? input.date : current.date,
    createdAt: current.createdAt,
  };

  await db.runAsync(
    `UPDATE transaksi
     SET kantongId = ?, amount = ?, type = ?, description = ?, category = ?, date = ?
     WHERE id = ?;`,
    [
      updated.kantongId,
      updated.amount,
      updated.type,
      updated.description,
      updated.category,
      updated.date,
      id,
    ]
  );

  return updated;
}

export async function deleteTransaksi(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<boolean> {
  const db = dbInstance ?? (await getDatabase());

  const result = await db.runAsync(`DELETE FROM transaksi WHERE id = ?;`, [id]);
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// CRUD Helpers: Tagihan
// ---------------------------------------------------------------------------

export async function createTagihan(
  tagihan: Tagihan,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Tagihan> {
  const db = dbInstance ?? (await getDatabase());

  await db.runAsync(
    `INSERT INTO tagihan (id, title, amount, dueDate, isRecurring, frequency, isPaid, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      tagihan.id,
      tagihan.title,
      tagihan.amount,
      tagihan.dueDate,
      tagihan.isRecurring ? 1 : 0,
      tagihan.frequency,
      tagihan.isPaid ? 1 : 0,
      tagihan.createdAt,
    ]
  );

  return tagihan;
}

export async function getTagihanById(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Tagihan | null> {
  const db = dbInstance ?? (await getDatabase());

  const row = await db.getFirstAsync<TagihanRow>(
    `SELECT id, title, amount, dueDate, isRecurring, frequency, isPaid, createdAt
     FROM tagihan
     WHERE id = ?;`,
    [id]
  );

  return row ? mapTagihanRow(row) : null;
}

export async function getAllTagihan(
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Tagihan[]> {
  const db = dbInstance ?? (await getDatabase());

  const rows = await db.getAllAsync<TagihanRow>(
    `SELECT id, title, amount, dueDate, isRecurring, frequency, isPaid, createdAt
     FROM tagihan
     ORDER BY isPaid ASC, dueDate ASC;`
  );

  return rows.map(mapTagihanRow);
}

export async function updateTagihan(
  id: string,
  input: UpdateTagihanInput,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Tagihan | null> {
  const db = dbInstance ?? (await getDatabase());

  const current = await getTagihanById(id, db);
  if (!current) {
    return null;
  }

  const updated: Tagihan = {
    ...current,
    ...input,
  };

  await db.runAsync(
    `UPDATE tagihan
     SET title = ?, amount = ?, dueDate = ?, isRecurring = ?, frequency = ?, isPaid = ?
     WHERE id = ?;`,
    [
      updated.title,
      updated.amount,
      updated.dueDate,
      updated.isRecurring ? 1 : 0,
      updated.frequency,
      updated.isPaid ? 1 : 0,
      id,
    ]
  );

  return updated;
}

export async function deleteTagihan(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<boolean> {
  const db = dbInstance ?? (await getDatabase());

  const result = await db.runAsync(`DELETE FROM tagihan WHERE id = ?;`, [id]);
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// CRUD Helpers: Wishlist
// ---------------------------------------------------------------------------

export async function createWishlist(
  wishlist: Wishlist,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Wishlist> {
  const db = dbInstance ?? (await getDatabase());

  await db.runAsync(
    `INSERT INTO wishlist (id, title, description, price, imageUrl, purchaseLink, isAchieved, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      wishlist.id,
      wishlist.title,
      wishlist.description,
      wishlist.price,
      wishlist.imageUrl,
      wishlist.purchaseLink,
      wishlist.isAchieved ? 1 : 0,
      wishlist.createdAt,
    ]
  );

  return wishlist;
}

export async function getWishlistById(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Wishlist | null> {
  const db = dbInstance ?? (await getDatabase());

  const row = await db.getFirstAsync<WishlistRow>(
    `SELECT id, title, description, price, imageUrl, purchaseLink, isAchieved, createdAt
     FROM wishlist
     WHERE id = ?;`,
    [id]
  );

  return row ? mapWishlistRow(row) : null;
}

export async function getAllWishlist(
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Wishlist[]> {
  const db = dbInstance ?? (await getDatabase());

  const rows = await db.getAllAsync<WishlistRow>(
    `SELECT id, title, description, price, imageUrl, purchaseLink, isAchieved, createdAt
     FROM wishlist
     ORDER BY isAchieved ASC, createdAt DESC;`
  );

  return rows.map(mapWishlistRow);
}

export async function updateWishlist(
  id: string,
  input: UpdateWishlistInput,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<Wishlist | null> {
  const db = dbInstance ?? (await getDatabase());

  const current = await getWishlistById(id, db);
  if (!current) {
    return null;
  }

  const updated: Wishlist = {
    id: current.id,
    title: input.title !== undefined ? input.title : current.title,
    description: input.description !== undefined ? input.description : current.description,
    price: input.price !== undefined ? input.price : current.price,
    imageUrl: input.imageUrl !== undefined ? input.imageUrl : current.imageUrl,
    purchaseLink: input.purchaseLink !== undefined ? input.purchaseLink : current.purchaseLink,
    isAchieved: input.isAchieved !== undefined ? input.isAchieved : current.isAchieved,
    createdAt: current.createdAt,
  };

  await db.runAsync(
    `UPDATE wishlist
     SET title = ?, description = ?, price = ?, imageUrl = ?, purchaseLink = ?, isAchieved = ?
     WHERE id = ?;`,
    [
      updated.title,
      updated.description,
      updated.price,
      updated.imageUrl,
      updated.purchaseLink,
      updated.isAchieved ? 1 : 0,
      id,
    ]
  );

  return updated;
}

export async function deleteWishlist(
  id: string,
  dbInstance?: SQLite.SQLiteDatabase
): Promise<boolean> {
  const db = dbInstance ?? (await getDatabase());

  const result = await db.runAsync(`DELETE FROM wishlist WHERE id = ?;`, [id]);
  return result.changes > 0;
}

export async function resetDatabase(dbInstance?: SQLite.SQLiteDatabase): Promise<void> {
  const db = dbInstance ?? (await getDatabase());
  await db.execAsync(`
    DROP TABLE IF EXISTS transaksi;
    DROP TABLE IF EXISTS tagihan;
    DROP TABLE IF EXISTS wishlist;
    DROP TABLE IF EXISTS kantong;
  `);
  await initDatabase(db);
}
