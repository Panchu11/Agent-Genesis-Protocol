'use client';

// Fireworks AI API client for Dobby-Unhinged model
import { config } from '../config';

const FIREWORKS_API_KEY = config.fireworks.apiKey;
const MODEL_ID = config.fireworks.modelId;
const API_URL = `${config.fireworks.apiUrl}/chat/completions`;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FireworksRequestOptions {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function generateChatResponse(
  messages: Message[],
  options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
    retries?: number;
  } = {}
) {
  const { temperature = 0.7, max_tokens = 1024, stream = false, onChunk, retries = 2 } = options;

  const requestOptions: FireworksRequestOptions = {
    messages,
    temperature,
    max_tokens,
    stream,
  };

  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts <= retries) {
    try {
      if (attempts > 0) {
        console.log(`Retry attempt ${attempts} of ${retries}`);
        // Add a small delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }

      if (stream) {
        return await streamChatResponse(requestOptions, onChunk);
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL_ID,
            ...requestOptions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
          throw new Error(`Fireworks API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error calling Fireworks API (attempt ${attempts + 1}):`, error);
      attempts++;

      // If this was the last attempt, throw the error
      if (attempts > retries) {
        throw lastError;
      }
    }
  }

  // This should never be reached due to the throw in the catch block
  throw lastError || new Error('Unknown error occurred');
}

async function streamChatResponse(
  requestOptions: FireworksRequestOptions,
  onChunk?: (chunk: string) => void
): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        ...requestOptions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Fireworks API error: ${errorData.error?.message || response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = ''; // Buffer for incomplete chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk and add it to the buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines from the buffer
      const lines = buffer.split('\n');

      // Keep the last line in the buffer if it's incomplete
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              if (onChunk) onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing streaming response:', e, 'Line:', trimmedLine);
          }
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith('data: ')) {
        const data = trimmedLine.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              if (onChunk) onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing final streaming response:', e, 'Line:', trimmedLine);
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error('Error streaming from Fireworks API:', error);
    throw error;
  }
}
