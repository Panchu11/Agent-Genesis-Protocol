'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { cache } from '../utils/cache';

/**
 * Marketplace Analytics Service
 * 
 * This service provides functions for retrieving and analyzing marketplace data.
 */

export interface AnalyticsPeriod {
  label: string;
  value: 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface AnalyticsDataPoint {
  date: string;
  value: number;
}

export interface CategoryAnalytics {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface AgentPerformance {
  id: string;
  name: string;
  downloads: number;
  rating: number;
  reviews_count: number;
  revenue: number;
}

export interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users: number;
  returning_users: number;
}

export interface MarketplaceAnalytics {
  total_agents: number;
  total_downloads: number;
  total_revenue: number;
  average_rating: number;
  downloads_trend: AnalyticsDataPoint[];
  revenue_trend: AnalyticsDataPoint[];
  category_distribution: CategoryAnalytics[];
  top_performing_agents: AgentPerformance[];
  user_analytics: UserAnalytics;
}

/**
 * Get marketplace analytics data
 * 
 * @param period The time period for analytics
 * @returns Marketplace analytics data
 */
export async function getMarketplaceAnalytics(
  period: 'day' | 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<MarketplaceAnalytics> {
  const cacheKey = `marketplace:analytics:${period}`;
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get the current user to check permissions
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user has admin role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const isAdmin = userRoles?.role === 'admin';
      
      if (!isAdmin) {
        throw new Error('Insufficient permissions');
      }
      
      // Get date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
      }
      
      const startDateStr = startDate.toISOString();
      
      // Get total agents
      const { count: totalAgents } = await supabase
        .from('marketplace_agents')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);
      
      // Get total downloads and revenue
      const { data: agentsData } = await supabase
        .from('marketplace_agents')
        .select('downloads, price')
        .eq('is_approved', true);
      
      const totalDownloads = agentsData?.reduce((sum, agent) => sum + agent.downloads, 0) || 0;
      const totalRevenue = agentsData?.reduce((sum, agent) => sum + (agent.downloads * agent.price), 0) || 0;
      
      // Get average rating
      const { data: ratingsData } = await supabase
        .from('marketplace_agents')
        .select('rating, reviews_count')
        .eq('is_approved', true)
        .gt('reviews_count', 0);
      
      let averageRating = 0;
      if (ratingsData && ratingsData.length > 0) {
        const totalWeightedRating = ratingsData.reduce((sum, agent) => sum + (agent.rating * agent.reviews_count), 0);
        const totalReviews = ratingsData.reduce((sum, agent) => sum + agent.reviews_count, 0);
        averageRating = totalWeightedRating / totalReviews;
      }
      
      // Get downloads trend
      const { data: acquisitionsData } = await supabase
        .from('marketplace_acquisitions')
        .select('created_at, price_paid')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true });
      
      // Group acquisitions by date
      const downloadsByDate = new Map<string, number>();
      const revenueByDate = new Map<string, number>();
      
      acquisitionsData?.forEach(acquisition => {
        const date = new Date(acquisition.created_at);
        let dateKey: string;
        
        // Format date key based on period
        switch (period) {
          case 'day':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'week':
          case 'month':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            break;
          case 'year':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        // Increment downloads count for this date
        downloadsByDate.set(dateKey, (downloadsByDate.get(dateKey) || 0) + 1);
        
        // Add revenue for this date
        revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + (acquisition.price_paid || 0));
      });
      
      // Convert to array of data points
      const downloadsTrend: AnalyticsDataPoint[] = Array.from(downloadsByDate.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const revenueTrend: AnalyticsDataPoint[] = Array.from(revenueByDate.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Get category distribution
      const { data: categories } = await supabase
        .from('marketplace_categories')
        .select('id, name, agent_count:marketplace_agents(count)')
        .order('agent_count', { ascending: false });
      
      const categoryDistribution: CategoryAnalytics[] = categories?.map(category => ({
        id: category.id,
        name: category.name,
        count: category.agent_count[0]?.count || 0,
        percentage: totalAgents ? ((category.agent_count[0]?.count || 0) / totalAgents) * 100 : 0
      })) || [];
      
      // Get top performing agents
      const { data: topAgents } = await supabase
        .from('marketplace_agents')
        .select('id, name, downloads, rating, reviews_count, price')
        .eq('is_approved', true)
        .order('downloads', { ascending: false })
        .limit(10);
      
      const topPerformingAgents: AgentPerformance[] = topAgents?.map(agent => ({
        id: agent.id,
        name: agent.name,
        downloads: agent.downloads,
        rating: agent.rating,
        reviews_count: agent.reviews_count,
        revenue: agent.downloads * agent.price
      })) || [];
      
      // Get user analytics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Get active users (users who have logged in within the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());
      
      // Get new users (users who signed up within the period)
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateStr);
      
      // Get returning users (active users who are not new users)
      const { count: returningUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString())
        .lt('created_at', startDateStr);
      
      return {
        total_agents: totalAgents || 0,
        total_downloads: totalDownloads,
        total_revenue: totalRevenue,
        average_rating: averageRating,
        downloads_trend: downloadsTrend,
        revenue_trend: revenueTrend,
        category_distribution: categoryDistribution,
        top_performing_agents: topPerformingAgents,
        user_analytics: {
          total_users: totalUsers || 0,
          active_users: activeUsers || 0,
          new_users: newUsers || 0,
          returning_users: returningUsers || 0
        }
      };
    } catch (error) {
      console.error('Error fetching marketplace analytics:', error);
      throw error;
    }
  }, 15 * 60 * 1000); // Cache for 15 minutes
}

/**
 * Get agent performance analytics
 * 
 * @param agentId The ID of the agent
 * @param period The time period for analytics
 * @returns Agent performance analytics
 */
export async function getAgentPerformanceAnalytics(
  agentId: string,
  period: 'day' | 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<{
  downloads_trend: AnalyticsDataPoint[];
  revenue_trend: AnalyticsDataPoint[];
  rating_distribution: { rating: number; count: number }[];
  user_demographics: { country: string; count: number }[];
}> {
  const cacheKey = `marketplace:agent:analytics:${agentId}:${period}`;
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user is the agent owner or has admin role
      const { data: agent } = await supabase
        .from('marketplace_agents')
        .select('user_id')
        .eq('id', agentId)
        .single();
      
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const isAdmin = userRoles?.role === 'admin';
      const isOwner = agent?.user_id === user.id;
      
      if (!isAdmin && !isOwner) {
        throw new Error('Insufficient permissions');
      }
      
      // Get date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
      }
      
      const startDateStr = startDate.toISOString();
      
      // Get acquisitions for this agent
      const { data: acquisitions } = await supabase
        .from('marketplace_acquisitions')
        .select('created_at, price_paid, user_id')
        .eq('marketplace_agent_id', agentId)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true });
      
      // Group acquisitions by date
      const downloadsByDate = new Map<string, number>();
      const revenueByDate = new Map<string, number>();
      
      acquisitions?.forEach(acquisition => {
        const date = new Date(acquisition.created_at);
        let dateKey: string;
        
        // Format date key based on period
        switch (period) {
          case 'day':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'week':
          case 'month':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            break;
          case 'year':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        // Increment downloads count for this date
        downloadsByDate.set(dateKey, (downloadsByDate.get(dateKey) || 0) + 1);
        
        // Add revenue for this date
        revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + (acquisition.price_paid || 0));
      });
      
      // Convert to array of data points
      const downloadsTrend: AnalyticsDataPoint[] = Array.from(downloadsByDate.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const revenueTrend: AnalyticsDataPoint[] = Array.from(revenueByDate.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Get rating distribution
      const { data: reviews } = await supabase
        .from('marketplace_reviews')
        .select('rating')
        .eq('agent_id', agentId);
      
      const ratingCounts = [0, 0, 0, 0, 0]; // Counts for ratings 1-5
      
      reviews?.forEach(review => {
        const rating = Math.round(review.rating);
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating - 1]++;
        }
      });
      
      const ratingDistribution = ratingCounts.map((count, index) => ({
        rating: index + 1,
        count
      }));
      
      // Get user demographics (countries)
      const userIds = acquisitions?.map(a => a.user_id) || [];
      
      // Get unique user IDs
      const uniqueUserIds = [...new Set(userIds)];
      
      // Get user profiles
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('country')
        .in('id', uniqueUserIds);
      
      // Count users by country
      const countryCounts = new Map<string, number>();
      
      userProfiles?.forEach(profile => {
        const country = profile.country || 'Unknown';
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      });
      
      // Convert to array and sort by count
      const userDemographics = Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
      
      return {
        downloads_trend: downloadsTrend,
        revenue_trend: revenueTrend,
        rating_distribution: ratingDistribution,
        user_demographics: userDemographics
      };
    } catch (error) {
      console.error('Error fetching agent performance analytics:', error);
      throw error;
    }
  }, 15 * 60 * 1000); // Cache for 15 minutes
}

/**
 * Get marketplace trend analysis
 * 
 * @returns Marketplace trend analysis
 */
export async function getMarketplaceTrendAnalysis(): Promise<{
  trending_categories: { id: string; name: string; growth: number }[];
  trending_agents: { id: string; name: string; growth: number }[];
  market_growth: { period: string; growth: number }[];
}> {
  const cacheKey = 'marketplace:trends';
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get the current user to check permissions
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user has admin role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const isAdmin = userRoles?.role === 'admin';
      
      if (!isAdmin) {
        throw new Error('Insufficient permissions');
      }
      
      // Get trending categories (categories with the highest growth in the last 30 days)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      
      // This would typically involve complex queries to calculate growth rates
      // For now, we'll return simulated data
      const trendingCategories = [
        { id: 'productivity', name: 'Productivity', growth: 25.5 },
        { id: 'creative', name: 'Creative', growth: 18.2 },
        { id: 'education', name: 'Education', growth: 15.7 },
        { id: 'research', name: 'Research', growth: 12.3 },
        { id: 'entertainment', name: 'Entertainment', growth: 10.1 }
      ];
      
      // Get trending agents
      const trendingAgents = [
        { id: 'agent-1', name: 'Research Assistant Pro', growth: 45.2 },
        { id: 'agent-2', name: 'Creative Writer', growth: 38.7 },
        { id: 'agent-3', name: 'Code Helper', growth: 32.5 },
        { id: 'agent-4', name: 'Study Buddy', growth: 28.9 },
        { id: 'agent-5', name: 'Data Analyst', growth: 22.3 }
      ];
      
      // Get market growth
      const marketGrowth = [
        { period: 'Last Week', growth: 5.2 },
        { period: 'Last Month', growth: 18.7 },
        { period: 'Last Quarter', growth: 42.3 },
        { period: 'Last Year', growth: 127.8 }
      ];
      
      return {
        trending_categories: trendingCategories,
        trending_agents: trendingAgents,
        market_growth: marketGrowth
      };
    } catch (error) {
      console.error('Error fetching marketplace trend analysis:', error);
      throw error;
    }
  }, 24 * 60 * 60 * 1000); // Cache for 24 hours
}
