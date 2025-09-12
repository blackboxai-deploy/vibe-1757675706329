# Smart Bookmark Search Firefox Extension

Transform your Firefox bookmarks into an intelligent search engine that lets you search through the actual content of your bookmarked pages, not just their titles.

## Features

### 🔍 **Intelligent Content Search**
- Search through the full text content of all your bookmarked pages
- Find pages by any word or phrase that appears in the content
- Smart auto-redirect for high-confidence matches
- Fuzzy search with typo tolerance

### 📚 **Automatic Content Analysis**
- Automatically crawls and analyzes bookmarked pages
- Extracts and indexes text content, descriptions, and keywords
- Updates content in the background to keep your index fresh
- Respects robots.txt and website crawling guidelines

### ⚡ **Fast and Responsive**
- Lightning-fast search results with relevance ranking
- Real-time search suggestions as you type
- Keyboard navigation support
- Clean, modern interface

### 🎯 **Smart Auto-Redirect**
- Automatically redirect to the best match for high-confidence searches
- Configurable confidence threshold
- Visual confirmation before redirect

### 🛡️ **Privacy-Focused**
- All processing happens locally on your device
- No external servers or data transmission
- Encrypted local storage option
- Respects private browsing settings

## Installation

### From Firefox Add-ons Store
1. Visit the [Firefox Add-ons page](https://addons.mozilla.org) (coming soon)
2. Search for "Smart Bookmark Search"
3. Click "Add to Firefox"

### Manual Installation (Developer Mode)
1. Download the extension files
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the extension directory

## Usage

### Basic Search
1. **Keyboard Shortcut**: Press `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac)
2. **Toolbar Icon**: Click the Smart Bookmark Search icon in your toolbar
3. Type your search query in the popup
4. Results appear instantly with relevance scoring

### Search Features
- **Exact Match**: Use quotes for exact phrases: `"specific phrase"`
- **Fuzzy Search**: Works with typos and partial matches
- **Content Search**: Finds text anywhere in the bookmarked page content
- **Auto-redirect**: High-confidence matches redirect automatically

### Keyboard Navigation
- `↑/↓ Arrow Keys`: Navigate through results
- `Enter`: Open selected result
- `Escape`: Clear search and close popup

## Settings & Configuration

Access settings through the extension popup → Settings, or right-click the toolbar icon → Options.

### Search Settings
- **Auto-redirect Threshold**: Set confidence level for automatic redirects (50-95%)
- **Results Limit**: Maximum number of results to display (5-50)
- **Fuzzy Search**: Enable/disable typo tolerance
- **Content Search**: Include full page content in searches

### Crawling Settings
- **Update Frequency**: How often to refresh bookmark content (daily/weekly/monthly)
- **Timeout**: Maximum time to wait for each page (10-60 seconds)
- **Robots.txt Respect**: Follow website crawling guidelines
- **Skip Login Pages**: Avoid pages requiring authentication

### Privacy Options
- **Search History**: Store searches for better suggestions
- **Incognito Exclusion**: Don't index private browsing bookmarks
- **Storage Encryption**: Encrypt locally stored content

## How It Works

1. **Initial Setup**: The extension scans all your Firefox bookmarks
2. **Content Crawling**: Each bookmarked page is fetched and analyzed
3. **Text Extraction**: Clean text content is extracted from HTML
4. **Indexing**: Content is processed and stored in a searchable index
5. **Search**: Your queries are matched against the indexed content
6. **Results**: Ranked results with relevance scoring and snippets

## Technical Details

### Architecture
- **Background Service Worker**: Handles bookmark management and content crawling
- **Search Engine**: TF-IDF scoring with fuzzy matching algorithms
- **Content Scripts**: Extract and analyze page content
- **IndexedDB Storage**: Efficient local data storage
- **Modern UI**: Clean, responsive interface with Tailwind CSS

### Performance
- **Incremental Updates**: Only re-crawl changed bookmarks
- **Batch Processing**: Process multiple bookmarks efficiently
- **Background Operation**: Crawling doesn't block browser usage
- **Compressed Storage**: Efficient content storage and retrieval

### Privacy & Security
- **Local Processing**: All data stays on your device
- **No Tracking**: No analytics or user tracking
- **Encrypted Storage**: Optional encryption for sensitive content
- **Permissions**: Only requests necessary browser permissions

## Permissions Explained

- **`bookmarks`**: Access your Firefox bookmarks to build the search index
- **`activeTab`**: Access current tab content for real-time analysis
- **`storage`**: Store search index and settings locally
- **`webRequest`**: Monitor network requests during content crawling
- **`host_permissions`**: Access websites to crawl bookmark content

## Troubleshooting

### Search Not Working
1. Check if bookmarks have been indexed (see Settings → Index Management)
2. Try refreshing the bookmark index
3. Ensure the extension has proper permissions

### Content Not Found
1. Some pages may block automated content extraction
2. Login-required pages are skipped by default
3. Check crawling settings and timeout values

### Performance Issues
1. Large bookmark collections may take time to index initially
2. Reduce crawl frequency if experiencing slowdowns
3. Clear and rebuild index if corrupted

### Index Management
- **Refresh Index**: Re-crawl all bookmarks to update content
- **Clear Index**: Delete all stored content (requires re-indexing)
- **Export/Import**: Backup and restore extension settings

## Development

### Building from Source
```bash
# Clone the repository
git clone [repository-url]
cd smart-bookmark-search

# Load in Firefox
# 1. Open about:debugging
# 2. Click "Load Temporary Add-on"
# 3. Select manifest.json
```

### File Structure
```
bookmark-search-extension/
├── manifest.json              # Extension configuration
├── background/
│   ├── service-worker.js     # Main background logic
│   ├── bookmark-crawler.js   # Content crawling
│   └── search-engine.js      # Search and indexing
├── popup/
│   ├── popup.html           # Extension popup
│   ├── popup.css            # Popup styling
│   └── popup.js             # Popup functionality
├── content/
│   └── content-script.js    # Page content extraction
├── options/
│   ├── options.html         # Settings page
│   ├── options.css          # Settings styling
│   └── options.js           # Settings functionality
└── assets/
    └── icons/               # Extension icons
```

## Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests for any improvements.

### Areas for Contribution
- Algorithm improvements for search ranking
- UI/UX enhancements
- Performance optimizations
- Additional language support
- Bug fixes and testing

## Support

- **Issues**: Report bugs on GitHub Issues
- **Feature Requests**: Submit enhancement requests
- **Documentation**: Help improve documentation
- **Translation**: Assist with internationalization

## Changelog

### Version 1.0.0
- Initial release
- Core search functionality
- Automatic content crawling
- Modern popup interface
- Comprehensive settings page
- Privacy-focused design

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Firefox WebExtensions API
- Modern web technologies (IndexedDB, Web Workers, etc.)
- Open-source community feedback and contributions

---

**Made with ❤️ for better browsing**

Transform your bookmarks from a static list into a powerful, searchable knowledge base. Never lose track of that important page again!