'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Mock bookmark data for demo
const mockBookmarks = [
  {
    id: '1',
    title: 'Advanced React Patterns - Kent C. Dodds',
    url: 'https://kentcdodds.com/blog/advanced-react-patterns',
    description: 'Learn about advanced patterns in React including compound components, flexible compound components, and more.',
    content: 'In this comprehensive guide, we explore advanced React patterns that will help you build more maintainable and flexible React applications. We cover compound components, render props, custom hooks, and advanced component composition techniques. These patterns are essential for building scalable React applications.',
    keywords: ['react', 'javascript', 'patterns', 'components', 'hooks'],
    dateAdded: Date.now() - 86400000,
    wordCount: 2500,
    confidence: 0.95
  },
  {
    id: '2',
    title: 'CSS Grid Complete Guide - CSS Tricks',
    url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
    description: 'A comprehensive guide to CSS Grid, covering all properties and techniques.',
    content: 'CSS Grid Layout is the most powerful layout system available in CSS. It is a 2-dimensional system, meaning it can handle both columns and rows, unlike flexbox which is largely a 1-dimensional system. You work with Grid Layout by applying CSS rules both to a parent element and to that element children.',
    keywords: ['css', 'grid', 'layout', 'responsive', 'web'],
    dateAdded: Date.now() - 172800000,
    wordCount: 3200,
    confidence: 0.88
  },
  {
    id: '3',
    title: 'Node.js Best Practices - GitHub Repository',
    url: 'https://github.com/goldbergyoni/nodebestpractices',
    description: 'A comprehensive collection of Node.js best practices and style guide.',
    content: 'The Node.js best practices list covers more than 100 best practices, style guides, and architectural tips. This repository includes practical recommendations for project structure, error handling, security, performance, and code style. It is regularly updated by the community and covers both beginner and advanced topics.',
    keywords: ['nodejs', 'javascript', 'backend', 'best-practices', 'performance'],
    dateAdded: Date.now() - 259200000,
    wordCount: 4800,
    confidence: 0.82
  },
  {
    id: '4',
    title: 'TypeScript Deep Dive - Basarat Ali Syed',
    url: 'https://basarat.gitbook.io/typescript/',
    description: 'An online book covering TypeScript in depth with practical examples.',
    content: 'TypeScript Deep Dive is the definitive guide to TypeScript. The book covers everything from basic types to advanced features like conditional types, mapped types, and template literal types. It includes practical examples and real-world use cases that will help you master TypeScript development.',
    keywords: ['typescript', 'javascript', 'types', 'development', 'programming'],
    dateAdded: Date.now() - 345600000,
    wordCount: 5600,
    confidence: 0.91
  },
  {
    id: '5',
    title: 'Modern JavaScript Features - MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    description: 'Complete guide to JavaScript features and modern syntax.',
    content: 'Learn about modern JavaScript features including ES6+ syntax, async/await, destructuring, arrow functions, classes, modules, and more. This guide covers both fundamental concepts and advanced features that are essential for modern web development.',
    keywords: ['javascript', 'es6', 'async', 'modules', 'syntax'],
    dateAdded: Date.now() - 432000000,
    wordCount: 3800,
    confidence: 0.87
  },
  {
    id: '6',
    title: 'Firefox Extension Development Guide',
    url: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions',
    description: 'Complete guide to developing Firefox extensions with WebExtensions API.',
    content: 'WebExtensions are the way to develop add-ons for Firefox. The WebExtensions system provides cross-browser compatibility, making it easier to port extensions. Learn about manifest files, background scripts, content scripts, and the various APIs available for extension development.',
    keywords: ['firefox', 'extensions', 'webextensions', 'browser', 'addon'],
    dateAdded: Date.now() - 518400000,
    wordCount: 4200,
    confidence: 0.93
  }
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(mockBookmarks)
  const [isSearching, setIsSearching] = useState(false)
  const [showAutoRedirect, setShowAutoRedirect] = useState(false)
  const [stats, setStats] = useState({
    totalBookmarks: mockBookmarks.length,
    lastCrawl: Date.now() - 3600000,
    totalWords: mockBookmarks.reduce((sum, bookmark) => sum + bookmark.wordCount, 0)
  })

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(mockBookmarks)
      return
    }

    setIsSearching(true)
    
    // Simulate search delay
    const timer = setTimeout(() => {
      const filtered = mockBookmarks.filter(bookmark => {
        const searchLower = searchQuery.toLowerCase()
        return (
          bookmark.title.toLowerCase().includes(searchLower) ||
          bookmark.description.toLowerCase().includes(searchLower) ||
          bookmark.content.toLowerCase().includes(searchLower) ||
          bookmark.keywords.some(keyword => keyword.includes(searchLower))
        )
      })
      
      // Check for high confidence auto-redirect
      if (filtered.length > 0 && filtered[0].confidence > 0.9 && searchQuery.length > 3) {
        setShowAutoRedirect(true)
        setTimeout(() => setShowAutoRedirect(false), 3000)
      }
      
      setSearchResults(filtered)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 30) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500'
    if (confidence >= 0.7) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'High'
    if (confidence >= 0.7) return 'Medium'
    return 'Low'
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart Bookmark Search</h1>
                <p className="text-sm text-gray-600">Firefox Extension Demo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => window.open('/import', '_blank')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12L16,16H13.5V19H10.5V16H8L12,12Z"/>
                </svg>
                Import Bookmarks
              </Button>
              <Button variant="outline" className="text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Install Extension
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="extension">Extension</TabsTrigger>
          </TabsList>

          {/* Demo Tab */}
          <TabsContent value="demo" className="space-y-6">
            {/* Auto-redirect notification */}
            {showAutoRedirect && (
              <Alert className="border-green-200 bg-green-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <AlertDescription className="text-green-800">
                  High confidence match found! In the real extension, this would auto-redirect you to the best result.
                </AlertDescription>
              </Alert>
            )}

            {/* Search Interface */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Search Your Bookmarks</CardTitle>
                <CardDescription>
                  Try searching for: "react patterns", "css grid", "typescript", "javascript"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search through bookmark content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 text-lg"
                  />
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </div>
                
                {/* Search Stats */}
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} 
                    {searchQuery && ` for "${searchQuery}"`}
                  </span>
                  {isSearching && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <div className="space-y-4">
              {searchResults.map((bookmark) => (
                <Card key={bookmark.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-indigo-600 hover:text-indigo-800 mb-1">
                          {bookmark.title}
                        </h3>
                        <p className="text-sm text-green-600 mb-2 font-medium">
                          {bookmark.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className={`w-2 h-2 rounded-full ${getConfidenceColor(bookmark.confidence)}`}></div>
                        <span className="text-xs text-gray-500">{getConfidenceText(bookmark.confidence)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {bookmark.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {bookmark.keywords.slice(0, 4).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDate(bookmark.dateAdded)}</span>
                        <span>{bookmark.wordCount.toLocaleString()} words</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Extension Features</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Transform your Firefox bookmarks into a powerful, searchable knowledge base
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-600">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  <CardTitle>Intelligent Content Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Search through the full text content of all your bookmarked pages, not just titles. Find any word or phrase that appears in the content.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <CardTitle>Smart Auto-Redirect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    High-confidence matches automatically redirect you to the best result. Configurable threshold and visual confirmation.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-purple-600">
                      <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                    </svg>
                  </div>
                  <CardTitle>Automatic Content Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Automatically crawls and analyzes bookmarked pages. Extracts text, keywords, and metadata for comprehensive indexing.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                    </svg>
                  </div>
                  <CardTitle>Fuzzy Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Works with typos and partial matches. Advanced algorithms ensure you find what you're looking for even with imperfect queries.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V19H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
                    </svg>
                  </div>
                  <CardTitle>Privacy-Focused</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    All processing happens locally on your device. No external servers, no tracking, optional encryption for sensitive content.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                      <path d="M13,17H11V15H13V17M13,13H11V7H13V13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                    </svg>
                  </div>
                  <CardTitle>Fast & Responsive</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Lightning-fast search results with relevance ranking. Real-time suggestions, keyboard navigation, modern interface.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-teal-600">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12L16,16H13.5V19H10.5V16H8L12,12Z"/>
                    </svg>
                  </div>
                  <CardTitle>Universal Import Tool</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Import bookmarks from any browser using JSON, HTML, or other export formats. Supports Chrome, Firefox, Edge, Safari, and more.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-pink-600">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                    </svg>
                  </div>
                  <CardTitle>Batch Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Process thousands of bookmarks efficiently with batch import, duplicate detection, URL validation, and progress tracking.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Extension Tab */}
          <TabsContent value="extension" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Firefox Extension</h2>
                <p className="text-lg text-gray-600">
                  Download and install the Smart Bookmark Search extension for Firefox
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Extension Files</CardTitle>
                    <CardDescription>
                      Complete Firefox extension ready for installation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-2">Extension Structure:</h4>
                      <pre className="text-sm text-gray-700">
{`bookmark-search-extension/
├── manifest.json
├── background/
│   ├── service-worker.js
│   ├── bookmark-crawler.js
│   └── search-engine.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── content-script.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
└── assets/icons/`}
                      </pre>
                    </div>
                    
                    <Button className="w-full mb-2" size="lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                      Download Extension Files
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open('/import', '_blank')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12L16,16H13.5V19H10.5V16H8L12,12Z"/>
                      </svg>
                      Try Import Tool
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Installation Guide</CardTitle>
                    <CardDescription>
                      How to install the extension in Firefox
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-medium text-indigo-600">1</span>
                        </div>
                        <p className="text-sm text-gray-700">Open Firefox and navigate to <code className="bg-gray-100 px-1 rounded">about:debugging</code></p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-medium text-indigo-600">2</span>
                        </div>
                        <p className="text-sm text-gray-700">Click "This Firefox" in the left sidebar</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-medium text-indigo-600">3</span>
                        </div>
                        <p className="text-sm text-gray-700">Click "Load Temporary Add-on"</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-medium text-indigo-600">4</span>
                        </div>
                        <p className="text-sm text-gray-700">Select the <code className="bg-gray-100 px-1 rounded">manifest.json</code> file from the extension directory</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-medium text-indigo-600">5</span>
                        </div>
                        <p className="text-sm text-gray-700">The extension will be installed and ready to use!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Extension Statistics</CardTitle>
                  <CardDescription>Current demo statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-indigo-600">{stats.totalBookmarks}</div>
                      <div className="text-sm text-gray-600">Indexed Bookmarks</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">{(stats.totalWords / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-gray-600">Words Indexed</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-600">{formatDate(stats.lastCrawl)}</div>
                      <div className="text-sm text-gray-600">Last Update</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              Made with ❤️ for better browsing • 
              <a href="#" className="text-indigo-600 hover:text-indigo-800 ml-1">Smart Bookmark Search Extension</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}