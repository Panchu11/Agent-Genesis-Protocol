'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { generateDocumentSummary } from '@/app/lib/services/documentProcessing';
import { findSimilarDocuments, semanticSearch, SearchResult } from '@/app/lib/services/semanticSearch';

interface DocumentViewerProps {
  documentId: string;
  knowledgeBaseId?: string;
  onClose?: () => void;
}

export default function DocumentViewer({
  documentId,
  knowledgeBaseId,
  onClose,
}: DocumentViewerProps) {
  // State for document data
  const [document, setDocument] = useState<any | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for additional features
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [similarDocuments, setSimilarDocuments] = useState<SearchResult[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'content' | 'chunks' | 'metadata' | 'similar' | 'search'>('content');
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null);
  
  // Load document data
  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Get the document
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();
        
        if (documentError) {
          console.error('Error fetching document:', documentError);
          setError('Failed to fetch document');
          return;
        }
        
        setDocument(documentData);
        
        // Get the document chunks
        const { data: chunksData, error: chunksError } = await supabase
          .from('document_chunks')
          .select('*')
          .eq('document_id', documentId)
          .order('metadata->startIndex', { ascending: true });
        
        if (chunksError) {
          console.error('Error fetching document chunks:', chunksError);
          setError('Failed to fetch document chunks');
          return;
        }
        
        setChunks(chunksData);
        
        // If there are chunks, select the first one
        if (chunksData.length > 0) {
          setSelectedChunk(chunksData[0]);
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);
  
  // Generate document summary
  const handleGenerateSummary = async () => {
    if (!document) return;
    
    setIsSummarizing(true);
    
    try {
      // Check if summary already exists in metadata
      if (document.metadata.summary) {
        setSummary(document.metadata.summary);
        return;
      }
      
      // Generate a summary
      const generatedSummary = await generateDocumentSummary({
        id: document.id,
        content: document.content,
        metadata: document.metadata,
        chunks: chunks.map((chunk) => ({
          id: chunk.id,
          documentId: chunk.document_id,
          content: chunk.content,
          metadata: chunk.metadata,
        })),
      });
      
      setSummary(generatedSummary);
      
      // Save the summary to the document metadata
      const supabase = createBrowserSupabaseClient();
      
      await supabase
        .from('documents')
        .update({
          metadata: {
            ...document.metadata,
            summary: generatedSummary,
          },
        })
        .eq('id', document.id);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };
  
  // Find similar documents
  const handleFindSimilarDocuments = async () => {
    if (!document) return;
    
    setIsLoadingSimilar(true);
    
    try {
      const results = await findSimilarDocuments(document.id, {
        knowledgeBaseIds: knowledgeBaseId ? [knowledgeBaseId] : undefined,
        limit: 5,
        minScore: 0.6,
      });
      
      setSimilarDocuments(results);
      setActiveTab('similar');
    } catch (err) {
      console.error('Error finding similar documents:', err);
      setError('Failed to find similar documents');
    } finally {
      setIsLoadingSimilar(false);
    }
  };
  
  // Search within document
  const handleSearch = async () => {
    if (!document || !searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Search within the document chunks
      const results = await semanticSearch(searchQuery, {
        filters: { document_id: document.id },
        limit: 10,
        includeHighlights: true,
      });
      
      setSearchResults(results);
      setActiveTab('search');
    } catch (err) {
      console.error('Error searching document:', err);
      setError('Failed to search document');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle chunk selection
  const handleChunkSelect = (chunk: any) => {
    setSelectedChunk(chunk);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading document...</p>
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
  
  if (!document) {
    return (
      <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
        <p>Document not found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{document.metadata.title || 'Untitled Document'}</h2>
          <p className="text-gray-500">
            {document.metadata.contentType}{' '}
            {document.metadata.createdAt && `• Created: ${formatDate(document.metadata.createdAt)}`}
          </p>
        </div>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateSummary}
          disabled={isSummarizing}
        >
          {isSummarizing ? 'Generating...' : summary ? 'View Summary' : 'Generate Summary'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleFindSimilarDocuments}
          disabled={isLoadingSimilar}
        >
          {isLoadingSimilar ? 'Finding...' : 'Find Similar Documents'}
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-grow">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within document..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
          <TabsTrigger value="chunks" className="flex-1">Chunks</TabsTrigger>
          <TabsTrigger value="metadata" className="flex-1">Metadata</TabsTrigger>
          <TabsTrigger value="similar" className="flex-1">Similar</TabsTrigger>
          <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-4">
          {summary && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line">{summary}</div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-4">
              <div className="whitespace-pre-line max-h-[500px] overflow-y-auto">
                {document.content}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chunks" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Document Chunks</CardTitle>
                  <CardDescription>
                    {chunks.length} chunks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className={`p-2 rounded-md cursor-pointer ${
                          selectedChunk?.id === chunk.id
                            ? 'bg-indigo-100 border border-indigo-300'
                            : 'hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => handleChunkSelect(chunk)}
                      >
                        <p className="text-sm font-medium">
                          Chunk {chunks.indexOf(chunk) + 1}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {chunk.content.substring(0, 50)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              {selectedChunk ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>
                      Chunk {chunks.indexOf(selectedChunk) + 1}
                    </CardTitle>
                    <CardDescription>
                      {selectedChunk.metadata.startIndex} - {selectedChunk.metadata.endIndex}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-line max-h-[400px] overflow-y-auto">
                      {selectedChunk.content}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent>
                    <p className="text-gray-500">Select a chunk to view its content</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="metadata" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(document.metadata).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-gray-700">{key}</h3>
                    <div className="mt-1 text-sm">
                      {typeof value === 'object' ? (
                        <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <p>{String(value)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="similar" className="mt-4">
          {isLoadingSimilar ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Finding similar documents...</p>
              </div>
            </div>
          ) : similarDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No similar documents found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleFindSimilarDocuments}
                >
                  Find Similar Documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {similarDocuments.map((result) => (
                <Card key={result.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{result.documentTitle}</CardTitle>
                    <CardDescription>
                      Similarity: {(result.score * 100).toFixed(1)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {result.content.substring(0, 200)}...
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Handle viewing the similar document
                        window.open(`/mind-gardens/document/${result.documentId}`, '_blank');
                      }}
                    >
                      View Document
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="search" className="mt-4">
          {isSearching ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Searching document...</p>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  {searchQuery.trim() ? 'No results found' : 'Enter a search query to find content within this document'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <Card key={result.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>Search Result</CardTitle>
                    <CardDescription>
                      Relevance: {(result.score * 100).toFixed(1)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.highlight ? (
                      <div className="text-sm">
                        <p className="font-medium mb-1">Matching content:</p>
                        <p className="text-gray-600">{result.highlight}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {result.content.substring(0, 200)}...
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Find and select the chunk
                        const chunk = chunks.find((c) => c.id === result.id);
                        if (chunk) {
                          setSelectedChunk(chunk);
                          setActiveTab('chunks');
                        }
                      }}
                    >
                      View in Context
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
