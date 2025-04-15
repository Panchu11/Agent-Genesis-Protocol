'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Badge } from '@/app/components/common/Badge';
import { Input } from '@/app/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { 
  TestRun,
  listTestRuns
} from '@/app/lib/services/agentTesting';
import { useNotification } from '@/app/context/NotificationContext';
import { CheckCircle, XCircle, AlertTriangle, Clock, Search, RefreshCw, ChevronRight } from 'lucide-react';

interface TestRunHistoryProps {
  agentId: string;
  onSelectTestRun?: (testRun: TestRun) => void;
}

export default function TestRunHistory({ agentId, onSelectTestRun }: TestRunHistoryProps) {
  const { showNotification } = useNotification();
  
  // State for test runs
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Load test runs
  useEffect(() => {
    loadTestRuns();
  }, [agentId, statusFilter]);
  
  // Load test runs
  const loadTestRuns = async () => {
    if (!agentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get status filter
      const status = statusFilter !== 'all' ? statusFilter as any : undefined;
      
      // Get test runs
      const runs = await listTestRuns(agentId, { status });
      setTestRuns(runs);
    } catch (error: any) {
      console.error('Error loading test runs:', error);
      setError(error.message || 'An unexpected error occurred');
      
      showNotification({
        id: 'test-runs-error',
        title: 'Error',
        message: error.message || 'Failed to load test runs',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Format duration
  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = ((duration % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center space-x-1">
            <span className="animate-pulse">●</span>
            <span>Running</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        );
    }
  };
  
  // Filter test runs
  const filteredTestRuns = testRuns.filter(run => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (run.name && run.name.toLowerCase().includes(query)) ||
        run.id.toLowerCase().includes(query) ||
        (run.testSuiteId && run.testSuiteId.toLowerCase().includes(query))
      );
    }
    return true;
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Run History</CardTitle>
            <CardDescription>
              View past test runs for this agent
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTestRuns}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex space-x-2">
            <div className="flex-grow relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search test runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              <p>{error}</p>
            </div>
          )}
          
          {/* Test runs list */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading test runs...</p>
            </div>
          ) : filteredTestRuns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No test runs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTestRuns.map((run) => (
                <div
                  key={run.id}
                  className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectTestRun && onSelectTestRun(run)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(run.status)}
                        <h3 className="font-medium">
                          {run.name || (run.testSuiteId ? 'Test Suite Run' : 'Test Run')}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(run.startTime)}
                        {run.summary && (
                          <span className="ml-2">
                            ({run.summary.passed}/{run.summary.total} passed, {run.summary.successRate.toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {run.duration && (
                        <div className="text-sm text-gray-500">
                          {formatDuration(run.duration)}
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-gray-500">
          {filteredTestRuns.length} test runs
        </div>
      </CardFooter>
    </Card>
  );
}
