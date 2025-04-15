'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { getAllAgents, StoredAgent } from '@/app/lib/db/agentStorage';
import { getAgentMetrics, AgentMetric } from '@/app/lib/db/experiments';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import LazyMetricsChart from '@/app/components/evolution/LazyMetricsChart';

export default function CompareAgentsPage() {
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Record<string, AgentMetric[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
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
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const toggleAgentSelection = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  const handleCompare = async () => {
    if (selectedAgents.length < 2) {
      setError('Please select at least two agents to compare');
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const metricsData: Record<string, AgentMetric[]> = {};

      for (const agentId of selectedAgents) {
        // For now, generate simulated metrics
        const simulatedMetrics = generateSimulatedMetrics(agentId);
        metricsData[agentId] = simulatedMetrics;
      }

      setMetrics(metricsData);
    } catch (err) {
      console.error('Error fetching agent metrics:', err);
      setError('Failed to fetch agent metrics');
    } finally {
      setIsComparing(false);
    }
  };

  // Generate simulated metrics for demo purposes
  const generateSimulatedMetrics = (agentId: string): AgentMetric[] => {
    const metricTypes = ['accuracy', 'response_time', 'creativity', 'helpfulness', 'reasoning'];
    const metrics: AgentMetric[] = [];

    for (const type of metricTypes) {
      // Generate 3-5 metrics of each type
      const count = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < count; i++) {
        // Generate a random value between 0 and 100
        let value = Math.random() * 100;

        // For response_time, use a different range (lower is better)
        if (type === 'response_time') {
          value = Math.random() * 2000 + 500; // 500-2500ms
        }

        metrics.push({
          id: `metric-${agentId}-${type}-${i}`,
          agent_id: agentId,
          experiment_id: null,
          run_id: null,
          metric_type: type,
          value,
          created_at: new Date().toISOString()
        });
      }
    }

    return metrics;
  };

  // Get agent by ID
  const getAgentById = (agentId: string) => {
    return agents.find(agent => agent.id === agentId);
  };

  // Get the average value for a specific metric type
  const getAverageMetric = (agentId: string, metricType: string) => {
    const agentMetrics = metrics[agentId] || [];
    const typeMetrics = agentMetrics.filter(metric => metric.metric_type === metricType);

    if (typeMetrics.length === 0) {
      return 'N/A';
    }

    const sum = typeMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return (sum / typeMetrics.length).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compare Agents</h1>
          <p className="mt-2 text-lg text-gray-600">
            Compare performance metrics across different agents
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

      <Card>
        <CardHeader>
          <CardTitle>Select Agents to Compare</CardTitle>
          <CardDescription>
            Choose at least two agents to compare their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!userId ? (
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-yellow-700">
                Please <Link href="/auth/login" className="text-indigo-600 hover:underline">sign in</Link> to compare agents.
              </p>
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-gray-700">
                You don't have any agents yet. <Link href="/agent-forge/create" className="text-indigo-600 hover:underline">Create an agent</Link> first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => toggleAgentSelection(agent.id)}
                  className={`p-4 border rounded-md cursor-pointer ${
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
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCompare}
            disabled={selectedAgents.length < 2 || isComparing}
            className="w-full"
          >
            {isComparing ? 'Comparing...' : 'Compare Selected Agents'}
          </Button>
        </CardFooter>
      </Card>

      {Object.keys(metrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
            <CardDescription>
              Performance metrics for selected agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Metric</th>
                    {selectedAgents.map((agentId) => (
                      <th key={agentId} className="border p-2 text-left">
                        {getAgentById(agentId)?.name || 'Unknown Agent'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['accuracy', 'response_time', 'creativity', 'helpfulness', 'reasoning'].map((metricType) => (
                    <tr key={metricType} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium capitalize">
                        {metricType.replace('_', ' ')}
                      </td>
                      {selectedAgents.map((agentId) => (
                        <td key={agentId} className="border p-2">
                          {getAverageMetric(agentId, metricType)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Interpretation</h3>
              <p className="text-gray-700">
                This comparison shows the average values for each metric across the selected agents. Higher values generally indicate better performance, except for response_time where lower values are better.
              </p>
              <p className="text-gray-700 mt-2">
                Note: If an agent doesn't have data for a particular metric, it will show as "N/A".
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Performance Visualization</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedAgents.length > 0 ? (
                  <LazyMetricsChart
                    type="radar"
                    height={350}
                    data={{
                      labels: ['Accuracy', 'Response Time', 'Creativity', 'Helpfulness', 'Reasoning'],
                      datasets: selectedAgents.map((agentId) => {
                        const agent = getAgentById(agentId);
                        // Generate a random color for each agent
                        const r = Math.floor(Math.random() * 200);
                        const g = Math.floor(Math.random() * 200);
                        const b = Math.floor(Math.random() * 200);
                        const backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
                        const borderColor = `rgba(${r}, ${g}, ${b}, 1)`;

                        return {
                          label: agent?.name || 'Unknown Agent',
                          data: [
                            parseFloat(getAverageMetric(agentId, 'accuracy')) || 0,
                            // For response time, we invert the value (lower is better)
                            100 - (parseFloat(getAverageMetric(agentId, 'response_time')) / 25) || 0,
                            parseFloat(getAverageMetric(agentId, 'creativity')) || 0,
                            parseFloat(getAverageMetric(agentId, 'helpfulness')) || 0,
                            parseFloat(getAverageMetric(agentId, 'reasoning')) || 0,
                          ],
                          backgroundColor,
                          borderColor,
                          borderWidth: 2,
                        };
                      }),
                    }}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">
                      Select agents to view performance visualization.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Detailed Analysis</h3>
              <div className="space-y-4">
                {selectedAgents.map((agentId) => {
                  const agent = getAgentById(agentId);
                  if (!agent) return null;

                  return (
                    <div key={agentId} className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">{agent.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{agent.archetype}</p>

                      <div className="grid grid-cols-2 gap-3">
                        {['accuracy', 'response_time', 'creativity', 'helpfulness', 'reasoning'].map((metricType) => {
                          const value = getAverageMetric(agentId, metricType);
                          return (
                            <div key={metricType} className="bg-gray-50 p-3 rounded-md">
                              <div className="text-xs text-gray-500 capitalize">{metricType.replace('_', ' ')}</div>
                              <div className="text-lg font-medium">{value}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
