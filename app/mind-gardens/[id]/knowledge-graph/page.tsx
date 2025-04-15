'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';
import KnowledgeGraphViewer from '@/app/components/knowledge/KnowledgeGraphViewer';
import { createKnowledgeGraph, getKnowledgeGraph, KnowledgeNode } from '@/app/lib/services/knowledgeGraph';
import DocumentViewer from '@/app/components/knowledge/DocumentViewer';

export default function KnowledgeGraphPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  
  const knowledgeBaseId = params.id as string;
  
  // State for knowledge base
  const [knowledgeBase, setKnowledgeBase] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for knowledge graph
  const [graph, setGraph] = useState<any | null>(null);
  const [isCreatingGraph, setIsCreatingGraph] = useState(false);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  
  // State for selected document
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  
  // Load knowledge base and graph
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the knowledge base
        const { data: knowledgeBaseData, error: knowledgeBaseError } = await supabase
          .from('knowledge_bases')
          .select('*')
          .eq('id', knowledgeBaseId)
          .single();
        
        if (knowledgeBaseError) {
          console.error('Error fetching knowledge base:', knowledgeBaseError);
          setError('Failed to fetch knowledge base');
          return;
        }
        
        setKnowledgeBase(knowledgeBaseData);
        
        // Check if a knowledge graph exists for this knowledge base
        const { data: graphsData, error: graphsError } = await supabase
          .from('knowledge_graphs')
          .select('*')
          .eq('knowledge_base_id', knowledgeBaseId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (graphsError) {
          console.error('Error fetching knowledge graphs:', graphsError);
          setError('Failed to fetch knowledge graphs');
          return;
        }
        
        if (graphsData.length > 0) {
          // Load the graph data
          await loadGraphData(graphsData[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (knowledgeBaseId) {
      loadData();
    }
  }, [knowledgeBaseId]);
  
  // Load graph data
  const loadGraphData = async (graphId: string) => {
    setIsGraphLoading(true);
    
    try {
      const graphData = await getKnowledgeGraph(graphId);
      setGraph(graphData);
    } catch (err) {
      console.error('Error loading graph data:', err);
      setError('Failed to load graph data');
    } finally {
      setIsGraphLoading(false);
    }
  };
  
  // Create a new knowledge graph
  const handleCreateGraph = async () => {
    if (!knowledgeBase) return;
    
    setIsCreatingGraph(true);
    
    try {
      const newGraph = await createKnowledgeGraph(
        knowledgeBaseId,
        `${knowledgeBase.name} Graph`,
        `Knowledge graph for ${knowledgeBase.name}`
      );
      
      showNotification({
        id: 'graph-created',
        title: 'Knowledge Graph Created',
        message: 'The knowledge graph has been created successfully',
        type: 'success',
      });
      
      setGraph(newGraph);
    } catch (err) {
      console.error('Error creating knowledge graph:', err);
      showNotification({
        id: 'graph-error',
        title: 'Error',
        message: 'Failed to create knowledge graph',
        type: 'error',
      });
    } finally {
      setIsCreatingGraph(false);
    }
  };
  
  // Handle node click in the graph
  const handleNodeClick = (node: KnowledgeNode) => {
    // If the node is a document, open the document viewer
    if (node.type === 'document' && node.properties.documentId) {
      setSelectedDocument(node.properties.documentId);
      setIsDocumentViewerOpen(true);
    }
  };
  
  // Close document viewer
  const handleCloseDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setSelectedDocument(null);
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
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
          <Link href={`/mind-gardens/${knowledgeBaseId}`}>
            <Button variant="outline">Back to Knowledge Base</Button>
          </Link>
        </div>
        
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/mind-gardens/${knowledgeBaseId}`} className="text-indigo-600 hover:text-indigo-800 flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Knowledge Base
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="mt-2 text-lg text-gray-600">
            {knowledgeBase?.name}
          </p>
        </div>
      </div>
      
      {!graph ? (
        <Card>
          <CardHeader>
            <CardTitle>No Knowledge Graph Found</CardTitle>
            <CardDescription>
              Create a knowledge graph to visualize connections between documents, entities, and concepts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              A knowledge graph helps you understand the relationships between different pieces of information in your knowledge base.
              It can reveal connections that might not be immediately obvious and help you navigate complex information more effectively.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCreateGraph}
              disabled={isCreatingGraph}
            >
              {isCreatingGraph ? 'Creating Graph...' : 'Create Knowledge Graph'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{graph.name}</CardTitle>
              <CardDescription>
                {graph.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>
                  This knowledge graph contains {graph.nodes.length} nodes and {graph.edges.length} connections.
                  Click on nodes to explore connections and view related documents.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <KnowledgeGraphViewer
            graphId={graph.id}
            height={600}
            onNodeClick={handleNodeClick}
          />
          
          {isDocumentViewerOpen && selectedDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <DocumentViewer
                    documentId={selectedDocument}
                    knowledgeBaseId={knowledgeBaseId}
                    onClose={handleCloseDocumentViewer}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
