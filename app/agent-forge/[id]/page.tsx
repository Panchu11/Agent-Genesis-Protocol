'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { getAgentById, updateAgent, deleteAgent, StoredAgent } from '@/app/lib/db/agentStorage';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<StoredAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    getUser();
  }, []);

  // Load agent data
  useEffect(() => {
    const loadAgentData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const agentData = await getAgentById(agentId);
        
        if (!agentData) {
          setError('Agent not found');
          setIsLoading(false);
          return;
        }
        
        setAgent(agentData);
        setName(agentData.name);
        setDescription(agentData.description || '');
        setIsPublic(agentData.is_public);
      } catch (err) {
        console.error('Error loading agent data:', err);
        setError('Failed to load agent');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgentData();
  }, [agentId]);

  // Handle agent update
  const handleUpdateAgent = async () => {
    if (!agent || !userId) return;
    
    setIsSaving(true);
    
    try {
      const updatedAgent = await updateAgent(agentId, {
        name,
        description,
        is_public: isPublic
      }, userId);
      
      if (updatedAgent) {
        setAgent(updatedAgent);
        setIsEditing(false);
      } else {
        setError('Failed to update agent');
      }
    } catch (err) {
      console.error('Error updating agent:', err);
      setError('An error occurred while updating the agent');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle agent deletion
  const handleDeleteAgent = async () => {
    if (!agent || !userId) return;
    
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const success = await deleteAgent(agentId, userId);
      
      if (success) {
        router.push('/agent-forge');
      } else {
        setError('Failed to delete agent');
      }
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('An error occurred while deleting the agent');
    } finally {
      setIsDeleting(false);
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
          <p>Loading agent...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          <p>{error}</p>
        </div>
        <Link href="/agent-forge">
          <Button>Back to Agent Forge</Button>
        </Link>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-4">
          <p>Agent not found</p>
        </div>
        <Link href="/agent-forge">
          <Button>Back to Agent Forge</Button>
        </Link>
      </div>
    );
  }

  const isOwner = userId === agent.user_id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {agent.description || 'No description provided'}
          </p>
          <div className="flex items-center mt-2 space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${agent.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {agent.is_public ? 'Public' : 'Private'}
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
              Version {agent.version}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href="/agent-forge">
            <Button variant="outline">Back to Agents</Button>
          </Link>
          {isOwner && (
            <Button onClick={() => setIsEditing(true)}>Edit Agent</Button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('personality')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personality'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Personality
          </button>
          <button
            onClick={() => setActiveTab('capabilities')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'capabilities'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Capabilities
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'versions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Version History
          </button>
        </nav>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Agent</CardTitle>
            <CardDescription>
              Update your agent's basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Agent Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                className="w-full rounded-md border border-gray-300 p-2 min-h-[100px]"
              />
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
                Make this agent public
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAgent}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Agent'}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setName(agent.name);
                  setDescription(agent.description || '');
                  setIsPublic(agent.is_public);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateAgent}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Agent Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Created</h3>
                    <p className="text-sm text-gray-900">{new Date(agent.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Last Updated</h3>
                    <p className="text-sm text-gray-900">{new Date(agent.updated_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Archetype</h3>
                    <p className="text-sm text-gray-900">{agent.personality.archetype}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Agent Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Description</h3>
                    <p className="text-sm text-gray-900">{agent.description || 'No description provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Personality</h3>
                    <p className="text-sm text-gray-900">{agent.personality.description || 'No personality description provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Capabilities</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agent.capabilities.map((capability) => (
                        <span key={capability.id} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                          {capability.name}
                        </span>
                      ))}
                      {agent.capabilities.length === 0 && (
                        <span className="text-sm text-gray-500">No capabilities enabled</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="w-full" disabled>
                      Chat with Agent
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      Run Experiment
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      Add to Knowledge Base
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'personality' && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Personality</CardTitle>
                <CardDescription>
                  The personality traits and characteristics of this agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Archetype</h3>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-medium">{agent.personality.archetype}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Personality Description</h3>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p>{agent.personality.description || 'No personality description provided'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Traits</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.personality.traits.map((trait, index) => (
                      <div key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        {trait}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Values</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.personality.values.map((value, index) => (
                      <div key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Communication Tone</h3>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="capitalize">{agent.personality.tone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'capabilities' && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Capabilities</CardTitle>
                <CardDescription>
                  The features and abilities this agent can use
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agent.capabilities.length === 0 ? (
                  <div className="bg-yellow-50 p-4 rounded-md text-center">
                    <p className="text-yellow-700">
                      This agent doesn't have any capabilities enabled.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agent.capabilities.map((capability) => (
                      <div key={capability.id} className="border p-4 rounded-md">
                        <h3 className="font-medium">{capability.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{capability.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'versions' && (
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                  Track changes to this agent over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 p-4 rounded-md text-center">
                  <p className="text-yellow-700">
                    Version history is not available yet. This feature is coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
