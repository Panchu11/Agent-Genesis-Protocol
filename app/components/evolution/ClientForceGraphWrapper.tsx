'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the ForceGraphWrapper component
const ForceGraphWrapper = dynamic(() => import('./ForceGraphWrapper'), {
  ssr: false,
});

interface ClientForceGraphWrapperProps {
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

export default function ClientForceGraphWrapper(props: ClientForceGraphWrapperProps) {
  return <ForceGraphWrapper {...props} />;
}
