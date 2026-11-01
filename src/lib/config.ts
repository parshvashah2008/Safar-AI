import type { AppConfig } from '@/types';

/** Validate a Gemini API key — real keys start with "AIza" */
function isValidGeminiKey(key: string | undefined | null): boolean {
  return Boolean(key && key.trim().length > 10 && key.trim().startsWith('AIza'));
}

export function getAppConfig(): AppConfig {
  const geminiKey = process.env.GEMINI_API_KEY;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const translateKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  const walletKey = process.env.WALLET_PROVIDER_API_KEY;
  const flightKey = process.env.FLIGHT_PROVIDER_API_KEY;

  const geminiConfigured = isValidGeminiKey(geminiKey);
  const mapsConfigured = Boolean(mapsKey && mapsKey.trim().length > 0);
  const supabaseConfigured = Boolean(
    supabaseUrl && supabaseUrl.trim().length > 0 && supabaseKey && supabaseKey.trim().length > 0
  );
  const translateConfigured = Boolean(translateKey && translateKey.trim().length > 0);
  const walletProviderConfigured = Boolean(walletKey && walletKey.trim().length > 0);
  const flightProviderConfigured = Boolean(flightKey && flightKey.trim().length > 0);

  return {
    geminiConfigured,
    mapsConfigured,
    supabaseConfigured,
    translateConfigured,
    walletProviderConfigured,
    flightProviderConfigured,
    demoMode: !walletProviderConfigured,
  };
}

export function requireGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  return key.trim();
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash';
}
