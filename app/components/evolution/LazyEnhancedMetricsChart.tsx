'use client';

import { createLazyComponent, LazyLoad } from '../common/LazyLoad';

// Lazy load the EnhancedMetricsChart component
const LazyEnhancedMetricsChart = createLazyComponent(() => import('./EnhancedMetricsChart'));

// Props type for the EnhancedMetricsChart component
interface EnhancedMetricsChartProps {
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

/**
 * Lazy-loaded EnhancedMetricsChart component
 * 
 * This component will only load the EnhancedMetricsChart component and its dependencies
 * when it's actually rendered on the page, reducing the initial bundle size.
 */
export default function LazyEnhancedMetricsChartComponent(props: EnhancedMetricsChartProps) {
  return (
    <LazyLoad
      component={LazyEnhancedMetricsChart}
      props={props}
      fallback={
        <div 
          className="bg-gray-100 animate-pulse rounded-md flex items-center justify-center"
          style={{ height: `${props.height || 300}px` }}
        >
          <p className="text-gray-500">Loading enhanced chart...</p>
        </div>
      }
    />
  );
}
