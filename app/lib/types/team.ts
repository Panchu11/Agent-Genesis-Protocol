/**
 * Team Types
 * 
 * This file contains types and interfaces for team-related functionality.
 */

/**
 * Team member role
 */
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Team resource type
 */
export type TeamResourceType = 'agent' | 'knowledge_base' | 'deployment' | 'marketplace_agent';

/**
 * Team permission level
 */
export type PermissionLevel = 'manage' | 'edit' | 'view' | 'none';

/**
 * Team data
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  is_personal: boolean;
  settings?: TeamSettings;
}

/**
 * Team settings
 */
export interface TeamSettings {
  default_member_role?: TeamRole;
  allow_member_invites?: boolean;
  require_admin_approval?: boolean;
  default_resource_permissions?: {
    [key in TeamResourceType]?: PermissionLevel;
  };
  visibility?: 'public' | 'private';
}

/**
 * Team member
 */
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  invited_by?: string;
  custom_permissions?: {
    [key in TeamResourceType]?: PermissionLevel;
  };
}

/**
 * Team invitation
 */
export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
}

/**
 * Team resource
 */
export interface TeamResource {
  id: string;
  team_id: string;
  resource_id: string;
  resource_type: TeamResourceType;
  created_at: string;
  created_by: string;
  permissions?: {
    [key in TeamRole]?: PermissionLevel;
  };
}

/**
 * Team with members
 */
export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

/**
 * Team with resources
 */
export interface TeamWithResources extends Team {
  resources: TeamResource[];
}

/**
 * Team with members and resources
 */
export interface TeamWithMembersAndResources extends Team {
  members: TeamMember[];
  resources: TeamResource[];
}

/**
 * Create team request
 */
export interface CreateTeamRequest {
  name: string;
  description?: string;
  avatar_url?: string;
  is_personal?: boolean;
  settings?: TeamSettings;
}

/**
 * Update team request
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
  settings?: TeamSettings;
}

/**
 * Add team member request
 */
export interface AddTeamMemberRequest {
  user_id: string;
  role: TeamRole;
  custom_permissions?: {
    [key in TeamResourceType]?: PermissionLevel;
  };
}

/**
 * Update team member request
 */
export interface UpdateTeamMemberRequest {
  role?: TeamRole;
  custom_permissions?: {
    [key in TeamResourceType]?: PermissionLevel;
  };
}

/**
 * Create team invitation request
 */
export interface CreateTeamInvitationRequest {
  email: string;
  role: TeamRole;
}

/**
 * Add team resource request
 */
export interface AddTeamResourceRequest {
  resource_id: string;
  resource_type: TeamResourceType;
  permissions?: {
    [key in TeamRole]?: PermissionLevel;
  };
}

/**
 * Update team resource request
 */
export interface UpdateTeamResourceRequest {
  permissions?: {
    [key in TeamRole]?: PermissionLevel;
  };
}
