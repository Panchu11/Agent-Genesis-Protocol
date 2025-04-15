/**
 * Simple in-memory cache utility
 * 
 * This provides a basic caching mechanism for frequently accessed data
 * with configurable TTL (time to live) and automatic cleanup.
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null;

  /**
   * Create a new cache instance
   * 
   * @param defaultTTL Default time to live in milliseconds (default: 5 minutes)
   * @param cleanupInterval Interval for cleanup in milliseconds (default: 1 minute)
   */
  constructor(defaultTTL = 5 * 60 * 1000, cleanupInterval = 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = null;
    
    // Start the cleanup interval
    this.startCleanup(cleanupInterval);
  }

  /**
   * Set a value in the cache
   * 
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist or is expired
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Remove expired item
        this.cache.delete(key);
      }
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * 
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && item.expiry >= Date.now();
  }

  /**
   * Delete a key from the cache
   * 
   * @param key Cache key
   * @returns True if the key was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get a value from the cache, or compute and store it if not found
   * 
   * @param key Cache key
   * @param fn Function to compute the value if not in cache
   * @param ttl Time to live in milliseconds (optional)
   * @returns The cached or computed value
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Start the cleanup interval
   * 
   * @param interval Cleanup interval in milliseconds
   */
  private startCleanup(interval: number): void {
    if (typeof window !== 'undefined' && !this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
          if (item.expiry < now) {
            this.cache.delete(key);
          }
        }
      }, interval);
    }
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create a singleton instance
export const cache = new Cache();

// Export the class for creating separate instances if needed
export default Cache;
