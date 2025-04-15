'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Badge } from '@/app/components/common/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { 
  getAgentTestAnalytics,
  TestAnalytics,
  TestTypeBreakdown,
  TestTrend
} from '@/app/lib/services/testAnalytics';
import { useNotification } from '@/app/context/NotificationContext';
import { BarChart, LineChart, PieChart, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import LazyMetricsChart from '@/app/components/evolution/LazyMetricsChart';

interface TestResultsDashboardProps {
  agentId: string;
}

export default function TestResultsDashboard({ agentId }: TestResultsDashboardProps) {
  const { showNotification } = useNotification();
  
  // State for analytics
  const [analytics, setAnalytics] = useState<TestAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for time range
  const [timeRange, setTimeRange] = useState<number>(30);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Load analytics
  useEffect(() => {
    loadAnalytics();
  }, [agentId, timeRange]);
  
  // Load analytics
  const loadAnalytics = async () => {
    if (!agentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get analytics
      const data = await getAgentTestAnalytics(agentId, timeRange);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(error.message || 'An unexpected error occurred');
      
      showNotification({
        id: 'analytics-error',
        title: 'Error',
        message: error.message || 'Failed to load analytics',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate success rate chart data
  const generateSuccessRateChartData = () => {
    if (!analytics) return null;
    
    return {
      labels: ['Passed', 'Failed', 'Error', 'Skipped'],
      datasets: [
        {
          label: 'Test Results',
          data: [
            analytics.summary.passedTests,
            analytics.summary.failedTests,
            analytics.summary.errorTests,
            analytics.summary.skippedTests
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)', // Green
            'rgba(239, 68, 68, 0.7)',  // Red
            'rgba(245, 158, 11, 0.7)', // Yellow
            'rgba(156, 163, 175, 0.7)' // Gray
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Generate type breakdown chart data
  const generateTypeBreakdownChartData = () => {
    if (!analytics || !analytics.typeBreakdown || analytics.typeBreakdown.length === 0) return null;
    
    return {
      labels: analytics.typeBreakdown.map(item => item.type),
      datasets: [
        {
          label: 'Total Tests',
          data: analytics.typeBreakdown.map(item => item.total),
          backgroundColor: 'rgba(99, 102, 241, 0.7)', // Indigo
          borderWidth: 1
        },
        {
          label: 'Passed Tests',
          data: analytics.typeBreakdown.map(item => item.passed),
          backgroundColor: 'rgba(16, 185, 129, 0.7)', // Green
          borderWidth: 1
        }
      ]
    };
  };
  
  // Generate trends chart data
  const generateTrendsChartData = () => {
    if (!analytics || !analytics.trends || analytics.trends.length === 0) return null;
    
    return {
      labels: analytics.trends.map(item => item.date),
      datasets: [
        {
          label: 'Success Rate (%)',
          data: analytics.trends.map(item => item.successRate),
          borderColor: 'rgb(16, 185, 129)', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Total Tests',
          data: analytics.trends.map(item => item.totalTests),
          borderColor: 'rgb(99, 102, 241)', // Indigo
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          yAxisID: 'y1',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Results Dashboard</CardTitle>
            <CardDescription>
              Analytics and insights from your test results
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              disabled={isLoading}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading analytics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <p>{error}</p>
          </div>
        ) : !analytics ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="flex items-center space-x-1">
                <BarChart className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="flex items-center space-x-1">
                <PieChart className="h-4 w-4" />
                <span>Breakdown</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center space-x-1">
                <LineChart className="h-4 w-4" />
                <span>Trends</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Summary metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <div className="text-sm text-gray-500">Total Tests</div>
                    <div className="text-2xl font-bold">{analytics.summary.totalTests}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-md text-center">
                    <div className="text-sm text-green-600">Success Rate</div>
                    <div className="text-2xl font-bold text-green-700">
                      {analytics.summary.successRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-md text-center">
                    <div className="text-sm text-blue-600">Avg Response Time</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {analytics.summary.avgResponseTime 
                        ? `${analytics.summary.avgResponseTime.toFixed(0)} ms` 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-md text-center">
                    <div className="text-sm text-purple-600">Total Cost</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {analytics.summary.totalCost 
                        ? `$${analytics.summary.totalCost.toFixed(4)}` 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Success rate chart */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Test Results Distribution</h3>
                  <div className="h-64">
                    <LazyMetricsChart
                      type="pie"
                      height={250}
                      data={generateSuccessRateChartData() || { labels: [], datasets: [] }}
                    />
                  </div>
                </div>
                
                {/* Most failed tests */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Most Failed Tests</h3>
                  {analytics.mostFailedTests.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No failed tests</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border p-2 text-left">Test Case</th>
                            <th className="border p-2 text-left">Failure Count</th>
                            <th className="border p-2 text-left">Last Run</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.mostFailedTests.map((test) => (
                            <tr key={test.testCaseId} className="hover:bg-gray-50">
                              <td className="border p-2">
                                {test.testCaseName}
                              </td>
                              <td className="border p-2">
                                <Badge className="bg-red-100 text-red-800">
                                  {test.failureCount}
                                </Badge>
                              </td>
                              <td className="border p-2 text-sm">
                                {new Date(test.lastRun).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="breakdown">
              <div className="space-y-6">
                {/* Type breakdown chart */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Test Type Breakdown</h3>
                  <div className="h-64">
                    <LazyMetricsChart
                      type="bar"
                      height={250}
                      data={generateTypeBreakdownChartData() || { labels: [], datasets: [] }}
                    />
                  </div>
                </div>
                
                {/* Type breakdown table */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Test Type Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Type</th>
                          <th className="border p-2 text-left">Total</th>
                          <th className="border p-2 text-left">Passed</th>
                          <th className="border p-2 text-left">Failed</th>
                          <th className="border p-2 text-left">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.typeBreakdown.map((item) => (
                          <tr key={item.type} className="hover:bg-gray-50">
                            <td className="border p-2 capitalize">
                              {item.type}
                            </td>
                            <td className="border p-2">
                              {item.total}
                            </td>
                            <td className="border p-2">
                              {item.passed}
                            </td>
                            <td className="border p-2">
                              {item.failed}
                            </td>
                            <td className="border p-2">
                              <Badge className={
                                item.successRate >= 80 ? 'bg-green-100 text-green-800' :
                                item.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {item.successRate.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Performance metrics */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Response Time (ms)</h4>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <div className="text-xs text-gray-500">Min</div>
                          <div className="font-medium">
                            {analytics.performanceMetrics.responseTime.min.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Max</div>
                          <div className="font-medium">
                            {analytics.performanceMetrics.responseTime.max.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Avg</div>
                          <div className="font-medium">
                            {analytics.performanceMetrics.responseTime.avg.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">P90</div>
                          <div className="font-medium">
                            {analytics.performanceMetrics.responseTime.p90.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {analytics.performanceMetrics.tokenCount && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Token Count</h4>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-500">Min</div>
                            <div className="font-medium">
                              {analytics.performanceMetrics.tokenCount.min.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Max</div>
                            <div className="font-medium">
                              {analytics.performanceMetrics.tokenCount.max.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Avg</div>
                            <div className="font-medium">
                              {analytics.performanceMetrics.tokenCount.avg.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">P90</div>
                            <div className="font-medium">
                              {analytics.performanceMetrics.tokenCount.p90.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="trends">
              <div className="space-y-6">
                {/* Trends chart */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Test Performance Trends</h3>
                  <div className="h-80">
                    <LazyMetricsChart
                      type="line"
                      height={300}
                      data={generateTrendsChartData() || { labels: [], datasets: [] }}
                      options={{
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Success Rate (%)'
                            },
                            min: 0,
                            max: 100
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Test Count'
                            },
                            min: 0,
                            grid: {
                              drawOnChartArea: false
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Trends table */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Daily Test Results</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Date</th>
                          <th className="border p-2 text-left">Total Tests</th>
                          <th className="border p-2 text-left">Passed</th>
                          <th className="border p-2 text-left">Failed</th>
                          <th className="border p-2 text-left">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.trends
                          .filter(item => item.totalTests > 0) // Only show days with tests
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
                          .slice(0, 10) // Show only the last 10 days with tests
                          .map((item) => (
                            <tr key={item.date} className="hover:bg-gray-50">
                              <td className="border p-2">
                                {new Date(item.date).toLocaleDateString()}
                              </td>
                              <td className="border p-2">
                                {item.totalTests}
                              </td>
                              <td className="border p-2">
                                {item.passedTests}
                              </td>
                              <td className="border p-2">
                                {item.failedTests}
                              </td>
                              <td className="border p-2">
                                <Badge className={
                                  item.successRate >= 80 ? 'bg-green-100 text-green-800' :
                                  item.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {item.successRate.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-sm text-gray-500">
          Data for the last {timeRange} days
        </div>
      </CardFooter>
    </Card>
  );
}
