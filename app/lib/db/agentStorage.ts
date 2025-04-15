'use client';

import { createBrowserSupabaseClient } from './supabase';

export interface AgentPersonality {
  archetype: string;
  traits: string[];
  values: string[];
  tone: string;
  description: string;
}

export interface AgentCapability {
  name: string;
  description: string;
  enabled: boolean;
}

export interface StoredAgent {
  id: string;
  user_id: string;
  name: string;
  description: string;
  archetype: string;
  personality: AgentPersonality;
  capabilities: AgentCapability[];
  knowledge_base_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

// Create a new agent
export async function createAgent(
  name: string,
  description: string,
  personality: AgentPersonality,
  capabilities: AgentCapability[],
  userId: string,
  isPublic: boolean = false
): Promise<StoredAgent | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    const newAgent = {
      name,
      description,
      archetype: personality.archetype,
      personality,
      capabilities,
      knowledge_base_ids: [],
      is_public: isPublic,
      user_id: userId,
      version: 1,
    };

    // Insert the new agent
    const { data, error } = await supabase
      .from('agents')
      .insert(newAgent)
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return null;
    }

    // Store the initial version in the version history
    if (data) {
      const { error: versionError } = await supabase
        .from('agent_versions')
        .insert({
          agent_id: data.id,
          version: 1,
          personality: personality,
          capabilities: capabilities
        });

      if (versionError) {
        console.error('Error storing initial agent version:', versionError);
        // Continue anyway, as this is not critical
      }
    }

    return data;
  } catch (error) {
    console.error('Error creating agent:', error);
    return null;
  }
}

// Get all agents for a user
export async function getAllAgents(userId: string): Promise<StoredAgent[]> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

// Get public agents
export async function getPublicAgents(limit: number = 10, offset: number = 0): Promise<StoredAgent[]> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching public agents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching public agents:', error);
    return [];
  }
}

// Get agent by ID
export async function getAgentById(agentId: string): Promise<StoredAgent | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
}

// Update an agent
export async function updateAgent(
  agentId: string,
  name: string,
  description: string,
  archetype: string,
  personality: any,
  capabilities: any,
  isPublic: boolean = false
): Promise<StoredAgent | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    // First, get the current agent
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      console.error('Error fetching agent or agent not found:', fetchError);
      return null;
    }

    // Store the current version in the version history
    const { error: versionError } = await supabase
      .from('agent_versions')
      .insert({
        agent_id: agentId,
        version: agent.version,
        personality: agent.personality,
        capabilities: agent.capabilities
      });

    if (versionError) {
      console.error('Error storing agent version:', versionError);
      // Continue anyway, as this is not critical
    }

    // Increment version and update the agent
    const updatedAgent = {
      name,
      description,
      archetype,
      personality,
      capabilities,
      is_public: isPublic,
      version: agent.version + 1,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('agents')
      .update(updatedAgent)
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating agent:', error);
    return null;
  }
}

// Delete an agent
export async function deleteAgent(agentId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting agent:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting agent:', error);
    return false;
  }
}
