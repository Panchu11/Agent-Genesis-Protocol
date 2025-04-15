'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { cache } from '../utils/cache';
import { config } from '../config';

/**
 * Document Processing Service
 * 
 * This service provides functions for processing documents in various formats,
 * extracting content, and preparing them for knowledge base integration.
 */

export interface DocumentMetadata {
  title: string;
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  source?: string;
  tags?: string[];
  language?: string;
  contentType: string;
  fileSize?: number;
  pageCount?: number;
  wordCount?: number;
  summary?: string;
}

export interface ProcessedDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  embedding?: number[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    pageNumber?: number;
    section?: string;
    startIndex: number;
    endIndex: number;
  };
  embedding?: number[];
}

/**
 * Process a text document
 * 
 * @param content The text content of the document
 * @param metadata Metadata about the document
 * @returns The processed document
 */
export async function processTextDocument(
  content: string,
  metadata: Partial<DocumentMetadata>
): Promise<ProcessedDocument> {
  try {
    // Generate a unique ID for the document
    const documentId = generateDocumentId();
    
    // Clean and normalize the content
    const cleanedContent = cleanTextContent(content);
    
    // Extract or generate metadata
    const extractedMetadata = extractTextMetadata(cleanedContent, metadata);
    
    // Chunk the document into smaller pieces for processing
    const chunks = chunkTextDocument(documentId, cleanedContent);
    
    // Create the processed document
    const processedDocument: ProcessedDocument = {
      id: documentId,
      content: cleanedContent,
      metadata: extractedMetadata,
      chunks,
    };
    
    return processedDocument;
  } catch (error) {
    console.error('Error processing text document:', error);
    throw new Error('Failed to process text document');
  }
}

/**
 * Process a PDF document
 * 
 * @param file The PDF file to process
 * @param metadata Metadata about the document
 * @returns The processed document
 */
export async function processPdfDocument(
  file: File,
  metadata: Partial<DocumentMetadata>
): Promise<ProcessedDocument> {
  try {
    // Extract text content from PDF
    const content = await extractPdfText(file);
    
    // Generate a unique ID for the document
    const documentId = generateDocumentId();
    
    // Extract or generate metadata
    const extractedMetadata = await extractPdfMetadata(file, metadata);
    
    // Chunk the document into smaller pieces for processing
    const chunks = chunkTextDocument(documentId, content);
    
    // Create the processed document
    const processedDocument: ProcessedDocument = {
      id: documentId,
      content,
      metadata: extractedMetadata,
      chunks,
    };
    
    return processedDocument;
  } catch (error) {
    console.error('Error processing PDF document:', error);
    throw new Error('Failed to process PDF document');
  }
}

/**
 * Process a web page
 * 
 * @param url The URL of the web page to process
 * @returns The processed document
 */
export async function processWebPage(url: string): Promise<ProcessedDocument> {
  try {
    // Fetch and extract content from the web page
    const { content, metadata } = await fetchWebPageContent(url);
    
    // Generate a unique ID for the document
    const documentId = generateDocumentId();
    
    // Clean and normalize the content
    const cleanedContent = cleanHtmlContent(content);
    
    // Chunk the document into smaller pieces for processing
    const chunks = chunkTextDocument(documentId, cleanedContent);
    
    // Create the processed document
    const processedDocument: ProcessedDocument = {
      id: documentId,
      content: cleanedContent,
      metadata: {
        ...metadata,
        contentType: 'text/html',
        source: url,
      },
      chunks,
    };
    
    return processedDocument;
  } catch (error) {
    console.error('Error processing web page:', error);
    throw new Error('Failed to process web page');
  }
}

/**
 * Generate embeddings for a document
 * 
 * @param document The document to generate embeddings for
 * @returns The document with embeddings
 */
export async function generateDocumentEmbeddings(
  document: ProcessedDocument
): Promise<ProcessedDocument> {
  try {
    // Generate embedding for the entire document
    const documentEmbedding = await generateEmbedding(document.content);
    
    // Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      document.chunks.map(async (chunk) => ({
        ...chunk,
        embedding: await generateEmbedding(chunk.content),
      }))
    );
    
    // Return the document with embeddings
    return {
      ...document,
      embedding: documentEmbedding,
      chunks: chunksWithEmbeddings,
    };
  } catch (error) {
    console.error('Error generating document embeddings:', error);
    throw new Error('Failed to generate document embeddings');
  }
}

/**
 * Save a processed document to the database
 * 
 * @param document The processed document to save
 * @param knowledgeBaseId The ID of the knowledge base to save the document to
 * @returns The saved document ID
 */
export async function saveProcessedDocument(
  document: ProcessedDocument,
  knowledgeBaseId: string
): Promise<string> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Save the document
    const { data: savedDocument, error: documentError } = await supabase
      .from('documents')
      .insert({
        id: document.id,
        knowledge_base_id: knowledgeBaseId,
        content: document.content,
        metadata: document.metadata,
        embedding: document.embedding,
      })
      .select('id')
      .single();
    
    if (documentError) {
      console.error('Error saving document:', documentError);
      throw new Error('Failed to save document');
    }
    
    // Save the document chunks
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(
        document.chunks.map((chunk) => ({
          id: chunk.id,
          document_id: document.id,
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: chunk.embedding,
        }))
      );
    
    if (chunksError) {
      console.error('Error saving document chunks:', chunksError);
      throw new Error('Failed to save document chunks');
    }
    
    return savedDocument.id;
  } catch (error) {
    console.error('Error saving processed document:', error);
    throw error;
  }
}

/**
 * Generate a summary for a document
 * 
 * @param document The document to summarize
 * @returns The document summary
 */
export async function generateDocumentSummary(
  document: ProcessedDocument
): Promise<string> {
  try {
    // Use the Fireworks API to generate a summary
    const { generateChatResponse } = await import('../api/fireworks');
    
    const prompt = `
      Please provide a concise summary of the following document:
      
      Title: ${document.metadata.title || 'Untitled Document'}
      
      Content:
      ${document.content.slice(0, 8000)}${document.content.length > 8000 ? '...' : ''}
      
      Provide a summary that captures the main points and key information in 3-5 paragraphs.
    `;
    
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes documents accurately and concisely.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];
    
    const summary = await generateChatResponse(messages, {
      temperature: 0.3,
      max_tokens: 500,
    });
    
    return summary;
  } catch (error) {
    console.error('Error generating document summary:', error);
    throw new Error('Failed to generate document summary');
  }
}

// Helper functions

/**
 * Generate a unique document ID
 */
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Clean and normalize text content
 */
function cleanTextContent(content: string): string {
  // Remove excessive whitespace
  let cleaned = content.replace(/\s+/g, ' ');
  
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  
  return cleaned.trim();
}

/**
 * Clean and normalize HTML content
 */
function cleanHtmlContent(html: string): string {
  // Simple HTML to text conversion
  // In a real implementation, you would use a proper HTML parser
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean the resulting text
  return cleanTextContent(text);
}

/**
 * Extract metadata from text content
 */
function extractTextMetadata(
  content: string,
  providedMetadata: Partial<DocumentMetadata>
): DocumentMetadata {
  // Default metadata
  const defaultMetadata: DocumentMetadata = {
    title: 'Untitled Document',
    contentType: 'text/plain',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    wordCount: content.split(/\s+/).length,
  };
  
  // Try to extract a title from the first line if not provided
  if (!providedMetadata.title) {
    const firstLine = content.split('\n')[0].trim();
    if (firstLine && firstLine.length < 100) {
      defaultMetadata.title = firstLine;
    }
  }
  
  // Merge provided metadata with defaults and extracted metadata
  return {
    ...defaultMetadata,
    ...providedMetadata,
  };
}

/**
 * Extract metadata from a PDF file
 */
async function extractPdfMetadata(
  file: File,
  providedMetadata: Partial<DocumentMetadata>
): Promise<DocumentMetadata> {
  // In a real implementation, you would use a PDF parsing library
  // For now, we'll just use basic file metadata
  
  // Default metadata
  const defaultMetadata: DocumentMetadata = {
    title: file.name.replace(/\.pdf$/i, ''),
    contentType: 'application/pdf',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    fileSize: file.size,
  };
  
  // Merge provided metadata with defaults
  return {
    ...defaultMetadata,
    ...providedMetadata,
  };
}

/**
 * Extract text from a PDF file
 */
async function extractPdfText(file: File): Promise<string> {
  // In a real implementation, you would use a PDF parsing library
  // For now, we'll just return a placeholder
  return `[PDF content extracted from ${file.name}]`;
}

/**
 * Fetch and extract content from a web page
 */
async function fetchWebPageContent(url: string): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
  try {
    // In a real implementation, you would use a server-side API to fetch the web page
    // For now, we'll just return a placeholder
    
    // Extract domain from URL for title
    const domain = new URL(url).hostname;
    
    return {
      content: `[Web content fetched from ${url}]`,
      metadata: {
        title: `Content from ${domain}`,
        source: url,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching web page content:', error);
    throw new Error('Failed to fetch web page content');
  }
}

/**
 * Chunk a document into smaller pieces
 */
function chunkTextDocument(documentId: string, content: string): DocumentChunk[] {
  // Simple chunking strategy: split by paragraphs and combine small paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  
  let currentChunk = '';
  let startIndex = 0;
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would make the chunk too large, save the current chunk
    if (currentChunk.length + paragraph.length > 1000 && currentChunk.length > 0) {
      chunks.push({
        id: `chunk_${documentId}_${chunks.length}`,
        documentId,
        content: currentChunk,
        metadata: {
          startIndex,
          endIndex: startIndex + currentChunk.length,
        },
      });
      
      currentChunk = paragraph;
      startIndex = content.indexOf(paragraph);
    } else {
      // Otherwise, add the paragraph to the current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n';
      }
      currentChunk += paragraph;
      
      // Update startIndex if this is the first paragraph in the chunk
      if (currentChunk === paragraph) {
        startIndex = content.indexOf(paragraph);
      }
    }
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk.length > 0) {
    chunks.push({
      id: `chunk_${documentId}_${chunks.length}`,
      documentId,
      content: currentChunk,
      metadata: {
        startIndex,
        endIndex: startIndex + currentChunk.length,
      },
    });
  }
  
  return chunks;
}

/**
 * Generate an embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // In a real implementation, you would use an embedding API
  // For now, we'll just return a placeholder
  return Array.from({ length: 384 }, () => Math.random() * 2 - 1);
}
