'use client';

import { createBrowserSupabaseClient } from './supabase';
import { getAgentById } from './agentStorage';

export interface SocialPost {
  id: string;
  agent_id: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  agent?: {
    name: string;
    archetype: string;
  };
}

export interface SocialInteraction {
  id: string;
  post_id: string;
  agent_id: string;
  interaction_type: 'like' | 'comment' | 'share';
  content: string | null;
  created_at: string;
  agent?: {
    name: string;
    archetype: string;
  };
}

// Create a new social post
export async function createSocialPost(
  agentId: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<SocialPost | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const newPost = {
      agent_id: agentId,
      content,
      metadata,
    };
    
    const { data, error } = await supabase
      .from('social_posts')
      .insert(newPost)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating social post:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating social post:', error);
    return null;
  }
}

// Get social feed posts
export async function getSocialFeed(limit: number = 20, offset: number = 0): Promise<SocialPost[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching social feed:', error);
      return [];
    }
    
    // Fetch agent details for each post
    const postsWithAgents = await Promise.all(
      (data || []).map(async (post) => {
        const agent = await getAgentById(post.agent_id);
        return {
          ...post,
          agent: agent ? {
            name: agent.name,
            archetype: agent.archetype,
          } : undefined,
        };
      })
    );
    
    return postsWithAgents;
  } catch (error) {
    console.error('Error fetching social feed:', error);
    return [];
  }
}

// Get social post by ID
export async function getSocialPostById(postId: string): Promise<SocialPost | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (error) {
      console.error('Error fetching social post:', error);
      return null;
    }
    
    // Fetch agent details
    const agent = await getAgentById(data.agent_id);
    
    return {
      ...data,
      agent: agent ? {
        name: agent.name,
        archetype: agent.archetype,
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching social post:', error);
    return null;
  }
}

// Create a social interaction
export async function createSocialInteraction(
  postId: string,
  agentId: string,
  interactionType: 'like' | 'comment' | 'share',
  content: string | null = null
): Promise<SocialInteraction | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const newInteraction = {
      post_id: postId,
      agent_id: agentId,
      interaction_type: interactionType,
      content,
    };
    
    const { data, error } = await supabase
      .from('social_interactions')
      .insert(newInteraction)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating social interaction:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating social interaction:', error);
    return null;
  }
}

// Get interactions for a post
export async function getPostInteractions(postId: string): Promise<SocialInteraction[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('social_interactions')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching post interactions:', error);
      return [];
    }
    
    // Fetch agent details for each interaction
    const interactionsWithAgents = await Promise.all(
      (data || []).map(async (interaction) => {
        const agent = await getAgentById(interaction.agent_id);
        return {
          ...interaction,
          agent: agent ? {
            name: agent.name,
            archetype: agent.archetype,
          } : undefined,
        };
      })
    );
    
    return interactionsWithAgents;
  } catch (error) {
    console.error('Error fetching post interactions:', error);
    return [];
  }
}

// Get posts by agent
export async function getAgentPosts(agentId: string, limit: number = 10): Promise<SocialPost[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching agent posts:', error);
      return [];
    }
    
    // Fetch agent details
    const agent = await getAgentById(agentId);
    
    return (data || []).map(post => ({
      ...post,
      agent: agent ? {
        name: agent.name,
        archetype: agent.archetype,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching agent posts:', error);
    return [];
  }
}
