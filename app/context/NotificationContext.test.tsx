import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../tests/utils';
import { NotificationProvider, useNotification } from './NotificationContext';
import React from 'react';

// Test component that uses the notification context
const TestComponent = () => {
  const { showNotification } = useNotification();
  
  const handleShowInfo = () => {
    showNotification({
      id: 'test-info',
      title: 'Info Notification',
      message: 'This is an info message',
      type: 'info'
    });
  };
  
  const handleShowSuccess = () => {
    showNotification({
      id: 'test-success',
      title: 'Success Notification',
      message: 'This is a success message',
      type: 'success'
    });
  };
  
  const handleShowWarning = () => {
    showNotification({
      id: 'test-warning',
      title: 'Warning Notification',
      message: 'This is a warning message',
      type: 'warning'
    });
  };
  
  const handleShowError = () => {
    showNotification({
      id: 'test-error',
      title: 'Error Notification',
      message: 'This is an error message',
      type: 'error'
    });
  };
  
  return (
    <div>
      <button onClick={handleShowInfo}>Show Info</button>
      <button onClick={handleShowSuccess}>Show Success</button>
      <button onClick={handleShowWarning}>Show Warning</button>
      <button onClick={handleShowError}>Show Error</button>
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('provides notification context to children', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    expect(screen.getByText('Show Info')).toBeInTheDocument();
    expect(screen.getByText('Show Success')).toBeInTheDocument();
    expect(screen.getByText('Show Warning')).toBeInTheDocument();
    expect(screen.getByText('Show Error')).toBeInTheDocument();
  });
  
  it('shows info notification when triggered', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('Show Info'));
    
    expect(screen.getByText('Info Notification')).toBeInTheDocument();
    expect(screen.getByText('This is an info message')).toBeInTheDocument();
  });
  
  it('shows success notification when triggered', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('Show Success'));
    
    expect(screen.getByText('Success Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a success message')).toBeInTheDocument();
  });
  
  it('shows warning notification when triggered', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('Show Warning'));
    
    expect(screen.getByText('Warning Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a warning message')).toBeInTheDocument();
  });
  
  it('shows error notification when triggered', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('Show Error'));
    
    expect(screen.getByText('Error Notification')).toBeInTheDocument();
    expect(screen.getByText('This is an error message')).toBeInTheDocument();
  });
  
  it('automatically removes notification after duration', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('Show Info'));
    
    expect(screen.getByText('Info Notification')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    // Wait for animation to complete
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(screen.queryByText('Info Notification')).not.toBeInTheDocument();
  });
  
  it('removes notification when close button is clicked', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('Show Info'));
    
    expect(screen.getByText('Info Notification')).toBeInTheDocument();
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Wait for animation to complete
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(screen.queryByText('Info Notification')).not.toBeInTheDocument();
  });
});
