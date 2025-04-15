'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { createExperiment, ExperimentConfiguration } from '@/app/lib/db/experiments';
import { getAllAgents, StoredAgent } from '@/app/lib/db/agentStorage';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

// Predefined experiment types
const experimentTypes = [
  { id: 'performance', name: 'Performance Testing', description: 'Test agent performance across various metrics' },
  { id: 'comparison', name: 'Agent Comparison', description: 'Compare multiple agents on the same tasks' },
  { id: 'evolution', name: 'Evolution Tracking', description: 'Track agent improvement over time' },
  { id: 'custom', name: 'Custom Experiment', description: 'Design your own experiment parameters' },
];

// Available metrics
const availableMetrics = [
  { id: 'accuracy', name: 'Accuracy', description: 'Correctness of responses' },
  { id: 'response_time', name: 'Response Time', description: 'Time taken to generate responses' },
  { id: 'creativity', name: 'Creativity', description: 'Originality and innovation in responses' },
  { id: 'helpfulness', name: 'Helpfulness', description: 'Usefulness of responses to users' },
  { id: 'reasoning', name: 'Reasoning', description: 'Logical thinking and problem-solving ability' },
];

export default function CreateExperimentPage() {
  const router = useRouter();
  
  // Basic information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // Experiment configuration
  const [selectedType, setSelectedType] = useState('performance');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['accuracy', 'response_time']);
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [parameters, setParameters] = useState<Record<string, any>>({
    taskCount: 5,
    promptComplexity: 'medium',
    evaluationMethod: 'automatic',
  });
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get the current user and load agents
  useEffect(() => {
    const initialize = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (user) {
        // Load agents
        try {
          const agentsData = await getAllAgents(user.id);
          setAgents(agentsData);
        } catch (error) {
          console.error('Error loading agents:', error);
          setError('Failed to load agents');
        } finally {
          setIsLoading(false);
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirectedFrom=/evolution-lab/create');
      }
    };
    
    initialize();
  }, [router]);
  
  // Handle metric selection
  const toggleMetricSelection = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter(id => id !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };
  
  // Handle agent selection
  const toggleAgentSelection = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };
  
  // Handle parameter change
  const handleParameterChange = (key: string, value: any) => {
    setParameters({
      ...parameters,
      [key]: value,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in to create an experiment');
      return;
    }
    
    if (!name.trim()) {
      setError('Experiment name is required');
      return;
    }
    
    if (selectedAgents.length === 0) {
      setError('Please select at least one agent');
      return;
    }
    
    if (selectedMetrics.length === 0) {
      setError('Please select at least one metric');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      const configuration: ExperimentConfiguration = {
        type: selectedType,
        metrics: selectedMetrics,
        agents: selectedAgents,
        parameters,
      };
      
      const experiment = await createExperiment(
        name,
        description,
        configuration,
        userId,
        isPublic
      );
      
      if (experiment) {
        router.push(`/evolution-lab/${experiment.id}`);
      } else {
        setError('Failed to create experiment');
      }
    } catch (err) {
      console.error('Error creating experiment:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
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
                Experiment Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Performance Benchmark, Agent Comparison"
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
                placeholder="What is the purpose of this experiment?"
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
                Make this experiment public
              </label>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Experiment Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {experimentTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 border rounded-md cursor-pointer ${
                      selectedType === type.id ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Metrics to Measure
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    onClick={() => toggleMetricSelection(metric.id)}
                    className={`p-3 border rounded-md cursor-pointer ${
                      selectedMetrics.includes(metric.id) ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric.id)}
                        onChange={() => {}} // Handled by the div onClick
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-xs text-gray-500">{metric.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Agents
              </label>
              {agents.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-yellow-700">
                    You don't have any agents yet. <Link href="/agent-forge/create" className="text-indigo-600 hover:underline">Create an agent</Link> first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => toggleAgentSelection(agent.id)}
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedAgents.includes(agent.id) ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => {}} // Handled by the div onClick
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-gray-500">{agent.archetype}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Experiment Parameters
              </label>
              <div className="space-y-4">
                <div>
                  <label htmlFor="taskCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Tasks
                  </label>
                  <select
                    id="taskCount"
                    value={parameters.taskCount}
                    onChange={(e) => handleParameterChange('taskCount', parseInt(e.target.value))}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value={3}>3 tasks (Quick)</option>
                    <option value={5}>5 tasks (Standard)</option>
                    <option value={10}>10 tasks (Thorough)</option>
                    <option value={20}>20 tasks (Comprehensive)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="promptComplexity" className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt Complexity
                  </label>
                  <select
                    id="promptComplexity"
                    value={parameters.promptComplexity}
                    onChange={(e) => handleParameterChange('promptComplexity', e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="simple">Simple</option>
                    <option value="medium">Medium</option>
                    <option value="complex">Complex</option>
                    <option value="mixed">Mixed Complexity</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="evaluationMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Evaluation Method
                  </label>
                  <select
                    id="evaluationMethod"
                    value={parameters.evaluationMethod}
                    onChange={(e) => handleParameterChange('evaluationMethod', e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="automatic">Automatic (AI-based)</option>
                    <option value="manual">Manual (User Review)</option>
                    <option value="hybrid">Hybrid (AI + User)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Experiment Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-900">{name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="text-sm text-gray-900">
                      {experimentTypes.find(t => t.id === selectedType)?.name || selectedType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Metrics</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMetrics.map((metricId) => (
                        <span key={metricId} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs capitalize">
                          {availableMetrics.find(m => m.id === metricId)?.name || metricId}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Agents</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgents.map((agentId) => {
                        const agent = agents.find(a => a.id === agentId);
                        return (
                          <span key={agentId} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                            {agent?.name || 'Unknown Agent'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Parameters</p>
                  <div className="mt-1 text-sm">
                    <p><span className="font-medium">Tasks:</span> {parameters.taskCount}</p>
                    <p><span className="font-medium">Complexity:</span> {parameters.promptComplexity}</p>
                    <p><span className="font-medium">Evaluation:</span> {parameters.evaluationMethod}</p>
                  </div>
                </div>
              </div>
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
        <h1 className="text-3xl font-bold tracking-tight">Create Experiment</h1>
        <p className="mt-2 text-lg text-gray-600">
          Design an experiment to test and improve your agents
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Experiment Configuration</CardTitle>
              <CardDescription>
                Step {currentStep} of 4: {
                  currentStep === 1 ? 'Basic Information' :
                  currentStep === 2 ? 'Experiment Type & Metrics' :
                  currentStep === 3 ? 'Select Agents' :
                  'Parameters & Review'
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
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/evolution-lab')}
            >
              {currentStep > 1 ? 'Back' : 'Cancel'}
            </Button>
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !name.trim()) ||
                  (currentStep === 2 && selectedMetrics.length === 0) ||
                  (currentStep === 3 && selectedAgents.length === 0)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isCreating || selectedAgents.length === 0 || !name.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Experiment'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
