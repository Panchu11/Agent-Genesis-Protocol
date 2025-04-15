'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { ExperimentTemplate } from '@/app/components/evolution/ExperimentTemplates';
import { StoredAgent } from '../db/agentStorage';

/**
 * Experiment Service
 * 
 * This service provides functions for managing experiments and experiment runs.
 */

export interface Experiment {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metrics: string[];
  config: Record<string, any>;
  results?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
  template_id?: string;
}

export interface ExperimentRun {
  id: string;
  experiment_id: string;
  agent_id: string;
  agent_version: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metrics?: Record<string, number>;
  results?: Record<string, any>;
  logs?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExperimentRequest {
  name: string;
  description?: string;
  type: string;
  metrics: string[];
  config: Record<string, any>;
  template_id?: string;
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  results?: Record<string, any>;
}

export interface CreateExperimentRunRequest {
  experiment_id: string;
  agent_id: string;
  agent_version: number;
}

export interface UpdateExperimentRunRequest {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  metrics?: Record<string, number>;
  results?: Record<string, any>;
  logs?: string;
  completed_at?: string;
}

/**
 * Get all experiments for the current user
 * 
 * @returns Array of experiments
 */
export async function getUserExperiments(): Promise<Experiment[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get experiments
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching experiments:', error);
      throw new Error('Failed to fetch experiments');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserExperiments:', error);
    throw error;
  }
}

/**
 * Get an experiment by ID
 * 
 * @param experimentId The ID of the experiment
 * @returns The experiment or null if not found
 */
export async function getExperimentById(experimentId: string): Promise<Experiment | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get experiment
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching experiment:', error);
      throw new Error('Failed to fetch experiment');
    }
    
    return data;
  } catch (error) {
    console.error('Error in getExperimentById:', error);
    throw error;
  }
}

/**
 * Create a new experiment
 * 
 * @param experimentData The experiment data
 * @returns The created experiment
 */
export async function createExperiment(experimentData: CreateExperimentRequest): Promise<Experiment> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create the experiment
    const { data, error } = await supabase
      .from('experiments')
      .insert({
        name: experimentData.name,
        description: experimentData.description,
        type: experimentData.type,
        status: 'pending',
        metrics: experimentData.metrics,
        config: experimentData.config,
        user_id: user.id,
        template_id: experimentData.template_id,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating experiment:', error);
      throw new Error('Failed to create experiment');
    }
    
    return data;
  } catch (error) {
    console.error('Error in createExperiment:', error);
    throw error;
  }
}

/**
 * Update an experiment
 * 
 * @param experimentId The ID of the experiment
 * @param experimentData The experiment data to update
 * @returns The updated experiment
 */
export async function updateExperiment(
  experimentId: string,
  experimentData: UpdateExperimentRequest
): Promise<Experiment> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the experiment
    const { data, error } = await supabase
      .from('experiments')
      .update(experimentData)
      .eq('id', experimentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating experiment:', error);
      throw new Error('Failed to update experiment');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateExperiment:', error);
    throw error;
  }
}

/**
 * Delete an experiment
 * 
 * @param experimentId The ID of the experiment
 * @returns Whether the experiment was deleted successfully
 */
export async function deleteExperiment(experimentId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Delete the experiment
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', experimentId);
    
    if (error) {
      console.error('Error deleting experiment:', error);
      throw new Error('Failed to delete experiment');
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteExperiment:', error);
    throw error;
  }
}

/**
 * Get experiment runs for an experiment
 * 
 * @param experimentId The ID of the experiment
 * @returns Array of experiment runs
 */
export async function getExperimentRuns(experimentId: string): Promise<ExperimentRun[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get experiment runs
    const { data, error } = await supabase
      .from('experiment_runs')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching experiment runs:', error);
      throw new Error('Failed to fetch experiment runs');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getExperimentRuns:', error);
    throw error;
  }
}

/**
 * Get an experiment run by ID
 * 
 * @param runId The ID of the experiment run
 * @returns The experiment run or null if not found
 */
export async function getExperimentRunById(runId: string): Promise<ExperimentRun | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get experiment run
    const { data, error } = await supabase
      .from('experiment_runs')
      .select('*')
      .eq('id', runId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching experiment run:', error);
      throw new Error('Failed to fetch experiment run');
    }
    
    return data;
  } catch (error) {
    console.error('Error in getExperimentRunById:', error);
    throw error;
  }
}

/**
 * Create a new experiment run
 * 
 * @param runData The experiment run data
 * @returns The created experiment run
 */
export async function createExperimentRun(runData: CreateExperimentRunRequest): Promise<ExperimentRun> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Create the experiment run
    const { data, error } = await supabase
      .from('experiment_runs')
      .insert({
        experiment_id: runData.experiment_id,
        agent_id: runData.agent_id,
        agent_version: runData.agent_version,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating experiment run:', error);
      throw new Error('Failed to create experiment run');
    }
    
    return data;
  } catch (error) {
    console.error('Error in createExperimentRun:', error);
    throw error;
  }
}

/**
 * Update an experiment run
 * 
 * @param runId The ID of the experiment run
 * @param runData The experiment run data to update
 * @returns The updated experiment run
 */
export async function updateExperimentRun(
  runId: string,
  runData: UpdateExperimentRunRequest
): Promise<ExperimentRun> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the experiment run
    const { data, error } = await supabase
      .from('experiment_runs')
      .update(runData)
      .eq('id', runId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating experiment run:', error);
      throw new Error('Failed to update experiment run');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateExperimentRun:', error);
    throw error;
  }
}

/**
 * Delete an experiment run
 * 
 * @param runId The ID of the experiment run
 * @returns Whether the experiment run was deleted successfully
 */
export async function deleteExperimentRun(runId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Delete the experiment run
    const { error } = await supabase
      .from('experiment_runs')
      .delete()
      .eq('id', runId);
    
    if (error) {
      console.error('Error deleting experiment run:', error);
      throw new Error('Failed to delete experiment run');
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteExperimentRun:', error);
    throw error;
  }
}

/**
 * Start an experiment
 * 
 * @param experimentId The ID of the experiment
 * @returns The updated experiment
 */
export async function startExperiment(experimentId: string): Promise<Experiment> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the experiment status
    const { data, error } = await supabase
      .from('experiments')
      .update({ status: 'running' })
      .eq('id', experimentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error starting experiment:', error);
      throw new Error('Failed to start experiment');
    }
    
    return data;
  } catch (error) {
    console.error('Error in startExperiment:', error);
    throw error;
  }
}

/**
 * Complete an experiment
 * 
 * @param experimentId The ID of the experiment
 * @param results The experiment results
 * @returns The updated experiment
 */
export async function completeExperiment(
  experimentId: string,
  results: Record<string, any>
): Promise<Experiment> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the experiment status and results
    const { data, error } = await supabase
      .from('experiments')
      .update({
        status: 'completed',
        results,
      })
      .eq('id', experimentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error completing experiment:', error);
      throw new Error('Failed to complete experiment');
    }
    
    return data;
  } catch (error) {
    console.error('Error in completeExperiment:', error);
    throw error;
  }
}

/**
 * Fail an experiment
 * 
 * @param experimentId The ID of the experiment
 * @param errorMessage The error message
 * @returns The updated experiment
 */
export async function failExperiment(
  experimentId: string,
  errorMessage: string
): Promise<Experiment> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the experiment status and results
    const { data, error } = await supabase
      .from('experiments')
      .update({
        status: 'failed',
        results: { error: errorMessage },
      })
      .eq('id', experimentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error failing experiment:', error);
      throw new Error('Failed to fail experiment');
    }
    
    return data;
  } catch (error) {
    console.error('Error in failExperiment:', error);
    throw error;
  }
}

/**
 * Create an experiment from a template
 * 
 * @param template The experiment template
 * @param agents The agents to use in the experiment
 * @returns The created experiment
 */
export async function createExperimentFromTemplate(
  template: ExperimentTemplate,
  agents: StoredAgent[]
): Promise<Experiment> {
  try {
    // Create experiment data
    const experimentData: CreateExperimentRequest = {
      name: template.name,
      description: template.description,
      type: template.category,
      metrics: template.metrics,
      config: {
        ...template.config,
        agents: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          version: agent.version || 1,
        })),
        tasks: template.tasks,
        difficulty: template.difficulty,
        duration: template.duration,
      },
      template_id: template.id,
    };
    
    // Create the experiment
    const experiment = await createExperiment(experimentData);
    
    // Create experiment runs for each agent
    for (const agent of agents) {
      await createExperimentRun({
        experiment_id: experiment.id,
        agent_id: agent.id,
        agent_version: agent.version || 1,
      });
    }
    
    return experiment;
  } catch (error) {
    console.error('Error in createExperimentFromTemplate:', error);
    throw error;
  }
}
