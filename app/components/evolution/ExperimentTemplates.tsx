'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Badge } from '@/app/components/common/Badge';
import { useRouter } from 'next/navigation';

export interface ExperimentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: 'short' | 'medium' | 'long';
  metrics: string[];
  tasks: string[];
  config: Record<string, any>;
  icon?: string;
}

interface ExperimentTemplatesProps {
  templates: ExperimentTemplate[];
  onSelectTemplate: (template: ExperimentTemplate) => void;
}

export default function ExperimentTemplates({ 
  templates, 
  onSelectTemplate 
}: ExperimentTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const router = useRouter();
  
  // Get all unique categories
  const categories = Array.from(new Set(templates.map(t => t.category))).sort();
  
  // Filter templates based on selected filters
  const filteredTemplates = templates.filter(template => {
    // Filter by category
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }
    
    // Filter by difficulty
    if (selectedDifficulty && template.difficulty !== selectedDifficulty) {
      return false;
    }
    
    // Filter by duration
    if (selectedDuration && template.duration !== selectedDuration) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.metrics.some(m => m.toLowerCase().includes(query)) ||
        template.tasks.some(t => t.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get duration badge color
  const getDurationColor = (duration: string) => {
    switch (duration) {
      case 'short':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-purple-100 text-purple-800';
      case 'long':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle template selection
  const handleSelectTemplate = (template: ExperimentTemplate) => {
    onSelectTemplate(template);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setSelectedDuration(null);
    setSearchQuery('');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          
          <select
            value={selectedDuration || ''}
            onChange={(e) => setSelectedDuration(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Durations</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
          
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your filters or search query
          </p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.category}</CardDescription>
                  </div>
                  {template.icon && (
                    <div className="text-2xl">{template.icon}</div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                  <Badge className={getDurationColor(template.duration)}>
                    {template.duration}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.metrics.map((metric, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {template.tasks.slice(0, 3).map((task, index) => (
                        <li key={index}>{task}</li>
                      ))}
                      {template.tasks.length > 3 && (
                        <li className="text-gray-500">+{template.tasks.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectTemplate(template)}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
