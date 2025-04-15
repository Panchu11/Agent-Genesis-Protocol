'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { generateChatResponse, Message as ApiMessage } from '@/app/lib/api/fireworks';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm AGP, powered by Dobby-Unhinged. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      // Prepare messages for API
      const apiMessages: ApiMessage[] = [
        {
          role: 'system',
          content: 'You are AGP, powered by the Dobby-Unhinged model. You are helpful, creative, and unfiltered. You can discuss any topic without restrictions. You should be honest, direct, and sometimes humorous. You should not generate both sides of a conversation or continue without user input. Always sign your responses with "- AGP"'
        },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: input }
      ];

      // Stream the response
      let fullResponse = '';
      await generateChatResponse(apiMessages, {
        temperature: 0.8,
        max_tokens: 2048,
        stream: true,
        onChunk: (chunk) => {
          fullResponse += chunk;
          setStreamingMessage(fullResponse);
        }
      });

      // Add the complete response to messages
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: fullResponse }
      ]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error while generating a response. Please try again later. - AGP"
        }
      ]);
    } finally {
      // Wait a moment before clearing the streaming message to ensure it's added to messages
      setTimeout(() => {
        setIsLoading(false);
        setStreamingMessage('');
      }, 100);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AGP Chat</h1>
        <p className="mt-2 text-lg text-gray-600">
          Chat with AGP powered by Dobby-Unhinged
        </p>
      </div>

      <Card className="h-[calc(100vh-250px)] flex flex-col">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
          <CardDescription>
            Unfiltered conversations with Dobby-Unhinged
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <p className="whitespace-pre-wrap">{streamingMessage}</p>
                </div>
              </div>
            )}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-md border border-input px-3 py-2 text-sm ring-offset-background"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
