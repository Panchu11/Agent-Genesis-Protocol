'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { useNotification } from '@/app/context/NotificationContext';
import TeamMembersList from '@/app/components/team/TeamMembersList';
import TeamInvitations from '@/app/components/team/TeamInvitations';
import TeamResources from '@/app/components/team/TeamResources';
import { 
  Team, 
  TeamMember, 
  TeamResource, 
  TeamInvitation, 
  TeamRole,
  UpdateTeamRequest
} from '@/app/lib/types/team';
import { 
  getTeamById, 
  getTeamMembers, 
  getTeamResources,
  updateTeam
} from '@/app/lib/services/teamService';
import { getTeamInvitations } from '@/app/lib/services/teamInvitationService';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const teamId = params.id as string;
  
  // State for team data
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [resources, setResources] = useState<TeamResource[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for user
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<TeamRole | null>(null);
  
  // State for team editing
  const [isEditing, setIsEditing] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // State for user resources
  const [userResources, setUserResources] = useState({
    agents: [] as { id: string; name: string }[],
    knowledge_bases: [] as { id: string; name: string }[],
    deployments: [] as { id: string; name: string }[],
    marketplace_agents: [] as { id: string; name: string }[],
  });
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'members' | 'resources' | 'settings'>('members');
  
  // Load team data
  useEffect(() => {
    const loadTeamData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login?redirectedFrom=/teams/' + teamId);
          return;
        }
        
        setUserId(user.id);
        
        // Get team
        const teamData = await getTeamById(teamId);
        
        if (!teamData) {
          setError('Team not found');
          return;
        }
        
        setTeam(teamData);
        setTeamName(teamData.name);
        setTeamDescription(teamData.description || '');
        
        // Get team members
        const membersData = await getTeamMembers(teamId);
        setMembers(membersData);
        
        // Set user role
        const userMember = membersData.find(member => member.user_id === user.id);
        if (userMember) {
          setUserRole(userMember.role);
        } else if (teamData.owner_id === user.id) {
          setUserRole('owner');
        } else {
          // User is not a member of this team
          router.push('/teams');
          return;
        }
        
        // Get team resources
        const resourcesData = await getTeamResources(teamId);
        setResources(resourcesData);
        
        // Get team invitations if user is owner or admin
        if (teamData.owner_id === user.id || (userMember && (userMember.role === 'owner' || userMember.role === 'admin'))) {
          const invitationsData = await getTeamInvitations(teamId);
          setInvitations(invitationsData.filter(invitation => invitation.status === 'pending'));
        }
        
        // Load user resources
        await loadUserResources(user.id);
      } catch (err) {
        console.error('Error loading team data:', err);
        setError('Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (teamId) {
      loadTeamData();
    }
  }, [teamId, router]);
  
  // Load user resources
  const loadUserResources = async (userId: string) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get user agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name')
        .eq('user_id', userId);
      
      // Get user knowledge bases
      const { data: knowledgeBases } = await supabase
        .from('knowledge_bases')
        .select('id, name')
        .eq('user_id', userId);
      
      // Get user deployments
      const { data: deployments } = await supabase
        .from('agent_deployments')
        .select('id, name')
        .eq('user_id', userId);
      
      // Get user marketplace agents
      const { data: marketplaceAgents } = await supabase
        .from('marketplace_agents')
        .select('id, name')
        .eq('user_id', userId);
      
      setUserResources({
        agents: agents || [],
        knowledge_bases: knowledgeBases || [],
        deployments: deployments || [],
        marketplace_agents: marketplaceAgents || [],
      });
    } catch (err) {
      console.error('Error loading user resources:', err);
    }
  };
  
  // Handle team update
  const handleUpdateTeam = async () => {
    if (!team) return;
    
    if (!teamName.trim()) {
      showNotification({
        id: 'team-error',
        title: 'Error',
        message: 'Please enter a team name',
        type: 'error',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const teamData: UpdateTeamRequest = {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      };
      
      const updatedTeam = await updateTeam(team.id, teamData);
      
      showNotification({
        id: 'team-updated',
        title: 'Team Updated',
        message: 'Team details have been updated successfully',
        type: 'success',
      });
      
      setTeam(updatedTeam);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating team:', err);
      
      showNotification({
        id: 'team-error',
        title: 'Error',
        message: 'Failed to update team',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle data refresh
  const handleRefreshData = async () => {
    setIsLoading(true);
    
    try {
      // Get team
      const teamData = await getTeamById(teamId);
      
      if (!teamData) {
        setError('Team not found');
        return;
      }
      
      setTeam(teamData);
      
      // Get team members
      const membersData = await getTeamMembers(teamId);
      setMembers(membersData);
      
      // Get team resources
      const resourcesData = await getTeamResources(teamId);
      setResources(resourcesData);
      
      // Get team invitations if user is owner or admin
      if (userRole === 'owner' || userRole === 'admin') {
        const invitationsData = await getTeamInvitations(teamId);
        setInvitations(invitationsData.filter(invitation => invitation.status === 'pending'));
      }
    } catch (err) {
      console.error('Error refreshing team data:', err);
      
      showNotification({
        id: 'refresh-error',
        title: 'Error',
        message: 'Failed to refresh team data',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !team) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading team...</p>
        </div>
      </div>
    );
  }
  
  if (error || !team) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Team Details</h1>
          <Link href="/teams">
            <Button variant="outline">Back to Teams</Button>
          </Link>
        </div>
        
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error || 'Team not found'}</p>
        </div>
      </div>
    );
  }
  
  const isOwner = team.owner_id === userId;
  const isAdmin = userRole === 'admin';
  const canManageTeam = isOwner || isAdmin;
  const canInviteMembers = canManageTeam || (userRole === 'member' && team.settings?.allow_member_invites === true);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/teams" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Teams
          </Link>
          
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200">
            {team.avatar_url ? (
              <Image
                src={team.avatar_url}
                alt={team.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-lg font-bold">
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-gray-500">
              {team.is_personal ? 'Personal Team' : `${members.length} ${members.length === 1 ? 'member' : 'members'}`}
            </p>
          </div>
        </div>
        
        <div>
          <Button
            variant="outline"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
          {canManageTeam && (
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="members" className="mt-4 space-y-6">
          {canInviteMembers && (
            <TeamInvitations
              teamId={team.id}
              invitations={invitations}
              canInvite={canInviteMembers}
              onInvitationUpdated={handleRefreshData}
            />
          )}
          
          <TeamMembersList
            teamId={team.id}
            members={members}
            currentUserId={userId || ''}
            isOwner={isOwner}
            isAdmin={isAdmin}
            onMemberUpdated={handleRefreshData}
          />
        </TabsContent>
        
        <TabsContent value="resources" className="mt-4">
          <TeamResources
            teamId={team.id}
            resources={resources}
            canManageResources={canManageTeam}
            userResources={userResources}
            onResourceUpdated={handleRefreshData}
          />
        </TabsContent>
        
        {canManageTeam && (
          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
                <CardDescription>
                  Manage team details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name
                      </label>
                      <input
                        id="teamName"
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter team name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        id="teamDescription"
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Describe your team's purpose"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Team Name</h3>
                      <p>{team.name}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                      <p>{team.description || 'No description provided.'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Created</h3>
                      <p>{new Date(team.created_at).toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Team Type</h3>
                      <p>{team.is_personal ? 'Personal Team' : 'Collaborative Team'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setTeamName(team.name);
                        setTeamDescription(team.description || '');
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateTeam}
                      disabled={isSaving || !teamName.trim()}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Team
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {isOwner && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for this team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-red-800">Delete Team</h3>
                      <p className="mt-1 text-sm text-red-700">
                        Permanently delete this team and all of its data. This action cannot be undone.
                      </p>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="bg-white text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
                              router.push('/teams');
                            }
                          }}
                        >
                          Delete Team
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
