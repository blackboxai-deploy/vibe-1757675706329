'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ImportPage() {
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importStats, setImportStats] = useState({
    total: 0,
    imported: 0,
    skipped: 0,
    duplicates: 0
  })

  const browsers = [
    {
      id: 'chrome',
      name: 'Google Chrome',
      description: 'Import from Chrome bookmarks export',
      formats: ['JSON', 'HTML'],
      color: 'bg-blue-500',
      instructions: [
        'Open Chrome and navigate to chrome://bookmarks',
        'Click the three-dot menu (⋮) in the top right corner',
        'Select "Export bookmarks"',
        'Save the HTML file to your computer',
        'Upload the saved file below'
      ]
    },
    {
      id: 'firefox',
      name: 'Mozilla Firefox',
      description: 'Import from Firefox bookmarks export',
      formats: ['JSON', 'HTML'],
      color: 'bg-orange-500',
      instructions: [
        'Press Ctrl+Shift+B to open Bookmark Manager',
        'Click "Import and Backup" in the toolbar',
        'Select "Export Bookmarks to HTML..."',
        'Choose a location and save the file',
        'Upload the saved file below'
      ]
    },
    {
      id: 'edge',
      name: 'Microsoft Edge',
      description: 'Import from Edge favorites export',
      formats: ['JSON', 'HTML'],
      color: 'bg-blue-600',
      instructions: [
        'Open Edge and navigate to edge://favorites',
        'Click the three-dot menu (⋯) near "Favorites"',
        'Select "Export favorites"',
        'Save the HTML file to your computer',
        'Upload the saved file below'
      ]
    },
    {
      id: 'safari',
      name: 'Safari',
      description: 'Import from Safari bookmarks export',
      formats: ['HTML', 'PLIST'],
      color: 'bg-cyan-500',
      instructions: [
        'Open Safari and go to the File menu',
        'Select "Export Bookmarks..."',
        'Choose a location and save as HTML',
        'Upload the saved file below'
      ]
    }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const simulateImport = async () => {
    if (!importFile || !selectedBrowser) return

    setIsImporting(true)
    setImportProgress(0)

    // Simulate parsing the file
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate finding bookmarks
    const mockTotal = Math.floor(Math.random() * 500) + 100
    setImportStats(prev => ({ ...prev, total: mockTotal }))

    // Simulate import progress
    for (let i = 0; i <= 100; i += 2) {
      setImportProgress(i)
      
      // Update stats
      const imported = Math.floor((i / 100) * mockTotal * 0.9)
      const skipped = Math.floor((i / 100) * mockTotal * 0.08)
      const duplicates = Math.floor((i / 100) * mockTotal * 0.02)
      
      setImportStats({
        total: mockTotal,
        imported,
        skipped,
        duplicates
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsImporting(false)
  }

  const resetImport = () => {
    setSelectedBrowser(null)
    setImportFile(null)
    setImportProgress(0)
    setIsImporting(false)
    setImportStats({ total: 0, imported: 0, skipped: 0, duplicates: 0 })
  }

  const getBrowserData = (id: string) => browsers.find(b => b.id === id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12L16,16H13.5V19H10.5V16H8L12,12Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bookmark Import Tool</h1>
                <p className="text-sm text-gray-600">Import bookmarks from any browser</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              Back to Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {importProgress === 100 && !isImporting ? (
          // Success State
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Complete!</h2>
              <p className="text-gray-600 mb-8">Your bookmarks have been successfully processed and are ready to use.</p>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{importStats.total}</div>
                  <div className="text-sm text-gray-600">Total Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importStats.imported}</div>
                  <div className="text-sm text-gray-600">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importStats.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{importStats.duplicates}</div>
                  <div className="text-sm text-gray-600">Duplicates</div>
                </div>
              </div>

              <Alert className="mb-6 text-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                  <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                <AlertDescription className="text-gray-700">
                  <strong>Next Steps:</strong> In the real Firefox extension, these bookmarks would be added to your browser and automatically indexed for searching. Use Ctrl+Shift+F to open the search interface.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={resetImport}>
                  Import More Bookmarks
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Back to Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="select" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="select" disabled={isImporting}>Select Browser</TabsTrigger>
              <TabsTrigger value="upload" disabled={!selectedBrowser || isImporting}>Upload File</TabsTrigger>
              <TabsTrigger value="import" disabled={!importFile || isImporting}>Import</TabsTrigger>
            </TabsList>

            {/* Browser Selection */}
            <TabsContent value="select">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Browser</CardTitle>
                  <CardDescription>
                    Select the browser where your bookmarks are currently stored
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {browsers.map((browser) => (
                      <div
                        key={browser.id}
                        onClick={() => setSelectedBrowser(browser.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedBrowser === browser.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 ${browser.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{browser.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{browser.description}</p>
                            <div className="flex gap-2 mt-2">
                              {browser.formats.map((format) => (
                                <Badge key={format} variant="secondary" className="text-xs">
                                  {format}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedBrowser && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        How to export from {getBrowserData(selectedBrowser)?.name}:
                      </h4>
                      <ol className="space-y-2">
                        {getBrowserData(selectedBrowser)?.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="bg-indigo-100 text-indigo-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* File Upload */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Bookmark File</CardTitle>
                  <CardDescription>
                    Upload the bookmark export file from {getBrowserData(selectedBrowser!)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {!importFile ? (
                      <div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12L16,16H13.5V19H10.5V16H8L12,12Z"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Upload your bookmark file
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Drag and drop your file here, or click to browse
                        </p>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          accept=".json,.html,.htm,.xml,.plist"
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button variant="outline" asChild>
                            <span className="cursor-pointer">Choose File</span>
                          </Button>
                        </label>
                        <div className="flex gap-2 justify-center mt-4">
                          {getBrowserData(selectedBrowser!)?.formats.map((format) => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">File Ready</h3>
                        <p className="text-gray-600 mb-2">{importFile.name}</p>
                        <p className="text-sm text-gray-500 mb-4">
                          {Math.round(importFile.size / 1024)} KB
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setImportFile(null)}
                          className="mr-2"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {importFile && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold text-gray-900">Import Options</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Preserve folder structure</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Skip duplicate bookmarks</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Validate URL accessibility</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Auto-index content</span>
                        </label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Import Process */}
            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isImporting ? 'Importing Bookmarks...' : 'Ready to Import'}
                  </CardTitle>
                  <CardDescription>
                    {isImporting 
                      ? 'Processing your bookmarks and adding them to the search index'
                      : `Import ${importFile?.name} from ${getBrowserData(selectedBrowser!)?.name}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isImporting && importProgress === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-600">
                          <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Import</h3>
                      <p className="text-gray-600 mb-6">
                        Click the button below to start importing your bookmarks
                      </p>
                      <Button onClick={simulateImport} size="lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12L16,16H13.5V19H10.5V16H8L12,12Z"/>
                        </svg>
                        Start Import
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm text-gray-500">{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{importStats.total}</div>
                          <div className="text-sm text-gray-600">Total Found</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{importStats.imported}</div>
                          <div className="text-sm text-gray-600">Imported</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{importStats.skipped}</div>
                          <div className="text-sm text-gray-600">Skipped</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{importStats.duplicates}</div>
                          <div className="text-sm text-gray-600">Duplicates</div>
                        </div>
                      </div>

                      {isImporting && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium text-blue-700">
                              Processing bookmarks and building search index...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}