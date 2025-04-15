'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Input } from '@/app/components/common/Input';
import { Label } from '@/app/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/common/Select';
import { Switch } from '@/app/components/common/Switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/common/Dialog';
import { Badge } from '@/app/components/common/Badge';
import { 
  listTestCases,
  listTestSuites,
  TestCase,
  TestSuite
} from '@/app/lib/services/agentTesting';
import { useNotification } from '@/app/context/NotificationContext';
import { Calendar, Clock, Trash2, Plus, AlarmClock, CalendarClock } from 'lucide-react';

// Mock function for scheduling tests (to be implemented with real backend)
const scheduleTest = async (schedule: any) => {
  // This would be replaced with a real API call
  console.log('Scheduling test:', schedule);
  return {
    id: `schedule-${Date.now()}`,
    ...schedule,
    createdAt: new Date().toISOString()
  };
};

// Mock function for getting scheduled tests (to be implemented with real backend)
const getScheduledTests = async (agentId: string) => {
  // This would be replaced with a real API call
  return [];
};

interface TestSchedulerProps {
  agentId: string;
}

export default function TestScheduler({ agentId }: TestSchedulerProps) {
  const { showNotification } = useNotification();
  
  // State for test cases and suites
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // State for scheduled tests
  const [scheduledTests, setScheduledTests] = useState<any[]>([]);
  
  // State for schedule dialog
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [scheduleType, setScheduleType] = useState<'test_case' | 'test_suite'>('test_case');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [notifyOnFailure, setNotifyOnFailure] = useState<boolean>(true);
  
  // Load test cases and suites
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Load test cases
        const testCasesData = await listTestCases();
        setTestCases(testCasesData);
        
        // Load test suites
        const testSuitesData = await listTestSuites();
        setTestSuites(testSuitesData);
        
        // Load scheduled tests
        const scheduledTestsData = await getScheduledTests(agentId);
        setScheduledTests(scheduledTestsData);
      } catch (error) {
        console.error('Error loading data:', error);
        showNotification({
          id: 'load-error',
          title: 'Error',
          message: 'Failed to load test data',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [agentId]);
  
  // Handle dialog open
  const handleOpenDialog = (type: 'test_case' | 'test_suite') => {
    setScheduleType(type);
    setSelectedItemId('');
    setScheduleFrequency('once');
    
    // Set default date and time (tomorrow at 9 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime('09:00');
    
    setNotifyOnFailure(true);
    setIsDialogOpen(true);
  };
  
  // Handle schedule creation
  const handleCreateSchedule = async () => {
    if (!selectedItemId) {
      showNotification({
        id: 'validation-error',
        title: 'Validation Error',
        message: `Please select a ${scheduleType === 'test_case' ? 'test case' : 'test suite'}`,
        type: 'error'
      });
      return;
    }
    
    if (!scheduleDate || !scheduleTime) {
      showNotification({
        id: 'validation-error',
        title: 'Validation Error',
        message: 'Please select a date and time',
        type: 'error'
      });
      return;
    }
    
    try {
      // Create schedule
      const schedule = {
        agentId,
        type: scheduleType,
        itemId: selectedItemId,
        frequency: scheduleFrequency,
        nextRunDate: `${scheduleDate}T${scheduleTime}:00`,
        notifyOnFailure,
        status: 'scheduled'
      };
      
      const createdSchedule = await scheduleTest(schedule);
      
      // Add to list
      setScheduledTests([createdSchedule, ...scheduledTests]);
      
      // Close dialog
      setIsDialogOpen(false);
      
      // Show notification
      showNotification({
        id: 'schedule-created',
        title: 'Schedule Created',
        message: 'Test schedule created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      showNotification({
        id: 'schedule-error',
        title: 'Error',
        message: 'Failed to create test schedule',
        type: 'error'
      });
    }
  };
  
  // Handle schedule deletion
  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      // Delete schedule (would be a real API call)
      console.log('Deleting schedule:', scheduleId);
      
      // Remove from list
      setScheduledTests(scheduledTests.filter(s => s.id !== scheduleId));
      
      // Show notification
      showNotification({
        id: 'schedule-deleted',
        title: 'Schedule Deleted',
        message: 'Test schedule deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showNotification({
        id: 'delete-error',
        title: 'Error',
        message: 'Failed to delete test schedule',
        type: 'error'
      });
    }
  };
  
  // Format next run date
  const formatNextRunDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get frequency badge
  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case 'once':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Once
          </Badge>
        );
      case 'daily':
        return (
          <Badge className="bg-green-100 text-green-800">
            Daily
          </Badge>
        );
      case 'weekly':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            Weekly
          </Badge>
        );
      case 'monthly':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Monthly
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            {frequency}
          </Badge>
        );
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Scheduler</CardTitle>
            <CardDescription>
              Schedule automated test runs
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleOpenDialog('test_case')}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Test Case</span>
            </Button>
            <Button
              onClick={() => handleOpenDialog('test_suite')}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Test Suite</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading schedules...</p>
          </div>
        ) : scheduledTests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <CalendarClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Scheduled Tests</h3>
            <p className="text-gray-500 mt-2">
              Schedule tests to run automatically at specified times
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleOpenDialog('test_case')}
              >
                Schedule Test Case
              </Button>
              <Button
                onClick={() => handleOpenDialog('test_suite')}
              >
                Schedule Test Suite
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Type</th>
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-left">Frequency</th>
                    <th className="border p-2 text-left">Next Run</th>
                    <th className="border p-2 text-left">Status</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledTests.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="border p-2">
                        {schedule.type === 'test_case' ? 'Test Case' : 'Test Suite'}
                      </td>
                      <td className="border p-2">
                        {schedule.type === 'test_case'
                          ? testCases.find(tc => tc.id === schedule.itemId)?.name || 'Unknown'
                          : testSuites.find(ts => ts.id === schedule.itemId)?.name || 'Unknown'
                        }
                      </td>
                      <td className="border p-2">
                        {getFrequencyBadge(schedule.frequency)}
                      </td>
                      <td className="border p-2">
                        {formatNextRunDate(schedule.nextRunDate)}
                      </td>
                      <td className="border p-2">
                        <Badge className={
                          schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                          schedule.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {schedule.status}
                        </Badge>
                      </td>
                      <td className="border p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Schedule {scheduleType === 'test_case' ? 'Test Case' : 'Test Suite'}
            </DialogTitle>
            <DialogDescription>
              Configure when to run the test automatically
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item">
                {scheduleType === 'test_case' ? 'Test Case' : 'Test Suite'}
              </Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${scheduleType === 'test_case' ? 'test case' : 'test suite'}`} />
                </SelectTrigger>
                <SelectContent>
                  {scheduleType === 'test_case'
                    ? testCases.map(testCase => (
                        <SelectItem key={testCase.id} value={testCase.id}>
                          {testCase.name}
                        </SelectItem>
                      ))
                    : testSuites.map(testSuite => (
                        <SelectItem key={testSuite.id} value={testSuite.id}>
                          {testSuite.name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={scheduleFrequency} onValueChange={(value) => setScheduleFrequency(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Time</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="notify"
                checked={notifyOnFailure}
                onCheckedChange={setNotifyOnFailure}
              />
              <Label htmlFor="notify">Notify on failure</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
