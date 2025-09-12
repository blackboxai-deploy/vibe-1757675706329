// Smart Bookmark Search - Options Page

class OptionsPage {
  constructor() {
    // Search settings
    this.autoRedirectThreshold = document.getElementById('autoRedirectThreshold');
    this.resultsLimit = document.getElementById('resultsLimit');
    this.fuzzySearch = document.getElementById('fuzzySearch');
    this.searchInSnippets = document.getElementById('searchInSnippets');

    // Crawling settings
    this.crawlFrequency = document.getElementById('crawlFrequency');
    this.crawlTimeout = document.getElementById('crawlTimeout');
    this.respectRobots = document.getElementById('respectRobots');
    this.skipLoginPages = document.getElementById('skipLoginPages');

    // Index management
    this.totalIndexedBookmarks = document.getElementById('totalIndexedBookmarks');
    this.indexSize = document.getElementById('indexSize');
    this.lastCrawlTime = document.getElementById('lastCrawlTime');
    this.totalWords = document.getElementById('totalWords');

    // Advanced settings
    this.debugMode = document.getElementById('debugMode');
    this.enableAnalytics = document.getElementById('enableAnalytics');
    this.languageDetection = document.getElementById('languageDetection');

    // Buttons
    this.saveSettingsBtn = document.getElementById('saveSettings');
    this.refreshIndexBtn = document.getElementById('refreshIndex');
    this.clearIndexBtn = document.getElementById('clearIndex');
    this.exportSettingsBtn = document.getElementById('exportSettings');
    this.importSettingsBtn = document.getElementById('importSettings');

    this.initializeEventListeners();
    this.loadSettings();
    this.loadStats();
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    this.refreshIndexBtn.addEventListener('click', () => this.refreshIndex());
    this.clearIndexBtn.addEventListener('click', () => this.confirmClearIndex());
    this.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
    this.importSettingsBtn.addEventListener('click', () => document.getElementById('importSettingsFile').click());
    document.getElementById('importSettingsFile').addEventListener('change', (e) => this.importSettings(e));
    
    // Slider value display
    this.autoRedirectThreshold.addEventListener('input', (e) => {
      e.target.nextElementSibling.textContent = `${e.target.value}%`;
    });
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const settings = await this.sendMessage({ action: 'getSettings' });
      
      this.autoRedirectThreshold.value = settings.autoRedirectThreshold || 80;
      this.autoRedirectThreshold.nextElementSibling.textContent = `${this.autoRedirectThreshold.value}%`;
      this.resultsLimit.value = settings.resultsLimit || 10;
      this.fuzzySearch.checked = settings.fuzzySearch !== false;
      this.searchInSnippets.checked = settings.searchInSnippets !== false;

      this.crawlFrequency.value = settings.crawlFrequency || 'daily';
      this.crawlTimeout.value = settings.crawlTimeout || 15;
      this.respectRobots.checked = settings.respectRobots !== false;
      this.skipLoginPages.checked = settings.skipLoginPages !== false;

      this.debugMode.value = settings.debugMode || 'off';
      this.enableAnalytics.checked = settings.enableAnalytics === true;
      this.languageDetection.value = settings.languageDetection || 'auto';
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showMessage('Failed to load settings', 'error');
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    const settings = {
      autoRedirectThreshold: parseInt(this.autoRedirectThreshold.value),
      resultsLimit: parseInt(this.resultsLimit.value),
      fuzzySearch: this.fuzzySearch.checked,
      searchInSnippets: this.searchInSnippets.checked,

      crawlFrequency: this.crawlFrequency.value,
      crawlTimeout: parseInt(this.crawlTimeout.value),
      respectRobots: this.respectRobots.checked,
      skipLoginPages: this.skipLoginPages.checked,

      debugMode: this.debugMode.value,
      enableAnalytics: this.enableAnalytics.checked,
      languageDetection: this.languageDetection.value,
    };

    try {
      await this.sendMessage({ action: 'saveSettings', settings: settings });
      this.showMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showMessage('Failed to save settings', 'error');
    }
  }

  /**
   * Load index statistics
   */
  async loadStats() {
    try {
      const stats = await this.sendMessage({ action: 'getIndexStats' });
      
      this.totalIndexedBookmarks.textContent = stats.totalBookmarks || 0;
      this.indexSize.textContent = this.formatBytes(stats.indexSize) || '0 MB';
      this.lastCrawlTime.textContent = stats.lastCrawl ? new Date(stats.lastCrawl).toLocaleString() : 'Never';
      this.totalWords.textContent = (stats.totalWords || 0).toLocaleString();
      
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  /**
   * Refresh bookmark index
   */
  async refreshIndex() {
    this.refreshIndexBtn.disabled = true;
    this.refreshIndexBtn.innerHTML = `
      <div class="loading-spinner"></div>
      Refreshing...
    `;
    
    try {
      await this.sendMessage({ action: 'recrawl' });
      this.showMessage('Bookmark index refresh started. This may take a while.');
      setTimeout(() => this.loadStats(), 5000);
    } catch (error) {
      console.error('Failed to start index refresh:', error);
      this.showMessage('Failed to start index refresh', 'error');
    } finally {
      this.refreshIndexBtn.disabled = false;
      this.refreshIndexBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
        </svg>
        Refresh All Bookmarks
      `;
    }
  }

  /**
   * Confirm and clear index
   */
  confirmClearIndex() {
    this.showConfirmation(
      'Are you sure you want to clear the entire search index? This action cannot be undone.',
      () => this.clearIndex()
    );
  }

  /**
   * Clear search index
   */
  async clearIndex() {
    try {
      await this.sendMessage({ action: 'clearIndex' });
      this.showMessage('Search index cleared successfully!');
      this.loadStats();
    } catch (error) {
      console.error('Failed to clear index:', error);
      this.showMessage('Failed to clear index', 'error');
    }
  }

  /**
   * Export settings to JSON file
   */
  exportSettings() {
    // Implementation for exporting settings
    this.showMessage('Exporting settings...');
  }

  /**
   * Import settings from JSON file
   */
  importSettings(e) {
    // Implementation for importing settings
    this.showMessage('Importing settings...');
  }

  /**
   * Send message to background script
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } else {
        reject(new Error('Extension context not available'));
      }
    });
  }

  /**
   * Show temporary message
   */
  showMessage(message, type = 'success') {
    const messageEl = document.getElementById('successMessage');
    messageEl.querySelector('.message-content').innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="${type === 'success' ? 'text-green-500' : 'text-red-500'}">
        ${type === 'success' 
          ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' 
          : '<path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>'}
      </svg>
      ${message}
    `;
    messageEl.classList.remove('hidden');
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 3000);
  }

  /**
   * Show confirmation dialog
   */
  showConfirmation(message, onConfirm) {
    const dialog = document.getElementById('confirmDialog');
    document.getElementById('dialogMessage').textContent = message;

    const confirmBtn = document.getElementById('dialogConfirm');
    const cancelBtn = document.getElementById('dialogCancel');

    const confirmHandler = () => {
      onConfirm();
      hideDialog();
    };

    const cancelHandler = () => {
      hideDialog();
    };

    const hideDialog = () => {
      dialog.classList.add('hidden');
      confirmBtn.removeEventListener('click', confirmHandler);
      cancelBtn.removeEventListener('click', cancelHandler);
    };

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);

    dialog.classList.remove('hidden');
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
