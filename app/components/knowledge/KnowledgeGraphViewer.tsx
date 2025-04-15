'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { KnowledgeEdge, KnowledgeGraph, KnowledgeNode, queryKnowledgeGraph } from '@/app/lib/services/knowledgeGraph';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';

interface KnowledgeGraphViewerProps {
  graphId: string;
  initialQuery?: {
    startNodeIds?: string[];
    nodeTypes?: string[];
    edgeLabels?: string[];
    maxDepth?: number;
    limit?: number;
  };
  height?: number;
  width?: number;
  onNodeClick?: (node: KnowledgeNode) => void;
}

export default function KnowledgeGraphViewer({
  graphId,
  initialQuery = {},
  height = 600,
  width = 800,
  onNodeClick,
}: KnowledgeGraphViewerProps) {
  // State for graph data
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for graph visualization
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  
  // State for filters
  const [nodeTypeFilters, setNodeTypeFilters] = useState<string[]>([]);
  const [edgeLabelFilters, setEdgeLabelFilters] = useState<string[]>([]);
  const [maxDepth, setMaxDepth] = useState(initialQuery.maxDepth || 2);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs
  const graphRef = useRef<any>(null);
  
  // Load graph data
  useEffect(() => {
    const loadGraphData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { nodes: queryNodes, edges: queryEdges } = await queryKnowledgeGraph(graphId, {
          startNodeIds: initialQuery.startNodeIds,
          nodeTypes: initialQuery.nodeTypes || nodeTypeFilters,
          edgeLabels: initialQuery.edgeLabels || edgeLabelFilters,
          maxDepth: initialQuery.maxDepth || maxDepth,
          limit: initialQuery.limit || 100,
        });
        
        setNodes(queryNodes);
        setEdges(queryEdges);
      } catch (err) {
        console.error('Error loading knowledge graph:', err);
        setError('Failed to load knowledge graph');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGraphData();
  }, [graphId, initialQuery, nodeTypeFilters, edgeLabelFilters, maxDepth]);
  
  // Handle node hover
  const handleNodeHover = (node: KnowledgeNode | null) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    
    // Find connected nodes and links
    const connectedNodeIds = new Set<string>();
    const connectedLinkIds = new Set<string>();
    
    connectedNodeIds.add(node.id);
    
    edges.forEach((edge) => {
      if (edge.source === node.id || edge.target === node.id) {
        connectedLinkIds.add(edge.id);
        connectedNodeIds.add(edge.source === node.id ? edge.target : edge.source);
      }
    });
    
    setHighlightNodes(connectedNodeIds);
    setHighlightLinks(connectedLinkIds);
  };
  
  // Handle node click
  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node);
    
    if (onNodeClick) {
      onNodeClick(node);
    }
  };
  
  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Find nodes matching the search query
    const matchingNodes = nodes.filter((node) =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (matchingNodes.length > 0) {
      // Center the graph on the first matching node
      const firstMatch = matchingNodes[0];
      
      if (graphRef.current) {
        graphRef.current.centerAt(
          (firstMatch as any).x,
          (firstMatch as any).y,
          1000
        );
        
        setTimeout(() => {
          graphRef.current.zoom(2, 1000);
        }, 1000);
      }
      
      // Highlight matching nodes
      const matchingNodeIds = new Set(matchingNodes.map((node) => node.id));
      setHighlightNodes(matchingNodeIds);
      
      // Highlight connected links
      const connectedLinkIds = new Set<string>();
      edges.forEach((edge) => {
        if (matchingNodeIds.has(edge.source) || matchingNodeIds.has(edge.target)) {
          connectedLinkIds.add(edge.id);
        }
      });
      setHighlightLinks(connectedLinkIds);
      
      // Set the first matching node as selected
      setSelectedNode(firstMatch);
    }
  };
  
  // Handle filter change
  const handleFilterChange = async () => {
    setIsLoading(true);
    
    try {
      const { nodes: queryNodes, edges: queryEdges } = await queryKnowledgeGraph(graphId, {
        nodeTypes: nodeTypeFilters,
        edgeLabels: edgeLabelFilters,
        maxDepth,
        limit: 100,
      });
      
      setNodes(queryNodes);
      setEdges(queryEdges);
    } catch (err) {
      console.error('Error filtering knowledge graph:', err);
      setError('Failed to filter knowledge graph');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle node type filter toggle
  const toggleNodeTypeFilter = (type: string) => {
    setNodeTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
  
  // Handle edge label filter toggle
  const toggleEdgeLabelFilter = (label: string) => {
    setEdgeLabelFilters((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };
  
  // Get unique node types and edge labels
  const nodeTypes = [...new Set(nodes.map((node) => node.type))];
  const edgeLabels = [...new Set(edges.map((edge) => edge.label))];
  
  // Prepare data for the force graph
  const graphData = {
    nodes: nodes.map((node) => ({
      ...node,
      id: node.id,
      name: node.label,
      val: 1,
      color: getNodeColor(node.type),
    })),
    links: edges.map((edge) => ({
      ...edge,
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      value: edge.weight,
    })),
  };
  
  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex justify-center items-center" style={{ height }}>
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading knowledge graph...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-3/4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Knowledge Graph</CardTitle>
              <CardDescription>
                Visualizing connections between entities, concepts, and documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative" style={{ height, width: '100%' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70 z-10">
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p>Updating graph...</p>
                    </div>
                  </div>
                )}
                
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeColor={(node: any) => 
                    highlightNodes.size > 0
                      ? highlightNodes.has(node.id)
                        ? node.color
                        : 'rgba(200, 200, 200, 0.3)'
                      : node.color
                  }
                  linkColor={(link: any) =>
                    highlightLinks.size > 0
                      ? highlightLinks.has(link.id)
                        ? 'rgba(99, 102, 241, 0.8)'
                        : 'rgba(200, 200, 200, 0.2)'
                      : 'rgba(99, 102, 241, 0.4)'
                  }
                  linkWidth={(link: any) =>
                    highlightLinks.has(link.id) ? 2 : 1
                  }
                  linkLabel={(link: any) => link.label}
                  onNodeHover={handleNodeHover}
                  onNodeClick={handleNodeClick}
                  nodeRelSize={6}
                  linkDirectionalArrowLength={3}
                  linkDirectionalArrowRelPos={1}
                  linkCurvature={0.25}
                  cooldownTicks={100}
                  width={width}
                  height={height}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:w-1/4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search nodes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} className="w-full">
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="nodeTypes">
                  <TabsList className="w-full">
                    <TabsTrigger value="nodeTypes" className="flex-1">Node Types</TabsTrigger>
                    <TabsTrigger value="edgeLabels" className="flex-1">Edge Labels</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="nodeTypes" className="mt-2">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {nodeTypes.map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`type-${type}`}
                            checked={nodeTypeFilters.includes(type)}
                            onChange={() => toggleNodeTypeFilter(type)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700 flex items-center">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getNodeColor(type) }}
                            ></span>
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="edgeLabels" className="mt-2">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {edgeLabels.map((label) => (
                        <div key={label} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`label-${label}`}
                            checked={edgeLabelFilters.includes(label)}
                            onChange={() => toggleEdgeLabelFilter(label)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`label-${label}`} className="ml-2 text-sm text-gray-700">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-4">
                  <label htmlFor="maxDepth" className="block text-sm font-medium text-gray-700">
                    Max Depth: {maxDepth}
                  </label>
                  <input
                    type="range"
                    id="maxDepth"
                    min="1"
                    max="5"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
                
                <Button onClick={handleFilterChange} className="w-full mt-4">
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
            
            {selectedNode && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Selected Node</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Label:</span>
                      <p>{selectedNode.label}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <p className="flex items-center">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                        ></span>
                        {selectedNode.type}
                      </p>
                    </div>
                    
                    {Object.keys(selectedNode.properties).length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Properties:</span>
                        <div className="mt-1 text-sm">
                          {Object.entries(selectedNode.properties).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>
          Showing {nodes.length} nodes and {edges.length} connections.
          {isLoading && ' Updating...'}
        </p>
      </div>
    </div>
  );
}

// Helper functions

/**
 * Get a color for a node type
 */
function getNodeColor(type: string): string {
  switch (type) {
    case 'entity':
      return '#4f46e5'; // Indigo
    case 'concept':
      return '#0ea5e9'; // Sky
    case 'document':
      return '#10b981'; // Emerald
    case 'chunk':
      return '#f59e0b'; // Amber
    case 'topic':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}
