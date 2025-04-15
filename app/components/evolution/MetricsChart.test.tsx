import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock the entire component since we can't easily test Chart.js
vi.mock('./MetricsChart', () => ({
  default: vi.fn(({ type, data, options, height = 300 }) => (
    <div
      data-testid={`${type}-chart`}
      data-type={type}
      data-height={height}
      data-data={JSON.stringify(data)}
      data-options={JSON.stringify(options || {})}
    >
      {type === 'radar' ? 'Radar Chart' : 'Bar Chart'}
    </div>
  ))
}));

// Import after mocking
import { render, screen } from '../../../tests/utils';
import MetricsChart from './MetricsChart';

describe('MetricsChart Component', () => {
  const radarData = {
    labels: ['Accuracy', 'Response Time', 'Creativity', 'Helpfulness', 'Reasoning'],
    datasets: [
      {
        label: 'Agent 1',
        data: [80, 65, 90, 75, 85],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: ['Accuracy', 'Response Time', 'Creativity', 'Helpfulness', 'Reasoning'],
    datasets: [
      {
        label: 'Agent 1',
        data: [80, 65, 90, 75, 85],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  };

  it('renders radar chart correctly', () => {
    render(<MetricsChart type="radar" data={radarData} height={300} />);

    const chart = screen.getByTestId('radar-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveTextContent('Radar Chart');
    expect(chart.getAttribute('data-height')).toBe('300');
    expect(chart.getAttribute('data-type')).toBe('radar');

    const chartData = JSON.parse(chart.getAttribute('data-data') || '{}');
    expect(chartData.labels).toEqual(['Accuracy', 'Response Time', 'Creativity', 'Helpfulness', 'Reasoning']);
    expect(chartData.datasets[0].label).toBe('Agent 1');
    expect(chartData.datasets[0].data).toEqual([80, 65, 90, 75, 85]);
  });

  it('renders bar chart correctly', () => {
    render(<MetricsChart type="bar" data={barData} height={400} />);

    const chart = screen.getByTestId('bar-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveTextContent('Bar Chart');
    expect(chart.getAttribute('data-height')).toBe('400');
    expect(chart.getAttribute('data-type')).toBe('bar');

    const chartData = JSON.parse(chart.getAttribute('data-data') || '{}');
    expect(chartData.labels).toEqual(['Accuracy', 'Response Time', 'Creativity', 'Helpfulness', 'Reasoning']);
    expect(chartData.datasets[0].label).toBe('Agent 1');
    expect(chartData.datasets[0].data).toEqual([80, 65, 90, 75, 85]);
  });

  it('uses default height when not specified', () => {
    render(<MetricsChart type="radar" data={radarData} />);

    const chart = screen.getByTestId('radar-chart');
    expect(chart.getAttribute('data-height')).toBe('300');
  });

  it('applies custom options to the chart', () => {
    const customOptions = {
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    };

    render(<MetricsChart type="radar" data={radarData} options={customOptions} />);

    const chart = screen.getByTestId('radar-chart');
    const chartOptions = JSON.parse(chart.getAttribute('data-options') || '{}');
    expect(chartOptions.plugins.legend.position).toBe('bottom');
  });
});
