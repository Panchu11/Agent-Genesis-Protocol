'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

export default function MindGardensPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mind Gardens</h1>
        <p className="mt-2 text-lg text-gray-600">
          Cultivate personalized, evolving knowledge bases
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create New Garden</CardTitle>
            <CardDescription>
              Start a new knowledge garden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Create a personalized knowledge base that grows and evolves through agent and user collaboration.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/mind-gardens/create" className="w-full">
              <Button className="w-full">Create Garden</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Garden Templates</CardTitle>
            <CardDescription>
              Start with pre-built knowledge structures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Choose from a variety of templates designed for different knowledge domains and customize them to your needs.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Explore Gardens</CardTitle>
            <CardDescription>
              Discover public knowledge gardens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Browse and learn from public knowledge gardens created by other users in the AGP ecosystem.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">My Gardens</h2>
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            You haven't created any knowledge gardens yet. Get started by creating your first garden!
          </p>
          <Link href="/mind-gardens/create">
            <Button className="mt-4">Create Your First Garden</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
