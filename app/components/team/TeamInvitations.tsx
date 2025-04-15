'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { TeamInvitation, TeamRole, CreateTeamInvitationRequest } from '@/app/lib/types/team';
import { createTeamInvitation, resendTeamInvitation, cancelTeamInvitation } from '@/app/lib/services/teamInvitationService';
import { useNotification } from '@/app/context/NotificationContext';

interface TeamInvitationsProps {
  teamId: string;
  invitations: TeamInvitation[];
  canInvite: boolean;
  onInvitationUpdated?: () => void;
}

export default function TeamInvitations({
  teamId,
  invitations,
  canInvite,
  onInvitationUpdated,
}: TeamInvitationsProps) {
  const { showNotification } = useNotification();
  
  // State for new invitation
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const [isInviting, setIsInviting] = useState(false);
  
  // State for invitation actions
  const [isResending, setIsResending] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  
  // Handle invitation creation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showNotification({
        id: 'invitation-error',
        title: 'Error',
        message: 'Please enter an email address',
        type: 'error',
      });
      return;
    }
    
    setIsInviting(true);
    
    try {
      const invitationData: CreateTeamInvitationRequest = {
        email: email.trim(),
        role,
      };
      
      await createTeamInvitation(teamId, invitationData);
      
      showNotification({
        id: 'invitation-sent',
        title: 'Invitation Sent',
        message: `Invitation has been sent to ${email}`,
        type: 'success',
      });
      
      // Reset form
      setEmail('');
      setRole('member');
      
      if (onInvitationUpdated) {
        onInvitationUpdated();
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      
      showNotification({
        id: 'invitation-error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to send invitation',
        type: 'error',
      });
    } finally {
      setIsInviting(false);
    }
  };
  
  // Handle invitation resend
  const handleResendInvitation = async (invitationId: string) => {
    setIsResending(invitationId);
    
    try {
      await resendTeamInvitation(invitationId);
      
      showNotification({
        id: 'invitation-resent',
        title: 'Invitation Resent',
        message: 'Invitation has been resent',
        type: 'success',
      });
      
      if (onInvitationUpdated) {
        onInvitationUpdated();
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      
      showNotification({
        id: 'invitation-error',
        title: 'Error',
        message: 'Failed to resend invitation',
        type: 'error',
      });
    } finally {
      setIsResending(null);
    }
  };
  
  // Handle invitation cancellation
  const handleCancelInvitation = async (invitationId: string) => {
    setIsCancelling(invitationId);
    
    try {
      await cancelTeamInvitation(invitationId);
      
      showNotification({
        id: 'invitation-cancelled',
        title: 'Invitation Cancelled',
        message: 'Invitation has been cancelled',
        type: 'success',
      });
      
      if (onInvitationUpdated) {
        onInvitationUpdated();
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      
      showNotification({
        id: 'invitation-error',
        title: 'Error',
        message: 'Failed to cancel invitation',
        type: 'error',
      });
    } finally {
      setIsCancelling(null);
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
  
  // Format status for display
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Members</CardTitle>
            <CardDescription>
              Send invitations to new team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as TeamRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage team invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending invitations</p>
            ) : (
              <div className="divide-y">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">
                            Role: {formatRole(invitation.role)}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(invitation.status)}`}>
                          {formatStatus(invitation.status)}
                        </span>
                        
                        {invitation.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                              disabled={isResending === invitation.id}
                            >
                              {isResending === invitation.id ? 'Resending...' : 'Resend'}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              disabled={isCancelling === invitation.id}
                            >
                              {isCancelling === invitation.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          </>
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
    </div>
  );
}
