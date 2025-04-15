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
  } = {}
) {
  const { temperature = 0.7, max_tokens = 1024, stream = false, onChunk } = options;

  const requestOptions: FireworksRequestOptions = {
    messages,
    temperature,
    max_tokens,
    stream,
  };

  try {
    if (stream) {
      return streamChatResponse(requestOptions, onChunk);
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
        const errorData = await response.json();
        throw new Error(`Fireworks API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Error calling Fireworks API:', error);
    throw error;
  }
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              if (onChunk) onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing streaming response:', e);
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
