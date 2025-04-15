'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { TestResult, TestRun, TestCase, TestCaseType } from './agentTesting';

/**
 * Test Analytics Service
 * 
 * This service provides functions for analyzing test results and generating
 * insights about agent performance.
 */

export interface TestMetricsSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  skippedTests: number;
  successRate: number;
  avgResponseTime?: number;
  avgTokenCount?: number;
  totalCost?: number;
}

export interface TestTypeBreakdown {
  type: TestCaseType;
  total: number;
  passed: number;
  failed: number;
  successRate: number;
}

export interface TestTrend {
  date: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
}

export interface TestAnalytics {
  summary: TestMetricsSummary;
  typeBreakdown: TestTypeBreakdown[];
  trends: TestTrend[];
  mostFailedTests: {
    testCaseId: string;
    testCaseName: string;
    failureCount: number;
    lastRun: string;
  }[];
  performanceMetrics: {
    responseTime: {
      min: number;
      max: number;
      avg: number;
      p90: number;
    };
    tokenCount?: {
      min: number;
      max: number;
      avg: number;
      p90: number;
    };
  };
}

/**
 * Get test analytics for an agent
 * 
 * @param agentId The ID of the agent
 * @param timeRange Optional time range in days (default: 30)
 * @returns Test analytics
 */
export async function getAgentTestAnalytics(
  agentId: string,
  timeRange: number = 30
): Promise<TestAnalytics | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Calculate the start date based on the time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    const startDateStr = startDate.toISOString();
    
    // Get all test results for the agent within the time range
    const { data: testResults, error: testResultsError } = await supabase
      .from('test_results')
      .select('*, test_cases(type, name)')
      .eq('agent_id', agentId)
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: false });
    
    if (testResultsError) {
      throw testResultsError;
    }
    
    if (!testResults || testResults.length === 0) {
      return {
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          errorTests: 0,
          skippedTests: 0,
          successRate: 0
        },
        typeBreakdown: [],
        trends: [],
        mostFailedTests: [],
        performanceMetrics: {
          responseTime: {
            min: 0,
            max: 0,
            avg: 0,
            p90: 0
          }
        }
      };
    }
    
    // Calculate summary metrics
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const errorTests = testResults.filter(r => r.status === 'error').length;
    const skippedTests = testResults.filter(r => r.status === 'skipped').length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    // Calculate average response time
    const responseTimes = testResults
      .filter(r => r.performance_metrics?.responseTime)
      .map(r => r.performance_metrics.responseTime);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : undefined;
    
    // Calculate average token count
    const tokenCounts = testResults
      .filter(r => r.performance_metrics?.tokenCount)
      .map(r => r.performance_metrics.tokenCount);
    
    const avgTokenCount = tokenCounts.length > 0
      ? tokenCounts.reduce((sum, count) => sum + count, 0) / tokenCounts.length
      : undefined;
    
    // Calculate total cost
    const costs = testResults
      .filter(r => r.performance_metrics?.costEstimate)
      .map(r => r.performance_metrics.costEstimate);
    
    const totalCost = costs.length > 0
      ? costs.reduce((sum, cost) => sum + cost, 0)
      : undefined;
    
    // Calculate type breakdown
    const typeMap = new Map<string, { total: number; passed: number; failed: number }>();
    
    testResults.forEach(result => {
      const type = result.test_cases?.type || 'unknown';
      
      if (!typeMap.has(type)) {
        typeMap.set(type, { total: 0, passed: 0, failed: 0 });
      }
      
      const typeStats = typeMap.get(type)!;
      typeStats.total++;
      
      if (result.status === 'passed') {
        typeStats.passed++;
      } else if (result.status === 'failed' || result.status === 'error') {
        typeStats.failed++;
      }
    });
    
    const typeBreakdown = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type: type as TestCaseType,
      total: stats.total,
      passed: stats.passed,
      failed: stats.failed,
      successRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0
    }));
    
    // Calculate trends
    const dateMap = new Map<string, { total: number; passed: number; failed: number }>();
    
    // Initialize dates for the entire time range
    for (let i = 0; i < timeRange; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { total: 0, passed: 0, failed: 0 });
    }
    
    // Populate with actual data
    testResults.forEach(result => {
      const dateStr = new Date(result.created_at).toISOString().split('T')[0];
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { total: 0, passed: 0, failed: 0 });
      }
      
      const dateStats = dateMap.get(dateStr)!;
      dateStats.total++;
      
      if (result.status === 'passed') {
        dateStats.passed++;
      } else if (result.status === 'failed' || result.status === 'error') {
        dateStats.failed++;
      }
    });
    
    const trends = Array.from(dateMap.entries())
      .map(([date, stats]) => ({
        date,
        totalTests: stats.total,
        passedTests: stats.passed,
        failedTests: stats.failed,
        successRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Find most failed tests
    const failureMap = new Map<string, { count: number; name: string; lastRun: string }>();
    
    testResults.forEach(result => {
      if (result.status === 'failed' || result.status === 'error') {
        const testCaseId = result.test_case_id;
        const testCaseName = result.test_cases?.name || 'Unknown Test';
        
        if (!failureMap.has(testCaseId)) {
          failureMap.set(testCaseId, { count: 0, name: testCaseName, lastRun: result.created_at });
        }
        
        const failureStats = failureMap.get(testCaseId)!;
        failureStats.count++;
        
        // Update last run if this result is more recent
        if (new Date(result.created_at) > new Date(failureStats.lastRun)) {
          failureStats.lastRun = result.created_at;
        }
      }
    });
    
    const mostFailedTests = Array.from(failureMap.entries())
      .map(([testCaseId, stats]) => ({
        testCaseId,
        testCaseName: stats.name,
        failureCount: stats.count,
        lastRun: stats.lastRun
      }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, 5);
    
    // Calculate performance metrics
    const responseTimeMetrics = calculatePerformanceMetrics(responseTimes);
    const tokenCountMetrics = tokenCounts.length > 0 ? calculatePerformanceMetrics(tokenCounts) : undefined;
    
    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        errorTests,
        skippedTests,
        successRate,
        avgResponseTime,
        avgTokenCount,
        totalCost
      },
      typeBreakdown,
      trends,
      mostFailedTests,
      performanceMetrics: {
        responseTime: responseTimeMetrics,
        tokenCount: tokenCountMetrics
      }
    };
  } catch (error) {
    console.error('Error getting agent test analytics:', error);
    return null;
  }
}

/**
 * Get test analytics for a specific test case
 * 
 * @param testCaseId The ID of the test case
 * @param timeRange Optional time range in days (default: 30)
 * @returns Test analytics for the test case
 */
export async function getTestCaseAnalytics(
  testCaseId: string,
  timeRange: number = 30
): Promise<{
  totalRuns: number;
  passRate: number;
  avgResponseTime?: number;
  trends: { date: string; status: string; responseTime?: number }[];
} | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Calculate the start date based on the time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    const startDateStr = startDate.toISOString();
    
    // Get all test results for the test case within the time range
    const { data: testResults, error: testResultsError } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_case_id', testCaseId)
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: false });
    
    if (testResultsError) {
      throw testResultsError;
    }
    
    if (!testResults || testResults.length === 0) {
      return {
        totalRuns: 0,
        passRate: 0,
        trends: []
      };
    }
    
    // Calculate metrics
    const totalRuns = testResults.length;
    const passedRuns = testResults.filter(r => r.status === 'passed').length;
    const passRate = totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0;
    
    // Calculate average response time
    const responseTimes = testResults
      .filter(r => r.performance_metrics?.responseTime)
      .map(r => r.performance_metrics.responseTime);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : undefined;
    
    // Create trends data
    const trends = testResults.map(result => ({
      date: new Date(result.created_at).toISOString(),
      status: result.status,
      responseTime: result.performance_metrics?.responseTime
    }));
    
    return {
      totalRuns,
      passRate,
      avgResponseTime,
      trends
    };
  } catch (error) {
    console.error('Error getting test case analytics:', error);
    return null;
  }
}

/**
 * Get test analytics for a test suite
 * 
 * @param testSuiteId The ID of the test suite
 * @param timeRange Optional time range in days (default: 30)
 * @returns Test analytics for the test suite
 */
export async function getTestSuiteAnalytics(
  testSuiteId: string,
  timeRange: number = 30
): Promise<{
  totalRuns: number;
  avgPassRate: number;
  avgDuration?: number;
  testCasePerformance: { testCaseId: string; testCaseName: string; passRate: number }[];
} | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Calculate the start date based on the time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    const startDateStr = startDate.toISOString();
    
    // Get all test runs for the test suite within the time range
    const { data: testRuns, error: testRunsError } = await supabase
      .from('test_runs')
      .select('*')
      .eq('test_suite_id', testSuiteId)
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: false });
    
    if (testRunsError) {
      throw testRunsError;
    }
    
    if (!testRuns || testRuns.length === 0) {
      return {
        totalRuns: 0,
        avgPassRate: 0,
        testCasePerformance: []
      };
    }
    
    // Calculate metrics
    const totalRuns = testRuns.length;
    
    // Calculate average pass rate
    const passRates = testRuns
      .filter(run => run.summary?.successRate !== undefined)
      .map(run => run.summary.successRate);
    
    const avgPassRate = passRates.length > 0
      ? passRates.reduce((sum, rate) => sum + rate, 0) / passRates.length
      : 0;
    
    // Calculate average duration
    const durations = testRuns
      .filter(run => run.summary?.duration !== undefined)
      .map(run => run.summary.duration);
    
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : undefined;
    
    // Calculate test case performance
    const testCasePerformanceMap = new Map<string, { name: string; passed: number; total: number }>();
    
    testRuns.forEach(run => {
      if (run.results) {
        Object.entries(run.results).forEach(([testCaseId, result]) => {
          if (!testCasePerformanceMap.has(testCaseId)) {
            testCasePerformanceMap.set(testCaseId, { name: 'Unknown Test', passed: 0, total: 0 });
          }
          
          const performanceStats = testCasePerformanceMap.get(testCaseId)!;
          performanceStats.total++;
          
          if (result.status === 'passed') {
            performanceStats.passed++;
          }
          
          // Update name if available
          if (result.testCaseName) {
            performanceStats.name = result.testCaseName;
          }
        });
      }
    });
    
    const testCasePerformance = Array.from(testCasePerformanceMap.entries())
      .map(([testCaseId, stats]) => ({
        testCaseId,
        testCaseName: stats.name,
        passRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0
      }))
      .sort((a, b) => a.passRate - b.passRate);
    
    return {
      totalRuns,
      avgPassRate,
      avgDuration,
      testCasePerformance
    };
  } catch (error) {
    console.error('Error getting test suite analytics:', error);
    return null;
  }
}

/**
 * Calculate performance metrics for an array of numbers
 * 
 * @param values Array of numeric values
 * @returns Performance metrics
 */
function calculatePerformanceMetrics(values: number[]): { min: number; max: number; avg: number; p90: number } {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, avg: 0, p90: 0 };
  }
  
  // Sort values for percentile calculation
  const sortedValues = [...values].sort((a, b) => a - b);
  
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const avg = sortedValues.reduce((sum, val) => sum + val, 0) / sortedValues.length;
  
  // Calculate 90th percentile
  const p90Index = Math.floor(sortedValues.length * 0.9);
  const p90 = sortedValues[p90Index];
  
  return { min, max, avg, p90 };
}
