'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import {
  getExperimentById,
  getExperimentRuns,
  updateExperiment,
  Experiment,
  ExperimentRun
} from '@/app/lib/db/experiments';
import { getAgentById } from '@/app/lib/db/agentStorage';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import MetricsChart from '@/app/components/evolution/MetricsChart';

export default function ExperimentRunDetailPage() {
  const router = useRouter();
  const params = useParams();
  const experimentId = params.id as string;
  const runId = params.runId as string;

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [run, setRun] = useState<ExperimentRun | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Metrics data (simulated for now)
  const [metrics, setMetrics] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };

    getUser();
  }, []);

  // Load experiment and run data
  useEffect(() => {
    const loadData = async () => {
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

        // Get experiment runs
        const runsData = await getExperimentRuns(experimentId);
        const runData = runsData.find(r => r.id === runId);

        if (!runData) {
          setError('Run not found');
          setIsLoading(false);
          return;
        }

        setRun(runData);

        // Get agent details
        const agentData = await getAgentById(runData.agent_id);
        setAgent(agentData);

        // Generate simulated metrics data
        generateSimulatedMetrics(experimentData.configuration.metrics);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load experiment run');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [experimentId, runId]);

  // Generate simulated metrics data
  const generateSimulatedMetrics = (metricTypes: string[]) => {
    const simulatedMetrics = metricTypes.map(metricType => {
      // Generate a random value between 0 and 100
      const value = Math.round(Math.random() * 100);

      return {
        type: metricType,
        value,
        timestamp: new Date().toISOString()
      };
    });

    setMetrics(simulatedMetrics);

    // Generate chart data
    const chartData = {
      labels: metricTypes.map(type => type.replace('_', ' ')),
      datasets: [
        {
          label: 'Performance',
          data: simulatedMetrics.map(metric => metric.value),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }
      ]
    };

    setChartData(chartData);
  };

  // Format metric value
  const formatMetricValue = (type: string, value: number) => {
    if (type === 'response_time') {
      return `${value} ms`;
    }

    return value.toFixed(2);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading experiment run...</p>
        </div>
      </div>
    );
  }

  if (error || !experiment || !run) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          <p>{error || 'Experiment run not found'}</p>
        </div>
        <Link href={`/evolution-lab/${experimentId}`}>
          <Button>Back to Experiment</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiment Run</h1>
          <p className="mt-2 text-lg text-gray-600">
            {experiment.name} - {agent?.name || 'Unknown Agent'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Status: <span className={`font-medium ${getStatusColor(run.status)}`}>{run.status}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/evolution-lab/${experimentId}`}>
            <Button variant="outline">Back to Experiment</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Run Details</CardTitle>
              <CardDescription>
                Information about this experiment run
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Agent</h3>
                <p className="text-sm text-gray-900">{agent?.name || 'Unknown Agent'}</p>
                {agent && (
                  <p className="text-xs text-gray-500">{agent.archetype}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700">Created</h3>
                <p className="text-sm text-gray-900">{new Date(run.created_at).toLocaleString()}</p>
              </div>

              {run.started_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Started</h3>
                  <p className="text-sm text-gray-900">{new Date(run.started_at).toLocaleString()}</p>
                </div>
              )}

              {run.completed_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Completed</h3>
                  <p className="text-sm text-gray-900">{new Date(run.completed_at).toLocaleString()}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700">Status</h3>
                <p className={`text-sm font-medium ${getStatusColor(run.status)}`}>
                  {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Metrics collected during this experiment run
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">
                    No metrics available for this run.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {metrics.map((metric, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 capitalize mb-1">
                          {metric.type.replace('_', ' ')}
                        </h3>
                        <p className="text-2xl font-semibold">
                          {formatMetricValue(metric.type, metric.value)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Chart</h3>
                    <MetricsChart
                      type="bar"
                      height={300}
                      data={{
                        labels: metrics.map(metric => metric.type.replace('_', ' ')),
                        datasets: [
                          {
                            label: agent?.name || 'Agent Performance',
                            data: metrics.map(metric => metric.value),
                            backgroundColor: 'rgba(99, 102, 241, 0.5)',
                            borderColor: 'rgb(99, 102, 241)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Value',
                            },
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Metrics',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Run Results</CardTitle>
              <CardDescription>
                Detailed results from this experiment run
              </CardDescription>
            </CardHeader>
            <CardContent>
              {run.results ? (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[300px]">
                  {JSON.stringify(run.results, null, 2)}
                </pre>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">
                    No results available for this run.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
