'use client';

import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create a single supabase client for the entire app
export const createBrowserSupabaseClient = () => 
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

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
