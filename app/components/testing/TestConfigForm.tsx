'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Input } from '@/app/components/common/Input';
import { Label } from '@/app/components/common/Label';
import { Textarea } from '@/app/components/common/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { Switch } from '@/app/components/common/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/common/Tabs';
import { Badge } from '@/app/components/common/Badge';
import { 
  TestCase, 
  TestCaseType, 
  TestCasePriority, 
  ValidationRule,
  TestParameter,
  createTestCase,
  updateTestCase,
  getTestCase
} from '@/app/lib/services/agentTesting';
import { 
  getTemplatesByCategory, 
  TemplateCategory, 
  createTestCaseFromTemplate 
} from '@/app/lib/services/testTemplates';
import { useNotification } from '@/app/context/NotificationContext';
import { PlusCircle, Trash2, Save, Copy, AlertTriangle } from 'lucide-react';

interface TestConfigFormProps {
  testCaseId?: string;
  onSave?: (testCase: TestCase) => void;
  onCancel?: () => void;
}

export default function TestConfigForm({ testCaseId, onSave, onCancel }: TestConfigFormProps) {
  const { showNotification } = useNotification();
  
  // State for form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TestCaseType>('functional');
  const [priority, setPriority] = useState<TestCasePriority>('medium');
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [expectedOutputs, setExpectedOutputs] = useState<Record<string, any>>({});
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [parameters, setParameters] = useState<TestParameter[]>([]);
  const [timeout, setTimeout] = useState<number>(10000);
  const [retryCount, setRetryCount] = useState<number>(1);
  const [tags, setTags] = useState<string[]>([]);
  const [isTemplate, setIsTemplate] = useState<boolean>(false);
  
  // State for template selection
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<TemplateCategory>('functional');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // State for form mode
  const [isEditing, setIsEditing] = useState<boolean>(!!testCaseId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  
  // State for tag input
  const [tagInput, setTagInput] = useState<string>('');
  
  // State for validation rule form
  const [newRule, setNewRule] = useState<Partial<ValidationRule>>({
    type: 'contains',
    target: '',
    value: ''
  });
  
  // State for parameter form
  const [newParameter, setNewParameter] = useState<Partial<TestParameter>>({
    name: '',
    type: 'string',
    required: true
  });
  
  // Load test case if editing
  useEffect(() => {
    if (testCaseId) {
      loadTestCase(testCaseId);
    }
  }, [testCaseId]);
  
  // Load templates when category changes
  useEffect(() => {
    const categoryTemplates = getTemplatesByCategory(selectedTemplateCategory);
    setTemplates(categoryTemplates);
  }, [selectedTemplateCategory]);
  
  // Load test case
  const loadTestCase = async (id: string) => {
    setIsLoading(true);
    
    try {
      const testCase = await getTestCase(id);
      
      if (testCase) {
        setName(testCase.name);
        setDescription(testCase.description || '');
        setType(testCase.type);
        setPriority(testCase.priority);
        setInputs(testCase.inputs);
        setExpectedOutputs(testCase.expectedOutputs);
        setValidationRules(testCase.validationRules || []);
        setParameters(testCase.parameters || []);
        setTimeout(testCase.timeout || 10000);
        setRetryCount(testCase.retryCount || 1);
        setTags(testCase.tags || []);
        setIsTemplate(testCase.isTemplate || false);
      } else {
        showNotification({
          id: 'test-case-load-error',
          title: 'Error',
          message: 'Failed to load test case',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading test case:', error);
      showNotification({
        id: 'test-case-load-error',
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    
    const template = templates.find(t => t.name === templateName);
    
    if (template) {
      setName(`${template.name} (Copy)`);
      setDescription(template.description || '');
      setType(template.type);
      setPriority(template.priority);
      setInputs({ ...template.inputs });
      setExpectedOutputs({ ...template.expectedOutputs });
      setValidationRules(template.validationRules ? [...template.validationRules] : []);
      setParameters(template.parameters ? [...template.parameters] : []);
      setTimeout(template.timeout || 10000);
      setRetryCount(template.retryCount || 1);
      setTags(template.tags ? [...template.tags] : []);
      setIsTemplate(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      // Validate form
      if (!name.trim()) {
        showNotification({
          id: 'test-case-validation-error',
          title: 'Validation Error',
          message: 'Please enter a name for the test case',
          type: 'error'
        });
        setIsLoading(false);
        return;
      }
      
      // Create or update test case
      const testCaseData = {
        name,
        description,
        type,
        priority,
        inputs,
        expectedOutputs,
        validationRules,
        parameters,
        timeout,
        retryCount,
        tags,
        isTemplate
      };
      
      let result: TestCase | null;
      
      if (isEditing && testCaseId) {
        // Update existing test case
        result = await updateTestCase(testCaseId, testCaseData);
        
        if (result) {
          showNotification({
            id: 'test-case-update-success',
            title: 'Success',
            message: 'Test case updated successfully',
            type: 'success'
          });
        } else {
          throw new Error('Failed to update test case');
        }
      } else {
        // Create new test case
        result = await createTestCase(testCaseData);
        
        if (result) {
          showNotification({
            id: 'test-case-create-success',
            title: 'Success',
            message: 'Test case created successfully',
            type: 'success'
          });
        } else {
          throw new Error('Failed to create test case');
        }
      }
      
      // Call onSave callback
      if (onSave && result) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving test case:', error);
      showNotification({
        id: 'test-case-save-error',
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  // Handle adding a validation rule
  const handleAddValidationRule = () => {
    if (newRule.target && newRule.type) {
      setValidationRules([...validationRules, newRule as ValidationRule]);
      setNewRule({
        type: 'contains',
        target: '',
        value: ''
      });
    }
  };
  
  // Handle removing a validation rule
  const handleRemoveValidationRule = (index: number) => {
    setValidationRules(validationRules.filter((_, i) => i !== index));
  };
  
  // Handle adding a parameter
  const handleAddParameter = () => {
    if (newParameter.name && newParameter.type) {
      setParameters([...parameters, newParameter as TestParameter]);
      setNewParameter({
        name: '',
        type: 'string',
        required: true
      });
    }
  };
  
  // Handle removing a parameter
  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };
  
  // Handle input change
  const handleInputChange = (key: string, value: any) => {
    setInputs({
      ...inputs,
      [key]: value
    });
  };
  
  // Handle expected output change
  const handleExpectedOutputChange = (key: string, value: any) => {
    setExpectedOutputs({
      ...expectedOutputs,
      [key]: value
    });
  };
  
  // Handle adding an input field
  const handleAddInput = () => {
    const key = `input_${Object.keys(inputs).length + 1}`;
    handleInputChange(key, '');
  };
  
  // Handle removing an input field
  const handleRemoveInput = (key: string) => {
    const newInputs = { ...inputs };
    delete newInputs[key];
    setInputs(newInputs);
  };
  
  // Handle adding an expected output field
  const handleAddExpectedOutput = () => {
    const key = `output_${Object.keys(expectedOutputs).length + 1}`;
    handleExpectedOutputChange(key, '');
  };
  
  // Handle removing an expected output field
  const handleRemoveExpectedOutput = (key: string) => {
    const newExpectedOutputs = { ...expectedOutputs };
    delete newExpectedOutputs[key];
    setExpectedOutputs(newExpectedOutputs);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Test Case' : 'Create Test Case'}</CardTitle>
          <CardDescription>
            Configure a test case to evaluate your agent's performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="template">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Category</Label>
                  <Select value={selectedTemplateCategory} onValueChange={(value) => setSelectedTemplateCategory(value as TemplateCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="prompt">Prompt Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTemplate && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Template Description</h3>
                    <p className="text-sm text-gray-600">
                      {templates.find(t => t.name === selectedTemplate)?.description || 'No description available'}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    disabled={!selectedTemplate}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="basic">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter test case name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter test case description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value) => setType(value as TestCaseType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="functional">Functional</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="prompt">Prompt Engineering</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as TestCasePriority)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={timeout}
                      onChange={(e) => setTimeout(parseInt(e.target.value))}
                      min={1000}
                      step={1000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="retryCount">Retry Count</Label>
                    <Input
                      id="retryCount"
                      type="number"
                      value={retryCount}
                      onChange={(e) => setRetryCount(parseInt(e.target.value))}
                      min={0}
                      max={5}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isTemplate"
                    checked={isTemplate}
                    onCheckedChange={setIsTemplate}
                  />
                  <Label htmlFor="isTemplate">Save as template</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('template')}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('inputs')}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="inputs">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Test Inputs</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInput}
                    className="flex items-center space-x-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Input</span>
                  </Button>
                </div>
                
                {Object.keys(inputs).length === 0 ? (
                  <div className="text-center py-4 border rounded-md">
                    <p className="text-gray-500">No inputs defined</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddInput}
                      className="mt-2"
                    >
                      Add Input
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(inputs).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <div className="flex-grow space-y-2">
                          <Label htmlFor={`input-${key}`}>{key}</Label>
                          <Textarea
                            id={`input-${key}`}
                            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            onChange={(e) => {
                              try {
                                // Try to parse as JSON
                                const parsed = JSON.parse(e.target.value);
                                handleInputChange(key, parsed);
                              } catch {
                                // If not valid JSON, store as string
                                handleInputChange(key, e.target.value);
                              }
                            }}
                            rows={3}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInput(key)}
                          className="h-9 w-9 p-0 mt-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('basic')}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('outputs')}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="outputs">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Expected Outputs</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddExpectedOutput}
                    className="flex items-center space-x-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Output</span>
                  </Button>
                </div>
                
                {Object.keys(expectedOutputs).length === 0 ? (
                  <div className="text-center py-4 border rounded-md">
                    <p className="text-gray-500">No expected outputs defined</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddExpectedOutput}
                      className="mt-2"
                    >
                      Add Expected Output
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(expectedOutputs).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <div className="flex-grow space-y-2">
                          <Label htmlFor={`output-${key}`}>{key}</Label>
                          <Textarea
                            id={`output-${key}`}
                            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            onChange={(e) => {
                              try {
                                // Try to parse as JSON
                                const parsed = JSON.parse(e.target.value);
                                handleExpectedOutputChange(key, parsed);
                              } catch {
                                // If not valid JSON, store as string
                                handleExpectedOutputChange(key, e.target.value);
                              }
                            }}
                            rows={3}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExpectedOutput(key)}
                          className="h-9 w-9 p-0 mt-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('inputs')}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('validation')}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="validation">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Validation Rules</h3>
                  <div className="flex items-center space-x-2">
                    <Select value={newRule.type as string} onValueChange={(value) => setNewRule({ ...newRule, type: value as any })}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact_match">Exact Match</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                        <SelectItem value="json_path">JSON Path</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Target field"
                      value={newRule.target || ''}
                      onChange={(e) => setNewRule({ ...newRule, target: e.target.value })}
                      className="w-[150px]"
                    />
                    
                    <Input
                      placeholder="Expected value"
                      value={newRule.value !== undefined ? String(newRule.value) : ''}
                      onChange={(e) => {
                        try {
                          // Try to parse as JSON
                          const parsed = JSON.parse(e.target.value);
                          setNewRule({ ...newRule, value: parsed });
                        } catch {
                          // If not valid JSON, store as string
                          setNewRule({ ...newRule, value: e.target.value });
                        }
                      }}
                      className="w-[150px]"
                    />
                    
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddValidationRule}
                      disabled={!newRule.target || !newRule.type}
                    >
                      Add Rule
                    </Button>
                  </div>
                </div>
                
                {validationRules.length === 0 ? (
                  <div className="text-center py-4 border rounded-md">
                    <p className="text-gray-500">No validation rules defined</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Validation rules determine whether a test passes or fails
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validationRules.map((rule, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{rule.type}</Badge>
                            <span className="font-medium">{rule.target}</span>
                            <span>{typeof rule.value === 'object' ? JSON.stringify(rule.value) : String(rule.value)}</span>
                          </div>
                          {rule.message && (
                            <p className="text-sm text-gray-500 mt-1">{rule.message}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveValidationRule(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {validationRules.length === 0 && (
                  <div className="flex items-center p-4 bg-yellow-50 text-yellow-800 rounded-md">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      Without validation rules, the test will always pass if the agent responds.
                      Consider adding at least one rule to validate the response.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('outputs')}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : (isEditing ? 'Update Test Case' : 'Create Test Case')}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || activeTab !== 'validation'}
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Test Case' : 'Create Test Case')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
