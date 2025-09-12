// Smart Bookmark Search - Content Script

class ContentExtractor {
  constructor() {
    this.isProcessing = false;
    this.setupMessageListener();
  }

  /**
   * Set up message listener for background script requests
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractContent') {
        this.extractPageContent()
          .then(content => sendResponse({ success: true, content }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; // Indicate we'll send response asynchronously
      }
    });
  }

  /**
   * Extract content from current page
   */
  async extractPageContent() {
    try {
      const content = {
        url: window.location.href,
        title: document.title,
        description: this.extractDescription(),
        keywords: this.extractKeywords(),
        content: this.extractMainContent(),
        language: this.extractLanguage(),
        timestamp: Date.now()
      };

      // Calculate word count
      content.wordCount = content.content.split(/\s+/).filter(word => word.length > 0).length;

      return content;
    } catch (error) {
      console.error('Content extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract page description from meta tags
   */
  extractDescription() {
    // Try meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.getAttribute('content')) {
      return metaDesc.getAttribute('content').trim();
    }

    // Try Open Graph description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.getAttribute('content')) {
      return ogDesc.getAttribute('content').trim();
    }

    // Try Twitter description
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc && twitterDesc.getAttribute('content')) {
      return twitterDesc.getAttribute('content').trim();
    }

    // Extract from first paragraph
    const firstParagraph = document.querySelector('p');
    if (firstParagraph && firstParagraph.textContent.trim()) {
      const text = firstParagraph.textContent.trim();
      return text.length > 160 ? text.substring(0, 157) + '...' : text;
    }

    return '';
  }

  /**
   * Extract keywords from meta tags and headings
   */
  extractKeywords() {
    const keywords = [];

    // Meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && metaKeywords.getAttribute('content')) {
      const keywordList = metaKeywords.getAttribute('content').split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0 && k.length <= 30);
      keywords.push(...keywordList);
    }

    // Extract from headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      if (heading.textContent.trim()) {
        const headingWords = heading.textContent.trim().toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2 && word.length <= 20)
          .slice(0, 5); // Limit words per heading
        keywords.push(...headingWords);
      }
    });

    // Remove duplicates and limit
    return [...new Set(keywords)].slice(0, 25);
  }

  /**
   * Extract main text content from page
   */
  extractMainContent() {
    // Remove unwanted elements
    const elementsToRemove = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ad', '.ads', '.sidebar', '.menu',
      '.cookie-notice', '.popup', '.modal', '.overlay',
      '.social-media', '.share-buttons', '.comments',
      '.related-articles', '.recommended', '.newsletter-signup'
    ];

    // Clone document to avoid modifying original
    const docClone = document.cloneNode(true);

    // Remove unwanted elements from clone
    elementsToRemove.forEach(selector => {
      const elements = docClone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Try to find main content container
    const mainContentSelectors = [
      'main',
      'article',
      '.main-content',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.blog-post',
      '#main-content',
      '#content',
      '.container .content',
      '.page-content'
    ];

    let mainContainer = null;
    for (const selector of mainContentSelectors) {
      mainContainer = docClone.querySelector(selector);
      if (mainContainer) break;
    }

    // If no main content found, use body
    if (!mainContainer) {
      mainContainer = docClone.body || docClone.documentElement;
    }

    // Extract text from relevant elements
    const textElements = mainContainer.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, div, span'
    );

    const textParts = [];
    const seenTexts = new Set();

    textElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text && text.length > 10 && !seenTexts.has(text)) {
        // Filter out likely navigation or UI elements
        if (!this.isLikelyUIText(text)) {
          textParts.push(text);
          seenTexts.add(text);
        }
      }
    });

    // Join and clean the text
    const rawContent = textParts.join(' ');
    return this.cleanTextContent(rawContent);
  }

  /**
   * Check if text is likely UI/navigation text
   */
  isLikelyUIText(text) {
    // Common UI patterns
    const uiPatterns = [
      /^(home|about|contact|login|register|search|menu|nav|footer)$/i,
      /^(click here|read more|learn more|see more|view all)$/i,
      /^(yes|no|ok|cancel|submit|send|save)$/i,
      /^(facebook|twitter|instagram|linkedin|youtube)$/i,
      /^(privacy policy|terms of service|cookie policy)$/i,
      /^\d+$/, // Just numbers
      /^[^a-zA-Z]+$/, // No letters (symbols, numbers only)
    ];

    // Check against patterns
    for (const pattern of uiPatterns) {
      if (pattern.test(text)) return true;
    }

    // Too short or too long
    if (text.length < 3 || text.length > 500) return true;

    // Mostly punctuation
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount / text.length < 0.5) return true;

    return false;
  }

  /**
   * Clean extracted text content
   */
  cleanTextContent(text) {
    if (!text) return '';

    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive punctuation
      .replace(/[.,;:!?]{3,}/g, '.')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '')
      // Remove phone numbers
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '')
      // Remove excessive repeating characters
      .replace(/(.)\1{4,}/g, '$1$1$1')
      // Remove very long words (likely URLs or encoded content)
      .replace(/\b\w{50,}\b/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract page language
   */
  extractLanguage() {
    // Check html lang attribute
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) {
      return htmlLang.split('-')[0].toLowerCase();
    }

    // Check meta language
    const metaLang = document.querySelector('meta[http-equiv="content-language"]');
    if (metaLang && metaLang.getAttribute('content')) {
      return metaLang.getAttribute('content').split('-')[0].toLowerCase();
    }

    // Check og:locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale && ogLocale.getAttribute('content')) {
      return ogLocale.getAttribute('content').split('_')[0].toLowerCase();
    }

    // Try to detect from content (basic detection)
    const sampleText = this.extractMainContent().substring(0, 1000);
    const language = this.detectLanguageFromText(sampleText);
    
    return language || 'en'; // Default to English
  }

  /**
   * Basic language detection from text content
   */
  detectLanguageFromText(text) {
    if (!text || text.length < 50) return 'en';

    // Simple language detection based on common words
    const languagePatterns = {
      'en': /\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)\b/gi,
      'es': /\b(que|de|no|a|la|el|es|y|en|lo|un|por|qué|me|una|te|los|se|le|da|su|para|son|con|como|el|todo|pero|más|hacer|puede|tiempo|muy|cuando|él|antes)\b/gi,
      'fr': /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|lui|qui|son|fait|vous|plus|dire|me|temps|très|nous|aller)\b/gi,
      'de': /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei)\b/gi,
      'it': /\b(che|di|e|la|il|un|a|è|per|una|in|con|non|le|da|si|come|più|lo|ma|se|alla|lui|gli|ci|anche|tutto|della)\b/gi,
      'pt': /\b(que|de|não|o|a|do|da|em|um|para|é|com|uma|os|no|se|na|por|mais|as|dos|como|mas|foi|ao|ele|das|tem|à|seu|sua|ou|ser|quando|muito|há|nos|já|está)\b/gi,
      'ru': /\b(в|и|не|на|я|быть|он|с|а|как|по|это|все|она|так|его|но|да|ты|к|у|же|вы|за|бы|со|что|из|её|до|во|ну|ли|об|ещё|их|ей|ему|которые)\b/gi
    };

    let bestLanguage = 'en';
    let maxMatches = 0;

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = text.match(pattern);
      const matchCount = matches ? matches.length : 0;
      
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestLanguage = lang;
      }
    }

    // Require at least some matches for non-English languages
    if (bestLanguage !== 'en' && maxMatches < 5) {
      return 'en';
    }

    return bestLanguage;
  }

  /**
   * Check if current page should be processed
   */
  shouldProcessPage() {
    const url = window.location.href;
    
    // Skip certain URLs
    const skipPatterns = [
      /^(chrome|moz)-extension:/,
      /^about:/,
      /^data:/,
      /^javascript:/,
      /^mailto:/
    ];

    for (const pattern of skipPatterns) {
      if (pattern.test(url)) return false;
    }

    // Skip if page is too small or has no meaningful content
    const bodyText = document.body?.textContent || '';
    if (bodyText.length < 100) return false;

    return true;
  }

  /**
   * Get page reading time estimate
   */
  getReadingTime() {
    const content = this.extractMainContent();
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const wordsPerMinute = 200; // Average reading speed
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Extract page metadata
   */
  extractMetadata() {
    const metadata = {
      title: document.title,
      description: this.extractDescription(),
      keywords: this.extractKeywords(),
      author: this.extractAuthor(),
      publishDate: this.extractPublishDate(),
      modifiedDate: this.extractModifiedDate(),
      readingTime: this.getReadingTime(),
      language: this.extractLanguage(),
      url: window.location.href,
      domain: window.location.hostname
    };

    return metadata;
  }

  /**
   * Extract author information
   */
  extractAuthor() {
    // Try different meta tags for author
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="DC.creator"]',
      '.author',
      '.byline',
      '[rel="author"]'
    ];

    for (const selector of authorSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim()) {
          return content.trim();
        }
      }
    }

    return '';
  }

  /**
   * Extract publish date
   */
  extractPublishDate() {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="DC.date"]',
      'meta[name="date"]',
      'time[datetime]',
      '.publish-date',
      '.date'
    ];

    for (const selector of dateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const dateValue = element.getAttribute('content') || 
                         element.getAttribute('datetime') || 
                         element.textContent;
        
        if (dateValue && dateValue.trim()) {
          const date = new Date(dateValue.trim());
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract modified date
   */
  extractModifiedDate() {
    const modifiedSelectors = [
      'meta[property="article:modified_time"]',
      'meta[name="DC.date.modified"]',
      'meta[name="last-modified"]'
    ];

    for (const selector of modifiedSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const dateValue = element.getAttribute('content');
        if (dateValue && dateValue.trim()) {
          const date = new Date(dateValue.trim());
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }
    }

    return null;
  }
}

// Initialize content extractor
const contentExtractor = new ContentExtractor();

// Auto-extract content for bookmark analysis if this is a bookmarked page
if (contentExtractor.shouldProcessPage()) {
  // Small delay to ensure page is fully loaded
  setTimeout(() => {
    contentExtractor.extractPageContent()
      .then(content => {
        // Send content to background script for indexing
        chrome.runtime.sendMessage({
          action: 'indexPageContent',
          content: content
        });
      })
      .catch(error => {
        console.warn('Auto content extraction failed:', error);
      });
  }, 2000);
}

console.log('Smart Bookmark Search content script loaded');