'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { StoredAgent, getAgentById, updateAgent } from '../db/agentStorage';
import { getExperimentRuns } from '../db/experiments';
import { generateChatResponse } from '../api/fireworks';

/**
 * Agent Evolution Service
 *
 * This service provides functions for evolving agents based on experiment results
 * and performance metrics.
 */

export interface EvolutionResult {
  success: boolean;
  newAgent?: StoredAgent;
  previousAgent?: StoredAgent;
  improvements?: string[];
  error?: string;
}

export interface EvolutionOptions {
  targetMetrics?: string[];
  evolutionStrength?: 'subtle' | 'moderate' | 'aggressive';
  preservePersonality?: boolean;
  focusAreas?: string[];
}

/**
 * Evolve an agent based on experiment results
 *
 * @param agentId The ID of the agent to evolve
 * @param experimentId The ID of the experiment to use for evolution
 * @param options Evolution options
 * @returns The evolution result
 */
export async function evolveAgentFromExperiment(
  agentId: string,
  experimentId: string,
  options: EvolutionOptions = {}
): Promise<EvolutionResult> {
  try {
    // Get the agent
    const agent = await getAgentById(agentId);
    if (!agent) {
      return {
        success: false,
        error: 'Agent not found'
      };
    }

    // Get experiment runs for this agent
    const runs = await getExperimentRuns(experimentId, agentId);
    if (runs.length === 0) {
      return {
        success: false,
        error: 'No experiment runs found for this agent'
      };
    }

    // Get the most recent completed run
    const completedRuns = runs.filter(run => run.status === 'completed');
    if (completedRuns.length === 0) {
      return {
        success: false,
        error: 'No completed experiment runs found for this agent'
      };
    }

    // Sort by completion date (most recent first)
    completedRuns.sort((a, b) => {
      if (!a.completed_at || !b.completed_at) return 0;
      return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
    });

    const latestRun = completedRuns[0];
    if (!latestRun.results) {
      return {
        success: false,
        error: 'No results found for the latest experiment run'
      };
    }

    // Extract metrics from the run results
    const metrics = latestRun.results.metrics || {};

    // Determine areas for improvement
    const improvementAreas = determineImprovementAreas(metrics, options.targetMetrics);

    // Generate evolution suggestions using AI
    const evolutionSuggestions = await generateEvolutionSuggestions(
      agent,
      metrics,
      improvementAreas,
      options
    );

    if (!evolutionSuggestions.success) {
      return {
        success: false,
        error: evolutionSuggestions.error
      };
    }

    // Apply the suggested changes to create a new version of the agent
    const evolvedAgent = applyEvolutionSuggestions(
      agent,
      evolutionSuggestions.personality || {},
      evolutionSuggestions.capabilities || {},
      options
    );

    // Save the evolved agent
    const updatedAgent = await updateAgent(
      agentId,
      evolvedAgent.name,
      evolvedAgent.description || '',
      evolvedAgent.archetype || '',
      evolvedAgent.personality,
      evolvedAgent.capabilities,
      evolvedAgent.is_public
    );

    return {
      success: true,
      newAgent: updatedAgent,
      previousAgent: agent,
      improvements: evolutionSuggestions.improvements
    };
  } catch (error) {
    console.error('Error evolving agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Determine which areas of the agent need improvement based on metrics
 *
 * @param metrics The metrics from the experiment run
 * @param targetMetrics Optional specific metrics to target for improvement
 * @returns Array of areas that need improvement
 */
function determineImprovementAreas(
  metrics: Record<string, number>,
  targetMetrics?: string[]
): string[] {
  const improvementAreas: string[] = [];

  // If specific metrics are targeted, focus on those
  if (targetMetrics && targetMetrics.length > 0) {
    return targetMetrics;
  }

  // Otherwise, identify metrics below threshold
  const thresholds: Record<string, number> = {
    accuracy: 80,
    response_time: 1000, // Lower is better for response time
    creativity: 70,
    helpfulness: 75,
    reasoning: 75
  };

  for (const [metric, value] of Object.entries(metrics)) {
    const threshold = thresholds[metric as keyof typeof thresholds];
    if (threshold) {
      if (metric === 'response_time') {
        // For response time, lower is better
        if (value > threshold) {
          improvementAreas.push(metric);
        }
      } else {
        // For other metrics, higher is better
        if (value < threshold) {
          improvementAreas.push(metric);
        }
      }
    }
  }

  return improvementAreas;
}

/**
 * Generate evolution suggestions using AI
 *
 * @param agent The agent to evolve
 * @param metrics The metrics from the experiment run
 * @param improvementAreas Areas that need improvement
 * @param options Evolution options
 * @returns Suggested changes to the agent
 */
async function generateEvolutionSuggestions(
  agent: StoredAgent,
  metrics: Record<string, number>,
  improvementAreas: string[],
  options: EvolutionOptions
): Promise<{
  success: boolean;
  personality?: Record<string, any>;
  capabilities?: Record<string, any>;
  improvements?: string[];
  error?: string;
}> {
  try {
    // Create a prompt for the AI to suggest improvements
    const strengthLevel = options.evolutionStrength || 'moderate';
    const preservePersonality = options.preservePersonality !== false;

    const prompt = `
You are an AI agent evolution specialist. Your task is to suggest improvements to an agent based on its performance metrics.

Agent Information:
- Name: ${agent.name}
- Archetype: ${agent.archetype || 'Not specified'}
- Description: ${agent.description || 'Not specified'}

Current Personality:
${JSON.stringify(agent.personality, null, 2)}

Current Capabilities:
${JSON.stringify(agent.capabilities, null, 2)}

Performance Metrics:
${Object.entries(metrics).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Areas Needing Improvement:
${improvementAreas.map(area => `- ${area}`).join('\n')}

Evolution Parameters:
- Evolution Strength: ${strengthLevel} (how aggressive the changes should be)
- Preserve Core Personality: ${preservePersonality ? 'Yes' : 'No'}
${options.focusAreas ? `- Focus Areas: ${options.focusAreas.join(', ')}` : ''}

Please suggest specific improvements to the agent's personality and capabilities to address the identified areas for improvement.
The changes should be ${strengthLevel} in nature.
${preservePersonality ? 'Maintain the core personality traits of the agent while making improvements.' : 'Feel free to significantly alter the personality if needed.'}

Provide your response in the following JSON format:
{
  "personality": {
    // Updated personality object with changes
  },
  "capabilities": {
    // Updated capabilities object with changes
  },
  "improvements": [
    // List of specific improvements made and their expected impact
  ]
}
`;

    // Generate suggestions using the AI model
    const response = await generateChatResponse([
      { role: 'system', content: 'You are an AI agent evolution specialist that helps improve agents based on performance metrics.' },
      { role: 'user', content: prompt }
    ]);

    // Parse the JSON response
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                        response.match(/```\n([\s\S]*?)\n```/) ||
                        response.match(/({[\s\S]*})/);

      const jsonString = jsonMatch ? jsonMatch[1] : response;
      const suggestions = JSON.parse(jsonString);

      return {
        success: true,
        personality: suggestions.personality,
        capabilities: suggestions.capabilities,
        improvements: suggestions.improvements
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        success: false,
        error: 'Failed to parse AI suggestions'
      };
    }
  } catch (error) {
    console.error('Error generating evolution suggestions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Apply evolution suggestions to create a new version of the agent
 *
 * @param agent The original agent
 * @param personalitySuggestions Suggested changes to personality
 * @param capabilitiesSuggestions Suggested changes to capabilities
 * @param options Evolution options
 * @returns The evolved agent
 */
function applyEvolutionSuggestions(
  agent: StoredAgent,
  personalitySuggestions: Record<string, any>,
  capabilitiesSuggestions: Record<string, any>,
  options: EvolutionOptions
): StoredAgent {
  // Create a deep copy of the agent
  const evolvedAgent = JSON.parse(JSON.stringify(agent)) as StoredAgent;

  // Apply personality changes
  if (personalitySuggestions && Object.keys(personalitySuggestions).length > 0) {
    if (options.preservePersonality !== false) {
      // Merge changes while preserving core personality
      evolvedAgent.personality = {
        ...evolvedAgent.personality,
        ...personalitySuggestions
      };
    } else {
      // Replace personality entirely
      evolvedAgent.personality = personalitySuggestions;
    }
  }

  // Apply capabilities changes
  if (capabilitiesSuggestions && Object.keys(capabilitiesSuggestions).length > 0) {
    evolvedAgent.capabilities = {
      ...evolvedAgent.capabilities,
      ...capabilitiesSuggestions
    };
  }

  // Increment the version number
  evolvedAgent.version = (evolvedAgent.version || 1) + 1;

  return evolvedAgent;
}

/**
 * Evolve an agent by merging traits from two parent agents
 *
 * @param parentAgentId1 The ID of the first parent agent
 * @param parentAgentId2 The ID of the second parent agent
 * @param options Evolution options
 * @returns The evolution result
 */
export async function evolveAgentByMerging(
  parentAgentId1: string,
  parentAgentId2: string,
  options: {
    name?: string;
    description?: string;
    archetype?: string;
    userId: string;
    isPublic?: boolean;
    dominantParent?: 'first' | 'second' | 'balanced';
  }
): Promise<EvolutionResult> {
  try {
    // Get the parent agents
    const parent1 = await getAgentById(parentAgentId1);
    const parent2 = await getAgentById(parentAgentId2);

    if (!parent1 || !parent2) {
      return {
        success: false,
        error: 'One or both parent agents not found'
      };
    }

    // Determine the dominant parent for trait inheritance
    const dominance = options.dominantParent || 'balanced';
    const dominanceRatio = dominance === 'first' ? 0.7 :
                           dominance === 'second' ? 0.3 : 0.5;

    // Merge personality traits
    const mergedPersonality = mergeTraits(
      parent1.personality,
      parent2.personality,
      dominanceRatio
    );

    // Merge capabilities
    const mergedCapabilities = mergeTraits(
      parent1.capabilities,
      parent2.capabilities,
      dominanceRatio
    );

    // Create the new agent
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Generate a name if not provided
    const name = options.name || `${parent1.name} × ${parent2.name}`;

    // Generate a description if not provided
    const description = options.description ||
      `Evolved agent created by merging ${parent1.name} and ${parent2.name}`;

    // Use provided archetype or inherit from dominant parent
    const archetype = options.archetype ||
      (dominance === 'first' ? parent1.archetype :
       dominance === 'second' ? parent2.archetype :
       (parent1.archetype === parent2.archetype ? parent1.archetype : 'Hybrid'));

    // Insert the new agent
    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert({
        user_id: options.userId,
        name,
        description,
        archetype,
        personality: mergedPersonality,
        capabilities: mergedCapabilities,
        is_public: options.isPublic || false,
        version: 1
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      newAgent: newAgent as StoredAgent,
      improvements: [
        `Created new agent by merging traits from ${parent1.name} and ${parent2.name}`,
        `Inherited ${Math.round(dominanceRatio * 100)}% traits from ${parent1.name} and ${Math.round((1 - dominanceRatio) * 100)}% from ${parent2.name}`
      ]
    };
  } catch (error) {
    console.error('Error merging agents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Merge traits from two objects with a given dominance ratio
 *
 * @param traits1 Traits from the first object
 * @param traits2 Traits from the second object
 * @param dominanceRatio Ratio of traits to inherit from the first object (0-1)
 * @returns Merged traits object
 */
function mergeTraits(
  traits1: Record<string, any>,
  traits2: Record<string, any>,
  dominanceRatio: number
): Record<string, any> {
  const result: Record<string, any> = {};

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(traits1),
    ...Object.keys(traits2)
  ]);

  // Process each key
  for (const key of allKeys) {
    // If the key exists in both objects
    if (key in traits1 && key in traits2) {
      const value1 = traits1[key];
      const value2 = traits2[key];

      // If both values are objects, recursively merge them
      if (
        typeof value1 === 'object' && value1 !== null && !Array.isArray(value1) &&
        typeof value2 === 'object' && value2 !== null && !Array.isArray(value2)
      ) {
        result[key] = mergeTraits(value1, value2, dominanceRatio);
      }
      // If both values are arrays, merge them with dominance
      else if (Array.isArray(value1) && Array.isArray(value2)) {
        // Take items from both arrays based on dominance ratio
        const numItemsFromFirst = Math.round(value1.length * dominanceRatio);
        const numItemsFromSecond = Math.round(value2.length * (1 - dominanceRatio));

        const itemsFromFirst = value1.slice(0, numItemsFromFirst);
        const itemsFromSecond = value2.slice(0, numItemsFromSecond);

        result[key] = [...itemsFromFirst, ...itemsFromSecond];
      }
      // If both values are numbers, calculate weighted average
      else if (typeof value1 === 'number' && typeof value2 === 'number') {
        result[key] = value1 * dominanceRatio + value2 * (1 - dominanceRatio);
      }
      // For other types, choose based on dominance ratio
      else {
        result[key] = Math.random() < dominanceRatio ? value1 : value2;
      }
    }
    // If the key exists only in the first object
    else if (key in traits1) {
      // Include with probability based on dominance ratio
      if (Math.random() < dominanceRatio) {
        result[key] = traits1[key];
      }
    }
    // If the key exists only in the second object
    else if (key in traits2) {
      // Include with probability based on inverse dominance ratio
      if (Math.random() < (1 - dominanceRatio)) {
        result[key] = traits2[key];
      }
    }
  }

  return result;
}

/**
 * Get the version history of an agent
 *
 * @param agentId The ID of the agent
 * @returns Array of agent versions
 */
export async function getAgentVersions(agentId: string): Promise<any[]> {
  return getAgentVersionHistory(agentId);
}

/**
 * Get the version history of an agent
 *
 * @param agentId The ID of the agent
 * @returns Array of agent versions
 */
export async function getAgentVersionHistory(agentId: string): Promise<any[]> {
  try {
    const supabase = createBrowserSupabaseClient();

    // Get all versions of the agent
    const { data, error } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('agent_id', agentId)
      .order('version', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting agent version history:', error);
    return [];
  }
}

/**
 * Revert an agent to a previous version
 *
 * @param agentId The ID of the agent
 * @param versionNumber The version number to revert to
 * @returns The evolution result
 */
export async function revertAgentToVersion(
  agentId: string,
  versionNumber: number
): Promise<EvolutionResult> {
  try {
    // Get the current agent
    const currentAgent = await getAgentById(agentId);
    if (!currentAgent) {
      return {
        success: false,
        error: 'Agent not found'
      };
    }

    // Get the specified version
    const supabase = createBrowserSupabaseClient();
    const { data: versionData, error: versionError } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('version', versionNumber)
      .single();

    if (versionError || !versionData) {
      return {
        success: false,
        error: `Version ${versionNumber} not found`
      };
    }

    // Update the agent with the version data
    const updatedAgent = await updateAgent(
      agentId,
      currentAgent.name,
      currentAgent.description || '',
      currentAgent.archetype || '',
      versionData.personality,
      versionData.capabilities,
      currentAgent.is_public
    );

    return {
      success: true,
      newAgent: updatedAgent,
      previousAgent: currentAgent,
      improvements: [`Reverted to version ${versionNumber}`]
    };
  } catch (error) {
    console.error('Error reverting agent to version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
