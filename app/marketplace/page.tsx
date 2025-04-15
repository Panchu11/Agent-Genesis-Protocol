'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/app/lib/db/supabase';
import { Button } from '@/app/components/common/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { getFeaturedAgents, getMarketplaceCategories, getMarketplaceStats, MarketplaceAgent, MarketplaceCategory, searchMarketplaceAgents } from '@/app/lib/services/marketplace';

export default function MarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get search parameters
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'popular';
  const pageParam = parseInt(searchParams.get('page') || '1');
  
  // State for marketplace data
  const [featuredAgents, setFeaturedAgents] = useState<MarketplaceAgent[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for search
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'popular' | 'recent' | 'rating' | 'price_asc' | 'price_desc'>(
    sortParam as any || 'popular'
  );
  const [currentPage, setCurrentPage] = useState(pageParam);
  
  // State for search results
  const [searchResults, setSearchResults] = useState<MarketplaceAgent[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Load initial data
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
          router.push('/auth/login?redirectedFrom=/marketplace');
          return;
        }
        
        // Load featured agents
        const featuredData = await getFeaturedAgents();
        setFeaturedAgents(featuredData);
        
        // Load categories
        const categoriesData = await getMarketplaceCategories();
        setCategories(categoriesData);
        
        // Load stats
        const statsData = await getMarketplaceStats();
        setStats(statsData);
        
        // Perform search if query parameters are present
        if (query || categoryParam || sortParam !== 'popular' || pageParam > 1) {
          await performSearch();
        }
      } catch (err) {
        console.error('Error loading marketplace data:', err);
        setError('Failed to load marketplace data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router, query, categoryParam, sortParam, pageParam]);
  
  // Perform search
  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      const { agents, total } = await searchMarketplaceAgents(
        searchQuery,
        {
          categories: selectedCategories,
          min_rating: minRating,
          max_price: maxPrice,
          free_only: freeOnly
        },
        sortOrder,
        currentPage,
        12
      );
      
      setSearchResults(agents);
      setTotalResults(total);
      setSearchPerformed(true);
    } catch (err) {
      console.error('Error searching marketplace:', err);
      setError('Failed to search marketplace');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch();
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategories.length === 1) params.set('category', selectedCategories[0]);
    if (sortOrder !== 'popular') params.set('sort', sortOrder);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = `/marketplace${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };
  
  // Handle sort order change
  const handleSortChange = (sort: 'popular' | 'recent' | 'rating' | 'price_asc' | 'price_desc') => {
    setSortOrder(sort);
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch();
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    
    const newUrl = `/marketplace?${params.toString()}`;
    router.push(newUrl);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };
  
  // Render agent card
  const renderAgentCard = (agent: MarketplaceAgent) => (
    <Card key={agent.id} className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription>
              {agent.archetype || 'General Purpose Agent'}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{agent.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 line-clamp-3">
          {agent.description}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-1">
          {agent.categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {category}
            </span>
          ))}
          {agent.categories.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              +{agent.categories.length - 3} more
            </span>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative h-6 w-6 rounded-full overflow-hidden bg-gray-200">
              {agent.author.avatar_url ? (
                <Image
                  src={agent.author.avatar_url}
                  alt={agent.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                  {agent.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600">{agent.author.name}</span>
          </div>
          <div className="text-sm font-medium">
            {formatPrice(agent.price)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/marketplace/${agent.id}`} className="w-full">
          <Button variant="outline" className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading marketplace...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Marketplace</h1>
          <p className="mt-2 text-lg text-gray-600">
            Discover and acquire pre-built agents for your needs
          </p>
        </div>
        <div>
          <Link href="/marketplace/publish">
            <Button>Publish Your Agent</Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_agents}</div>
                <div className="text-sm text-gray-500">Available Agents</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_downloads}</div>
                <div className="text-sm text-gray-500">Total Downloads</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.featured_agents}</div>
                <div className="text-sm text-gray-500">Featured Agents</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search by name, description, or archetype..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategorySelect(category.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                        {category.name} ({category.agent_count})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Rating</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <input
                        type="radio"
                        id={`rating-${rating}`}
                        name="rating"
                        checked={minRating === rating}
                        onChange={() => setMinRating(rating)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-full"
                      />
                      <label htmlFor={`rating-${rating}`} className="ml-2 text-sm text-gray-700 flex items-center">
                        {Array.from({ length: rating }).map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1">& up</span>
                      </label>
                    </div>
                  ))}
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="rating-any"
                      name="rating"
                      checked={minRating === undefined}
                      onChange={() => setMinRating(undefined)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-full"
                    />
                    <label htmlFor="rating-any" className="ml-2 text-sm text-gray-700">
                      Any rating
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Price</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="free-only"
                      checked={freeOnly}
                      onChange={(e) => setFreeOnly(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="free-only" className="ml-2 text-sm text-gray-700">
                      Free agents only
                    </label>
                  </div>
                  
                  <div>
                    <label htmlFor="max-price" className="block text-sm text-gray-700">
                      Maximum price
                    </label>
                    <div className="mt-1 flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="number"
                        id="max-price"
                        min="0"
                        step="0.01"
                        value={maxPrice || ''}
                        onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled={freeOnly}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-700">
                Sort by:
              </div>
              <div className="flex space-x-2">
                {[
                  { id: 'popular', label: 'Popular' },
                  { id: 'recent', label: 'Recent' },
                  { id: 'rating', label: 'Rating' },
                  { id: 'price_asc', label: 'Price: Low to High' },
                  { id: 'price_desc', label: 'Price: High to Low' }
                ].map((sort) => (
                  <Button
                    key={sort.id}
                    variant={sortOrder === sort.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange(sort.id as any)}
                    type="button"
                  >
                    {sort.label}
                  </Button>
                ))}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Search Results */}
      {searchPerformed && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Search Results</h2>
          
          {searchResults.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-gray-500">No agents found matching your search criteria.</p>
                  <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Found {totalResults} agent{totalResults !== 1 ? 's' : ''}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(renderAgentCard)}
              </div>
              
              {/* Pagination */}
              {totalResults > 12 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.ceil(totalResults / 12) }).map((_, i) => {
                      const page = i + 1;
                      // Show first, last, current, and pages around current
                      if (
                        page === 1 ||
                        page === Math.ceil(totalResults / 12) ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return (
                          <Button key={page} variant="outline" disabled>
                            ...
                          </Button>
                        );
                      }
                      return null;
                    })}
                    
                    <Button
                      variant="outline"
                      disabled={currentPage === Math.ceil(totalResults / 12)}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Featured Agents */}
      {!searchPerformed && featuredAgents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Featured Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAgents.map(renderAgentCard)}
          </div>
        </div>
      )}
      
      {/* Categories */}
      {!searchPerformed && categories.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-xl">{category.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.agent_count} agents</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {category.description}
                  </p>
                  <div className="mt-4">
                    <Link href={`/marketplace?category=${category.id}`}>
                      <Button variant="outline" className="w-full">Browse Category</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
