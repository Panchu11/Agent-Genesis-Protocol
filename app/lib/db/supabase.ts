'use client';

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxiwqtevhedtanpmhvsl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aXdxdGV2aGVkdGFucG1odnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MDg2NTAsImV4cCI6MjA2MDI4NDY1MH0.C-xJoD4Tb41begYF7j6_2eKhcMuBSsVmMfwIDkPKwjQ';

// Service role key for server-side operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a browser supabase client
export const createBrowserSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

// Create a server supabase client (using service role key)
export const createServerSupabaseClient = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper function to get the current user
export async function getCurrentUser() {
  const supabase = createBrowserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

// Helper function to sign out
export async function signOut() {
  const supabase = createBrowserSupabaseClient();
  await supabase.auth.signOut();
}

// Helper function to subscribe to real-time changes
export function subscribeToChannel(channelName: string, callback: (payload: any) => void) {
  const supabase = createBrowserSupabaseClient();

  const channel = supabase.channel(channelName);

  channel.on('broadcast', { event: 'all' }, (payload) => {
    callback(payload);
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Helper function to subscribe to database changes
export function subscribeToTable(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  callback: (payload: any) => void,
  filter?: string
) {
  const supabase = createBrowserSupabaseClient();

  const channel = supabase.channel(`public:${table}`);

  const config: any = {
    event,
    schema: 'public',
    table
  };

  if (filter) {
    config.filter = filter;
  }

  channel.on('postgres_changes', config, (payload) => {
    callback(payload);
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
