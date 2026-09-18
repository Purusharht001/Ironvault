import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FORMATS } from './constants';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// Generate a unique idempotency key for transfer requests
export function generateIdempotencyKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `txn-${crypto.randomUUID()}`;
    }
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `txn-${timestamp}-${random}`;
}
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: FORMATS.CURRENCY,
    minimumFractionDigits: FORMATS.DECIMAL_PLACES,
    maximumFractionDigits: FORMATS.DECIMAL_PLACES,
});
// Integer cents -> "$1,234.56". Only the presentation layer ever sees dollars.
export function formatCents(cents) {
    return currencyFormatter.format((cents || 0) / FORMATS.CENT_DIVISOR);
}
/**
 * Parse a user-typed dollar string into integer cents without floating-point math.
 * "12.3" -> 1230, "1,000" -> 100000. Returns null for anything that isn't a valid
 * non-negative amount with at most 2 decimal places.
 */
export function parseDollarsToCents(input) {
    const value = String(input ?? '').trim().replace(/[$,\s]/g, '');
    const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(value) || /^()\.(\d{1,2})$/.exec(value);
    if (!match)
        return null;
    const dollars = match[1] ? Number.parseInt(match[1], 10) : 0;
    const cents = Number.parseInt((match[2] || '').padEnd(2, '0'), 10);
    const total = dollars * 100 + cents;
    return Number.isSafeInteger(total) ? total : null;
}
export function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
// "881234567890" -> "8812 3456 7890" for readability
export function formatAccountNumber(accountNumber) {
    return String(accountNumber ?? '').replace(/(\d{4})(?=\d)/g, '$1 ');
}
