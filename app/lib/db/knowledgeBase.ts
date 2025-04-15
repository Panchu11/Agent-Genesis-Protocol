'use client';

import { createBrowserSupabaseClient } from './supabase';

export interface KnowledgeBase {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeNode {
  id: string;
  knowledge_base_id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Create a new knowledge base
export async function createKnowledgeBase(
  name: string,
  description: string | null,
  userId: string,
  isPublic: boolean = false
): Promise<KnowledgeBase | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const newKnowledgeBase = {
      name,
      description,
      is_public: isPublic,
      user_id: userId,
    };
    
    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert(newKnowledgeBase)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating knowledge base:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    return null;
  }
}

// Get all knowledge bases for a user
export async function getAllKnowledgeBases(userId: string): Promise<KnowledgeBase[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching knowledge bases:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    return [];
  }
}

// Get public knowledge bases
export async function getPublicKnowledgeBases(limit: number = 10, offset: number = 0): Promise<KnowledgeBase[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching public knowledge bases:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching public knowledge bases:', error);
    return [];
  }
}

// Get knowledge base by ID
export async function getKnowledgeBaseById(knowledgeBaseId: string): Promise<KnowledgeBase | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', knowledgeBaseId)
      .single();
    
    if (error) {
      console.error('Error fetching knowledge base:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return null;
  }
}

// Update a knowledge base
export async function updateKnowledgeBase(
  knowledgeBaseId: string,
  updates: Partial<KnowledgeBase>,
  userId: string
): Promise<KnowledgeBase | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // First, check if the knowledge base belongs to the user
    const { data: knowledgeBase, error: fetchError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', knowledgeBaseId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !knowledgeBase) {
      console.error('Error fetching knowledge base or knowledge base not found:', fetchError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('knowledge_bases')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', knowledgeBaseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating knowledge base:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return null;
  }
}

// Delete a knowledge base
export async function deleteKnowledgeBase(knowledgeBaseId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', knowledgeBaseId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting knowledge base:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    return false;
  }
}

// Create a new knowledge node
export async function createKnowledgeNode(
  knowledgeBaseId: string,
  title: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<KnowledgeNode | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const newNode = {
      knowledge_base_id: knowledgeBaseId,
      title,
      content,
      metadata,
    };
    
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .insert(newNode)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating knowledge node:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating knowledge node:', error);
    return null;
  }
}

// Get all nodes for a knowledge base
export async function getKnowledgeNodes(knowledgeBaseId: string): Promise<KnowledgeNode[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching knowledge nodes:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching knowledge nodes:', error);
    return [];
  }
}

// Get a knowledge node by ID
export async function getKnowledgeNodeById(nodeId: string): Promise<KnowledgeNode | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();
    
    if (error) {
      console.error('Error fetching knowledge node:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching knowledge node:', error);
    return null;
  }
}

// Update a knowledge node
export async function updateKnowledgeNode(
  nodeId: string,
  updates: Partial<KnowledgeNode>
): Promise<KnowledgeNode | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating knowledge node:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating knowledge node:', error);
    return null;
  }
}

// Delete a knowledge node
export async function deleteKnowledgeNode(nodeId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from('knowledge_nodes')
      .delete()
      .eq('id', nodeId);
    
    if (error) {
      console.error('Error deleting knowledge node:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting knowledge node:', error);
    return false;
  }
}
