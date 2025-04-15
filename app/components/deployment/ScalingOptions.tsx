'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Input } from '@/app/components/common/Input';
import { Label } from '@/app/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { Switch } from '@/app/components/common/Switch';
import { Slider } from '@/app/components/common/Slider';
import { configureDeploymentScaling, updateDeploymentInstances } from '@/app/lib/services/agentDeployment';
import { useNotification } from '@/app/context/NotificationContext';

interface ScalingOptionsProps {
  deploymentId: string;
  configuration: {
    scaling?: {
      min?: number;
      max?: number;
      target?: number;
      autoScaling?: boolean;
      metric?: 'cpu' | 'memory' | 'requests';
      threshold?: number;
      cooldown?: number;
    };
  };
  metrics?: {
    instances?: number;
    cpu_usage?: number;
    memory_usage?: number;
    requests?: number;
  };
  onUpdate?: () => void;
}

export default function ScalingOptions({
  deploymentId,
  configuration,
  metrics,
  onUpdate
}: ScalingOptionsProps) {
  const { showNotification } = useNotification();
  
  // Get scaling configuration
  const scaling = configuration?.scaling || {};
  
  // State for form
  const [min, setMin] = useState<number>(scaling.min || 1);
  const [max, setMax] = useState<number>(scaling.max || 10);
  const [target, setTarget] = useState<number>(scaling.target || 1);
  const [autoScaling, setAutoScaling] = useState<boolean>(scaling.autoScaling || false);
  const [metric, setMetric] = useState<'cpu' | 'memory' | 'requests'>(scaling.metric || 'cpu');
  const [threshold, setThreshold] = useState<number>(scaling.threshold || 70);
  const [cooldown, setCooldown] = useState<number>(scaling.cooldown || 300);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentInstances, setCurrentInstances] = useState<number>(metrics?.instances || 1);
  
  // Update state when configuration changes
  useEffect(() => {
    const scaling = configuration?.scaling || {};
    setMin(scaling.min || 1);
    setMax(scaling.max || 10);
    setTarget(scaling.target || 1);
    setAutoScaling(scaling.autoScaling || false);
    setMetric(scaling.metric || 'cpu');
    setThreshold(scaling.threshold || 70);
    setCooldown(scaling.cooldown || 300);
  }, [configuration]);
  
  // Update current instances when metrics change
  useEffect(() => {
    setCurrentInstances(metrics?.instances || 1);
  }, [metrics]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Configure scaling
      const success = await configureDeploymentScaling(deploymentId, {
        min,
        max,
        target,
        autoScaling,
        metric,
        threshold,
        cooldown
      });
      
      if (success) {
        showNotification({
          id: 'scaling-success',
          title: 'Scaling Configuration Updated',
          message: 'The scaling configuration has been updated successfully',
          type: 'success'
        });
        
        // Call onUpdate callback
        if (onUpdate) {
          onUpdate();
        }
      } else {
        showNotification({
          id: 'scaling-error',
          title: 'Error',
          message: 'Failed to update scaling configuration',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error configuring scaling:', error);
      showNotification({
        id: 'scaling-error',
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle manual scaling
  const handleManualScale = async (instances: number) => {
    setIsSubmitting(true);
    
    try {
      // Update instances
      const success = await updateDeploymentInstances(deploymentId, instances);
      
      if (success) {
        showNotification({
          id: 'scaling-success',
          title: 'Instances Updated',
          message: `The number of instances has been updated to ${instances}`,
          type: 'success'
        });
        
        // Update current instances
        setCurrentInstances(instances);
        
        // Call onUpdate callback
        if (onUpdate) {
          onUpdate();
        }
      } else {
        showNotification({
          id: 'scaling-error',
          title: 'Error',
          message: 'Failed to update instances',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating instances:', error);
      showNotification({
        id: 'scaling-error',
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get metric display name
  const getMetricDisplayName = (metricName: string) => {
    switch (metricName) {
      case 'cpu':
        return 'CPU Usage';
      case 'memory':
        return 'Memory Usage';
      case 'requests':
        return 'Request Rate';
      default:
        return metricName;
    }
  };
  
  // Get current metric value
  const getCurrentMetricValue = () => {
    if (!metrics) return 'N/A';
    
    switch (metric) {
      case 'cpu':
        return metrics.cpu_usage !== undefined ? `${metrics.cpu_usage.toFixed(1)}%` : 'N/A';
      case 'memory':
        return metrics.memory_usage !== undefined ? `${metrics.memory_usage.toFixed(1)}%` : 'N/A';
      case 'requests':
        return metrics.requests !== undefined ? `${metrics.requests} req/min` : 'N/A';
      default:
        return 'N/A';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scaling Options</CardTitle>
        <CardDescription>
          Configure how your agent deployment scales based on load
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Instances */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Current Instances</Label>
              <span className="text-lg font-medium">{currentInstances}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleManualScale(Math.max(currentInstances - 1, 1))}
                disabled={isSubmitting || currentInstances <= 1}
              >
                -
              </Button>
              <div className="flex-grow">
                <Slider
                  value={[currentInstances]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => handleManualScale(value[0])}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleManualScale(Math.min(currentInstances + 1, 10))}
                disabled={isSubmitting || currentInstances >= 10}
              >
                +
              </Button>
            </div>
          </div>
          
          {/* Auto-scaling Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-scaling"
              checked={autoScaling}
              onCheckedChange={setAutoScaling}
            />
            <Label htmlFor="auto-scaling">Enable Auto-scaling</Label>
          </div>
          
          {/* Auto-scaling Configuration */}
          {autoScaling && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Minimum Instances</Label>
                  <Input
                    id="min"
                    type="number"
                    min={1}
                    max={max}
                    value={min}
                    onChange={(e) => setMin(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Maximum Instances</Label>
                  <Input
                    id="max"
                    type="number"
                    min={min}
                    max={20}
                    value={max}
                    onChange={(e) => setMax(parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metric">Scaling Metric</Label>
                <Select value={metric} onValueChange={(value) => setMetric(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpu">CPU Usage</SelectItem>
                    <SelectItem value="memory">Memory Usage</SelectItem>
                    <SelectItem value="requests">Request Rate</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Current: {getCurrentMetricValue()}</span>
                  <span>Threshold: {threshold}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold ({threshold}%)</Label>
                <Slider
                  id="threshold"
                  value={[threshold]}
                  min={10}
                  max={90}
                  step={5}
                  onValueChange={(value) => setThreshold(value[0])}
                />
                <p className="text-xs text-gray-500">
                  Scale up when {getMetricDisplayName(metric)} exceeds {threshold}%, scale down when below {threshold / 2}%
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cooldown">Cooldown Period (seconds)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  min={60}
                  max={3600}
                  value={cooldown}
                  onChange={(e) => setCooldown(parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  Minimum time between scaling actions
                </p>
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Configuration'}
              </Button>
            </form>
          )}
          
          {/* Scaling Presets */}
          {!autoScaling && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Scaling Presets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMin(1);
                    setMax(3);
                    setMetric('cpu');
                    setThreshold(70);
                    setCooldown(300);
                    setAutoScaling(true);
                  }}
                >
                  Low Traffic
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMin(2);
                    setMax(5);
                    setMetric('cpu');
                    setThreshold(60);
                    setCooldown(180);
                    setAutoScaling(true);
                  }}
                >
                  Medium Traffic
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMin(3);
                    setMax(10);
                    setMetric('requests');
                    setThreshold(50);
                    setCooldown(120);
                    setAutoScaling(true);
                  }}
                >
                  High Traffic
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          {autoScaling ? (
            <span>Auto-scaling enabled</span>
          ) : (
            <span>Manual scaling mode</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
