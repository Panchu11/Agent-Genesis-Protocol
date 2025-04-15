'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { getAgentById } from '@/app/lib/db/agentStorage';
import {
  deployAgent,
  getAgentDeployments,
  stopDeployment,
  pauseDeployment,
  resumeDeployment,
  deploymentEnvironments,
  DeploymentStatus,
  DeploymentConfiguration
} from '@/app/lib/services/agentDeployment';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';

export default function AgentDeployPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const agentId = params.id as string;

  // State for agent and deployments
  const [agent, setAgent] = useState<any | null>(null);
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for deployment form
  const [selectedEnvironment, setSelectedEnvironment] = useState(deploymentEnvironments[0]?.id || '');
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfiguration>({
    environment: deploymentEnvironments[0]?.id || '',
    settings: {},
    resources: {
      memory: 512,
      cpu: 1,
      storage: 1
    },
    constraints: {
      maxRuntime: 3600,
      maxCost: 5,
      allowedActions: ['chat', 'web-search']
    }
  });

  // State for deployment process
  const [isDeploying, setIsDeploying] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  // Load agent and deployments
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load agent
        const agentData = await getAgentById(agentId);
        if (!agentData) {
          setError('Agent not found');
          return;
        }
        setAgent(agentData);

        // Load deployments
        const deploymentsData = await getAgentDeployments(agentId);
        setDeployments(deploymentsData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load agent data');
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId) {
      loadData();
    }
  }, [agentId]);

  // Handle environment change
  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    setDeploymentConfig({
      ...deploymentConfig,
      environment: environmentId
    });
  };

  // Handle resource change
  const handleResourceChange = (resource: string, value: number) => {
    setDeploymentConfig({
      ...deploymentConfig,
      resources: {
        ...deploymentConfig.resources,
        [resource]: value
      }
    });
  };

  // Handle constraint change
  const handleConstraintChange = (constraint: string, value: any) => {
    setDeploymentConfig({
      ...deploymentConfig,
      constraints: {
        ...deploymentConfig.constraints,
        [constraint]: value
      }
    });
  };

  // Handle allowed action toggle
  const handleAllowedActionToggle = (action: string) => {
    const currentActions = deploymentConfig.constraints.allowedActions || [];

    if (currentActions.includes(action)) {
      handleConstraintChange(
        'allowedActions',
        currentActions.filter(a => a !== action)
      );
    } else {
      handleConstraintChange(
        'allowedActions',
        [...currentActions, action]
      );
    }
  };

  // Handle deploy agent
  const handleDeployAgent = async () => {
    setIsDeploying(true);
    setError(null);

    try {
      const result = await deployAgent(agentId, deploymentConfig);

      if (result.success) {
        showNotification({
          id: 'deploy-success',
          title: 'Deployment Initiated',
          message: `Agent is being deployed to ${getEnvironmentName(deploymentConfig.environment)}`,
          type: 'success'
        });

        // Add the new deployment to the list
        if (result.deployment) {
          setDeployments([result.deployment, ...deployments]);
        }
      } else {
        setError(result.error || 'Failed to deploy agent');
        showNotification({
          id: 'deploy-error',
          title: 'Deployment Failed',
          message: result.error || 'An error occurred during deployment',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deploying agent:', error);
      setError('An unexpected error occurred');
      showNotification({
        id: 'deploy-error',
        title: 'Deployment Failed',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle stop deployment
  const handleStopDeployment = async (deploymentId: string) => {
    setIsActionInProgress(true);

    try {
      const result = await stopDeployment(deploymentId);

      if (result.success) {
        showNotification({
          id: 'stop-success',
          title: 'Deployment Stopped',
          message: 'Agent deployment has been stopped successfully',
          type: 'success'
        });

        // Update the deployment status in the list
        setDeployments(deployments.map(deployment =>
          deployment.id === deploymentId
            ? { ...deployment, status: 'stopped' }
            : deployment
        ));
      } else {
        showNotification({
          id: 'stop-error',
          title: 'Stop Failed',
          message: result.error || 'An error occurred while stopping the deployment',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error stopping deployment:', error);
      showNotification({
        id: 'stop-error',
        title: 'Stop Failed',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Handle pause deployment
  const handlePauseDeployment = async (deploymentId: string) => {
    setIsActionInProgress(true);

    try {
      const result = await pauseDeployment(deploymentId);

      if (result.success) {
        showNotification({
          id: 'pause-success',
          title: 'Deployment Paused',
          message: 'Agent deployment has been paused successfully',
          type: 'success'
        });

        // Update the deployment status in the list
        setDeployments(deployments.map(deployment =>
          deployment.id === deploymentId
            ? { ...deployment, status: 'paused' }
            : deployment
        ));
      } else {
        showNotification({
          id: 'pause-error',
          title: 'Pause Failed',
          message: result.error || 'An error occurred while pausing the deployment',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error pausing deployment:', error);
      showNotification({
        id: 'pause-error',
        title: 'Pause Failed',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Handle resume deployment
  const handleResumeDeployment = async (deploymentId: string) => {
    setIsActionInProgress(true);

    try {
      const result = await resumeDeployment(deploymentId);

      if (result.success) {
        showNotification({
          id: 'resume-success',
          title: 'Deployment Resumed',
          message: 'Agent deployment has been resumed successfully',
          type: 'success'
        });

        // Update the deployment status in the list
        setDeployments(deployments.map(deployment =>
          deployment.id === deploymentId
            ? { ...deployment, status: 'running' }
            : deployment
        ));
      } else {
        showNotification({
          id: 'resume-error',
          title: 'Resume Failed',
          message: result.error || 'An error occurred while resuming the deployment',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error resuming deployment:', error);
      showNotification({
        id: 'resume-error',
        title: 'Resume Failed',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Get environment name by ID
  const getEnvironmentName = (environmentId: string) => {
    const environment = deploymentEnvironments.find(env => env.id === environmentId);
    return environment ? environment.name : environmentId;
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'deploying':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Agent Deployment</h1>
          <Link href="/agent-forge">
            <Button variant="outline">Back to Agents</Button>
          </Link>
        </div>

        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Deployment</h1>
          <p className="mt-2 text-lg text-gray-600">
            {agent?.name} ({agent?.archetype || 'No archetype'})
          </p>
        </div>
        <div>
          <Link href={`/agent-forge/${agentId}`}>
            <Button variant="outline">Back to Agent</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Deploy Agent</CardTitle>
              <CardDescription>
                Configure and deploy your agent to an environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Environment
                  </label>
                  <div className="space-y-2">
                    {deploymentEnvironments.map((environment) => (
                      <div
                        key={environment.id}
                        className={`p-3 border rounded-md cursor-pointer ${
                          selectedEnvironment === environment.id ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                        }`}
                        onClick={() => handleEnvironmentChange(environment.id)}
                      >
                        <div className="font-medium">{environment.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{environment.description}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {environment.capabilities.map((capability) => (
                            <span
                              key={capability}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {capability}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Resources
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <label htmlFor="memory" className="text-xs text-gray-500">
                          Memory (MB)
                        </label>
                        <span className="text-xs text-gray-500">
                          {deploymentConfig.resources.memory || 512}
                        </span>
                      </div>
                      <input
                        id="memory"
                        type="range"
                        min="256"
                        max="4096"
                        step="256"
                        value={deploymentConfig.resources.memory || 512}
                        onChange={(e) => handleResourceChange('memory', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label htmlFor="cpu" className="text-xs text-gray-500">
                          CPU Cores
                        </label>
                        <span className="text-xs text-gray-500">
                          {deploymentConfig.resources.cpu || 1}
                        </span>
                      </div>
                      <input
                        id="cpu"
                        type="range"
                        min="0.5"
                        max="4"
                        step="0.5"
                        value={deploymentConfig.resources.cpu || 1}
                        onChange={(e) => handleResourceChange('cpu', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label htmlFor="storage" className="text-xs text-gray-500">
                          Storage (GB)
                        </label>
                        <span className="text-xs text-gray-500">
                          {deploymentConfig.resources.storage || 1}
                        </span>
                      </div>
                      <input
                        id="storage"
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={deploymentConfig.resources.storage || 1}
                        onChange={(e) => handleResourceChange('storage', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Constraints
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <label htmlFor="maxRuntime" className="text-xs text-gray-500">
                          Max Runtime (hours)
                        </label>
                        <span className="text-xs text-gray-500">
                          {((deploymentConfig.constraints.maxRuntime || 3600) / 3600).toFixed(1)}
                        </span>
                      </div>
                      <input
                        id="maxRuntime"
                        type="range"
                        min="1800"
                        max="86400"
                        step="1800"
                        value={deploymentConfig.constraints.maxRuntime || 3600}
                        onChange={(e) => handleConstraintChange('maxRuntime', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label htmlFor="maxCost" className="text-xs text-gray-500">
                          Max Cost (USD)
                        </label>
                        <span className="text-xs text-gray-500">
                          ${deploymentConfig.constraints.maxCost || 5}
                        </span>
                      </div>
                      <input
                        id="maxCost"
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={deploymentConfig.constraints.maxCost || 5}
                        onChange={(e) => handleConstraintChange('maxCost', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        Allowed Actions
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {['chat', 'web-search', 'file-access', 'api-access', 'code-execution'].map((action) => (
                          <div
                            key={action}
                            className={`p-2 border rounded-md cursor-pointer ${
                              deploymentConfig.constraints.allowedActions?.includes(action)
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'hover:border-gray-400'
                            }`}
                            onClick={() => handleAllowedActionToggle(action)}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={deploymentConfig.constraints.allowedActions?.includes(action) || false}
                                onChange={() => {}}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="capitalize">{action.replace('-', ' ')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleDeployAgent}
                disabled={isDeploying}
                className="w-full"
              >
                {isDeploying ? 'Deploying...' : 'Deploy Agent'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                View and manage your agent deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No deployments found for this agent.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <div key={deployment.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                                deployment.status
                              )}`}
                            >
                              {deployment.status}
                            </span>
                            <span className="font-medium">
                              {getEnvironmentName(deployment.environment)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Created: {formatDate(deployment.createdAt)}
                          </div>
                          {deployment.deployedAt && (
                            <div className="text-xs text-gray-500">
                              Deployed: {formatDate(deployment.deployedAt)}
                            </div>
                          )}
                          {deployment.terminatedAt && (
                            <div className="text-xs text-gray-500">
                              Terminated: {formatDate(deployment.terminatedAt)}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Link href={`/agent-forge/${agentId}/deploy/${deployment.id}`}>
                            <Button
                              variant="default"
                              size="sm"
                            >
                              Monitor
                            </Button>
                          </Link>

                          {deployment.status === 'running' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePauseDeployment(deployment.id)}
                                disabled={isActionInProgress}
                              >
                                Pause
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleStopDeployment(deployment.id)}
                                disabled={isActionInProgress}
                              >
                                Stop
                              </Button>
                            </>
                          )}

                          {deployment.status === 'paused' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResumeDeployment(deployment.id)}
                                disabled={isActionInProgress}
                              >
                                Resume
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleStopDeployment(deployment.id)}
                                disabled={isActionInProgress}
                              >
                                Stop
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {deployment.metrics && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="p-2 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500">Uptime</div>
                            <div className="font-medium">
                              {deployment.metrics.uptime
                                ? `${Math.floor(deployment.metrics.uptime / 3600)}h ${Math.floor(
                                    (deployment.metrics.uptime % 3600) / 60
                                  )}m`
                                : 'N/A'}
                            </div>
                          </div>

                          <div className="p-2 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500">Requests</div>
                            <div className="font-medium">
                              {deployment.metrics.requests || 'N/A'}
                            </div>
                          </div>

                          <div className="p-2 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500">Errors</div>
                            <div className="font-medium">
                              {deployment.metrics.errors || 'N/A'}
                            </div>
                          </div>

                          <div className="p-2 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500">Cost</div>
                            <div className="font-medium">
                              ${deployment.metrics.cost?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
