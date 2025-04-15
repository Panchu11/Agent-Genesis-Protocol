'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/common/Button';
import { useNotification } from '@/app/context/NotificationContext';
import { submitAgentReview } from '@/app/lib/services/marketplace';

interface EnhancedReviewFormProps {
  agentId: string;
  onReviewSubmitted: () => void;
}

export default function EnhancedReviewForm({ agentId, onReviewSubmitted }: EnhancedReviewFormProps) {
  const { showNotification } = useNotification();
  
  // State for review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Additional feedback fields
  const [usability, setUsability] = useState(5);
  const [accuracy, setAccuracy] = useState(5);
  const [creativity, setCreativity] = useState(5);
  const [helpfulness, setHelpfulness] = useState(5);
  const [useCase, setUseCase] = useState('');
  const [improvements, setImprovements] = useState('');
  
  // Handle review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      showNotification({
        id: 'review-error',
        title: 'Review Error',
        message: 'Please enter a comment for your review',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare enhanced review data
      const enhancedComment = `
${comment}

Detailed Ratings:
- Usability: ${usability}/5
- Accuracy: ${accuracy}/5
- Creativity: ${creativity}/5
- Helpfulness: ${helpfulness}/5

${useCase ? `Use Case: ${useCase}` : ''}
${improvements ? `Suggested Improvements: ${improvements}` : ''}
`.trim();
      
      const result = await submitAgentReview(agentId, rating, enhancedComment);
      
      if (result.success) {
        showNotification({
          id: 'review-success',
          title: 'Review Submitted',
          message: 'Your detailed review has been submitted successfully. Thank you for your feedback!',
          type: 'success'
        });
        
        // Reset form
        setComment('');
        setRating(5);
        setUsability(5);
        setAccuracy(5);
        setCreativity(5);
        setHelpfulness(5);
        setUseCase('');
        setImprovements('');
        
        // Notify parent component
        onReviewSubmitted();
      } else {
        showNotification({
          id: 'review-error',
          title: 'Review Error',
          message: result.error || 'Failed to submit review',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showNotification({
        id: 'review-error',
        title: 'Review Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render star rating component
  const renderStarRating = (
    value: number,
    onChange: (value: number) => void,
    name: string
  ) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={`${name}-${star}`}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
          aria-label={`Rate ${star} out of 5`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 ${
              star <= value
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
  
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-medium mb-4">Write a Detailed Review</h3>
      <form onSubmit={handleSubmitReview} className="space-y-6">
        <div>
          <label htmlFor="overall-rating" className="block text-sm font-medium text-gray-700">
            Overall Rating
          </label>
          <div className="mt-1 flex items-center">
            {renderStarRating(rating, setRating, 'overall')}
          </div>
        </div>
        
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Review Comment
          </label>
          <div className="mt-1">
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Share your experience with this agent..."
            />
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-md font-medium mb-4">Detailed Ratings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="usability" className="block text-sm font-medium text-gray-700">
                Usability
              </label>
              <div className="mt-1 flex items-center">
                {renderStarRating(usability, setUsability, 'usability')}
              </div>
            </div>
            
            <div>
              <label htmlFor="accuracy" className="block text-sm font-medium text-gray-700">
                Accuracy
              </label>
              <div className="mt-1 flex items-center">
                {renderStarRating(accuracy, setAccuracy, 'accuracy')}
              </div>
            </div>
            
            <div>
              <label htmlFor="creativity" className="block text-sm font-medium text-gray-700">
                Creativity
              </label>
              <div className="mt-1 flex items-center">
                {renderStarRating(creativity, setCreativity, 'creativity')}
              </div>
            </div>
            
            <div>
              <label htmlFor="helpfulness" className="block text-sm font-medium text-gray-700">
                Helpfulness
              </label>
              <div className="mt-1 flex items-center">
                {renderStarRating(helpfulness, setHelpfulness, 'helpfulness')}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="use-case" className="block text-sm font-medium text-gray-700">
            How did you use this agent? (Optional)
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="use-case"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe your use case..."
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="improvements" className="block text-sm font-medium text-gray-700">
            Suggested Improvements (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="improvements"
              rows={3}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What could be improved about this agent?"
            />
          </div>
        </div>
        
        <div>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Detailed Review'}
          </Button>
        </div>
      </form>
    </div>
  );
}
