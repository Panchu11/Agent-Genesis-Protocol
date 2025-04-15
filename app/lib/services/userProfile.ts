'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { cache } from '../utils/cache';
import { config } from '../config';

/**
 * User Profile Service
 * 
 * This service provides functions for managing user profiles,
 * preferences, and settings.
 */

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  email?: string;
  is_public: boolean;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy?: {
    showActivity: boolean;
    showAgents: boolean;
    showKnowledgeBases: boolean;
  };
  display?: {
    compactView: boolean;
    showTutorials: boolean;
    defaultView: 'grid' | 'list';
  };
  ai?: {
    defaultModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

/**
 * Get a user profile by user ID
 * 
 * @param userId The ID of the user
 * @returns The user profile or null if not found
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const cacheKey = `user_profile:${userId}`;
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Check if profile exists
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
      }
      
      return profile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  }, 5 * 60 * 1000); // Cache for 5 minutes
}

/**
 * Create a new user profile
 * 
 * @param userId The ID of the user
 * @param profileData The profile data
 * @returns The created profile
 */
export async function createUserProfile(
  userId: string,
  profileData: {
    full_name: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    email?: string;
    is_public?: boolean;
  }
): Promise<UserProfile> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Default preferences
    const defaultPreferences: UserPreferences = {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
        inApp: true,
      },
      privacy: {
        showActivity: true,
        showAgents: true,
        showKnowledgeBases: true,
      },
      display: {
        compactView: false,
        showTutorials: true,
        defaultView: 'grid',
      },
      ai: {
        defaultModel: config.fireworks.modelId,
        temperature: 0.7,
        maxTokens: 2000,
      },
    };
    
    // Create the profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: profileData.full_name,
        display_name: profileData.display_name || profileData.full_name,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        email: profileData.email,
        is_public: profileData.is_public !== undefined ? profileData.is_public : false,
        preferences: defaultPreferences,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
    
    // Invalidate cache
    cache.delete(`user_profile:${userId}`);
    
    return profile;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
}

/**
 * Update a user profile
 * 
 * @param userId The ID of the user
 * @param profileData The profile data to update
 * @returns The updated profile
 */
export async function updateUserProfile(
  userId: string,
  profileData: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserProfile> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
    
    // Invalidate cache
    cache.delete(`user_profile:${userId}`);
    
    return profile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
}

/**
 * Update user preferences
 * 
 * @param userId The ID of the user
 * @param preferences The preferences to update
 * @returns The updated profile
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserProfile> {
  try {
    // Get current profile
    const currentProfile = await getUserProfile(userId);
    
    if (!currentProfile) {
      throw new Error('User profile not found');
    }
    
    // Merge preferences
    const updatedPreferences = {
      ...currentProfile.preferences,
      ...preferences,
    };
    
    // Update the profile
    return updateUserProfile(userId, {
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    throw error;
  }
}

/**
 * Get user activity
 * 
 * @param userId The ID of the user
 * @param limit Maximum number of activities to return
 * @param offset Offset for pagination
 * @returns Array of user activities
 */
export async function getUserActivity(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<any[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get user activity
    const { data: activities, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching user activity:', error);
      throw new Error('Failed to fetch user activity');
    }
    
    return activities || [];
  } catch (error) {
    console.error('Error in getUserActivity:', error);
    throw error;
  }
}

/**
 * Record user activity
 * 
 * @param userId The ID of the user
 * @param activityType The type of activity
 * @param details Additional details about the activity
 * @returns Whether the activity was recorded successfully
 */
export async function recordUserActivity(
  userId: string,
  activityType: string,
  details: Record<string, any> = {}
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Record the activity
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        details,
      });
    
    if (error) {
      console.error('Error recording user activity:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordUserActivity:', error);
    return false;
  }
}

/**
 * Get user statistics
 * 
 * @param userId The ID of the user
 * @returns User statistics
 */
export async function getUserStats(userId: string): Promise<Record<string, any>> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get agent count
    const { count: agentCount, error: agentError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (agentError) {
      console.error('Error fetching agent count:', agentError);
      throw new Error('Failed to fetch agent count');
    }
    
    // Get knowledge base count
    const { count: kbCount, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (kbError) {
      console.error('Error fetching knowledge base count:', kbError);
      throw new Error('Failed to fetch knowledge base count');
    }
    
    // Get deployment count
    const { count: deploymentCount, error: deploymentError } = await supabase
      .from('agent_deployments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (deploymentError) {
      console.error('Error fetching deployment count:', deploymentError);
      throw new Error('Failed to fetch deployment count');
    }
    
    // Get marketplace agent count
    const { count: marketplaceCount, error: marketplaceError } = await supabase
      .from('marketplace_agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (marketplaceError) {
      console.error('Error fetching marketplace agent count:', marketplaceError);
      throw new Error('Failed to fetch marketplace agent count');
    }
    
    return {
      agents: agentCount || 0,
      knowledgeBases: kbCount || 0,
      deployments: deploymentCount || 0,
      marketplaceAgents: marketplaceCount || 0,
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    throw error;
  }
}
