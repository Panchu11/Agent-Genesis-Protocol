'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Badge } from '@/app/components/common/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Alert, AlertRule, getActiveAlerts, getAlertHistory, getAlertRules, useAlerts } from '@/app/lib/services/alerting';
import { useNotification } from '@/app/context/NotificationContext';
import { PlusCircle, Bell, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import CreateAlertRuleModal from './CreateAlertRuleModal';

interface AlertsPanelProps {
  deploymentId: string;
}

export default function AlertsPanel({ deploymentId }: AlertsPanelProps) {
  const { showNotification } = useNotification();
  const { acknowledgeAlert, resolveAlert } = useAlerts(deploymentId);
  
  // State for alerts and rules
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for modals
  const [isCreateRuleModalOpen, setIsCreateRuleModalOpen] = useState(false);
  
  // State for tabs
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'rules'>('active');
  
  // Load alerts and rules
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get active alerts
        const activeAlertsData = await getActiveAlerts(deploymentId);
        setActiveAlerts(activeAlertsData);
        
        // Get alert history
        const alertHistoryData = await getAlertHistory(deploymentId);
        setAlertHistory(alertHistoryData);
        
        // Get alert rules
        const alertRulesData = await getAlertRules(deploymentId);
        setAlertRules(alertRulesData);
      } catch (err) {
        console.error('Error loading alerts data:', err);
        setError('Failed to load alerts data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Set up polling for active alerts
    const intervalId = setInterval(() => {
      getActiveAlerts(deploymentId).then(data => {
        setActiveAlerts(data);
      }).catch(err => {
        console.error('Error polling active alerts:', err);
      });
    }, 30000); // Poll every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [deploymentId]);
  
  // Handle acknowledge alert
  const handleAcknowledgeAlert = async (alert: Alert) => {
    const success = await acknowledgeAlert(alert.id, alert.message);
    
    if (success) {
      // Update the alert in the list
      setActiveAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, status: 'acknowledged', acknowledgedAt: new Date().toISOString() } : a
      ));
    }
  };
  
  // Handle resolve alert
  const handleResolveAlert = async (alert: Alert) => {
    const success = await resolveAlert(alert.id, alert.message);
    
    if (success) {
      // Remove the alert from active alerts
      setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
      
      // Add the alert to history
      setAlertHistory(prev => [
        { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() },
        ...prev
      ]);
    }
  };
  
  // Handle create rule
  const handleCreateRule = (rule: AlertRule) => {
    // Add the rule to the list
    setAlertRules(prev => [rule, ...prev]);
    
    // Close the modal
    setIsCreateRuleModalOpen(false);
    
    // Show notification
    showNotification({
      id: 'create-rule-success',
      title: 'Alert Rule Created',
      message: `Alert rule "${rule.name}" has been created successfully`,
      type: 'success'
    });
  };
  
  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>Critical</span>
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" className="flex items-center space-x-1 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3" />
            <span>Warning</span>
          </Badge>
        );
      case 'info':
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>Info</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>{severity}</span>
          </Badge>
        );
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <Bell className="h-3 w-3" />
            <span>Active</span>
          </Badge>
        );
      case 'acknowledged':
        return (
          <Badge variant="warning" className="flex items-center space-x-1 bg-yellow-100 text-yellow-800">
            <CheckCircle className="h-3 w-3" />
            <span>Acknowledged</span>
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="flex items-center space-x-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            <span>Resolved</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>{status}</span>
          </Badge>
        );
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading alerts...</p>
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>
              Monitor and manage alerts for this deployment
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsCreateRuleModalOpen(true)}
            className="flex items-center space-x-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Alert Rule</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="active" className="flex items-center space-x-1">
              <Bell className="h-4 w-4" />
              <span>Active Alerts</span>
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">{activeAlerts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Alert History</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Alert Rules</span>
              {alertRules.length > 0 && (
                <Badge variant="outline" className="ml-2">{alertRules.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                        </div>
                        <h3 className="text-lg font-medium">{alert.message}</h3>
                        <p className="text-sm text-gray-500">
                          Triggered at {formatTimestamp(alert.triggeredAt)}
                        </p>
                        {alert.acknowledgedAt && (
                          <p className="text-sm text-gray-500">
                            Acknowledged at {formatTimestamp(alert.acknowledgedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {alert.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeAlert(alert)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleResolveAlert(alert)}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Details</h4>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(alert.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {alertHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No alert history</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left">Severity</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Message</th>
                      <th className="border p-2 text-left">Triggered At</th>
                      <th className="border p-2 text-left">Resolved At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertHistory.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="border p-2">
                          {getSeverityBadge(alert.severity)}
                        </td>
                        <td className="border p-2">
                          {getStatusBadge(alert.status)}
                        </td>
                        <td className="border p-2">
                          {alert.message}
                        </td>
                        <td className="border p-2 text-sm">
                          {formatTimestamp(alert.triggeredAt)}
                        </td>
                        <td className="border p-2 text-sm">
                          {alert.resolvedAt ? formatTimestamp(alert.resolvedAt) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rules">
            {alertRules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No alert rules configured</p>
                <Button
                  onClick={() => setIsCreateRuleModalOpen(true)}
                  className="mt-4"
                >
                  Create Alert Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          {getSeverityBadge(rule.severity)}
                          <Badge variant={rule.enabled ? 'outline' : 'secondary'} className="bg-gray-100 text-gray-800">
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-medium">{rule.name}</h3>
                        {rule.description && (
                          <p className="text-sm text-gray-500">{rule.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          variant={rule.enabled ? 'secondary' : 'outline'}
                          size="sm"
                        >
                          {rule.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                      <div className="mt-1 bg-gray-50 p-2 rounded">
                        <code className="text-sm">
                          {rule.condition.metric} {rule.condition.operator} {rule.condition.threshold}
                          {rule.condition.duration ? ` for ${rule.condition.duration} seconds` : ''}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-gray-500">
          {activeAlerts.length > 0 ? (
            <span className="text-red-500 font-medium">{activeAlerts.length} active alerts</span>
          ) : (
            <span>No active alerts</span>
          )}
        </div>
      </CardFooter>
      
      {/* Create Alert Rule Modal */}
      <CreateAlertRuleModal
        isOpen={isCreateRuleModalOpen}
        onClose={() => setIsCreateRuleModalOpen(false)}
        deploymentId={deploymentId}
        onCreateRule={handleCreateRule}
      />
    </Card>
  );
}
