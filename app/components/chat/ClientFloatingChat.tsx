'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the FloatingChat component to avoid SSR issues
const FloatingChat = dynamic(() => import('./FloatingChat'), {
  ssr: false,
});

export default function ClientFloatingChat() {
  return <FloatingChat />;
}
