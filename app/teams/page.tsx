'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';
import TeamCard from '@/app/components/team/TeamCard';
import { Team, CreateTeamRequest } from '@/app/lib/types/team';
import { getUserTeams, createTeam, deleteTeam } from '@/app/lib/services/teamService';

export default function TeamsPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // State for teams
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for team creation
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  
  // State for team deletion
  const [isDeletingTeam, setIsDeletingTeam] = useState<string | null>(null);
  
  // State for user
  const [userId, setUserId] = useState<string | null>(null);
  
  // Load teams
  useEffect(() => {
    const loadTeams = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login?redirectedFrom=/teams');
          return;
        }
        
        setUserId(user.id);
        
        // Get teams
        const userTeams = await getUserTeams();
        setTeams(userTeams);
      } catch (err) {
        console.error('Error loading teams:', err);
        setError('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeams();
  }, [router]);
  
  // Handle team creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      showNotification({
        id: 'team-error',
        title: 'Error',
        message: 'Please enter a team name',
        type: 'error',
      });
      return;
    }
    
    setIsCreatingTeam(true);
    
    try {
      const teamData: CreateTeamRequest = {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      };
      
      const newTeam = await createTeam(teamData);
      
      showNotification({
        id: 'team-created',
        title: 'Team Created',
        message: 'Your team has been created successfully',
        type: 'success',
      });
      
      // Add the new team to the list
      setTeams([...teams, newTeam]);
      
      // Reset form
      setTeamName('');
      setTeamDescription('');
      
      // Navigate to the new team
      router.push(`/teams/${newTeam.id}`);
    } catch (err) {
      console.error('Error creating team:', err);
      
      showNotification({
        id: 'team-error',
        title: 'Error',
        message: 'Failed to create team',
        type: 'error',
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };
  
  // Handle team deletion
  const handleDeleteTeam = async (teamId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    
    setIsDeletingTeam(teamId);
    
    try {
      await deleteTeam(teamId);
      
      showNotification({
        id: 'team-deleted',
        title: 'Team Deleted',
        message: 'Your team has been deleted successfully',
        type: 'success',
      });
      
      // Remove the team from the list
      setTeams(teams.filter(team => team.id !== teamId));
    } catch (err) {
      console.error('Error deleting team:', err);
      
      showNotification({
        id: 'team-error',
        title: 'Error',
        message: 'Failed to delete team',
        type: 'error',
      });
    } finally {
      setIsDeletingTeam(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading teams...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create a Team</CardTitle>
              <CardDescription>
                Create a new team to collaborate with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
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
                
                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreatingTeam || !teamName.trim()}
                  >
                    {isCreatingTeam ? 'Creating...' : 'Create Team'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
          
          {teams.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">You don't have any teams yet</p>
                <p className="text-gray-500 mt-2">Create a team to start collaborating with others</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isOwner={team.owner_id === userId}
                  onDelete={handleDeleteTeam}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
