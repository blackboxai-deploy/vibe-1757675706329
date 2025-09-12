// Smart Bookmark Search - Popup Interface

class PopupInterface {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.clearBtn = document.getElementById('clearBtn');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.searchResults = document.getElementById('searchResults');
    this.resultsList = document.getElementById('resultsList');
    this.resultsCount = document.getElementById('resultsCount');
    this.emptyState = document.getElementById('emptyState');
    this.errorState = document.getElementById('errorState');
    this.autoRedirectNotification = document.getElementById('autoRedirectNotification');
    
    this.totalBookmarks = document.getElementById('totalBookmarks');
    this.lastCrawl = document.getElementById('lastCrawl');
    
    this.resultTemplate = document.getElementById('resultItemTemplate');
    
    this.currentResults = [];
    this.searchTimeout = null;
    this.isSearching = false;
    
    this.initializeEventListeners();
    this.loadInitialState();
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    // Search input events
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value);
    });
    
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });
    
    this.searchInput.addEventListener('focus', () => {
      this.searchInput.select();
    });

    // Clear button
    this.clearBtn.addEventListener('click', () => {
      this.clearSearch();
    });

    // Refresh index button
    document.getElementById('refreshIndex').addEventListener('click', () => {
      this.refreshIndex();
    });

     // Settings and options buttons
    document.getElementById('settingsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    document.getElementById('optionsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    // Import button
    document.getElementById('importBtn').addEventListener('click', () => {
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('import/import.html') 
      });
    });

    // Retry button
    document.getElementById('retrySearch').addEventListener('click', () => {
      this.handleSearchInput(this.searchInput.value);
    });

    // Help button
    document.getElementById('helpBtn').addEventListener('click', () => {
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('help.html') 
      });
    });

    // Focus search input when popup opens
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }

  /**
   * Load initial state and statistics
   */
  async loadInitialState() {
    try {
      const stats = await this.sendMessage({ action: 'getStats' });
      this.updateStats(stats);
      this.showEmptyState();
    } catch (error) {
      console.error('Failed to load initial state:', error);
    }
  }

  /**
   * Handle search input changes with debouncing
   */
  handleSearchInput(query) {
    const trimmedQuery = query.trim();
    
    // Update clear button visibility
    if (trimmedQuery.length > 0) {
      this.clearBtn.classList.add('visible');
    } else {
      this.clearBtn.classList.remove('visible');
    }
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    if (trimmedQuery.length === 0) {
      this.showEmptyState();
      return;
    }
    
    if (trimmedQuery.length < 2) {
      return; // Don't search for single characters
    }
    
    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(trimmedQuery);
    }, 300);
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeydown(event) {
    switch (event.key) {
      case 'Escape':
        this.clearSearch();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateResults('down');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateResults('up');
        break;
      case 'Enter':
        event.preventDefault();
        this.handleEnterKey();
        break;
    }
  }

  /**
   * Navigate through search results with keyboard
   */
  navigateResults(direction) {
    const resultItems = this.resultsList.querySelectorAll('.result-item');
    if (resultItems.length === 0) return;
    
    const currentActive = this.resultsList.querySelector('.result-item.active');
    let newIndex = 0;
    
    if (currentActive) {
      const currentIndex = Array.from(resultItems).indexOf(currentActive);
      if (direction === 'down') {
        newIndex = (currentIndex + 1) % resultItems.length;
      } else {
        newIndex = currentIndex === 0 ? resultItems.length - 1 : currentIndex - 1;
      }
      currentActive.classList.remove('active');
    }
    
    resultItems[newIndex].classList.add('active');
    resultItems[newIndex].scrollIntoView({ block: 'nearest' });
  }

  /**
   * Handle Enter key press
   */
  handleEnterKey() {
    const activeResult = this.resultsList.querySelector('.result-item.active');
    if (activeResult) {
      const url = activeResult.querySelector('.result-title').href;
      this.openUrl(url);
    } else if (this.currentResults.length > 0) {
      // Open first result if no active selection
      this.openUrl(this.currentResults[0].url);
    }
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    if (this.isSearching) return;
    
    this.isSearching = true;
    this.showLoadingState();
    
    try {
      const response = await this.sendMessage({ 
        action: 'search', 
        query: query,
        options: { limit: 10 }
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      this.currentResults = response.results || [];
      
      // Handle auto-redirect
      if (response.action === 'redirect' && response.url) {
        this.showAutoRedirectNotification(response.url);
        setTimeout(() => {
          this.openUrl(response.url);
        }, 2000);
      } else {
        this.displaySearchResults(this.currentResults, query);
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      this.showErrorState(error.message);
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Display search results
   */
  displaySearchResults(results, query) {
    this.hideAllStates();
    this.searchResults.classList.remove('hidden');
    
    // Update results count
    this.resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
    
    // Clear previous results
    this.resultsList.innerHTML = '';
    
    if (results.length === 0) {
      this.showNoResultsMessage(query);
      return;
    }
    
    // Create result items
    results.forEach((result, index) => {
      const resultElement = this.createResultElement(result, index);
      this.resultsList.appendChild(resultElement);
    });
  }

  /**
   * Create a single result element
   */
  createResultElement(result, index) {
    const template = this.resultTemplate.content.cloneNode(true);
    const resultItem = template.querySelector('.result-item');
    
    // Set title and URL
    const titleLink = template.querySelector('.result-title');
    titleLink.textContent = result.title || 'Untitled';
    titleLink.href = result.url;
    
    // Set confidence
    const confidenceFill = template.querySelector('.confidence-fill');
    const confidenceText = template.querySelector('.confidence-text');
    const confidencePercent = Math.round(result.confidence * 100);
    
    confidenceFill.style.width = `${confidencePercent}%`;
    confidenceText.textContent = `${confidencePercent}%`;
    
    // Set confidence color
    if (result.confidence >= 0.7) {
      confidenceFill.classList.add('high');
    } else if (result.confidence >= 0.4) {
      confidenceFill.classList.add('medium');
    } else {
      confidenceFill.classList.add('low');
    }
    
    // Set URL
    const urlElement = template.querySelector('.result-url');
    urlElement.textContent = this.truncateUrl(result.url);
    
    // Set snippet
    const snippetElement = template.querySelector('.result-snippet');
    if (result.snippet) {
      snippetElement.textContent = result.snippet;
    } else {
      snippetElement.textContent = result.description || 'No preview available';
    }
    
    // Set metadata
    const dateElement = template.querySelector('.result-date');
    const wordCountElement = template.querySelector('.result-wordcount');
    
    if (result.lastCrawled) {
      dateElement.textContent = this.formatDate(result.lastCrawled);
    }
    
    if (result.wordCount) {
      wordCountElement.textContent = `${result.wordCount} words`;
    }
    
    // Add event listeners
    resultItem.addEventListener('click', (e) => {
      if (!e.target.closest('.action-btn')) {
        this.openUrl(result.url);
      }
    });
    
    // Action buttons
    const openBtn = template.querySelector('.open-btn');
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openUrl(result.url);
    });
    
    const copyBtn = template.querySelector('.copy-btn');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyToClipboard(result.url);
    });
    
    return resultItem;
  }

  /**
   * Show auto-redirect notification
   */
  showAutoRedirectNotification(url) {
    this.hideAllStates();
    this.autoRedirectNotification.classList.remove('hidden');
    
    // Update notification text with domain
    const domain = new URL(url).hostname;
    const notificationText = this.autoRedirectNotification.querySelector('.notification-text');
    notificationText.textContent = `Redirecting to ${domain}...`;
  }

  /**
   * Show no results message
   */
  showNoResultsMessage(query) {
    const noResultsHtml = `
      <div class="no-results">
        <div class="no-results-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>
        <h3>No results found</h3>
        <p>Try different keywords or check if your bookmarks have been indexed recently.</p>
        <button id="refreshIndexFromNoResults" class="refresh-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
          </svg>
          Refresh Index
        </button>
      </div>
    `;
    
    this.resultsList.innerHTML = noResultsHtml;
    
    // Add event listener to refresh button
    document.getElementById('refreshIndexFromNoResults').addEventListener('click', () => {
      this.refreshIndex();
    });
  }

  /**
   * Show different states
   */
  showLoadingState() {
    this.hideAllStates();
    this.loadingIndicator.classList.remove('hidden');
  }

  showEmptyState() {
    this.hideAllStates();
    this.emptyState.classList.remove('hidden');
  }

  showErrorState(message) {
    this.hideAllStates();
    this.errorState.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
  }

  hideAllStates() {
    this.loadingIndicator.classList.add('hidden');
    this.searchResults.classList.add('hidden');
    this.emptyState.classList.add('hidden');
    this.errorState.classList.add('hidden');
    this.autoRedirectNotification.classList.add('hidden');
  }

  /**
   * Clear search
   */
  clearSearch() {
    this.searchInput.value = '';
    this.clearBtn.classList.remove('visible');
    this.showEmptyState();
    this.currentResults = [];
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * Refresh bookmark index
   */
  async refreshIndex() {
    const refreshBtn = document.getElementById('refreshIndex') || 
                      document.getElementById('refreshIndexFromNoResults');
    
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = `
        <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
        Refreshing...
      `;
    }
    
    try {
      await this.sendMessage({ action: 'recrawl' });
      
      // Wait a bit and reload stats
      setTimeout(async () => {
        const stats = await this.sendMessage({ action: 'getStats' });
        this.updateStats(stats);
        
        if (refreshBtn) {
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
            Refresh Index
          `;
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to refresh index:', error);
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Failed';
      }
    }
  }

  /**
   * Update statistics display
   */
  updateStats(stats) {
    if (this.totalBookmarks) {
      this.totalBookmarks.textContent = stats.totalBookmarks || '0';
    }
    
    if (this.lastCrawl && stats.lastCrawl) {
      this.lastCrawl.textContent = this.formatDate(stats.lastCrawl);
    }
  }

  /**
   * Open URL in new tab
   */
  openUrl(url) {
    chrome.tabs.create({ url: url });
    window.close();
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // Show brief success feedback
      this.showTemporaryMessage('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  /**
   * Show temporary message
   */
  showTemporaryMessage(message) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = 'temporary-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 2000);
  }

  /**
   * Send message to background script
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Utility functions
   */
  truncateUrl(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;
      
      if (path === '/' || path === '') {
        return domain;
      }
      
      const maxLength = 40;
      const fullUrl = domain + path;
      
      if (fullUrl.length <= maxLength) {
        return fullUrl;
      }
      
      return domain + path.substring(0, maxLength - domain.length - 3) + '...';
    } catch (error) {
      return url.substring(0, 50) + (url.length > 50 ? '...' : '');
    }
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }
}

// Initialize popup interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupInterface();
});

console.log('Smart Bookmark Search popup loaded');