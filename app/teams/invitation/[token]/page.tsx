'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';
import { TeamInvitation } from '@/app/lib/types/team';
import { getInvitationByToken, acceptTeamInvitation, declineTeamInvitation } from '@/app/lib/services/teamInvitationService';

export default function TeamInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const token = params.token as string;
  
  // State for invitation
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for actions
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  
  // Load invitation
  useEffect(() => {
    const loadInvitation = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push(`/auth/login?redirectedFrom=/teams/invitation/${token}`);
          return;
        }
        
        // Get invitation
        const invitationData = await getInvitationByToken(token);
        
        if (!invitationData) {
          setError('Invitation not found or has expired');
          return;
        }
        
        setInvitation(invitationData);
        
        // Check if the invitation is for the current user
        if (invitationData.email !== user.email) {
          setError('This invitation is for a different email address');
        }
        
        // Check if the invitation has expired
        if (new Date(invitationData.expires_at) < new Date()) {
          setError('This invitation has expired');
        }
        
        // Check if the invitation has already been processed
        if (invitationData.status !== 'pending') {
          setIsProcessed(true);
          
          if (invitationData.status === 'accepted') {
            setError('You have already accepted this invitation');
          } else if (invitationData.status === 'declined') {
            setError('You have already declined this invitation');
          } else {
            setError('This invitation is no longer valid');
          }
        }
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
      loadInvitation();
    }
  }, [token, router]);
  
  // Handle invitation acceptance
  const handleAcceptInvitation = async () => {
    if (!invitation) return;
    
    setIsAccepting(true);
    
    try {
      await acceptTeamInvitation(token);
      
      showNotification({
        id: 'invitation-accepted',
        title: 'Invitation Accepted',
        message: 'You have successfully joined the team',
        type: 'success',
      });
      
      setIsProcessed(true);
      
      // Redirect to the team page
      router.push(`/teams/${invitation.team_id}`);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      
      showNotification({
        id: 'invitation-error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to accept invitation',
        type: 'error',
      });
    } finally {
      setIsAccepting(false);
    }
  };
  
  // Handle invitation decline
  const handleDeclineInvitation = async () => {
    if (!invitation) return;
    
    setIsDeclining(true);
    
    try {
      await declineTeamInvitation(token);
      
      showNotification({
        id: 'invitation-declined',
        title: 'Invitation Declined',
        message: 'You have declined the team invitation',
        type: 'info',
      });
      
      setIsProcessed(true);
      
      // Redirect to the teams page
      router.push('/teams');
    } catch (err) {
      console.error('Error declining invitation:', err);
      
      showNotification({
        id: 'invitation-error',
        title: 'Error',
        message: 'Failed to decline invitation',
        type: 'error',
      });
    } finally {
      setIsDeclining(false);
    }
  };
  
  // Format role for display
  const formatRole = (role: string): string => {
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              <p>{error}</p>
            </div>
          ) : invitation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                  {invitation.teams?.avatar_url ? (
                    <Image
                      src={invitation.teams.avatar_url}
                      alt={invitation.teams.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-xl font-bold">
                      {invitation.teams?.name.charAt(0).toUpperCase() || 'T'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium">
                  You've been invited to join
                </h3>
                <p className="text-xl font-bold mt-1">
                  {invitation.teams?.name || 'Team'}
                </p>
                <p className="text-gray-500 mt-1">
                  {invitation.teams?.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Your Email</p>
                    <p className="font-medium">{invitation.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Role</p>
                    <p className="font-medium">{formatRole(invitation.role)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invited By</p>
                    <p className="font-medium">Team Admin</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expires</p>
                    <p className="font-medium">{new Date(invitation.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Invitation not found</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {!error && invitation && !isProcessed ? (
            <>
              <Button
                variant="outline"
                onClick={handleDeclineInvitation}
                disabled={isDeclining || isAccepting}
              >
                {isDeclining ? 'Declining...' : 'Decline'}
              </Button>
              <Button
                onClick={handleAcceptInvitation}
                disabled={isAccepting || isDeclining}
              >
                {isAccepting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            </>
          ) : (
            <Link href="/teams" className="w-full">
              <Button className="w-full">
                Go to Teams
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
