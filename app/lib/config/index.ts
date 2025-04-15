/**
 * Application configuration
 * 
 * This file provides environment-specific configuration values
 * and centralizes all environment variable access.
 */

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// API endpoints and keys
export const config = {
  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Fireworks AI configuration
  fireworks: {
    apiKey: process.env.NEXT_PUBLIC_FIREWORKS_API_KEY || '',
    modelId: process.env.NEXT_PUBLIC_FIREWORKS_MODEL_ID || 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
    apiUrl: 'https://api.fireworks.ai/inference/v1',
  },
  
  // Application settings
  app: {
    name: 'Agent Genesis Protocol',
    description: 'Create, evolve, and deploy intelligent agents',
    url: isProduction 
      ? 'https://agent-genesis-protocol.vercel.app' 
      : 'http://localhost:3000',
    contactEmail: 'contact@agentgenesisprotocol.com',
  },
  
  // Feature flags
  features: {
    enableExperimentalFeatures: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL === 'true',
    enableAgentDeployment: true,
    enableAgentEvolution: true,
    enableVersionHistory: true,
  },
  
  // Performance settings
  performance: {
    cacheTTL: 60 * 1000, // 1 minute in milliseconds
    maxCacheSize: 100, // Maximum number of items in cache
  },
  
  // Deployment environments
  deploymentEnvironments: [
    {
      id: 'sandbox',
      name: 'Sandbox',
      description: 'Isolated environment for testing agents with limited capabilities',
      capabilities: ['chat', 'basic-tools', 'web-search'],
      maxAgents: 5,
    },
    {
      id: 'production',
      name: 'Production',
      description: 'Full-featured environment for deployed agents with all capabilities',
      capabilities: ['chat', 'all-tools', 'web-search', 'api-access', 'file-access'],
      maxAgents: isProduction ? 3 : 10, // Limit in production, more in development
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Public environment for agents available in the marketplace',
      capabilities: ['chat', 'approved-tools', 'web-search', 'limited-api-access'],
      maxAgents: 1,
    },
  ],
};

export default config;
