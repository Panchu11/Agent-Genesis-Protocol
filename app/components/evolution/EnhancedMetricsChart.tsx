'use client';

import React, { useState } from 'react';
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
  LineController,
  BarController,
  ChartData,
  ChartOptions,
  TimeScale,
  TimeSeriesScale
} from 'chart.js';
import { Radar, Bar, Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

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
  Title,
  LineController,
  BarController,
  TimeScale,
  TimeSeriesScale
);

interface EnhancedMetricsChartProps {
  type: 'radar' | 'bar' | 'line' | 'timeline';
  data: ChartData<'radar' | 'bar' | 'line'>;
  options?: ChartOptions<'radar' | 'bar' | 'line'>;
  height?: number;
  title?: string;
  description?: string;
  showLegend?: boolean;
  interactive?: boolean;
  colorScheme?: 'default' | 'pastel' | 'vibrant' | 'monochrome';
}

export default function EnhancedMetricsChart({
  type,
  data,
  options,
  height = 300,
  title,
  description,
  showLegend = true,
  interactive = true,
  colorScheme = 'default'
}: EnhancedMetricsChartProps) {
  const [chartType, setChartType] = useState(type);

  // Generate color schemes
  const getColorScheme = (index: number, alpha: number = 1) => {
    const schemes = {
      default: [
        `rgba(75, 192, 192, ${alpha})`,
        `rgba(54, 162, 235, ${alpha})`,
        `rgba(153, 102, 255, ${alpha})`,
        `rgba(255, 159, 64, ${alpha})`,
        `rgba(255, 99, 132, ${alpha})`,
        `rgba(255, 206, 86, ${alpha})`,
      ],
      pastel: [
        `rgba(187, 222, 251, ${alpha})`,
        `rgba(209, 196, 233, ${alpha})`,
        `rgba(255, 236, 179, ${alpha})`,
        `rgba(200, 230, 201, ${alpha})`,
        `rgba(255, 205, 210, ${alpha})`,
        `rgba(225, 190, 231, ${alpha})`,
      ],
      vibrant: [
        `rgba(0, 176, 255, ${alpha})`,
        `rgba(255, 64, 129, ${alpha})`,
        `rgba(0, 230, 118, ${alpha})`,
        `rgba(255, 145, 0, ${alpha})`,
        `rgba(101, 31, 255, ${alpha})`,
        `rgba(29, 233, 182, ${alpha})`,
      ],
      monochrome: [
        `rgba(33, 33, 33, ${alpha})`,
        `rgba(66, 66, 66, ${alpha})`,
        `rgba(97, 97, 97, ${alpha})`,
        `rgba(117, 117, 117, ${alpha})`,
        `rgba(158, 158, 158, ${alpha})`,
        `rgba(189, 189, 189, ${alpha})`,
      ]
    };

    const colors = schemes[colorScheme] || schemes.default;
    return colors[index % colors.length];
  };

  // Apply color scheme to data
  const colorizedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || getColorScheme(index, 0.2),
      borderColor: dataset.borderColor || getColorScheme(index, 1),
    }))
  };

  // Default options for each chart type
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
        display: showLegend,
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
      title: {
        display: !!title,
        text: title || '',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 10,
        },
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
        display: showLegend,
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
      title: {
        display: !!title,
        text: title || '',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 10,
        },
      },
    },
  };

  const defaultLineOptions: ChartOptions<'line'> = {
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
        display: showLegend,
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
      title: {
        display: !!title,
        text: title || '',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 10,
        },
      },
    },
  };

  // Merge default options with provided options
  const mergedOptions = chartType === 'radar'
    ? { ...defaultRadarOptions, ...options }
    : chartType === 'line'
    ? { ...defaultLineOptions, ...options }
    : { ...defaultBarOptions, ...options };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      )}

      {interactive && (
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setChartType('radar')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                chartType === 'radar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Radar
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 text-sm font-medium ${
                chartType === 'bar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-200`}
            >
              Bar
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                chartType === 'line'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Line
            </button>
          </div>
        </div>
      )}

      <div style={{ height: `${height}px` }}>
        {chartType === 'radar' && (
          <Radar data={colorizedData} options={mergedOptions} />
        )}
        {chartType === 'bar' && (
          <Bar data={colorizedData} options={mergedOptions} />
        )}
        {chartType === 'line' && (
          <Line data={colorizedData} options={mergedOptions} />
        )}
      </div>
    </div>
  );
}
