'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { useNotification } from '@/app/context/NotificationContext';
import { acquireMarketplaceAgent, getAgentReviews, getMarketplaceAgent, MarketplaceAgent, MarketplaceReview, submitAgentReview } from '@/app/lib/services/marketplace';

export default function MarketplaceAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const agentId = params.id as string;
  
  // State for agent and reviews
  const [agent, setAgent] = useState<MarketplaceAgent | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // State for review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // State for acquisition
  const [isAcquiring, setIsAcquiring] = useState(false);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'reviews'>('overview');
  
  // Load agent and reviews
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if user is authenticated
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push(`/auth/login?redirectedFrom=/marketplace/${agentId}`);
          return;
        }
        
        setUserId(user.id);
        
        // Load agent
        const agentData = await getMarketplaceAgent(agentId);
        if (!agentData) {
          setError('Agent not found');
          return;
        }
        setAgent(agentData);
        
        // Load reviews
        const { reviews: reviewsData, total } = await getAgentReviews(agentId);
        setReviews(reviewsData);
        setTotalReviews(total);
      } catch (err) {
        console.error('Error loading agent data:', err);
        setError('Failed to load agent data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (agentId) {
      loadData();
    }
  }, [agentId, router]);
  
  // Handle tab change
  const handleTabChange = (tab: 'overview' | 'capabilities' | 'reviews') => {
    setActiveTab(tab);
  };
  
  // Handle review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewComment.trim()) {
      showNotification({
        id: 'review-error',
        title: 'Review Error',
        message: 'Please enter a comment for your review',
        type: 'error'
      });
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      const result = await submitAgentReview(agentId, reviewRating, reviewComment);
      
      if (result.success) {
        showNotification({
          id: 'review-success',
          title: 'Review Submitted',
          message: 'Your review has been submitted successfully',
          type: 'success'
        });
        
        // Reset form
        setReviewComment('');
        
        // Reload reviews
        const { reviews: reviewsData, total } = await getAgentReviews(agentId);
        setReviews(reviewsData);
        setTotalReviews(total);
        
        // Reload agent to update rating
        const agentData = await getMarketplaceAgent(agentId);
        if (agentData) {
          setAgent(agentData);
        }
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
      setIsSubmittingReview(false);
    }
  };
  
  // Handle agent acquisition
  const handleAcquireAgent = async () => {
    setIsAcquiring(true);
    
    try {
      const result = await acquireMarketplaceAgent(agentId);
      
      if (result.success) {
        showNotification({
          id: 'acquire-success',
          title: 'Agent Acquired',
          message: 'The agent has been added to your collection',
          type: 'success'
        });
        
        // Redirect to the agent page
        if (result.agentId) {
          router.push(`/agent-forge/${result.agentId}`);
        } else {
          router.push('/agent-forge');
        }
      } else {
        showNotification({
          id: 'acquire-error',
          title: 'Acquisition Error',
          message: result.error || 'Failed to acquire agent',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error acquiring agent:', err);
      showNotification({
        id: 'acquire-error',
        title: 'Acquisition Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsAcquiring(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading agent details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !agent) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Agent Details</h1>
          <Link href="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
        
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error || 'Agent not found'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/marketplace" className="text-indigo-600 hover:text-indigo-800 flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Marketplace
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {agent.archetype || 'General Purpose Agent'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'overview'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'capabilities'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange('capabilities')}
                  >
                    Capabilities
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'reviews'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange('reviews')}
                  >
                    Reviews ({totalReviews})
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Description</h3>
                    <p className="mt-2 text-gray-600 whitespace-pre-line">
                      {agent.description}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Categories</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {agent.categories.map((category) => (
                        <Link
                          key={category}
                          href={`/marketplace?category=${category}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                        >
                          {category}
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Author</h3>
                    <div className="mt-2 flex items-center space-x-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                        {agent.author.avatar_url ? (
                          <Image
                            src={agent.author.avatar_url}
                            alt={agent.author.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-sm font-bold">
                            {agent.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{agent.author.name}</div>
                        <div className="text-sm text-gray-500">
                          Published on {formatDate(agent.published_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'capabilities' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Personality</h3>
                    <div className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto max-h-[300px]">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(agent.personality, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Capabilities</h3>
                    <div className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto max-h-[300px]">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(agent.capabilities, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Customer Reviews</h3>
                    <div className="mt-2 flex items-center">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${
                              i < Math.round(agent.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="ml-2 text-sm text-gray-700">
                        {agent.rating.toFixed(1)} out of 5 ({agent.reviews_count} reviews)
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Write a Review</h3>
                    <form onSubmit={handleSubmitReview}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                            Rating
                          </label>
                          <div className="mt-1 flex items-center">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setReviewRating(rating)}
                                className="focus:outline-none"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-6 w-6 ${
                                    rating <= reviewRating
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
                        </div>
                        
                        <div>
                          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                            Comment
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="comment"
                              rows={4}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Share your experience with this agent..."
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Button
                            type="submit"
                            disabled={isSubmittingReview}
                          >
                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Customer Reviews</h3>
                    {reviews.length === 0 ? (
                      <p className="text-gray-500">No reviews yet. Be the first to review this agent!</p>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                                  {review.user_avatar ? (
                                    <Image
                                      src={review.user_avatar}
                                      alt={review.user_name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                                      {review.user_name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{review.user_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(review.created_at)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <svg
                                    key={i}
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 text-gray-600">
                              {review.comment}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="text-2xl font-bold">{formatPrice(agent.price)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Rating</div>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${
                            i < Math.round(agent.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {agent.rating.toFixed(1)} ({agent.reviews_count})
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Downloads</div>
                  <div className="font-medium">{agent.downloads}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Published</div>
                  <div className="font-medium">{formatDate(agent.published_at)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Version</div>
                  <div className="font-medium">{agent.version}</div>
                </div>
                
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={handleAcquireAgent}
                    disabled={isAcquiring || agent.user_id === userId}
                  >
                    {isAcquiring ? 'Processing...' : agent.price > 0 ? `Buy for ${formatPrice(agent.price)}` : 'Get for Free'}
                  </Button>
                  
                  {agent.user_id === userId && (
                    <p className="mt-2 text-sm text-gray-500 text-center">
                      You are the author of this agent
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Similar Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-4">
                  Similar agents feature coming soon
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
