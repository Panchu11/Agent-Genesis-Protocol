-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  archetype TEXT,
  personality JSONB NOT NULL,
  capabilities JSONB NOT NULL,
  knowledge_base_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_versions table to track version history
CREATE TABLE agent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  personality JSONB NOT NULL,
  capabilities JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_bases table
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_nodes table
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experiments table
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experiment_runs table
CREATE TABLE experiment_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create agent_metrics table
CREATE TABLE agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES experiments(id) ON DELETE SET NULL,
  run_id UUID REFERENCES experiment_runs(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL,
  value FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_posts table
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_interactions table
CREATE TABLE social_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_deployments table
CREATE TABLE agent_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  environment TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  configuration JSONB NOT NULL,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deployed_at TIMESTAMP WITH TIME ZONE,
  terminated_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_id UUID,
  related_entity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for agents
CREATE POLICY "Users can view their own agents"
  ON agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public agents"
  ON agents FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can create their own agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
  ON agents FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for agent_versions
CREATE POLICY "Users can view versions of their own agents"
  ON agent_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_versions.agent_id
    AND agents.user_id = auth.uid()
  ));

CREATE POLICY "Users can view versions of public agents"
  ON agent_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_versions.agent_id
    AND agents.is_public = TRUE
  ));

-- Create policies for knowledge_bases
CREATE POLICY "Users can view their own knowledge bases"
  ON knowledge_bases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public knowledge bases"
  ON knowledge_bases FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can create their own knowledge bases"
  ON knowledge_bases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge bases"
  ON knowledge_bases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge bases"
  ON knowledge_bases FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for knowledge_nodes
CREATE POLICY "Users can view nodes of their own knowledge bases"
  ON knowledge_nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM knowledge_bases
    WHERE knowledge_bases.id = knowledge_nodes.knowledge_base_id
    AND knowledge_bases.user_id = auth.uid()
  ));

CREATE POLICY "Users can view nodes of public knowledge bases"
  ON knowledge_nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM knowledge_bases
    WHERE knowledge_bases.id = knowledge_nodes.knowledge_base_id
    AND knowledge_bases.is_public = TRUE
  ));

CREATE POLICY "Users can create nodes in their own knowledge bases"
  ON knowledge_nodes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM knowledge_bases
    WHERE knowledge_bases.id = knowledge_nodes.knowledge_base_id
    AND knowledge_bases.user_id = auth.uid()
  ));

CREATE POLICY "Users can update nodes in their own knowledge bases"
  ON knowledge_nodes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM knowledge_bases
    WHERE knowledge_bases.id = knowledge_nodes.knowledge_base_id
    AND knowledge_bases.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete nodes in their own knowledge bases"
  ON knowledge_nodes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM knowledge_bases
    WHERE knowledge_bases.id = knowledge_nodes.knowledge_base_id
    AND knowledge_bases.user_id = auth.uid()
  ));

-- Create policies for experiments
CREATE POLICY "Users can view their own experiments"
  ON experiments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public experiments"
  ON experiments FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can create their own experiments"
  ON experiments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiments"
  ON experiments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiments"
  ON experiments FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for experiment_runs
CREATE POLICY "Users can view runs of their own experiments"
  ON experiment_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM experiments
    WHERE experiments.id = experiment_runs.experiment_id
    AND experiments.user_id = auth.uid()
  ));

CREATE POLICY "Users can view runs of public experiments"
  ON experiment_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM experiments
    WHERE experiments.id = experiment_runs.experiment_id
    AND experiments.is_public = TRUE
  ));

-- Create policies for agent_metrics
CREATE POLICY "Users can view metrics of their own agents"
  ON agent_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_metrics.agent_id
    AND agents.user_id = auth.uid()
  ));

CREATE POLICY "Users can view metrics of public agents"
  ON agent_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_metrics.agent_id
    AND agents.is_public = TRUE
  ));

-- Create policies for social_posts
CREATE POLICY "Anyone can view social posts"
  ON social_posts FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create posts for their own agents"
  ON social_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = social_posts.agent_id
    AND agents.user_id = auth.uid()
  ));

-- Create policies for social_interactions
CREATE POLICY "Anyone can view social interactions"
  ON social_interactions FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create interactions for their own agents"
  ON social_interactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = social_interactions.agent_id
    AND agents.user_id = auth.uid()
  ));

-- Create policies for agent_deployments
CREATE POLICY "Users can view deployments of their own agents"
  ON agent_deployments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_deployments.agent_id
    AND agents.user_id = auth.uid()
  ));

CREATE POLICY "Users can create deployments for their own agents"
  ON agent_deployments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_deployments.agent_id
    AND agents.user_id = auth.uid()
  ));

CREATE POLICY "Users can update deployments of their own agents"
  ON agent_deployments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_deployments.agent_id
    AND agents.user_id = auth.uid()
  ));

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create functions and triggers for real-time updates

-- Function to handle agent updates
CREATE OR REPLACE FUNCTION handle_agent_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a new version record when an agent is updated
  IF (OLD.personality != NEW.personality OR OLD.capabilities != NEW.capabilities) THEN
    INSERT INTO agent_versions (agent_id, version, personality, capabilities)
    VALUES (NEW.id, NEW.version, NEW.personality, NEW.capabilities);

    -- Increment the version number
    NEW.version := OLD.version + 1;
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_update_trigger
BEFORE UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION handle_agent_update();

-- Function to handle experiment run status changes
CREATE OR REPLACE FUNCTION handle_experiment_run_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Set started_at when status changes to 'running'
  IF (NEW.status = 'running' AND OLD.status != 'running') THEN
    NEW.started_at := NOW();
  END IF;

  -- Set completed_at when status changes to 'completed' or 'failed'
  IF ((NEW.status = 'completed' OR NEW.status = 'failed') AND
      OLD.status != 'completed' AND OLD.status != 'failed') THEN
    NEW.completed_at := NOW();
  END IF;

  -- Create a notification for the experiment owner
  IF (NEW.status != OLD.status) THEN
    INSERT INTO notifications (user_id, title, message, type, related_entity_id, related_entity_type)
    SELECT
      experiments.user_id,
      CASE
        WHEN NEW.status = 'running' THEN 'Experiment Run Started'
        WHEN NEW.status = 'completed' THEN 'Experiment Run Completed'
        WHEN NEW.status = 'failed' THEN 'Experiment Run Failed'
        ELSE 'Experiment Run Status Changed'
      END,
      'The status of your experiment run has changed to ' || NEW.status,
      CASE
        WHEN NEW.status = 'running' THEN 'info'
        WHEN NEW.status = 'completed' THEN 'success'
        WHEN NEW.status = 'failed' THEN 'error'
        ELSE 'info'
      END,
      NEW.id,
      'experiment_run'
    FROM experiments
    WHERE experiments.id = NEW.experiment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER experiment_run_status_trigger
BEFORE UPDATE ON experiment_runs
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION handle_experiment_run_status_change();

-- Function to handle social post creation
CREATE OR REPLACE FUNCTION handle_social_post_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a notification for users who follow the agent
  -- This is a placeholder for future implementation of a followers system
  -- For now, we'll just return the new record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_post_creation_trigger
AFTER INSERT ON social_posts
FOR EACH ROW
EXECUTE FUNCTION handle_social_post_creation();

-- Function to handle social interaction creation
CREATE OR REPLACE FUNCTION handle_social_interaction_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a notification for the post owner
  INSERT INTO notifications (user_id, title, message, type, related_entity_id, related_entity_type)
  SELECT
    agents.user_id,
    CASE
      WHEN NEW.interaction_type = 'like' THEN 'New Like'
      WHEN NEW.interaction_type = 'comment' THEN 'New Comment'
      ELSE 'New Interaction'
    END,
    CASE
      WHEN NEW.interaction_type = 'like' THEN 'Someone liked your post'
      WHEN NEW.interaction_type = 'comment' THEN 'Someone commented on your post'
      ELSE 'Someone interacted with your post'
    END,
    'info',
    NEW.post_id,
    'social_post'
  FROM social_posts
  JOIN agents ON social_posts.agent_id = agents.id
  WHERE social_posts.id = NEW.post_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_interaction_creation_trigger
AFTER INSERT ON social_interactions
FOR EACH ROW
EXECUTE FUNCTION handle_social_interaction_creation();
