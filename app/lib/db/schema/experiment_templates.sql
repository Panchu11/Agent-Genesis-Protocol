-- Experiment Templates Schema

-- Experiment templates table
CREATE TABLE IF NOT EXISTS experiment_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration TEXT NOT NULL CHECK (duration IN ('short', 'medium', 'long')),
  metrics JSONB NOT NULL,
  tasks JSONB NOT NULL,
  config JSONB NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE
);

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_experiment_templates_category ON experiment_templates(category);

-- Create index on difficulty
CREATE INDEX IF NOT EXISTS idx_experiment_templates_difficulty ON experiment_templates(difficulty);

-- Create index on duration
CREATE INDEX IF NOT EXISTS idx_experiment_templates_duration ON experiment_templates(duration);

-- Create index on created_by
CREATE INDEX IF NOT EXISTS idx_experiment_templates_created_by ON experiment_templates(created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp on experiment_templates table
CREATE TRIGGER update_experiment_templates_updated_at
BEFORE UPDATE ON experiment_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Experiment templates policies
ALTER TABLE experiment_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read public templates
CREATE POLICY experiment_templates_select_public_policy ON experiment_templates
  FOR SELECT
  USING (is_public = TRUE);

-- Users can read their own templates
CREATE POLICY experiment_templates_select_own_policy ON experiment_templates
  FOR SELECT
  USING (created_by = auth.uid());

-- Users can insert their own templates
CREATE POLICY experiment_templates_insert_policy ON experiment_templates
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own templates
CREATE POLICY experiment_templates_update_policy ON experiment_templates
  FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own templates
CREATE POLICY experiment_templates_delete_policy ON experiment_templates
  FOR DELETE
  USING (created_by = auth.uid());
