'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { createKnowledgeBase } from '@/app/lib/db/knowledgeBase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

// Predefined garden types
const gardenTypes = [
  { id: 'personal', name: 'Personal Knowledge', description: 'A garden for your personal notes, ideas, and knowledge' },
  { id: 'research', name: 'Research Collection', description: 'Organize research papers, findings, and insights' },
  { id: 'learning', name: 'Learning Journey', description: 'Track your learning progress in a specific domain' },
  { id: 'project', name: 'Project Documentation', description: 'Document a project with interconnected knowledge' },
  { id: 'reference', name: 'Reference Library', description: 'A collection of reference materials and resources' },
  { id: 'custom', name: 'Custom Garden', description: 'Create a garden with your own structure and purpose' },
];

export default function CreateGardenPage() {
  const router = useRouter();
  
  // Basic information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedType, setSelectedType] = useState('personal');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirectedFrom=/mind-gardens/create');
      }
    };
    
    getUser();
  }, [router]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in to create a knowledge garden');
      return;
    }
    
    if (!name.trim()) {
      setError('Garden name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const garden = await createKnowledgeBase(
        name,
        description,
        userId,
        isPublic
      );
      
      if (garden) {
        router.push(`/mind-gardens/${garden.id}`);
      } else {
        setError('Failed to create knowledge garden');
      }
    } catch (err) {
      console.error('Error creating knowledge garden:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create a Knowledge Garden</h1>
        <p className="mt-2 text-lg text-gray-600">
          Design a personalized knowledge base that grows and evolves over time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Garden Details</CardTitle>
          <CardDescription>
            Provide basic information about your knowledge garden
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Garden Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AI Research, Programming Notes, Philosophy Concepts"
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this knowledge garden for?"
                className="w-full rounded-md border border-gray-300 p-2 min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Garden Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gardenTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 border rounded-md cursor-pointer ${
                      selectedType === type.id ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Make this garden public
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/mind-gardens">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating...' : 'Create Garden'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
