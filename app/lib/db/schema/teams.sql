-- Teams Schema

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_personal BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'::JSONB
);

-- Create index on owner_id
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  custom_permissions JSONB DEFAULT '{}'::JSONB,
  UNIQUE(team_id, user_id)
);

-- Create indexes on team_id and user_id
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT NOT NULL UNIQUE
);

-- Create indexes on team_id, email, and token
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- Team resources table
CREATE TABLE IF NOT EXISTS team_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('agent', 'knowledge_base', 'deployment', 'marketplace_agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '{}'::JSONB,
  UNIQUE(team_id, resource_id, resource_type)
);

-- Create indexes on team_id, resource_id, and resource_type
CREATE INDEX IF NOT EXISTS idx_team_resources_team_id ON team_resources(team_id);
CREATE INDEX IF NOT EXISTS idx_team_resources_resource_id ON team_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_team_resources_resource_type ON team_resources(resource_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp on teams table
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Teams policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_select_policy ON teams
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY teams_insert_policy ON teams
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY teams_update_policy ON teams
  FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY teams_delete_policy ON teams
  FOR DELETE
  USING (owner_id = auth.uid());

-- Team members policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_select_policy ON team_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY team_members_insert_policy ON team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = team_members.team_id
        AND (t.settings->>'allow_member_invites')::boolean = true
      )
    )
  );

CREATE POLICY team_members_update_policy ON team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY team_members_delete_policy ON team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    ) OR
    user_id = auth.uid() -- Users can remove themselves
  );

-- Team invitations policies
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_invitations_select_policy ON team_invitations
  FOR SELECT
  USING (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    ) OR
    email = (
      SELECT email FROM auth.users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY team_invitations_insert_policy ON team_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'member'
      AND EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = team_invitations.team_id
        AND (teams.settings->>'allow_member_invites')::boolean = true
      )
    )
  );

CREATE POLICY team_invitations_update_policy ON team_invitations
  FOR UPDATE
  USING (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    ) OR
    email = (
      SELECT email FROM auth.users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY team_invitations_delete_policy ON team_invitations
  FOR DELETE
  USING (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Team resources policies
ALTER TABLE team_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_resources_select_policy ON team_resources
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_resources.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY team_resources_insert_policy ON team_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_resources.team_id
      AND teams.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_resources.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    ) OR
    (
      EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = team_resources.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'member'
      ) AND
      (
        (team_resources.resource_type = 'agent' AND
         EXISTS (
           SELECT 1 FROM agents
           WHERE agents.id = team_resources.resource_id
           AND agents.user_id = auth.uid()
         )) OR
        (team_resources.resource_type = 'knowledge_base' AND
         EXISTS (
           SELECT 1 FROM knowledge_bases
           WHERE knowledge_bases.id = team_resources.resource_id
           AND knowledge_bases.user_id = auth.uid()
         )) OR
        (team_resources.resource_type = 'deployment' AND
         EXISTS (
           SELECT 1 FROM agent_deployments
           WHERE agent_deployments.id = team_resources.resource_id
           AND agent_deployments.user_id = auth.uid()
         )) OR
        (team_resources.resource_type = 'marketplace_agent' AND
         EXISTS (
           SELECT 1 FROM marketplace_agents
           WHERE marketplace_agents.id = team_resources.resource_id
           AND marketplace_agents.user_id = auth.uid()
         ))
      )
    )
  );

CREATE POLICY team_resources_update_policy ON team_resources
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_resources.team_id
      AND teams.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_resources.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY team_resources_delete_policy ON team_resources
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_resources.team_id
      AND teams.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_resources.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );
