import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Kantong, Tagihan, Transaksi, Wishlist } from '@/types';

export interface FullExportData {
  kantongs: Kantong[];
  transaksis: Transaksi[];
  tagihans: Tagihan[];
  wishlists: Wishlist[];
}

export interface ExportResult {
  success: boolean;
  fileUri?: string;
  error?: string;
}

/**
 * Escapes a single CSV value compliant with RFC 4180.
 * If the value contains commas, quotes, or newlines, it wraps in double quotes and escapes internal quotes.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  if (typeof val === 'boolean') {
    return val ? 'TRUE' : 'FALSE';
  }

  if (typeof val === 'number' || typeof val === 'bigint') {
    return String(val);
  }

  const str = typeof val === 'string' ? val : JSON.stringify(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

/**
 * Formats Kantong entities into standard CSV format.
 */
export function formatKantongsToCsv(kantongs: Kantong[]): string {
  const headers = ['ID', 'NAME', 'BALANCE', 'CREATED_AT', 'UPDATED_AT'];
  const rows = kantongs.map((k) => [
    escapeCsvField(k.id),
    escapeCsvField(k.name),
    escapeCsvField(k.balance),
    escapeCsvField(k.createdAt),
    escapeCsvField(k.updatedAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Formats Transaksi entities into standard CSV format.
 * Optionally resolves kantongId to kantong name for readable spreadsheet exports.
 */
export function formatTransaksisToCsv(
  transaksis: Transaksi[],
  kantongNameMap?: Map<string, string> | Record<string, string>
): string {
  const headers = [
    'ID',
    'KANTONG_ID',
    'KANTONG_NAME',
    'AMOUNT',
    'TYPE',
    'DESCRIPTION',
    'CATEGORY',
    'DATE',
    'CREATED_AT',
  ];

  const getKantongName = (id: string): string => {
    if (!kantongNameMap) return '';
    if (kantongNameMap instanceof Map) {
      return kantongNameMap.get(id) ?? '';
    }
    return kantongNameMap[id] ?? '';
  };

  const rows = transaksis.map((t) => [
    escapeCsvField(t.id),
    escapeCsvField(t.kantongId),
    escapeCsvField(getKantongName(t.kantongId)),
    escapeCsvField(t.amount),
    escapeCsvField(t.type),
    escapeCsvField(t.description),
    escapeCsvField(t.category ?? 'GENERAL'),
    escapeCsvField(t.date),
    escapeCsvField(t.createdAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Formats Tagihan entities into standard CSV format.
 */
export function formatTagihansToCsv(tagihans: Tagihan[]): string {
  const headers = [
    'ID',
    'TITLE',
    'AMOUNT',
    'DUE_DATE',
    'IS_RECURRING',
    'FREQUENCY',
    'IS_PAID',
    'CREATED_AT',
  ];

  const rows = tagihans.map((t) => [
    escapeCsvField(t.id),
    escapeCsvField(t.title),
    escapeCsvField(t.amount),
    escapeCsvField(t.dueDate),
    escapeCsvField(t.isRecurring),
    escapeCsvField(t.frequency ?? 'NONE'),
    escapeCsvField(t.isPaid),
    escapeCsvField(t.createdAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Formats Wishlist entities into standard CSV format.
 */
export function formatWishlistsToCsv(wishlists: Wishlist[]): string {
  const headers = [
    'ID',
    'TITLE',
    'DESCRIPTION',
    'PRICE',
    'IMAGE_URL',
    'PURCHASE_LINK',
    'FUNDING_SOURCE',
    'SAVED_AMOUNT',
    'IS_ACHIEVED',
    'CREATED_AT',
  ];

  const rows = wishlists.map((w) => [
    escapeCsvField(w.id),
    escapeCsvField(w.title),
    escapeCsvField(w.description),
    escapeCsvField(w.price),
    escapeCsvField(w.imageUrl),
    escapeCsvField(w.purchaseLink ?? ''),
    escapeCsvField(w.funding_source ?? ''),
    escapeCsvField(w.saved_amount ?? 0),
    escapeCsvField(w.isAchieved),
    escapeCsvField(w.createdAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Formats all application entities into a single structured multi-section CSV string.
 */
export function formatFullExportToCsv(data: FullExportData): string {
  const kantongNameMap = new Map<string, string>(
    data.kantongs.map((k) => [k.id, k.name])
  );

  const sections: string[] = [
    '# ============================================================',
    '# MONOCASH DATA EXPORT',
    `# EXPORT_TIMESTAMP: ${new Date().toISOString()}`,
    '# ============================================================',
    '',
    '# SECTION: KANTONG (ENVELOPES)',
    formatKantongsToCsv(data.kantongs),
    '',
    '# SECTION: TRANSAKSI (TRANSACTIONS)',
    formatTransaksisToCsv(data.transaksis, kantongNameMap),
    '',
    '# SECTION: TAGIHAN (BILLS & RECURRING)',
    formatTagihansToCsv(data.tagihans),
    '',
    '# SECTION: WISHLIST (SAVINGS TARGETS)',
    formatWishlistsToCsv(data.wishlists),
  ];

  return sections.join('\n');
}

/**
 * Writes content to a local cache file using Expo FileSystem.
 * Gracefully falls back to legacy FileSystem API if needed.
 */
export async function writeExportFile(filename: string, content: string): Promise<string> {
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  try {
    const file = new File(Paths.cache, safeFilename);
    if (!file.exists) {
      file.create();
    }
    file.write(content);
    return file.uri;
  } catch {
    // Fallback to legacy API
    const { cacheDirectory, writeAsStringAsync, EncodingType } = await import(
      'expo-file-system/legacy'
    );
    const targetDir = cacheDirectory ?? '';
    const fileUri = `${targetDir}${safeFilename}`;
    await writeAsStringAsync(fileUri, content, { encoding: EncodingType.UTF8 });
    return fileUri;
  }
}

/**
 * Shares a local file URI via native platform sharing dialog (AirDrop, Files, Drive, WhatsApp, etc.).
 */
export async function shareExportFile(
  fileUri: string,
  mimeType = 'text/csv',
  dialogTitle = 'Export MonoCash Data'
): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return false;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType,
    dialogTitle,
    UTI: 'public.comma-separated-values-text',
  });

  return true;
}

/**
 * Generates an export file and opens the native device share sheet in one step.
 */
export async function exportAndShareFullData(data: FullExportData): Promise<ExportResult> {
  try {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `monocash_backup_${dateStr}.csv`;
    const csvContent = formatFullExportToCsv(data);

    const fileUri = await writeExportFile(filename, csvContent);
    const shared = await shareExportFile(fileUri, 'text/csv', 'Export MonoCash Financial Data');

    if (!shared) {
      return {
        success: false,
        fileUri,
        error: 'SHARING_NOT_AVAILABLE_ON_DEVICE',
      };
    }

    return {
      success: true,
      fileUri,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'FAILED_TO_EXPORT_DATA';
    return {
      success: false,
      error: message,
    };
  }
}
