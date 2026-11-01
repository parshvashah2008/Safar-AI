/**
 * SAFAR AI Global State Synchronization Bus
 * Provides instant, zero-reload reactive synchronization across all components,
 * dashboard pages, modals, and browser tabs.
 */

'use client';

import { useEffect, useState } from 'react';

// Custom Event Types
export const SYNC_EVENTS = {
  CURRENCY_CHANGED: 'safar:sync:currency',
  TRIP_CHANGED: 'safar:sync:trip',
  THEME_CHANGED: 'safar:sync:theme',
  WALLET_CHANGED: 'safar:sync:wallet',
  ROUTE_CHANGED: 'safar:sync:route',
  BOOKING_CHANGED: 'safar:sync:booking',
} as const;

export interface CurrencySyncPayload {
  currency: string;
  rates?: Record<string, number>;
  source?: string;
}

export interface RouteSyncPayload {
  tripId?: string;
  mode: 'budget' | 'fastest';
}

/**
 * Dispatch an event to all components in the current window and across storage
 */
export function emitSyncEvent<T = any>(eventName: string, payload?: T) {
  if (typeof window === 'undefined') return;

  // Local CustomEvent for immediate in-page components
  const event = new CustomEvent(eventName, { detail: payload });
  window.dispatchEvent(event);

  // Storage ping for cross-tab synchronization
  try {
    localStorage.setItem(
      'safar_last_sync_ping',
      JSON.stringify({ event: eventName, payload, timestamp: Date.now() })
    );
  } catch (e) {
    // ignore quota errors
  }
}

/**
 * Convenience dispatchers
 */
export function emitCurrencyChange(currency: string, rates?: Record<string, number>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safar_default_currency', currency);
  }
  emitSyncEvent<CurrencySyncPayload>(SYNC_EVENTS.CURRENCY_CHANGED, { currency, rates });
}

export function emitTripChange(tripId?: string) {
  emitSyncEvent(SYNC_EVENTS.TRIP_CHANGED, { tripId });
}

export function emitThemeChange(theme: 'light' | 'dark') {
  emitSyncEvent(SYNC_EVENTS.THEME_CHANGED, { theme });
}

export function emitWalletChange() {
  emitSyncEvent(SYNC_EVENTS.WALLET_CHANGED);
}

export function emitRouteChange(mode: 'budget' | 'fastest', tripId?: string) {
  emitSyncEvent<RouteSyncPayload>(SYNC_EVENTS.ROUTE_CHANGED, { mode, tripId });
}

/**
 * React Hook: Sync with global currency changes reactively
 */
export function useSyncedCurrency(initialCurrency: string = 'INR') {
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('safar_default_currency') || initialCurrency;
    }
    return initialCurrency;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Read stored value on mount
    const stored = localStorage.getItem('safar_default_currency');
    if (stored && stored !== currency) {
      setCurrency(stored);
    }

    // Handler for local custom event
    const handleLocalSync = (e: Event) => {
      const customEvent = e as CustomEvent<CurrencySyncPayload>;
      if (customEvent.detail?.currency) {
        setCurrency(customEvent.detail.currency);
      }
    };

    // Handler for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'safar_default_currency' && e.newValue) {
        setCurrency(e.newValue);
      } else if (e.key === 'safar_last_sync_ping' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.event === SYNC_EVENTS.CURRENCY_CHANGED && parsed.payload?.currency) {
            setCurrency(parsed.payload.currency);
          }
        } catch (err) {}
      }
    };

    window.addEventListener(SYNC_EVENTS.CURRENCY_CHANGED, handleLocalSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SYNC_EVENTS.CURRENCY_CHANGED, handleLocalSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateCurrency = (newCurrency: string, rates?: Record<string, number>) => {
    setCurrency(newCurrency);
    emitCurrencyChange(newCurrency, rates);
  };

  return { currency, setCurrency: updateCurrency };
}
