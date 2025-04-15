'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { getAllAgents, StoredAgent } from '@/app/lib/db/agentStorage';
import { getMarketplaceCategories, MarketplaceCategory, publishAgentToMarketplace } from '@/app/lib/services/marketplace';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';

export default function PublishAgentPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // State for agents and categories
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // State for form
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Load agents and categories
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if user is authenticated
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/auth/login?redirectedFrom=/marketplace/publish');
          return;
        }
        
        setUserId(user.id);
        
        // Load agents
        const agentsData = await getAllAgents(user.id);
        setAgents(agentsData);
        
        if (agentsData.length > 0) {
          setSelectedAgent(agentsData[0].id);
          setDescription(agentsData[0].description || '');
        }
        
        // Load categories
        const categoriesData = await getMarketplaceCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router]);
  
  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    
    // Update description with the selected agent's description
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setDescription(agent.description || '');
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent) {
      showNotification({
        id: 'publish-error',
        title: 'Publish Error',
        message: 'Please select an agent to publish',
        type: 'error'
      });
      return;
    }
    
    if (selectedCategories.length === 0) {
      showNotification({
        id: 'publish-error',
        title: 'Publish Error',
        message: 'Please select at least one category',
        type: 'error'
      });
      return;
    }
    
    if (!description.trim()) {
      showNotification({
        id: 'publish-error',
        title: 'Publish Error',
        message: 'Please provide a description for your agent',
        type: 'error'
      });
      return;
    }
    
    setIsPublishing(true);
    
    try {
      const result = await publishAgentToMarketplace(selectedAgent, {
        price,
        categories: selectedCategories,
        description,
        is_public: isPublic
      });
      
      if (result.success) {
        showNotification({
          id: 'publish-success',
          title: 'Agent Published',
          message: 'Your agent has been submitted to the marketplace for review',
          type: 'success'
        });
        
        // Redirect to marketplace
        router.push('/marketplace');
      } else {
        showNotification({
          id: 'publish-error',
          title: 'Publish Error',
          message: result.error || 'Failed to publish agent',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error publishing agent:', err);
      showNotification({
        id: 'publish-error',
        title: 'Publish Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsPublishing(false);
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publish Agent to Marketplace</h1>
          <p className="mt-2 text-lg text-gray-600">
            Share your agent with the community
          </p>
        </div>
        <div>
          <Link href="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-gray-500">You don't have any agents to publish.</p>
              <div className="mt-4">
                <Link href="/agent-forge/create">
                  <Button>Create an Agent</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Information</CardTitle>
                  <CardDescription>
                    Provide details about your agent for the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="agent" className="block text-sm font-medium text-gray-700">
                        Select Agent
                      </label>
                      <select
                        id="agent"
                        value={selectedAgent || ''}
                        onChange={(e) => handleAgentSelect(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="">Select an agent</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.archetype || 'No archetype'})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Provide a detailed description of your agent, its capabilities, and use cases..."
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        A good description helps users understand what your agent does and how it can help them.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Categories
                      </label>
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className={`p-3 border rounded-md cursor-pointer ${
                              selectedCategories.includes(category.id)
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'hover:border-gray-400'
                            }`}
                            onClick={() => handleCategorySelect(category.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category.id)}
                                onChange={() => {}}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <div>
                                <div className="font-medium">{category.name}</div>
                                <div className="text-xs text-gray-500">{category.agent_count} agents</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Select at least one category that best describes your agent.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Publishing Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="price"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                          className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Set to 0 for a free agent. Pricing is in USD.
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is-public"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is-public" className="ml-2 block text-sm text-gray-700">
                        Make this agent public
                      </label>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              All agents submitted to the marketplace will undergo a review process before being published.
                              This helps ensure quality and appropriateness.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPublishing}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Agent'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
