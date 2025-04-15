'use client';

import { createLazyComponent, LazyLoad } from '../common/LazyLoad';

// Lazy load the MetricsChart component
const LazyMetricsChart = createLazyComponent(() => import('./MetricsChart'));

// Props type for the MetricsChart component
interface MetricsChartProps {
  type: 'radar' | 'bar';
  data: any;
  height?: number;
  options?: any;
}

/**
 * Lazy-loaded MetricsChart component
 * 
 * This component will only load the MetricsChart component and its dependencies
 * when it's actually rendered on the page, reducing the initial bundle size.
 */
export default function LazyMetricsChartComponent(props: MetricsChartProps) {
  return (
    <LazyLoad
      component={LazyMetricsChart}
      props={props}
      fallback={
        <div 
          className="bg-gray-100 animate-pulse rounded-md flex items-center justify-center"
          style={{ height: `${props.height || 300}px` }}
        >
          <p className="text-gray-500">Loading chart...</p>
        </div>
      }
    />
  );
}
