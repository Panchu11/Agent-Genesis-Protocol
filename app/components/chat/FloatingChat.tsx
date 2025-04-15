'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { generateChatResponse, Message as ApiMessage } from '@/app/lib/api/fireworks';
import { useNotification } from '@/app/context/NotificationContext';
import { X, MessageSquare, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingChat() {
  const { showNotification } = useNotification();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm AGP, powered by Dobby-Unhinged. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [lastUserMessageTime, setLastUserMessageTime] = useState<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage, isOpen]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Clean up any timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  // Toggle chat open/closed
  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  // Check for message loop prevention
  const checkMessageLoopPrevention = () => {
    // If we're already processing a response, don't allow another one
    if (isProcessingResponse) {
      showNotification({
        id: 'message-loop-prevention',
        title: 'Please wait',
        message: 'AGP is still thinking. Please wait for a response before sending another message.',
        type: 'warning',
      });
      return false;
    }
    
    // Check if the last user message was too recent (less than 1 second ago)
    const now = Date.now();
    if (now - lastUserMessageTime < 1000) {
      showNotification({
        id: 'message-rate-limit',
        title: 'Slow down',
        message: 'Please wait a moment before sending another message.',
        type: 'warning',
      });
      return false;
    }
    
    return true;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;
    
    // Check for message loop prevention
    if (!checkMessageLoopPrevention()) return;
    
    // Update last user message time
    setLastUserMessageTime(Date.now());

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');
    setIsProcessingResponse(true);
    
    // Clear any existing response timeout
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }

    try {
      // Prepare messages for API
      const apiMessages: ApiMessage[] = [
        {
          role: 'system',
          content: `You are AGP, a helpful and creative AI assistant powered by Dobby-Unhinged. 

Important instructions:
1. You are designed to be helpful, creative, and engaging.
2. You can assist with a wide range of tasks, from answering questions to generating creative content.
3. You should always be respectful and avoid harmful content.
4. DO NOT simulate both sides of a conversation or continue without user input.
5. DO NOT prefix your responses with "I'm AGP" or similar phrases.
6. DO NOT repeat yourself or generate multiple responses to a single user message.
7. Wait for the user to respond before continuing the conversation.
8. Keep your responses concise and to the point unless asked for detailed information.
9. If asked about AGP, explain that it's the Agent Genesis Protocol project.
10. If asked who built you, mention that you were built by Panchu.
11. Always sign your responses with "- AGP"`
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
        temperature: 0.7,
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
      
      // Set a timeout to allow for a new message
      responseTimeoutRef.current = setTimeout(() => {
        setIsProcessingResponse(false);
      }, 1000); // Wait 1 second after response completes before allowing new messages
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 h-[500px] flex flex-col shadow-lg">
          <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-md">AGP Chat</CardTitle>
            <Button variant="ghost" size="icon" onClick={toggleChat} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
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
                  <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted text-sm">
                    <p className="whitespace-pre-wrap">{streamingMessage}</p>
                  </div>
                </div>
              )}
              {isLoading && !streamingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted">
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
          <CardFooter className="border-t p-3">
            <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-md border border-input px-3 py-2 text-sm ring-offset-background"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button
          onClick={toggleChat}
          className="rounded-full h-12 w-12 shadow-lg"
          aria-label="Open chat"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
