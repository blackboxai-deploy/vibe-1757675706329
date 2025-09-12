// Bookmark Crawler - Content extraction from bookmarked pages

export class BookmarkCrawler {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (compatible; SmartBookmarkSearch/1.0)';
    this.timeout = 15000; // 15 seconds timeout
    this.maxRetries = 2;
  }

  /**
   * Get all bookmarks from Firefox bookmark tree
   */
  async getAllBookmarks() {
    try {
      const bookmarkTree = await chrome.bookmarks.getTree();
      const bookmarks = [];
      
      this.traverseBookmarkTree(bookmarkTree, bookmarks);
      
      // Filter out folders and invalid URLs
      return bookmarks.filter(bookmark => 
        bookmark.url && 
        (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://'))
      );
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return [];
    }
  }

  /**
   * Recursively traverse bookmark tree to collect all bookmarks
   */
  traverseBookmarkTree(nodes, bookmarks) {
    for (const node of nodes) {
      if (node.url) {
        // This is a bookmark
        bookmarks.push({
          id: node.id,
          title: node.title || '',
          url: node.url,
          dateAdded: node.dateAdded || Date.now(),
          parentId: node.parentId
        });
      } else if (node.children) {
        // This is a folder, traverse its children
        this.traverseBookmarkTree(node.children, bookmarks);
      }
    }
  }

  /**
   * Crawl a single bookmark and extract its content
   */
  async crawlBookmark(bookmark, retryCount = 0) {
    try {
      console.log(`Crawling bookmark: ${bookmark.title} (${bookmark.url})`);
      
      // Skip certain URLs that are not useful to crawl
      if (this.shouldSkipUrl(bookmark.url)) {
        console.log(`Skipping URL: ${bookmark.url}`);
        return null;
      }

      // Use fetch to get page content
      const content = await this.fetchPageContent(bookmark.url);
      
      if (!content) {
        console.log(`Failed to fetch content for: ${bookmark.url}`);
        return null;
      }

      // Extract and clean text content
      const extractedData = this.extractContentFromHTML(content, bookmark);
      
      return {
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        originalTitle: extractedData.title || bookmark.title,
        content: extractedData.content,
        description: extractedData.description,
        keywords: extractedData.keywords,
        wordCount: extractedData.wordCount,
        dateAdded: bookmark.dateAdded,
        lastCrawled: Date.now(),
        language: extractedData.language
      };

    } catch (error) {
      console.error(`Error crawling ${bookmark.url}:`, error);
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(`Retrying ${bookmark.url} (attempt ${retryCount + 1})`);
        await this.delay(2000); // Wait 2 seconds before retry
        return this.crawlBookmark(bookmark, retryCount + 1);
      }
      
      return null;
    }
  }

  /**
   * Fetch page content using Chrome's fetch API
   */
  async fetchPageContent(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal,
        credentials: 'omit' // Don't send cookies for privacy
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        console.log(`Skipping non-HTML content: ${contentType}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request timeout for: ${url}`);
      } else {
        console.error(`Fetch error for ${url}:`, error);
      }
      return null;
    }
  }

  /**
   * Extract and clean content from HTML
   */
  extractContentFromHTML(html, bookmark) {
    try {
      // Create a temporary DOM to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 
        'aside', '.advertisement', '.ad', '.sidebar',
        '.cookie-notice', '.popup', '.modal'
      ];
      
      unwantedSelectors.forEach(selector => {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      // Extract metadata
      const title = this.extractTitle(doc, bookmark.title);
      const description = this.extractDescription(doc);
      const keywords = this.extractKeywords(doc);
      const language = this.extractLanguage(doc);

      // Extract main content
      const mainContent = this.extractMainContent(doc);
      const cleanedContent = this.cleanText(mainContent);

      // Calculate word count
      const wordCount = cleanedContent.split(/\s+/).filter(word => word.length > 0).length;

      return {
        title,
        description,
        keywords,
        content: cleanedContent,
        wordCount,
        language
      };

    } catch (error) {
      console.error('Error parsing HTML:', error);
      return {
        title: bookmark.title,
        description: '',
        keywords: [],
        content: '',
        wordCount: 0,
        language: 'en'
      };
    }
  }

  /**
   * Extract page title
   */
  extractTitle(doc, fallbackTitle) {
    const titleElement = doc.querySelector('title');
    if (titleElement && titleElement.textContent.trim()) {
      return titleElement.textContent.trim();
    }
    
    const h1 = doc.querySelector('h1');
    if (h1 && h1.textContent.trim()) {
      return h1.textContent.trim();
    }
    
    return fallbackTitle || '';
  }

  /**
   * Extract page description
   */
  extractDescription(doc) {
    // Try meta description first
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.getAttribute('content')) {
      return metaDesc.getAttribute('content').trim();
    }

    // Try Open Graph description
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.getAttribute('content')) {
      return ogDesc.getAttribute('content').trim();
    }

    // Try first paragraph
    const firstP = doc.querySelector('p');
    if (firstP && firstP.textContent.trim()) {
      const text = firstP.textContent.trim();
      return text.length > 160 ? text.substring(0, 157) + '...' : text;
    }

    return '';
  }

  /**
   * Extract keywords from meta tags
   */
  extractKeywords(doc) {
    const keywords = [];
    
    // Meta keywords
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    if (metaKeywords && metaKeywords.getAttribute('content')) {
      const keywordList = metaKeywords.getAttribute('content').split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      keywords.push(...keywordList);
    }

    // Extract from headings
    const headings = doc.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
      if (heading.textContent.trim()) {
        const words = heading.textContent.trim().toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3);
        keywords.push(...words);
      }
    });

    // Remove duplicates and limit
    return [...new Set(keywords)].slice(0, 20);
  }

  /**
   * Extract language from document
   */
  extractLanguage(doc) {
    const htmlLang = doc.documentElement.getAttribute('lang');
    if (htmlLang) {
      return htmlLang.split('-')[0].toLowerCase();
    }

    const metaLang = doc.querySelector('meta[http-equiv="content-language"]');
    if (metaLang && metaLang.getAttribute('content')) {
      return metaLang.getAttribute('content').split('-')[0].toLowerCase();
    }

    return 'en'; // Default to English
  }

  /**
   * Extract main content from document
   */
  extractMainContent(doc) {
    // Try to find main content area
    const contentSelectors = [
      'main', 'article', '.content', '.main-content', 
      '.post-content', '.entry-content', '#content',
      '.container .row .col', '.wrapper'
    ];

    let mainElement = null;
    for (const selector of contentSelectors) {
      mainElement = doc.querySelector(selector);
      if (mainElement) break;
    }

    // If no main content found, use body
    if (!mainElement) {
      mainElement = doc.body;
    }

    // Extract text from paragraphs, headings, and lists
    const textElements = mainElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, div');
    const textParts = [];
    
    textElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text && text.length > 10) { // Filter out very short text
        textParts.push(text);
      }
    });

    return textParts.join(' ');
  }

  /**
   * Clean extracted text
   */
  cleanText(text) {
    if (!text) return '';

    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep basic punctuation
      .replace(/[^\w\s.,!?;:()\-"']/g, '')
      // Remove very long words (likely URLs or garbage)
      .replace(/\b\w{50,}\b/g, '')
      // Trim
      .trim();
  }

  /**
   * Check if URL should be skipped
   */
  shouldSkipUrl(url) {
    const skipPatterns = [
      /^javascript:/,
      /^mailto:/,
      /^tel:/,
      /^ftp:/,
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe)$/i,
      /\.(jpg|jpeg|png|gif|bmp|svg|ico)$/i,
      /\.(mp3|mp4|avi|mov|wmv|flv)$/i
    ];

    const skipDomains = [
      'chrome://',
      'moz-extension://',
      'about:',
      'data:'
    ];

    // Check skip patterns
    for (const pattern of skipPatterns) {
      if (pattern.test(url)) return true;
    }

    // Check skip domains
    for (const domain of skipDomains) {
      if (url.startsWith(domain)) return true;
    }

    return false;
  }

  /**
   * Simple delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BookmarkCrawler;