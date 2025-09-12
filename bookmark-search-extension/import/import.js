// Smart Bookmark Search - Import Tool JavaScript

class BookmarkImporter {
  constructor() {
    this.currentStep = 1;
    this.selectedBrowser = null;
    this.uploadedFile = null;
    this.importOptions = {
      preserveFolders: true,
      skipDuplicates: true,
      validateUrls: false,
      autoIndex: true
    };
    this.importStats = {
      total: 0,
      processed: 0,
      imported: 0,
      skipped: 0,
      folders: 0,
      indexed: 0
    };
    
    this.initializeEventListeners();
    this.updateStepDisplay();
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    // Navigation buttons
    document.getElementById('nextToUpload').addEventListener('click', () => this.goToStep(2));
    document.getElementById('backToBrowser').addEventListener('click', () => this.goToStep(1));
    document.getElementById('startImport').addEventListener('click', () => this.startImportProcess());
    document.getElementById('cancelImport').addEventListener('click', () => this.cancelImport());
    document.getElementById('openExtension').addEventListener('click', () => this.openExtension());
    document.getElementById('importMore').addEventListener('click', () => this.resetImporter());
    document.getElementById('backToExtension').addEventListener('click', () => this.backToExtension());

    // Browser selection
    document.querySelectorAll('.browser-card').forEach(card => {
      card.addEventListener('click', () => this.selectBrowser(card.dataset.browser));
    });

    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
    uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    uploadArea.addEventListener('drop', this.handleDrop.bind(this));

    fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

    // Remove file
    document.getElementById('removeFile').addEventListener('click', () => this.removeFile());

    // Import options
    document.querySelectorAll('.option-item input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', this.updateImportOptions.bind(this));
    });
  }

  /**
   * Update step display
   */
  updateStepDisplay() {
    // Update step indicators
    document.querySelectorAll('.step').forEach(step => {
      const stepNumber = parseInt(step.dataset.step);
      step.classList.toggle('active', stepNumber === this.currentStep);
      step.classList.toggle('completed', stepNumber < this.currentStep);
    });

    // Update step content
    document.querySelectorAll('.step-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`step${this.currentStep}`).classList.add('active');
  }

  /**
   * Navigate to specific step
   */
  goToStep(step) {
    if (step < 1 || step > 4) return;
    
    // Validate transitions
    if (step === 2 && !this.selectedBrowser) {
      this.showMessage('Please select a browser first', 'error');
      return;
    }
    
    if (step === 3 && !this.uploadedFile) {
      this.showMessage('Please upload a bookmark file first', 'error');
      return;
    }
    
    this.currentStep = step;
    this.updateStepDisplay();
    
    // Auto-scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Select browser type
   */
  selectBrowser(browserType) {
    // Remove previous selection
    document.querySelectorAll('.browser-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Select new browser
    document.querySelector(`[data-browser="${browserType}"]`).classList.add('selected');
    this.selectedBrowser = browserType;
    
    // Update instructions
    this.updateExportInstructions(browserType);
    
    // Enable next button
    document.getElementById('nextToUpload').disabled = false;
  }

  /**
   * Update export instructions based on browser
   */
  updateExportInstructions(browser) {
    const instructionsContent = document.getElementById('instructionsContent');
    
    const instructions = {
      chrome: `
        <h4>Chrome Bookmark Export:</h4>
        <ol>
          <li>Open Chrome and go to <code>chrome://bookmarks</code></li>
          <li>Click the three-dot menu (⋮) in the top right</li>
          <li>Select "Export bookmarks"</li>
          <li>Save the HTML file to your computer</li>
          <li>Upload the saved file here</li>
        </ol>
        <p><strong>Supported formats:</strong> HTML, JSON (if using Chrome extension backup)</p>
      `,
      firefox: `
        <h4>Firefox Bookmark Export:</h4>
        <ol>
          <li>Press <code>Ctrl+Shift+B</code> to open Bookmark Manager</li>
          <li>Click "Import and Backup" toolbar button</li>
          <li>Select "Export Bookmarks to HTML..."</li>
          <li>Choose location and save the file</li>
          <li>Upload the saved file here</li>
        </ol>
        <p><strong>Supported formats:</strong> HTML, JSON (if using backup addon)</p>
      `,
      edge: `
        <h4>Edge Bookmark Export:</h4>
        <ol>
          <li>Open Edge and go to <code>edge://favorites</code></li>
          <li>Click the three-dot menu (⋯) near "Favorites"</li>
          <li>Select "Export favorites"</li>
          <li>Save the HTML file to your computer</li>
          <li>Upload the saved file here</li>
        </ol>
        <p><strong>Supported formats:</strong> HTML, JSON (if using backup extension)</p>
      `,
      safari: `
        <h4>Safari Bookmark Export:</h4>
        <ol>
          <li>Open Safari and go to File menu</li>
          <li>Select "Export Bookmarks..."</li>
          <li>Choose location and save as HTML</li>
          <li>Upload the saved file here</li>
        </ol>
        <p><strong>Supported formats:</strong> HTML, PLIST (from ~/Library/Safari/Bookmarks.plist)</p>
      `,
      generic: `
        <h4>Generic Browser Export:</h4>
        <ol>
          <li>Look for bookmark/favorites management in your browser</li>
          <li>Find export or backup option (usually in settings or menu)</li>
          <li>Export as HTML, JSON, or XML format</li>
          <li>Upload the exported file here</li>
        </ol>
        <p><strong>Supported formats:</strong> JSON, HTML, XML, PLIST</p>
      `
    };
    
    instructionsContent.innerHTML = instructions[browser] || instructions.generic;
  }

  /**
   * Handle file drag over
   */
  handleDragOver(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.add('dragover');
  }

  /**
   * Handle file drag leave
   */
  handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.remove('dragover');
  }

  /**
   * Handle file drop
   */
  handleDrop(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.remove('dragover');
    this.handleFileSelect(e.dataTransfer.files);
  }

  /**
   * Handle file selection
   */
  handleFileSelect(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = [
      'application/json',
      'text/html',
      'application/xml',
      'text/xml',
      'application/x-plist'
    ];
    
    const allowedExtensions = ['.json', '.html', '.htm', '.xml', '.plist'];
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      this.showMessage('Please select a valid bookmark file (JSON, HTML, XML, or PLIST)', 'error');
      return;
    }
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      this.showMessage('File is too large. Please select a file smaller than 50MB.', 'error');
      return;
    }
    
    this.uploadedFile = file;
    this.displayFileInfo(file);
    
    // Enable import button
    document.getElementById('startImport').disabled = false;
  }

  /**
   * Display file information
   */
  displayFileInfo(file) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
    document.getElementById('fileType').textContent = this.getFileTypeDescription(file);
    document.getElementById('fileInfo').classList.add('visible');
  }

  /**
   * Remove selected file
   */
  removeFile() {
    this.uploadedFile = null;
    document.getElementById('fileInfo').classList.remove('visible');
    document.getElementById('fileInput').value = '';
    document.getElementById('startImport').disabled = true;
  }

  /**
   * Update import options
   */
  updateImportOptions() {
    this.importOptions.preserveFolders = document.getElementById('preserveFolders').checked;
    this.importOptions.skipDuplicates = document.getElementById('skipDuplicates').checked;
    this.importOptions.validateUrls = document.getElementById('validateUrls').checked;
    this.importOptions.autoIndex = document.getElementById('autoIndex').checked;
  }

  /**
   * Start import process
   */
  async startImportProcess() {
    if (!this.uploadedFile) return;
    
    this.goToStep(3);
    this.updateImportOptions();
    
    try {
      // Read file content
      const content = await this.readFileContent(this.uploadedFile);
      
      // Parse bookmarks based on file type
      const bookmarks = await this.parseBookmarks(content, this.uploadedFile.type || this.getFileType(this.uploadedFile.name));
      
      // Process bookmarks
      await this.processBookmarks(bookmarks);
      
      // Complete import
      this.completeImport();
      
    } catch (error) {
      console.error('Import failed:', error);
      this.showMessage(`Import failed: ${error.message}`, 'error');
    }
  }

  /**
   * Read file content
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse bookmarks from file content
   */
  async parseBookmarks(content, fileType) {
    this.logMessage('Parsing bookmark file...');
    
    let bookmarks = [];
    
    try {
      if (fileType.includes('json')) {
        bookmarks = this.parseJsonBookmarks(content);
      } else if (fileType.includes('html')) {
        bookmarks = this.parseHtmlBookmarks(content);
      } else if (fileType.includes('xml') || fileType.includes('plist')) {
        bookmarks = this.parseXmlBookmarks(content);
      } else {
        throw new Error('Unsupported file format');
      }
      
      this.importStats.total = bookmarks.length;
      this.updateStats();
      
      this.logMessage(`Found ${bookmarks.length} bookmarks to import`);
      return bookmarks;
      
    } catch (error) {
      throw new Error(`Failed to parse bookmarks: ${error.message}`);
    }
  }

  /**
   * Parse JSON bookmarks
   */
  parseJsonBookmarks(content) {
    const data = JSON.parse(content);
    const bookmarks = [];
    
    // Handle different JSON structures
    if (data.roots) {
      // Chrome/Chromium format
      this.extractChromeBookmarks(data.roots, bookmarks);
    } else if (Array.isArray(data)) {
      // Simple array format
      bookmarks.push(...data.filter(item => item.url));
    } else if (data.bookmarks) {
      // Firefox backup format
      this.extractFirefoxBookmarks(data.bookmarks, bookmarks);
    }
    
    return bookmarks;
  }

  /**
   * Extract Chrome-format bookmarks
   */
  extractChromeBookmarks(roots, bookmarks, folderPath = '') {
    Object.values(roots).forEach(root => {
      if (root.children) {
        this.extractChromeChildren(root.children, bookmarks, folderPath);
      }
    });
  }

  /**
   * Extract Chrome bookmark children recursively
   */
  extractChromeChildren(children, bookmarks, folderPath = '') {
    children.forEach(item => {
      if (item.type === 'url' && item.url) {
        bookmarks.push({
          title: item.name || 'Untitled',
          url: item.url,
          folder: folderPath,
          dateAdded: item.date_added ? parseInt(item.date_added) : Date.now(),
          id: item.id || this.generateId()
        });
      } else if (item.type === 'folder' && item.children) {
        const newFolderPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        this.extractChromeChildren(item.children, bookmarks, newFolderPath);
        this.importStats.folders++;
      }
    });
  }

  /**
   * Extract Firefox-format bookmarks
   */
  extractFirefoxBookmarks(bookmarks, result, folderPath = '') {
    bookmarks.forEach(item => {
      if (item.uri) {
        result.push({
          title: item.title || 'Untitled',
          url: item.uri,
          folder: folderPath,
          dateAdded: item.dateAdded || Date.now(),
          id: this.generateId()
        });
      } else if (item.children) {
        const newFolderPath = folderPath ? `${folderPath}/${item.title}` : item.title;
        this.extractFirefoxBookmarks(item.children, result, newFolderPath);
        this.importStats.folders++;
      }
    });
  }

  /**
   * Parse HTML bookmarks
   */
  parseHtmlBookmarks(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const bookmarks = [];
    
    // Find all bookmark links
    const links = doc.querySelectorAll('a[href]');
    links.forEach(link => {
      const url = link.getAttribute('href');
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        // Find folder context
        let folder = '';
        let parent = link.parentElement;
        while (parent) {
          if (parent.tagName === 'H3') {
            folder = parent.textContent.trim();
            break;
          }
          const prevH3 = parent.querySelector('h3');
          if (prevH3) {
            folder = prevH3.textContent.trim();
            break;
          }
          parent = parent.parentElement;
        }
        
        bookmarks.push({
          title: link.textContent.trim() || 'Untitled',
          url: url,
          folder: folder,
          dateAdded: this.parseHtmlDate(link.getAttribute('add_date')) || Date.now(),
          id: this.generateId()
        });
      }
    });
    
    return bookmarks;
  }

  /**
   * Parse XML/PLIST bookmarks
   */
  parseXmlBookmarks(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const bookmarks = [];
    
    // Handle Safari plist format
    const dictElements = doc.querySelectorAll('dict');
    dictElements.forEach(dict => {
      const keys = dict.querySelectorAll('key');
      let title = 'Untitled';
      let url = '';
      
      keys.forEach(key => {
        if (key.textContent === 'URLString') {
          const nextElement = key.nextElementSibling;
          if (nextElement && nextElement.tagName === 'string') {
            url = nextElement.textContent;
          }
        } else if (key.textContent === 'Title') {
          const nextElement = key.nextElementSibling;
          if (nextElement && nextElement.tagName === 'string') {
            title = nextElement.textContent;
          }
        }
      });
      
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        bookmarks.push({
          title: title,
          url: url,
          folder: '',
          dateAdded: Date.now(),
          id: this.generateId()
        });
      }
    });
    
    return bookmarks;
  }

  /**
   * Process bookmarks for import
   */
  async processBookmarks(bookmarks) {
    this.logMessage('Processing bookmarks for import...');
    
    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];
      
      try {
        // Update progress
        this.importStats.processed = i + 1;
        this.updateProgress();
        
        // Skip duplicates if option is enabled
        if (this.importOptions.skipDuplicates && await this.isDuplicateBookmark(bookmark)) {
          this.importStats.skipped++;
          this.logMessage(`Skipped duplicate: ${bookmark.title}`);
          continue;
        }
        
        // Validate URL if option is enabled
        if (this.importOptions.validateUrls && !await this.validateUrl(bookmark.url)) {
          this.importStats.skipped++;
          this.logMessage(`Skipped invalid URL: ${bookmark.url}`);
          continue;
        }
        
        // Import bookmark
        await this.importBookmark(bookmark);
        this.importStats.imported++;
        
        // Auto-index if option is enabled
        if (this.importOptions.autoIndex) {
          await this.indexBookmark(bookmark);
          this.importStats.indexed++;
        }
        
        this.logMessage(`Imported: ${bookmark.title}`);
        
        // Small delay to prevent overwhelming
        if (i % 10 === 0) {
          await this.delay(100);
        }
        
      } catch (error) {
        console.error(`Failed to process bookmark: ${bookmark.title}`, error);
        this.importStats.skipped++;
        this.logMessage(`Failed to import: ${bookmark.title} - ${error.message}`);
      }
      
      this.updateStats();
    }
  }

  /**
   * Check if bookmark is duplicate
   */
  async isDuplicateBookmark(bookmark) {
    // This would check against existing Firefox bookmarks
    // For demo purposes, we'll simulate this
    return Math.random() < 0.1; // 10% chance of duplicate
  }

  /**
   * Validate URL accessibility
   */
  async validateUrl(url) {
    if (!this.importOptions.validateUrls) return true;
    
    try {
      // In a real extension, this would use fetch or similar
      // For demo, we'll simulate validation
      return Math.random() > 0.05; // 95% success rate
    } catch {
      return false;
    }
  }

  /**
   * Import individual bookmark
   */
  async importBookmark(bookmark) {
    // In a real extension, this would use chrome.bookmarks API
    // For demo purposes, we'll simulate the process
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 100);
    });
  }

  /**
   * Index bookmark content
   */
  async indexBookmark(bookmark) {
    // In a real extension, this would trigger content crawling
    // For demo purposes, we'll simulate indexing
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 50);
    });
  }

  /**
   * Update import progress
   */
  updateProgress() {
    const percent = Math.round((this.importStats.processed / this.importStats.total) * 100);
    document.getElementById('progressPercent').textContent = `${percent}%`;
    
    // Update progress ring
    const circle = document.querySelector('.progress-ring-circle');
    const circumference = 2 * Math.PI * 52;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = strokeDashoffset;
    
    if (percent > 0) {
      circle.classList.add('active');
    }
  }

  /**
   * Update statistics display
   */
  updateStats() {
    document.getElementById('totalBookmarks').textContent = this.importStats.total;
    document.getElementById('processedBookmarks').textContent = this.importStats.processed;
    document.getElementById('importedBookmarks').textContent = this.importStats.imported;
    document.getElementById('skippedBookmarks').textContent = this.importStats.skipped;
  }

  /**
   * Add log message
   */
  logMessage(message) {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const now = new Date();
    const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    logEntry.innerHTML = `
      <span class="log-time">${timeStr}</span>
      <span class="log-message">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  /**
   * Complete import process
   */
  completeImport() {
    this.goToStep(4);
    
    // Update final statistics
    document.getElementById('finalImported').textContent = this.importStats.imported;
    document.getElementById('finalFolders').textContent = this.importStats.folders;
    document.getElementById('finalIndexed').textContent = this.importStats.indexed;
  }

  /**
   * Cancel import process
   */
  cancelImport() {
    if (confirm('Are you sure you want to cancel the import? This cannot be undone.')) {
      this.resetImporter();
    }
  }

  /**
   * Reset importer to initial state
   */
  resetImporter() {
    this.currentStep = 1;
    this.selectedBrowser = null;
    this.uploadedFile = null;
    this.importStats = {
      total: 0,
      processed: 0,
      imported: 0,
      skipped: 0,
      folders: 0,
      indexed: 0
    };
    
    // Reset UI
    document.querySelectorAll('.browser-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    this.removeFile();
    document.getElementById('nextToUpload').disabled = true;
    
    this.updateStepDisplay();
  }

  /**
   * Open extension popup
   */
  openExtension() {
    // In a real extension, this would open the popup
    if (typeof chrome !== 'undefined' && chrome.action) {
      chrome.action.openPopup();
    } else {
      window.close();
    }
  }

  /**
   * Go back to extension
   */
  backToExtension() {
    window.close();
  }

  /**
   * Show message to user
   */
  showMessage(message, type = 'info') {
    // Create simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * Utility functions
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileTypeDescription(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    const descriptions = {
      json: 'JSON Bookmark Export',
      html: 'HTML Bookmark Export',
      htm: 'HTML Bookmark Export',
      xml: 'XML Bookmark Export',
      plist: 'Safari Property List'
    };
    return descriptions[ext] || 'Unknown Format';
  }

  getFileType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const types = {
      json: 'application/json',
      html: 'text/html',
      htm: 'text/html',
      xml: 'application/xml',
      plist: 'application/x-plist'
    };
    return types[ext] || 'application/octet-stream';
  }

  parseHtmlDate(dateStr) {
    if (!dateStr) return null;
    const timestamp = parseInt(dateStr);
    return isNaN(timestamp) ? null : timestamp * 1000; // Convert to milliseconds
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the bookmark importer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new BookmarkImporter();
});

console.log('Smart Bookmark Search import tool loaded');