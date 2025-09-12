// Search Engine - Indexing and searching bookmarked content

export class SearchEngine {
  constructor() {
    this.db = null;
    this.searchIndex = new Map();
    this.bookmarkData = new Map();
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'but', 'or', 'not', 'this', 'they',
      'have', 'had', 'what', 'said', 'each', 'which', 'their', 'time',
      'would', 'there', 'we', 'when', 'your', 'can', 'said', 'use',
      'word', 'how', 'many', 'then', 'them', 'these', 'so', 'some'
    ]);
  }

  /**
   * Initialize the search engine and load existing data
   */
  async initialize() {
    try {
      await this.initializeDB();
      await this.loadSearchIndex();
      console.log('Search engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize search engine:', error);
      throw error;
    }
  }

  /**
   * Initialize IndexedDB for storing search data
   */
  async initializeDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SmartBookmarkSearch', 1);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarkStore.createIndex('url', 'url', { unique: true });
          bookmarkStore.createIndex('lastCrawled', 'lastCrawled', { unique: false });
        }

        // Create search index store
        if (!db.objectStoreNames.contains('searchIndex')) {
          const indexStore = db.createObjectStore('searchIndex', { keyPath: 'word' });
          indexStore.createIndex('frequency', 'totalFrequency', { unique: false });
        }
      };
    });
  }

  /**
   * Load existing search index from storage
   */
  async loadSearchIndex() {
    try {
      // Load bookmarks
      const bookmarks = await this.getAllFromStore('bookmarks');
      bookmarks.forEach(bookmark => {
        this.bookmarkData.set(bookmark.id, bookmark);
      });

      // Load search index
      const indexEntries = await this.getAllFromStore('searchIndex');
      indexEntries.forEach(entry => {
        this.searchIndex.set(entry.word, entry.bookmarks);
      });

      console.log(`Loaded ${bookmarks.length} bookmarks and ${indexEntries.length} index entries`);
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
  }

  /**
   * Add bookmark content to search index
   */
  async addToIndex(bookmarkContent) {
    try {
      // Store bookmark data
      this.bookmarkData.set(bookmarkContent.id, bookmarkContent);
      await this.saveToStore('bookmarks', bookmarkContent);

      // Extract and index words
      const words = this.extractWords(bookmarkContent);
      await this.indexWords(words, bookmarkContent);

      console.log(`Added bookmark to index: ${bookmarkContent.title}`);
    } catch (error) {
      console.error('Failed to add bookmark to index:', error);
    }
  }

  /**
   * Update existing bookmark in index
   */
  async updateIndex(bookmarkContent) {
    try {
      // Remove old index entries
      await this.removeFromIndex(bookmarkContent.id);
      
      // Add updated content
      await this.addToIndex(bookmarkContent);
      
      console.log(`Updated bookmark in index: ${bookmarkContent.title}`);
    } catch (error) {
      console.error('Failed to update bookmark index:', error);
    }
  }

  /**
   * Remove bookmark from index
   */
  async removeFromIndex(bookmarkId) {
    try {
      const bookmark = this.bookmarkData.get(bookmarkId);
      if (!bookmark) return;

      // Remove from bookmark data
      this.bookmarkData.delete(bookmarkId);
      await this.deleteFromStore('bookmarks', bookmarkId);

      // Remove from search index
      const words = this.extractWords(bookmark);
      for (const [word] of words) {
        const indexEntry = this.searchIndex.get(word);
        if (indexEntry) {
          delete indexEntry[bookmarkId];
          
          // If no more bookmarks have this word, remove the word entry
          if (Object.keys(indexEntry).length === 0) {
            this.searchIndex.delete(word);
            await this.deleteFromStore('searchIndex', word);
          } else {
            // Update the index entry
            const totalFrequency = Object.values(indexEntry).reduce((sum, freq) => sum + freq, 0);
            await this.saveToStore('searchIndex', {
              word: word,
              bookmarks: indexEntry,
              totalFrequency: totalFrequency
            });
          }
        }
      }

      console.log(`Removed bookmark from index: ${bookmarkId}`);
    } catch (error) {
      console.error('Failed to remove bookmark from index:', error);
    }
  }

  /**
   * Search through indexed bookmarks
   */
  async search(query, options = {}) {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchTerms = this.preprocessQuery(query);
      const results = new Map();

      // Search for each term
      for (const term of searchTerms) {
        const matches = this.findMatches(term);
        
        // Add matches to results with scoring
        for (const [bookmarkId, score] of matches) {
          if (results.has(bookmarkId)) {
            results.set(bookmarkId, results.get(bookmarkId) + score);
          } else {
            results.set(bookmarkId, score);
          }
        }
      }

      // Convert to array and add bookmark details
      const searchResults = [];
      for (const [bookmarkId, score] of results) {
        const bookmark = this.bookmarkData.get(bookmarkId);
        if (bookmark) {
          searchResults.push({
            id: bookmarkId,
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description,
            snippet: this.generateSnippet(bookmark, query),
            score: score,
            confidence: Math.min(score / 100, 1), // Normalize confidence
            lastCrawled: bookmark.lastCrawled,
            wordCount: bookmark.wordCount
          });
        }
      }

      // Sort by score and apply limits
      const sortedResults = searchResults
        .sort((a, b) => b.score - a.score)
        .slice(0, options.limit || 20);

      return sortedResults;

    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Extract words from bookmark content for indexing
   */
  extractWords(bookmark) {
    const wordMap = new Map();
    
    // Combine all text content
    const allText = [
      bookmark.title || '',
      bookmark.description || '',
      bookmark.content || '',
      ...(bookmark.keywords || [])
    ].join(' ').toLowerCase();

    // Extract words
    const words = allText.match(/\b\w{2,}\b/g) || [];
    
    // Count word frequencies
    words.forEach(word => {
      if (!this.stopWords.has(word) && word.length >= 2) {
        wordMap.set(word, (wordMap.get(word) || 0) + 1);
      }
    });

    // Add extra weight for title and description words
    const titleWords = (bookmark.title || '').toLowerCase().match(/\b\w{2,}\b/g) || [];
    titleWords.forEach(word => {
      if (!this.stopWords.has(word)) {
        wordMap.set(word, (wordMap.get(word) || 0) + 3); // 3x weight for title words
      }
    });

    const descWords = (bookmark.description || '').toLowerCase().match(/\b\w{2,}\b/g) || [];
    descWords.forEach(word => {
      if (!this.stopWords.has(word)) {
        wordMap.set(word, (wordMap.get(word) || 0) + 2); // 2x weight for description words
      }
    });

    return wordMap;
  }

  /**
   * Index words for a bookmark
   */
  async indexWords(wordMap, bookmark) {
    for (const [word, frequency] of wordMap) {
      let indexEntry = this.searchIndex.get(word);
      
      if (!indexEntry) {
        indexEntry = {};
        this.searchIndex.set(word, indexEntry);
      }
      
      indexEntry[bookmark.id] = frequency;
      
      // Calculate total frequency
      const totalFrequency = Object.values(indexEntry).reduce((sum, freq) => sum + freq, 0);
      
      // Save to persistent storage
      await this.saveToStore('searchIndex', {
        word: word,
        bookmarks: indexEntry,
        totalFrequency: totalFrequency
      });
    }
  }

  /**
   * Preprocess search query
   */
  preprocessQuery(query) {
    const cleanQuery = query.toLowerCase().trim();
    
    // Handle quoted phrases
    const phrases = cleanQuery.match(/"([^"]+)"/g) || [];
    let remainingQuery = cleanQuery;
    
    // Remove quoted phrases from main query
    phrases.forEach(phrase => {
      remainingQuery = remainingQuery.replace(phrase, '');
    });
    
    // Extract individual words
    const words = remainingQuery.match(/\b\w{2,}\b/g) || [];
    
    // Clean and filter words
    const filteredWords = words
      .filter(word => !this.stopWords.has(word) && word.length >= 2)
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
    
    // Add cleaned phrases
    const cleanPhrases = phrases.map(phrase => phrase.replace(/"/g, '').trim());
    
    return [...filteredWords, ...cleanPhrases];
  }

  /**
   * Find matches for a search term
   */
  findMatches(term) {
    const matches = new Map();
    
    // Exact matches
    const exactMatch = this.searchIndex.get(term);
    if (exactMatch) {
      for (const [bookmarkId, frequency] of Object.entries(exactMatch)) {
        matches.set(bookmarkId, frequency * 10); // 10x score for exact matches
      }
    }
    
    // Partial matches (prefix search)
    for (const [indexedWord, bookmarkFreqs] of this.searchIndex) {
      if (indexedWord !== term && (indexedWord.startsWith(term) || term.startsWith(indexedWord))) {
        const similarity = this.calculateSimilarity(term, indexedWord);
        
        for (const [bookmarkId, frequency] of Object.entries(bookmarkFreqs)) {
          const score = frequency * similarity * 3; // 3x score for partial matches
          if (matches.has(bookmarkId)) {
            matches.set(bookmarkId, matches.get(bookmarkId) + score);
          } else {
            matches.set(bookmarkId, score);
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * Calculate similarity between two words
   */
  calculateSimilarity(word1, word2) {
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Generate snippet for search result
   */
  generateSnippet(bookmark, query) {
    const content = bookmark.content || bookmark.description || '';
    if (!content) return '';
    
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    // Find the position of the first query word in content
    let bestPosition = 0;
    let bestScore = 0;
    
    queryWords.forEach(word => {
      const pos = contentLower.indexOf(word);
      if (pos !== -1) {
        // Score based on position (earlier is better) and word length
        const score = (content.length - pos) + word.length;
        if (score > bestScore) {
          bestScore = score;
          bestPosition = Math.max(0, pos - 50); // Start 50 chars before match
        }
      }
    });
    
    // Extract snippet around the best position
    const snippet = content.substr(bestPosition, 200);
    
    // Clean up snippet
    const words = snippet.split(/\s+/);
    if (words.length > 25) {
      return words.slice(0, 25).join(' ') + '...';
    }
    
    return snippet;
  }

  /**
   * Get index statistics
   */
  async getIndexSize() {
    return this.bookmarkData.size;
  }

  /**
   * Clear all search data
   */
  async clearIndex() {
    try {
      this.searchIndex.clear();
      this.bookmarkData.clear();
      
      await this.clearStore('bookmarks');
      await this.clearStore('searchIndex');
      
      console.log('Search index cleared');
    } catch (error) {
      console.error('Failed to clear index:', error);
    }
  }

  // IndexedDB helper methods

  async saveToStore(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export default SearchEngine;