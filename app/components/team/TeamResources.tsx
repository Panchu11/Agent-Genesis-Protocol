'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { TeamResource, TeamResourceType, TeamRole, PermissionLevel, AddTeamResourceRequest } from '@/app/lib/types/team';
import { addTeamResource, removeTeamResource, updateTeamResource } from '@/app/lib/services/teamService';
import { useNotification } from '@/app/context/NotificationContext';

interface TeamResourcesProps {
  teamId: string;
  resources: TeamResource[];
  canManageResources: boolean;
  userResources: {
    agents: { id: string; name: string }[];
    knowledge_bases: { id: string; name: string }[];
    deployments: { id: string; name: string }[];
    marketplace_agents: { id: string; name: string }[];
  };
  onResourceUpdated?: () => void;
}

export default function TeamResources({
  teamId,
  resources,
  canManageResources,
  userResources,
  onResourceUpdated,
}: TeamResourcesProps) {
  const { showNotification } = useNotification();
  
  // State for new resource
  const [resourceType, setResourceType] = useState<TeamResourceType>('agent');
  const [resourceId, setResourceId] = useState('');
  const [permissions, setPermissions] = useState<Record<TeamRole, PermissionLevel>>({
    owner: 'manage',
    admin: 'manage',
    member: 'edit',
    viewer: 'view',
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // State for resource actions
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  // Handle resource addition
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resourceId) {
      showNotification({
        id: 'resource-error',
        title: 'Error',
        message: 'Please select a resource',
        type: 'error',
      });
      return;
    }
    
    setIsAdding(true);
    
    try {
      const resourceData: AddTeamResourceRequest = {
        resource_id: resourceId,
        resource_type: resourceType,
        permissions,
      };
      
      await addTeamResource(teamId, resourceData);
      
      showNotification({
        id: 'resource-added',
        title: 'Resource Added',
        message: 'Resource has been added to the team',
        type: 'success',
      });
      
      // Reset form
      setResourceId('');
      
      if (onResourceUpdated) {
        onResourceUpdated();
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      
      showNotification({
        id: 'resource-error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to add resource',
        type: 'error',
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  // Handle resource removal
  const handleRemoveResource = async (resourceId: string, resourceType: TeamResourceType) => {
    setIsRemoving(resourceId);
    
    try {
      await removeTeamResource(teamId, resourceId, resourceType);
      
      showNotification({
        id: 'resource-removed',
        title: 'Resource Removed',
        message: 'Resource has been removed from the team',
        type: 'success',
      });
      
      if (onResourceUpdated) {
        onResourceUpdated();
      }
    } catch (error) {
      console.error('Error removing resource:', error);
      
      showNotification({
        id: 'resource-error',
        title: 'Error',
        message: 'Failed to remove resource',
        type: 'error',
      });
    } finally {
      setIsRemoving(null);
    }
  };
  
  // Handle permission change
  const handlePermissionChange = (role: TeamRole, permission: PermissionLevel) => {
    setPermissions({
      ...permissions,
      [role]: permission,
    });
  };
  
  // Format resource type for display
  const formatResourceType = (type: TeamResourceType): string => {
    switch (type) {
      case 'agent':
        return 'Agent';
      case 'knowledge_base':
        return 'Knowledge Base';
      case 'deployment':
        return 'Deployment';
      case 'marketplace_agent':
        return 'Marketplace Agent';
      default:
        return type;
    }
  };
  
  // Get resource type badge color
  const getResourceTypeBadgeColor = (type: TeamResourceType): string => {
    switch (type) {
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'knowledge_base':
        return 'bg-green-100 text-green-800';
      case 'deployment':
        return 'bg-purple-100 text-purple-800';
      case 'marketplace_agent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get resource name
  const getResourceName = (resource: TeamResource): string => {
    let resourceList: { id: string; name: string }[] = [];
    
    switch (resource.resource_type) {
      case 'agent':
        resourceList = userResources.agents;
        break;
      case 'knowledge_base':
        resourceList = userResources.knowledge_bases;
        break;
      case 'deployment':
        resourceList = userResources.deployments;
        break;
      case 'marketplace_agent':
        resourceList = userResources.marketplace_agents;
        break;
    }
    
    const foundResource = resourceList.find(r => r.id === resource.resource_id);
    return foundResource ? foundResource.name : 'Unknown Resource';
  };
  
  // Get resource URL
  const getResourceUrl = (resource: TeamResource): string => {
    switch (resource.resource_type) {
      case 'agent':
        return `/agent-forge/${resource.resource_id}`;
      case 'knowledge_base':
        return `/mind-gardens/${resource.resource_id}`;
      case 'deployment':
        return `/agent-forge/deployments/${resource.resource_id}`;
      case 'marketplace_agent':
        return `/marketplace/${resource.resource_id}`;
      default:
        return '#';
    }
  };
  
  return (
    <div className="space-y-6">
      {canManageResources && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Resource</CardTitle>
            <CardDescription>
              Share your resources with the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddResource} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                  </label>
                  <select
                    id="resourceType"
                    value={resourceType}
                    onChange={(e) => {
                      setResourceType(e.target.value as TeamResourceType);
                      setResourceId('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="agent">Agent</option>
                    <option value="knowledge_base">Knowledge Base</option>
                    <option value="deployment">Deployment</option>
                    <option value="marketplace_agent">Marketplace Agent</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-1">
                    Resource
                  </label>
                  <select
                    id="resourceId"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a resource</option>
                    {resourceType === 'agent' && userResources.agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                    {resourceType === 'knowledge_base' && userResources.knowledge_bases.map((kb) => (
                      <option key={kb.id} value={kb.id}>{kb.name}</option>
                    ))}
                    {resourceType === 'deployment' && userResources.deployments.map((deployment) => (
                      <option key={deployment.id} value={deployment.id}>{deployment.name}</option>
                    ))}
                    {resourceType === 'marketplace_agent' && userResources.marketplace_agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Permissions</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-5 gap-2 text-sm font-medium text-gray-700 mb-2">
                    <div>Role</div>
                    <div className="col-span-4">Access Level</div>
                  </div>
                  
                  <div className="space-y-3">
                    {(['owner', 'admin', 'member', 'viewer'] as TeamRole[]).map((role) => (
                      <div key={role} className="grid grid-cols-5 gap-2 items-center">
                        <div className="text-sm font-medium">{formatResourceType(role)}</div>
                        <div className="col-span-4">
                          <div className="flex space-x-4">
                            {(['manage', 'edit', 'view', 'none'] as PermissionLevel[]).map((permission) => (
                              <label key={permission} className="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`permission-${role}`}
                                  value={permission}
                                  checked={permissions[role] === permission}
                                  onChange={() => handlePermissionChange(role, permission)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  disabled={role === 'owner' || role === 'admin'} // Owner and admin always have manage permissions
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {permission.charAt(0).toUpperCase() + permission.slice(1)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isAdding || !resourceId}>
                  {isAdding ? 'Adding...' : 'Add Resource'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Team Resources</CardTitle>
          <CardDescription>
            Resources shared with the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No resources shared with the team</p>
            ) : (
              <div className="divide-y">
                {resources.map((resource) => (
                  <div key={resource.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResourceTypeBadgeColor(resource.resource_type)}`}>
                            {formatResourceType(resource.resource_type)}
                          </span>
                          <p className="font-medium">{getResourceName(resource)}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Added on {new Date(resource.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link href={getResourceUrl(resource)}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        
                        {canManageResources && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveResource(resource.resource_id, resource.resource_type)}
                            disabled={isRemoving === resource.resource_id}
                          >
                            {isRemoving === resource.resource_id ? 'Removing...' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
