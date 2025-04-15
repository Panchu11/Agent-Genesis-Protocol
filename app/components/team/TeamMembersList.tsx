'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { TeamMember, TeamRole } from '@/app/lib/types/team';
import { updateTeamMember, removeTeamMember } from '@/app/lib/services/teamService';
import { useNotification } from '@/app/context/NotificationContext';

interface TeamMembersListProps {
  teamId: string;
  members: TeamMember[];
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onMemberUpdated?: () => void;
}

export default function TeamMembersList({
  teamId,
  members,
  currentUserId,
  isOwner,
  isAdmin,
  onMemberUpdated,
}: TeamMembersListProps) {
  const { showNotification } = useNotification();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  // Get user profiles for members
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  
  // Handle role change
  const handleRoleChange = async (userId: string, newRole: TeamRole) => {
    if (!isOwner && !isAdmin) return;
    
    setIsUpdating(userId);
    
    try {
      await updateTeamMember(teamId, userId, { role: newRole });
      
      showNotification({
        id: 'member-updated',
        title: 'Member Updated',
        message: 'Team member role has been updated',
        type: 'success',
      });
      
      if (onMemberUpdated) {
        onMemberUpdated();
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      
      showNotification({
        id: 'member-update-error',
        title: 'Error',
        message: 'Failed to update team member',
        type: 'error',
      });
    } finally {
      setIsUpdating(null);
    }
  };
  
  // Handle member removal
  const handleRemoveMember = async (userId: string) => {
    if ((!isOwner && !isAdmin) || userId === currentUserId) return;
    
    setIsRemoving(userId);
    
    try {
      await removeTeamMember(teamId, userId);
      
      showNotification({
        id: 'member-removed',
        title: 'Member Removed',
        message: 'Team member has been removed',
        type: 'success',
      });
      
      if (onMemberUpdated) {
        onMemberUpdated();
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      
      showNotification({
        id: 'member-remove-error',
        title: 'Error',
        message: 'Failed to remove team member',
        type: 'error',
      });
    } finally {
      setIsRemoving(null);
    }
  };
  
  // Format role for display
  const formatRole = (role: TeamRole): string => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'member':
        return 'Member';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };
  
  // Get role badge color
  const getRoleBadgeColor = (role: TeamRole): string => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage team members and their roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No members found</p>
          ) : (
            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                        {userProfiles[member.user_id]?.avatar_url ? (
                          <Image
                            src={userProfiles[member.user_id].avatar_url}
                            alt={userProfiles[member.user_id].full_name || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-sm font-bold">
                            {userProfiles[member.user_id]?.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {userProfiles[member.user_id]?.full_name || 'User'} 
                          {member.user_id === currentUserId && ' (You)'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                        {formatRole(member.role)}
                      </span>
                      
                      {(isOwner || (isAdmin && member.role !== 'owner' && member.role !== 'admin')) && member.user_id !== currentUserId && (
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.user_id, e.target.value as TeamRole)}
                            disabled={isUpdating === member.user_id || member.role === 'owner'}
                            className="appearance-none bg-white border border-gray-300 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {(isOwner || (isAdmin && member.role !== 'owner')) && member.user_id !== currentUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={isRemoving === member.user_id}
                        >
                          {isRemoving === member.user_id ? 'Removing...' : 'Remove'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
