'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgentById } from '@/app/lib/db/agentStorage';
import { getDeploymentById, pauseDeployment, resumeDeployment, stopDeployment } from '@/app/lib/services/agentDeployment';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';
import MonitoringDashboard from '@/app/components/monitoring/Dashboard';
import AlertsPanel from '@/app/components/monitoring/AlertsPanel';
import ScalingOptions from '@/app/components/deployment/ScalingOptions';

export default function DeploymentMonitoringPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();

  const agentId = params.id as string;
  const deploymentId = params.deploymentId as string;

  // State for agent and deployment
  const [agent, setAgent] = useState<any | null>(null);
  const [deployment, setDeployment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  // Load agent and deployment
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

        // Load deployment
        const deploymentData = await getDeploymentById(deploymentId);
        if (!deploymentData) {
          setError('Deployment not found');
          return;
        }
        setDeployment(deploymentData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId && deploymentId) {
      loadData();
    }
  }, [agentId, deploymentId]);

  // Handle stop deployment
  const handleStopDeployment = async () => {
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

        // Update the deployment status
        setDeployment({
          ...deployment,
          status: 'stopped'
        });
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
  const handlePauseDeployment = async () => {
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

        // Update the deployment status
        setDeployment({
          ...deployment,
          status: 'paused'
        });
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
  const handleResumeDeployment = async () => {
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

        // Update the deployment status
        setDeployment({
          ...deployment,
          status: 'running'
        });
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Deployment Monitoring</h1>
          <Link href={`/agent-forge/${agentId}/deploy`}>
            <Button variant="outline">Back to Deployments</Button>
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
          <h1 className="text-3xl font-bold tracking-tight">Deployment Monitoring</h1>
          <p className="mt-2 text-lg text-gray-600">
            {agent?.name} ({agent?.archetype || 'No archetype'})
          </p>
        </div>
        <div>
          <Link href={`/agent-forge/${agentId}/deploy`}>
            <Button variant="outline">Back to Deployments</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Deployment Status</CardTitle>
              <CardDescription>
                Environment: {deployment?.environment}
              </CardDescription>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  deployment ? getStatusBadgeClass(deployment.status) : 'bg-gray-100 text-gray-800'
                }`}
              >
                {deployment?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2">
            {deployment?.status === 'running' && (
              <>
                <Button
                  variant="outline"
                  onClick={handlePauseDeployment}
                  disabled={isActionInProgress}
                >
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleStopDeployment}
                  disabled={isActionInProgress}
                >
                  Stop
                </Button>
              </>
            )}

            {deployment?.status === 'paused' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleResumeDeployment}
                  disabled={isActionInProgress}
                >
                  Resume
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleStopDeployment}
                  disabled={isActionInProgress}
                >
                  Stop
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <MonitoringDashboard deploymentId={deploymentId} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScalingOptions
            deploymentId={deploymentId}
            configuration={deployment?.configuration}
            metrics={deployment?.metrics}
            onUpdate={() => {
              // Reload deployment data
              getDeploymentById(deploymentId).then(data => {
                if (data) {
                  setDeployment(data);
                }
              });
            }}
          />

          <AlertsPanel deploymentId={deploymentId} />
        </div>
      </div>
    </div>
  );
}
