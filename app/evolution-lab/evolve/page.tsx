'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { getAllAgents, StoredAgent } from '@/app/lib/db/agentStorage';
import { getAllExperiments } from '@/app/lib/db/experiments';
import { evolveAgentFromExperiment, evolveAgentByMerging, EvolutionOptions } from '@/app/lib/services/agentEvolution';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';

export default function EvolvePage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  // State for agents and experiments
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // State for evolution method
  const [evolutionMethod, setEvolutionMethod] = useState<'experiment' | 'merge'>('experiment');

  // State for experiment-based evolution
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [evolutionOptions, setEvolutionOptions] = useState<EvolutionOptions>({
    evolutionStrength: 'moderate',
    preservePersonality: true,
    focusAreas: []
  });

  // State for merge-based evolution
  const [selectedParent1, setSelectedParent1] = useState<string | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<string | null>(null);
  const [mergeOptions, setMergeOptions] = useState({
    name: '',
    description: '',
    dominantParent: 'balanced' as 'first' | 'second' | 'balanced',
    isPublic: false
  });

  // State for evolution process
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState<any | null>(null);

  // Get the current user and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check for agent parameter in URL
        const searchParams = new URLSearchParams(window.location.search);
        const agentParam = searchParams.get('agent');

        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        if (user) {
          // Load agents
          const agentsData = await getAllAgents(user.id);
          setAgents(agentsData);

          if (agentsData.length > 0) {
            // If agent parameter is provided and exists in the user's agents, select it
            if (agentParam && agentsData.some(agent => agent.id === agentParam)) {
              setSelectedAgent(agentParam);
              setSelectedParent1(agentParam);

              // Select a different agent for parent 2
              const otherAgents = agentsData.filter(agent => agent.id !== agentParam);
              if (otherAgents.length > 0) {
                setSelectedParent2(otherAgents[0].id);
              }
            } else {
              // Otherwise, select the first agent
              setSelectedAgent(agentsData[0].id);
              setSelectedParent1(agentsData[0].id);
              if (agentsData.length > 1) {
                setSelectedParent2(agentsData[1].id);
              }
            }
          }

          // Load experiments
          const experimentsData = await getAllExperiments(user.id);
          setExperiments(experimentsData);

          if (experimentsData.length > 0) {
            setSelectedExperiment(experimentsData[0].id);
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/auth/login?redirectedFrom=/evolution-lab/evolve');
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [router]);

  // Handle evolution strength change
  const handleStrengthChange = (strength: 'subtle' | 'moderate' | 'aggressive') => {
    setEvolutionOptions({
      ...evolutionOptions,
      evolutionStrength: strength
    });
  };

  // Handle preserve personality change
  const handlePreservePersonalityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEvolutionOptions({
      ...evolutionOptions,
      preservePersonality: event.target.checked
    });
  };

  // Handle focus area change
  const handleFocusAreaChange = (area: string) => {
    const currentFocusAreas = evolutionOptions.focusAreas || [];

    if (currentFocusAreas.includes(area)) {
      setEvolutionOptions({
        ...evolutionOptions,
        focusAreas: currentFocusAreas.filter(a => a !== area)
      });
    } else {
      setEvolutionOptions({
        ...evolutionOptions,
        focusAreas: [...currentFocusAreas, area]
      });
    }
  };

  // Handle dominant parent change
  const handleDominantParentChange = (dominantParent: 'first' | 'second' | 'balanced') => {
    setMergeOptions({
      ...mergeOptions,
      dominantParent
    });
  };

  // Handle evolution from experiment
  const handleEvolveFromExperiment = async () => {
    if (!selectedAgent || !selectedExperiment || !userId) {
      setError('Please select an agent and an experiment');
      return;
    }

    setIsEvolving(true);
    setError(null);

    try {
      const result = await evolveAgentFromExperiment(
        selectedAgent,
        selectedExperiment,
        evolutionOptions
      );

      setEvolutionResult(result);

      if (result.success) {
        showNotification({
          id: 'evolution-success',
          title: 'Evolution Successful',
          message: `Agent ${result.newAgent?.name} has been evolved successfully`,
          type: 'success'
        });
      } else {
        setError(result.error || 'Evolution failed');
        showNotification({
          id: 'evolution-error',
          title: 'Evolution Failed',
          message: result.error || 'An error occurred during evolution',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error evolving agent:', error);
      setError('An unexpected error occurred');
      showNotification({
        id: 'evolution-error',
        title: 'Evolution Failed',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsEvolving(false);
    }
  };

  // Handle evolution by merging
  const handleEvolveByMerging = async () => {
    if (!selectedParent1 || !selectedParent2 || !userId) {
      setError('Please select two parent agents');
      return;
    }

    if (!mergeOptions.name) {
      setError('Please provide a name for the new agent');
      return;
    }

    setIsEvolving(true);
    setError(null);

    try {
      const result = await evolveAgentByMerging(
        selectedParent1,
        selectedParent2,
        {
          ...mergeOptions,
          userId
        }
      );

      setEvolutionResult(result);

      if (result.success) {
        showNotification({
          id: 'merge-success',
          title: 'Merge Successful',
          message: `Agent ${result.newAgent?.name} has been created successfully`,
          type: 'success'
        });
      } else {
        setError(result.error || 'Merge failed');
        showNotification({
          id: 'merge-error',
          title: 'Merge Failed',
          message: result.error || 'An error occurred during merging',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error merging agents:', error);
      setError('An unexpected error occurred');
      showNotification({
        id: 'merge-error',
        title: 'Merge Failed',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsEvolving(false);
    }
  };

  // Get agent by ID
  const getAgentById = (agentId: string) => {
    return agents.find(agent => agent.id === agentId);
  };

  // Get experiment by ID
  const getExperimentById = (experimentId: string) => {
    return experiments.find(experiment => experiment.id === experimentId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Evolution</h1>
          <p className="mt-2 text-lg text-gray-600">
            Evolve your agents based on experiment results or by merging traits
          </p>
        </div>
        <div>
          <Link href="/evolution-lab">
            <Button variant="outline">Back to Evolution Lab</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {evolutionResult && evolutionResult.success && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Evolution Successful</CardTitle>
            <CardDescription className="text-green-700">
              {evolutionMethod === 'experiment' ? 'Agent has been evolved based on experiment results' : 'New agent has been created by merging traits'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-green-800">Agent</h3>
                <p className="text-sm text-green-700">{evolutionResult.newAgent?.name}</p>
              </div>

              {evolutionResult.improvements && (
                <div>
                  <h3 className="text-sm font-medium text-green-800">Improvements</h3>
                  <ul className="list-disc list-inside text-sm text-green-700">
                    {evolutionResult.improvements.map((improvement: string, index: number) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2">
              <Link href={`/agent-forge/${evolutionResult.newAgent?.id}`}>
                <Button>View Agent</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setEvolutionResult(null)}
              >
                Continue Evolving
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Evolution Method</CardTitle>
          <CardDescription>
            Choose how you want to evolve your agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-md cursor-pointer ${
                evolutionMethod === 'experiment' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
              }`}
              onClick={() => setEvolutionMethod('experiment')}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={evolutionMethod === 'experiment'}
                  onChange={() => {}}
                  className="rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium">Evolve from Experiment</div>
                  <div className="text-xs text-gray-500">Improve an agent based on experiment results</div>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border rounded-md cursor-pointer ${
                evolutionMethod === 'merge' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
              }`}
              onClick={() => setEvolutionMethod('merge')}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={evolutionMethod === 'merge'}
                  onChange={() => {}}
                  className="rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium">Merge Agents</div>
                  <div className="text-xs text-gray-500">Create a new agent by combining traits from two parent agents</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {evolutionMethod === 'experiment' ? (
        <Card>
          <CardHeader>
            <CardTitle>Evolve from Experiment</CardTitle>
            <CardDescription>
              Select an agent and an experiment to evolve the agent based on the results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="agent" className="block text-sm font-medium text-gray-700">
                  Agent to Evolve
                </label>
                <select
                  id="agent"
                  value={selectedAgent || ''}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.archetype})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="experiment" className="block text-sm font-medium text-gray-700">
                  Experiment
                </label>
                <select
                  id="experiment"
                  value={selectedExperiment || ''}
                  onChange={(e) => setSelectedExperiment(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">Select an experiment</option>
                  {experiments.map((experiment) => (
                    <option key={experiment.id} value={experiment.id}>
                      {experiment.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Evolution Strength
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`p-3 border rounded-md cursor-pointer text-center ${
                      evolutionOptions.evolutionStrength === 'subtle' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleStrengthChange('subtle')}
                  >
                    <div className="font-medium">Subtle</div>
                    <div className="text-xs text-gray-500">Minor improvements</div>
                  </div>

                  <div
                    className={`p-3 border rounded-md cursor-pointer text-center ${
                      evolutionOptions.evolutionStrength === 'moderate' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleStrengthChange('moderate')}
                  >
                    <div className="font-medium">Moderate</div>
                    <div className="text-xs text-gray-500">Balanced changes</div>
                  </div>

                  <div
                    className={`p-3 border rounded-md cursor-pointer text-center ${
                      evolutionOptions.evolutionStrength === 'aggressive' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleStrengthChange('aggressive')}
                  >
                    <div className="font-medium">Aggressive</div>
                    <div className="text-xs text-gray-500">Major changes</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Focus Areas
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['accuracy', 'response_time', 'creativity', 'helpfulness', 'reasoning'].map((area) => (
                    <div
                      key={area}
                      className={`p-2 border rounded-md cursor-pointer ${
                        evolutionOptions.focusAreas?.includes(area) ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                      }`}
                      onClick={() => handleFocusAreaChange(area)}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={evolutionOptions.focusAreas?.includes(area) || false}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="capitalize">{area.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  If no areas are selected, the evolution will focus on all metrics that need improvement.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="preservePersonality"
                  checked={evolutionOptions.preservePersonality !== false}
                  onChange={handlePreservePersonalityChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="preservePersonality" className="text-sm font-medium text-gray-700">
                  Preserve core personality traits
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleEvolveFromExperiment}
              disabled={isEvolving || !selectedAgent || !selectedExperiment}
              className="w-full"
            >
              {isEvolving ? 'Evolving...' : 'Evolve Agent'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Merge Agents</CardTitle>
            <CardDescription>
              Create a new agent by combining traits from two parent agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="parent1" className="block text-sm font-medium text-gray-700">
                    First Parent Agent
                  </label>
                  <select
                    id="parent1"
                    value={selectedParent1 || ''}
                    onChange={(e) => setSelectedParent1(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.archetype})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="parent2" className="block text-sm font-medium text-gray-700">
                    Second Parent Agent
                  </label>
                  <select
                    id="parent2"
                    value={selectedParent2 || ''}
                    onChange={(e) => setSelectedParent2(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.archetype})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  New Agent Name
                </label>
                <input
                  id="name"
                  value={mergeOptions.name}
                  onChange={(e) => setMergeOptions({ ...mergeOptions, name: e.target.value })}
                  placeholder="Enter a name for the new agent"
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
                  value={mergeOptions.description}
                  onChange={(e) => setMergeOptions({ ...mergeOptions, description: e.target.value })}
                  placeholder="Describe the new agent"
                  className="w-full rounded-md border border-gray-300 p-2 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Trait Inheritance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`p-3 border rounded-md cursor-pointer text-center ${
                      mergeOptions.dominantParent === 'first' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleDominantParentChange('first')}
                  >
                    <div className="font-medium">First Dominant</div>
                    <div className="text-xs text-gray-500">70% from first parent</div>
                  </div>

                  <div
                    className={`p-3 border rounded-md cursor-pointer text-center ${
                      mergeOptions.dominantParent === 'balanced' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleDominantParentChange('balanced')}
                  >
                    <div className="font-medium">Balanced</div>
                    <div className="text-xs text-gray-500">50/50 split</div>
                  </div>

                  <div
                    className={`p-3 border rounded-md cursor-pointer text-center ${
                      mergeOptions.dominantParent === 'second' ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleDominantParentChange('second')}
                  >
                    <div className="font-medium">Second Dominant</div>
                    <div className="text-xs text-gray-500">70% from second parent</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={mergeOptions.isPublic}
                  onChange={(e) => setMergeOptions({ ...mergeOptions, isPublic: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                  Make this agent public
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleEvolveByMerging}
              disabled={isEvolving || !selectedParent1 || !selectedParent2 || !mergeOptions.name}
              className="w-full"
            >
              {isEvolving ? 'Creating...' : 'Create New Agent'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
