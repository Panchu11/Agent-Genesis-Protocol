'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Badge } from '@/app/components/common/Badge';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { useNotification } from '@/app/context/NotificationContext';

interface Experiment {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  created_at: string;
  updated_at: string;
  metrics: string[];
  results?: Record<string, any>;
}

export default function EvolutionLabPage() {
  const { showNotification } = useNotification();

  // State for experiments
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load experiments
  useEffect(() => {
    const loadExperiments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createBrowserSupabaseClient();

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('You must be logged in to view experiments');
          setIsLoading(false);
          return;
        }

        // Get experiments
        const { data, error } = await supabase
          .from('experiments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching experiments:', error);
          setError('Failed to load experiments');
        } else {
          setExperiments(data || []);
        }
      } catch (err) {
        console.error('Error in loadExperiments:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiments();
  }, []);

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evolution Laboratory</h1>
        <p className="mt-2 text-lg text-gray-600">
          Track and enhance your agents' evolution over time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create Experiment</CardTitle>
            <CardDescription>
              Design a new evolution experiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Set up experiments to test and improve your agents' performance across different metrics and scenarios.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/evolution-lab/create" className="w-full">
              <Button className="w-full">Create Experiment</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Evolve Agents</CardTitle>
            <CardDescription>
              Enhance agents based on experiments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Evolve your agents based on experiment results or merge traits from multiple agents to create new ones.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/evolution-lab/evolve" className="w-full">
              <Button className="w-full">Evolve Agent</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Agent Metrics</CardTitle>
            <CardDescription>
              Track performance and evolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Monitor your agents' performance metrics and track their evolution over time through visualizations.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Compare Agents</CardTitle>
            <CardDescription>
              Analyze agent performance side by side
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Compare different agents or versions of the same agent to identify strengths, weaknesses, and improvements.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/evolution-lab/compare" className="w-full">
              <Button className="w-full" variant="outline">Compare</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Experiments</h2>
          <Link href="/evolution-lab/create">
            <Button>Create Experiment</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Loading experiments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        ) : experiments.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              You haven't created any experiments yet. Get started by creating your first experiment!
            </p>
            <Link href="/evolution-lab/create">
              <Button className="mt-4">Create Your First Experiment</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments.map((experiment) => (
              <Card key={experiment.id} className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{experiment.name}</CardTitle>
                      <CardDescription>{experiment.type}</CardDescription>
                    </div>
                    <Badge className={getStatusBadgeColor(experiment.status)}>
                      {experiment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600 mb-4">
                    {experiment.description || 'No description provided.'}
                  </p>

                  <div className="space-y-2">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {experiment.metrics.map((metric, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</h4>
                      <p className="text-sm">
                        {new Date(experiment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/evolution-lab/experiments/${experiment.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Agent Comparison</h2>
          <Link href="/evolution-lab/compare">
            <Button variant="outline">Compare Agents</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>
                Compare metrics across multiple agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Visualize and compare performance metrics across different agents to identify strengths and weaknesses.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/evolution-lab/compare" className="w-full">
                <Button variant="outline" className="w-full">Compare Performance</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolution Timeline</CardTitle>
              <CardDescription>
                Track agent evolution over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View how an agent's capabilities have evolved across versions and experiments.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/evolution-lab/timeline" className="w-full">
                <Button variant="outline" className="w-full">View Timeline</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
