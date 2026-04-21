import { databaseService } from './databaseService';

interface TagsQueryResult {
  tags_json: string;
}

export class TagsService {
  private static instance: TagsService;
  private cachedTags: string[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute

  static getInstance(): TagsService {
    if (!TagsService.instance) {
      TagsService.instance = new TagsService();
    }
    return TagsService.instance;
  }

  /**
   * Get all unique tags from all songs, with caching
   */
  async getAllTags(): Promise<string[]> {
    const now = Date.now();
    if (this.cachedTags.length > 0 && now - this.lastFetchTime < this.CACHE_DURATION) {
      return this.cachedTags;
    }

    try {
      const result = await databaseService.executeQuery<TagsQueryResult>(
        `SELECT tags_json FROM song_routines WHERE tags_json IS NOT NULL AND tags_json != '[]'`
      );

      const allTags = new Set<string>();

      for (const row of result) {
        try {
          const tags = JSON.parse(row.tags_json || '[]');
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (typeof tag === 'string' && tag.trim()) {
                allTags.add(tag.trim().toLowerCase());
              }
            });
          }
        } catch (error) {
          console.warn('Failed to parse tags for row:', row, error);
        }
      }

      this.cachedTags = Array.from(allTags).sort();
      this.lastFetchTime = now;
      return this.cachedTags;
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      return [];
    }
  }

  /**
   * Filter tags based on input text
   */
  async getTagSuggestions(input: string, currentTags: string[] = []): Promise<string[]> {
    if (!input.trim()) return [];

    const allTags = await this.getAllTags();
    const inputLower = input.toLowerCase().trim();
    const currentTagsLower = currentTags.map(tag => tag.toLowerCase());

    return allTags
      .filter(tag =>
        tag.includes(inputLower) &&
        !currentTagsLower.includes(tag)
      )
      .slice(0, 8); // Limit to 8 suggestions
  }

  /**
   * Clear the cache (call when tags are modified)
   */
  clearCache(): void {
    this.cachedTags = [];
    this.lastFetchTime = 0;
  }

  /**
   * Add tags to cache if they don't exist (for immediate feedback)
   */
  addToCache(newTags: string[]): void {
    const tagsToAdd = newTags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag && !this.cachedTags.includes(tag));

    this.cachedTags.push(...tagsToAdd);
    this.cachedTags.sort();
  }
}