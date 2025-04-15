'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { updateDeploymentMetrics } from './agentDeployment';

/**
 * Agent Monitoring Service
 * 
 * This service provides functions for monitoring deployed agents
 * and collecting metrics.
 */

export interface MonitoringMetrics {
  uptime: number;
  requests: number;
  errors: number;
  latency: number;
  cost: number;
}

export interface MonitoringEvent {
  deploymentId: string;
  eventType: 'request' | 'response' | 'error' | 'status';
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Record a monitoring event for a deployed agent
 * 
 * @param event The monitoring event to record
 * @returns Whether the event was recorded successfully
 */
export async function recordMonitoringEvent(event: MonitoringEvent): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from('agent_monitoring_events')
      .insert({
        deployment_id: event.deploymentId,
        event_type: event.eventType,
        timestamp: event.timestamp || new Date().toISOString(),
        data: event.data
      });
    
    if (error) {
      console.error('Error recording monitoring event:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error recording monitoring event:', error);
    return false;
  }
}

/**
 * Get monitoring events for a deployment
 * 
 * @param deploymentId The ID of the deployment
 * @param limit Maximum number of events to return
 * @param offset Offset for pagination
 * @returns Array of monitoring events
 */
export async function getMonitoringEvents(
  deploymentId: string,
  limit: number = 100,
  offset: number = 0
): Promise<MonitoringEvent[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('agent_monitoring_events')
      .select('*')
      .eq('deployment_id', deploymentId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching monitoring events:', error);
      return [];
    }
    
    return data.map(event => ({
      deploymentId: event.deployment_id,
      eventType: event.event_type,
      timestamp: event.timestamp,
      data: event.data
    }));
  } catch (error) {
    console.error('Error fetching monitoring events:', error);
    return [];
  }
}

/**
 * Calculate metrics for a deployment based on monitoring events
 * 
 * @param deploymentId The ID of the deployment
 * @returns The calculated metrics
 */
export async function calculateDeploymentMetrics(deploymentId: string): Promise<MonitoringMetrics | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get deployment info
    const { data: deployment, error: deploymentError } = await supabase
      .from('agent_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();
    
    if (deploymentError || !deployment) {
      console.error('Error fetching deployment:', deploymentError);
      return null;
    }
    
    // Calculate uptime
    const deployedAt = deployment.deployed_at ? new Date(deployment.deployed_at) : null;
    const terminatedAt = deployment.terminated_at ? new Date(deployment.terminated_at) : null;
    const now = new Date();
    
    let uptime = 0;
    if (deployedAt) {
      const endTime = terminatedAt || now;
      uptime = Math.floor((endTime.getTime() - deployedAt.getTime()) / 1000);
    }
    
    // Get request events
    const { data: requestEvents, error: requestError } = await supabase
      .from('agent_monitoring_events')
      .select('*')
      .eq('deployment_id', deploymentId)
      .eq('event_type', 'request');
    
    if (requestError) {
      console.error('Error fetching request events:', requestError);
      return null;
    }
    
    // Get error events
    const { data: errorEvents, error: errorError } = await supabase
      .from('agent_monitoring_events')
      .select('*')
      .eq('deployment_id', deploymentId)
      .eq('event_type', 'error');
    
    if (errorError) {
      console.error('Error fetching error events:', errorError);
      return null;
    }
    
    // Calculate latency from request-response pairs
    const { data: responseEvents, error: responseError } = await supabase
      .from('agent_monitoring_events')
      .select('*')
      .eq('deployment_id', deploymentId)
      .eq('event_type', 'response');
    
    if (responseError) {
      console.error('Error fetching response events:', responseError);
      return null;
    }
    
    let totalLatency = 0;
    let latencyCount = 0;
    
    for (const response of responseEvents) {
      if (response.data.requestId) {
        const request = requestEvents.find(req => req.data.requestId === response.data.requestId);
        if (request) {
          const requestTime = new Date(request.timestamp).getTime();
          const responseTime = new Date(response.timestamp).getTime();
          const latency = responseTime - requestTime;
          
          if (latency > 0) {
            totalLatency += latency;
            latencyCount++;
          }
        }
      }
    }
    
    const avgLatency = latencyCount > 0 ? totalLatency / latencyCount : 0;
    
    // Calculate cost based on token usage
    let totalCost = 0;
    for (const response of responseEvents) {
      if (response.data.tokenUsage) {
        // Simplified cost calculation: $0.0001 per token
        const tokenCost = (response.data.tokenUsage.total || 0) * 0.0001;
        totalCost += tokenCost;
      }
    }
    
    const metrics: MonitoringMetrics = {
      uptime,
      requests: requestEvents.length,
      errors: errorEvents.length,
      latency: Math.round(avgLatency),
      cost: parseFloat(totalCost.toFixed(2))
    };
    
    // Update the deployment metrics
    await updateDeploymentMetrics(deploymentId, metrics);
    
    return metrics;
  } catch (error) {
    console.error('Error calculating deployment metrics:', error);
    return null;
  }
}

/**
 * Set up real-time monitoring for a deployment
 * 
 * @param deploymentId The ID of the deployment
 * @param onMetricsUpdate Callback function for metrics updates
 * @returns Cleanup function
 */
export function setupRealTimeMonitoring(
  deploymentId: string,
  onMetricsUpdate?: (metrics: MonitoringMetrics) => void
): () => void {
  const supabase = createBrowserSupabaseClient();
  
  // Subscribe to monitoring events
  const channel = supabase
    .channel(`deployment-${deploymentId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'agent_monitoring_events',
      filter: `deployment_id=eq.${deploymentId}`
    }, async (payload) => {
      // Update metrics when new events are recorded
      const metrics = await calculateDeploymentMetrics(deploymentId);
      if (metrics && onMetricsUpdate) {
        onMetricsUpdate(metrics);
      }
    })
    .subscribe();
  
  // Set up periodic metrics calculation
  const intervalId = setInterval(async () => {
    const metrics = await calculateDeploymentMetrics(deploymentId);
    if (metrics && onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, 60000); // Update every minute
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    supabase.removeChannel(channel);
  };
}
