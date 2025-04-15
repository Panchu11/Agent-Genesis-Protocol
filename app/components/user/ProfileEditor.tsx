'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { useNotification } from '@/app/context/NotificationContext';
import { UserProfile, updateUserProfile, updateUserPreferences } from '@/app/lib/services/userProfile';

interface ProfileEditorProps {
  profile: UserProfile;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export default function ProfileEditor({ profile, onProfileUpdated }: ProfileEditorProps) {
  const { showNotification } = useNotification();
  
  // State for profile data
  const [fullName, setFullName] = useState(profile.full_name);
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [isPublic, setIsPublic] = useState(profile.is_public);
  
  // State for avatar
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // State for preferences
  const [theme, setTheme] = useState(profile.preferences.theme || 'system');
  const [emailNotifications, setEmailNotifications] = useState(profile.preferences.notifications?.email !== false);
  const [pushNotifications, setPushNotifications] = useState(profile.preferences.notifications?.push !== false);
  const [inAppNotifications, setInAppNotifications] = useState(profile.preferences.notifications?.inApp !== false);
  const [showActivity, setShowActivity] = useState(profile.preferences.privacy?.showActivity !== false);
  const [showAgents, setShowAgents] = useState(profile.preferences.privacy?.showAgents !== false);
  const [showKnowledgeBases, setShowKnowledgeBases] = useState(profile.preferences.privacy?.showKnowledgeBases !== false);
  const [compactView, setCompactView] = useState(profile.preferences.display?.compactView === true);
  const [showTutorials, setShowTutorials] = useState(profile.preferences.display?.showTutorials !== false);
  const [defaultView, setDefaultView] = useState(profile.preferences.display?.defaultView || 'grid');
  const [defaultModel, setDefaultModel] = useState(profile.preferences.ai?.defaultModel || '');
  const [temperature, setTemperature] = useState(profile.preferences.ai?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(profile.preferences.ai?.maxTokens || 2000);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification({
          id: 'avatar-size-error',
          title: 'File Too Large',
          message: 'Avatar image must be less than 5MB',
          type: 'error',
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showNotification({
          id: 'avatar-type-error',
          title: 'Invalid File Type',
          message: 'Please select an image file',
          type: 'error',
        });
        return;
      }
      
      setAvatarFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Upload avatar to storage
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;
    
    setIsUploadingAvatar(true);
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Generate a unique file name
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('user-content')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        console.error('Error uploading avatar:', error);
        throw new Error('Failed to upload avatar');
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Upload avatar if changed
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar() || avatarUrl;
      }
      
      // Update profile
      const updatedProfile = await updateUserProfile(profile.user_id, {
        full_name: fullName,
        display_name: displayName || undefined,
        bio: bio || undefined,
        location: location || undefined,
        website: website || undefined,
        avatar_url: finalAvatarUrl || undefined,
        is_public: isPublic,
      });
      
      showNotification({
        id: 'profile-updated',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully',
        type: 'success',
      });
      
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile changes');
      
      showNotification({
        id: 'profile-error',
        title: 'Error',
        message: 'Failed to save profile changes',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save preferences
  const handleSavePreferences = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Update preferences
      const updatedProfile = await updateUserPreferences(profile.user_id, {
        theme: theme as 'light' | 'dark' | 'system',
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          inApp: inAppNotifications,
        },
        privacy: {
          showActivity,
          showAgents,
          showKnowledgeBases,
        },
        display: {
          compactView,
          showTutorials,
          defaultView: defaultView as 'grid' | 'list',
        },
        ai: {
          defaultModel,
          temperature,
          maxTokens,
        },
      });
      
      showNotification({
        id: 'preferences-updated',
        title: 'Preferences Updated',
        message: 'Your preferences have been updated successfully',
        type: 'success',
      });
      
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
      
      showNotification({
        id: 'preferences-error',
        title: 'Error',
        message: 'Failed to save preferences',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-100">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-4xl font-bold">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Change Avatar
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="sr-only"
                      />
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Recommended: Square image, 500x500 pixels or larger
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="How you want to be addressed"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                      Make my profile public
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !fullName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your experience with Agent Genesis Protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Appearance</h3>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                        Theme
                      </label>
                      <select
                        id="theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="compactView"
                        checked={compactView}
                        onChange={(e) => setCompactView(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="compactView" className="text-sm font-medium text-gray-700">
                        Use compact view
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="defaultView" className="block text-sm font-medium text-gray-700">
                        Default View
                      </label>
                      <select
                        id="defaultView"
                        value={defaultView}
                        onChange={(e) => setDefaultView(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Notifications</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                        Email notifications
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="pushNotifications"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="pushNotifications" className="text-sm font-medium text-gray-700">
                        Push notifications
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="inAppNotifications"
                        checked={inAppNotifications}
                        onChange={(e) => setInAppNotifications(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="inAppNotifications" className="text-sm font-medium text-gray-700">
                        In-app notifications
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Privacy</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showActivity"
                        checked={showActivity}
                        onChange={(e) => setShowActivity(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showActivity" className="text-sm font-medium text-gray-700">
                        Show my activity to others
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showAgents"
                        checked={showAgents}
                        onChange={(e) => setShowAgents(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showAgents" className="text-sm font-medium text-gray-700">
                        Show my agents to others
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showKnowledgeBases"
                        checked={showKnowledgeBases}
                        onChange={(e) => setShowKnowledgeBases(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showKnowledgeBases" className="text-sm font-medium text-gray-700">
                        Show my knowledge bases to others
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">AI Settings</h3>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="defaultModel" className="block text-sm font-medium text-gray-700">
                        Default AI Model
                      </label>
                      <input
                        id="defaultModel"
                        type="text"
                        value={defaultModel}
                        onChange={(e) => setDefaultModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Model ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                        Temperature: {temperature.toFixed(1)}
                      </label>
                      <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>More Precise</span>
                        <span>More Creative</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
                        Max Tokens: {maxTokens}
                      </label>
                      <input
                        id="maxTokens"
                        type="range"
                        min="500"
                        max="8000"
                        step="100"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Help</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showTutorials"
                        checked={showTutorials}
                        onChange={(e) => setShowTutorials(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showTutorials" className="text-sm font-medium text-gray-700">
                        Show tutorials and tips
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
