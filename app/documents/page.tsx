'use client'

import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Eye,
  Share2,
  History,
  Lock,
  Unlock,
  Calendar,
  User,
  ArrowLeft,
  Grid,
  List,
  MoreVertical,
  Settings,
  Star,
  File,
  FileEdit,
  BarChart3,
  Image,
  Video,
  Music,
  Archive,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DocumentUpload } from '@/components/documents/document-upload'
import { FolderManager } from '@/components/documents/folder-manager'
import { DocumentVersions } from '@/components/documents/document-versions'

interface Document {
  id: string
  name: string
  originalName: string
  fileType: string
  fileSize: number
  filePath: string
  fileUrl: string
  folderId?: string
  folderName?: string
  version: number
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  isLocked: boolean
  lockedBy?: string
  lockedAt?: string
  tags: string[]
  description: string
  uploadedBy: string
  uploadedByName: string
  createdAt: string
  updatedAt: string
  lastAccessedAt?: string
  downloadCount: number
  module: string
  entityId?: string
  isPublic: boolean
  expiresAt?: string
  category: string
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterModule, setFilterModule] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const canManage = hasFullAccess('settings') // Document management requires settings access
  const canRead = hasModuleAccess('settings')

  useEffect(() => {
    fetchDocuments()
  }, [currentFolder])

  const fetchDocuments = async () => {
    try {
      const supabase = createClient()
      let query = supabase
        .from('documents')
        .select(`
          *,
          folders:folderId (
            name
          ),
          profiles:uploadedBy (
            fullName,
            email
          )
        `)
        .eq('status', 'ACTIVE')
        .order('createdAt', { ascending: false })

      if (currentFolder) {
        query = query.eq('folderId', currentFolder)
      } else {
        query = query.is('folderId', null)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedDocuments = (data || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        originalName: doc.originalName,
        fileType: doc.fileType,
        fileSize: doc.fileSize || 0,
        filePath: doc.filePath,
        fileUrl: doc.fileUrl,
        folderId: doc.folderId,
        folderName: doc.folders?.name || '',
        version: doc.version || 1,
        status: doc.status || 'ACTIVE',
        isLocked: doc.isLocked || false,
        lockedBy: doc.lockedBy,
        lockedAt: doc.lockedAt,
        tags: doc.tags || [],
        description: doc.description || '',
        uploadedBy: doc.uploadedBy,
        uploadedByName: doc.profiles?.fullName || doc.profiles?.email || 'Unknown',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        lastAccessedAt: doc.lastAccessedAt,
        downloadCount: doc.downloadCount || 0,
        module: doc.module || 'general',
        entityId: doc.entityId,
        isPublic: doc.isPublic || false,
        expiresAt: doc.expiresAt,
        category: doc.category || 'general'
      }))

      setDocuments(formattedDocuments)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
    if (type.includes('doc') || type.includes('word')) return <FileEdit className="h-6 w-6 text-blue-500" />
    if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) return <BarChart3 className="h-6 w-6 text-green-500" />
    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return <Image className="h-6 w-6 text-purple-500" />
    if (type.includes('video')) return <Video className="h-6 w-6 text-orange-500" />
    if (type.includes('audio')) return <Music className="h-6 w-6 text-pink-500" />
    if (type.includes('zip') || type.includes('archive')) return <Archive className="h-6 w-6 text-gray-500" />
    return <FileText className="h-6 w-6 text-gray-500" />
  }

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadDocument = async (document: Document) => {
    try {
      const supabase = createClient()

      // Increment download count
      await supabase
        .from('documents')
        .update({
          downloadCount: document.downloadCount + 1,
          lastAccessedAt: new Date().toISOString()
        })
        .eq('id', document.id)

      // Download file
      const link = window.document.createElement('a')
      link.href = document.fileUrl
      link.download = document.originalName
      link.click()

      // Refresh data
      fetchDocuments()

    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const toggleDocumentLock = async (document: Document) => {
    try {
      const supabase = createClient()

      const updateData: any = {
        isLocked: !document.isLocked,
        updatedAt: new Date().toISOString()
      }

      if (!document.isLocked) {
        updateData.lockedBy = user?.id
        updateData.lockedAt = new Date().toISOString()
      } else {
        updateData.lockedBy = null
        updateData.lockedAt = null
      }

      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', document.id)

      if (error) throw error

      fetchDocuments()

    } catch (error) {
      console.error('Error toggling document lock:', error)
      alert('Error updating document lock status.')
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === '' || doc.fileType.toLowerCase().includes(filterType.toLowerCase())
    const matchesModule = filterModule === '' || doc.module === filterModule
    const matchesCategory = filterCategory === '' || doc.category === filterCategory

    return matchesSearch && matchesType && matchesModule && matchesCategory
  })

  const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0)
  const totalDownloads = documents.reduce((sum, doc) => sum + doc.downloadCount, 0)
  const recentDocuments = documents.filter(doc => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return new Date(doc.createdAt) > dayAgo
  }).length

  if (!canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access Document Management.</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
                <p className="text-sm text-gray-600">Manage files with version control and collaboration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                {canManage ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Full Access
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 text-yellow-600" />
                    Read Only
                  </>
                )}
              </Badge>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                {canManage && (
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Upload Documents</DialogTitle>
                      </DialogHeader>
                      <DocumentUpload
                        folderId={currentFolder || undefined}
                        module="general"
                        onUploadComplete={(uploadedDocuments) => {
                          console.log('Uploaded documents:', uploadedDocuments)
                          setUploadDialogOpen(false)
                          fetchDocuments()
                        }}
                        onClose={() => setUploadDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
                  <File className="h-4 w-4 mr-2" />
                  Total Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{documents.length}</div>
                <p className="text-xs text-purple-600">{recentDocuments} added today</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Total Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{(totalDownloads ?? 0).toLocaleString()}</div>
                <p className="text-xs text-blue-600">All time downloads</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Storage Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{getFileSize(totalSize)}</div>
                <p className="text-xs text-green-600">Total file size</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Locked Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {documents.filter(d => d.isLocked).length}
                </div>
                <p className="text-xs text-orange-600">Currently locked</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents, folders, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">Documents</option>
                    <option value="xls">Spreadsheets</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                  </select>

                  <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Modules</option>
                    <option value="sales">Sales</option>
                    <option value="clients">Clients</option>
                    <option value="inventory">Inventory</option>
                    <option value="purchase">Purchase</option>
                    <option value="finance">Finance</option>
                    <option value="hr">HR</option>
                    <option value="general">General</option>
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Categories</option>
                    <option value="contract">Contracts</option>
                    <option value="invoice">Invoices</option>
                    <option value="report">Reports</option>
                    <option value="presentation">Presentations</option>
                    <option value="image">Images</option>
                    <option value="other">Other</option>
                  </select>

                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Folder Manager */}
          <div className="mb-6">
            <FolderManager
              currentFolderId={currentFolder || undefined}
              module="general"
              onFolderChange={setCurrentFolder}
              readOnly={!canManage}
            />
          </div>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-500">Loading documents...</div>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterType || filterModule ? 'No documents match your search criteria.' : 'Upload your first document to get started.'}
                  </p>
                  {canManage && !searchTerm && !filterType && !filterModule && (
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center space-x-4">
                          <div className="flex items-center justify-center">{getFileIcon(document.fileType)}</div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="font-semibold text-gray-900">{document.name}</h3>
                              {document.isLocked && (
                                <Badge className="bg-red-100 text-red-700 text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                              {document.version > 1 && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                  v{document.version}
                                </Badge>
                              )}
                              {document.isPublic && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  Public
                                </Badge>
                              )}
                              {document.category && document.category !== 'general' && (
                                <Badge variant="outline" className="text-xs">
                                  {document.category}
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm text-gray-600 mb-2">
                              {document.description && (
                                <span className="mr-4">{document.description}</span>
                              )}
                              <span className="text-gray-500">
                                {getFileSize(document.fileSize)} • {document.fileType.toUpperCase()}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {document.uploadedByName}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(document.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Download className="h-3 w-3 mr-1" />
                                {document.downloadCount} downloads
                              </span>
                              {document.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {document.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {document.tags.length > 2 && (
                                    <span className="text-gray-400">+{document.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(document)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>

                          {canManage && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(document)
                                  setVersionDialogOpen(true)
                                }}
                              >
                                <History className="h-4 w-4 mr-1" />
                                Versions
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleDocumentLock(document)}
                              >
                                {document.isLocked ? (
                                  <Unlock className="h-4 w-4 mr-1" />
                                ) : (
                                  <Lock className="h-4 w-4 mr-1" />
                                )}
                                {document.isLocked ? 'Unlock' : 'Lock'}
                              </Button>

                              <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Document Versions Dialog */}
      {selectedDocument && (
        <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Document Versions - {selectedDocument.name}</DialogTitle>
            </DialogHeader>
            <DocumentVersions
              documentId={selectedDocument.id}
              currentVersion={selectedDocument.version}
              onVersionChange={(version) => {
                console.log('Version changed:', version)
                fetchDocuments()
              }}
              readOnly={!canManage}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}