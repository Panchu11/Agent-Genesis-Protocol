'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import LazyEnhancedMetricsChart from './LazyEnhancedMetricsChart';
import { StoredAgent } from '@/app/lib/db/agentStorage';

interface AgentVersion {
  version: number;
  agent: StoredAgent;
  metrics: Record<string, number>;
  timestamp: string;
  improvements?: string[];
}

interface AgentEvolutionTimelineProps {
  agentVersions: AgentVersion[];
  title?: string;
  description?: string;
}

export default function AgentEvolutionTimeline({ 
  agentVersions, 
  title = 'Agent Evolution Timeline', 
  description = 'Track agent performance metrics over time'
}: AgentEvolutionTimelineProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [colorScheme, setColorScheme] = useState<'default' | 'pastel' | 'vibrant' | 'monochrome'>('vibrant');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  
  // Sort versions by version number
  const sortedVersions = [...agentVersions].sort((a, b) => a.version - b.version);
  
  // Extract all available metrics
  const allMetrics = Array.from(
    new Set(
      agentVersions.flatMap(({ metrics }) => Object.keys(metrics))
    )
  ).sort();
  
  // If no metrics are selected, select all by default
  const effectiveSelectedMetrics = selectedMetrics.length > 0 
    ? selectedMetrics 
    : allMetrics;
  
  // Prepare data for timeline chart
  const timelineData = {
    labels: sortedVersions.map(v => `v${v.version}`),
    datasets: effectiveSelectedMetrics.map((metric, index) => ({
      label: metric.replace(/_/g, ' '),
      data: sortedVersions.map(v => v.metrics[metric] || 0),
      borderWidth: 2,
      tension: 0.3,
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
  
  // Get the selected version details
  const selectedVersionDetails = selectedVersion !== null
    ? sortedVersions.find(v => v.version === selectedVersion)
    : null;
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">
              Evolution Timeline
            </div>
            
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
          
          <LazyEnhancedMetricsChart
            type="line"
            data={timelineData}
            height={400}
            colorScheme={colorScheme}
            interactive={false}
          />
          
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Version History</div>
            <div className="flex flex-wrap gap-2">
              {sortedVersions.map((version) => (
                <Button
                  key={version.version}
                  variant={selectedVersion === version.version ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVersion(version.version)}
                >
                  v{version.version}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedVersionDetails && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Version {selectedVersionDetails.version} Details</CardTitle>
            <CardDescription>
              {new Date(selectedVersionDetails.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedVersionDetails.improvements && selectedVersionDetails.improvements.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Improvements</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedVersionDetails.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm">{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-2">Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(selectedVersionDetails.metrics).map(([metric, value]) => (
                    <div key={metric} className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">{metric.replace(/_/g, ' ')}</div>
                      <div className="text-lg font-semibold">{value.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Personality Traits</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedVersionDetails.agent.personality, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
