'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the EnhancedMetricsChart component
const EnhancedMetricsChart = dynamic(() => import('./EnhancedMetricsChart'), {
  ssr: false,
});

interface ClientEnhancedMetricsChartProps {
  type: 'radar' | 'bar' | 'line' | 'timeline';
  data: any;
  options?: any;
  height?: number;
  title?: string;
  description?: string;
  showLegend?: boolean;
  interactive?: boolean;
  colorScheme?: 'default' | 'pastel' | 'vibrant' | 'monochrome';
}

export default function ClientEnhancedMetricsChart(props: ClientEnhancedMetricsChartProps) {
  return <EnhancedMetricsChart {...props} />;
}
