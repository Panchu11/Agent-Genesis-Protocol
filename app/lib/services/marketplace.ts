'use client';

import { createBrowserSupabaseClient, createServerSupabaseClient } from '../db/supabase';
import { StoredAgent } from '../db/agentStorage';
import { cache } from '../utils/cache';

/**
 * Marketplace Service
 * 
 * This service provides functions for interacting with the agent marketplace,
 * including listing, publishing, and acquiring agents.
 */

export interface MarketplaceAgent extends StoredAgent {
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  rating: number;
  reviews_count: number;
  downloads: number;
  price: number;
  is_featured: boolean;
  categories: string[];
  published_at: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  agent_count: number;
}

export interface MarketplaceReview {
  id: string;
  agent_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface MarketplaceStats {
  total_agents: number;
  total_downloads: number;
  featured_agents: number;
  top_categories: { name: string; count: number }[];
}

/**
 * Get featured agents from the marketplace
 * 
 * @param limit Maximum number of agents to return
 * @returns Array of featured marketplace agents
 */
export async function getFeaturedAgents(limit: number = 6): Promise<MarketplaceAgent[]> {
  const cacheKey = `marketplace:featured:${limit}`;
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('marketplace_agents')
        .select(`
          *,
          author:profiles(id, full_name, avatar_url)
        `)
        .eq('is_featured', true)
        .eq('is_approved', true)
        .order('featured_order', { ascending: true })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching featured agents:', error);
        return [];
      }
      
      return data.map(formatMarketplaceAgent);
    } catch (error) {
      console.error('Error fetching featured agents:', error);
      return [];
    }
  }, 5 * 60 * 1000); // Cache for 5 minutes
}

/**
 * Get marketplace categories
 * 
 * @returns Array of marketplace categories
 */
export async function getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const cacheKey = 'marketplace:categories';
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*, agent_count:marketplace_agents(count)')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching marketplace categories:', error);
        return [];
      }
      
      return data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        agent_count: category.agent_count[0]?.count || 0
      }));
    } catch (error) {
      console.error('Error fetching marketplace categories:', error);
      return [];
    }
  }, 30 * 60 * 1000); // Cache for 30 minutes
}

/**
 * Search for agents in the marketplace
 * 
 * @param query Search query
 * @param filters Filters to apply (category, price range, etc.)
 * @param sort Sort order
 * @param page Page number
 * @param limit Maximum number of agents per page
 * @returns Array of marketplace agents matching the search criteria
 */
export async function searchMarketplaceAgents(
  query: string = '',
  filters: {
    categories?: string[];
    min_rating?: number;
    max_price?: number;
    free_only?: boolean;
  } = {},
  sort: 'popular' | 'recent' | 'rating' | 'price_asc' | 'price_desc' = 'popular',
  page: number = 1,
  limit: number = 12
): Promise<{ agents: MarketplaceAgent[]; total: number }> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    let queryBuilder = supabase
      .from('marketplace_agents')
      .select(`
        *,
        author:profiles(id, full_name, avatar_url),
        total_count:marketplace_agents(count)
      `, { count: 'exact' })
      .eq('is_approved', true);
    
    // Apply search query
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,archetype.ilike.%${query}%`);
    }
    
    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      queryBuilder = queryBuilder.contains('categories', filters.categories);
    }
    
    // Apply rating filter
    if (filters.min_rating) {
      queryBuilder = queryBuilder.gte('rating', filters.min_rating);
    }
    
    // Apply price filters
    if (filters.free_only) {
      queryBuilder = queryBuilder.eq('price', 0);
    } else if (filters.max_price !== undefined) {
      queryBuilder = queryBuilder.lte('price', filters.max_price);
    }
    
    // Apply sorting
    switch (sort) {
      case 'popular':
        queryBuilder = queryBuilder.order('downloads', { ascending: false });
        break;
      case 'recent':
        queryBuilder = queryBuilder.order('published_at', { ascending: false });
        break;
      case 'rating':
        queryBuilder = queryBuilder.order('rating', { ascending: false });
        break;
      case 'price_asc':
        queryBuilder = queryBuilder.order('price', { ascending: true });
        break;
      case 'price_desc':
        queryBuilder = queryBuilder.order('price', { ascending: false });
        break;
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);
    
    const { data, error, count } = await queryBuilder;
    
    if (error) {
      console.error('Error searching marketplace agents:', error);
      return { agents: [], total: 0 };
    }
    
    return {
      agents: data.map(formatMarketplaceAgent),
      total: count || 0
    };
  } catch (error) {
    console.error('Error searching marketplace agents:', error);
    return { agents: [], total: 0 };
  }
}

/**
 * Get a marketplace agent by ID
 * 
 * @param agentId The ID of the agent
 * @returns The marketplace agent or null if not found
 */
export async function getMarketplaceAgent(agentId: string): Promise<MarketplaceAgent | null> {
  const cacheKey = `marketplace:agent:${agentId}`;
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('marketplace_agents')
        .select(`
          *,
          author:profiles(id, full_name, avatar_url)
        `)
        .eq('id', agentId)
        .single();
      
      if (error) {
        console.error('Error fetching marketplace agent:', error);
        return null;
      }
      
      return formatMarketplaceAgent(data);
    } catch (error) {
      console.error('Error fetching marketplace agent:', error);
      return null;
    }
  }, 5 * 60 * 1000); // Cache for 5 minutes
}

/**
 * Get reviews for a marketplace agent
 * 
 * @param agentId The ID of the agent
 * @param limit Maximum number of reviews to return
 * @param offset Offset for pagination
 * @returns Array of reviews for the agent
 */
export async function getAgentReviews(
  agentId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ reviews: MarketplaceReview[]; total: number }> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error, count } = await supabase
      .from('marketplace_reviews')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `, { count: 'exact' })
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching agent reviews:', error);
      return { reviews: [], total: 0 };
    }
    
    const reviews = data.map(review => ({
      id: review.id,
      agent_id: review.agent_id,
      user_id: review.user_id,
      user_name: review.user.full_name || 'Anonymous',
      user_avatar: review.user.avatar_url,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at
    }));
    
    return { reviews, total: count || 0 };
  } catch (error) {
    console.error('Error fetching agent reviews:', error);
    return { reviews: [], total: 0 };
  }
}

/**
 * Submit a review for a marketplace agent
 * 
 * @param agentId The ID of the agent
 * @param rating Rating (1-5)
 * @param comment Review comment
 * @returns Whether the review was submitted successfully
 */
export async function submitAgentReview(
  agentId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'You must be logged in to submit a review' };
    }
    
    // Check if the user has already reviewed this agent
    const { data: existingReview, error: checkError } = await supabase
      .from('marketplace_reviews')
      .select('id')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing review:', checkError);
      return { success: false, error: 'Failed to check existing reviews' };
    }
    
    if (existingReview) {
      // Update existing review
      const { error: updateError } = await supabase
        .from('marketplace_reviews')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id);
      
      if (updateError) {
        console.error('Error updating review:', updateError);
        return { success: false, error: 'Failed to update review' };
      }
    } else {
      // Create new review
      const { error: insertError } = await supabase
        .from('marketplace_reviews')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          rating,
          comment
        });
      
      if (insertError) {
        console.error('Error submitting review:', insertError);
        return { success: false, error: 'Failed to submit review' };
      }
    }
    
    // Invalidate cache for this agent
    cache.delete(`marketplace:agent:${agentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Publish an agent to the marketplace
 * 
 * @param agentId The ID of the agent to publish
 * @param marketplaceData Additional marketplace data
 * @returns Whether the agent was published successfully
 */
export async function publishAgentToMarketplace(
  agentId: string,
  marketplaceData: {
    price: number;
    categories: string[];
    description: string;
    is_public: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'You must be logged in to publish an agent' };
    }
    
    // Get the agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();
    
    if (agentError) {
      console.error('Error fetching agent:', agentError);
      return { success: false, error: 'Agent not found or you do not have permission to publish it' };
    }
    
    // Check if the agent is already published
    const { data: existingListing, error: checkError } = await supabase
      .from('marketplace_agents')
      .select('id')
      .eq('agent_id', agentId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing listing:', checkError);
      return { success: false, error: 'Failed to check existing listings' };
    }
    
    if (existingListing) {
      // Update existing listing
      const { error: updateError } = await supabase
        .from('marketplace_agents')
        .update({
          name: agent.name,
          description: marketplaceData.description || agent.description,
          archetype: agent.archetype,
          personality: agent.personality,
          capabilities: agent.capabilities,
          price: marketplaceData.price,
          categories: marketplaceData.categories,
          is_public: marketplaceData.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingListing.id);
      
      if (updateError) {
        console.error('Error updating marketplace listing:', updateError);
        return { success: false, error: 'Failed to update marketplace listing' };
      }
    } else {
      // Create new listing
      const { error: insertError } = await supabase
        .from('marketplace_agents')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          name: agent.name,
          description: marketplaceData.description || agent.description,
          archetype: agent.archetype,
          personality: agent.personality,
          capabilities: agent.capabilities,
          price: marketplaceData.price,
          categories: marketplaceData.categories,
          is_public: marketplaceData.is_public,
          is_approved: false, // Requires approval
          rating: 0,
          reviews_count: 0,
          downloads: 0,
          published_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error publishing agent to marketplace:', insertError);
        return { success: false, error: 'Failed to publish agent to marketplace' };
      }
    }
    
    // Invalidate cache
    cache.delete('marketplace:featured:6');
    
    return { success: true };
  } catch (error) {
    console.error('Error publishing agent to marketplace:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Acquire an agent from the marketplace
 * 
 * @param marketplaceAgentId The ID of the marketplace agent
 * @returns Whether the agent was acquired successfully
 */
export async function acquireMarketplaceAgent(
  marketplaceAgentId: string
): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'You must be logged in to acquire an agent' };
    }
    
    // Get the marketplace agent
    const { data: marketplaceAgent, error: agentError } = await supabase
      .from('marketplace_agents')
      .select('*')
      .eq('id', marketplaceAgentId)
      .eq('is_approved', true)
      .single();
    
    if (agentError) {
      console.error('Error fetching marketplace agent:', agentError);
      return { success: false, error: 'Agent not found or not available for acquisition' };
    }
    
    // Check if the agent is free or if payment is required
    if (marketplaceAgent.price > 0) {
      // In a real implementation, this would integrate with a payment processor
      // For now, we'll just simulate a successful payment
      console.log('Simulating payment for agent:', marketplaceAgent.price);
    }
    
    // Create a copy of the agent for the user
    const { data: newAgent, error: createError } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: marketplaceAgent.name,
        description: marketplaceAgent.description,
        archetype: marketplaceAgent.archetype,
        personality: marketplaceAgent.personality,
        capabilities: marketplaceAgent.capabilities,
        is_public: false,
        version: 1,
        source_marketplace_id: marketplaceAgentId
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating agent copy:', createError);
      return { success: false, error: 'Failed to create a copy of the agent' };
    }
    
    // Record the acquisition
    const { error: acquisitionError } = await supabase
      .from('marketplace_acquisitions')
      .insert({
        user_id: user.id,
        marketplace_agent_id: marketplaceAgentId,
        agent_id: newAgent.id,
        price_paid: marketplaceAgent.price
      });
    
    if (acquisitionError) {
      console.error('Error recording acquisition:', acquisitionError);
      // Continue anyway, as the agent has been created
    }
    
    // Increment the download count
    const { error: updateError } = await supabase
      .from('marketplace_agents')
      .update({
        downloads: marketplaceAgent.downloads + 1
      })
      .eq('id', marketplaceAgentId);
    
    if (updateError) {
      console.error('Error updating download count:', updateError);
      // Continue anyway, as this is not critical
    }
    
    // Invalidate cache
    cache.delete(`marketplace:agent:${marketplaceAgentId}`);
    cache.delete('marketplace:featured:6');
    
    return { success: true, agentId: newAgent.id };
  } catch (error) {
    console.error('Error acquiring marketplace agent:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get marketplace statistics
 * 
 * @returns Marketplace statistics
 */
export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const cacheKey = 'marketplace:stats';
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get total agents
      const { count: totalAgents, error: agentsError } = await supabase
        .from('marketplace_agents')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);
      
      if (agentsError) {
        console.error('Error fetching total agents:', agentsError);
        return {
          total_agents: 0,
          total_downloads: 0,
          featured_agents: 0,
          top_categories: []
        };
      }
      
      // Get total downloads
      const { data: downloadsData, error: downloadsError } = await supabase
        .from('marketplace_agents')
        .select('downloads')
        .eq('is_approved', true);
      
      if (downloadsError) {
        console.error('Error fetching downloads:', downloadsError);
        return {
          total_agents: totalAgents || 0,
          total_downloads: 0,
          featured_agents: 0,
          top_categories: []
        };
      }
      
      const totalDownloads = downloadsData.reduce((sum, agent) => sum + agent.downloads, 0);
      
      // Get featured agents count
      const { count: featuredAgents, error: featuredError } = await supabase
        .from('marketplace_agents')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)
        .eq('is_featured', true);
      
      if (featuredError) {
        console.error('Error fetching featured agents:', featuredError);
        return {
          total_agents: totalAgents || 0,
          total_downloads: totalDownloads,
          featured_agents: 0,
          top_categories: []
        };
      }
      
      // Get top categories
      const { data: categories, error: categoriesError } = await supabase
        .from('marketplace_categories')
        .select('name, agent_count:marketplace_agents(count)')
        .order('agent_count', { ascending: false })
        .limit(5);
      
      if (categoriesError) {
        console.error('Error fetching top categories:', categoriesError);
        return {
          total_agents: totalAgents || 0,
          total_downloads: totalDownloads,
          featured_agents: featuredAgents || 0,
          top_categories: []
        };
      }
      
      const topCategories = categories.map(category => ({
        name: category.name,
        count: category.agent_count[0]?.count || 0
      }));
      
      return {
        total_agents: totalAgents || 0,
        total_downloads: totalDownloads,
        featured_agents: featuredAgents || 0,
        top_categories: topCategories
      };
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      return {
        total_agents: 0,
        total_downloads: 0,
        featured_agents: 0,
        top_categories: []
      };
    }
  }, 30 * 60 * 1000); // Cache for 30 minutes
}

/**
 * Format a marketplace agent from the database
 * 
 * @param data Raw data from the database
 * @returns Formatted marketplace agent
 */
function formatMarketplaceAgent(data: any): MarketplaceAgent {
  return {
    id: data.id,
    agent_id: data.agent_id,
    user_id: data.user_id,
    name: data.name,
    description: data.description,
    archetype: data.archetype,
    personality: data.personality,
    capabilities: data.capabilities,
    knowledge_base_ids: data.knowledge_base_ids,
    is_public: data.is_public,
    version: data.version,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author: {
      id: data.author?.id || data.user_id,
      name: data.author?.full_name || 'Unknown',
      avatar_url: data.author?.avatar_url
    },
    rating: data.rating,
    reviews_count: data.reviews_count,
    downloads: data.downloads,
    price: data.price,
    is_featured: data.is_featured,
    categories: data.categories || [],
    published_at: data.published_at
  };
}
