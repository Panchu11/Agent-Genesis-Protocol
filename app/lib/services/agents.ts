'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from './auth';

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  tools: any[];
  knowledgeBase: string[];
  avatar: string;
  isPublic: boolean;
  isVerified: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
}

/**
 * Create a new agent
 * 
 * @param agent The agent data
 * @returns The created agent
 */
export async function createAgent(
  agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'version' | 'status'>
): Promise<Agent | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const agentId = uuidv4();
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('agents')
      .insert({
        id: agentId,
        name: agent.name,
        description: agent.description,
        system_prompt: agent.systemPrompt,
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        top_p: agent.topP,
        frequency_penalty: agent.frequencyPenalty,
        presence_penalty: agent.presencePenalty,
        tools: agent.tools,
        knowledge_base: agent.knowledgeBase,
        avatar: agent.avatar,
        is_public: agent.isPublic,
        is_verified: agent.isVerified,
        tags: agent.tags,
        created_at: now,
        updated_at: now,
        user_id: user.id,
        version: 1,
        status: 'draft'
      });
    
    if (error) {
      throw error;
    }
    
    return {
      id: agentId,
      ...agent,
      createdAt: now,
      updatedAt: now,
      userId: user.id,
      version: 1,
      status: 'draft'
    };
  } catch (error) {
    console.error('Error creating agent:', error);
    return null;
  }
}

/**
 * Get an agent by ID
 * 
 * @param agentId The ID of the agent
 * @returns The agent
 */
export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
    
    if (error || !data) {
      throw error || new Error('Agent not found');
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      systemPrompt: data.system_prompt,
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.max_tokens,
      topP: data.top_p,
      frequencyPenalty: data.frequency_penalty,
      presencePenalty: data.presence_penalty,
      tools: data.tools,
      knowledgeBase: data.knowledge_base,
      avatar: data.avatar,
      isPublic: data.is_public,
      isVerified: data.is_verified,
      tags: data.tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id,
      version: data.version,
      status: data.status
    };
  } catch (error) {
    console.error('Error getting agent:', error);
    return null;
  }
}

/**
 * Update an agent
 * 
 * @param agentId The ID of the agent to update
 * @param updates The updates to apply
 * @returns The updated agent
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'version'>>
): Promise<Agent | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get the current agent
    const currentAgent = await getAgent(agentId);
    
    if (!currentAgent) {
      throw new Error('Agent not found');
    }
    
    // Check if the user owns the agent
    if (currentAgent.userId !== user.id) {
      throw new Error('You do not have permission to update this agent');
    }
    
    const now = new Date().toISOString();
    
    // Prepare the update object
    const updateData: Record<string, any> = {
      updated_at: now,
      version: currentAgent.version + 1
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.systemPrompt !== undefined) updateData.system_prompt = updates.systemPrompt;
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.temperature !== undefined) updateData.temperature = updates.temperature;
    if (updates.maxTokens !== undefined) updateData.max_tokens = updates.maxTokens;
    if (updates.topP !== undefined) updateData.top_p = updates.topP;
    if (updates.frequencyPenalty !== undefined) updateData.frequency_penalty = updates.frequencyPenalty;
    if (updates.presencePenalty !== undefined) updateData.presence_penalty = updates.presencePenalty;
    if (updates.tools !== undefined) updateData.tools = updates.tools;
    if (updates.knowledgeBase !== undefined) updateData.knowledge_base = updates.knowledgeBase;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.isVerified !== undefined) updateData.is_verified = updates.isVerified;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.status !== undefined) updateData.status = updates.status;
    
    const { error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId);
    
    if (error) {
      throw error;
    }
    
    // Return the updated agent
    return {
      ...currentAgent,
      ...updates,
      updatedAt: now,
      version: currentAgent.version + 1
    };
  } catch (error) {
    console.error('Error updating agent:', error);
    return null;
  }
}

/**
 * Delete an agent
 * 
 * @param agentId The ID of the agent to delete
 * @returns Whether the deletion was successful
 */
export async function deleteAgent(agentId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get the current agent
    const currentAgent = await getAgent(agentId);
    
    if (!currentAgent) {
      throw new Error('Agent not found');
    }
    
    // Check if the user owns the agent
    if (currentAgent.userId !== user.id) {
      throw new Error('You do not have permission to delete this agent');
    }
    
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting agent:', error);
    return false;
  }
}

/**
 * List agents
 * 
 * @param options Optional filtering options
 * @returns Array of agents
 */
export async function listAgents(options?: {
  userId?: string;
  isPublic?: boolean;
  status?: 'draft' | 'active' | 'archived';
  tags?: string[];
  limit?: number;
  offset?: number;
}): Promise<Agent[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    let query = supabase
      .from('agents')
      .select('*');
    
    // Apply filters
    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }
    
    if (options?.isPublic !== undefined) {
      query = query.eq('is_public', options.isPublic);
    }
    
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    
    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    // Order by creation date
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      systemPrompt: item.system_prompt,
      model: item.model,
      temperature: item.temperature,
      maxTokens: item.max_tokens,
      topP: item.top_p,
      frequencyPenalty: item.frequency_penalty,
      presencePenalty: item.presence_penalty,
      tools: item.tools,
      knowledgeBase: item.knowledge_base,
      avatar: item.avatar,
      isPublic: item.is_public,
      isVerified: item.is_verified,
      tags: item.tags,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      userId: item.user_id,
      version: item.version,
      status: item.status
    }));
  } catch (error) {
    console.error('Error listing agents:', error);
    return [];
  }
}
