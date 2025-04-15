'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { useNotification } from '@/app/context/NotificationContext';
import { 
  getMarketplaceAnalytics, 
  getMarketplaceTrendAnalysis,
  AnalyticsPeriod,
  MarketplaceAnalytics,
  CategoryAnalytics,
  AgentPerformance
} from '@/app/lib/services/marketplaceAnalytics';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Define color schemes
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57'];
const CHART_LINE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export default function MarketplaceAnalyticsPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // State for analytics data
  const [analytics, setAnalytics] = useState<MarketplaceAnalytics | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'agents' | 'users'>('overview');
  
  // Define time periods
  const periods: AnalyticsPeriod[] = [
    { label: 'Last 24 Hours', value: 'day' },
    { label: 'Last 7 Days', value: 'week' },
    { label: 'Last 30 Days', value: 'month' },
    { label: 'Last Year', value: 'year' },
    { label: 'All Time', value: 'all' }
  ];
  
  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if user is authenticated
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/auth/login?redirectedFrom=/marketplace/analytics');
          return;
        }
        
        // Check if user has admin role
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        const isAdmin = userRoles?.role === 'admin';
        
        if (!isAdmin) {
          showNotification({
            id: 'permission-error',
            title: 'Access Denied',
            message: 'You do not have permission to view this page.',
            type: 'error'
          });
          router.push('/marketplace');
          return;
        }
        
        // Load analytics data
        const analyticsData = await getMarketplaceAnalytics(selectedPeriod);
        setAnalytics(analyticsData);
        
        // Load trend analysis
        const trendsData = await getMarketplaceTrendAnalysis();
        setTrendAnalysis(trendsData);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalytics();
  }, [router, selectedPeriod, showNotification]);
  
  // Handle period change
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as 'day' | 'week' | 'month' | 'year' | 'all');
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    switch (selectedPeriod) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
      case 'month':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case 'year':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Format large numbers
  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace Analytics</h1>
          <p className="mt-2 text-lg text-gray-600">
            Comprehensive analytics and insights for the Agent Marketplace
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Link href="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.total_agents}</div>
                  <div className="text-sm text-gray-500">Total Agents</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatNumber(analytics.total_downloads)}</div>
                  <div className="text-sm text-gray-500">Total Downloads</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(analytics.total_revenue)}</div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.average_rating.toFixed(1)}</div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Downloads and Revenue Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Downloads Trend</CardTitle>
                    <CardDescription>
                      Agent downloads over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analytics.downloads_trend.map(point => ({
                            date: formatDate(point.date),
                            Downloads: point.value
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="Downloads"
                            stroke={CHART_LINE_COLORS[0]}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>
                      Revenue generated over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analytics.revenue_trend.map(point => ({
                            date: formatDate(point.date),
                            Revenue: point.value
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis tickFormatter={(value) => `$${value}`} />
                          <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="Revenue"
                            stroke={CHART_LINE_COLORS[1]}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>
                    Distribution of agents across categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.category_distribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="name"
                          >
                            {analytics.category_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Top Categories</h3>
                      <div className="space-y-2">
                        {analytics.category_distribution
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 5)
                          .map((category, index) => (
                            <div key={category.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span>{category.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">{category.count} agents</span>
                                <span className="text-gray-500">({formatPercentage(category.percentage)})</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              {trendAnalysis && (
                <>
                  {/* Market Growth */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Market Growth</CardTitle>
                      <CardDescription>
                        Growth in marketplace activity over different time periods
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={trendAnalysis.market_growth}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Growth']} />
                            <Legend />
                            <Bar dataKey="growth" name="Growth %" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Trending Categories and Agents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Trending Categories</CardTitle>
                        <CardDescription>
                          Categories with the highest growth rate
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {trendAnalysis.trending_categories.map((category, index) => (
                            <div key={category.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-600 font-medium">{index + 1}</span>
                                </div>
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="text-green-600 font-medium">
                                +{category.growth.toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Trending Agents</CardTitle>
                        <CardDescription>
                          Agents with the highest growth in downloads
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {trendAnalysis.trending_agents.map((agent, index) => (
                            <div key={agent.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-600 font-medium">{index + 1}</span>
                                </div>
                                <span className="font-medium">{agent.name}</span>
                              </div>
                              <div className="text-green-600 font-medium">
                                +{agent.growth.toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link href="/marketplace" className="text-sm text-indigo-600 hover:text-indigo-800">
                          View all agents →
                        </Link>
                      </CardFooter>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
            
            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              {/* Top Performing Agents */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Agents</CardTitle>
                  <CardDescription>
                    Agents with the highest downloads and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Rank</th>
                          <th className="text-left py-3 px-4">Agent Name</th>
                          <th className="text-right py-3 px-4">Downloads</th>
                          <th className="text-right py-3 px-4">Rating</th>
                          <th className="text-right py-3 px-4">Reviews</th>
                          <th className="text-right py-3 px-4">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.top_performing_agents.map((agent, index) => (
                          <tr key={agent.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4">
                              <Link href={`/marketplace/${agent.id}`} className="text-indigo-600 hover:text-indigo-800">
                                {agent.name}
                              </Link>
                            </td>
                            <td className="text-right py-3 px-4">{agent.downloads}</td>
                            <td className="text-right py-3 px-4">{agent.rating.toFixed(1)}</td>
                            <td className="text-right py-3 px-4">{agent.reviews_count}</td>
                            <td className="text-right py-3 px-4">{formatCurrency(agent.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/marketplace" className="text-sm text-indigo-600 hover:text-indigo-800">
                    View all agents →
                  </Link>
                </CardFooter>
              </Card>
              
              {/* Agent Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance Metrics</CardTitle>
                  <CardDescription>
                    Key performance indicators for marketplace agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Downloads vs. Rating</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analytics.top_performing_agents.slice(0, 5)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="downloads" name="Downloads" fill="#8884d8" />
                            <Bar yAxisId="right" dataKey="rating" name="Rating" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Revenue by Agent</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analytics.top_performing_agents.slice(0, 5)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `$${value}`} />
                            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* User Analytics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(analytics.user_analytics.total_users)}</div>
                      <div className="text-sm text-gray-500">Total Users</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(analytics.user_analytics.active_users)}</div>
                      <div className="text-sm text-gray-500">Active Users</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(analytics.user_analytics.new_users)}</div>
                      <div className="text-sm text-gray-500">New Users</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(analytics.user_analytics.returning_users)}</div>
                      <div className="text-sm text-gray-500">Returning Users</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* User Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>
                    User activity and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">User Composition</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'New Users', value: analytics.user_analytics.new_users },
                                { name: 'Returning Users', value: analytics.user_analytics.returning_users }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#0088FE" />
                              <Cell fill="#00C49F" />
                            </Pie>
                            <Tooltip formatter={(value, name) => [formatNumber(value as number), name]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">User Activity</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Total Users', value: analytics.user_analytics.total_users },
                              { name: 'Active Users', value: analytics.user_analytics.active_users },
                              { name: 'New Users', value: analytics.user_analytics.new_users },
                              { name: 'Returning Users', value: analytics.user_analytics.returning_users }
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [formatNumber(value as number), 'Users']} />
                            <Legend />
                            <Bar dataKey="value" name="Users" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
