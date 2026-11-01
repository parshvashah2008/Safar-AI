export type CurrencyCode = string;
export type DateString = string;
export type DateTimeString = string;

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  country: string;
  start_date: DateString;
  end_date: DateString;
  travelers: number;
  budget: number;
  currency: CurrencyCode;
  interests: string[];
  dietary: string | null;
  accessibility: string | null;
  cover_image: string | null;
  status: 'planning' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  date: DateString;
  day_number: number;
  title: string | null;
  notes: string | null;
}

export type StopCategory =
  | 'transport'
  | 'accommodation'
  | 'meal'
  | 'activity'
  | 'sightseeing'
  | 'shopping'
  | 'rest'
  | 'other';

export interface ItineraryStop {
  id: string;
  day_id: string;
  trip_id: string;
  time: string;
  title: string;
  description: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  duration_minutes: number | null;
  estimated_cost: number | null;
  currency: CurrencyCode | null;
  category: StopCategory;
  is_optional: boolean;
  is_completed: boolean;
  booking_ref: string | null;
  sort_order: number;
}

export type ExpenseCategory =
  | 'flights'
  | 'trains'
  | 'buses'
  | 'local_transport'
  | 'accommodation'
  | 'meals'
  | 'activities'
  | 'visa_documents'
  | 'insurance'
  | 'fees_taxes'
  | 'shopping'
  | 'emergency'
  | 'other';

export interface Expense {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  date: DateString;
  paid_by: string;
  notes: string | null;
  receipt_url: string | null;
  is_refunded: boolean;
  created_at: DateTimeString;
}

export type BookingType =
  | 'flight'
  | 'hotel'
  | 'train'
  | 'bus'
  | 'car_rental'
  | 'activity'
  | 'other';

export type BookingStatus =
  | 'search_result'
  | 'initiated'
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface Booking {
  id: string;
  trip_id: string;
  user_id: string;
  type: BookingType;
  provider: string;
  provider_ref: string | null;
  title: string;
  status: BookingStatus;
  amount: number | null;
  currency: CurrencyCode | null;
  check_in: DateTimeString | null;
  check_out: DateTimeString | null;
  confirmation_code: string | null;
  details: Record<string, unknown>;
  cancellation_policy: string | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export interface WalletAccount {
  id: string;
  trip_id: string;
  user_id: string;
  provider: string;
  provider_account_id: string | null;
  funded_amount: number;
  spent_amount: number;
  pending_amount: number;
  currency: CurrencyCode;
  daily_limit: number | null;
  trip_limit: number | null;
  low_balance_threshold: number | null;
  is_demo: boolean;
  status: 'active' | 'frozen' | 'closed';
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export type TransactionType =
  | 'funding'
  | 'payment_auth'
  | 'payment_settled'
  | 'refund'
  | 'reversal'
  | 'transfer'
  | 'fee'
  | 'fx_conversion'
  | 'failed'
  | 'manual_expense'
  | 'reconciliation';

export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'reversed'
  | 'cancelled';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  trip_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: CurrencyCode;
  description: string;
  provider_ref: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: DateTimeString;
}

export interface AIItineraryDay {
  date: string;
  title: string;
  activities: {
    time: string;
    title: string;
    description: string;
    estimated_cost: number | null;
    duration_minutes: number | null;
    category: StopCategory;
    place_name: string | null;
    latitude: number | null;
    longitude: number | null;
    is_optional: boolean;
  }[];
}

export interface AIDestinationSuggestion {
  name: string;
  country: string;
  reason: string;
  estimated_budget: number;
  currency: CurrencyCode;
  highlights: string[];
  best_for: string[];
  travel_time_hours: number | null;
  visa_required: boolean | null;
  image_search_term: string;
}

export interface AppConfig {
  geminiConfigured: boolean;
  mapsConfigured: boolean;
  supabaseConfigured: boolean;
  translateConfigured: boolean;
  walletProviderConfigured: boolean;
  flightProviderConfigured: boolean;
  demoMode: boolean;
}
