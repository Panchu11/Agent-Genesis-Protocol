'use client';

import React from 'react';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/common/Card';
import Image from 'next/image';

export function ComponentRenderer({ component, isEditing = false }) {
  // Render different components based on type
  switch (component.type) {
    case 'button':
      return (
        <Button
          variant={component.props.variant || 'default'}
          size={component.props.size || 'default'}
          className="w-full h-full"
          disabled={isEditing}
        >
          {component.props.text || 'Button'}
        </Button>
      );
      
    case 'text':
      return (
        <div 
          className={`w-full h-full flex items-center ${
            component.props.weight === 'bold' ? 'font-bold' : 
            component.props.weight === 'semibold' ? 'font-semibold' : 'font-normal'
          }`}
          style={{
            fontSize: component.props.size === 'large' ? '1.5rem' : 
                     component.props.size === 'small' ? '0.875rem' : '1rem',
          }}
        >
          {component.props.text || 'Text content'}
        </div>
      );
      
    case 'input':
      return (
        <input
          type={component.props.type || 'text'}
          placeholder={component.props.placeholder || 'Enter text...'}
          className="w-full h-full px-3 py-2 border rounded-md"
          disabled={isEditing}
        />
      );
      
    case 'image':
      return (
        <div className="w-full h-full relative">
          {component.props.src ? (
            <Image
              src={component.props.src}
              alt={component.props.alt || 'Image'}
              fill
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              Image Placeholder
            </div>
          )}
        </div>
      );
      
    case 'container':
      return (
        <div 
          className="w-full h-full"
          style={{
            padding: `${component.props.padding || 16}px`,
            backgroundColor: component.props.backgroundColor || 'transparent',
            border: component.props.border || 'none',
          }}
        >
          {isEditing && (
            <div className="w-full h-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              Container
            </div>
          )}
        </div>
      );
      
    case 'card':
      return (
        <Card className="w-full h-full">
          <CardHeader>
            <CardTitle>{component.props.title || 'Card Title'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="w-full h-24 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                Card Content
              </div>
            )}
          </CardContent>
        </Card>
      );
      
    case 'grid':
      return (
        <div 
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: `repeat(${component.props.columns || 2}, 1fr)`,
            gap: `${component.props.gap || 16}px`,
          }}
        >
          {isEditing && Array.from({ length: (component.props.columns || 2) * 2 }).map((_, i) => (
            <div 
              key={i}
              className="border border-dashed border-gray-300 flex items-center justify-center text-gray-400"
              style={{ minHeight: '50px' }}
            >
              Grid Cell {i + 1}
            </div>
          ))}
        </div>
      );
      
    case 'table':
      return (
        <div className="w-full h-full overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {(component.props.columns || []).map((column, i) => (
                  <th 
                    key={i}
                    className="border border-gray-300 bg-gray-50 px-4 py-2 text-left"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isEditing && (
                <>
                  <tr>
                    {(component.props.columns || []).map((column, i) => (
                      <td key={i} className="border border-gray-300 px-4 py-2">
                        Sample data
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {(component.props.columns || []).map((column, i) => (
                      <td key={i} className="border border-gray-300 px-4 py-2">
                        Sample data
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      );
      
    case 'chart':
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-gray-400 mb-2">Chart: {component.props.type || 'bar'}</div>
            <div className="flex items-end justify-center h-32 gap-4">
              {[40, 70, 30, 85, 50].map((height, i) => (
                <div 
                  key={i}
                  className="w-8 bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      );
      
    case 'list':
      const ListTag = component.props.type === 'ordered' ? 'ol' : 'ul';
      return (
        <div className="w-full h-full overflow-auto p-4">
          <ListTag className={component.props.type === 'ordered' ? 'list-decimal pl-5' : 'list-disc pl-5'}>
            {(component.props.items || ['Item 1', 'Item 2', 'Item 3']).map((item, i) => (
              <li key={i} className="mb-1">{item}</li>
            ))}
          </ListTag>
        </div>
      );
      
    case 'chatbot':
      return (
        <div className="w-full h-full flex flex-col border rounded-md overflow-hidden">
          <div className="bg-indigo-600 text-white p-3 font-medium">
            AI Chatbot
          </div>
          <div className="flex-1 bg-gray-50 p-3 overflow-auto">
            <div className="bg-white rounded-lg p-3 mb-3 max-w-[80%]">
              {component.props.welcomeMessage || 'Hello! How can I help you today?'}
            </div>
          </div>
          <div className="p-3 border-t bg-white">
            <div className="flex">
              <input
                type="text"
                placeholder={component.props.placeholder || 'Type your message...'}
                className="flex-1 px-3 py-2 border rounded-l-md"
                disabled={isEditing}
              />
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md">
                Send
              </button>
            </div>
          </div>
        </div>
      );
      
    case 'textGenerator':
      return (
        <div className="w-full h-full flex flex-col border rounded-md overflow-hidden">
          <div className="bg-indigo-600 text-white p-3 font-medium">
            AI Text Generator
          </div>
          <div className="p-3">
            <label className="block mb-2 text-sm font-medium">
              {component.props.prompt || 'Generate a response about:'}
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md mb-3"
              rows={3}
              disabled={isEditing}
            ></textarea>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md">
              Generate
            </button>
          </div>
          <div className="flex-1 bg-gray-50 p-3 border-t mt-3">
            <div className="text-gray-400 text-center">
              Generated text will appear here
            </div>
          </div>
        </div>
      );
      
    case 'knowledgeSearch':
      return (
        <div className="w-full h-full flex flex-col border rounded-md overflow-hidden">
          <div className="bg-indigo-600 text-white p-3 font-medium">
            Knowledge Search
          </div>
          <div className="p-3">
            <div className="flex mb-3">
              <input
                type="text"
                placeholder={component.props.placeholder || 'Search knowledge base...'}
                className="flex-1 px-3 py-2 border rounded-l-md"
                disabled={isEditing}
              />
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md">
                Search
              </button>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 p-3 border-t">
            <div className="text-gray-400 text-center">
              Search results will appear here
            </div>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="w-full h-full flex items-center justify-center border border-dashed border-gray-300 text-gray-400">
          Unknown Component: {component.type}
        </div>
      );
  }
}
