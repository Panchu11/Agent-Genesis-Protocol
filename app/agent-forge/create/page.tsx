'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { createAgent, AgentPersonality, AgentCapability } from '@/app/lib/db/agentStorage';
import { generateChatResponse } from '@/app/lib/api/fireworks';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

// Predefined archetypes
const archetypes = [
  { id: 'assistant', name: 'Assistant', description: 'Helpful, informative, and supportive' },
  { id: 'expert', name: 'Expert', description: 'Authoritative, knowledgeable, and precise' },
  { id: 'creative', name: 'Creative', description: 'Imaginative, artistic, and innovative' },
  { id: 'analyst', name: 'Analyst', description: 'Logical, methodical, and detail-oriented' },
  { id: 'coach', name: 'Coach', description: 'Motivational, encouraging, and guiding' },
  { id: 'custom', name: 'Custom', description: 'Define your own archetype' },
];

// Predefined capabilities
const availableCapabilities = [
  { id: 'web_search', name: 'Web Search', description: 'Search the web for information' },
  { id: 'code_generation', name: 'Code Generation', description: 'Generate and explain code' },
  { id: 'data_analysis', name: 'Data Analysis', description: 'Analyze and visualize data' },
  { id: 'content_creation', name: 'Content Creation', description: 'Create various types of content' },
  { id: 'knowledge_base', name: 'Knowledge Base', description: 'Access to knowledge gardens' },
  { id: 'social_interaction', name: 'Social Interaction', description: 'Interact with other agents' },
];

export default function CreateAgentPage() {
  const router = useRouter();
  
  // Basic information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // Personality
  const [selectedArchetype, setSelectedArchetype] = useState('assistant');
  const [customArchetype, setCustomArchetype] = useState('');
  const [traits, setTraits] = useState<string[]>(['helpful', 'friendly', 'professional']);
  const [traitInput, setTraitInput] = useState('');
  const [values, setValues] = useState<string[]>(['accuracy', 'clarity', 'efficiency']);
  const [valueInput, setValueInput] = useState('');
  const [tone, setTone] = useState('friendly');
  const [personalityDescription, setPersonalityDescription] = useState('');
  
  // Capabilities
  const [capabilities, setCapabilities] = useState<AgentCapability[]>(
    availableCapabilities.map(cap => ({ ...cap, enabled: false }))
  );
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  
  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirectedFrom=/agent-forge/create');
      }
    };
    
    getUser();
  }, [router]);
  
  // Handle trait input
  const handleAddTrait = () => {
    if (traitInput.trim() && !traits.includes(traitInput.trim())) {
      setTraits([...traits, traitInput.trim()]);
      setTraitInput('');
    }
  };
  
  const handleRemoveTrait = (trait: string) => {
    setTraits(traits.filter(t => t !== trait));
  };
  
  // Handle value input
  const handleAddValue = () => {
    if (valueInput.trim() && !values.includes(valueInput.trim())) {
      setValues([...values, valueInput.trim()]);
      setValueInput('');
    }
  };
  
  const handleRemoveValue = (value: string) => {
    setValues(values.filter(v => v !== value));
  };
  
  // Handle capability toggle
  const handleToggleCapability = (id: string) => {
    setCapabilities(capabilities.map(cap => 
      cap.id === id ? { ...cap, enabled: !cap.enabled } : cap
    ));
  };
  
  // Validate agent with AI
  const handleValidateAgent = async () => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const personality = buildPersonality();
      
      const prompt = `
        I'm creating an AI agent with the following details:
        
        Name: ${name}
        Description: ${description}
        Archetype: ${personality.archetype}
        Traits: ${personality.traits.join(', ')}
        Values: ${personality.values.join(', ')}
        Tone: ${personality.tone}
        Personality Description: ${personality.description}
        
        Capabilities: ${capabilities.filter(c => c.enabled).map(c => c.name).join(', ')}
        
        Please analyze this agent configuration and provide feedback on:
        1. Coherence - Do the traits, values, and tone align with the archetype?
        2. Completeness - Is any important information missing?
        3. Potential issues - Are there any potential problems with this configuration?
        4. Suggestions - How could this agent be improved?
        
        Format your response as a concise evaluation followed by specific recommendations.
      `;
      
      const response = await generateChatResponse([
        { role: 'system', content: 'You are an expert AI agent designer. Your task is to evaluate agent configurations and provide helpful feedback.' },
        { role: 'user', content: prompt }
      ]);
      
      setValidationResult(response);
    } catch (error) {
      console.error('Error validating agent:', error);
      setValidationResult('Failed to validate agent. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Build personality object
  const buildPersonality = (): AgentPersonality => {
    const archetype = selectedArchetype === 'custom' ? customArchetype : 
      archetypes.find(a => a.id === selectedArchetype)?.name || '';
    
    return {
      archetype,
      traits,
      values,
      tone,
      description: personalityDescription
    };
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in to create an agent');
      return;
    }
    
    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const personality = buildPersonality();
      const enabledCapabilities = capabilities.filter(cap => cap.enabled);
      
      const agent = await createAgent(
        name,
        description,
        personality,
        enabledCapabilities,
        userId,
        isPublic
      );
      
      if (agent) {
        router.push(`/agent-forge/${agent.id}`);
      } else {
        setError('Failed to create agent');
      }
    } catch (err) {
      console.error('Error creating agent:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Agent Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Research Assistant, Creative Writer"
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this agent's purpose?"
                className="w-full rounded-md border border-gray-300 p-2 min-h-[100px]"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Make this agent public
              </label>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Archetype
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {archetypes.map((archetype) => (
                  <div
                    key={archetype.id}
                    onClick={() => setSelectedArchetype(archetype.id)}
                    className={`p-3 border rounded-md cursor-pointer ${
                      selectedArchetype === archetype.id ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{archetype.name}</div>
                    <div className="text-xs text-gray-500">{archetype.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedArchetype === 'custom' && (
              <div className="space-y-2">
                <label htmlFor="customArchetype" className="block text-sm font-medium text-gray-700">
                  Custom Archetype
                </label>
                <input
                  id="customArchetype"
                  value={customArchetype}
                  onChange={(e) => setCustomArchetype(e.target.value)}
                  placeholder="e.g., Philosopher, Storyteller"
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Personality Traits
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {traits.map((trait) => (
                  <div
                    key={trait}
                    className="bg-gray-100 px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    <span>{trait}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrait(trait)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  value={traitInput}
                  onChange={(e) => setTraitInput(e.target.value)}
                  placeholder="Add a trait"
                  className="flex-1 rounded-l-md border border-gray-300 p-2"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTrait())}
                />
                <button
                  type="button"
                  onClick={handleAddTrait}
                  className="bg-gray-200 px-3 rounded-r-md border-t border-r border-b border-gray-300"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Values
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {values.map((value) => (
                  <div
                    key={value}
                    className="bg-gray-100 px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    <span>{value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(value)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder="Add a value"
                  className="flex-1 rounded-l-md border border-gray-300 p-2"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddValue())}
                />
                <button
                  type="button"
                  onClick={handleAddValue}
                  className="bg-gray-200 px-3 rounded-r-md border-t border-r border-b border-gray-300"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                Communication Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="technical">Technical</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="empathetic">Empathetic</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="personalityDescription" className="block text-sm font-medium text-gray-700">
                Personality Description
              </label>
              <textarea
                id="personalityDescription"
                value={personalityDescription}
                onChange={(e) => setPersonalityDescription(e.target.value)}
                placeholder="Describe the agent's personality in more detail..."
                className="w-full rounded-md border border-gray-300 p-2 min-h-[100px]"
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Agent Capabilities
              </label>
              <p className="text-sm text-gray-500">
                Select the capabilities you want to enable for this agent.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {capabilities.map((capability) => (
                  <div
                    key={capability.id}
                    onClick={() => handleToggleCapability(capability.id)}
                    className={`p-3 border rounded-md cursor-pointer flex items-center space-x-3 ${
                      capability.enabled ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={capability.enabled}
                      onChange={() => {}} // Handled by the div onClick
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-medium">{capability.name}</div>
                      <div className="text-xs text-gray-500">{capability.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Agent Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-900">{name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Visibility</p>
                    <p className="text-sm text-gray-900">{isPublic ? 'Public' : 'Private'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Archetype</p>
                    <p className="text-sm text-gray-900">
                      {selectedArchetype === 'custom' ? customArchetype : 
                        archetypes.find(a => a.id === selectedArchetype)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tone</p>
                    <p className="text-sm text-gray-900 capitalize">{tone}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-sm text-gray-900">{description || 'No description provided'}</p>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Traits</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.map((trait) => (
                      <span key={trait} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Values</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {values.map((value) => (
                      <span key={value} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Capabilities</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {capabilities.filter(c => c.enabled).map((capability) => (
                      <span key={capability.id} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                        {capability.name}
                      </span>
                    ))}
                    {capabilities.filter(c => c.enabled).length === 0 && (
                      <span className="text-sm text-gray-500">No capabilities enabled</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">AI Validation</h3>
                <Button 
                  variant="outline" 
                  onClick={handleValidateAgent}
                  disabled={isValidating}
                >
                  {isValidating ? 'Validating...' : 'Validate with AI'}
                </Button>
              </div>
              
              {validationResult ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Validation Result</h4>
                  <div className="text-sm whitespace-pre-wrap">{validationResult}</div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <p className="text-sm text-gray-500">
                    Click "Validate with AI" to get feedback on your agent configuration.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create a New Agent</h1>
        <p className="mt-2 text-lg text-gray-600">
          Design your autonomous agent with a unique personality and capabilities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Step {currentStep} of 4: {
                  currentStep === 1 ? 'Basic Information' :
                  currentStep === 2 ? 'Personality' :
                  currentStep === 3 ? 'Capabilities' :
                  'Review & Create'
                }
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    currentStep === step ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            
            {renderStepContent()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/agent-forge')}
            >
              {currentStep > 1 ? 'Back' : 'Cancel'}
            </Button>
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && !name.trim()}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Agent'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
