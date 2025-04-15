'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Badge } from '@/app/components/common/Badge';
import { useNotification } from '@/app/context/NotificationContext';
import LazyEnhancedMetricsChart from '@/app/components/evolution/LazyEnhancedMetricsChart';
import AgentComparisonChart from '@/app/components/evolution/AgentComparisonChart';
import { Experiment, ExperimentRun, getExperimentById, getExperimentRuns, startExperiment, completeExperiment, failExperiment } from '@/app/lib/services/experimentService';
import { StoredAgent, getAgentById } from '@/app/lib/db/agentStorage';

export default function ExperimentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const experimentId = params.id as string;
  
  // State for experiment data
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [agents, setAgents] = useState<Record<string, StoredAgent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for actions
  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'runs'>('overview');
  
  // Load experiment data
  useEffect(() => {
    const loadExperimentData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push(`/auth/login?redirectedFrom=/evolution-lab/experiments/${experimentId}`);
          return;
        }
        
        // Get experiment
        const experimentData = await getExperimentById(experimentId);
        
        if (!experimentData) {
          setError('Experiment not found');
          return;
        }
        
        setExperiment(experimentData);
        
        // Check if experiment is running
        if (experimentData.status === 'running') {
          setIsRunning(true);
        }
        
        // Get experiment runs
        const runsData = await getExperimentRuns(experimentId);
        setRuns(runsData);
        
        // Get agents for each run
        const agentsData: Record<string, StoredAgent> = {};
        
        for (const run of runsData) {
          if (!agentsData[run.agent_id]) {
            const agent = await getAgentById(run.agent_id, run.agent_version);
            if (agent) {
              agentsData[run.agent_id] = agent;
            }
          }
        }
        
        setAgents(agentsData);
      } catch (err) {
        console.error('Error loading experiment data:', err);
        setError('Failed to load experiment data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (experimentId) {
      loadExperimentData();
    }
  }, [experimentId, router]);
  
  // Handle experiment start
  const handleStartExperiment = async () => {
    if (!experiment) return;
    
    setIsStarting(true);
    
    try {
      // Start the experiment
      const updatedExperiment = await startExperiment(experiment.id);
      
      showNotification({
        id: 'experiment-started',
        title: 'Experiment Started',
        message: 'The experiment has been started successfully',
        type: 'success',
      });
      
      setExperiment(updatedExperiment);
      setIsRunning(true);
      
      // Simulate experiment execution
      simulateExperimentExecution();
    } catch (err) {
      console.error('Error starting experiment:', err);
      
      showNotification({
        id: 'experiment-error',
        title: 'Error',
        message: 'Failed to start experiment',
        type: 'error',
      });
    } finally {
      setIsStarting(false);
    }
  };
  
  // Simulate experiment execution
  const simulateExperimentExecution = async () => {
    // In a real implementation, this would be handled by a background process
    // For now, we'll just simulate the execution with a timeout
    
    try {
      // Wait for a few seconds to simulate execution
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Generate random results
      const results: Record<string, any> = {
        summary: 'Experiment completed successfully',
        metrics: {},
        comparison: {},
      };
      
      // Generate metrics for each agent
      for (const agentId in agents) {
        results.metrics[agentId] = {
          accuracy: Math.random() * 100,
          response_time: Math.random() * 100,
          creativity: Math.random() * 100,
          helpfulness: Math.random() * 100,
          reasoning: Math.random() * 100,
        };
      }
      
      // Complete the experiment
      const updatedExperiment = await completeExperiment(experimentId, results);
      
      showNotification({
        id: 'experiment-completed',
        title: 'Experiment Completed',
        message: 'The experiment has been completed successfully',
        type: 'success',
      });
      
      setExperiment(updatedExperiment);
      setIsRunning(false);
      
      // Refresh experiment runs
      const runsData = await getExperimentRuns(experimentId);
      setRuns(runsData);
    } catch (err) {
      console.error('Error simulating experiment execution:', err);
      
      // Fail the experiment
      await failExperiment(experimentId, 'Failed to execute experiment');
      
      showNotification({
        id: 'experiment-failed',
        title: 'Experiment Failed',
        message: 'The experiment has failed to execute',
        type: 'error',
      });
      
      setIsRunning(false);
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Experiment Details</h1>
          <Link href="/evolution-lab">
            <Button variant="outline">Back to Evolution Lab</Button>
          </Link>
        </div>
        
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>{error || 'Experiment not found'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold tracking-tight">{experiment.name}</h1>
            <Badge className={getStatusBadgeColor(experiment.status)}>
              {experiment.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">{experiment.type}</p>
        </div>
        
        <div className="flex space-x-2">
          <Link href="/evolution-lab">
            <Button variant="outline">Back to Evolution Lab</Button>
          </Link>
          
          {experiment.status === 'pending' && (
            <Button
              onClick={handleStartExperiment}
              disabled={isStarting || isRunning}
            >
              {isStarting ? 'Starting...' : 'Start Experiment'}
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
          <TabsTrigger value="runs" className="flex-1">Runs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Experiment Details</CardTitle>
                  <CardDescription>
                    Overview of the experiment configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</h3>
                    <p className="mt-1">
                      {experiment.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Metrics</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {experiment.metrics.map((metric, index) => (
                        <Badge key={index} variant="outline">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Agents</h3>
                    <div className="mt-1 space-y-2">
                      {Object.values(agents).map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-xs text-gray-500">Version {agent.version || 1}</p>
                          </div>
                          <Link href={`/agent-forge/${agent.id}`}>
                            <Button variant="outline" size="sm">View Agent</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {experiment.config && experiment.config.tasks && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tasks</h3>
                      <ul className="list-disc list-inside mt-1">
                        {experiment.config.tasks.map((task: string, index: number) => (
                          <li key={index} className="text-sm">{task}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Created</h3>
                    <p className="mt-1">{formatDate(experiment.created_at)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Last Updated</h3>
                    <p className="mt-1">{formatDate(experiment.updated_at)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Status</h3>
                    <div className="mt-1">
                      <Badge className={getStatusBadgeColor(experiment.status)}>
                        {experiment.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Runs</h3>
                    <p className="mt-1">{runs.length}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  {experiment.status === 'pending' && (
                    <Button
                      className="w-full"
                      onClick={handleStartExperiment}
                      disabled={isStarting || isRunning}
                    >
                      {isStarting ? 'Starting...' : 'Start Experiment'}
                    </Button>
                  )}
                  
                  {experiment.status === 'running' && (
                    <div className="w-full text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Running experiment...</p>
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="mt-6">
          {experiment.status === 'completed' && experiment.results ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Experiment Results</CardTitle>
                  <CardDescription>
                    Performance metrics and comparison results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {experiment.results.summary && (
                      <div>
                        <h3 className="text-lg font-medium">Summary</h3>
                        <p className="mt-1">{experiment.results.summary}</p>
                      </div>
                    )}
                    
                    {experiment.results.metrics && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Agent Performance</h3>
                        <AgentComparisonChart
                          agents={Object.entries(experiment.results.metrics).map(([agentId, metrics]) => ({
                            agent: agents[agentId],
                            metrics: metrics as Record<string, number>,
                          }))}
                          title="Performance Comparison"
                          description="Compare metrics across agents"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : experiment.status === 'failed' ? (
            <Card>
              <CardHeader>
                <CardTitle>Experiment Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 text-red-700 p-4 rounded-md">
                  <p>{experiment.results?.error || 'The experiment failed to execute.'}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleStartExperiment}
                  disabled={isStarting || isRunning}
                >
                  Retry Experiment
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Results Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {experiment.status === 'running'
                      ? 'The experiment is currently running. Results will be available once it completes.'
                      : 'The experiment has not been run yet. Start the experiment to generate results.'}
                  </p>
                </div>
              </CardContent>
              {experiment.status === 'pending' && (
                <CardFooter className="flex justify-center">
                  <Button
                    onClick={handleStartExperiment}
                    disabled={isStarting || isRunning}
                  >
                    {isStarting ? 'Starting...' : 'Start Experiment'}
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="runs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Runs</CardTitle>
              <CardDescription>
                Individual agent runs for this experiment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No runs available for this experiment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {runs.map((run) => (
                    <div key={run.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {agents[run.agent_id]?.name || 'Unknown Agent'} (v{run.agent_version})
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusBadgeColor(run.status)}>
                              {run.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Started: {formatDate(run.started_at)}
                            </span>
                            {run.completed_at && (
                              <span className="text-sm text-gray-500">
                                Completed: {formatDate(run.completed_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Link href={`/agent-forge/${run.agent_id}`}>
                          <Button variant="outline" size="sm">View Agent</Button>
                        </Link>
                      </div>
                      
                      {run.metrics && Object.keys(run.metrics).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Metrics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(run.metrics).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 p-2 rounded-md">
                                <p className="text-xs text-gray-500">{key}</p>
                                <p className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
