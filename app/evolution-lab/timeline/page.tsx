'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { useNotification } from '@/app/context/NotificationContext';
import AgentEvolutionTimeline from '@/app/components/evolution/AgentEvolutionTimeline';
import { StoredAgent, getAgentById } from '@/app/lib/db/agentStorage';
import { getAgentVersions } from '@/app/lib/services/agentEvolution';

interface AgentVersion {
  version: number;
  agent: StoredAgent;
  metrics: Record<string, number>;
  timestamp: string;
  improvements?: string[];
}

export default function TimelinePage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // State for agents
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentVersions, setAgentVersions] = useState<AgentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load agents
  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login?redirectedFrom=/evolution-lab/timeline');
          return;
        }
        
        // Get agents
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching agents:', error);
          setError('Failed to load agents');
        } else {
          setAgents(data || []);
          
          // Select the first agent by default
          if (data && data.length > 0) {
            setSelectedAgentId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error in loadAgents:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgents();
  }, [router]);
  
  // Load agent versions when selected agent changes
  useEffect(() => {
    const loadAgentVersions = async () => {
      if (!selectedAgentId) return;
      
      setIsLoadingVersions(true);
      
      try {
        // Get agent versions
        const versions = await getAgentVersions(selectedAgentId);
        
        // Map versions to the format expected by the timeline component
        const mappedVersions: AgentVersion[] = await Promise.all(
          versions.map(async (version) => {
            const agent = await getAgentById(selectedAgentId, version.version);
            
            return {
              version: version.version,
              agent: agent || { id: selectedAgentId, name: 'Unknown Agent', version: version.version },
              metrics: version.metrics || {},
              timestamp: version.timestamp,
              improvements: version.improvements,
            };
          })
        );
        
        setAgentVersions(mappedVersions);
      } catch (err) {
        console.error('Error loading agent versions:', err);
        showNotification({
          id: 'versions-error',
          title: 'Error',
          message: 'Failed to load agent versions',
          type: 'error',
        });
      } finally {
        setIsLoadingVersions(false);
      }
    };
    
    loadAgentVersions();
  }, [selectedAgentId, showNotification]);
  
  // Handle agent selection
  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Agent Evolution Timeline</h1>
        <Link href="/evolution-lab">
          <Button variant="outline">Back to Evolution Lab</Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading agents...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            You don't have any agents yet. Create an agent to track its evolution.
          </p>
          <Link href="/agent-forge/create">
            <Button className="mt-4">Create Agent</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Agent</CardTitle>
              <CardDescription>
                Choose an agent to view its evolution timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedAgentId || ''} onValueChange={handleAgentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          {selectedAgentId && (
            <div>
              {isLoadingVersions ? (
                <div className="flex justify-center items-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading agent versions...</p>
                  </div>
                </div>
              ) : agentVersions.length === 0 ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">
                    This agent doesn't have any evolution data yet. Run experiments to generate evolution data.
                  </p>
                  <Link href="/evolution-lab/create">
                    <Button className="mt-4">Create Experiment</Button>
                  </Link>
                </div>
              ) : (
                <AgentEvolutionTimeline
                  agentVersions={agentVersions}
                  title={`Evolution Timeline: ${agents.find(a => a.id === selectedAgentId)?.name}`}
                  description="Track agent performance metrics over time"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
