import { NextResponse } from 'next/server';
import { getAppConfig } from '@/lib/config';

export async function GET() {
  const config = getAppConfig();

  return NextResponse.json({
    status: 'healthy',
    product: 'SAFAR AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      gemini: config.geminiConfigured ? 'connected' : 'unconfigured_fallback',
      googleMaps: config.mapsConfigured ? 'connected' : 'unconfigured_fallback',
      supabase: config.supabaseConfigured ? 'connected' : 'in_memory_mode',
      translation: config.translateConfigured ? 'connected' : 'local_dictionary',
      wallet: config.walletProviderConfigured ? 'live_provider' : 'simulated_vault',
      flights: config.flightProviderConfigured ? 'live_provider' : 'sandbox_offers',
    },
    integrations: {
      geminiAI: {
        configured: config.geminiConfigured,
        model: 'gemini-2.5-flash',
        capabilities: ['Itinerary Generation', 'Copilot Chat', 'Budget Pacing'],
      },
      googleMaps: {
        configured: config.mapsConfigured,
        provider: config.mapsConfigured ? 'Google Maps JS SDK' : 'Leaflet / OSM Fallback',
      },
      database: {
        configured: config.supabaseConfigured,
        provider: config.supabaseConfigured ? 'Supabase Postgres' : 'In-Memory Encrypted Vault',
      },
      translation: {
        configured: config.translateConfigured,
        provider: config.translateConfigured ? 'Google Cloud Translate v2' : 'Curated Travel Dictionary',
      },
      tripWallet: {
        configured: config.walletProviderConfigured,
        mode: config.walletProviderConfigured ? 'Live Provider' : 'Demo Vault',
      },
      travelProviders: {
        flightAdapter: config.flightProviderConfigured ? 'Amadeus / Duffel' : 'Sandbox Provider',
        trainAdapter: 'IRCTC Sandbox Adapter',
      },
    },
    demoMode: config.demoMode,
  });
}
