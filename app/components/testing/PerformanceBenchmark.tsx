'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Badge } from '@/app/components/common/Badge';
import { Progress } from '@/app/components/common/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/common/Alert';
import { 
  getAgent,
  listAgents
} from '@/app/lib/services/agents';
import { useNotification } from '@/app/context/NotificationContext';
import { BarChart, LineChart, PieChart, RefreshCw, AlertTriangle, CheckCircle, Clock, Zap, Cpu, MemoryStick, DollarSign } from 'lucide-react';
import LazyMetricsChart from '@/app/components/evolution/LazyMetricsChart';

// Mock function for running a benchmark (to be implemented with real backend)
const runBenchmark = async (agentId: string, options: any) => {
  // This would be replaced with a real API call
  console.log('Running benchmark:', agentId, options);
  
  // Simulate a benchmark result
  return {
    id: `benchmark-${Date.now()}`,
    agentId,
    options,
    results: {
      responseTime: {
        min: 150,
        max: 850,
        avg: 320,
        p90: 650
      },
      tokenCount: {
        min: 120,
        max: 580,
        avg: 320,
        p90: 480
      },
      costEstimate: {
        total: 0.0245,
        perRequest: 0.00245
      },
      throughput: {
        requestsPerSecond: 3.2
      },
      errorRate: 2.5,
      memoryUsage: {
        min: 120,
        max: 350,
        avg: 220
      }
    },
    completedAt: new Date().toISOString()
  };
};

// Mock function for getting benchmark history (to be implemented with real backend)
const getBenchmarkHistory = async (agentId: string) => {
  // This would be replaced with a real API call
  return [];
};

interface PerformanceBenchmarkProps {
  agentId: string;
}

export default function PerformanceBenchmark({ agentId }: PerformanceBenchmarkProps) {
  const { showNotification } = useNotification();
  
  // State for agent
  const [agent, setAgent] = useState<any>(null);
  const [otherAgents, setOtherAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for benchmark
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<any[]>([]);
  
  // State for benchmark options
  const [concurrentUsers, setConcurrentUsers] = useState<number>(10);
  const [duration, setDuration] = useState<number>(30);
  const [requestType, setRequestType] = useState<string>('text');
  const [compareAgentId, setCompareAgentId] = useState<string>('');
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('results');
  
  // Load agent and benchmark history
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load agent
        const agentData = await getAgent(agentId);
        
        if (!agentData) {
          throw new Error('Agent not found');
        }
        
        setAgent(agentData);
        
        // Load other agents for comparison
        const allAgents = await listAgents();
        setOtherAgents(allAgents.filter(a => a.id !== agentId));
        
        // Load benchmark history
        const historyData = await getBenchmarkHistory(agentId);
        setBenchmarkHistory(historyData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message || 'An unexpected error occurred');
        
        showNotification({
          id: 'load-error',
          title: 'Error',
          message: error.message || 'Failed to load data',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [agentId]);
  
  // Handle running a benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setProgress(0);
    setError(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 500);
      
      // Run benchmark
      const options = {
        concurrentUsers,
        duration,
        requestType,
        compareAgentId: compareAgentId || undefined
      };
      
      const result = await runBenchmark(agentId, options);
      
      // Clear interval and set progress to 100%
      clearInterval(progressInterval);
      setProgress(100);
      
      // Set result
      setBenchmarkResult(result);
      
      // Add to history
      setBenchmarkHistory([result, ...benchmarkHistory]);
      
      // Show notification
      showNotification({
        id: 'benchmark-complete',
        title: 'Benchmark Complete',
        message: 'Performance benchmark completed successfully',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error running benchmark:', error);
      setError(error.message || 'An unexpected error occurred');
      
      showNotification({
        id: 'benchmark-error',
        title: 'Error',
        message: error.message || 'Failed to run benchmark',
        type: 'error'
      });
    } finally {
      setIsBenchmarking(false);
    }
  };
  
  // Generate response time chart data
  const generateResponseTimeChartData = () => {
    if (!benchmarkResult) return null;
    
    return {
      labels: ['Min', 'Average', 'P90', 'Max'],
      datasets: [
        {
          label: 'Response Time (ms)',
          data: [
            benchmarkResult.results.responseTime.min,
            benchmarkResult.results.responseTime.avg,
            benchmarkResult.results.responseTime.p90,
            benchmarkResult.results.responseTime.max
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.7)', // Indigo
          borderWidth: 1
        }
      ]
    };
  };
  
  // Generate token count chart data
  const generateTokenCountChartData = () => {
    if (!benchmarkResult) return null;
    
    return {
      labels: ['Min', 'Average', 'P90', 'Max'],
      datasets: [
        {
          label: 'Token Count',
          data: [
            benchmarkResult.results.tokenCount.min,
            benchmarkResult.results.tokenCount.avg,
            benchmarkResult.results.tokenCount.p90,
            benchmarkResult.results.tokenCount.max
          ],
          backgroundColor: 'rgba(139, 92, 246, 0.7)', // Purple
          borderWidth: 1
        }
      ]
    };
  };
  
  // Generate comparison chart data
  const generateComparisonChartData = () => {
    if (!benchmarkResult || !benchmarkResult.compareResults) return null;
    
    return {
      labels: ['Response Time (ms)', 'Token Count', 'Cost ($0.001)'],
      datasets: [
        {
          label: agent?.name || 'Current Agent',
          data: [
            benchmarkResult.results.responseTime.avg,
            benchmarkResult.results.tokenCount.avg,
            benchmarkResult.results.costEstimate.perRequest * 1000
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.7)', // Indigo
          borderWidth: 1
        },
        {
          label: benchmarkResult.compareResults.agentName || 'Comparison Agent',
          data: [
            benchmarkResult.compareResults.responseTime.avg,
            benchmarkResult.compareResults.tokenCount.avg,
            benchmarkResult.compareResults.costEstimate.perRequest * 1000
          ],
          backgroundColor: 'rgba(16, 185, 129, 0.7)', // Green
          borderWidth: 1
        }
      ]
    };
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Performance Benchmark</CardTitle>
            <CardDescription>
              Measure and analyze your agent's performance
            </CardDescription>
          </div>
          <Button
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
            className="flex items-center space-x-1"
          >
            {isBenchmarking ? (
              <>
                <span className="animate-pulse mr-2">●</span>
                Running...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Benchmark
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Benchmark options */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium mb-3">Benchmark Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Concurrent Users</label>
                <Select value={concurrentUsers.toString()} onValueChange={(value) => setConcurrentUsers(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 user</SelectItem>
                    <SelectItem value="5">5 users</SelectItem>
                    <SelectItem value="10">10 users</SelectItem>
                    <SelectItem value="25">25 users</SelectItem>
                    <SelectItem value="50">50 users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Duration (seconds)</label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Request Type</label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="function">Function Calling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Compare With (Optional)</label>
                <Select value={compareAgentId} onValueChange={setCompareAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {otherAgents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          {isBenchmarking && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Running benchmark...</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Benchmark results */}
          {benchmarkResult ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="results" className="flex items-center space-x-1">
                  <BarChart className="h-4 w-4" />
                  <span>Results</span>
                </TabsTrigger>
                <TabsTrigger value="metrics" className="flex items-center space-x-1">
                  <LineChart className="h-4 w-4" />
                  <span>Detailed Metrics</span>
                </TabsTrigger>
                {benchmarkResult.compareResults && (
                  <TabsTrigger value="comparison" className="flex items-center space-x-1">
                    <PieChart className="h-4 w-4" />
                    <span>Comparison</span>
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="results">
                <div className="space-y-6">
                  {/* Summary metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md text-center">
                      <div className="flex justify-center items-center mb-1">
                        <Clock className="h-4 w-4 text-blue-600 mr-1" />
                        <div className="text-sm text-blue-600">Avg Response Time</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {benchmarkResult.results.responseTime.avg.toFixed(0)} ms
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-md text-center">
                      <div className="flex justify-center items-center mb-1">
                        <MemoryStick className="h-4 w-4 text-purple-600 mr-1" />
                        <div className="text-sm text-purple-600">Avg Token Count</div>
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {benchmarkResult.results.tokenCount.avg.toFixed(0)}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-md text-center">
                      <div className="flex justify-center items-center mb-1">
                        <Zap className="h-4 w-4 text-green-600 mr-1" />
                        <div className="text-sm text-green-600">Throughput</div>
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {benchmarkResult.results.throughput.requestsPerSecond.toFixed(1)} req/s
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md text-center">
                      <div className="flex justify-center items-center mb-1">
                        <DollarSign className="h-4 w-4 text-yellow-600 mr-1" />
                        <div className="text-sm text-yellow-600">Cost per Request</div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-700">
                        ${benchmarkResult.results.costEstimate.perRequest.toFixed(5)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Response time chart */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Response Time Distribution</h3>
                    <div className="h-64">
                      <LazyMetricsChart
                        type="bar"
                        height={250}
                        data={generateResponseTimeChartData() || { labels: [], datasets: [] }}
                      />
                    </div>
                  </div>
                  
                  {/* Token count chart */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Token Count Distribution</h3>
                    <div className="h-64">
                      <LazyMetricsChart
                        type="bar"
                        height={250}
                        data={generateTokenCountChartData() || { labels: [], datasets: [] }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics">
                <div className="space-y-6">
                  {/* Response time metrics */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      Response Time Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Minimum</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.responseTime.min.toFixed(0)} ms
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Average</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.responseTime.avg.toFixed(0)} ms
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">90th Percentile</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.responseTime.p90.toFixed(0)} ms
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Maximum</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.responseTime.max.toFixed(0)} ms
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Token count metrics */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <MemoryStick className="h-5 w-5 mr-2 text-purple-600" />
                      Token Count Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Minimum</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.tokenCount.min.toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Average</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.tokenCount.avg.toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">90th Percentile</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.tokenCount.p90.toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Maximum</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.tokenCount.max.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resource usage metrics */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <Cpu className="h-5 w-5 mr-2 text-green-600" />
                      Resource Usage Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Memory Usage (Avg)</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.memoryUsage.avg.toFixed(0)} MB
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Error Rate</div>
                        <div className="text-xl font-bold">
                          {benchmarkResult.results.errorRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <div className="text-sm text-gray-500">Total Cost</div>
                        <div className="text-xl font-bold">
                          ${benchmarkResult.results.costEstimate.total.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {benchmarkResult.compareResults && (
                <TabsContent value="comparison">
                  <div className="space-y-6">
                    {/* Comparison chart */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Performance Comparison</h3>
                      <div className="h-64">
                        <LazyMetricsChart
                          type="bar"
                          height={250}
                          data={generateComparisonChartData() || { labels: [], datasets: [] }}
                        />
                      </div>
                    </div>
                    
                    {/* Comparison table */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Detailed Comparison</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border p-2 text-left">Metric</th>
                              <th className="border p-2 text-left">{agent?.name || 'Current Agent'}</th>
                              <th className="border p-2 text-left">{benchmarkResult.compareResults.agentName || 'Comparison Agent'}</th>
                              <th className="border p-2 text-left">Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-gray-50">
                              <td className="border p-2 font-medium">Response Time (ms)</td>
                              <td className="border p-2">
                                {benchmarkResult.results.responseTime.avg.toFixed(0)}
                              </td>
                              <td className="border p-2">
                                {benchmarkResult.compareResults.responseTime.avg.toFixed(0)}
                              </td>
                              <td className="border p-2">
                                {(benchmarkResult.results.responseTime.avg - benchmarkResult.compareResults.responseTime.avg).toFixed(0)}
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border p-2 font-medium">Token Count</td>
                              <td className="border p-2">
                                {benchmarkResult.results.tokenCount.avg.toFixed(0)}
                              </td>
                              <td className="border p-2">
                                {benchmarkResult.compareResults.tokenCount.avg.toFixed(0)}
                              </td>
                              <td className="border p-2">
                                {(benchmarkResult.results.tokenCount.avg - benchmarkResult.compareResults.tokenCount.avg).toFixed(0)}
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border p-2 font-medium">Cost per Request ($)</td>
                              <td className="border p-2">
                                {benchmarkResult.results.costEstimate.perRequest.toFixed(5)}
                              </td>
                              <td className="border p-2">
                                {benchmarkResult.compareResults.costEstimate.perRequest.toFixed(5)}
                              </td>
                              <td className="border p-2">
                                {(benchmarkResult.results.costEstimate.perRequest - benchmarkResult.compareResults.costEstimate.perRequest).toFixed(5)}
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border p-2 font-medium">Throughput (req/s)</td>
                              <td className="border p-2">
                                {benchmarkResult.results.throughput.requestsPerSecond.toFixed(1)}
                              </td>
                              <td className="border p-2">
                                {benchmarkResult.compareResults.throughput.requestsPerSecond.toFixed(1)}
                              </td>
                              <td className="border p-2">
                                {(benchmarkResult.results.throughput.requestsPerSecond - benchmarkResult.compareResults.throughput.requestsPerSecond).toFixed(1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Benchmark Results</h3>
              <p className="text-gray-500 mt-2">
                Run a benchmark to measure your agent's performance
              </p>
              <div className="mt-4">
                <Button
                  onClick={handleRunBenchmark}
                  disabled={isBenchmarking}
                >
                  {isBenchmarking ? 'Running...' : 'Run Benchmark'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-gray-500">
          {benchmarkResult && (
            <span>Benchmark completed at {new Date(benchmarkResult.completedAt).toLocaleString()}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
