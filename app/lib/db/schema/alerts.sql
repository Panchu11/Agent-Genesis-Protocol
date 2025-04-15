-- Alerts Schema

-- Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  condition JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_channels TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on deployment_id
CREATE INDEX IF NOT EXISTS idx_alert_rules_deployment_id ON alert_rules(deployment_id);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  details JSONB NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index on rule_id
CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);

-- Create index on deployment_id
CREATE INDEX IF NOT EXISTS idx_alerts_deployment_id ON alerts(deployment_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

-- Notification channels table
CREATE TABLE IF NOT EXISTS notification_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'webhook', 'slack', 'in_app')),
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_notification_channels_user_id ON notification_channels(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp on alert_rules table
CREATE TRIGGER update_alert_rules_updated_at
BEFORE UPDATE ON alert_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on notification_channels table
CREATE TRIGGER update_notification_channels_updated_at
BEFORE UPDATE ON notification_channels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Alert rules policies
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

-- Users can read alert rules for deployments they own
CREATE POLICY alert_rules_select_policy ON alert_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alert_rules.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can insert alert rules for deployments they own
CREATE POLICY alert_rules_insert_policy ON alert_rules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alert_rules.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can update alert rules for deployments they own
CREATE POLICY alert_rules_update_policy ON alert_rules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alert_rules.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can delete alert rules for deployments they own
CREATE POLICY alert_rules_delete_policy ON alert_rules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alert_rules.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Alerts policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users can read alerts for deployments they own
CREATE POLICY alerts_select_policy ON alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alerts.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can insert alerts for deployments they own
CREATE POLICY alerts_insert_policy ON alerts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alerts.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can update alerts for deployments they own
CREATE POLICY alerts_update_policy ON alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alerts.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can delete alerts for deployments they own
CREATE POLICY alerts_delete_policy ON alerts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agent_deployments
      JOIN agents ON agent_deployments.agent_id = agents.id
      WHERE agent_deployments.id = alerts.deployment_id
      AND agents.user_id = auth.uid()
    )
  );

-- Notification channels policies
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

-- Users can read their own notification channels
CREATE POLICY notification_channels_select_policy ON notification_channels
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own notification channels
CREATE POLICY notification_channels_insert_policy ON notification_channels
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own notification channels
CREATE POLICY notification_channels_update_policy ON notification_channels
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notification channels
CREATE POLICY notification_channels_delete_policy ON notification_channels
  FOR DELETE
  USING (user_id = auth.uid());
