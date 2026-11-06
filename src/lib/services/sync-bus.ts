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
  SEARCH_CHANGED: 'safar:sync:search',
} as const;

export type TransportMode = 'any' | 'flight' | 'train' | 'car_bus' | 'ship';

export interface ActiveSearchPayload {
  destination: string;
  travelers: number;
  budget: number;
  origin?: string;
  startDate?: string;
  endDate?: string;
  transportMode?: TransportMode;
}

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

export function emitActiveSearch(payload: Partial<ActiveSearchPayload>) {
  if (typeof window !== 'undefined') {
    if (payload.destination !== undefined) localStorage.setItem('safar_active_destination', payload.destination);
    if (payload.travelers !== undefined) {
      const tNum = typeof payload.travelers === 'string' ? Number(String(payload.travelers).replace(/^0+(?=\d)/, '')) : payload.travelers;
      localStorage.setItem('safar_active_travelers', String(tNum));
    }
    if (payload.budget !== undefined) {
      const bNum = typeof payload.budget === 'string' ? Number(String(payload.budget).replace(/^0+(?=\d)/, '')) : payload.budget;
      localStorage.setItem('safar_active_budget', String(bNum));
    }
    if (payload.origin !== undefined) localStorage.setItem('safar_active_origin', payload.origin);
    if (payload.transportMode !== undefined) localStorage.setItem('safar_active_transport_mode', payload.transportMode);

    const prev = getStoredActiveSearch();
    const updated: ActiveSearchPayload = { ...prev, ...payload };
    localStorage.setItem('safar_active_search', JSON.stringify(updated));
  }
  emitSyncEvent<Partial<ActiveSearchPayload>>(SYNC_EVENTS.SEARCH_CHANGED, payload);
}

export function getStoredActiveSearch(): ActiveSearchPayload {
  const fallback: ActiveSearchPayload = { destination: '', travelers: 2, budget: 35000, origin: 'Mumbai', transportMode: 'any' };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem('safar_active_search');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.budget) parsed.budget = Number(String(parsed.budget).replace(/^0+(?=\d)/, '')) || 35000;
      if (parsed.travelers) parsed.travelers = Number(String(parsed.travelers).replace(/^0+(?=\d)/, '')) || 2;
      return { ...fallback, ...parsed };
    }
  } catch (e) {}

  const rawTravelers = localStorage.getItem('safar_active_travelers');
  const cleanT = rawTravelers ? Number(rawTravelers.replace(/^0+(?=\d)/, '')) : 2;
  const rawBudget = localStorage.getItem('safar_active_budget');
  const cleanB = rawBudget ? Number(rawBudget.replace(/^0+(?=\d)/, '')) : 35000;

  return {
    destination: localStorage.getItem('safar_active_destination') || '',
    travelers: cleanT || 2,
    budget: cleanB || 35000,
    origin: localStorage.getItem('safar_active_origin') || 'Mumbai',
    transportMode: (localStorage.getItem('safar_active_transport_mode') as TransportMode) || 'any',
  };
}

export function useActiveSearch() {
  const [activeSearch, setActiveSearch] = useState<ActiveSearchPayload>(() => getStoredActiveSearch());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Refresh from localStorage on mount
    const latest = getStoredActiveSearch();
    setActiveSearch(latest);

    const handleLocalSync = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<ActiveSearchPayload>>;
      if (customEvent.detail) {
        setActiveSearch((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'safar_active_search' && e.newValue) {
        try {
          setActiveSearch(JSON.parse(e.newValue));
        } catch (err) {}
      } else if (e.key === 'safar_active_destination' && e.newValue) {
        setActiveSearch((prev) => ({ ...prev, destination: e.newValue || '' }));
      }
    };

    window.addEventListener(SYNC_EVENTS.SEARCH_CHANGED, handleLocalSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SYNC_EVENTS.SEARCH_CHANGED, handleLocalSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateSearch = (update: Partial<ActiveSearchPayload>) => {
    setActiveSearch((prev) => ({ ...prev, ...update }));
    emitActiveSearch(update);
  };

  return { activeSearch, updateSearch };
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
