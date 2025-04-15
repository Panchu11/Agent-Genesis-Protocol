'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { cache } from '../utils/cache';
import { TeamInvitation, TeamRole, CreateTeamInvitationRequest } from '../types/team';
import { getTeamById } from './teamService';
import { config } from '../config';

/**
 * Team Invitation Service
 * 
 * This service provides functions for managing team invitations.
 */

/**
 * Get team invitations
 * 
 * @param teamId The ID of the team
 * @returns Array of team invitations
 */
export async function getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching team invitations:', error);
      throw new Error('Failed to fetch team invitations');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTeamInvitations:', error);
    throw error;
  }
}

/**
 * Get invitations for a user by email
 * 
 * @param email The email address
 * @returns Array of team invitations
 */
export async function getUserInvitations(email: string): Promise<TeamInvitation[]> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams (
          id,
          name,
          description,
          avatar_url,
          owner_id
        )
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user invitations:', error);
      throw new Error('Failed to fetch user invitations');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserInvitations:', error);
    throw error;
  }
}

/**
 * Get an invitation by ID
 * 
 * @param invitationId The ID of the invitation
 * @returns The invitation or null if not found
 */
export async function getInvitationById(invitationId: string): Promise<TeamInvitation | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching invitation:', error);
      throw new Error('Failed to fetch invitation');
    }
    
    return data;
  } catch (error) {
    console.error('Error in getInvitationById:', error);
    throw error;
  }
}

/**
 * Get an invitation by token
 * 
 * @param token The invitation token
 * @returns The invitation or null if not found
 */
export async function getInvitationByToken(token: string): Promise<TeamInvitation | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams (
          id,
          name,
          description,
          avatar_url,
          owner_id
        )
      `)
      .eq('token', token)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching invitation by token:', error);
      throw new Error('Failed to fetch invitation by token');
    }
    
    return data;
  } catch (error) {
    console.error('Error in getInvitationByToken:', error);
    throw error;
  }
}

/**
 * Create a team invitation
 * 
 * @param teamId The ID of the team
 * @param invitationData The invitation data
 * @returns The created invitation
 */
export async function createTeamInvitation(
  teamId: string,
  invitationData: CreateTeamInvitationRequest
): Promise<TeamInvitation> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if the team exists
    const team = await getTeamById(teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    // Check if the user is already a member of the team
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();
    
    if (!existingMember && team.owner_id !== user.id) {
      throw new Error('You are not a member of this team');
    }
    
    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', invitationData.email)
      .eq('status', 'pending')
      .single();
    
    if (existingInvitation) {
      throw new Error('There is already a pending invitation for this email');
    }
    
    // Generate a unique token
    const token = generateInvitationToken();
    
    // Create the invitation
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: invitationData.email,
        role: invitationData.role,
        invited_by: user.id,
        token,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating team invitation:', error);
      throw new Error('Failed to create team invitation');
    }
    
    // Send invitation email
    await sendInvitationEmail(data, team.name, user.user_metadata?.full_name || 'A team member');
    
    return data;
  } catch (error) {
    console.error('Error in createTeamInvitation:', error);
    throw error;
  }
}

/**
 * Resend a team invitation
 * 
 * @param invitationId The ID of the invitation
 * @returns The updated invitation
 */
export async function resendTeamInvitation(invitationId: string): Promise<TeamInvitation> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get the invitation
    const invitation = await getInvitationById(invitationId);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    // Check if the invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }
    
    // Get the team
    const team = await getTeamById(invitation.team_id);
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    // Update the invitation with a new expiration date
    const { data, error } = await supabase
      .from('team_invitations')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .eq('id', invitationId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating team invitation:', error);
      throw new Error('Failed to update team invitation');
    }
    
    // Send invitation email
    await sendInvitationEmail(data, team.name, user.user_metadata?.full_name || 'A team member');
    
    return data;
  } catch (error) {
    console.error('Error in resendTeamInvitation:', error);
    throw error;
  }
}

/**
 * Cancel a team invitation
 * 
 * @param invitationId The ID of the invitation
 * @returns Whether the invitation was cancelled successfully
 */
export async function cancelTeamInvitation(invitationId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Delete the invitation
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);
    
    if (error) {
      console.error('Error cancelling team invitation:', error);
      throw new Error('Failed to cancel team invitation');
    }
    
    return true;
  } catch (error) {
    console.error('Error in cancelTeamInvitation:', error);
    throw error;
  }
}

/**
 * Accept a team invitation
 * 
 * @param token The invitation token
 * @returns Whether the invitation was accepted successfully
 */
export async function acceptTeamInvitation(token: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get the invitation
    const invitation = await getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    // Check if the invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }
    
    // Check if the invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update the invitation status to expired
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      throw new Error('Invitation has expired');
    }
    
    // Check if the invitation email matches the user's email
    if (invitation.email !== user.email) {
      throw new Error('Invitation email does not match your account email');
    }
    
    // Check if the user is already a member of the team
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .single();
    
    if (existingMember) {
      // Update the invitation status to accepted
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);
      
      return true;
    }
    
    // Add the user as a team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
      });
    
    if (memberError) {
      console.error('Error adding team member:', memberError);
      throw new Error('Failed to add team member');
    }
    
    // Update the invitation status to accepted
    const { error: invitationError } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);
    
    if (invitationError) {
      console.error('Error updating invitation status:', invitationError);
      throw new Error('Failed to update invitation status');
    }
    
    return true;
  } catch (error) {
    console.error('Error in acceptTeamInvitation:', error);
    throw error;
  }
}

/**
 * Decline a team invitation
 * 
 * @param token The invitation token
 * @returns Whether the invitation was declined successfully
 */
export async function declineTeamInvitation(token: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the invitation
    const invitation = await getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    // Check if the invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }
    
    // Update the invitation status to declined
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'declined' })
      .eq('id', invitation.id);
    
    if (error) {
      console.error('Error declining invitation:', error);
      throw new Error('Failed to decline invitation');
    }
    
    return true;
  } catch (error) {
    console.error('Error in declineTeamInvitation:', error);
    throw error;
  }
}

/**
 * Generate a unique invitation token
 * 
 * @returns A unique token
 */
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Send an invitation email
 * 
 * @param invitation The invitation
 * @param teamName The name of the team
 * @param inviterName The name of the inviter
 */
async function sendInvitationEmail(
  invitation: TeamInvitation,
  teamName: string,
  inviterName: string
): Promise<void> {
  try {
    // In a real implementation, this would send an email
    // For now, we'll just log the invitation details
    console.log('Sending invitation email:', {
      to: invitation.email,
      subject: `You've been invited to join ${teamName} on Agent Genesis Protocol`,
      body: `
        ${inviterName} has invited you to join ${teamName} on Agent Genesis Protocol.
        
        Click the link below to accept the invitation:
        ${config.appUrl}/teams/invitation/${invitation.token}
        
        This invitation will expire on ${new Date(invitation.expires_at).toLocaleString()}.
      `,
    });
    
    // In a real implementation, you would use an email service like SendGrid, Mailgun, etc.
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: invitation.email,
      from: 'noreply@agentgenesisprotocol.com',
      subject: `You've been invited to join ${teamName} on Agent Genesis Protocol`,
      text: `
        ${inviterName} has invited you to join ${teamName} on Agent Genesis Protocol.
        
        Click the link below to accept the invitation:
        ${config.appUrl}/teams/invitation/${invitation.token}
        
        This invitation will expire on ${new Date(invitation.expires_at).toLocaleString()}.
      `,
      html: `
        <p>${inviterName} has invited you to join <strong>${teamName}</strong> on Agent Genesis Protocol.</p>
        
        <p>Click the button below to accept the invitation:</p>
        
        <p>
          <a href="${config.appUrl}/teams/invitation/${invitation.token}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
            Accept Invitation
          </a>
        </p>
        
        <p>This invitation will expire on ${new Date(invitation.expires_at).toLocaleString()}.</p>
      `,
    };
    
    await sgMail.send(msg);
    */
  } catch (error) {
    console.error('Error sending invitation email:', error);
    // Don't throw an error here, as we don't want to fail the invitation creation
    // if the email fails to send
  }
}
