'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { 
  getExperimentById, 
  getExperimentRuns,
  createExperimentRun,
  updateExperiment,
  deleteExperiment,
  Experiment,
  ExperimentRun
} from '@/app/lib/db/experiments';
import { getAgentById } from '@/app/lib/db/agentStorage';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

export default function ExperimentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const experimentId = params.id as string;
  
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [agents, setAgents] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingRun, setIsStartingRun] = useState(false);

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    getUser();
  }, []);

  // Load experiment data
  useEffect(() => {
    const loadExperimentData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get experiment details
        const experimentData = await getExperimentById(experimentId);
        
        if (!experimentData) {
          setError('Experiment not found');
          setIsLoading(false);
          return;
        }
        
        setExperiment(experimentData);
        setName(experimentData.name);
        setDescription(experimentData.description || '');
        setIsPublic(experimentData.is_public);
        
        // Get experiment runs
        const runsData = await getExperimentRuns(experimentId);
        setRuns(runsData);
        
        // Get agent details for each agent in the experiment
        const agentDetails: Record<string, any> = {};
        
        for (const agentId of experimentData.configuration.agents) {
          const agent = await getAgentById(agentId);
          if (agent) {
            agentDetails[agentId] = agent;
          }
        }
        
        setAgents(agentDetails);
      } catch (err) {
        console.error('Error loading experiment data:', err);
        setError('Failed to load experiment');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExperimentData();
  }, [experimentId]);

  // Handle experiment update
  const handleUpdateExperiment = async () => {
    if (!experiment || !userId) return;
    
    setIsSaving(true);
    
    try {
      const updatedExperiment = await updateExperiment(experimentId, {
        name,
        description,
        is_public: isPublic
      });
      
      if (updatedExperiment) {
        setExperiment(updatedExperiment);
        setIsEditing(false);
      } else {
        setError('Failed to update experiment');
      }
    } catch (err) {
      console.error('Error updating experiment:', err);
      setError('An error occurred while updating the experiment');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle experiment deletion
  const handleDeleteExperiment = async () => {
    if (!experiment || !userId) return;
    
    if (!confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const success = await deleteExperiment(experimentId);
      
      if (success) {
        router.push('/evolution-lab');
      } else {
        setError('Failed to delete experiment');
      }
    } catch (err) {
      console.error('Error deleting experiment:', err);
      setError('An error occurred while deleting the experiment');
    } finally {
      setIsDeleting(false);
    }
  };

  // Start a new experiment run
  const handleStartRun = async (agentId: string) => {
    if (!experiment || !userId) return;
    
    setIsStartingRun(true);
    
    try {
      const newRun = await createExperimentRun(experimentId, agentId);
      
      if (newRun) {
        // Add the new run to the runs list
        setRuns([newRun, ...runs]);
        
        // Simulate run progress (in a real app, this would be handled by a backend process)
        simulateRunProgress(newRun.id);
      } else {
        setError('Failed to start experiment run');
      }
    } catch (err) {
      console.error('Error starting experiment run:', err);
      setError('An error occurred while starting the run');
    } finally {
      setIsStartingRun(false);
    }
  };

  // Simulate run progress (for demo purposes)
  const simulateRunProgress = (runId: string) => {
    // Update run status to 'running'
    setRuns(prevRuns => 
      prevRuns.map(run => 
        run.id === runId ? { ...run, status: 'running', started_at: new Date().toISOString() } : run
      )
    );
    
    // After a delay, update to 'completed'
    setTimeout(() => {
      setRuns(prevRuns => 
        prevRuns.map(run => {
          if (run.id === runId) {
            return { 
              ...run, 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              results: {
                metrics: {
                  accuracy: Math.random() * 100,
                  response_time: Math.random() * 2000 + 500,
                  creativity: Math.random() * 100,
                  helpfulness: Math.random() * 100,
                  reasoning: Math.random() * 100,
                },
                tasks_completed: experiment?.configuration.parameters.taskCount || 5,
                success_rate: Math.random() * 100,
              }
            };
          }
          return run;
        })
      );
    }, 5000);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600';
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading experiment...</p>
        </div>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          <p>{error || 'Experiment not found'}</p>
        </div>
        <Link href="/evolution-lab">
          <Button>Back to Evolution Lab</Button>
        </Link>
      </div>
    );
  }

  const isOwner = userId === experiment.user_id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{experiment.name}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {experiment.description || 'No description provided'}
          </p>
          <div className="flex items-center mt-2 space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${experiment.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {experiment.is_public ? 'Public' : 'Private'}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full bg-blue-100 ${getStatusColor(experiment.status)}`}>
              {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href="/evolution-lab">
            <Button variant="outline">Back to Evolution Lab</Button>
          </Link>
          {isOwner && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Experiment</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Experiment</CardTitle>
            <CardDescription>
              Update your experiment's basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Experiment Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteExperiment}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Experiment'}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setName(experiment.name);
                  setDescription(experiment.description || '');
                  setIsPublic(experiment.is_public);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateExperiment}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Experiment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Created</h3>
                    <p className="text-sm text-gray-900">{formatDate(experiment.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Last Updated</h3>
                    <p className="text-sm text-gray-900">{formatDate(experiment.updated_at)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Type</h3>
                    <p className="text-sm text-gray-900 capitalize">{experiment.configuration.type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Metrics</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {experiment.configuration.metrics.map((metric) => (
                        <span key={metric} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs capitalize">
                          {metric.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Agents</CardTitle>
                  <CardDescription>
                    Agents included in this experiment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {experiment.configuration.agents.map((agentId) => {
                      const agent = agents[agentId];
                      
                      return (
                        <div key={agentId} className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <div className="font-medium">{agent?.name || 'Unknown Agent'}</div>
                            <div className="text-xs text-gray-500">{agent?.archetype || 'Unknown Type'}</div>
                          </div>
                          {isOwner && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStartRun(agentId)}
                              disabled={isStartingRun}
                            >
                              Run Test
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Experiment Runs</CardTitle>
                  <CardDescription>
                    History of runs for this experiment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {runs.length === 0 ? (
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <p className="text-gray-500">
                        No runs yet. Start a test run with one of your agents.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {runs.map((run) => {
                        const agent = agents[run.agent_id];
                        
                        return (
                          <div key={run.id} className="border rounded-md overflow-hidden">
                            <div className="flex justify-between items-center p-4 bg-gray-50">
                              <div>
                                <div className="font-medium">{agent?.name || 'Unknown Agent'}</div>
                                <div className="text-xs text-gray-500">
                                  Started: {run.started_at ? formatDate(run.started_at) : 'Not started'}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className={`px-2 py-1 text-xs rounded-full mr-3 ${
                                  run.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                  run.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                </span>
                                <Link href={`/evolution-lab/${experimentId}/runs/${run.id}`}>
                                  <Button size="sm" variant="outline">View Details</Button>
                                </Link>
                              </div>
                            </div>
                            
                            {run.status === 'completed' && run.results && (
                              <div className="p-4 border-t">
                                <h4 className="text-sm font-medium mb-2">Results Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {Object.entries(run.results.metrics || {}).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 p-2 rounded-md">
                                      <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                                      <div className="text-sm font-medium">
                                        {typeof value === 'number' ? value.toFixed(2) : value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Experiment Configuration</CardTitle>
                  <CardDescription>
                    Parameters and settings for this experiment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Parameters</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(experiment.configuration.parameters).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="text-sm text-gray-900 capitalize">{value.toString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Metrics Tracked</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex flex-wrap gap-2">
                          {experiment.configuration.metrics.map((metric) => (
                            <div key={metric} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm capitalize">
                              {metric.replace('_', ' ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
