'use client';

import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface ForceGraphWrapperProps {
  data: {
    nodes: any[];
    links: any[];
  };
  nodeLabel?: string;
  nodeAutoColorBy?: string;
  nodeVal?: string;
  linkDirectionalArrowLength?: number;
  linkDirectionalArrowRelPos?: number;
  linkCurvature?: number;
  width?: number;
  height?: number;
}

export default function ForceGraphWrapper({
  data,
  nodeLabel = 'name',
  nodeAutoColorBy = 'group',
  nodeVal = 'val',
  linkDirectionalArrowLength = 3.5,
  linkDirectionalArrowRelPos = 1,
  linkCurvature = 0.25,
  width = 800,
  height = 600
}: ForceGraphWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        style={{
          width: width,
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '0.375rem'
        }}
      >
        <p className="text-gray-500">Loading graph visualization...</p>
      </div>
    );
  }

  return (
    <ForceGraph2D
      graphData={data}
      nodeLabel={nodeLabel}
      nodeAutoColorBy={nodeAutoColorBy}
      nodeVal={nodeVal}
      linkDirectionalArrowLength={linkDirectionalArrowLength}
      linkDirectionalArrowRelPos={linkDirectionalArrowRelPos}
      linkCurvature={linkCurvature}
      width={width}
      height={height}
    />
  );
}
