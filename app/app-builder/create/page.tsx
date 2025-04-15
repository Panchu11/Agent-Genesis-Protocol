'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent } from '@/app/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { useNotification } from '@/app/context/NotificationContext';
import { ComponentLibrary } from '@/app/components/app-builder/ComponentLibrary';
import { CanvasEditor } from '@/app/components/app-builder/CanvasEditor';
import { PropertiesPanel } from '@/app/components/app-builder/PropertiesPanel';
import { WorkflowEditor } from '@/app/components/app-builder/WorkflowEditor';

export default function CreateAppPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [appName, setAppName] = useState('Untitled App');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [components, setComponents] = useState([]);
  const [currentTab, setCurrentTab] = useState('canvas');
  const canvasRef = useRef(null);

  const handleAddComponent = (component) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type: component.type,
      name: component.name,
      x: 100,
      y: 100,
      width: component.defaultWidth || 200,
      height: component.defaultHeight || 100,
      props: component.defaultProps || {},
      events: [],
    };

    setComponents([...components, newComponent]);
    setSelectedComponent(newComponent);
    showNotification({
      title: 'Component Added',
      message: `${component.name} has been added to the canvas`,
      type: 'success',
    });
  };

  const handleSelectComponent = (component) => {
    setSelectedComponent(component);
  };

  const handleUpdateComponent = (updatedComponent) => {
    const updatedComponents = components.map((c) =>
      c.id === updatedComponent.id ? updatedComponent : c
    );
    setComponents(updatedComponents);
  };

  const handleDeleteComponent = (componentId) => {
    const updatedComponents = components.filter((c) => c.id !== componentId);
    setComponents(updatedComponents);
    setSelectedComponent(null);
    showNotification({
      title: 'Component Deleted',
      message: 'Component has been removed from the canvas',
      type: 'info',
    });
  };

  const handleSaveApp = () => {
    // In a real implementation, this would save to a database
    showNotification({
      title: 'App Saved',
      message: 'Your app has been saved successfully',
      type: 'success',
    });
    
    // Navigate back to the app builder home page
    setTimeout(() => {
      router.push('/app-builder');
    }, 1500);
  };

  const handlePublishApp = () => {
    // In a real implementation, this would publish the app
    showNotification({
      title: 'App Published',
      message: 'Your app has been published and is now live',
      type: 'success',
    });
    
    // Navigate back to the app builder home page
    setTimeout(() => {
      router.push('/app-builder');
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveApp}>
            Save
          </Button>
          <Button onClick={handlePublishApp}>Publish</Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Component Library */}
        <div className="w-64 border-r overflow-y-auto">
          <ComponentLibrary onAddComponent={handleAddComponent} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <Tabs 
            value={currentTab} 
            onValueChange={setCurrentTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="mx-4">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="flex-1 p-4">
              <div className="h-full flex">
                <div className="flex-1 overflow-auto bg-gray-50 rounded-md">
                  <CanvasEditor
                    ref={canvasRef}
                    components={components}
                    selectedComponent={selectedComponent}
                    onSelectComponent={handleSelectComponent}
                    onUpdateComponent={handleUpdateComponent}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workflow" className="flex-1 p-4">
              <WorkflowEditor 
                components={components}
                onUpdateComponent={handleUpdateComponent}
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 p-4">
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      Preview functionality will be available in the next update
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-80 border-l overflow-y-auto">
          <PropertiesPanel
            selectedComponent={selectedComponent}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
          />
        </div>
      </div>
    </div>
  );
}
