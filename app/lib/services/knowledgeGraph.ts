'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { cache } from '../utils/cache';
import { config } from '../config';

/**
 * Knowledge Graph Service
 * 
 * This service provides functions for creating, managing, and querying
 * knowledge graphs built from documents and knowledge bases.
 */

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'entity' | 'concept' | 'document' | 'chunk' | 'topic';
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
  properties?: Record<string, any>;
}

export interface KnowledgeGraph {
  id: string;
  name: string;
  description?: string;
  knowledgeBaseId?: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphQuery {
  startNodeIds?: string[];
  nodeTypes?: string[];
  edgeLabels?: string[];
  maxDepth?: number;
  limit?: number;
}

/**
 * Create a knowledge graph from a knowledge base
 * 
 * @param knowledgeBaseId The ID of the knowledge base
 * @param name The name of the knowledge graph
 * @param description The description of the knowledge graph
 * @returns The created knowledge graph
 */
export async function createKnowledgeGraph(
  knowledgeBaseId: string,
  name: string,
  description?: string
): Promise<KnowledgeGraph> {
  try {
    // Generate a unique ID for the knowledge graph
    const graphId = `graph_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create the knowledge graph
    const graph: KnowledgeGraph = {
      id: graphId,
      name,
      description,
      knowledgeBaseId,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Save the knowledge graph
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from('knowledge_graphs')
      .insert({
        id: graph.id,
        name: graph.name,
        description: graph.description,
        knowledge_base_id: graph.knowledgeBaseId,
        metadata: {},
      });
    
    if (error) {
      console.error('Error creating knowledge graph:', error);
      throw new Error('Failed to create knowledge graph');
    }
    
    // Build the knowledge graph
    await buildKnowledgeGraph(graph.id);
    
    return graph;
  } catch (error) {
    console.error('Error creating knowledge graph:', error);
    throw error;
  }
}

/**
 * Get a knowledge graph by ID
 * 
 * @param graphId The ID of the knowledge graph
 * @returns The knowledge graph
 */
export async function getKnowledgeGraph(graphId: string): Promise<KnowledgeGraph> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the knowledge graph
    const { data: graph, error: graphError } = await supabase
      .from('knowledge_graphs')
      .select('*')
      .eq('id', graphId)
      .single();
    
    if (graphError) {
      console.error('Error fetching knowledge graph:', graphError);
      throw new Error('Failed to fetch knowledge graph');
    }
    
    // Get the nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('knowledge_graph_nodes')
      .select('*')
      .eq('graph_id', graphId);
    
    if (nodesError) {
      console.error('Error fetching knowledge graph nodes:', nodesError);
      throw new Error('Failed to fetch knowledge graph nodes');
    }
    
    // Get the edges
    const { data: edges, error: edgesError } = await supabase
      .from('knowledge_graph_edges')
      .select('*')
      .eq('graph_id', graphId);
    
    if (edgesError) {
      console.error('Error fetching knowledge graph edges:', edgesError);
      throw new Error('Failed to fetch knowledge graph edges');
    }
    
    // Format the knowledge graph
    return {
      id: graph.id,
      name: graph.name,
      description: graph.description,
      knowledgeBaseId: graph.knowledge_base_id,
      nodes: nodes.map((node) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        properties: node.properties || {},
        metadata: node.metadata || {},
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        label: edge.label,
        weight: edge.weight,
        properties: edge.properties || {},
      })),
      metadata: graph.metadata || {},
      createdAt: graph.created_at,
      updatedAt: graph.updated_at,
    };
  } catch (error) {
    console.error('Error getting knowledge graph:', error);
    throw error;
  }
}

/**
 * Build a knowledge graph from a knowledge base
 * 
 * @param graphId The ID of the knowledge graph to build
 * @returns Whether the build was successful
 */
export async function buildKnowledgeGraph(graphId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Get the knowledge graph
    const { data: graph, error: graphError } = await supabase
      .from('knowledge_graphs')
      .select('*')
      .eq('id', graphId)
      .single();
    
    if (graphError) {
      console.error('Error fetching knowledge graph:', graphError);
      throw new Error('Failed to fetch knowledge graph');
    }
    
    // Get the documents from the knowledge base
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('knowledge_base_id', graph.knowledge_base_id);
    
    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      throw new Error('Failed to fetch documents');
    }
    
    // Extract entities and concepts from the documents
    const entities = await extractEntities(documents);
    const concepts = await extractConcepts(documents);
    
    // Create nodes for documents
    const documentNodes: KnowledgeNode[] = documents.map((doc) => ({
      id: `node_doc_${doc.id}`,
      label: doc.metadata.title || 'Untitled Document',
      type: 'document',
      properties: {
        documentId: doc.id,
        contentType: doc.metadata.contentType,
      },
      metadata: doc.metadata,
    }));
    
    // Create nodes for entities
    const entityNodes: KnowledgeNode[] = entities.map((entity) => ({
      id: `node_entity_${entity.id}`,
      label: entity.name,
      type: 'entity',
      properties: {
        entityType: entity.type,
        frequency: entity.frequency,
      },
    }));
    
    // Create nodes for concepts
    const conceptNodes: KnowledgeNode[] = concepts.map((concept) => ({
      id: `node_concept_${concept.id}`,
      label: concept.name,
      type: 'concept',
      properties: {
        relevance: concept.relevance,
      },
    }));
    
    // Combine all nodes
    const allNodes = [...documentNodes, ...entityNodes, ...conceptNodes];
    
    // Create edges between nodes
    const edges: KnowledgeEdge[] = [];
    
    // Connect entities to documents
    entities.forEach((entity) => {
      entity.documentIds.forEach((docId) => {
        edges.push({
          id: `edge_entity_${entity.id}_doc_${docId}`,
          source: `node_entity_${entity.id}`,
          target: `node_doc_${docId}`,
          label: 'APPEARS_IN',
          weight: entity.frequency,
        });
      });
    });
    
    // Connect concepts to documents
    concepts.forEach((concept) => {
      concept.documentIds.forEach((docId) => {
        edges.push({
          id: `edge_concept_${concept.id}_doc_${docId}`,
          source: `node_concept_${concept.id}`,
          target: `node_doc_${docId}`,
          label: 'RELATED_TO',
          weight: concept.relevance,
        });
      });
    });
    
    // Connect related entities
    entities.forEach((entity) => {
      entity.relatedEntityIds.forEach((relatedId) => {
        edges.push({
          id: `edge_entity_${entity.id}_entity_${relatedId}`,
          source: `node_entity_${entity.id}`,
          target: `node_entity_${relatedId}`,
          label: 'RELATED_TO',
          weight: 0.5, // Default weight
        });
      });
    });
    
    // Connect related concepts
    concepts.forEach((concept) => {
      concept.relatedConceptIds.forEach((relatedId) => {
        edges.push({
          id: `edge_concept_${concept.id}_concept_${relatedId}`,
          source: `node_concept_${concept.id}`,
          target: `node_concept_${relatedId}`,
          label: 'RELATED_TO',
          weight: 0.5, // Default weight
        });
      });
    });
    
    // Save nodes to the database
    const { error: nodesError } = await supabase
      .from('knowledge_graph_nodes')
      .insert(
        allNodes.map((node) => ({
          id: node.id,
          graph_id: graphId,
          label: node.label,
          type: node.type,
          properties: node.properties,
          metadata: node.metadata,
        }))
      );
    
    if (nodesError) {
      console.error('Error saving knowledge graph nodes:', nodesError);
      throw new Error('Failed to save knowledge graph nodes');
    }
    
    // Save edges to the database
    const { error: edgesError } = await supabase
      .from('knowledge_graph_edges')
      .insert(
        edges.map((edge) => ({
          id: edge.id,
          graph_id: graphId,
          source_id: edge.source,
          target_id: edge.target,
          label: edge.label,
          weight: edge.weight,
          properties: edge.properties,
        }))
      );
    
    if (edgesError) {
      console.error('Error saving knowledge graph edges:', edgesError);
      throw new Error('Failed to save knowledge graph edges');
    }
    
    // Update the knowledge graph
    const { error: updateError } = await supabase
      .from('knowledge_graphs')
      .update({
        updated_at: new Date().toISOString(),
        metadata: {
          nodeCount: allNodes.length,
          edgeCount: edges.length,
          entityCount: entityNodes.length,
          conceptCount: conceptNodes.length,
          documentCount: documentNodes.length,
        },
      })
      .eq('id', graphId);
    
    if (updateError) {
      console.error('Error updating knowledge graph:', updateError);
      throw new Error('Failed to update knowledge graph');
    }
    
    return true;
  } catch (error) {
    console.error('Error building knowledge graph:', error);
    throw error;
  }
}

/**
 * Query a knowledge graph
 * 
 * @param graphId The ID of the knowledge graph
 * @param query The query parameters
 * @returns The subgraph matching the query
 */
export async function queryKnowledgeGraph(
  graphId: string,
  query: GraphQuery
): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
  try {
    // Get the full knowledge graph
    const graph = await getKnowledgeGraph(graphId);
    
    // Set default query parameters
    const {
      startNodeIds = [],
      nodeTypes = [],
      edgeLabels = [],
      maxDepth = 2,
      limit = 100,
    } = query;
    
    // If no start nodes are specified, use all nodes
    const startNodes = startNodeIds.length > 0
      ? graph.nodes.filter((node) => startNodeIds.includes(node.id))
      : graph.nodes;
    
    // Filter nodes by type if specified
    const filteredStartNodes = nodeTypes.length > 0
      ? startNodes.filter((node) => nodeTypes.includes(node.type))
      : startNodes;
    
    // Perform breadth-first traversal
    const visitedNodeIds = new Set<string>();
    const resultNodes: KnowledgeNode[] = [];
    const resultEdges: KnowledgeEdge[] = [];
    
    // Queue for BFS traversal
    const queue: { nodeId: string; depth: number }[] = filteredStartNodes.map((node) => ({
      nodeId: node.id,
      depth: 0,
    }));
    
    while (queue.length > 0 && resultNodes.length < limit) {
      const { nodeId, depth } = queue.shift()!;
      
      // Skip if already visited
      if (visitedNodeIds.has(nodeId)) continue;
      
      // Mark as visited
      visitedNodeIds.add(nodeId);
      
      // Add node to results
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (node) {
        resultNodes.push(node);
      }
      
      // Stop traversal if max depth reached
      if (depth >= maxDepth) continue;
      
      // Find connected edges
      const connectedEdges = graph.edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );
      
      // Filter edges by label if specified
      const filteredEdges = edgeLabels.length > 0
        ? connectedEdges.filter((edge) => edgeLabels.includes(edge.label))
        : connectedEdges;
      
      // Add edges to results and queue connected nodes
      for (const edge of filteredEdges) {
        // Add edge to results if not already added
        if (!resultEdges.some((e) => e.id === edge.id)) {
          resultEdges.push(edge);
        }
        
        // Queue the connected node
        const connectedNodeId = edge.source === nodeId ? edge.target : edge.source;
        if (!visitedNodeIds.has(connectedNodeId)) {
          queue.push({
            nodeId: connectedNodeId,
            depth: depth + 1,
          });
        }
      }
    }
    
    return {
      nodes: resultNodes,
      edges: resultEdges,
    };
  } catch (error) {
    console.error('Error querying knowledge graph:', error);
    throw error;
  }
}

/**
 * Find the shortest path between two nodes in a knowledge graph
 * 
 * @param graphId The ID of the knowledge graph
 * @param sourceNodeId The ID of the source node
 * @param targetNodeId The ID of the target node
 * @returns The path between the nodes
 */
export async function findShortestPath(
  graphId: string,
  sourceNodeId: string,
  targetNodeId: string
): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
  try {
    // Get the full knowledge graph
    const graph = await getKnowledgeGraph(graphId);
    
    // Implement Dijkstra's algorithm for shortest path
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();
    
    // Initialize distances
    graph.nodes.forEach((node) => {
      distances[node.id] = node.id === sourceNodeId ? 0 : Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });
    
    // Process nodes
    while (unvisited.size > 0) {
      // Find the unvisited node with the smallest distance
      let currentNodeId: string | null = null;
      let smallestDistance = Infinity;
      
      for (const nodeId of unvisited) {
        if (distances[nodeId] < smallestDistance) {
          smallestDistance = distances[nodeId];
          currentNodeId = nodeId;
        }
      }
      
      // If no reachable nodes remain or we've reached the target, break
      if (currentNodeId === null || currentNodeId === targetNodeId || smallestDistance === Infinity) {
        break;
      }
      
      // Remove the current node from unvisited
      unvisited.delete(currentNodeId);
      
      // Find connected edges
      const connectedEdges = graph.edges.filter(
        (edge) => edge.source === currentNodeId || edge.target === currentNodeId
      );
      
      // Update distances to neighbors
      for (const edge of connectedEdges) {
        const neighborId = edge.source === currentNodeId ? edge.target : edge.source;
        
        // Calculate new distance (using inverse of weight as cost)
        const cost = 1 / (edge.weight || 0.1); // Avoid division by zero
        const newDistance = distances[currentNodeId] + cost;
        
        // Update if new distance is smaller
        if (newDistance < distances[neighborId]) {
          distances[neighborId] = newDistance;
          previous[neighborId] = currentNodeId;
        }
      }
    }
    
    // Reconstruct the path
    const path: string[] = [];
    let current = targetNodeId;
    
    // If target is unreachable, return empty path
    if (previous[targetNodeId] === null && targetNodeId !== sourceNodeId) {
      return { nodes: [], edges: [] };
    }
    
    // Build the path from target to source
    while (current !== null) {
      path.unshift(current);
      current = previous[current] || null;
    }
    
    // Extract nodes and edges in the path
    const pathNodes = path.map((nodeId) => graph.nodes.find((node) => node.id === nodeId)!);
    const pathEdges: KnowledgeEdge[] = [];
    
    // Find edges between consecutive nodes in the path
    for (let i = 0; i < path.length - 1; i++) {
      const edge = graph.edges.find(
        (e) => (e.source === path[i] && e.target === path[i + 1]) ||
               (e.source === path[i + 1] && e.target === path[i])
      );
      
      if (edge) {
        pathEdges.push(edge);
      }
    }
    
    return {
      nodes: pathNodes,
      edges: pathEdges,
    };
  } catch (error) {
    console.error('Error finding shortest path:', error);
    throw error;
  }
}

// Helper functions

/**
 * Extract entities from documents
 */
async function extractEntities(documents: any[]): Promise<any[]> {
  // In a real implementation, you would use an NLP service
  // For now, we'll just return placeholder data
  
  return [
    {
      id: 'entity1',
      name: 'Example Entity 1',
      type: 'PERSON',
      frequency: 0.8,
      documentIds: documents.slice(0, 2).map((doc) => doc.id),
      relatedEntityIds: ['entity2'],
    },
    {
      id: 'entity2',
      name: 'Example Entity 2',
      type: 'ORGANIZATION',
      frequency: 0.6,
      documentIds: documents.slice(1, 3).map((doc) => doc.id),
      relatedEntityIds: ['entity1'],
    },
  ];
}

/**
 * Extract concepts from documents
 */
async function extractConcepts(documents: any[]): Promise<any[]> {
  // In a real implementation, you would use an NLP service
  // For now, we'll just return placeholder data
  
  return [
    {
      id: 'concept1',
      name: 'Example Concept 1',
      relevance: 0.9,
      documentIds: documents.slice(0, 3).map((doc) => doc.id),
      relatedConceptIds: ['concept2'],
    },
    {
      id: 'concept2',
      name: 'Example Concept 2',
      relevance: 0.7,
      documentIds: documents.slice(1, 4).map((doc) => doc.id),
      relatedConceptIds: ['concept1'],
    },
  ];
}
