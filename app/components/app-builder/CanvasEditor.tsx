'use client';

import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { ComponentRenderer } from './ComponentRenderer';

export const CanvasEditor = forwardRef(
  ({ components, selectedComponent, onSelectComponent, onUpdateComponent }, ref) => {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [canvasScale, setCanvasScale] = useState(1);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

    // Handle component selection
    const handleComponentClick = (e, component) => {
      e.stopPropagation();
      onSelectComponent(component);
    };

    // Handle component dragging
    const handleComponentMouseDown = (e, component) => {
      e.stopPropagation();
      
      if (!selectedComponent || selectedComponent.id !== component.id) {
        onSelectComponent(component);
      }
      
      setIsDragging(true);
      setDragStartPos({
        x: e.clientX,
        y: e.clientY,
      });
      
      const componentRect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - componentRect.left,
        y: e.clientY - componentRect.top,
      });
    };

    // Handle mouse move for dragging
    const handleMouseMove = (e) => {
      if (!isDragging || !selectedComponent) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = (e.clientX - canvasRect.left - dragOffset.x) / canvasScale;
      const newY = (e.clientY - canvasRect.top - dragOffset.y) / canvasScale;
      
      // Update component position
      const updatedComponent = {
        ...selectedComponent,
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      };
      
      onUpdateComponent(updatedComponent);
    };

    // Handle mouse up to end dragging
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Handle canvas click (deselect components)
    const handleCanvasClick = (e) => {
      if (e.target === canvasRef.current) {
        onSelectComponent(null);
      }
    };

    // Handle zoom with mouse wheel
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(2, canvasScale + delta));
        setCanvasScale(newScale);
      }
    };

    // Add event listeners
    useEffect(() => {
      const canvas = canvasRef.current;
      
      if (canvas) {
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
      
      return () => {
        if (canvas) {
          canvas.removeEventListener('wheel', handleWheel);
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, selectedComponent, canvasScale]);

    // Expose the canvas ref
    React.useImperativeHandle(ref, () => canvasRef.current);

    return (
      <div 
        ref={canvasRef}
        className="w-full h-full relative bg-white border border-dashed border-gray-300 overflow-auto"
        onClick={handleCanvasClick}
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
          backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
        }}
      >
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            transform: `scale(${canvasScale})`,
            transformOrigin: '0 0',
          }}
        >
          {components.map((component) => (
            <div
              key={component.id}
              className={`absolute cursor-move ${
                selectedComponent && selectedComponent.id === component.id
                  ? 'outline outline-2 outline-blue-500'
                  : ''
              }`}
              style={{
                left: `${component.x}px`,
                top: `${component.y}px`,
                width: `${component.width}px`,
                height: `${component.height}px`,
              }}
              onClick={(e) => handleComponentClick(e, component)}
              onMouseDown={(e) => handleComponentMouseDown(e, component)}
            >
              <ComponentRenderer component={component} isEditing={true} />
              
              {/* Resize handles (only for selected component) */}
              {selectedComponent && selectedComponent.id === component.id && (
                <>
                  {['nw', 'ne', 'sw', 'se'].map((position) => (
                    <div
                      key={position}
                      className="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm"
                      style={{
                        top: position.includes('n') ? '-4px' : 'auto',
                        bottom: position.includes('s') ? '-4px' : 'auto',
                        left: position.includes('w') ? '-4px' : 'auto',
                        right: position.includes('e') ? '-4px' : 'auto',
                        cursor: `${position}-resize`,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // Resize logic would go here
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 bg-white rounded-md shadow-md p-2 flex items-center space-x-2">
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
            onClick={() => setCanvasScale(Math.max(0.5, canvasScale - 0.1))}
          >
            −
          </button>
          <span className="text-sm">{Math.round(canvasScale * 100)}%</span>
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
            onClick={() => setCanvasScale(Math.min(2, canvasScale + 0.1))}
          >
            +
          </button>
        </div>
      </div>
    );
  }
);
