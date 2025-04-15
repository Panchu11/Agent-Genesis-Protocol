'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { ExperimentTemplate } from '@/app/components/evolution/ExperimentTemplates';

/**
 * Experiment Templates Service
 * 
 * This service provides functions for managing experiment templates.
 */

// Default experiment templates
const DEFAULT_TEMPLATES: ExperimentTemplate[] = [
  {
    id: 'general-performance',
    name: 'General Performance Evaluation',
    description: 'A comprehensive evaluation of agent performance across multiple dimensions.',
    category: 'General',
    difficulty: 'beginner',
    duration: 'medium',
    metrics: ['accuracy', 'response_time', 'helpfulness', 'creativity', 'reasoning'],
    tasks: [
      'Answer factual questions',
      'Solve logical problems',
      'Generate creative content',
      'Provide helpful responses',
      'Explain complex concepts'
    ],
    config: {
      numRuns: 5,
      evaluationMethod: 'automatic',
      includeHumanFeedback: false
    },
    icon: '📊'
  },
  {
    id: 'reasoning-focus',
    name: 'Reasoning & Problem Solving',
    description: 'Focus on logical reasoning and problem-solving capabilities.',
    category: 'Reasoning',
    difficulty: 'intermediate',
    duration: 'medium',
    metrics: ['reasoning', 'accuracy', 'problem_solving', 'step_by_step_thinking', 'error_detection'],
    tasks: [
      'Solve mathematical problems',
      'Complete logical puzzles',
      'Identify logical fallacies',
      'Perform multi-step reasoning',
      'Debug code or logical errors'
    ],
    config: {
      numRuns: 3,
      evaluationMethod: 'automatic',
      includeHumanFeedback: false,
      timeLimit: 120
    },
    icon: '🧩'
  },
  {
    id: 'creativity-evaluation',
    name: 'Creativity & Innovation',
    description: 'Evaluate the agent\'s creative capabilities and innovative thinking.',
    category: 'Creativity',
    difficulty: 'intermediate',
    duration: 'short',
    metrics: ['creativity', 'originality', 'flexibility', 'elaboration', 'novelty'],
    tasks: [
      'Generate story ideas',
      'Create metaphors and analogies',
      'Design solutions to open-ended problems',
      'Reimagine existing concepts',
      'Generate diverse alternatives'
    ],
    config: {
      numRuns: 3,
      evaluationMethod: 'human',
      includeHumanFeedback: true
    },
    icon: '🎨'
  },
  {
    id: 'knowledge-retrieval',
    name: 'Knowledge Retrieval & Accuracy',
    description: 'Test the agent\'s ability to retrieve and apply knowledge accurately.',
    category: 'Knowledge',
    difficulty: 'beginner',
    duration: 'short',
    metrics: ['accuracy', 'recall', 'precision', 'factuality', 'comprehensiveness'],
    tasks: [
      'Answer factual questions',
      'Recall specific information',
      'Summarize complex topics',
      'Explain concepts accurately',
      'Identify misinformation'
    ],
    config: {
      numRuns: 5,
      evaluationMethod: 'automatic',
      includeHumanFeedback: false,
      knowledgeCutoff: '2023-01-01'
    },
    icon: '📚'
  },
  {
    id: 'ethical-reasoning',
    name: 'Ethical Reasoning & Safety',
    description: 'Evaluate the agent\'s ethical reasoning and safety guardrails.',
    category: 'Ethics',
    difficulty: 'advanced',
    duration: 'medium',
    metrics: ['ethical_reasoning', 'safety', 'bias_mitigation', 'harm_avoidance', 'value_alignment'],
    tasks: [
      'Respond to ethical dilemmas',
      'Identify potential harms',
      'Navigate sensitive topics',
      'Demonstrate value alignment',
      'Refuse harmful requests'
    ],
    config: {
      numRuns: 3,
      evaluationMethod: 'human',
      includeHumanFeedback: true,
      sensitiveContent: true
    },
    icon: '⚖️'
  },
  {
    id: 'conversation-skills',
    name: 'Conversational Skills',
    description: 'Test the agent\'s ability to maintain engaging and coherent conversations.',
    category: 'Communication',
    difficulty: 'intermediate',
    duration: 'medium',
    metrics: ['coherence', 'engagement', 'context_awareness', 'natural_flow', 'personalization'],
    tasks: [
      'Maintain multi-turn conversations',
      'Stay on topic',
      'Remember context from earlier turns',
      'Adapt tone to the conversation',
      'Handle conversation shifts'
    ],
    config: {
      numRuns: 3,
      evaluationMethod: 'human',
      includeHumanFeedback: true,
      conversationTurns: 10
    },
    icon: '💬'
  },
  {
    id: 'instruction-following',
    name: 'Instruction Following',
    description: 'Evaluate how well the agent follows specific instructions and constraints.',
    category: 'Compliance',
    difficulty: 'beginner',
    duration: 'short',
    metrics: ['instruction_adherence', 'constraint_satisfaction', 'precision', 'completeness', 'efficiency'],
    tasks: [
      'Follow multi-step instructions',
      'Adhere to format constraints',
      'Complete tasks within limitations',
      'Follow conflicting instructions appropriately',
      'Clarify ambiguous instructions'
    ],
    config: {
      numRuns: 5,
      evaluationMethod: 'automatic',
      includeHumanFeedback: false
    },
    icon: '📝'
  },
  {
    id: 'robustness-testing',
    name: 'Robustness & Edge Cases',
    description: 'Test the agent\'s performance under challenging and unusual conditions.',
    category: 'Robustness',
    difficulty: 'advanced',
    duration: 'long',
    metrics: ['error_handling', 'ambiguity_resolution', 'adversarial_robustness', 'consistency', 'graceful_failure'],
    tasks: [
      'Handle malformed inputs',
      'Respond to ambiguous queries',
      'Maintain performance with adversarial inputs',
      'Recover from errors',
      'Handle extreme edge cases'
    ],
    config: {
      numRuns: 7,
      evaluationMethod: 'automatic',
      includeHumanFeedback: false,
      includeAdversarialTests: true
    },
    icon: '🛡️'
  },
  {
    id: 'specialized-domain',
    name: 'Specialized Domain Knowledge',
    description: 'Evaluate the agent\'s expertise in specific domains.',
    category: 'Domain Expertise',
    difficulty: 'advanced',
    duration: 'medium',
    metrics: ['domain_accuracy', 'technical_precision', 'depth_of_knowledge', 'application', 'terminology_usage'],
    tasks: [
      'Answer domain-specific questions',
      'Apply specialized knowledge',
      'Use domain terminology correctly',
      'Explain complex domain concepts',
      'Solve domain-specific problems'
    ],
    config: {
      numRuns: 3,
      evaluationMethod: 'expert',
      includeHumanFeedback: true,
      domains: ['science', 'technology', 'finance', 'medicine', 'law']
    },
    icon: '🔬'
  },
  {
    id: 'multimodal-reasoning',
    name: 'Multimodal Reasoning',
    description: 'Test the agent\'s ability to reason across different types of information.',
    category: 'Multimodal',
    difficulty: 'advanced',
    duration: 'long',
    metrics: ['cross_modal_integration', 'visual_reasoning', 'textual_reasoning', 'multimodal_coherence', 'information_synthesis'],
    tasks: [
      'Reason about visual and textual information',
      'Integrate information across modalities',
      'Generate multimodal content',
      'Answer questions requiring multiple modalities',
      'Synthesize information from diverse sources'
    ],
    config: {
      numRuns: 3,
      evaluationMethod: 'human',
      includeHumanFeedback: true,
      modalities: ['text', 'image', 'structured_data']
    },
    icon: '🔀'
  }
];

/**
 * Get all experiment templates
 * 
 * @returns Array of experiment templates
 */
export async function getExperimentTemplates(): Promise<ExperimentTemplate[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get templates from the database
    const { data, error } = await supabase
      .from('experiment_templates')
      .select('*');
    
    if (error) {
      console.error('Error fetching experiment templates:', error);
      // Fall back to default templates
      return DEFAULT_TEMPLATES;
    }
    
    // If no templates in the database, return default templates
    if (!data || data.length === 0) {
      return DEFAULT_TEMPLATES;
    }
    
    return data as ExperimentTemplate[];
  } catch (error) {
    console.error('Error in getExperimentTemplates:', error);
    // Fall back to default templates
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Get an experiment template by ID
 * 
 * @param templateId The ID of the template
 * @returns The template or null if not found
 */
export async function getExperimentTemplateById(templateId: string): Promise<ExperimentTemplate | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get template from the database
    const { data, error } = await supabase
      .from('experiment_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error) {
      console.error('Error fetching experiment template:', error);
      
      // Check if the template exists in default templates
      const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
      return defaultTemplate || null;
    }
    
    return data as ExperimentTemplate;
  } catch (error) {
    console.error('Error in getExperimentTemplateById:', error);
    
    // Check if the template exists in default templates
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    return defaultTemplate || null;
  }
}

/**
 * Create a new experiment template
 * 
 * @param template The template data
 * @returns The created template
 */
export async function createExperimentTemplate(template: Omit<ExperimentTemplate, 'id'>): Promise<ExperimentTemplate> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Generate a unique ID
    const id = `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Insert the template
    const { data, error } = await supabase
      .from('experiment_templates')
      .insert({
        id,
        ...template
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating experiment template:', error);
      throw new Error('Failed to create experiment template');
    }
    
    return data as ExperimentTemplate;
  } catch (error) {
    console.error('Error in createExperimentTemplate:', error);
    throw error;
  }
}

/**
 * Update an experiment template
 * 
 * @param templateId The ID of the template
 * @param template The template data to update
 * @returns The updated template
 */
export async function updateExperimentTemplate(
  templateId: string,
  template: Partial<Omit<ExperimentTemplate, 'id'>>
): Promise<ExperimentTemplate> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the template
    const { data, error } = await supabase
      .from('experiment_templates')
      .update(template)
      .eq('id', templateId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating experiment template:', error);
      throw new Error('Failed to update experiment template');
    }
    
    return data as ExperimentTemplate;
  } catch (error) {
    console.error('Error in updateExperimentTemplate:', error);
    throw error;
  }
}

/**
 * Delete an experiment template
 * 
 * @param templateId The ID of the template
 * @returns Whether the template was deleted successfully
 */
export async function deleteExperimentTemplate(templateId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Delete the template
    const { error } = await supabase
      .from('experiment_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      console.error('Error deleting experiment template:', error);
      throw new Error('Failed to delete experiment template');
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteExperimentTemplate:', error);
    throw error;
  }
}

/**
 * Initialize default experiment templates in the database
 * 
 * @returns Whether the templates were initialized successfully
 */
export async function initializeDefaultTemplates(): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Check if templates already exist
    const { data, error } = await supabase
      .from('experiment_templates')
      .select('id');
    
    if (error) {
      console.error('Error checking experiment templates:', error);
      return false;
    }
    
    // If templates already exist, don't initialize
    if (data && data.length > 0) {
      return true;
    }
    
    // Insert default templates
    const { error: insertError } = await supabase
      .from('experiment_templates')
      .insert(DEFAULT_TEMPLATES);
    
    if (insertError) {
      console.error('Error initializing default templates:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in initializeDefaultTemplates:', error);
    return false;
  }
}
