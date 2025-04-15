'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Badge } from '@/app/components/common/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/common/Alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/common/Collapsible';
import { 
  TestResult, 
  ValidationResult,
  PerformanceMetrics
} from '@/app/lib/services/agentTesting';
import { CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronRight, BarChart } from 'lucide-react';

interface TestResultDisplayProps {
  result: TestResult;
  onClose?: () => void;
}

export default function TestResultDisplay({ result, onClose }: TestResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
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
            <XCircle className="h-3 w-3" />
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
      case 'skipped':
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Skipped</span>
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
  
  // Get validation result badge
  const getValidationBadge = (passed: boolean) => {
    return passed ? (
      <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
        <CheckCircle className="h-3 w-3" />
        <span>Passed</span>
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 flex items-center space-x-1">
        <XCircle className="h-3 w-3" />
        <span>Failed</span>
      </Badge>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Test Result</span>
              {getStatusBadge(result.status)}
            </CardTitle>
            <CardDescription>
              Test executed at {formatTimestamp(result.startTime)}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Duration</div>
            <div className="text-2xl font-bold">
              {result.duration ? formatDuration(result.duration) : 'N/A'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              {/* Test information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Test ID</h3>
                  <p className="text-sm font-mono">{result.testCaseId}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Agent ID</h3>
                  <p className="text-sm font-mono">{result.agentId}</p>
                </div>
              </div>
              
              {/* Timing information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                  <p className="text-sm">{formatTimestamp(result.startTime)}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                  <p className="text-sm">{result.endTime ? formatTimestamp(result.endTime) : 'N/A'}</p>
                </div>
              </div>
              
              {/* Error information */}
              {result.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{result.errorType || 'Error'}</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
              
              {/* Inputs */}
              <Collapsible className="border rounded-md">
                <CollapsibleTrigger className="flex justify-between items-center w-full p-3 hover:bg-gray-50">
                  <h3 className="text-sm font-medium">Test Inputs</h3>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 border-t bg-gray-50">
                  <pre className="text-xs overflow-auto max-h-60">
                    {JSON.stringify(result.actualOutputs, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Outputs */}
              <Collapsible className="border rounded-md">
                <CollapsibleTrigger className="flex justify-between items-center w-full p-3 hover:bg-gray-50">
                  <h3 className="text-sm font-medium">Test Outputs</h3>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 border-t bg-gray-50">
                  <pre className="text-xs overflow-auto max-h-60">
                    {JSON.stringify(result.actualOutputs, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Metadata */}
              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <Collapsible className="border rounded-md">
                  <CollapsibleTrigger className="flex justify-between items-center w-full p-3 hover:bg-gray-50">
                    <h3 className="text-sm font-medium">Metadata</h3>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 border-t bg-gray-50">
                    <pre className="text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.metadata, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="validation">
            <div className="space-y-4">
              {/* Validation summary */}
              {result.validationResults && result.validationResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Total Rules</div>
                      <div className="text-xl font-bold">{result.validationResults.length}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="text-sm text-green-600">Passed</div>
                      <div className="text-xl font-bold text-green-700">
                        {result.validationResults.filter(r => r.passed).length}
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-md">
                      <div className="text-sm text-red-600">Failed</div>
                      <div className="text-xl font-bold text-red-700">
                        {result.validationResults.filter(r => !r.passed).length}
                      </div>
                    </div>
                  </div>
                  
                  {/* Validation details */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Validation Rules</h3>
                    <div className="space-y-2">
                      {result.validationResults.map((validation, index) => (
                        <div key={index} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{validation.rule.type}</Badge>
                                <span className="font-medium">{validation.rule.target}</span>
                              </div>
                              {validation.message && (
                                <p className="text-sm text-gray-500">{validation.message}</p>
                              )}
                            </div>
                            {getValidationBadge(validation.passed)}
                          </div>
                          
                          {validation.details && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-xs text-gray-500">Details</div>
                              <pre className="text-xs overflow-auto max-h-20 mt-1">
                                {JSON.stringify(validation.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Validation Rules</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This test does not have any validation rules defined.
                    Without validation rules, the test will always pass if the agent responds.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="space-y-4">
              {result.performanceMetrics ? (
                <div className="space-y-4">
                  {/* Performance metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="text-sm text-blue-600">Response Time</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {result.performanceMetrics.responseTime.toFixed(1)} ms
                      </div>
                    </div>
                    
                    {result.performanceMetrics.tokenCount !== undefined && (
                      <div className="bg-purple-50 p-4 rounded-md">
                        <div className="text-sm text-purple-600">Token Count</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {result.performanceMetrics.tokenCount}
                        </div>
                      </div>
                    )}
                    
                    {result.performanceMetrics.memoryUsage !== undefined && (
                      <div className="bg-green-50 p-4 rounded-md">
                        <div className="text-sm text-green-600">Memory Usage</div>
                        <div className="text-2xl font-bold text-green-700">
                          {result.performanceMetrics.memoryUsage.toFixed(1)} MB
                        </div>
                      </div>
                    )}
                    
                    {result.performanceMetrics.cpuUsage !== undefined && (
                      <div className="bg-yellow-50 p-4 rounded-md">
                        <div className="text-sm text-yellow-600">CPU Usage</div>
                        <div className="text-2xl font-bold text-yellow-700">
                          {result.performanceMetrics.cpuUsage.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    
                    {result.performanceMetrics.costEstimate !== undefined && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="text-sm text-gray-600">Cost Estimate</div>
                        <div className="text-2xl font-bold text-gray-700">
                          ${result.performanceMetrics.costEstimate.toFixed(4)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Performance comparison */}
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Performance Analysis</h3>
                    <p className="text-sm text-gray-500">
                      Response time is {result.performanceMetrics.responseTime < 1000 ? 'excellent' : 
                        result.performanceMetrics.responseTime < 3000 ? 'good' : 
                        result.performanceMetrics.responseTime < 5000 ? 'average' : 'slow'}.
                      
                      {result.performanceMetrics.tokenCount !== undefined && (
                        ` Token usage is ${result.performanceMetrics.tokenCount < 100 ? 'very efficient' :
                          result.performanceMetrics.tokenCount < 300 ? 'efficient' :
                          result.performanceMetrics.tokenCount < 500 ? 'average' : 'high'}.`
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Performance Metrics</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    No performance metrics were collected for this test.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        {onClose && (
          <Button onClick={onClose}>
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
