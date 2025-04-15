'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { useNotification } from '@/app/context/NotificationContext';
import ProfileEditor from '@/app/components/user/ProfileEditor';
import { getUserProfile, getUserActivity, getUserStats, createUserProfile, UserProfile } from '@/app/lib/services/userProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  // State for user data
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for user activity and stats
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // State for UI
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'stats'>('profile');

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createBrowserSupabaseClient();

        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          console.error('Error fetching user:', userError);
          router.push('/auth/login?redirectedFrom=/profile');
          return;
        }

        setUser(currentUser);

        // Get user profile
        const userProfile = await getUserProfile(currentUser.id);

        if (!userProfile) {
          // Create a new profile if it doesn't exist
          const newProfile = await createUserProfile(currentUser.id, {
            full_name: currentUser.user_metadata?.full_name || 'User',
            email: currentUser.email,
          });

          setProfile(newProfile);
        } else {
          setProfile(userProfile);
        }

        // Load user activity
        await loadUserActivity(currentUser.id);

        // Load user stats
        await loadUserStats(currentUser.id);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  // Load user activity
  const loadUserActivity = async (userId: string) => {
    setIsLoadingActivity(true);

    try {
      const userActivities = await getUserActivity(userId, 10);
      setActivities(userActivities);
    } catch (err) {
      console.error('Error loading user activity:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Load user stats
  const loadUserStats = async (userId: string) => {
    try {
      const userStats = await getUserStats(userId);
      setStats(userStats);
    } catch (err) {
      console.error('Error loading user stats:', err);
    }
  };

  // Handle profile update
  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format activity type
  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
        <p>User profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileEditor
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent actions and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading activity...</p>
                  </div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {formatActivityType(activity.activity_type)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Show activity details
                              showNotification({
                                id: 'activity-details',
                                title: formatActivityType(activity.activity_type),
                                message: JSON.stringify(activity.details, null, 2),
                                type: 'info',
                              });
                            }}
                          >
                            Details
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => loadUserActivity(user.id)}
                disabled={isLoadingActivity}
              >
                {isLoadingActivity ? 'Refreshing...' : 'Refresh Activity'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>
                Overview of your activity and contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading stats...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium">Agents</h3>
                      <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">{stats.agents}</span>
                        <span className="ml-2 text-sm text-gray-500">created</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium">Knowledge Bases</h3>
                      <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">{stats.knowledgeBases}</span>
                        <span className="ml-2 text-sm text-gray-500">created</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium">Deployments</h3>
                      <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">{stats.deployments}</span>
                        <span className="ml-2 text-sm text-gray-500">active</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium">Marketplace</h3>
                      <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">{stats.marketplaceAgents}</span>
                        <span className="ml-2 text-sm text-gray-500">published</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => loadUserStats(user.id)}
              >
                Refresh Stats
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
