'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/common/Dialog';
import { Button } from '@/app/components/common/Button';
import { Input } from '@/app/components/common/Input';
import { Label } from '@/app/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { Textarea } from '@/app/components/common/Textarea';
import { Switch } from '@/app/components/common/Switch';
import { AlertRule, AlertSeverity, AlertType, createAlertRule } from '@/app/lib/services/alerting';
import { useNotification } from '@/app/context/NotificationContext';

interface CreateAlertRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentId: string;
  onCreateRule: (rule: AlertRule) => void;
}

export default function CreateAlertRuleModal({
  isOpen,
  onClose,
  deploymentId,
  onCreateRule
}: CreateAlertRuleModalProps) {
  const { showNotification } = useNotification();
  
  // State for form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AlertType>('error_rate');
  const [metric, setMetric] = useState('error_rate');
  const [operator, setOperator] = useState('>');
  const [threshold, setThreshold] = useState('5');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('warning');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Alert type options
  const alertTypes: { value: AlertType; label: string }[] = [
    { value: 'error_rate', label: 'Error Rate' },
    { value: 'latency', label: 'Latency' },
    { value: 'cost', label: 'Cost' },
    { value: 'request_volume', label: 'Request Volume' },
    { value: 'uptime', label: 'Uptime' },
    { value: 'memory_usage', label: 'Memory Usage' },
    { value: 'cpu_usage', label: 'CPU Usage' },
    { value: 'storage_usage', label: 'Storage Usage' },
    { value: 'custom', label: 'Custom' }
  ];
  
  // Metric options based on type
  const getMetricOptions = () => {
    switch (type) {
      case 'error_rate':
        return [
          { value: 'error_rate', label: 'Error Rate (%)' },
          { value: 'errors', label: 'Error Count' }
        ];
      case 'latency':
        return [
          { value: 'latency', label: 'Average Latency (ms)' },
          { value: 'p95_latency', label: '95th Percentile Latency (ms)' },
          { value: 'p99_latency', label: '99th Percentile Latency (ms)' }
        ];
      case 'cost':
        return [
          { value: 'cost', label: 'Total Cost ($)' },
          { value: 'cost_per_request', label: 'Cost per Request ($)' }
        ];
      case 'request_volume':
        return [
          { value: 'requests', label: 'Request Count' },
          { value: 'requests_per_minute', label: 'Requests per Minute' }
        ];
      case 'uptime':
        return [
          { value: 'uptime', label: 'Uptime (seconds)' },
          { value: 'uptime_percentage', label: 'Uptime (%)' }
        ];
      case 'memory_usage':
        return [
          { value: 'memory_usage', label: 'Memory Usage (MB)' },
          { value: 'memory_usage_percentage', label: 'Memory Usage (%)' }
        ];
      case 'cpu_usage':
        return [
          { value: 'cpu_usage', label: 'CPU Usage (cores)' },
          { value: 'cpu_usage_percentage', label: 'CPU Usage (%)' }
        ];
      case 'storage_usage':
        return [
          { value: 'storage_usage', label: 'Storage Usage (GB)' },
          { value: 'storage_usage_percentage', label: 'Storage Usage (%)' }
        ];
      case 'custom':
        return [
          { value: 'custom', label: 'Custom Metric' }
        ];
      default:
        return [];
    }
  };
  
  // Operator options
  const operatorOptions = [
    { value: '>', label: '>' },
    { value: '>=', label: '>=' },
    { value: '<', label: '<' },
    { value: '<=', label: '<=' },
    { value: '==', label: '==' },
    { value: '!=', label: '!=' }
  ];
  
  // Severity options
  const severityOptions: { value: AlertSeverity; label: string }[] = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' }
  ];
  
  // Handle type change
  const handleTypeChange = (value: string) => {
    setType(value as AlertType);
    
    // Set default metric based on type
    const metricOptions = getMetricOptions();
    if (metricOptions.length > 0) {
      setMetric(metricOptions[0].value);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showNotification({
        id: 'create-rule-error',
        title: 'Validation Error',
        message: 'Please enter a name for the alert rule',
        type: 'error'
      });
      return;
    }
    
    if (!metric.trim()) {
      showNotification({
        id: 'create-rule-error',
        title: 'Validation Error',
        message: 'Please select a metric',
        type: 'error'
      });
      return;
    }
    
    if (!threshold.trim() || isNaN(parseFloat(threshold))) {
      showNotification({
        id: 'create-rule-error',
        title: 'Validation Error',
        message: 'Please enter a valid threshold value',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the alert rule
      const rule = await createAlertRule(deploymentId, {
        name,
        description,
        type,
        condition: {
          metric,
          operator: operator as any,
          threshold: parseFloat(threshold),
          duration: duration ? parseInt(duration) : undefined
        },
        severity,
        enabled,
        notificationChannels: []
      });
      
      // Call the onCreateRule callback
      onCreateRule(rule);
      
      // Reset form
      setName('');
      setDescription('');
      setType('error_rate');
      setMetric('error_rate');
      setOperator('>');
      setThreshold('5');
      setDuration('');
      setSeverity('warning');
      setEnabled(true);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error creating alert rule:', error);
      showNotification({
        id: 'create-rule-error',
        title: 'Error',
        message: 'Failed to create alert rule',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Alert Rule</DialogTitle>
          <DialogDescription>
            Configure an alert rule for your deployment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter alert rule name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter alert rule description"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Alert Type</Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select alert type" />
                </SelectTrigger>
                <SelectContent>
                  {alertTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as AlertSeverity)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Condition</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {getMetricOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="Threshold"
                type="number"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Optional, in seconds)</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration in seconds"
              type="number"
            />
            <p className="text-xs text-gray-500">
              If specified, the condition must be true for this duration before triggering an alert.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="enabled">Enable this alert rule</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Alert Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
