'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { calculateDeploymentMetrics, getMonitoringEvents, MonitoringEvent, MonitoringMetrics, setupRealTimeMonitoring } from '@/app/lib/services/monitoring';
import { getDeploymentById } from '@/app/lib/services/agentDeployment';
import LazyMetricsChart from '@/app/components/evolution/LazyMetricsChart';

interface DashboardProps {
  deploymentId: string;
}

export default function MonitoringDashboard({ deploymentId }: DashboardProps) {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [deployment, setDeployment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get deployment info
        const deploymentData = await getDeploymentById(deploymentId);
        if (!deploymentData) {
          setError('Deployment not found');
          return;
        }
        setDeployment(deploymentData);
        
        // Get metrics
        const metricsData = await calculateDeploymentMetrics(deploymentId);
        setMetrics(metricsData);
        
        // Get recent events
        const eventsData = await getMonitoringEvents(deploymentId, 50);
        setEvents(eventsData);
      } catch (err) {
        console.error('Error loading monitoring data:', err);
        setError('Failed to load monitoring data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [deploymentId]);
  
  // Set up real-time monitoring
  useEffect(() => {
    if (!deploymentId) return;
    
    const cleanup = setupRealTimeMonitoring(deploymentId, (updatedMetrics) => {
      setMetrics(updatedMetrics);
      
      // Refresh events when metrics update
      getMonitoringEvents(deploymentId, 50).then(eventsData => {
        setEvents(eventsData);
      });
    });
    
    return cleanup;
  }, [deploymentId]);
  
  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'request':
        return 'bg-blue-100 text-blue-800';
      case 'response':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'status':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Generate metrics chart data
  const generateMetricsChartData = () => {
    if (!metrics) return null;
    
    return {
      labels: ['Uptime', 'Requests', 'Errors', 'Latency', 'Cost'],
      datasets: [
        {
          label: 'Current Metrics',
          data: [
            metrics.uptime / 3600, // Convert to hours
            metrics.requests,
            metrics.errors,
            metrics.latency / 1000, // Convert to seconds
            metrics.cost
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
        }
      ]
    };
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.uptime ? formatUptime(metrics.uptime) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.requests || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.errors || 0}
            </div>
            {metrics && metrics.requests > 0 && (
              <div className="text-sm text-gray-500">
                {((metrics.errors / metrics.requests) * 100).toFixed(1)}% error rate
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.cost.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Metrics Overview</CardTitle>
            <CardDescription>
              Performance metrics for the deployed agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {metrics ? (
                <LazyMetricsChart
                  type="bar"
                  height={250}
                  data={generateMetricsChartData() || { labels: [], datasets: [] }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No metrics available</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Deployment Status</CardTitle>
            <CardDescription>
              Current status and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deployment ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      deployment.status === 'running' ? 'bg-green-100 text-green-800' :
                      deployment.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {deployment.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Environment</h3>
                  <p className="mt-1 text-sm">{deployment.environment}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Deployed At</h3>
                  <p className="mt-1 text-sm">
                    {deployment.deployedAt ? formatTimestamp(deployment.deployedAt) : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Resources</h3>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-xs text-gray-500">Memory</div>
                      <div className="font-medium">
                        {deployment.configuration?.resources?.memory || 512} MB
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-xs text-gray-500">CPU</div>
                      <div className="font-medium">
                        {deployment.configuration?.resources?.cpu || 1} cores
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-xs text-gray-500">Storage</div>
                      <div className="font-medium">
                        {deployment.configuration?.resources?.storage || 1} GB
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Deployment information not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Latest monitoring events for this deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No events recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Timestamp</th>
                    <th className="border p-2 text-left">Type</th>
                    <th className="border p-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={`${event.deploymentId}-${event.timestamp}`} className="hover:bg-gray-50">
                      <td className="border p-2 text-sm">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="border p-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                          {event.eventType}
                        </span>
                      </td>
                      <td className="border p-2 text-sm">
                        <pre className="text-xs overflow-auto max-h-20">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" disabled={events.length === 0}>
            Load More
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
