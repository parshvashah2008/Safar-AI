/**
 * Travel Booking & Transit MCP Tools
 * Pre-configured tool schemas for AI Agents, Copilot, and external MCP clients
 * to query free APIs for booking trains, flights, hotels, and restaurants.
 */

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export const TRAVEL_BOOKING_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'search_free_trains',
    description:
      'Search live trains, Vande Bharat, Rajdhani, and express services via IRCTC Official & ConfirmTkt free APIs with real-time seat predictions.',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin station name or code (e.g. NDLS, New Delhi)' },
        destination: { type: 'string', description: 'Destination station name or code (e.g. JP, Jaipur)' },
        date: { type: 'string', description: 'Travel date in YYYY-MM-DD format' },
        travelClass: {
          type: 'string',
          enum: ['ALL', '1A', '2A', '3A', 'CC', 'EC', 'SL'],
          description: 'Preferred coach class',
        },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'search_free_flights',
    description:
      'Search live domestic and international flights across Google Flights & Amadeus Free Tier (2,000 free calls/month) without markup.',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin 3-letter IATA code or city (e.g. DEL, BOM)' },
        destination: { type: 'string', description: 'Destination 3-letter IATA code or city (e.g. JAI, DPS)' },
        departureDate: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
        passengers: { type: 'number', description: 'Number of travelers (default: 1)' },
        cabin: {
          type: 'string',
          enum: ['economy', 'premium_economy', 'business', 'first'],
          description: 'Cabin preference',
        },
      },
      required: ['origin', 'destination', 'departureDate'],
    },
  },
  {
    name: 'search_free_hotels',
    description:
      'Find verified hotel stays, boutique havelis, and resorts via Google Hotels and Booking.com with free cancellation filters.',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'City, region, or neighborhood (e.g. Jaipur, Manali)' },
        checkInDate: { type: 'string', description: 'Check-in date in YYYY-MM-DD' },
        checkOutDate: { type: 'string', description: 'Check-out date in YYYY-MM-DD' },
        maxPricePerNight: { type: 'number', description: 'Budget limit in INR' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'search_free_restaurants',
    description:
      'Discover and book tables at local restaurants and dining spots via OpenTable, Yelp Fusion Free API, and Google Maps Reviews.',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'City or area name (e.g. Jaipur, Fort Kochi)' },
        cuisine: { type: 'string', description: 'Cuisine style (e.g. Rajasthani Thali, Pure Vegetarian, Artisan Cafe)' },
        mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'cafe'] },
      },
      required: ['destination'],
    },
  },
];
