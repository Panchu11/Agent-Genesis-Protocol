'use client';

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface MetricsChartProps {
  type: 'radar' | 'bar';
  data: ChartData<'radar' | 'bar'>;
  options?: ChartOptions<'radar' | 'bar'>;
  height?: number;
}

export default function MetricsChart({ type, data, options, height = 300 }: MetricsChartProps) {
  const defaultRadarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          showLabelBackdrop: false,
          color: '#6b7280',
        },
        pointLabels: {
          color: '#374151',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.5)',
        },
        angleLines: {
          color: 'rgba(203, 213, 225, 0.5)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 4,
      },
    },
  };

  const defaultBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(203, 213, 225, 0.5)',
        },
        ticks: {
          color: '#6b7280',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 4,
      },
    },
  };

  const mergedOptions = type === 'radar'
    ? { ...defaultRadarOptions, ...options }
    : { ...defaultBarOptions, ...options };

  return (
    <div style={{ height: `${height}px` }}>
      {type === 'radar' ? (
        <Radar data={data} options={mergedOptions} />
      ) : (
        <Bar data={data} options={mergedOptions} />
      )}
    </div>
  );
}
