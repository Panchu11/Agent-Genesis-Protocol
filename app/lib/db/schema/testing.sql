-- Testing System Schema

-- Test Cases Table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  inputs JSONB NOT NULL,
  expected_outputs JSONB NOT NULL,
  parameters JSONB,
  validation_rules JSONB,
  timeout INTEGER,
  retry_count INTEGER,
  tags TEXT[],
  is_template BOOLEAN DEFAULT FALSE,
  template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_type ON test_cases(type);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_template ON test_cases(is_template);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_by ON test_cases(created_by);

-- Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  actual_outputs JSONB,
  validation_results JSONB,
  performance_metrics JSONB,
  error TEXT,
  error_type TEXT,
  error_stack TEXT,
  attempts INTEGER DEFAULT 1,
  logs JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_agent_id ON test_results(agent_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);

-- Test Suites Table
CREATE TABLE IF NOT EXISTS test_suites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  test_case_ids UUID[] NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  category TEXT,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_suites_category ON test_suites(category);
CREATE INDEX IF NOT EXISTS idx_test_suites_is_public ON test_suites(is_public);
CREATE INDEX IF NOT EXISTS idx_test_suites_created_by ON test_suites(created_by);

-- Test Runs Table
CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  test_suite_id UUID REFERENCES test_suites(id) ON DELETE SET NULL,
  test_case_ids UUID[],
  config JSONB,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  results JSONB,
  summary JSONB,
  logs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_runs_agent_id ON test_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_test_suite_id ON test_runs(test_suite_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON test_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_test_runs_scheduled_at ON test_runs(scheduled_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp on test_cases table
CREATE TRIGGER update_test_cases_updated_at
BEFORE UPDATE ON test_cases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on test_suites table
CREATE TRIGGER update_test_suites_updated_at
BEFORE UPDATE ON test_suites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Test Cases Policies
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

-- Users can read test cases they created or that are templates
CREATE POLICY test_cases_select_policy ON test_cases
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    is_template = TRUE
  );

-- Users can insert their own test cases
CREATE POLICY test_cases_insert_policy ON test_cases
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own test cases
CREATE POLICY test_cases_update_policy ON test_cases
  FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own test cases
CREATE POLICY test_cases_delete_policy ON test_cases
  FOR DELETE
  USING (created_by = auth.uid());

-- Test Results Policies
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Users can read test results for agents they own
CREATE POLICY test_results_select_policy ON test_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = test_results.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can insert test results for agents they own
CREATE POLICY test_results_insert_policy ON test_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = NEW.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can update test results for agents they own
CREATE POLICY test_results_update_policy ON test_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = test_results.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can delete test results for agents they own
CREATE POLICY test_results_delete_policy ON test_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = test_results.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Test Suites Policies
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;

-- Users can read test suites they created or that are public
CREATE POLICY test_suites_select_policy ON test_suites
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    is_public = TRUE
  );

-- Users can insert their own test suites
CREATE POLICY test_suites_insert_policy ON test_suites
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own test suites
CREATE POLICY test_suites_update_policy ON test_suites
  FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own test suites
CREATE POLICY test_suites_delete_policy ON test_suites
  FOR DELETE
  USING (created_by = auth.uid());

-- Test Runs Policies
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;

-- Users can read test runs for agents they own
CREATE POLICY test_runs_select_policy ON test_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = test_runs.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can insert test runs for agents they own
CREATE POLICY test_runs_insert_policy ON test_runs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = NEW.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can update test runs for agents they own
CREATE POLICY test_runs_update_policy ON test_runs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = test_runs.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Users can delete test runs for agents they own
CREATE POLICY test_runs_delete_policy ON test_runs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = test_runs.agent_id
      AND agents.user_id = auth.uid()
    )
  );
