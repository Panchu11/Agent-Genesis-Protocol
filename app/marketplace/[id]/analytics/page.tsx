'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { useNotification } from '@/app/context/NotificationContext';
import { getAgentPerformanceAnalytics, AnalyticsPeriod, AnalyticsDataPoint } from '@/app/lib/services/marketplaceAnalytics';
import { getMarketplaceAgentById, MarketplaceAgent } from '@/app/lib/services/marketplace';
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
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const CHART_LINE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export default function AgentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const agentId = params.id as string;
  
  // State for agent data
  const [agent, setAgent] = useState<MarketplaceAgent | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'downloads' | 'revenue' | 'ratings'>('overview');
  
  // Define time periods
  const periods: AnalyticsPeriod[] = [
    { label: 'Last 24 Hours', value: 'day' },
    { label: 'Last 7 Days', value: 'week' },
    { label: 'Last 30 Days', value: 'month' },
    { label: 'Last Year', value: 'year' },
    { label: 'All Time', value: 'all' }
  ];
  
  // Load agent and analytics data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if user is authenticated
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push(`/auth/login?redirectedFrom=/marketplace/${agentId}/analytics`);
          return;
        }
        
        // Get agent data
        const agentData = await getMarketplaceAgentById(agentId);
        
        if (!agentData) {
          setError('Agent not found');
          return;
        }
        
        setAgent(agentData);
        
        // Check if user is the agent owner or has admin role
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        const isAdmin = userRoles?.role === 'admin';
        const isOwner = agentData.user_id === user.id;
        
        if (!isAdmin && !isOwner) {
          showNotification({
            id: 'permission-error',
            title: 'Access Denied',
            message: 'You do not have permission to view analytics for this agent.',
            type: 'error'
          });
          router.push(`/marketplace/${agentId}`);
          return;
        }
        
        // Get analytics data
        const analyticsData = await getAgentPerformanceAnalytics(agentId, selectedPeriod);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error loading agent analytics:', err);
        setError('Failed to load agent analytics');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (agentId) {
      loadData();
    }
  }, [agentId, router, selectedPeriod, showNotification]);
  
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
  
  if (error || !agent || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Agent Analytics</h1>
          <Link href={`/marketplace/${agentId}`}>
            <Button variant="outline">Back to Agent</Button>
          </Link>
        </div>
        
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error || 'Failed to load agent analytics'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics: {agent.name}</h1>
          <p className="mt-2 text-lg text-gray-600">
            Performance metrics and insights
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
          
          <Link href={`/marketplace/${agentId}`}>
            <Button variant="outline">Back to Agent</Button>
          </Link>
        </div>
      </div>
      
      {/* Agent Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{agent.downloads}</div>
              <div className="text-sm text-gray-500">Total Downloads</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(agent.price)}</div>
              <div className="text-sm text-gray-500">Price</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{agent.rating.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Average Rating</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{agent.reviews_count}</div>
              <div className="text-sm text-gray-500">Reviews</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Downloads Trend</CardTitle>
                <CardDescription>
                  Downloads over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.downloads_trend.map((point: AnalyticsDataPoint) => ({
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
                      data={analytics.revenue_trend.map((point: AnalyticsDataPoint) => ({
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>
                  Distribution of ratings from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.rating_distribution}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Reviews" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>
                  Geographic distribution of users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.user_demographics.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="country"
                      >
                        {analytics.user_demographics.slice(0, 5).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Downloads Tab */}
        <TabsContent value="downloads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Downloads Over Time</CardTitle>
              <CardDescription>
                Detailed view of download activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.downloads_trend.map((point: AnalyticsDataPoint) => ({
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
              <CardTitle>User Demographics</CardTitle>
              <CardDescription>
                Geographic distribution of users who downloaded this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.user_demographics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="country"
                      >
                        {analytics.user_demographics.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Top Countries</h3>
                  <div className="space-y-4">
                    {analytics.user_demographics.slice(0, 10).map((country: any, index: number) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{country.country}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">{country.count} users</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Detailed view of revenue generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.revenue_trend.map((point: AnalyticsDataPoint) => ({
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
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
              <CardDescription>
                Key revenue metrics and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    {formatCurrency(agent.downloads * agent.price)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Lifetime revenue from {agent.downloads} downloads
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Price</h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    {formatCurrency(agent.price)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Current price per download
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Average Daily Revenue</h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    {formatCurrency(
                      analytics.revenue_trend.reduce((sum: number, point: AnalyticsDataPoint) => sum + point.value, 0) / 
                      (analytics.revenue_trend.length || 1)
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Based on selected time period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>
                Distribution of ratings from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.rating_distribution}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Reviews" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Rating Summary</h3>
                  <div className="space-y-4">
                    {analytics.rating_distribution.map((rating: any) => (
                      <div key={rating.rating} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 min-w-[80px]">
                          <span className="font-medium">{rating.rating}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div className="flex-grow bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-yellow-400 h-2.5 rounded-full"
                            style={{
                              width: `${(rating.count / analytics.rating_distribution.reduce((sum: number, r: any) => sum + r.count, 0)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="min-w-[50px] text-right">
                          <span className="text-sm text-gray-600">{rating.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-2">Average Rating</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{agent.rating.toFixed(1)}</span>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${i < Math.round(agent.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({agent.reviews_count} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
