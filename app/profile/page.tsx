'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  updated_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        // Get the user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          setError('Failed to load profile');
        } else {
          setProfile(data);
          setFullName(data.full_name || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        setError('Failed to update profile');
      } else {
        setProfile({
          ...profile,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
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
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          <p>{error || 'Profile not found'}</p>
        </div>
        <Button onClick={() => router.push('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <Button variant="outline" className="mt-4" disabled>
                Change Picture
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                  {error}
                </div>
              )}
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full rounded-md border border-gray-300 p-2 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Full Name</h3>
                    <p>{profile.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Email</h3>
                    <p>{profile.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Last Updated</h3>
                    <p>{new Date(profile.updated_at).toLocaleString()}</p>
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
                      setFullName(profile.full_name || '');
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Password</h3>
                  <p className="text-gray-500">••••••••</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push('/auth/reset-password')}>
                Change Password
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
