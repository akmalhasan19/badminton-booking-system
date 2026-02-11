import { toZonedTime, format } from 'date-fns-tz';
import { isBefore, parseISO, startOfDay, getHours, getMinutes } from 'date-fns';

/**
 * Returns the current date in the specified timezone as a Date object (time components preserved)
 */
export function getVenueCurrentTime(timezone: string = 'Asia/Jakarta'): Date {
    try {
        const now = new Date();
        return toZonedTime(now, timezone);
    } catch (error) {
        console.error(`Invalid timezone ${timezone}, falling back to Asia/Jakarta`, error);
        return toZonedTime(new Date(), 'Asia/Jakarta');
    }
}

/**
 * Returns the current date string (YYYY-MM-DD) in the specified timezone
 */
export function getVenueDateString(timezone: string = 'Asia/Jakarta'): string {
    const zonedDate = getVenueCurrentTime(timezone);
    return format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });
}

/**
 * Validates if a booking date and time is in the future relative to the venue's timezone.
 * 
 * Rules:
 * 1. If BookingDate < Today (Venue Time) -> Invalid (Past Date)
 * 2. If BookingDate == Today (Venue Time) AND StartTime < CurrentTime (Venue Time) -> Invalid (Past Time Today)
 * 3. Else -> Valid
 * 
 * @param bookingDateStr YYYY-MM-DD string
 * @param startTimeStr HH:mm string (24h format)
 * @param timezone Venue timezone string (e.g. 'Asia/Jakarta')
 */
export function validateBookingTime(
    bookingDateStr: string,
    startTimeStr: string,
    timezone: string = 'Asia/Jakarta'
): { isValid: boolean; error?: string } {
    try {
        const currentVenueDate = getVenueCurrentTime(timezone);
        const currentVenueDateStr = format(currentVenueDate, 'yyyy-MM-dd', { timeZone: timezone });

        // 1. Check Date
        if (bookingDateStr < currentVenueDateStr) {
            return {
                isValid: false,
                error: `Cannot book for a past date (${bookingDateStr}). Today is ${currentVenueDateStr} in venue timezone.`
            };
        }

        // 2. Check Time if Date is Today
        if (bookingDateStr === currentVenueDateStr) {
            const [bookingHour, bookingMinute] = startTimeStr.split(':').map(Number);
            const currentHour = getHours(currentVenueDate);
            const currentMinute = getMinutes(currentVenueDate);

            if (bookingHour < currentHour || (bookingHour === currentHour && bookingMinute < currentMinute)) {
                return {
                    isValid: false,
                    error: `Cannot book for a past time (${startTimeStr}). Current time at venue is ${format(currentVenueDate, 'HH:mm')}.`
                };
            }
        }

        return { isValid: true };

    } catch (error) {
        console.error('Error validating booking time:', error);
        // Fail safe: allow if validation crashes, but log it. 
        // Or be strict: return false. Let's be strict for safety but mindful of UX.
        // Actually, better to block if uncertain to prevent errors.
        return { isValid: false, error: 'System error validating time. Please contact support.' };
    }
}
