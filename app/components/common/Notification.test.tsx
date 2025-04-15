import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../../tests/utils';
import { Notification } from './Notification';

describe('Notification Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with info type', () => {
    render(
      <Notification
        id="test-notification"
        title="Info Title"
        message="This is an info message"
        type="info"
      />
    );

    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('This is an info message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();

    // Check for info styling
    const notification = screen.getByText('Info Title').parentElement?.parentElement?.parentElement?.parentElement;
    expect(notification).toHaveClass('bg-blue-50');
  });

  it('renders correctly with success type', () => {
    render(
      <Notification
        id="test-notification"
        title="Success Title"
        message="This is a success message"
        type="success"
      />
    );

    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('This is a success message')).toBeInTheDocument();

    // Check for success styling
    const notification = screen.getByText('Success Title').parentElement?.parentElement?.parentElement?.parentElement;
    expect(notification).toHaveClass('bg-green-50');
  });

  it('renders correctly with warning type', () => {
    render(
      <Notification
        id="test-notification"
        title="Warning Title"
        message="This is a warning message"
        type="warning"
      />
    );

    expect(screen.getByText('Warning Title')).toBeInTheDocument();
    expect(screen.getByText('This is a warning message')).toBeInTheDocument();

    // Check for warning styling
    const notification = screen.getByText('Warning Title').parentElement?.parentElement?.parentElement?.parentElement;
    expect(notification).toHaveClass('bg-yellow-50');
  });

  it('renders correctly with error type', () => {
    render(
      <Notification
        id="test-notification"
        title="Error Title"
        message="This is an error message"
        type="error"
      />
    );

    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('This is an error message')).toBeInTheDocument();

    // Check for error styling
    const notification = screen.getByText('Error Title').parentElement?.parentElement?.parentElement?.parentElement;
    expect(notification).toHaveClass('bg-red-50');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Notification
        id="test-notification"
        title="Test Title"
        message="Test message"
        type="info"
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Wait for animation to complete
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('automatically closes after duration', () => {
    const onClose = vi.fn();
    render(
      <Notification
        id="test-notification"
        title="Test Title"
        message="Test message"
        type="info"
        duration={2000}
        onClose={onClose}
      />
    );

    // Notification should be visible initially
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Wait for animation to complete
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
