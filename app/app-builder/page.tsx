'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { useNotification } from '@/app/context/NotificationContext';

export default function AppBuilderPage() {
  const { showNotification } = useNotification();
  const [userApps, setUserApps] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modular App Builder</h1>
          <p className="mt-2 text-lg text-gray-600">
            Create custom agent-powered applications without coding
          </p>
        </div>
        <div>
          <Link href="/app-builder/create">
            <Button>Create New App</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="my-apps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-apps">My Apps</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="my-apps" className="space-y-4">
          {userApps.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="py-12">
                  <h3 className="text-lg font-medium mb-2">You haven't created any apps yet</h3>
                  <p className="text-gray-500 mb-4">
                    Get started by creating your first app or using a template
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link href="/app-builder/create">
                      <Button>Create New App</Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        document.querySelector('[data-value="templates"]')?.dispatchEvent(
                          new MouseEvent('click', { bubbles: true })
                        );
                      }}
                    >
                      Browse Templates
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* App cards would go here */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Customer Support Bot</CardTitle>
                <CardDescription>An AI-powered customer support assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <span className="text-gray-400">Preview Image</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Beginner</span>
                  <span className="mx-2">•</span>
                  <span>5 components</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    showNotification({
                      title: 'Template Used',
                      message: 'Customer Support Bot template has been added to your workspace',
                      type: 'success'
                    });
                  }}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Knowledge Base Explorer</CardTitle>
                <CardDescription>Search and navigate through your knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <span className="text-gray-400">Preview Image</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Intermediate</span>
                  <span className="mx-2">•</span>
                  <span>8 components</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    showNotification({
                      title: 'Template Used',
                      message: 'Knowledge Base Explorer template has been added to your workspace',
                      type: 'success'
                    });
                  }}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Data Analysis Dashboard</CardTitle>
                <CardDescription>Visualize and analyze data with AI insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <span className="text-gray-400">Preview Image</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Advanced</span>
                  <span className="mx-2">•</span>
                  <span>12 components</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    showNotification({
                      title: 'Template Used',
                      message: 'Data Analysis Dashboard template has been added to your workspace',
                      type: 'success'
                    });
                  }}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Search apps..."
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="px-4 py-2 border rounded-md">
                <option>All Categories</option>
                <option>Productivity</option>
                <option>Customer Support</option>
                <option>Data Analysis</option>
                <option>Knowledge Management</option>
              </select>
              <select className="px-4 py-2 border rounded-md">
                <option>Most Popular</option>
                <option>Newest</option>
                <option>Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>AI Research Assistant</CardTitle>
                <CardDescription>By AgentGenesisLabs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <span className="text-gray-400">Preview Image</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="mx-2">•</span>
                  <span>1.2k installs</span>
                </div>
                <p className="text-sm text-gray-600">
                  An AI-powered research assistant that helps you find, analyze, and summarize information.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => {
                    showNotification({
                      title: 'App Installed',
                      message: 'AI Research Assistant has been installed',
                      type: 'success'
                    });
                  }}
                >
                  Install
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Content Generator</CardTitle>
                <CardDescription>By CreativeAI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <span className="text-gray-400">Preview Image</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span>⭐⭐⭐⭐</span>
                  <span className="mx-2">•</span>
                  <span>876 installs</span>
                </div>
                <p className="text-sm text-gray-600">
                  Generate blog posts, social media content, and marketing copy with AI.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => {
                    showNotification({
                      title: 'App Installed',
                      message: 'Content Generator has been installed',
                      type: 'success'
                    });
                  }}
                >
                  Install
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>By DataInsights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <span className="text-gray-400">Preview Image</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="mx-2">•</span>
                  <span>1.5k installs</span>
                </div>
                <p className="text-sm text-gray-600">
                  Analyze your data with AI-powered insights and visualizations.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => {
                    showNotification({
                      title: 'App Installed',
                      message: 'Smart Analytics has been installed',
                      type: 'success'
                    });
                  }}
                >
                  Install
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
