'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/common/Alert';
import TestConfigForm from '@/app/components/testing/TestConfigForm';
import TestRunner from '@/app/components/testing/TestRunner';
import TestResultDisplay from '@/app/components/testing/TestResultDisplay';
import TestRunHistory from '@/app/components/testing/TestRunHistory';
import TestResultsDashboard from '@/app/components/testing/TestResultsDashboard';
import TestScheduler from '@/app/components/testing/TestScheduler';
import PerformanceBenchmark from '@/app/components/testing/PerformanceBenchmark';
import {
  TestCase,
  TestResult,
  TestRun,
  listTestCases,
  getTestCase,
  getTestSuite,
  listTestSuites
} from '@/app/lib/services/agentTesting';
import { getAgent } from '@/app/lib/services/agents';
import { useNotification } from '@/app/context/NotificationContext';
import { AlertTriangle, Plus, PlayCircle, BarChart4, History, Beaker, Zap, AlarmClock } from 'lucide-react';

export default function TestingPage() {
  const params = useParams();
  const agentId = params.id as string;
  const { showNotification } = useNotification();

  // State for agent
  const [agent, setAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for test cases
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testSuites, setTestSuites] = useState<any[]>([]);

  // State for UI
  const [activeTab, setActiveTab] = useState<string>('run');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [selectedTestSuiteId, setSelectedTestSuiteId] = useState<string | null>(null);
  const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null);
  const [selectedTestRun, setSelectedTestRun] = useState<TestRun | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState<boolean>(false);

  // Load agent and test cases
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load agent
        const agentData = await getAgent(agentId);

        if (!agentData) {
          throw new Error('Agent not found');
        }

        setAgent(agentData);

        // Load test cases
        const testCasesData = await listTestCases({ isTemplate: false });
        setTestCases(testCasesData);

        // Load test suites
        const testSuitesData = await listTestSuites();
        setTestSuites(testSuitesData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message || 'An unexpected error occurred');

        showNotification({
          id: 'load-error',
          title: 'Error',
          message: error.message || 'Failed to load data',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [agentId]);

  // Handle test case selection
  const handleTestCaseSelect = (testCaseId: string) => {
    setSelectedTestCaseId(testCaseId);
    setSelectedTestSuiteId(null);
    setSelectedTestResult(null);
    setSelectedTestRun(null);
  };

  // Handle test suite selection
  const handleTestSuiteSelect = (testSuiteId: string) => {
    setSelectedTestSuiteId(testSuiteId);
    setSelectedTestCaseId(null);
    setSelectedTestResult(null);
    setSelectedTestRun(null);
  };

  // Handle test result
  const handleTestComplete = (result: TestResult | TestRun) => {
    if ('testCaseId' in result) {
      setSelectedTestResult(result);
    } else {
      setSelectedTestRun(result);
    }
  };

  // Handle test run selection
  const handleTestRunSelect = (testRun: TestRun) => {
    setSelectedTestRun(testRun);
    setSelectedTestResult(null);
    setActiveTab('history');
  };

  // Handle test case creation
  const handleTestCaseCreated = (testCase: TestCase) => {
    setTestCases([testCase, ...testCases]);
    setIsCreatingTest(false);
    setSelectedTestCaseId(testCase.id);

    showNotification({
      id: 'test-case-created',
      title: 'Success',
      message: 'Test case created successfully',
      type: 'success'
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Testing Interface</h1>
          <p className="text-gray-500">
            Test and evaluate your agent's performance
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCreatingTest(true);
            setSelectedTestCaseId(null);
            setSelectedTestSuiteId(null);
            setSelectedTestResult(null);
            setSelectedTestRun(null);
          }}
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Create Test Case</span>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading testing interface...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Test selection sidebar */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Cases</CardTitle>
                <CardDescription>
                  Select a test case to run
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testCases.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No test cases found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreatingTest(true)}
                      className="mt-2"
                    >
                      Create Test Case
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className={`p-3 rounded-md cursor-pointer ${
                          selectedTestCaseId === testCase.id
                            ? 'bg-indigo-50 border-indigo-200 border'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => handleTestCaseSelect(testCase.id)}
                      >
                        <div className="font-medium">{testCase.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {testCase.type} • {testCase.priority}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Suites</CardTitle>
                <CardDescription>
                  Select a test suite to run
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testSuites.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No test suites found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {testSuites.map((testSuite) => (
                      <div
                        key={testSuite.id}
                        className={`p-3 rounded-md cursor-pointer ${
                          selectedTestSuiteId === testSuite.id
                            ? 'bg-indigo-50 border-indigo-200 border'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => handleTestSuiteSelect(testSuite.id)}
                      >
                        <div className="font-medium">{testSuite.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {testSuite.testCaseIds.length} test cases
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="run" className="flex items-center space-x-1">
                  <PlayCircle className="h-4 w-4" />
                  <span>Run Tests</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center space-x-1">
                  <History className="h-4 w-4" />
                  <span>Test History</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-1">
                  <BarChart4 className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center space-x-1">
                  <AlarmClock className="h-4 w-4" />
                  <span>Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="benchmark" className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>Benchmark</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="run">
                {isCreatingTest ? (
                  <TestConfigForm
                    onSave={handleTestCaseCreated}
                    onCancel={() => setIsCreatingTest(false)}
                  />
                ) : selectedTestCaseId ? (
                  <div className="space-y-6">
                    <TestRunner
                      agentId={agentId}
                      testCaseId={selectedTestCaseId}
                      onComplete={handleTestComplete}
                    />

                    {selectedTestResult && (
                      <TestResultDisplay
                        result={selectedTestResult}
                        onClose={() => setSelectedTestResult(null)}
                      />
                    )}
                  </div>
                ) : selectedTestSuiteId ? (
                  <TestRunner
                    agentId={agentId}
                    testSuiteId={selectedTestSuiteId}
                    onComplete={handleTestComplete}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Test Selected</h3>
                    <p className="text-gray-500 mt-2">
                      Select a test case or test suite from the sidebar to run tests
                    </p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreatingTest(true)}
                      >
                        Create New Test Case
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-6">
                  <TestRunHistory
                    agentId={agentId}
                    onSelectTestRun={handleTestRunSelect}
                  />

                  {selectedTestRun && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Test Run Details</CardTitle>
                        <CardDescription>
                          {selectedTestRun.name || 'Test Run'} - {new Date(selectedTestRun.startTime).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Test run summary */}
                          {selectedTestRun.summary && (
                            <div className="grid grid-cols-4 gap-4">
                              <div className="bg-gray-50 p-3 rounded-md text-center">
                                <div className="text-sm text-gray-500">Total</div>
                                <div className="text-xl font-bold">{selectedTestRun.summary.total}</div>
                              </div>
                              <div className="bg-green-50 p-3 rounded-md text-center">
                                <div className="text-sm text-green-600">Passed</div>
                                <div className="text-xl font-bold text-green-700">{selectedTestRun.summary.passed}</div>
                              </div>
                              <div className="bg-red-50 p-3 rounded-md text-center">
                                <div className="text-sm text-red-600">Failed</div>
                                <div className="text-xl font-bold text-red-700">{selectedTestRun.summary.failed}</div>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded-md text-center">
                                <div className="text-sm text-yellow-600">Success Rate</div>
                                <div className="text-xl font-bold text-yellow-700">
                                  {selectedTestRun.summary.successRate.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Test results */}
                          {selectedTestRun.results && Object.keys(selectedTestRun.results).length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-lg font-medium">Test Results</h3>
                              <div className="space-y-2">
                                {Object.entries(selectedTestRun.results).map(([testCaseId, result]) => (
                                  <div key={testCaseId} className="border rounded-md p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-medium">
                                          {result.testCaseName || 'Test Case'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Duration: {result.duration ? `${(result.duration / 1000).toFixed(1)}s` : 'N/A'}
                                        </div>
                                      </div>
                                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        result.status === 'passed' ? 'bg-green-100 text-green-800' :
                                        result.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {result.status}
                                      </div>
                                    </div>

                                    {result.error && (
                                      <div className="mt-2 pt-2 border-t text-sm text-red-600">
                                        {result.error}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <TestResultsDashboard agentId={agentId} />
              </TabsContent>

              <TabsContent value="schedule">
                <TestScheduler agentId={agentId} />
              </TabsContent>

              <TabsContent value="benchmark">
                <PerformanceBenchmark agentId={agentId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
