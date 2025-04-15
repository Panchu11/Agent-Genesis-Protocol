'use client';

import { createBrowserSupabaseClient } from '../db/supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'admin';
}

/**
 * Get the current authenticated user
 * 
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return null;
    }
    
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }
    
    // Get additional user data from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
    
    return {
      id: user.user.id,
      email: user.user.email || '',
      name: profile?.name || user.user.user_metadata?.name,
      avatar: profile?.avatar_url || user.user.user_metadata?.avatar_url,
      role: profile?.role || 'user'
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 * 
 * @param email The user's email
 * @param password The user's password
 * @returns The user or null if sign in failed
 */
export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user) {
      throw error || new Error('Sign in failed');
    }
    
    return getCurrentUser();
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
}

/**
 * Sign up with email and password
 * 
 * @param email The user's email
 * @param password The user's password
 * @param name The user's name
 * @returns The user or null if sign up failed
 */
export async function signUpWithEmail(email: string, password: string, name: string): Promise<User | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    
    if (error || !data.user) {
      throw error || new Error('Sign up failed');
    }
    
    // Create a profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name,
        email,
        role: 'user'
      });
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
    
    return {
      id: data.user.id,
      email: data.user.email || '',
      name,
      role: 'user'
    };
  } catch (error) {
    console.error('Error signing up:', error);
    return null;
  }
}

/**
 * Sign out the current user
 * 
 * @returns Whether the sign out was successful
 */
export async function signOut(): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}

/**
 * Reset password
 * 
 * @param email The user's email
 * @returns Whether the password reset email was sent successfully
 */
export async function resetPassword(email: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}

/**
 * Update user profile
 * 
 * @param updates The profile updates
 * @returns The updated user or null if update failed
 */
export async function updateProfile(updates: {
  name?: string;
  avatar?: string;
}): Promise<User | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: updates.name
      }
    });
    
    if (authError) {
      throw authError;
    }
    
    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        avatar_url: updates.avatar
      })
      .eq('id', currentUser.id);
    
    if (profileError) {
      throw profileError;
    }
    
    return {
      ...currentUser,
      name: updates.name || currentUser.name,
      avatar: updates.avatar || currentUser.avatar
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}
