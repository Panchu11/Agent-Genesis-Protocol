'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

export default function EvolutionLabPage() {
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
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            You haven't created any experiments yet. Get started by creating your first experiment!
          </p>
          <Link href="/evolution-lab/create">
            <Button className="mt-4">Create Your First Experiment</Button>
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Agent Comparison</h2>
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Select agents to compare their evolution metrics and performance.
          </p>
          <Link href="/evolution-lab/compare">
            <Button className="mt-4">Compare Agents</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
