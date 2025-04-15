'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Badge } from '@/app/components/common/Badge';
import { Progress } from '@/app/components/common/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/common/Alert';
import { 
  TestCase, 
  TestResult, 
  TestRun,
  executeTest,
  executeTestSuite,
  getTestCase,
  getTestSuite
} from '@/app/lib/services/agentTesting';
import { useNotification } from '@/app/context/NotificationContext';
import { Play, Pause, StopCircle, AlertTriangle, CheckCircle, Clock, RotateCcw } from 'lucide-react';

interface TestRunnerProps {
  agentId: string;
  testCaseId?: string;
  testSuiteId?: string;
  onComplete?: (result: TestResult | TestRun) => void;
}

export default function TestRunner({ 
  agentId, 
  testCaseId, 
  testSuiteId,
  onComplete 
}: TestRunnerProps) {
  const { showNotification } = useNotification();
  
  // State for test execution
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<TestResult | TestRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for test case/suite info
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [testSuiteName, setTestSuiteName] = useState<string>('');
  const [testCaseCount, setTestCaseCount] = useState<number>(0);
  
  // Load test case/suite info
  useEffect(() => {
    const loadTestInfo = async () => {
      try {
        if (testCaseId) {
          const testCaseData = await getTestCase(testCaseId);
          if (testCaseData) {
            setTestCase(testCaseData);
          }
        } else if (testSuiteId) {
          const testSuiteData = await getTestSuite(testSuiteId);
          if (testSuiteData) {
            setTestSuiteName(testSuiteData.name);
            setTestCaseCount(testSuiteData.testCaseIds.length);
          }
        }
      } catch (error) {
        console.error('Error loading test info:', error);
      }
    };
    
    loadTestInfo();
  }, [testCaseId, testSuiteId]);
  
  // Handle running a single test
  const handleRunTest = async () => {
    if (!agentId || !testCaseId) {
      setError('Missing agent ID or test case ID');
      return;
    }
    
    setIsRunning(true);
    setProgress(10);
    setError(null);
    
    try {
      // Execute the test
      const testResult = await executeTest(agentId, testCaseId);
      
      if (testResult) {
        setResult(testResult);
        setProgress(100);
        
        // Show notification
        showNotification({
          id: 'test-complete',
          title: 'Test Complete',
          message: `Test ${testResult.status === 'passed' ? 'passed' : 'failed'}`,
          type: testResult.status === 'passed' ? 'success' : 'error'
        });
        
        // Call onComplete callback
        if (onComplete) {
          onComplete(testResult);
        }
      } else {
        throw new Error('Failed to execute test');
      }
    } catch (error: any) {
      console.error('Error running test:', error);
      setError(error.message || 'An unexpected error occurred');
      
      showNotification({
        id: 'test-error',
        title: 'Test Error',
        message: error.message || 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Handle running a test suite
  const handleRunTestSuite = async () => {
    if (!agentId || !testSuiteId) {
      setError('Missing agent ID or test suite ID');
      return;
    }
    
    setIsRunning(true);
    setProgress(5);
    setError(null);
    
    try {
      // Execute the test suite
      const testRun = await executeTestSuite(agentId, testSuiteId);
      
      if (testRun) {
        setResult(testRun);
        setProgress(100);
        
        // Show notification
        const passRate = testRun.summary?.successRate || 0;
        showNotification({
          id: 'test-suite-complete',
          title: 'Test Suite Complete',
          message: `${testRun.summary?.passed || 0}/${testRun.summary?.total || 0} tests passed (${passRate.toFixed(1)}%)`,
          type: passRate >= 80 ? 'success' : passRate >= 50 ? 'warning' : 'error'
        });
        
        // Call onComplete callback
        if (onComplete) {
          onComplete(testRun);
        }
      } else {
        throw new Error('Failed to execute test suite');
      }
    } catch (error: any) {
      console.error('Error running test suite:', error);
      setError(error.message || 'An unexpected error occurred');
      
      showNotification({
        id: 'test-suite-error',
        title: 'Test Suite Error',
        message: error.message || 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Passed</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Error</span>
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
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        );
    }
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {testCaseId ? 'Test Runner' : 'Test Suite Runner'}
        </CardTitle>
        <CardDescription>
          {testCaseId 
            ? `Execute test case: ${testCase?.name || testCaseId}`
            : `Execute test suite: ${testSuiteName || testSuiteId} (${testCaseCount} tests)`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {isRunning ? 'Running...' : (result ? 'Complete' : 'Ready')}
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Test result */}
          {result && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(result.status)}
                </div>
                <div className="text-sm text-gray-500">
                  {result.duration && (
                    <span>Duration: {formatDuration(result.duration)}</span>
                  )}
                </div>
              </div>
              
              {/* For single test result */}
              {'testCaseId' in result && (
                <div className="space-y-2">
                  {result.error && (
                    <Alert variant="destructive" className="text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Test Error</AlertTitle>
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Basic result info - will be expanded in the next step */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Test Result Summary</h3>
                    <p className="text-sm">
                      {result.status === 'passed' 
                        ? 'The test passed successfully.' 
                        : 'The test failed. Check the details for more information.'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* For test suite result */}
              {'testSuiteId' in result && result.summary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="text-xl font-bold">{result.summary.total}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md text-center">
                      <div className="text-sm text-green-600">Passed</div>
                      <div className="text-xl font-bold text-green-700">{result.summary.passed}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-md text-center">
                      <div className="text-sm text-red-600">Failed</div>
                      <div className="text-xl font-bold text-red-700">{result.summary.failed}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-md text-center">
                      <div className="text-sm text-yellow-600">Success Rate</div>
                      <div className="text-xl font-bold text-yellow-700">
                        {result.summary.successRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Basic result info - will be expanded in the next step */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Test Suite Summary</h3>
                    <p className="text-sm">
                      {result.summary.successRate >= 80 
                        ? 'The test suite passed successfully.' 
                        : 'Some tests in the suite failed. Check the details for more information.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setResult(null);
            setProgress(0);
            setError(null);
          }}
          disabled={isRunning}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        
        <Button
          onClick={testCaseId ? handleRunTest : handleRunTestSuite}
          disabled={isRunning || (!testCaseId && !testSuiteId)}
        >
          {isRunning ? (
            <>
              <span className="animate-pulse mr-2">●</span>
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {result ? 'Run Again' : 'Run Test'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
