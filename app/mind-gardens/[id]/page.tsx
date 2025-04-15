'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { 
  getKnowledgeBaseById, 
  updateKnowledgeBase, 
  deleteKnowledgeBase,
  getKnowledgeNodes,
  createKnowledgeNode,
  updateKnowledgeNode,
  deleteKnowledgeNode,
  KnowledgeBase,
  KnowledgeNode
} from '@/app/lib/db/knowledgeBase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';

export default function GardenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string;
  
  const [garden, setGarden] = useState<KnowledgeBase | null>(null);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
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
  
  // Node editing state
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeContent, setNodeContent] = useState('');
  const [isSavingNode, setIsSavingNode] = useState(false);

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    getUser();
  }, []);

  // Load garden data
  useEffect(() => {
    const loadGardenData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const gardenData = await getKnowledgeBaseById(gardenId);
        
        if (!gardenData) {
          setError('Knowledge garden not found');
          setIsLoading(false);
          return;
        }
        
        setGarden(gardenData);
        setName(gardenData.name);
        setDescription(gardenData.description || '');
        setIsPublic(gardenData.is_public);
        
        // Load nodes
        const nodesData = await getKnowledgeNodes(gardenId);
        setNodes(nodesData);
      } catch (err) {
        console.error('Error loading garden data:', err);
        setError('Failed to load knowledge garden');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGardenData();
  }, [gardenId]);

  // Handle garden update
  const handleUpdateGarden = async () => {
    if (!garden || !userId) return;
    
    setIsSaving(true);
    
    try {
      const updatedGarden = await updateKnowledgeBase(gardenId, {
        name,
        description,
        is_public: isPublic
      }, userId);
      
      if (updatedGarden) {
        setGarden(updatedGarden);
        setIsEditing(false);
      } else {
        setError('Failed to update knowledge garden');
      }
    } catch (err) {
      console.error('Error updating knowledge garden:', err);
      setError('An error occurred while updating the garden');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle garden deletion
  const handleDeleteGarden = async () => {
    if (!garden || !userId) return;
    
    if (!confirm('Are you sure you want to delete this knowledge garden? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const success = await deleteKnowledgeBase(gardenId, userId);
      
      if (success) {
        router.push('/mind-gardens');
      } else {
        setError('Failed to delete knowledge garden');
      }
    } catch (err) {
      console.error('Error deleting knowledge garden:', err);
      setError('An error occurred while deleting the garden');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle node creation
  const handleCreateNode = async () => {
    if (!nodeTitle.trim()) {
      setError('Node title is required');
      return;
    }
    
    setIsSavingNode(true);
    setError(null);
    
    try {
      const newNode = await createKnowledgeNode(
        gardenId,
        nodeTitle,
        nodeContent
      );
      
      if (newNode) {
        setNodes([...nodes, newNode]);
        setIsAddingNode(false);
        setNodeTitle('');
        setNodeContent('');
      } else {
        setError('Failed to create knowledge node');
      }
    } catch (err) {
      console.error('Error creating knowledge node:', err);
      setError('An error occurred while creating the node');
    } finally {
      setIsSavingNode(false);
    }
  };

  // Handle node update
  const handleUpdateNode = async () => {
    if (!editingNodeId || !nodeTitle.trim()) {
      setError('Node title is required');
      return;
    }
    
    setIsSavingNode(true);
    setError(null);
    
    try {
      const updatedNode = await updateKnowledgeNode(editingNodeId, {
        title: nodeTitle,
        content: nodeContent
      });
      
      if (updatedNode) {
        setNodes(nodes.map(node => 
          node.id === editingNodeId ? updatedNode : node
        ));
        setEditingNodeId(null);
        setNodeTitle('');
        setNodeContent('');
      } else {
        setError('Failed to update knowledge node');
      }
    } catch (err) {
      console.error('Error updating knowledge node:', err);
      setError('An error occurred while updating the node');
    } finally {
      setIsSavingNode(false);
    }
  };

  // Handle node deletion
  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
      return;
    }
    
    try {
      const success = await deleteKnowledgeNode(nodeId);
      
      if (success) {
        setNodes(nodes.filter(node => node.id !== nodeId));
      } else {
        setError('Failed to delete knowledge node');
      }
    } catch (err) {
      console.error('Error deleting knowledge node:', err);
      setError('An error occurred while deleting the node');
    }
  };

  // Start editing a node
  const startEditingNode = (node: KnowledgeNode) => {
    setEditingNodeId(node.id);
    setNodeTitle(node.title);
    setNodeContent(node.content);
    setIsAddingNode(false);
  };

  // Cancel node editing
  const cancelNodeEditing = () => {
    setEditingNodeId(null);
    setNodeTitle('');
    setNodeContent('');
    setIsAddingNode(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading garden...</p>
        </div>
      </div>
    );
  }

  if (error && !garden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          <p>{error}</p>
        </div>
        <Link href="/mind-gardens">
          <Button>Back to Mind Gardens</Button>
        </Link>
      </div>
    );
  }

  if (!garden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-4">
          <p>Knowledge garden not found</p>
        </div>
        <Link href="/mind-gardens">
          <Button>Back to Mind Gardens</Button>
        </Link>
      </div>
    );
  }

  const isOwner = userId === garden.user_id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{garden.name}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {garden.description || 'No description provided'}
          </p>
          <div className="flex items-center mt-2">
            <span className={`px-2 py-1 text-xs rounded-full ${garden.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {garden.is_public ? 'Public Garden' : 'Private Garden'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href="/mind-gardens">
            <Button variant="outline">Back to Gardens</Button>
          </Link>
          {isOwner && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Garden</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Garden</CardTitle>
            <CardDescription>
              Update your knowledge garden's basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Garden Name
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
                Make this garden public
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteGarden}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Garden'}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setName(garden.name);
                  setDescription(garden.description || '');
                  setIsPublic(garden.is_public);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateGarden}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Garden Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Created</h3>
                  <p className="text-sm text-gray-900">{new Date(garden.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Last Updated</h3>
                  <p className="text-sm text-gray-900">{new Date(garden.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Nodes</h3>
                  <p className="text-sm text-gray-900">{nodes.length}</p>
                </div>
              </CardContent>
              {isOwner && (
                <CardFooter>
                  <Button 
                    onClick={() => {
                      setIsAddingNode(true);
                      setEditingNodeId(null);
                      setNodeTitle('');
                      setNodeContent('');
                    }}
                    className="w-full"
                  >
                    Add Knowledge Node
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <div className="md:col-span-3">
            {isAddingNode || editingNodeId ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editingNodeId ? 'Edit Node' : 'Add Knowledge Node'}</CardTitle>
                  <CardDescription>
                    {editingNodeId ? 'Update an existing knowledge node' : 'Add a new piece of knowledge to your garden'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="nodeTitle" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      id="nodeTitle"
                      value={nodeTitle}
                      onChange={(e) => setNodeTitle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="e.g., Key Concept, Important Insight"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="nodeContent" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      id="nodeContent"
                      value={nodeContent}
                      onChange={(e) => setNodeContent(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 min-h-[200px]"
                      placeholder="Enter the knowledge content here..."
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={cancelNodeEditing}
                    disabled={isSavingNode}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingNodeId ? handleUpdateNode : handleCreateNode}
                    disabled={isSavingNode || !nodeTitle.trim()}
                  >
                    {isSavingNode ? 'Saving...' : editingNodeId ? 'Update Node' : 'Add Node'}
                  </Button>
                </CardFooter>
              </Card>
            ) : nodes.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Nodes Yet</h3>
                    <p className="text-gray-500 mb-4">
                      This garden doesn't have any knowledge nodes yet.
                      {isOwner && ' Start adding nodes to grow your knowledge garden.'}
                    </p>
                    {isOwner && (
                      <Button 
                        onClick={() => {
                          setIsAddingNode(true);
                          setEditingNodeId(null);
                          setNodeTitle('');
                          setNodeContent('');
                        }}
                      >
                        Add First Node
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {nodes.map((node) => (
                  <Card key={node.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{node.title}</CardTitle>
                        {isOwner && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditingNode(node)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <CardDescription>
                        Added on {new Date(node.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{node.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
