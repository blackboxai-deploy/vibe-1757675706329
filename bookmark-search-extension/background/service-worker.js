// Smart Bookmark Search - Background Service Worker
import { BookmarkCrawler } from './bookmark-crawler.js';
import { SearchEngine } from './search-engine.js';

class BackgroundService {
  constructor() {
    this.crawler = new BookmarkCrawler();
    this.searchEngine = new SearchEngine();
    this.isInitialized = false;
    this.crawlInProgress = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing Smart Bookmark Search...');
      
      // Initialize search engine and load existing index
      await this.searchEngine.initialize();
      
      // Check if we need to perform initial crawl
      const lastCrawl = await this.getLastCrawlTime();
      const shouldCrawl = !lastCrawl || (Date.now() - lastCrawl > 24 * 60 * 60 * 1000); // 24 hours
      
      if (shouldCrawl) {
        this.startBookmarkCrawl();
      }
      
      this.isInitialized = true;
      console.log('Smart Bookmark Search initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Smart Bookmark Search:', error);
    }
  }

  async startBookmarkCrawl(force = false) {
    if (this.crawlInProgress && !force) {
      console.log('Crawl already in progress');
      return;
    }

    this.crawlInProgress = true;
    
    try {
      console.log('Starting bookmark content crawl...');
      
      // Get all bookmarks
      const bookmarks = await this.crawler.getAllBookmarks();
      console.log(`Found ${bookmarks.length} bookmarks to process`);
      
      // Process bookmarks in batches to avoid overwhelming the browser
      const batchSize = 5;
      let processed = 0;
      
      for (let i = 0; i < bookmarks.length; i += batchSize) {
        const batch = bookmarks.slice(i, i + batchSize);
        
        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map(bookmark => this.crawler.crawlBookmark(bookmark))
        );
        
        // Add successful results to search index
        for (let j = 0; j < results.length; j++) {
          if (results[j].status === 'fulfilled' && results[j].value) {
            await this.searchEngine.addToIndex(results[j].value);
            processed++;
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update progress
        console.log(`Crawl progress: ${processed}/${bookmarks.length} bookmarks processed`);
      }
      
      // Save crawl completion time
      await this.setLastCrawlTime(Date.now());
      
      console.log(`Bookmark crawl completed. Processed ${processed} bookmarks.`);
      
    } catch (error) {
      console.error('Bookmark crawl failed:', error);
    } finally {
      this.crawlInProgress = false;
    }
  }

  async handleSearch(query, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const results = await this.searchEngine.search(query, options);
      
      // Check if we should auto-redirect
      if (results.length > 0 && results[0].confidence > 0.8) {
        return {
          action: 'redirect',
          url: results[0].url,
          results: results
        };
      }
      
      return {
        action: 'results',
        results: results
      };
      
    } catch (error) {
      console.error('Search failed:', error);
      return {
        action: 'error',
        error: error.message
      };
    }
  }

  async getLastCrawlTime() {
    const result = await chrome.storage.local.get(['lastCrawlTime']);
    return result.lastCrawlTime;
  }

  async setLastCrawlTime(time) {
    await chrome.storage.local.set({ lastCrawlTime: time });
  }

  async getSearchStats() {
    return {
      totalBookmarks: await this.searchEngine.getIndexSize(),
      lastCrawl: await this.getLastCrawlTime(),
      crawlInProgress: this.crawlInProgress
    };
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  await backgroundService.initialize();
});

chrome.runtime.onInstalled.addListener(async () => {
  await backgroundService.initialize();
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'search':
          const searchResult = await backgroundService.handleSearch(request.query, request.options);
          sendResponse(searchResult);
          break;
          
        case 'recrawl':
          backgroundService.startBookmarkCrawl(true);
          sendResponse({ success: true, message: 'Recrawl started' });
          break;
          
        case 'getStats':
          const stats = await backgroundService.getSearchStats();
          sendResponse(stats);
          break;
          
        case 'initialize':
          await backgroundService.initialize();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  return true; // Indicates we will send a response asynchronously
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-search') {
    chrome.action.openPopup();
  }
});

// Handle bookmark changes
chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  if (bookmark.url && backgroundService.isInitialized) {
    // Add new bookmark to index
    const content = await backgroundService.crawler.crawlBookmark(bookmark);
    if (content) {
      await backgroundService.searchEngine.addToIndex(content);
    }
  }
});

chrome.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
  if (backgroundService.isInitialized) {
    await backgroundService.searchEngine.removeFromIndex(id);
  }
});

chrome.bookmarks.onChanged.addListener(async (id, changeInfo) => {
  if (changeInfo.url && backgroundService.isInitialized) {
    // Re-crawl updated bookmark
    const bookmark = await chrome.bookmarks.get(id);
    if (bookmark[0]) {
      const content = await backgroundService.crawler.crawlBookmark(bookmark[0]);
      if (content) {
        await backgroundService.searchEngine.updateIndex(content);
      }
    }
  }
});

console.log('Smart Bookmark Search background service loaded');