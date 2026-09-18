import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// Generate a unique idempotency key for transfer requests
export function generateIdempotencyKey() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `txn-${timestamp}-${random}`;
}
