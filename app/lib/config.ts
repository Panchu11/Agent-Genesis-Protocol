/**
 * Application configuration
 * 
 * This file centralizes all configuration values for the application.
 * Environment variables are accessed here and provided to the rest of the app.
 */

export const config = {
  app: {
    name: 'Agent Genesis Protocol',
    description: 'The protocol of AI civilization — A zero-cost, decentralized AI ecosystem to create, evolve, socialize, transact, and govern sentient digital agents.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  fireworks: {
    apiKey: process.env.NEXT_PUBLIC_FIREWORKS_API_KEY || '',
    modelId: process.env.NEXT_PUBLIC_FIREWORKS_MODEL_ID || 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
  },
  jina: {
    apiKey: process.env.NEXT_PUBLIC_JINA_API_KEY || '',
  },
  serper: {
    apiKey: process.env.NEXT_PUBLIC_SERPER_API_KEY || '',
  },
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    secretKey: process.env.CLERK_SECRET_KEY || '',
  },
  openDeepSearch: {
    apiKey: process.env.NEXT_PUBLIC_OPENDEEPSEARCH_API_KEY || '',
  },
};
