'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { cache } from '../utils/cache';
import { config } from '../config';

/**
 * Semantic Search Service
 * 
 * This service provides functions for semantic search across knowledge bases,
 * documents, and document chunks using vector embeddings.
 */

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  documentId?: string;
  documentTitle?: string;
  knowledgeBaseId?: string;
  knowledgeBaseName?: string;
  highlight?: string;
}

export interface SearchOptions {
  knowledgeBaseIds?: string[];
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  minScore?: number;
  includeMetadata?: boolean;
  includeHighlights?: boolean;
}

/**
 * Perform a semantic search across document chunks
 * 
 * @param query The search query
 * @param options Search options
 * @returns Array of search results
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const embedding = await generateQueryEmbedding(query);
    
    // Set default options
    const {
      knowledgeBaseIds,
      filters = {},
      limit = 10,
      offset = 0,
      minScore = 0.7,
      includeMetadata = true,
      includeHighlights = true,
    } = options;
    
    // Perform the search
    const supabase = createBrowserSupabaseClient();
    
    let matchQuery = supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: minScore,
      match_count: limit + offset,
    });
    
    // Apply knowledge base filter if provided
    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      matchQuery = matchQuery.in('knowledge_base_id', knowledgeBaseIds);
    }
    
    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        matchQuery = matchQuery.in(key, value);
      } else {
        matchQuery = matchQuery.eq(key, value);
      }
    });
    
    // Execute the query
    const { data, error } = await matchQuery;
    
    if (error) {
      console.error('Error performing semantic search:', error);
      throw new Error('Failed to perform semantic search');
    }
    
    // Process the results
    const results = await processSearchResults(data, query, includeMetadata, includeHighlights);
    
    // Apply offset and limit
    return results.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }
}

/**
 * Perform a hybrid search (combining semantic and keyword search)
 * 
 * @param query The search query
 * @param options Search options
 * @returns Array of search results
 */
export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    // Perform semantic search
    const semanticResults = await semanticSearch(query, {
      ...options,
      limit: options.limit ? options.limit * 2 : 20, // Get more results for reranking
    });
    
    // Perform keyword search
    const keywordResults = await keywordSearch(query, {
      ...options,
      limit: options.limit ? options.limit * 2 : 20, // Get more results for reranking
    });
    
    // Combine and rerank results
    const combinedResults = rerankedResults(semanticResults, keywordResults, query);
    
    // Apply limit
    return combinedResults.slice(0, options.limit || 10);
  } catch (error) {
    console.error('Error in hybrid search:', error);
    throw error;
  }
}

/**
 * Perform a keyword search across document chunks
 * 
 * @param query The search query
 * @param options Search options
 * @returns Array of search results
 */
export async function keywordSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    // Set default options
    const {
      knowledgeBaseIds,
      filters = {},
      limit = 10,
      offset = 0,
      includeMetadata = true,
      includeHighlights = true,
    } = options;
    
    // Prepare the search query
    const supabase = createBrowserSupabaseClient();
    
    // Create a full-text search query
    let searchQuery = supabase
      .from('document_chunks')
      .select(`
        id,
        content,
        metadata,
        document_id,
        documents(id, metadata)
      `)
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english',
      });
    
    // Apply knowledge base filter if provided
    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      searchQuery = searchQuery.in('documents.knowledge_base_id', knowledgeBaseIds);
    }
    
    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        searchQuery = searchQuery.in(key, value);
      } else {
        searchQuery = searchQuery.eq(key, value);
      }
    });
    
    // Apply pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1);
    
    // Execute the query
    const { data, error } = await searchQuery;
    
    if (error) {
      console.error('Error performing keyword search:', error);
      throw new Error('Failed to perform keyword search');
    }
    
    // Process the results
    const results: SearchResult[] = data.map((item) => {
      const documentMetadata = item.documents?.metadata || {};
      
      return {
        id: item.id,
        content: item.content,
        score: 1.0, // Keyword search doesn't provide a score
        metadata: item.metadata,
        documentId: item.document_id,
        documentTitle: documentMetadata.title || 'Untitled Document',
        knowledgeBaseId: documentMetadata.knowledge_base_id,
        knowledgeBaseName: documentMetadata.knowledge_base_name || 'Unknown Knowledge Base',
        highlight: includeHighlights ? generateHighlight(item.content, query) : undefined,
      };
    });
    
    return results;
  } catch (error) {
    console.error('Error in keyword search:', error);
    throw error;
  }
}

/**
 * Find similar documents to a given document
 * 
 * @param documentId The ID of the document to find similar documents for
 * @param options Search options
 * @returns Array of similar documents
 */
export async function findSimilarDocuments(
  documentId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    // Set default options
    const {
      limit = 5,
      offset = 0,
      minScore = 0.7,
      includeMetadata = true,
    } = options;
    
    // Get the document embedding
    const supabase = createBrowserSupabaseClient();
    
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('embedding')
      .eq('id', documentId)
      .single();
    
    if (documentError || !document) {
      console.error('Error fetching document embedding:', documentError);
      throw new Error('Failed to fetch document embedding');
    }
    
    // Find similar documents
    const { data: similarDocuments, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: document.embedding,
        match_threshold: minScore,
        match_count: limit + offset,
      })
      .neq('id', documentId); // Exclude the original document
    
    if (searchError) {
      console.error('Error finding similar documents:', searchError);
      throw new Error('Failed to find similar documents');
    }
    
    // Process the results
    const results: SearchResult[] = similarDocuments.map((item) => ({
      id: item.id,
      content: item.content,
      score: item.similarity,
      metadata: item.metadata,
      documentId: item.id,
      documentTitle: item.metadata.title || 'Untitled Document',
      knowledgeBaseId: item.knowledge_base_id,
      knowledgeBaseName: item.metadata.knowledge_base_name || 'Unknown Knowledge Base',
    }));
    
    // Apply offset
    return results.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error finding similar documents:', error);
    throw error;
  }
}

/**
 * Generate a query embedding
 * 
 * @param query The search query
 * @returns The query embedding
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  // Cache key for the query embedding
  const cacheKey = `query_embedding:${query}`;
  
  return cache.getOrSet(cacheKey, async () => {
    try {
      // In a real implementation, you would use an embedding API
      // For now, we'll just return a placeholder
      return Array.from({ length: 384 }, () => Math.random() * 2 - 1);
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw new Error('Failed to generate query embedding');
    }
  }, 60 * 60 * 1000); // Cache for 1 hour
}

/**
 * Process search results
 * 
 * @param results The raw search results
 * @param query The search query
 * @param includeMetadata Whether to include metadata
 * @param includeHighlights Whether to include highlights
 * @returns Processed search results
 */
async function processSearchResults(
  results: any[],
  query: string,
  includeMetadata: boolean,
  includeHighlights: boolean
): Promise<SearchResult[]> {
  // Get document information for the chunks
  const supabase = createBrowserSupabaseClient();
  
  // Extract document IDs
  const documentIds = [...new Set(results.map((result) => result.document_id))];
  
  // Fetch documents
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, metadata, knowledge_base_id')
    .in('id', documentIds);
  
  if (error) {
    console.error('Error fetching documents for search results:', error);
    throw new Error('Failed to fetch documents for search results');
  }
  
  // Create a map of document information
  const documentMap = new Map(
    documents.map((doc) => [
      doc.id,
      {
        metadata: doc.metadata,
        knowledgeBaseId: doc.knowledge_base_id,
      },
    ])
  );
  
  // Process the results
  return results.map((result) => {
    const documentInfo = documentMap.get(result.document_id) || {
      metadata: {},
      knowledgeBaseId: null,
    };
    
    return {
      id: result.id,
      content: result.content,
      score: result.similarity,
      metadata: includeMetadata ? result.metadata : undefined,
      documentId: result.document_id,
      documentTitle: documentInfo.metadata.title || 'Untitled Document',
      knowledgeBaseId: documentInfo.knowledgeBaseId,
      knowledgeBaseName: documentInfo.metadata.knowledge_base_name || 'Unknown Knowledge Base',
      highlight: includeHighlights ? generateHighlight(result.content, query) : undefined,
    };
  });
}

/**
 * Generate a highlight for a search result
 * 
 * @param content The content to highlight
 * @param query The search query
 * @returns The highlighted content
 */
function generateHighlight(content: string, query: string): string {
  // Simple highlighting: find the first occurrence of the query or its terms
  const queryTerms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  const contentLower = content.toLowerCase();
  
  // Try to find a match for the full query
  let matchIndex = contentLower.indexOf(query.toLowerCase());
  
  // If no match for the full query, try to find a match for any of the terms
  if (matchIndex === -1) {
    for (const term of queryTerms) {
      matchIndex = contentLower.indexOf(term);
      if (matchIndex !== -1) break;
    }
  }
  
  // If still no match, just use the beginning of the content
  if (matchIndex === -1) {
    matchIndex = 0;
  }
  
  // Get a window around the match
  const windowSize = 100;
  const start = Math.max(0, matchIndex - windowSize / 2);
  const end = Math.min(content.length, matchIndex + windowSize / 2);
  
  // Extract the highlight
  let highlight = content.substring(start, end);
  
  // Add ellipsis if needed
  if (start > 0) highlight = '...' + highlight;
  if (end < content.length) highlight = highlight + '...';
  
  return highlight;
}

/**
 * Rerank and combine search results
 * 
 * @param semanticResults Semantic search results
 * @param keywordResults Keyword search results
 * @param query The search query
 * @returns Reranked and combined search results
 */
function rerankedResults(
  semanticResults: SearchResult[],
  keywordResults: SearchResult[],
  query: string
): SearchResult[] {
  // Create a map to deduplicate results
  const resultMap = new Map<string, SearchResult>();
  
  // Add semantic results with their scores
  semanticResults.forEach((result) => {
    resultMap.set(result.id, result);
  });
  
  // Add keyword results, boosting their scores
  keywordResults.forEach((result) => {
    if (resultMap.has(result.id)) {
      // If the result is already in the map, boost its score
      const existingResult = resultMap.get(result.id)!;
      existingResult.score = Math.max(existingResult.score, result.score * 0.8);
    } else {
      // Otherwise, add it to the map
      resultMap.set(result.id, result);
    }
  });
  
  // Convert the map back to an array and sort by score
  return Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
}
