import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock NotificationProvider for testing
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Create a custom render function that includes providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
