'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { getAgentById } from '@/app/lib/db/agentStorage';
import { getAgentVersionHistory, revertAgentToVersion } from '@/app/lib/services/agentEvolution';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';

export default function AgentVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const agentId = params.id as string;
  
  // State for agent and versions
  const [agent, setAgent] = useState<any | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for version comparison
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  
  // Load agent and version history
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load agent
        const agentData = await getAgentById(agentId);
        if (!agentData) {
          setError('Agent not found');
          return;
        }
        setAgent(agentData);
        
        // Load version history
        const versionsData = await getAgentVersionHistory(agentId);
        setVersions(versionsData);
        
        if (versionsData.length > 0) {
          setSelectedVersion(versionsData[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load agent data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (agentId) {
      loadData();
    }
  }, [agentId]);
  
  // Handle version selection
  const handleVersionSelect = (version: any) => {
    setSelectedVersion(version);
  };
  
  // Handle revert to version
  const handleRevertToVersion = async () => {
    if (!selectedVersion) {
      return;
    }
    
    setIsReverting(true);
    setError(null);
    
    try {
      const result = await revertAgentToVersion(agentId, selectedVersion.version);
      
      if (result.success) {
        showNotification({
          id: 'revert-success',
          title: 'Revert Successful',
          message: `Agent has been reverted to version ${selectedVersion.version}`,
          type: 'success'
        });
        
        // Reload agent data
        const agentData = await getAgentById(agentId);
        setAgent(agentData);
      } else {
        setError(result.error || 'Failed to revert to version');
        showNotification({
          id: 'revert-error',
          title: 'Revert Failed',
          message: result.error || 'An error occurred during reversion',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error reverting to version:', error);
      setError('An unexpected error occurred');
      showNotification({
        id: 'revert-error',
        title: 'Revert Failed',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsReverting(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Find differences between versions
  const findDifferences = (currentVersion: any, previousVersion: any) => {
    if (!previousVersion) {
      return { personality: [], capabilities: [] };
    }
    
    const differences = {
      personality: findObjectDifferences(currentVersion.personality, previousVersion.personality),
      capabilities: findObjectDifferences(currentVersion.capabilities, previousVersion.capabilities)
    };
    
    return differences;
  };
  
  // Find differences between objects
  const findObjectDifferences = (obj1: any, obj2: any, path = '') => {
    if (!obj1 || !obj2) {
      return [{ path: path || 'root', current: obj1, previous: obj2 }];
    }
    
    const differences: any[] = [];
    
    // Get all unique keys
    const allKeys = new Set([
      ...Object.keys(obj1),
      ...Object.keys(obj2)
    ]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // If key exists in both objects
      if (key in obj1 && key in obj2) {
        const val1 = obj1[key];
        const val2 = obj2[key];
        
        // If both values are objects, recursively find differences
        if (
          typeof val1 === 'object' && val1 !== null && !Array.isArray(val1) &&
          typeof val2 === 'object' && val2 !== null && !Array.isArray(val2)
        ) {
          differences.push(...findObjectDifferences(val1, val2, currentPath));
        }
        // If values are different
        else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          differences.push({
            path: currentPath,
            current: val1,
            previous: val2
          });
        }
      }
      // If key exists only in obj1
      else if (key in obj1) {
        differences.push({
          path: currentPath,
          current: obj1[key],
          previous: undefined
        });
      }
      // If key exists only in obj2
      else {
        differences.push({
          path: currentPath,
          current: undefined,
          previous: obj2[key]
        });
      }
    }
    
    return differences;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Agent Version History</h1>
          <Link href={`/agent-forge/${agentId}`}>
            <Button variant="outline">Back to Agent</Button>
          </Link>
        </div>
        
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Version History</h1>
          <p className="mt-2 text-lg text-gray-600">
            {agent?.name} ({agent?.archetype || 'No archetype'})
          </p>
        </div>
        <div>
          <Link href={`/agent-forge/${agentId}`}>
            <Button variant="outline">Back to Agent</Button>
          </Link>
        </div>
      </div>
      
      {versions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-gray-500">No version history available for this agent.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Versions</CardTitle>
                <CardDescription>
                  Select a version to view details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedVersion?.id === version.id ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'
                      }`}
                      onClick={() => handleVersionSelect(version)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Version {version.version}</div>
                        <div className="text-xs text-gray-500">{formatDate(version.created_at)}</div>
                      </div>
                      {version.version === agent?.version && (
                        <div className="text-xs text-indigo-600 mt-1">Current Version</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            {selectedVersion && (
              <Card>
                <CardHeader>
                  <CardTitle>Version {selectedVersion.version} Details</CardTitle>
                  <CardDescription>
                    Created on {formatDate(selectedVersion.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedVersion.version !== agent?.version && (
                      <div className="bg-yellow-50 p-4 rounded-md">
                        <p className="text-yellow-700">
                          This is not the current version of the agent. You can revert to this version if needed.
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-medium">Changes from Previous Version</h3>
                      {versions.length > 1 && selectedVersion.version > 1 ? (
                        <div className="mt-2 space-y-4">
                          {(() => {
                            // Find the previous version
                            const previousVersion = versions.find(v => v.version === selectedVersion.version - 1);
                            const differences = findDifferences(selectedVersion, previousVersion);
                            
                            if (
                              differences.personality.length === 0 &&
                              differences.capabilities.length === 0
                            ) {
                              return (
                                <p className="text-gray-500">No significant changes detected.</p>
                              );
                            }
                            
                            return (
                              <>
                                {differences.personality.length > 0 && (
                                  <div>
                                    <h4 className="text-md font-medium">Personality Changes</h4>
                                    <div className="mt-1 space-y-2">
                                      {differences.personality.map((diff: any, index: number) => (
                                        <div key={index} className="p-2 bg-gray-50 rounded-md">
                                          <div className="text-sm font-medium">{diff.path}</div>
                                          <div className="grid grid-cols-2 gap-2 mt-1">
                                            <div>
                                              <div className="text-xs text-gray-500">Current</div>
                                              <div className="text-sm">
                                                {typeof diff.current === 'object'
                                                  ? JSON.stringify(diff.current)
                                                  : String(diff.current)}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500">Previous</div>
                                              <div className="text-sm">
                                                {typeof diff.previous === 'object'
                                                  ? JSON.stringify(diff.previous)
                                                  : String(diff.previous)}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {differences.capabilities.length > 0 && (
                                  <div>
                                    <h4 className="text-md font-medium">Capabilities Changes</h4>
                                    <div className="mt-1 space-y-2">
                                      {differences.capabilities.map((diff: any, index: number) => (
                                        <div key={index} className="p-2 bg-gray-50 rounded-md">
                                          <div className="text-sm font-medium">{diff.path}</div>
                                          <div className="grid grid-cols-2 gap-2 mt-1">
                                            <div>
                                              <div className="text-xs text-gray-500">Current</div>
                                              <div className="text-sm">
                                                {typeof diff.current === 'object'
                                                  ? JSON.stringify(diff.current)
                                                  : String(diff.current)}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500">Previous</div>
                                              <div className="text-sm">
                                                {typeof diff.previous === 'object'
                                                  ? JSON.stringify(diff.previous)
                                                  : String(diff.previous)}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-2">
                          {selectedVersion.version === 1
                            ? 'This is the initial version of the agent.'
                            : 'Previous version data not available.'}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-medium">Personality</h3>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md max-h-[300px] overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(selectedVersion.personality, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium">Capabilities</h3>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md max-h-[300px] overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(selectedVersion.capabilities, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                {selectedVersion.version !== agent?.version && (
                  <CardFooter>
                    <Button
                      onClick={handleRevertToVersion}
                      disabled={isReverting}
                      className="w-full"
                    >
                      {isReverting ? 'Reverting...' : `Revert to Version ${selectedVersion.version}`}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
