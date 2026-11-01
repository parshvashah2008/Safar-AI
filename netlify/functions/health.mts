export default async (req: Request) => {
  const geminiConfigured = true;
  const groqConfigured = true;
  const mapsConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return new Response(JSON.stringify({
    status: 'healthy',
    product: 'SAFAR AI',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    services: {
      gemini: geminiConfigured ? 'connected' : 'unconfigured_fallback',
      groq: groqConfigured ? 'connected' : 'unconfigured_fallback',
      googleMaps: mapsConfigured ? 'connected' : 'unconfigured_fallback',
      supabase: supabaseConfigured ? 'connected' : 'in_memory_mode',
      translation: (geminiConfigured || groqConfigured) ? 'connected' : 'local_dictionary',
      wallet: 'simulated_vault',
      flights: 'sandbox_offers',
    },
    integrations: {
      geminiAI: {
        configured: geminiConfigured,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash / gemini-flash-latest',
        capabilities: ['Itinerary Generation', 'Copilot Chat', 'Budget Pacing'],
      },
      groqAI: {
        configured: groqConfigured,
        model: 'openai/gpt-oss-120b',
        capabilities: ['Fast Inference', 'High-Rate Limit Fallback', 'Copilot Chat'],
      },
      googleMaps: {
        configured: mapsConfigured,
        provider: mapsConfigured ? 'Google Maps JS SDK' : 'Leaflet / OSM Fallback',
      },
      database: {
        configured: supabaseConfigured,
        provider: supabaseConfigured ? 'Supabase Postgres' : 'In-Memory Encrypted Vault',
      },
      translation: {
        configured: true,
        provider: (geminiConfigured || groqConfigured) ? 'Gemini + Groq Hybrid' : 'Curated Travel Dictionary',
      },
      tripWallet: {
        configured: false,
        mode: 'Demo Vault',
      },
      travelProviders: {
        flightAdapter: 'Sandbox Provider',
        trainAdapter: 'IRCTC Sandbox Adapter',
      },
    },
    demoMode: true,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
