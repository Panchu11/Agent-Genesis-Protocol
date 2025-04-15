'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPublicAgents, StoredAgent } from '@/app/lib/db/agentStorage';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

export default function ExploreAgentsPage() {
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);

  // Load public agents
  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const agentsData = await getPublicAgents(50);
        setAgents(agentsData);
      } catch (err) {
        console.error('Error loading public agents:', err);
        setError('Failed to load agents');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgents();
  }, []);

  // Get unique archetypes
  const archetypes = Array.from(new Set(agents.map(agent => agent.personality.archetype)));
  
  // Get unique capabilities
  const capabilities = Array.from(
    new Set(
      agents.flatMap(agent => 
        agent.capabilities.map(cap => cap.name)
      )
    )
  );

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by archetype
    const matchesArchetype = selectedArchetype === null || 
      agent.personality.archetype === selectedArchetype;
    
    // Filter by capability
    const matchesCapability = selectedCapability === null || 
      agent.capabilities.some(cap => cap.name === selectedCapability);
    
    return matchesSearch && matchesArchetype && matchesCapability;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Agents</h1>
          <p className="mt-2 text-lg text-gray-600">
            Discover and interact with public agents created by the community
          </p>
        </div>
        <div>
          <Link href="/agent-forge">
            <Button variant="outline">Back to Agent Forge</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Agents</CardTitle>
          <CardDescription>
            Find agents that match your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description"
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </div>
            
            <div>
              <label htmlFor="archetype" className="block text-sm font-medium text-gray-700 mb-1">
                Archetype
              </label>
              <select
                id="archetype"
                value={selectedArchetype || ''}
                onChange={(e) => setSelectedArchetype(e.target.value || null)}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">All Archetypes</option>
                {archetypes.map((archetype) => (
                  <option key={archetype} value={archetype}>
                    {archetype}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="capability" className="block text-sm font-medium text-gray-700 mb-1">
                Capability
              </label>
              <select
                id="capability"
                value={selectedCapability || ''}
                onChange={(e) => setSelectedCapability(e.target.value || null)}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">All Capabilities</option>
                {capabilities.map((capability) => (
                  <option key={capability} value={capability}>
                    {capability}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setSelectedArchetype(null);
              setSelectedCapability(null);
            }}
          >
            Clear Filters
          </Button>
        </CardFooter>
      </Card>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-yellow-50 p-8 rounded-md text-center">
          <p className="text-yellow-700 mb-4">
            No agents found matching your filters.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setSelectedArchetype(null);
              setSelectedCapability(null);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>
                  {agent.personality.archetype}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  {agent.description || 'No description provided'}
                </p>
                
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Traits</h4>
                  <div className="flex flex-wrap gap-1">
                    {agent.personality.traits.slice(0, 3).map((trait, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                        {trait}
                      </span>
                    ))}
                    {agent.personality.traits.length > 3 && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                        +{agent.personality.traits.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((capability, index) => (
                      <span key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                        {capability.name}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                        +{agent.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/agent-forge/${agent.id}`} className="w-full">
                  <Button variant="outline" className="w-full">View Agent</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
