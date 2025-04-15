'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { getAgentById } from '../db/agentStorage';
import { config } from '../config';

/**
 * Agent Deployment Service
 *
 * This service provides functions for deploying agents to different environments
 * and managing their lifecycle.
 */

export interface DeploymentEnvironment {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  maxAgents: number;
}

export interface DeploymentConfiguration {
  environment: string;
  settings: Record<string, any>;
  resources: {
    memory?: number;
    cpu?: number;
    storage?: number;
  };
  constraints: {
    maxRuntime?: number;
    maxCost?: number;
    allowedActions?: string[];
  };
}

export interface DeploymentStatus {
  id: string;
  agentId: string;
  environment: string;
  status: 'pending' | 'deploying' | 'running' | 'paused' | 'stopped' | 'failed';
  metrics?: {
    uptime: number;
    requests: number;
    errors: number;
    latency: number;
    cost: number;
  };
  createdAt: string;
  deployedAt?: string;
  terminatedAt?: string;
}

// Available deployment environments
export const deploymentEnvironments: DeploymentEnvironment[] = config.deploymentEnvironments;

/**
 * Deploy an agent to a specific environment
 *
 * @param agentId The ID of the agent to deploy
 * @param configuration The deployment configuration
 * @returns The deployment status
 */
export async function deployAgent(
  agentId: string,
  configuration: DeploymentConfiguration
): Promise<{ success: boolean; deployment?: DeploymentStatus; error?: string }> {
  try {
    // Get the agent
    const agent = await getAgentById(agentId);
    if (!agent) {
      return {
        success: false,
        error: 'Agent not found'
      };
    }

    // Validate the environment
    const environment = deploymentEnvironments.find(env => env.id === configuration.environment);
    if (!environment) {
      return {
        success: false,
        error: `Invalid environment: ${configuration.environment}`
      };
    }

    // Check if the agent is already deployed to this environment
    const supabase = createBrowserSupabaseClient();
    const { data: existingDeployments, error: checkError } = await supabase
      .from('agent_deployments')
      .select('*')
      .eq('agent_id', agentId)
      .eq('environment', configuration.environment)
      .eq('status', 'running');

    if (checkError) {
      throw checkError;
    }

    if (existingDeployments && existingDeployments.length > 0) {
      return {
        success: false,
        error: `Agent is already deployed to ${environment.name}`
      };
    }

    // Check if the user has reached the maximum number of agents for this environment
    const { data: userDeployments, error: userDeploymentsError } = await supabase
      .from('agent_deployments')
      .select('*')
      .eq('environment', configuration.environment)
      .eq('status', 'running');

    if (userDeploymentsError) {
      throw userDeploymentsError;
    }

    if (userDeployments && userDeployments.length >= environment.maxAgents) {
      return {
        success: false,
        error: `Maximum number of agents (${environment.maxAgents}) reached for ${environment.name}`
      };
    }

    // Create the deployment
    const { data: deployment, error: deploymentError } = await supabase
      .from('agent_deployments')
      .insert({
        agent_id: agentId,
        environment: configuration.environment,
        status: 'pending',
        configuration: {
          settings: configuration.settings,
          resources: configuration.resources,
          constraints: configuration.constraints
        }
      })
      .select()
      .single();

    if (deploymentError) {
      throw deploymentError;
    }

    // Simulate the deployment process
    // In a real implementation, this would call an external service to deploy the agent
    setTimeout(async () => {
      await updateDeploymentStatus(deployment.id, 'running');
    }, 5000);

    return {
      success: true,
      deployment: {
        id: deployment.id,
        agentId: deployment.agent_id,
        environment: deployment.environment,
        status: deployment.status,
        createdAt: deployment.created_at,
        deployedAt: deployment.deployed_at,
        terminatedAt: deployment.terminated_at
      }
    };
  } catch (error) {
    console.error('Error deploying agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Update the status of a deployment
 *
 * @param deploymentId The ID of the deployment
 * @param status The new status
 * @returns Whether the update was successful
 */
export async function updateDeploymentStatus(
  deploymentId: string,
  status: 'pending' | 'deploying' | 'running' | 'paused' | 'stopped' | 'failed'
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();

    const updates: any = { status };

    // Set timestamps based on status
    if (status === 'running') {
      updates.deployed_at = new Date().toISOString();
    } else if (status === 'stopped' || status === 'failed') {
      updates.terminated_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('agent_deployments')
      .update(updates)
      .eq('id', deploymentId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating deployment status:', error);
    return false;
  }
}

/**
 * Get all deployments for an agent
 *
 * @param agentId The ID of the agent
 * @returns Array of deployment statuses
 */
export async function getAgentDeployments(agentId: string): Promise<DeploymentStatus[]> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('agent_deployments')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(deployment => ({
      id: deployment.id,
      agentId: deployment.agent_id,
      environment: deployment.environment,
      status: deployment.status,
      metrics: deployment.metrics,
      createdAt: deployment.created_at,
      deployedAt: deployment.deployed_at,
      terminatedAt: deployment.terminated_at
    }));
  } catch (error) {
    console.error('Error getting agent deployments:', error);
    return [];
  }
}

/**
 * Get a specific deployment by ID
 *
 * @param deploymentId The ID of the deployment
 * @returns The deployment status
 */
export async function getDeploymentById(deploymentId: string): Promise<DeploymentStatus | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('agent_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      agentId: data.agent_id,
      environment: data.environment,
      status: data.status,
      metrics: data.metrics,
      createdAt: data.created_at,
      deployedAt: data.deployed_at,
      terminatedAt: data.terminated_at
    };
  } catch (error) {
    console.error('Error getting deployment:', error);
    return null;
  }
}

/**
 * Stop a deployed agent
 *
 * @param deploymentId The ID of the deployment
 * @returns Whether the operation was successful
 */
export async function stopDeployment(deploymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current deployment
    const deployment = await getDeploymentById(deploymentId);
    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found'
      };
    }

    // Check if the deployment is already stopped
    if (deployment.status === 'stopped' || deployment.status === 'failed') {
      return {
        success: false,
        error: `Deployment is already ${deployment.status}`
      };
    }

    // Update the status to stopped
    const success = await updateDeploymentStatus(deploymentId, 'stopped');

    if (!success) {
      return {
        success: false,
        error: 'Failed to stop deployment'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error stopping deployment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Pause a deployed agent
 *
 * @param deploymentId The ID of the deployment
 * @returns Whether the operation was successful
 */
export async function pauseDeployment(deploymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current deployment
    const deployment = await getDeploymentById(deploymentId);
    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found'
      };
    }

    // Check if the deployment is running
    if (deployment.status !== 'running') {
      return {
        success: false,
        error: `Cannot pause deployment with status ${deployment.status}`
      };
    }

    // Update the status to paused
    const success = await updateDeploymentStatus(deploymentId, 'paused');

    if (!success) {
      return {
        success: false,
        error: 'Failed to pause deployment'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error pausing deployment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Resume a paused agent
 *
 * @param deploymentId The ID of the deployment
 * @returns Whether the operation was successful
 */
export async function resumeDeployment(deploymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current deployment
    const deployment = await getDeploymentById(deploymentId);
    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found'
      };
    }

    // Check if the deployment is paused
    if (deployment.status !== 'paused') {
      return {
        success: false,
        error: `Cannot resume deployment with status ${deployment.status}`
      };
    }

    // Update the status to running
    const success = await updateDeploymentStatus(deploymentId, 'running');

    if (!success) {
      return {
        success: false,
        error: 'Failed to resume deployment'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error resuming deployment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Update the metrics for a deployment
 *
 * @param deploymentId The ID of the deployment
 * @param metrics The metrics to update
 * @returns Whether the update was successful
 */
export async function updateDeploymentMetrics(
  deploymentId: string,
  metrics: {
    uptime?: number;
    requests?: number;
    errors?: number;
    latency?: number;
    cost?: number;
  }
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();

    // Get current metrics
    const { data, error: getError } = await supabase
      .from('agent_deployments')
      .select('metrics')
      .eq('id', deploymentId)
      .single();

    if (getError) {
      throw getError;
    }

    // Merge with existing metrics
    const currentMetrics = data?.metrics || {};
    const updatedMetrics = { ...currentMetrics, ...metrics };

    // Update the metrics
    const { error: updateError } = await supabase
      .from('agent_deployments')
      .update({ metrics: updatedMetrics })
      .eq('id', deploymentId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error updating deployment metrics:', error);
    return false;
  }
}
