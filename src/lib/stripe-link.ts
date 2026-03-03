const STORAGE_KEY = "pending_stripe_link_email";

export function setPendingStripeLink(email: string): void {
    sessionStorage.setItem(STORAGE_KEY, email);
}

export function getPendingStripeLink(): string | null {
    return sessionStorage.getItem(STORAGE_KEY);
}

export function clearPendingStripeLink(): void {
    sessionStorage.removeItem(STORAGE_KEY);
}
