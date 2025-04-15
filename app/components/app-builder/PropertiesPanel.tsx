'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/app/components/common/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';

export function PropertiesPanel({ selectedComponent, onUpdateComponent, onDeleteComponent }) {
  if (!selectedComponent) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-gray-500">
          Select a component to edit its properties
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    const updatedComponent = {
      ...selectedComponent,
      props: {
        ...selectedComponent.props,
        [property]: value,
      },
    };
    onUpdateComponent(updatedComponent);
  };

  const handlePositionChange = (property, value) => {
    const updatedComponent = {
      ...selectedComponent,
      [property]: parseInt(value, 10) || 0,
    };
    onUpdateComponent(updatedComponent);
  };

  const renderPropertyFields = () => {
    switch (selectedComponent.type) {
      case 'button':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Text</label>
              <input
                type="text"
                value={selectedComponent.props.text || ''}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Variant</label>
              <select
                value={selectedComponent.props.variant || 'default'}
                onChange={(e) => handlePropertyChange('variant', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="default">Default</option>
                <option value="destructive">Destructive</option>
                <option value="outline">Outline</option>
                <option value="secondary">Secondary</option>
                <option value="ghost">Ghost</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Size</label>
              <select
                value={selectedComponent.props.size || 'default'}
                onChange={(e) => handlePropertyChange('size', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="default">Default</option>
                <option value="sm">Small</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </>
        );
        
      case 'text':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Text</label>
              <textarea
                value={selectedComponent.props.text || ''}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Size</label>
              <select
                value={selectedComponent.props.size || 'default'}
                onChange={(e) => handlePropertyChange('size', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="small">Small</option>
                <option value="default">Default</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Weight</label>
              <select
                value={selectedComponent.props.weight || 'normal'}
                onChange={(e) => handlePropertyChange('weight', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="normal">Normal</option>
                <option value="semibold">Semibold</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </>
        );
        
      case 'input':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Placeholder</label>
              <input
                type="text"
                value={selectedComponent.props.placeholder || ''}
                onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={selectedComponent.props.type || 'text'}
                onChange={(e) => handlePropertyChange('type', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="text">Text</option>
                <option value="password">Password</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="tel">Telephone</option>
                <option value="url">URL</option>
              </select>
            </div>
          </>
        );
        
      case 'image':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input
                type="text"
                value={selectedComponent.props.src || ''}
                onChange={(e) => handlePropertyChange('src', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Alt Text</label>
              <input
                type="text"
                value={selectedComponent.props.alt || ''}
                onChange={(e) => handlePropertyChange('alt', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </>
        );
        
      case 'container':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Padding (px)</label>
              <input
                type="number"
                value={selectedComponent.props.padding || 16}
                onChange={(e) => handlePropertyChange('padding', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <input
                type="text"
                value={selectedComponent.props.backgroundColor || 'transparent'}
                onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Border</label>
              <input
                type="text"
                value={selectedComponent.props.border || 'none'}
                onChange={(e) => handlePropertyChange('border', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </>
        );
        
      case 'card':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={selectedComponent.props.title || ''}
                onChange={(e) => handlePropertyChange('title', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Shadow</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedComponent.props.shadow || false}
                  onChange={(e) => handlePropertyChange('shadow', e.target.checked)}
                  className="mr-2"
                />
                <span>Enable shadow</span>
              </div>
            </div>
          </>
        );
        
      case 'grid':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Columns</label>
              <input
                type="number"
                value={selectedComponent.props.columns || 2}
                onChange={(e) => handlePropertyChange('columns', parseInt(e.target.value, 10) || 2)}
                className="w-full px-3 py-2 border rounded-md"
                min={1}
                max={12}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Gap (px)</label>
              <input
                type="number"
                value={selectedComponent.props.gap || 16}
                onChange={(e) => handlePropertyChange('gap', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </>
        );
        
      case 'chatbot':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Agent ID</label>
              <input
                type="text"
                value={selectedComponent.props.agentId || ''}
                onChange={(e) => handlePropertyChange('agentId', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Placeholder</label>
              <input
                type="text"
                value={selectedComponent.props.placeholder || ''}
                onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Welcome Message</label>
              <textarea
                value={selectedComponent.props.welcomeMessage || ''}
                onChange={(e) => handlePropertyChange('welcomeMessage', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
          </>
        );
        
      // Add more component types as needed
        
      default:
        return (
          <div className="p-4 text-gray-500">
            No editable properties available for this component type.
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Properties</h2>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={() => onDeleteComponent(selectedComponent.id)}
            title="Delete component"
          >
            <Trash2 size={18} />
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {selectedComponent.name} ({selectedComponent.type})
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="properties">
          <TabsList className="w-full">
            <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
            <TabsTrigger value="layout" className="flex-1">Layout</TabsTrigger>
            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="p-4">
            {renderPropertyFields()}
          </TabsContent>

          <TabsContent value="layout" className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Position X</label>
              <input
                type="number"
                value={selectedComponent.x}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Position Y</label>
              <input
                type="number"
                value={selectedComponent.y}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                value={selectedComponent.width}
                onChange={(e) => handlePositionChange('width', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                min={10}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Height</label>
              <input
                type="number"
                value={selectedComponent.height}
                onChange={(e) => handlePositionChange('height', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                min={10}
              />
            </div>
          </TabsContent>

          <TabsContent value="events" className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">On Click</label>
              <select
                className="w-full px-3 py-2 border rounded-md mb-2"
                defaultValue=""
              >
                <option value="">Select an action</option>
                <option value="navigate">Navigate to page</option>
                <option value="openModal">Open modal</option>
                <option value="callApi">Call API</option>
                <option value="custom">Custom function</option>
              </select>
              <Button variant="outline" size="sm" className="w-full">
                Add Event
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-4">
              No events configured for this component.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
