-- Experiments Schema

-- Experiments table
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  metrics JSONB NOT NULL,
  config JSONB NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES experiment_templates(id) ON DELETE SET NULL
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_experiments_user_id ON experiments(user_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);

-- Create index on type
CREATE INDEX IF NOT EXISTS idx_experiments_type ON experiments(type);

-- Experiment runs table
CREATE TABLE IF NOT EXISTS experiment_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  metrics JSONB,
  results JSONB,
  logs TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on experiment_id
CREATE INDEX IF NOT EXISTS idx_experiment_runs_experiment_id ON experiment_runs(experiment_id);

-- Create index on agent_id
CREATE INDEX IF NOT EXISTS idx_experiment_runs_agent_id ON experiment_runs(agent_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_experiment_runs_status ON experiment_runs(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp on experiments table
CREATE TRIGGER update_experiments_updated_at
BEFORE UPDATE ON experiments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on experiment_runs table
CREATE TRIGGER update_experiment_runs_updated_at
BEFORE UPDATE ON experiment_runs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Experiments policies
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- Users can read their own experiments
CREATE POLICY experiments_select_policy ON experiments
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own experiments
CREATE POLICY experiments_insert_policy ON experiments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own experiments
CREATE POLICY experiments_update_policy ON experiments
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own experiments
CREATE POLICY experiments_delete_policy ON experiments
  FOR DELETE
  USING (user_id = auth.uid());

-- Experiment runs policies
ALTER TABLE experiment_runs ENABLE ROW LEVEL SECURITY;

-- Users can read runs for their own experiments
CREATE POLICY experiment_runs_select_policy ON experiment_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = experiment_runs.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );

-- Users can insert runs for their own experiments
CREATE POLICY experiment_runs_insert_policy ON experiment_runs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = experiment_runs.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );

-- Users can update runs for their own experiments
CREATE POLICY experiment_runs_update_policy ON experiment_runs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = experiment_runs.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );

-- Users can delete runs for their own experiments
CREATE POLICY experiment_runs_delete_policy ON experiment_runs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = experiment_runs.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );
