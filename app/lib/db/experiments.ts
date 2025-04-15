'use client';

import { createBrowserSupabaseClient } from './supabase';

export interface ExperimentConfiguration {
  type: string;
  metrics: string[];
  agents: string[];
  parameters: Record<string, any>;
}

export interface Experiment {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  configuration: ExperimentConfiguration;
  status: 'draft' | 'running' | 'completed' | 'failed';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExperimentRun {
  id: string;
  experiment_id: string;
  agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Record<string, any> | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AgentMetric {
  id: string;
  agent_id: string;
  experiment_id: string | null;
  run_id: string | null;
  metric_type: string;
  value: number;
  created_at: string;
}

// Create a new experiment
export async function createExperiment(
  name: string,
  description: string | null,
  configuration: ExperimentConfiguration,
  userId: string,
  isPublic: boolean = false
): Promise<Experiment | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const newExperiment = {
      name,
      description,
      configuration,
      status: 'draft',
      is_public: isPublic,
      user_id: userId,
    };
    
    const { data, error } = await supabase
      .from('experiments')
      .insert(newExperiment)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating experiment:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating experiment:', error);
    return null;
  }
}

// Get all experiments for a user
export async function getAllExperiments(userId: string): Promise<Experiment[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching experiments:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return [];
  }
}

// Get experiment by ID
export async function getExperimentById(experimentId: string): Promise<Experiment | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .single();
    
    if (error) {
      console.error('Error fetching experiment:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching experiment:', error);
    return null;
  }
}

// Update an experiment
export async function updateExperiment(
  experimentId: string,
  updates: Partial<Experiment>
): Promise<Experiment | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('experiments')
      .update(updates)
      .eq('id', experimentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating experiment:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating experiment:', error);
    return null;
  }
}

// Delete an experiment
export async function deleteExperiment(experimentId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', experimentId);
    
    if (error) {
      console.error('Error deleting experiment:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return false;
  }
}

// Get experiment runs
export async function getExperimentRuns(experimentId: string): Promise<ExperimentRun[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('experiment_runs')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching experiment runs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching experiment runs:', error);
    return [];
  }
}

// Create an experiment run
export async function createExperimentRun(
  experimentId: string,
  agentId: string
): Promise<ExperimentRun | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const newRun = {
      experiment_id: experimentId,
      agent_id: agentId,
      status: 'pending',
      results: null,
    };
    
    const { data, error } = await supabase
      .from('experiment_runs')
      .insert(newRun)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating experiment run:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating experiment run:', error);
    return null;
  }
}

// Get agent metrics
export async function getAgentMetrics(agentId: string): Promise<AgentMetric[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('agent_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching agent metrics:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    return [];
  }
}

// Add agent metric
export async function addAgentMetric(
  agentId: string,
  metricType: string,
  value: number,
  experimentId?: string,
  runId?: string
): Promise<AgentMetric | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const newMetric = {
      agent_id: agentId,
      experiment_id: experimentId || null,
      run_id: runId || null,
      metric_type: metricType,
      value,
    };
    
    const { data, error } = await supabase
      .from('agent_metrics')
      .insert(newMetric)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding agent metric:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding agent metric:', error);
    return null;
  }
}
