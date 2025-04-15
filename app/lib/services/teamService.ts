'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { cache } from '../utils/cache';
import { 
  Team, 
  TeamMember, 
  TeamResource, 
  TeamRole, 
  TeamResourceType, 
  PermissionLevel,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  AddTeamResourceRequest,
  UpdateTeamResourceRequest,
  TeamWithMembers,
  TeamWithResources,
  TeamWithMembersAndResources
} from '../types/team';

/**
 * Team Service
 * 
 * This service provides functions for managing teams, team members,
 * and team resources.
 */

/**
 * Get teams for the current user
 * 
 * @returns Array of teams the user belongs to
 */
export async function getUserTeams(): Promise<Team[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get teams where the user is the owner
    const { data: ownedTeams, error: ownedTeamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', user.id);
    
    if (ownedTeamsError) {
      console.error('Error fetching owned teams:', ownedTeamsError);
      throw new Error('Failed to fetch owned teams');
    }
    
    // Get teams where the user is a member
    const { data: memberTeams, error: memberTeamsError } = await supabase
      .from('teams')
      .select('*')
      .not('owner_id', 'eq', user.id)
      .in('id', supabase.from('team_members').select('team_id').eq('user_id', user.id));
    
    if (memberTeamsError) {
      console.error('Error fetching member teams:', memberTeamsError);
      throw new Error('Failed to fetch member teams');
    }
    
    // Combine and return all teams
    return [...(ownedTeams || []), ...(memberTeams || [])];
  } catch (error) {
    console.error('Error in getUserTeams:', error);
    throw error;
  }
}

/**
 * Get a team by ID
 * 
 * @param teamId The ID of the team
 * @returns The team or null if not found
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const cacheKey = `team:${teamId}`;
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        console.error('Error fetching team:', error);
        throw new Error('Failed to fetch team');
      }
      
      return data;
    } catch (error) {
      console.error('Error in getTeamById:', error);
      throw error;
    }
  }, 5 * 60 * 1000); // Cache for 5 minutes
}

/**
 * Get a team with its members
 * 
 * @param teamId The ID of the team
 * @returns The team with members or null if not found
 */
export async function getTeamWithMembers(teamId: string): Promise<TeamWithMembers | null> {
  try {
    const team = await getTeamById(teamId);
    
    if (!team) {
      return null;
    }
    
    const members = await getTeamMembers(teamId);
    
    return {
      ...team,
      members,
    };
  } catch (error) {
    console.error('Error in getTeamWithMembers:', error);
    throw error;
  }
}

/**
 * Get a team with its resources
 * 
 * @param teamId The ID of the team
 * @returns The team with resources or null if not found
 */
export async function getTeamWithResources(teamId: string): Promise<TeamWithResources | null> {
  try {
    const team = await getTeamById(teamId);
    
    if (!team) {
      return null;
    }
    
    const resources = await getTeamResources(teamId);
    
    return {
      ...team,
      resources,
    };
  } catch (error) {
    console.error('Error in getTeamWithResources:', error);
    throw error;
  }
}

/**
 * Get a team with its members and resources
 * 
 * @param teamId The ID of the team
 * @returns The team with members and resources or null if not found
 */
export async function getTeamWithMembersAndResources(teamId: string): Promise<TeamWithMembersAndResources | null> {
  try {
    const team = await getTeamById(teamId);
    
    if (!team) {
      return null;
    }
    
    const members = await getTeamMembers(teamId);
    const resources = await getTeamResources(teamId);
    
    return {
      ...team,
      members,
      resources,
    };
  } catch (error) {
    console.error('Error in getTeamWithMembersAndResources:', error);
    throw error;
  }
}

/**
 * Create a new team
 * 
 * @param teamData The team data
 * @returns The created team
 */
export async function createTeam(teamData: CreateTeamRequest): Promise<Team> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create the team
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        description: teamData.description,
        avatar_url: teamData.avatar_url,
        owner_id: user.id,
        is_personal: teamData.is_personal || false,
        settings: teamData.settings || {},
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
    
    // Add the owner as a team member with the owner role
    await supabase
      .from('team_members')
      .insert({
        team_id: data.id,
        user_id: user.id,
        role: 'owner',
      });
    
    return data;
  } catch (error) {
    console.error('Error in createTeam:', error);
    throw error;
  }
}

/**
 * Update a team
 * 
 * @param teamId The ID of the team
 * @param teamData The team data to update
 * @returns The updated team
 */
export async function updateTeam(teamId: string, teamData: UpdateTeamRequest): Promise<Team> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the team
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: teamData.name,
        description: teamData.description,
        avatar_url: teamData.avatar_url,
        settings: teamData.settings,
      })
      .eq('id', teamId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
    
    // Invalidate cache
    cache.delete(`team:${teamId}`);
    
    return data;
  } catch (error) {
    console.error('Error in updateTeam:', error);
    throw error;
  }
}

/**
 * Delete a team
 * 
 * @param teamId The ID of the team
 * @returns Whether the team was deleted successfully
 */
export async function deleteTeam(teamId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
    
    if (error) {
      console.error('Error deleting team:', error);
      throw new Error('Failed to delete team');
    }
    
    // Invalidate cache
    cache.delete(`team:${teamId}`);
    
    return true;
  } catch (error) {
    console.error('Error in deleteTeam:', error);
    throw error;
  }
}

/**
 * Get team members
 * 
 * @param teamId The ID of the team
 * @returns Array of team members
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
    
    if (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Failed to fetch team members');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}

/**
 * Get a team member
 * 
 * @param teamId The ID of the team
 * @param userId The ID of the user
 * @returns The team member or null if not found
 */
export async function getTeamMember(teamId: string, userId: string): Promise<TeamMember | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching team member:', error);
      throw new Error('Failed to fetch team member');
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTeamMember:', error);
    throw error;
  }
}

/**
 * Add a team member
 * 
 * @param teamId The ID of the team
 * @param memberData The member data
 * @returns The added team member
 */
export async function addTeamMember(teamId: string, memberData: AddTeamMemberRequest): Promise<TeamMember> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Add the team member
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: memberData.user_id,
        role: memberData.role,
        invited_by: user.id,
        custom_permissions: memberData.custom_permissions || {},
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding team member:', error);
      throw new Error('Failed to add team member');
    }
    
    return data;
  } catch (error) {
    console.error('Error in addTeamMember:', error);
    throw error;
  }
}

/**
 * Update a team member
 * 
 * @param teamId The ID of the team
 * @param userId The ID of the user
 * @param memberData The member data to update
 * @returns The updated team member
 */
export async function updateTeamMember(
  teamId: string,
  userId: string,
  memberData: UpdateTeamMemberRequest
): Promise<TeamMember> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the team member
    const { data, error } = await supabase
      .from('team_members')
      .update({
        role: memberData.role,
        custom_permissions: memberData.custom_permissions,
      })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating team member:', error);
      throw new Error('Failed to update team member');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateTeamMember:', error);
    throw error;
  }
}

/**
 * Remove a team member
 * 
 * @param teamId The ID of the team
 * @param userId The ID of the user
 * @returns Whether the team member was removed successfully
 */
export async function removeTeamMember(teamId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Check if the user is the team owner
    const team = await getTeamById(teamId);
    
    if (team && team.owner_id === userId) {
      throw new Error('Cannot remove the team owner');
    }
    
    // Remove the team member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error removing team member:', error);
      throw new Error('Failed to remove team member');
    }
    
    return true;
  } catch (error) {
    console.error('Error in removeTeamMember:', error);
    throw error;
  }
}

/**
 * Get team resources
 * 
 * @param teamId The ID of the team
 * @param resourceType Optional resource type filter
 * @returns Array of team resources
 */
export async function getTeamResources(
  teamId: string,
  resourceType?: TeamResourceType
): Promise<TeamResource[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    let query = supabase
      .from('team_resources')
      .select('*')
      .eq('team_id', teamId);
    
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching team resources:', error);
      throw new Error('Failed to fetch team resources');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTeamResources:', error);
    throw error;
  }
}

/**
 * Add a resource to a team
 * 
 * @param teamId The ID of the team
 * @param resourceData The resource data
 * @returns The added team resource
 */
export async function addTeamResource(
  teamId: string,
  resourceData: AddTeamResourceRequest
): Promise<TeamResource> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Add the team resource
    const { data, error } = await supabase
      .from('team_resources')
      .insert({
        team_id: teamId,
        resource_id: resourceData.resource_id,
        resource_type: resourceData.resource_type,
        created_by: user.id,
        permissions: resourceData.permissions || {},
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding team resource:', error);
      throw new Error('Failed to add team resource');
    }
    
    return data;
  } catch (error) {
    console.error('Error in addTeamResource:', error);
    throw error;
  }
}

/**
 * Update a team resource
 * 
 * @param teamId The ID of the team
 * @param resourceId The ID of the resource
 * @param resourceType The type of the resource
 * @param resourceData The resource data to update
 * @returns The updated team resource
 */
export async function updateTeamResource(
  teamId: string,
  resourceId: string,
  resourceType: TeamResourceType,
  resourceData: UpdateTeamResourceRequest
): Promise<TeamResource> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Update the team resource
    const { data, error } = await supabase
      .from('team_resources')
      .update({
        permissions: resourceData.permissions,
      })
      .eq('team_id', teamId)
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating team resource:', error);
      throw new Error('Failed to update team resource');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateTeamResource:', error);
    throw error;
  }
}

/**
 * Remove a resource from a team
 * 
 * @param teamId The ID of the team
 * @param resourceId The ID of the resource
 * @param resourceType The type of the resource
 * @returns Whether the resource was removed successfully
 */
export async function removeTeamResource(
  teamId: string,
  resourceId: string,
  resourceType: TeamResourceType
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Remove the team resource
    const { error } = await supabase
      .from('team_resources')
      .delete()
      .eq('team_id', teamId)
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType);
    
    if (error) {
      console.error('Error removing team resource:', error);
      throw new Error('Failed to remove team resource');
    }
    
    return true;
  } catch (error) {
    console.error('Error in removeTeamResource:', error);
    throw error;
  }
}

/**
 * Check if a user has permission to access a resource
 * 
 * @param userId The ID of the user
 * @param resourceId The ID of the resource
 * @param resourceType The type of the resource
 * @param requiredPermission The required permission level
 * @returns Whether the user has the required permission
 */
export async function checkResourcePermission(
  userId: string,
  resourceId: string,
  resourceType: TeamResourceType,
  requiredPermission: PermissionLevel
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Check if the user is the resource owner
    let isOwner = false;
    
    switch (resourceType) {
      case 'agent':
        const { data: agent } = await supabase
          .from('agents')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        isOwner = agent?.user_id === userId;
        break;
      case 'knowledge_base':
        const { data: kb } = await supabase
          .from('knowledge_bases')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        isOwner = kb?.user_id === userId;
        break;
      case 'deployment':
        const { data: deployment } = await supabase
          .from('agent_deployments')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        isOwner = deployment?.user_id === userId;
        break;
      case 'marketplace_agent':
        const { data: marketplaceAgent } = await supabase
          .from('marketplace_agents')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        isOwner = marketplaceAgent?.user_id === userId;
        break;
    }
    
    // If the user is the owner, they have all permissions
    if (isOwner) {
      return true;
    }
    
    // Check if the resource is shared with any teams the user belongs to
    const { data: teamResources } = await supabase
      .from('team_resources')
      .select(`
        *,
        teams!inner(
          id,
          owner_id
        ),
        team_members!inner(
          user_id,
          role
        )
      `)
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .eq('team_members.user_id', userId);
    
    if (!teamResources || teamResources.length === 0) {
      return false;
    }
    
    // Check if the user has the required permission in any team
    for (const teamResource of teamResources) {
      const team = teamResource.teams;
      const member = teamResource.team_members;
      
      // If the user is the team owner, they have all permissions
      if (team.owner_id === userId) {
        return true;
      }
      
      const role = member.role as TeamRole;
      const permissions = teamResource.permissions as Record<TeamRole, PermissionLevel>;
      
      // Check role-specific permissions
      const rolePermission = permissions[role];
      
      if (rolePermission) {
        // Check if the role permission is sufficient
        if (hasPermission(rolePermission, requiredPermission)) {
          return true;
        }
      }
      
      // Check custom permissions for the user
      const memberData = await getTeamMember(team.id, userId);
      
      if (memberData?.custom_permissions) {
        const customPermissions = memberData.custom_permissions as Record<TeamResourceType, PermissionLevel>;
        const customPermission = customPermissions[resourceType];
        
        if (customPermission && hasPermission(customPermission, requiredPermission)) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in checkResourcePermission:', error);
    throw error;
  }
}

/**
 * Check if a permission level is sufficient
 * 
 * @param actual The actual permission level
 * @param required The required permission level
 * @returns Whether the actual permission is sufficient
 */
function hasPermission(actual: PermissionLevel, required: PermissionLevel): boolean {
  const levels: Record<PermissionLevel, number> = {
    'manage': 3,
    'edit': 2,
    'view': 1,
    'none': 0,
  };
  
  return levels[actual] >= levels[required];
}
