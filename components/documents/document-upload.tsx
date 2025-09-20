'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Folder,
  Tag,
  Loader2,
  Globe,
  Lock,
  Calendar,
  FileText,
  FileEdit,
  BarChart3,
  Image,
  Video,
  Music,
  Archive
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DocumentUploadProps {
  folderId?: string
  module?: string
  entityId?: string
  onUploadComplete?: (documents: any[]) => void
  onClose?: () => void
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

export function DocumentUpload({
  folderId,
  module = 'general',
  entityId,
  onUploadComplete,
  onClose
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [metadata, setMetadata] = useState({
    description: '',
    tags: '',
    isPublic: false,
    expiresAt: '',
    category: 'general'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])

    const newFiles: UploadFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
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
    return <File className="h-6 w-6 text-gray-500" />
  }

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    const supabase = createClient()
    const uploadedDocuments = []

    try {
      for (const fileItem of files) {
        if (fileItem.status !== 'pending') continue

        // Update status to uploading
        setFiles(prev => prev.map(f =>
          f.id === fileItem.id ? { ...f, status: 'uploading' as const } : f
        ))

        try {
          // Generate unique file name
          const fileExt = fileItem.file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
          const filePath = `documents/${module}/${fileName}`

          // Upload file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, fileItem.file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath)

          // Prepare document metadata
          const tags = metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean)

          const documentData = {
            name: fileItem.file.name.split('.').slice(0, -1).join('.'),
            originalName: fileItem.file.name,
            fileType: fileItem.file.type || 'application/octet-stream',
            fileSize: fileItem.file.size,
            filePath: filePath,
            fileUrl: urlData.publicUrl,
            folderId: folderId || null,
            version: 1,
            status: 'ACTIVE',
            isLocked: false,
            tags: tags,
            description: metadata.description,
            module: module,
            entityId: entityId || null,
            isPublic: metadata.isPublic,
            expiresAt: metadata.expiresAt || null,
            category: metadata.category,
            downloadCount: 0,
            createdBy: (await supabase.auth.getUser()).data.user?.id,
            uploadedBy: (await supabase.auth.getUser()).data.user?.id
          }

          // Save document record to database
          const { data: documentRecord, error: dbError } = await supabase
            .from('documents')
            .insert([documentData])
            .select()
            .single()

          if (dbError) throw dbError

          uploadedDocuments.push(documentRecord)

          // Update status to success
          setFiles(prev => prev.map(f =>
            f.id === fileItem.id ? {
              ...f,
              status: 'success' as const,
              progress: 100,
              url: urlData.publicUrl
            } : f
          ))

        } catch (error) {
          console.error('Error uploading file:', error)

          // Update status to error
          setFiles(prev => prev.map(f =>
            f.id === fileItem.id ? {
              ...f,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Upload failed'
            } : f
          ))
        }
      }

      // Call completion callback
      if (onUploadComplete && uploadedDocuments.length > 0) {
        onUploadComplete(uploadedDocuments)
      }

      // Clear successful uploads after a delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status === 'error'))
        if (files.every(f => f.status === 'success')) {
          setFiles([])
        }
      }, 2000)

    } catch (error) {
      console.error('Upload process error:', error)
    } finally {
      setUploading(false)
    }
  }

  const totalFiles = files.length
  const successCount = files.filter(f => f.status === 'success').length
  const errorCount = files.filter(f => f.status === 'error').length
  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'uploading').length

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Documents
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Files</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <File className="h-4 w-4 mr-2" />
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
          />
        </div>

        {/* File Metadata */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the documents..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={metadata.tags}
                  onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={metadata.category}
                  onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="contract">Contract</option>
                  <option value="invoice">Invoice</option>
                  <option value="report">Report</option>
                  <option value="presentation">Presentation</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={metadata.isPublic}
                    onCheckedChange={(checked) => setMetadata(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label htmlFor="isPublic" className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    Public access
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="expiresAt">Expires At (optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={metadata.expiresAt}
                  onChange={(e) => setMetadata(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Files to Upload ({totalFiles})</h3>
              <div className="flex items-center space-x-4 text-sm">
                {successCount > 0 && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {successCount} successful
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge className="bg-red-100 text-red-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errorCount} failed
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-700">
                    <Loader2 className="h-3 w-3 mr-1" />
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((fileItem) => (
                <div key={fileItem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center">{getFileIcon(fileItem.file.type)}</div>
                    <div>
                      <div className="font-medium text-gray-900">{fileItem.file.name}</div>
                      <div className="text-sm text-gray-500">
                        {getFileSize(fileItem.file.size)} • {fileItem.file.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {fileItem.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {fileItem.status === 'uploading' && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading...
                      </Badge>
                    )}
                    {fileItem.status === 'success' && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    )}
                    {fileItem.status === 'error' && (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Actions */}
        {files.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {totalFiles} files selected • Total size: {getFileSize(files.reduce((sum, f) => sum + f.file.size, 0))}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={uploading || files.length === 0 || files.every(f => f.status !== 'pending')}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} Files`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}