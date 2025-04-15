'use client';

import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';

interface LazyLoadProps {
  component: LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

/**
 * LazyLoad component for dynamically loading components
 * 
 * @param component The lazy-loaded component
 * @param fallback Optional fallback UI to show while loading
 * @param props Props to pass to the component
 */
export function LazyLoad({ component: Component, fallback, props = {} }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex justify-center items-center p-4 min-h-[100px]">
      <div className="flex items-center space-x-2">
        <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Loading...</p>
      </div>
    </div>
  );
}

/**
 * Create a lazy-loaded component
 * 
 * @param importFn Function that imports the component
 * @returns Lazy-loaded component
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(importFn);
}

export default LazyLoad;
