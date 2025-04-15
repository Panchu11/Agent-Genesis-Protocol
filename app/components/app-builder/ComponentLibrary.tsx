'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

// Component categories and their components
const componentCategories = [
  {
    name: 'Basic UI',
    components: [
      {
        type: 'button',
        name: 'Button',
        icon: '🔘',
        description: 'A clickable button element',
        defaultWidth: 120,
        defaultHeight: 40,
        defaultProps: {
          text: 'Button',
          variant: 'default',
          size: 'default',
        },
      },
      {
        type: 'text',
        name: 'Text',
        icon: '📝',
        description: 'A text display element',
        defaultWidth: 200,
        defaultHeight: 30,
        defaultProps: {
          text: 'Text content',
          size: 'default',
          weight: 'normal',
        },
      },
      {
        type: 'input',
        name: 'Input',
        icon: '✏️',
        description: 'A text input field',
        defaultWidth: 200,
        defaultHeight: 40,
        defaultProps: {
          placeholder: 'Enter text...',
          type: 'text',
        },
      },
      {
        type: 'image',
        name: 'Image',
        icon: '🖼️',
        description: 'An image display element',
        defaultWidth: 200,
        defaultHeight: 200,
        defaultProps: {
          src: 'https://via.placeholder.com/200',
          alt: 'Image',
        },
      },
    ],
  },
  {
    name: 'Layout',
    components: [
      {
        type: 'container',
        name: 'Container',
        icon: '📦',
        description: 'A container for other components',
        defaultWidth: 300,
        defaultHeight: 200,
        defaultProps: {
          padding: 16,
          backgroundColor: 'transparent',
          border: 'none',
        },
      },
      {
        type: 'card',
        name: 'Card',
        icon: '🃏',
        description: 'A card component with header and content',
        defaultWidth: 300,
        defaultHeight: 200,
        defaultProps: {
          title: 'Card Title',
          shadow: true,
        },
      },
      {
        type: 'grid',
        name: 'Grid',
        icon: '🔲',
        description: 'A grid layout for organizing components',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
          columns: 2,
          gap: 16,
        },
      },
    ],
  },
  {
    name: 'Data Display',
    components: [
      {
        type: 'table',
        name: 'Table',
        icon: '🗃️',
        description: 'A table for displaying structured data',
        defaultWidth: 500,
        defaultHeight: 300,
        defaultProps: {
          columns: [
            { field: 'id', header: 'ID' },
            { field: 'name', header: 'Name' },
            { field: 'value', header: 'Value' },
          ],
          data: [],
        },
      },
      {
        type: 'chart',
        name: 'Chart',
        icon: '📊',
        description: 'A chart for data visualization',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
          type: 'bar',
          data: {
            labels: ['A', 'B', 'C'],
            datasets: [{ data: [10, 20, 30] }],
          },
        },
      },
      {
        type: 'list',
        name: 'List',
        icon: '📋',
        description: 'A list of items',
        defaultWidth: 300,
        defaultHeight: 200,
        defaultProps: {
          items: ['Item 1', 'Item 2', 'Item 3'],
          type: 'unordered',
        },
      },
    ],
  },
  {
    name: 'AI Components',
    components: [
      {
        type: 'chatbot',
        name: 'Chatbot',
        icon: '🤖',
        description: 'An AI-powered chatbot interface',
        defaultWidth: 350,
        defaultHeight: 400,
        defaultProps: {
          agentId: '',
          placeholder: 'Type your message...',
          welcomeMessage: 'Hello! How can I help you today?',
        },
      },
      {
        type: 'textGenerator',
        name: 'Text Generator',
        icon: '✨',
        description: 'Generate text using AI',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
          prompt: 'Generate a response about:',
          maxLength: 500,
        },
      },
      {
        type: 'knowledgeSearch',
        name: 'Knowledge Search',
        icon: '🔍',
        description: 'Search through knowledge bases',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
          knowledgeBaseId: '',
          placeholder: 'Search knowledge base...',
        },
      },
    ],
  },
];

export function ComponentLibrary({ onAddComponent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(
    componentCategories.map((category) => category.name)
  );

  const toggleCategory = (categoryName) => {
    if (expandedCategories.includes(categoryName)) {
      setExpandedCategories(expandedCategories.filter((name) => name !== categoryName));
    } else {
      setExpandedCategories([...expandedCategories, categoryName]);
    }
  };

  const filteredCategories = componentCategories.map((category) => {
    const filteredComponents = category.components.filter((component) =>
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...category,
      components: filteredComponents,
    };
  }).filter((category) => category.components.length > 0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Component Library</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border rounded-md"
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => (
          <div key={category.name} className="border-b">
            <button
              className="w-full px-4 py-2 text-left font-medium flex justify-between items-center hover:bg-gray-50"
              onClick={() => toggleCategory(category.name)}
            >
              <span>{category.name}</span>
              <span>{expandedCategories.includes(category.name) ? '−' : '+'}</span>
            </button>
            {expandedCategories.includes(category.name) && (
              <div className="p-2">
                {category.components.map((component) => (
                  <div
                    key={component.type}
                    className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => onAddComponent(component)}
                    title={component.description}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{component.icon}</span>
                      <div>
                        <div className="font-medium">{component.name}</div>
                        <div className="text-xs text-gray-500">{component.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
