'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent } from '@/app/components/common/Card';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export function WorkflowEditor({ components, onUpdateComponent }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [connections, setConnections] = useState([]);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const svgRef = useRef(null);
  
  // Sample workflow nodes based on components
  const workflowNodes = components.map(component => ({
    id: component.id,
    name: component.name || component.type,
    type: component.type,
    inputs: getComponentInputs(component),
    outputs: getComponentOutputs(component),
    position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 }
  }));

  // Helper function to get component inputs
  function getComponentInputs(component) {
    switch (component.type) {
      case 'button':
        return [];
      case 'input':
        return [{ id: `${component.id}-value`, name: 'Value' }];
      case 'chatbot':
        return [{ id: `${component.id}-input`, name: 'Input' }];
      default:
        return [{ id: `${component.id}-input`, name: 'Input' }];
    }
  }

  // Helper function to get component outputs
  function getComponentOutputs(component) {
    switch (component.type) {
      case 'button':
        return [{ id: `${component.id}-click`, name: 'Click' }];
      case 'input':
        return [
          { id: `${component.id}-change`, name: 'Change' },
          { id: `${component.id}-submit`, name: 'Submit' }
        ];
      case 'chatbot':
        return [
          { id: `${component.id}-message`, name: 'Message' },
          { id: `${component.id}-response`, name: 'Response' }
        ];
      default:
        return [{ id: `${component.id}-output`, name: 'Output' }];
    }
  }

  // Handle node selection
  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    setSelectedNode(node);
  };

  // Handle connection creation
  const handlePortMouseDown = (nodeId, portId, isOutput, e) => {
    e.stopPropagation();
    
    if (isOutput) {
      setIsCreatingConnection(true);
      setConnectionStart({ nodeId, portId });
    }
  };

  // Handle connection end
  const handlePortMouseUp = (nodeId, portId, isOutput, e) => {
    e.stopPropagation();
    
    if (isCreatingConnection && !isOutput && connectionStart) {
      // Don't connect to self
      if (connectionStart.nodeId !== nodeId) {
        const newConnection = {
          id: `connection-${Date.now()}`,
          from: connectionStart.nodeId,
          fromPort: connectionStart.portId,
          to: nodeId,
          toPort: portId
        };
        
        setConnections([...connections, newConnection]);
      }
      
      setIsCreatingConnection(false);
      setConnectionStart(null);
    }
  };

  // Handle mouse move for drawing connection line
  const handleMouseMove = (e) => {
    if (!isCreatingConnection || !svgRef.current) return;
    
    // Update temporary connection line
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update the temporary connection line
    const tempLine = document.getElementById('temp-connection');
    if (tempLine) {
      const startNode = workflowNodes.find(node => node.id === connectionStart.nodeId);
      const startPort = startNode.outputs.find(port => port.id === connectionStart.portId);
      
      if (startNode) {
        const startX = startNode.position.x + 200; // Adjust based on your node width
        const startY = startNode.position.y + 30 + startNode.outputs.indexOf(startPort) * 30; // Adjust based on port position
        
        tempLine.setAttribute('x1', startX);
        tempLine.setAttribute('y1', startY);
        tempLine.setAttribute('x2', x);
        tempLine.setAttribute('y2', y);
      }
    }
  };

  // Handle mouse up to cancel connection
  const handleSvgMouseUp = () => {
    if (isCreatingConnection) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
    }
  };

  // Delete connection
  const handleDeleteConnection = (connectionId) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
  };

  // Add event listeners
  useEffect(() => {
    const svg = svgRef.current;
    
    if (svg) {
      svg.addEventListener('mousemove', handleMouseMove);
      svg.addEventListener('mouseup', handleSvgMouseUp);
    }
    
    return () => {
      if (svg) {
        svg.removeEventListener('mousemove', handleMouseMove);
        svg.removeEventListener('mouseup', handleSvgMouseUp);
      }
    };
  }, [isCreatingConnection, connectionStart]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Workflow Editor</h2>
        <Button variant="outline" size="sm">
          <Plus size={16} className="mr-2" />
          Add Logic Node
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-gray-50">
        {workflowNodes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-4">Add components to the canvas to create a workflow</p>
              <Button variant="outline" size="sm" onClick={() => {}}>
                <Plus size={16} className="mr-2" />
                Add Component
              </Button>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full"
            onClick={() => setSelectedNode(null)}
          >
            {/* Connection lines */}
            {connections.map(connection => {
              const fromNode = workflowNodes.find(node => node.id === connection.from);
              const toNode = workflowNodes.find(node => node.id === connection.to);
              
              if (!fromNode || !toNode) return null;
              
              const fromPort = fromNode.outputs.find(port => port.id === connection.fromPort);
              const toPort = toNode.inputs.find(port => port.id === connection.toPort);
              
              if (!fromPort || !toPort) return null;
              
              const fromX = fromNode.position.x + 200; // Adjust based on node width
              const fromY = fromNode.position.y + 30 + fromNode.outputs.indexOf(fromPort) * 30; // Adjust based on port position
              
              const toX = toNode.position.x;
              const toY = toNode.position.y + 30 + toNode.inputs.indexOf(toPort) * 30; // Adjust based on port position
              
              // Calculate control points for curved line
              const controlX1 = fromX + 50;
              const controlX2 = toX - 50;
              
              return (
                <g key={connection.id}>
                  <path
                    d={`M ${fromX} ${fromY} C ${controlX1} ${fromY}, ${controlX2} ${toY}, ${toX} ${toY}`}
                    stroke="#6366F1"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle
                    cx={(fromX + toX) / 2}
                    cy={(fromY + toY) / 2}
                    r="6"
                    fill="#6366F1"
                    stroke="white"
                    strokeWidth="1"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConnection(connection.id);
                    }}
                  />
                </g>
              );
            })}
            
            {/* Temporary connection line when creating a new connection */}
            {isCreatingConnection && (
              <line
                id="temp-connection"
                stroke="#6366F1"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
            )}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
              </marker>
            </defs>
          </svg>
        )}
        
        {/* Workflow nodes */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {workflowNodes.map(node => (
            <div
              key={node.id}
              className={`absolute pointer-events-auto bg-white rounded-md shadow-md border ${
                selectedNode && selectedNode.id === node.id ? 'border-blue-500' : 'border-gray-200'
              }`}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: '200px',
              }}
              onClick={(e) => handleNodeClick(node, e)}
            >
              <div className="p-3 border-b bg-gray-50 font-medium flex justify-between items-center">
                <span>{node.name}</span>
                <span className="text-xs text-gray-500">{node.type}</span>
              </div>
              
              {/* Input ports */}
              {node.inputs.length > 0 && (
                <div className="p-2 border-b">
                  <div className="text-xs text-gray-500 mb-1">Inputs</div>
                  {node.inputs.map((input, index) => (
                    <div key={input.id} className="flex items-center my-1">
                      <div
                        className="w-3 h-3 rounded-full bg-blue-500 mr-2 cursor-pointer"
                        onMouseUp={(e) => handlePortMouseUp(node.id, input.id, false, e)}
                      />
                      <span className="text-sm">{input.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Output ports */}
              {node.outputs.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-gray-500 mb-1">Outputs</div>
                  {node.outputs.map((output, index) => (
                    <div key={output.id} className="flex items-center justify-between my-1">
                      <span className="text-sm">{output.name}</span>
                      <div
                        className="w-3 h-3 rounded-full bg-indigo-500 ml-2 cursor-pointer"
                        onMouseDown={(e) => handlePortMouseDown(node.id, output.id, true, e)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Properties panel for selected node */}
      {selectedNode && (
        <div className="w-64 border-l bg-white overflow-y-auto absolute right-0 top-0 bottom-0 shadow-md">
          <div className="p-4 border-b">
            <h3 className="font-semibold">{selectedNode.name} Properties</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-4">
              Configure the behavior of this node in the workflow.
            </p>
            
            {/* Node-specific properties would go here */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Node Name</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={() => {}}
                />
              </div>
              
              {selectedNode.type === 'button' && (
                <div>
                  <label className="block text-sm font-medium mb-1">On Click Action</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>Navigate to page</option>
                    <option>Show modal</option>
                    <option>Submit form</option>
                    <option>Custom function</option>
                  </select>
                </div>
              )}
              
              {/* More node-specific properties */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
