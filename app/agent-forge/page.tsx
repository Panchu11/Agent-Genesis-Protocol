'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

export default function AgentForgePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Forge</h1>
        <p className="mt-2 text-lg text-gray-600">
          Create and manage your autonomous agents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create New Agent</CardTitle>
            <CardDescription>
              Build a new autonomous agent from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Design an agent with a unique personality, knowledge base, and capabilities tailored to your specific needs.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/agent-forge/create" className="w-full">
              <Button className="w-full">Create Agent</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Explore Templates</CardTitle>
            <CardDescription>
              Start with pre-built agent templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Choose from a variety of templates designed for different purposes and customize them to your needs.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Discover Agents</CardTitle>
            <CardDescription>
              Explore agents created by the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Browse and interact with public agents created by other users in the AGP ecosystem.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/agent-forge/explore" className="w-full">
              <Button className="w-full" variant="outline">Explore</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Agents</h2>
          <Link href="/agent-forge/explore">
            <Button variant="outline">Explore Public Agents</Button>
          </Link>
        </div>
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            You haven't created any agents yet. Get started by creating your first agent!
          </p>
          <Link href="/agent-forge/create">
            <Button className="mt-4">Create Your First Agent</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
