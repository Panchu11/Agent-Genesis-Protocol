'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { MonitoringMetrics } from './monitoring';
import { useNotification } from '@/app/context/NotificationContext';

/**
 * Alerting Service
 * 
 * This service provides functions for configuring and managing alerts
 * for deployed agents.
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type AlertType = 
  | 'error_rate' 
  | 'latency' 
  | 'cost' 
  | 'request_volume' 
  | 'uptime' 
  | 'memory_usage'
  | 'cpu_usage'
  | 'storage_usage'
  | 'custom';

export interface AlertRule {
  id: string;
  deploymentId: string;
  name: string;
  description?: string;
  type: AlertType;
  condition: {
    metric: string;
    operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
    threshold: number;
    duration?: number; // Duration in seconds for the condition to be true before triggering
  };
  severity: AlertSeverity;
  enabled: boolean;
  notificationChannels: string[]; // IDs of notification channels
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  deploymentId: string;
  status: AlertStatus;
  severity: AlertSeverity;
  message: string;
  details: Record<string, any>;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'slack' | 'in_app';
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create an alert rule
 * 
 * @param deploymentId The ID of the deployment
 * @param rule The alert rule to create
 * @returns The created alert rule
 */
export async function createAlertRule(
  deploymentId: string,
  rule: Omit<AlertRule, 'id' | 'deploymentId' | 'createdAt' | 'updatedAt'>
): Promise<AlertRule> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('alert_rules')
      .insert({
        deployment_id: deploymentId,
        name: rule.name,
        description: rule.description,
        type: rule.type,
        condition: rule.condition,
        severity: rule.severity,
        enabled: rule.enabled,
        notification_channels: rule.notificationChannels
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      id: data.id,
      deploymentId: data.deployment_id,
      name: data.name,
      description: data.description,
      type: data.type,
      condition: data.condition,
      severity: data.severity,
      enabled: data.enabled,
      notificationChannels: data.notification_channels,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error creating alert rule:', error);
    throw error;
  }
}

/**
 * Get alert rules for a deployment
 * 
 * @param deploymentId The ID of the deployment
 * @returns Array of alert rules
 */
export async function getAlertRules(deploymentId: string): Promise<AlertRule[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('deployment_id', deploymentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(rule => ({
      id: rule.id,
      deploymentId: rule.deployment_id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      condition: rule.condition,
      severity: rule.severity,
      enabled: rule.enabled,
      notificationChannels: rule.notification_channels,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at
    }));
  } catch (error) {
    console.error('Error getting alert rules:', error);
    return [];
  }
}

/**
 * Update an alert rule
 * 
 * @param ruleId The ID of the alert rule
 * @param updates The updates to apply
 * @returns The updated alert rule
 */
export async function updateAlertRule(
  ruleId: string,
  updates: Partial<Omit<AlertRule, 'id' | 'deploymentId' | 'createdAt' | 'updatedAt'>>
): Promise<AlertRule | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('alert_rules')
      .update({
        name: updates.name,
        description: updates.description,
        type: updates.type,
        condition: updates.condition,
        severity: updates.severity,
        enabled: updates.enabled,
        notification_channels: updates.notificationChannels
      })
      .eq('id', ruleId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      id: data.id,
      deploymentId: data.deployment_id,
      name: data.name,
      description: data.description,
      type: data.type,
      condition: data.condition,
      severity: data.severity,
      enabled: data.enabled,
      notificationChannels: data.notification_channels,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error updating alert rule:', error);
    return null;
  }
}

/**
 * Delete an alert rule
 * 
 * @param ruleId The ID of the alert rule
 * @returns Whether the deletion was successful
 */
export async function deleteAlertRule(ruleId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', ruleId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    return false;
  }
}

/**
 * Get active alerts for a deployment
 * 
 * @param deploymentId The ID of the deployment
 * @returns Array of active alerts
 */
export async function getActiveAlerts(deploymentId: string): Promise<Alert[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('deployment_id', deploymentId)
      .in('status', ['active', 'acknowledged'])
      .order('triggered_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(alert => ({
      id: alert.id,
      ruleId: alert.rule_id,
      deploymentId: alert.deployment_id,
      status: alert.status,
      severity: alert.severity,
      message: alert.message,
      details: alert.details,
      triggeredAt: alert.triggered_at,
      acknowledgedAt: alert.acknowledged_at,
      resolvedAt: alert.resolved_at,
      acknowledgedBy: alert.acknowledged_by,
      resolvedBy: alert.resolved_by
    }));
  } catch (error) {
    console.error('Error getting active alerts:', error);
    return [];
  }
}

/**
 * Get alert history for a deployment
 * 
 * @param deploymentId The ID of the deployment
 * @param limit Maximum number of alerts to return
 * @param offset Offset for pagination
 * @returns Array of alerts
 */
export async function getAlertHistory(
  deploymentId: string,
  limit: number = 100,
  offset: number = 0
): Promise<Alert[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('deployment_id', deploymentId)
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(alert => ({
      id: alert.id,
      ruleId: alert.rule_id,
      deploymentId: alert.deployment_id,
      status: alert.status,
      severity: alert.severity,
      message: alert.message,
      details: alert.details,
      triggeredAt: alert.triggered_at,
      acknowledgedAt: alert.acknowledged_at,
      resolvedAt: alert.resolved_at,
      acknowledgedBy: alert.acknowledged_by,
      resolvedBy: alert.resolved_by
    }));
  } catch (error) {
    console.error('Error getting alert history:', error);
    return [];
  }
}

/**
 * Acknowledge an alert
 * 
 * @param alertId The ID of the alert
 * @returns Whether the acknowledgement was successful
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id
      })
      .eq('id', alertId)
      .eq('status', 'active');
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return false;
  }
}

/**
 * Resolve an alert
 * 
 * @param alertId The ID of the alert
 * @returns Whether the resolution was successful
 */
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('id', alertId)
      .in('status', ['active', 'acknowledged']);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error resolving alert:', error);
    return false;
  }
}

/**
 * Create a notification channel
 * 
 * @param channel The notification channel to create
 * @returns The created notification channel
 */
export async function createNotificationChannel(
  channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NotificationChannel> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('notification_channels')
      .insert({
        name: channel.name,
        type: channel.type,
        config: channel.config
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error creating notification channel:', error);
    throw error;
  }
}

/**
 * Get notification channels
 * 
 * @returns Array of notification channels
 */
export async function getNotificationChannels(): Promise<NotificationChannel[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('notification_channels')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(channel => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      config: channel.config,
      createdAt: channel.created_at,
      updatedAt: channel.updated_at
    }));
  } catch (error) {
    console.error('Error getting notification channels:', error);
    return [];
  }
}

/**
 * Evaluate alert rules against metrics
 * 
 * @param deploymentId The ID of the deployment
 * @param metrics The current metrics
 * @returns Whether any alerts were triggered
 */
export async function evaluateAlertRules(
  deploymentId: string,
  metrics: MonitoringMetrics
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get alert rules for the deployment
    const rules = await getAlertRules(deploymentId);
    
    // Filter for enabled rules
    const enabledRules = rules.filter(rule => rule.enabled);
    
    let alertsTriggered = false;
    
    // Evaluate each rule
    for (const rule of enabledRules) {
      const { condition } = rule;
      const { metric, operator, threshold } = condition;
      
      // Get the metric value
      let metricValue: number | undefined;
      
      switch (metric) {
        case 'uptime':
          metricValue = metrics.uptime;
          break;
        case 'requests':
          metricValue = metrics.requests;
          break;
        case 'errors':
          metricValue = metrics.errors;
          break;
        case 'error_rate':
          metricValue = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
          break;
        case 'latency':
          metricValue = metrics.latency;
          break;
        case 'cost':
          metricValue = metrics.cost;
          break;
        default:
          // Custom metric or not supported
          continue;
      }
      
      // Skip if metric value is undefined
      if (metricValue === undefined) {
        continue;
      }
      
      // Evaluate the condition
      let conditionMet = false;
      
      switch (operator) {
        case '>':
          conditionMet = metricValue > threshold;
          break;
        case '>=':
          conditionMet = metricValue >= threshold;
          break;
        case '<':
          conditionMet = metricValue < threshold;
          break;
        case '<=':
          conditionMet = metricValue <= threshold;
          break;
        case '==':
          conditionMet = metricValue === threshold;
          break;
        case '!=':
          conditionMet = metricValue !== threshold;
          break;
      }
      
      // If condition is met, create an alert
      if (conditionMet) {
        // Check if there's already an active alert for this rule
        const { data: existingAlerts, error: existingAlertsError } = await supabase
          .from('alerts')
          .select('id')
          .eq('rule_id', rule.id)
          .in('status', ['active', 'acknowledged'])
          .limit(1);
        
        if (existingAlertsError) {
          console.error('Error checking existing alerts:', existingAlertsError);
          continue;
        }
        
        // Skip if there's already an active alert for this rule
        if (existingAlerts && existingAlerts.length > 0) {
          continue;
        }
        
        // Create the alert
        const message = `${rule.name}: ${metric} ${operator} ${threshold}`;
        const details = {
          rule: rule.name,
          metric,
          operator,
          threshold,
          currentValue: metricValue,
          deploymentId
        };
        
        const { error: createAlertError } = await supabase
          .from('alerts')
          .insert({
            rule_id: rule.id,
            deployment_id: deploymentId,
            status: 'active',
            severity: rule.severity,
            message,
            details
          });
        
        if (createAlertError) {
          console.error('Error creating alert:', createAlertError);
          continue;
        }
        
        alertsTriggered = true;
      }
    }
    
    return alertsTriggered;
  } catch (error) {
    console.error('Error evaluating alert rules:', error);
    return false;
  }
}

/**
 * Send alert notifications
 * 
 * @param alertId The ID of the alert
 * @returns Whether the notifications were sent successfully
 */
export async function sendAlertNotifications(alertId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*, alert_rules(*)')
      .eq('id', alertId)
      .single();
    
    if (alertError || !alert) {
      console.error('Error getting alert:', alertError);
      return false;
    }
    
    // Get the notification channels
    const notificationChannels = alert.alert_rules.notification_channels || [];
    
    if (notificationChannels.length === 0) {
      // No notification channels configured
      return true;
    }
    
    // Get the channel details
    const { data: channels, error: channelsError } = await supabase
      .from('notification_channels')
      .select('*')
      .in('id', notificationChannels);
    
    if (channelsError) {
      console.error('Error getting notification channels:', channelsError);
      return false;
    }
    
    // Send notifications to each channel
    for (const channel of channels) {
      try {
        switch (channel.type) {
          case 'email':
            // Send email notification
            // This would typically call an email service
            console.log('Sending email notification:', {
              to: channel.config.email,
              subject: `Alert: ${alert.message}`,
              body: `Alert details: ${JSON.stringify(alert.details)}`
            });
            break;
          
          case 'webhook':
            // Send webhook notification
            // This would typically make an HTTP request to the webhook URL
            console.log('Sending webhook notification:', {
              url: channel.config.url,
              payload: {
                alert: {
                  id: alert.id,
                  message: alert.message,
                  severity: alert.severity,
                  details: alert.details,
                  triggeredAt: alert.triggered_at
                }
              }
            });
            break;
          
          case 'slack':
            // Send Slack notification
            // This would typically call the Slack API
            console.log('Sending Slack notification:', {
              channel: channel.config.channel,
              text: `Alert: ${alert.message}\nSeverity: ${alert.severity}\nDetails: ${JSON.stringify(alert.details)}`
            });
            break;
          
          case 'in_app':
            // Send in-app notification
            // This would typically create a notification in the app
            console.log('Sending in-app notification:', {
              userId: channel.config.user_id,
              message: alert.message,
              severity: alert.severity,
              details: alert.details
            });
            break;
        }
      } catch (error) {
        console.error(`Error sending notification to channel ${channel.id}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending alert notifications:', error);
    return false;
  }
}

/**
 * Hook for using alerts in components
 * 
 * @param deploymentId The ID of the deployment
 * @returns Alert-related functions and state
 */
export function useAlerts(deploymentId: string) {
  const { showNotification } = useNotification();
  
  // Function to acknowledge an alert with notification
  const acknowledgeAlertWithNotification = async (alertId: string, alertMessage: string) => {
    const success = await acknowledgeAlert(alertId);
    
    if (success) {
      showNotification({
        id: `acknowledge-alert-${alertId}`,
        title: 'Alert Acknowledged',
        message: `Alert "${alertMessage}" has been acknowledged`,
        type: 'success'
      });
      return true;
    } else {
      showNotification({
        id: `acknowledge-alert-error-${alertId}`,
        title: 'Error',
        message: 'Failed to acknowledge alert',
        type: 'error'
      });
      return false;
    }
  };
  
  // Function to resolve an alert with notification
  const resolveAlertWithNotification = async (alertId: string, alertMessage: string) => {
    const success = await resolveAlert(alertId);
    
    if (success) {
      showNotification({
        id: `resolve-alert-${alertId}`,
        title: 'Alert Resolved',
        message: `Alert "${alertMessage}" has been resolved`,
        type: 'success'
      });
      return true;
    } else {
      showNotification({
        id: `resolve-alert-error-${alertId}`,
        title: 'Error',
        message: 'Failed to resolve alert',
        type: 'error'
      });
      return false;
    }
  };
  
  return {
    acknowledgeAlert: acknowledgeAlertWithNotification,
    resolveAlert: resolveAlertWithNotification
  };
}
