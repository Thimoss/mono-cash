import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { getTranslation, Language } from '@/constants/translations';
import { useFinanceStore } from '@/store/useFinanceStore';

export interface AddBillToCalendarOptions {
  readonly title?: string;
  readonly notes?: string;
  readonly language?: Language;
}

export interface AddBillToCalendarResult {
  readonly success: boolean;
  readonly eventId?: string;
  readonly error?: string;
}

export function parseDueDate(dueDate: string): {
  startDate: Date;
  endDate: Date;
  year: number;
  month: number;
  day: number;
} {
  const parts = dueDate.split('-');
  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10) - 1;
  const day = Number.parseInt(parts[2], 10);

  const startDate = new Date(year, month, day, 0, 0, 0);
  const endDate = new Date(year, month, day, 23, 59, 59);
  return { startDate, endDate, year, month, day };
}

async function getTargetCalendar(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    try {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      if (defaultCal?.id) {
        return defaultCal.id;
      }
    } catch {
      // Fallback to getCalendarsAsync
    }
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const primaryOrWritable =
    calendars.find((c) => c.isPrimary && c.allowsModifications) ??
    calendars.find((c) => c.allowsModifications) ??
    calendars[0];

  if (primaryOrWritable?.id) {
    return primaryOrWritable.id;
  }

  if (Platform.OS === 'android') {
    return await Calendar.createCalendarAsync({
      title: 'MonoCash',
      color: '#6366F1',
      entityType: Calendar.EntityTypes.EVENT,
      source: {
        isLocalAccount: true,
        name: 'MonoCash',
        type: Calendar.SourceType.LOCAL,
      },
      name: 'MonoCash Bills',
      ownerAccount: 'MonoCash',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  }

  return null;
}

/**
 * Adds a bill reminder event to the device's native calendar.
 * Injects dynamic bill variables into localized title and notes,
 * schedules an all-day event on the bill due date, and registers alarms.
 */
export async function addBillToCalendar(
  billTitle: string,
  amount: number,
  dueDate: string,
  options?: AddBillToCalendarOptions
): Promise<AddBillToCalendarResult> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'PERMISSION_DENIED' };
    }

    const calendarId = await getTargetCalendar();
    if (!calendarId) {
      return { success: false, error: 'NO_CALENDAR_FOUND' };
    }

    const { startDate, endDate, year, month, day } = parseDueDate(dueDate);
    const language = options?.language ?? useFinanceStore.getState().language;

    const formattedAmount = new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

    const dateObj = new Date(year, month, day);
    const formattedDate = dateObj.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const eventTitle =
      options?.title ??
      getTranslation(language, 'calendarEventTitle', {
        name: billTitle,
      });

    const eventNotes =
      options?.notes ??
      getTranslation(language, 'calendarEventNotes', {
        amount: formattedAmount,
        date: formattedDate,
      });

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: eventTitle,
      notes: eventNotes,
      allDay: true,
      startDate,
      endDate,
      timeZone: 'Asia/Jakarta',
      alarms: [
        {
          relativeOffset: -1440, // Remind 1 day (24 hours) before
        },
        {
          relativeOffset: -540, // Remind at 9:00 AM on the day of the event
        },
      ],
    });

    return { success: true, eventId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown calendar error';
    return { success: false, error: message };
  }
}
