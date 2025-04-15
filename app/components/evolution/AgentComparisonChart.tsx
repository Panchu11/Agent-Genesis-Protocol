'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import LazyEnhancedMetricsChart from './LazyEnhancedMetricsChart';
import { StoredAgent } from '@/app/lib/db/agentStorage';

interface AgentComparisonChartProps {
  agents: {
    agent: StoredAgent;
    metrics: Record<string, number>;
  }[];
  title?: string;
  description?: string;
}

export default function AgentComparisonChart({ 
  agents, 
  title = 'Agent Comparison', 
  description = 'Compare performance metrics across multiple agents'
}: AgentComparisonChartProps) {
  const [activeTab, setActiveTab] = useState<'radar' | 'bar' | 'table'>('radar');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [colorScheme, setColorScheme] = useState<'default' | 'pastel' | 'vibrant' | 'monochrome'>('default');
  
  // Extract all available metrics
  const allMetrics = Array.from(
    new Set(
      agents.flatMap(({ metrics }) => Object.keys(metrics))
    )
  ).sort();
  
  // If no metrics are selected, select all by default
  const effectiveSelectedMetrics = selectedMetrics.length > 0 
    ? selectedMetrics 
    : allMetrics;
  
  // Prepare data for charts
  const chartData = {
    labels: effectiveSelectedMetrics,
    datasets: agents.map(({ agent, metrics }, index) => ({
      label: agent.name,
      data: effectiveSelectedMetrics.map(metric => metrics[metric] || 0),
      borderWidth: 2,
      pointBackgroundColor: '#fff',
    })),
  };
  
  // Toggle metric selection
  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };
  
  // Select all metrics
  const selectAllMetrics = () => {
    setSelectedMetrics(allMetrics);
  };
  
  // Clear all selected metrics
  const clearSelectedMetrics = () => {
    setSelectedMetrics([]);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="radar">Radar Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              <TabsTrigger value="table">Data Table</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="default">Default Colors</option>
                <option value="pastel">Pastel</option>
                <option value="vibrant">Vibrant</option>
                <option value="monochrome">Monochrome</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectAllMetrics}
              className="text-xs"
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearSelectedMetrics}
              className="text-xs"
            >
              Clear All
            </Button>
            {allMetrics.map(metric => (
              <Button
                key={metric}
                variant={effectiveSelectedMetrics.includes(metric) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMetric(metric)}
                className="text-xs"
              >
                {metric.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
          
          <TabsContent value="radar" className="pt-4">
            <LazyEnhancedMetricsChart
              type="radar"
              data={chartData}
              height={400}
              colorScheme={colorScheme}
              interactive={false}
            />
          </TabsContent>
          
          <TabsContent value="bar" className="pt-4">
            <LazyEnhancedMetricsChart
              type="bar"
              data={chartData}
              height={400}
              colorScheme={colorScheme}
              interactive={false}
            />
          </TabsContent>
          
          <TabsContent value="table" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Metric</th>
                    {agents.map(({ agent }) => (
                      <th key={agent.id} className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {agent.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {effectiveSelectedMetrics.map(metric => (
                    <tr key={metric} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm font-medium">
                        {metric.replace(/_/g, ' ')}
                      </td>
                      {agents.map(({ agent, metrics }) => (
                        <td key={`${agent.id}-${metric}`} className="px-4 py-2 text-sm">
                          {metrics[metric] !== undefined ? metrics[metric].toFixed(2) : 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        {agents.length} agents compared across {effectiveSelectedMetrics.length} metrics
      </CardFooter>
    </Card>
  );
}
