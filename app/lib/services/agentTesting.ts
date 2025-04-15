'use client';

import { createBrowserSupabaseClient } from '../db/supabase';
import { Agent } from './agents';
import { getCurrentUser } from '../db/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent Testing Service
 *
 * This service provides functions for testing agents, managing test cases,
 * and analyzing test results.
 */

// Test case types and interfaces
export type TestCaseType =
  | 'functional'
  | 'performance'
  | 'security'
  | 'integration'
  | 'prompt'
  | 'custom';

export type TestCaseStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error'
  | 'skipped';

export type TestCasePriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface ValidationRule {
  type: 'exact_match' | 'contains' | 'regex' | 'json_path' | 'custom';
  target: string; // Field or path to validate
  value?: any; // Expected value or pattern
  options?: Record<string, any>; // Additional options for validation
  message?: string; // Custom error message
}

export interface TestParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: any[]; // For enum-like parameters
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean;
  };
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  type: TestCaseType;
  priority: TestCasePriority;
  inputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
  parameters?: TestParameter[];
  validationRules?: ValidationRule[];
  timeout?: number; // Timeout in milliseconds
  retryCount?: number; // Number of retries on failure
  tags?: string[];
  isTemplate?: boolean; // Whether this is a template test case
  templateId?: string; // If derived from a template, the template ID
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ValidationResult {
  rule: ValidationRule;
  passed: boolean;
  message?: string;
  details?: Record<string, any>;
}

export interface PerformanceMetrics {
  responseTime: number; // in milliseconds
  tokenCount?: number;
  memoryUsage?: number; // in MB
  cpuUsage?: number; // percentage
  costEstimate?: number; // in USD
}

export interface TestResult {
  id: string;
  testCaseId: string;
  agentId: string;
  status: TestCaseStatus;
  startTime: string;
  endTime?: string;
  duration?: number; // in milliseconds
  actualOutputs?: Record<string, any>;
  validationResults?: ValidationResult[];
  performanceMetrics?: PerformanceMetrics;
  error?: string;
  errorType?: string;
  errorStack?: string;
  attempts?: number; // Number of attempts made
  logs?: Array<{timestamp: string, level: string, message: string}>;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  testCaseIds: string[];
  tags?: string[];
  isPublic?: boolean; // Whether this test suite is publicly available
  category?: string; // Category for organizing test suites
  config?: {
    parallelExecution?: boolean; // Whether to run tests in parallel
    stopOnFailure?: boolean; // Whether to stop on first failure
    defaultTimeout?: number; // Default timeout for all test cases
    retryStrategy?: {
      maxRetries: number;
      delayBetweenRetries: number; // in milliseconds
    };
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TestRunConfig {
  parallelExecution?: boolean;
  stopOnFailure?: boolean;
  timeout?: number;
  environment?: Record<string, any>; // Environment variables for the test run
  retryStrategy?: {
    maxRetries: number;
    delayBetweenRetries: number; // in milliseconds
  };
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  error: number;
  skipped: number;
  duration: number; // in milliseconds
  successRate: number; // percentage
  avgResponseTime?: number; // average response time in milliseconds
  avgTokenCount?: number; // average token count
  totalCost?: number; // total cost in USD
  startTime: string;
  endTime: string;
}

export interface TestRun {
  id: string;
  name?: string;
  agentId: string;
  testSuiteId?: string;
  testCaseIds?: string[];
  config?: TestRunConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number; // percentage complete
  startTime: string;
  endTime?: string;
  results?: Record<string, TestResult>;
  summary?: TestRunSummary;
  logs?: Array<{timestamp: string, level: string, message: string}>;
  createdAt: string;
  createdBy: string;
  scheduledBy?: string; // User ID if scheduled by a user
  scheduledAt?: string; // Timestamp if scheduled
}

/**
 * Execute a single test case against an agent
 *
 * @param agentId The ID of the agent to test
 * @param testCaseId The ID of the test case to execute
 * @param options Optional configuration for the test execution
 * @returns The test result
 */
export async function executeTest(
  agentId: string,
  testCaseId: string,
  options?: {
    timeout?: number;
    retryCount?: number;
    environment?: Record<string, any>;
  }
): Promise<TestResult | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the test case
    const { data: testCase, error: testCaseError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('id', testCaseId)
      .single();

    if (testCaseError || !testCase) {
      throw new Error(`Test case not found: ${testCaseError?.message}`);
    }

    // Get the agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    // Create a test result record
    const testResultId = uuidv4();
    const startTime = new Date().toISOString();

    const { error: createError } = await supabase
      .from('test_results')
      .insert({
        id: testResultId,
        test_case_id: testCaseId,
        agent_id: agentId,
        status: 'running',
        start_time: startTime,
        created_at: startTime,
        created_by: user.id
      });

    if (createError) {
      throw new Error(`Failed to create test result: ${createError.message}`);
    }

    // Execute the test
    let status: TestCaseStatus = 'running';
    let actualOutputs: Record<string, any> = {};
    let error: string | undefined;
    let errorType: string | undefined;
    let errorStack: string | undefined;
    let validationResults: ValidationResult[] = [];
    let performanceMetrics: PerformanceMetrics = {
      responseTime: 0
    };
    let attempts = 1;

    try {
      // Start timing
      const testStartTime = performance.now();

      // Prepare inputs with environment variables if provided
      const testInputs = {
        ...testCase.inputs,
        ...(options?.environment || {})
      };

      // TODO: Implement actual agent execution logic here
      // This is a placeholder for the actual agent execution
      // In a real implementation, this would call the agent's API

      // Simulate agent execution for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate agent response
      actualOutputs = {
        response: "This is a simulated response from the agent.",
        confidence: 0.85
      };

      // End timing
      const testEndTime = performance.now();
      performanceMetrics.responseTime = testEndTime - testStartTime;

      // Validate the results
      if (testCase.validationRules && testCase.validationRules.length > 0) {
        validationResults = testCase.validationRules.map(rule => {
          // Implement validation logic based on rule type
          // This is a simplified example
          const target = rule.target;
          const targetValue = actualOutputs[target];

          let passed = false;
          let message = '';

          switch (rule.type) {
            case 'exact_match':
              passed = targetValue === rule.value;
              message = passed ? 'Exact match successful' : `Expected ${rule.value}, got ${targetValue}`;
              break;
            case 'contains':
              passed = typeof targetValue === 'string' && targetValue.includes(String(rule.value));
              message = passed ? 'Contains match successful' : `Expected to contain ${rule.value}`;
              break;
            case 'regex':
              if (typeof rule.value === 'string') {
                const regex = new RegExp(rule.value);
                passed = typeof targetValue === 'string' && regex.test(targetValue);
                message = passed ? 'Regex match successful' : `Failed to match regex ${rule.value}`;
              }
              break;
            // Add other validation types as needed
            default:
              passed = false;
              message = 'Unsupported validation rule type';
          }

          return {
            rule,
            passed,
            message,
            details: { actual: targetValue }
          };
        });

        // Determine overall test status based on validation results
        const allPassed = validationResults.every(result => result.passed);
        status = allPassed ? 'passed' : 'failed';
      } else {
        // No validation rules, consider it passed
        status = 'passed';
      }
    } catch (e: any) {
      status = 'error';
      error = e.message || 'Unknown error';
      errorType = e.name || 'Error';
      errorStack = e.stack;

      // Handle retries if configured
      const maxRetries = options?.retryCount || testCase.retryCount || 0;
      if (attempts < maxRetries + 1) {
        // Implement retry logic here
        // For now, just increment attempts
        attempts++;
      }
    }

    // Calculate duration
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    // Update the test result
    const { error: updateError } = await supabase
      .from('test_results')
      .update({
        status,
        end_time: endTime,
        duration,
        actual_outputs: actualOutputs,
        validation_results: validationResults,
        performance_metrics: performanceMetrics,
        error,
        error_type: errorType,
        error_stack: errorStack,
        attempts
      })
      .eq('id', testResultId);

    if (updateError) {
      throw new Error(`Failed to update test result: ${updateError.message}`);
    }

    // Return the test result
    return {
      id: testResultId,
      testCaseId,
      agentId,
      status,
      startTime,
      endTime,
      duration,
      actualOutputs,
      validationResults,
      performanceMetrics,
      error,
      errorType,
      errorStack,
      attempts,
      createdAt: startTime,
      createdBy: user.id
    };
  } catch (error: any) {
    console.error('Error executing test:', error);
    return null;
  }
}

/**
 * Execute a test suite against an agent
 *
 * @param agentId The ID of the agent to test
 * @param testSuiteId The ID of the test suite to execute
 * @param config Optional configuration for the test run
 * @returns The test run result
 */
export async function executeTestSuite(
  agentId: string,
  testSuiteId: string,
  config?: TestRunConfig
): Promise<TestRun | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the test suite
    const { data: testSuite, error: testSuiteError } = await supabase
      .from('test_suites')
      .select('*')
      .eq('id', testSuiteId)
      .single();

    if (testSuiteError || !testSuite) {
      throw new Error(`Test suite not found: ${testSuiteError?.message}`);
    }

    // Create a test run record
    const testRunId = uuidv4();
    const startTime = new Date().toISOString();

    const { error: createError } = await supabase
      .from('test_runs')
      .insert({
        id: testRunId,
        agent_id: agentId,
        test_suite_id: testSuiteId,
        test_case_ids: testSuite.test_case_ids,
        config: config || testSuite.config,
        status: 'running',
        progress: 0,
        start_time: startTime,
        created_at: startTime,
        created_by: user.id
      });

    if (createError) {
      throw new Error(`Failed to create test run: ${createError.message}`);
    }

    // Execute each test case
    const testCaseIds = testSuite.test_case_ids || [];
    const results: Record<string, TestResult> = {};
    let progress = 0;

    const effectiveConfig = config || testSuite.config || {};
    const parallelExecution = effectiveConfig.parallelExecution || false;
    const stopOnFailure = effectiveConfig.stopOnFailure || false;

    if (parallelExecution) {
      // Execute tests in parallel
      const testPromises = testCaseIds.map(testCaseId =>
        executeTest(agentId, testCaseId, {
          timeout: effectiveConfig.timeout,
          retryCount: effectiveConfig.retryStrategy?.maxRetries,
          environment: effectiveConfig.environment
        })
      );

      const testResults = await Promise.all(testPromises);

      testResults.forEach((result, index) => {
        if (result) {
          results[testCaseIds[index]] = result;
        }
      });
    } else {
      // Execute tests sequentially
      for (let i = 0; i < testCaseIds.length; i++) {
        const testCaseId = testCaseIds[i];

        // Update progress
        progress = Math.round((i / testCaseIds.length) * 100);
        await supabase
          .from('test_runs')
          .update({ progress })
          .eq('id', testRunId);

        // Execute the test
        const result = await executeTest(agentId, testCaseId, {
          timeout: effectiveConfig.timeout,
          retryCount: effectiveConfig.retryStrategy?.maxRetries,
          environment: effectiveConfig.environment
        });

        if (result) {
          results[testCaseId] = result;

          // Stop on failure if configured
          if (stopOnFailure && (result.status === 'failed' || result.status === 'error')) {
            break;
          }
        }
      }
    }

    // Calculate summary
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    const resultValues = Object.values(results);
    const total = resultValues.length;
    const passed = resultValues.filter(r => r.status === 'passed').length;
    const failed = resultValues.filter(r => r.status === 'failed').length;
    const error = resultValues.filter(r => r.status === 'error').length;
    const skipped = resultValues.filter(r => r.status === 'skipped').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    // Calculate performance metrics
    const responseTimes = resultValues
      .filter(r => r.performanceMetrics?.responseTime)
      .map(r => r.performanceMetrics!.responseTime);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : undefined;

    const summary: TestRunSummary = {
      total,
      passed,
      failed,
      error,
      skipped,
      duration,
      successRate,
      avgResponseTime,
      startTime,
      endTime
    };

    // Determine overall status
    let status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'completed';
    if (failed > 0 || error > 0) {
      status = 'failed';
    }

    // Update the test run
    const { error: updateError } = await supabase
      .from('test_runs')
      .update({
        status,
        progress: 100,
        end_time: endTime,
        results,
        summary
      })
      .eq('id', testRunId);

    if (updateError) {
      throw new Error(`Failed to update test run: ${updateError.message}`);
    }

    // Return the test run
    return {
      id: testRunId,
      agentId,
      testSuiteId,
      testCaseIds,
      config: effectiveConfig,
      status,
      progress: 100,
      startTime,
      endTime,
      results,
      summary,
      createdAt: startTime,
      createdBy: user.id
    };
  } catch (error: any) {
    console.error('Error executing test suite:', error);
    return null;
  }
}

/**
 * Get a test result by ID
 *
 * @param testResultId The ID of the test result
 * @returns The test result
 */
export async function getTestResult(testResultId: string): Promise<TestResult | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('id', testResultId)
      .single();

    if (error || !data) {
      throw error || new Error('Test result not found');
    }

    return {
      id: data.id,
      testCaseId: data.test_case_id,
      agentId: data.agent_id,
      status: data.status,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      actualOutputs: data.actual_outputs,
      validationResults: data.validation_results,
      performanceMetrics: data.performance_metrics,
      error: data.error,
      errorType: data.error_type,
      errorStack: data.error_stack,
      attempts: data.attempts,
      logs: data.logs,
      metadata: data.metadata,
      createdAt: data.created_at,
      createdBy: data.created_by
    };
  } catch (error) {
    console.error('Error getting test result:', error);
    return null;
  }
}

/**
 * Create a new test case
 *
 * @param testCase The test case to create
 * @returns The created test case
 */
export async function createTestCase(
  testCase: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<TestCase | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const testCaseId = uuidv4();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('test_cases')
      .insert({
        id: testCaseId,
        name: testCase.name,
        description: testCase.description,
        type: testCase.type,
        priority: testCase.priority,
        inputs: testCase.inputs,
        expected_outputs: testCase.expectedOutputs,
        parameters: testCase.parameters,
        validation_rules: testCase.validationRules,
        timeout: testCase.timeout,
        retry_count: testCase.retryCount,
        tags: testCase.tags,
        is_template: testCase.isTemplate,
        template_id: testCase.templateId,
        created_at: now,
        updated_at: now,
        created_by: user.id
      });

    if (error) {
      throw error;
    }

    return {
      id: testCaseId,
      ...testCase,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id
    };
  } catch (error) {
    console.error('Error creating test case:', error);
    return null;
  }
}

/**
 * Get a test case by ID
 *
 * @param testCaseId The ID of the test case
 * @returns The test case
 */
export async function getTestCase(testCaseId: string): Promise<TestCase | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('id', testCaseId)
      .single();

    if (error || !data) {
      throw error || new Error('Test case not found');
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      priority: data.priority,
      inputs: data.inputs,
      expectedOutputs: data.expected_outputs,
      parameters: data.parameters,
      validationRules: data.validation_rules,
      timeout: data.timeout,
      retryCount: data.retry_count,
      tags: data.tags,
      isTemplate: data.is_template,
      templateId: data.template_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
    };
  } catch (error) {
    console.error('Error getting test case:', error);
    return null;
  }
}

/**
 * Update a test case
 *
 * @param testCaseId The ID of the test case to update
 * @param updates The updates to apply
 * @returns The updated test case
 */
export async function updateTestCase(
  testCaseId: string,
  updates: Partial<Omit<TestCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>
): Promise<TestCase | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the current test case
    const currentTestCase = await getTestCase(testCaseId);

    if (!currentTestCase) {
      throw new Error('Test case not found');
    }

    const now = new Date().toISOString();

    // Prepare the update object
    const updateData: Record<string, any> = {
      updated_at: now
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.inputs !== undefined) updateData.inputs = updates.inputs;
    if (updates.expectedOutputs !== undefined) updateData.expected_outputs = updates.expectedOutputs;
    if (updates.parameters !== undefined) updateData.parameters = updates.parameters;
    if (updates.validationRules !== undefined) updateData.validation_rules = updates.validationRules;
    if (updates.timeout !== undefined) updateData.timeout = updates.timeout;
    if (updates.retryCount !== undefined) updateData.retry_count = updates.retryCount;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.isTemplate !== undefined) updateData.is_template = updates.isTemplate;
    if (updates.templateId !== undefined) updateData.template_id = updates.templateId;

    const { error } = await supabase
      .from('test_cases')
      .update(updateData)
      .eq('id', testCaseId);

    if (error) {
      throw error;
    }

    // Return the updated test case
    return {
      ...currentTestCase,
      ...updates,
      updatedAt: now
    };
  } catch (error) {
    console.error('Error updating test case:', error);
    return null;
  }
}

/**
 * Delete a test case
 *
 * @param testCaseId The ID of the test case to delete
 * @returns Whether the deletion was successful
 */
export async function deleteTestCase(testCaseId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from('test_cases')
      .delete()
      .eq('id', testCaseId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting test case:', error);
    return false;
  }
}

/**
 * List test cases with optional filtering
 *
 * @param options Optional filtering options
 * @returns Array of test cases
 */
export async function listTestCases(options?: {
  type?: TestCaseType;
  priority?: TestCasePriority;
  tags?: string[];
  isTemplate?: boolean;
  createdBy?: string;
  limit?: number;
  offset?: number;
}): Promise<TestCase[]> {
  try {
    const supabase = createBrowserSupabaseClient();

    let query = supabase
      .from('test_cases')
      .select('*');

    // Apply filters
    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options?.isTemplate !== undefined) {
      query = query.eq('is_template', options.isTemplate);
    }

    if (options?.createdBy) {
      query = query.eq('created_by', options.createdBy);
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      priority: item.priority,
      inputs: item.inputs,
      expectedOutputs: item.expected_outputs,
      parameters: item.parameters,
      validationRules: item.validation_rules,
      timeout: item.timeout,
      retryCount: item.retry_count,
      tags: item.tags,
      isTemplate: item.is_template,
      templateId: item.template_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      createdBy: item.created_by
    }));
  } catch (error) {
    console.error('Error listing test cases:', error);
    return [];
  }
}

/**
 * Create a test case from a template
 *
 * @param templateId The ID of the template test case
 * @param customizations Customizations to apply to the template
 * @returns The created test case
 */
export async function createTestCaseFromTemplate(
  templateId: string,
  customizations: {
    name?: string;
    description?: string;
    inputs?: Record<string, any>;
    expectedOutputs?: Record<string, any>;
    validationRules?: ValidationRule[];
    priority?: TestCasePriority;
    tags?: string[];
  }
): Promise<TestCase | null> {
  try {
    // Get the template
    const template = await getTestCase(templateId);

    if (!template || !template.isTemplate) {
      throw new Error('Template not found or not a template');
    }

    // Create a new test case based on the template
    return createTestCase({
      name: customizations.name || `${template.name} (Copy)`,
      description: customizations.description || template.description,
      type: template.type,
      priority: customizations.priority || template.priority,
      inputs: customizations.inputs || template.inputs,
      expectedOutputs: customizations.expectedOutputs || template.expectedOutputs,
      parameters: template.parameters,
      validationRules: customizations.validationRules || template.validationRules,
      timeout: template.timeout,
      retryCount: template.retryCount,
      tags: customizations.tags || template.tags,
      isTemplate: false,
      templateId: template.id
    });
  } catch (error) {
    console.error('Error creating test case from template:', error);
    return null;
  }
}

/**
 * Get a test run by ID
 *
 * @param testRunId The ID of the test run
 * @returns The test run
 */
export async function getTestRun(testRunId: string): Promise<TestRun | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .eq('id', testRunId)
      .single();

    if (error || !data) {
      throw error || new Error('Test run not found');
    }

    return {
      id: data.id,
      name: data.name,
      agentId: data.agent_id,
      testSuiteId: data.test_suite_id,
      testCaseIds: data.test_case_ids,
      config: data.config,
      status: data.status,
      progress: data.progress,
      startTime: data.start_time,
      endTime: data.end_time,
      results: data.results,
      summary: data.summary,
      logs: data.logs,
      createdAt: data.created_at,
      createdBy: data.created_by,
      scheduledBy: data.scheduled_by,
      scheduledAt: data.scheduled_at
    };
  } catch (error) {
    console.error('Error getting test run:', error);
    return null;
  }
}

/**
 * Create a test suite
 *
 * @param testSuite The test suite to create
 * @returns The created test suite
 */
export async function createTestSuite(
  testSuite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<TestSuite | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const testSuiteId = uuidv4();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('test_suites')
      .insert({
        id: testSuiteId,
        name: testSuite.name,
        description: testSuite.description,
        test_case_ids: testSuite.testCaseIds,
        tags: testSuite.tags,
        is_public: testSuite.isPublic,
        category: testSuite.category,
        config: testSuite.config,
        created_at: now,
        updated_at: now,
        created_by: user.id
      });

    if (error) {
      throw error;
    }

    return {
      id: testSuiteId,
      ...testSuite,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id
    };
  } catch (error) {
    console.error('Error creating test suite:', error);
    return null;
  }
}

/**
 * Get a test suite by ID
 *
 * @param testSuiteId The ID of the test suite
 * @returns The test suite
 */
export async function getTestSuite(testSuiteId: string): Promise<TestSuite | null> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('test_suites')
      .select('*')
      .eq('id', testSuiteId)
      .single();

    if (error || !data) {
      throw error || new Error('Test suite not found');
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      testCaseIds: data.test_case_ids,
      tags: data.tags,
      isPublic: data.is_public,
      category: data.category,
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
    };
  } catch (error) {
    console.error('Error getting test suite:', error);
    return null;
  }
}

/**
 * Update a test suite
 *
 * @param testSuiteId The ID of the test suite to update
 * @param updates The updates to apply
 * @returns The updated test suite
 */
export async function updateTestSuite(
  testSuiteId: string,
  updates: Partial<Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>
): Promise<TestSuite | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the current test suite
    const currentTestSuite = await getTestSuite(testSuiteId);

    if (!currentTestSuite) {
      throw new Error('Test suite not found');
    }

    const now = new Date().toISOString();

    // Prepare the update object
    const updateData: Record<string, any> = {
      updated_at: now
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.testCaseIds !== undefined) updateData.test_case_ids = updates.testCaseIds;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.config !== undefined) updateData.config = updates.config;

    const { error } = await supabase
      .from('test_suites')
      .update(updateData)
      .eq('id', testSuiteId);

    if (error) {
      throw error;
    }

    // Return the updated test suite
    return {
      ...currentTestSuite,
      ...updates,
      updatedAt: now
    };
  } catch (error) {
    console.error('Error updating test suite:', error);
    return null;
  }
}

/**
 * Delete a test suite
 *
 * @param testSuiteId The ID of the test suite to delete
 * @returns Whether the deletion was successful
 */
export async function deleteTestSuite(testSuiteId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from('test_suites')
      .delete()
      .eq('id', testSuiteId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting test suite:', error);
    return false;
  }
}

/**
 * List test suites with optional filtering
 *
 * @param options Optional filtering options
 * @returns Array of test suites
 */
export async function listTestSuites(options?: {
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  createdBy?: string;
  limit?: number;
  offset?: number;
}): Promise<TestSuite[]> {
  try {
    const supabase = createBrowserSupabaseClient();

    let query = supabase
      .from('test_suites')
      .select('*');

    // Apply filters
    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options?.isPublic !== undefined) {
      query = query.eq('is_public', options.isPublic);
    }

    if (options?.createdBy) {
      query = query.eq('created_by', options.createdBy);
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      testCaseIds: item.test_case_ids,
      tags: item.tags,
      isPublic: item.is_public,
      category: item.category,
      config: item.config,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      createdBy: item.created_by
    }));
  } catch (error) {
    console.error('Error listing test suites:', error);
    return [];
  }
}

/**
 * Add test cases to a test suite
 *
 * @param testSuiteId The ID of the test suite
 * @param testCaseIds The IDs of the test cases to add
 * @returns The updated test suite
 */
export async function addTestCasesToSuite(
  testSuiteId: string,
  testCaseIds: string[]
): Promise<TestSuite | null> {
  try {
    // Get the current test suite
    const testSuite = await getTestSuite(testSuiteId);

    if (!testSuite) {
      throw new Error('Test suite not found');
    }

    // Add the test cases (avoiding duplicates)
    const currentIds = testSuite.testCaseIds || [];
    const newIds = [...new Set([...currentIds, ...testCaseIds])];

    // Update the test suite
    return updateTestSuite(testSuiteId, {
      testCaseIds: newIds
    });
  } catch (error) {
    console.error('Error adding test cases to suite:', error);
    return null;
  }
}

/**
 * Remove test cases from a test suite
 *
 * @param testSuiteId The ID of the test suite
 * @param testCaseIds The IDs of the test cases to remove
 * @returns The updated test suite
 */
export async function removeTestCasesFromSuite(
  testSuiteId: string,
  testCaseIds: string[]
): Promise<TestSuite | null> {
  try {
    // Get the current test suite
    const testSuite = await getTestSuite(testSuiteId);

    if (!testSuite) {
      throw new Error('Test suite not found');
    }

    // Remove the test cases
    const currentIds = testSuite.testCaseIds || [];
    const newIds = currentIds.filter(id => !testCaseIds.includes(id));

    // Update the test suite
    return updateTestSuite(testSuiteId, {
      testCaseIds: newIds
    });
  } catch (error) {
    console.error('Error removing test cases from suite:', error);
    return null;
  }
}

/**
 * List test runs for an agent
 *
 * @param agentId The ID of the agent
 * @param options Optional filtering options
 * @returns Array of test runs
 */
export async function listTestRuns(agentId: string, options?: {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  limit?: number;
  offset?: number;
}): Promise<TestRun[]> {
  try {
    const supabase = createBrowserSupabaseClient();

    let query = supabase
      .from('test_runs')
      .select('*')
      .eq('agent_id', agentId);

    // Apply filters
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      agentId: item.agent_id,
      testSuiteId: item.test_suite_id,
      testCaseIds: item.test_case_ids,
      config: item.config,
      status: item.status,
      progress: item.progress,
      startTime: item.start_time,
      endTime: item.end_time,
      results: item.results,
      summary: item.summary,
      logs: item.logs,
      createdAt: item.created_at,
      createdBy: item.created_by,
      scheduledBy: item.scheduled_by,
      scheduledAt: item.scheduled_at
    }));
  } catch (error) {
    console.error('Error listing test runs:', error);
    return [];
  }
}
