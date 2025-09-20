'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Clock,
  Download,
  Eye,
  MoreVertical,
  Upload,
  Trash2,
  FileText,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  History,
  Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DocumentVersion {
  id: string
  documentId: string
  version: number
  fileName: string
  fileSize: number
  filePath: string
  fileUrl: string
  changeDescription?: string
  uploadedBy: string
  uploadedByName?: string
  createdAt: string
  isActive: boolean
  downloadCount: number
  checksum?: string
}

interface DocumentVersionsProps {
  documentId: string
  currentVersion?: number
  onVersionChange?: (version: DocumentVersion) => void
  readOnly?: boolean
}

export function DocumentVersions({
  documentId,
  currentVersion,
  onVersionChange,
  readOnly = false
}: DocumentVersionsProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [changeDescription, setChangeDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [documentId])

  const fetchVersions = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          profiles:uploadedBy (
            fullName,
            email
          )
        `)
        .eq('documentId', documentId)
        .eq('deletedAt', null)
        .order('version', { ascending: false })

      if (error) throw error

      const formattedVersions: DocumentVersion[] = (data || []).map(version => ({
        id: version.id,
        documentId: version.documentId,
        version: version.version,
        fileName: version.fileName,
        fileSize: version.fileSize,
        filePath: version.filePath,
        fileUrl: version.fileUrl,
        changeDescription: version.changeDescription,
        uploadedBy: version.uploadedBy,
        uploadedByName: version.profiles?.fullName || version.profiles?.email || 'Unknown User',
        createdAt: version.createdAt,
        isActive: version.isActive,
        downloadCount: version.downloadCount || 0,
        checksum: version.checksum
      }))

      setVersions(formattedVersions)
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadNewVersion = async () => {
    if (!selectedFile) return

    setUploading(true)

    try {
      const supabase = createClient()
      const user = (await supabase.auth.getUser()).data.user

      // Generate new version number
      const nextVersion = Math.max(...versions.map(v => v.version), 0) + 1

      // Generate unique file name
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-v${nextVersion}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `documents/versions/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Create new version record
      const versionData = {
        documentId: documentId,
        version: nextVersion,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        filePath: filePath,
        fileUrl: urlData.publicUrl,
        changeDescription: changeDescription || null,
        uploadedBy: user?.id,
        isActive: true,
        downloadCount: 0
      }

      const { data: newVersion, error: dbError } = await supabase
        .from('document_versions')
        .insert([versionData])
        .select()
        .single()

      if (dbError) throw dbError

      // Deactivate previous versions
      await supabase
        .from('document_versions')
        .update({ isActive: false })
        .eq('documentId', documentId)
        .neq('id', newVersion.id)

      // Update main document record
      await supabase
        .from('documents')
        .update({
          version: nextVersion,
          fileUrl: urlData.publicUrl,
          filePath: filePath,
          fileSize: selectedFile.size,
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId)

      // Reset form
      setSelectedFile(null)
      setChangeDescription('')
      setUploadDialogOpen(false)

      // Refresh versions
      fetchVersions()

      // Notify parent component
      if (onVersionChange) {
        onVersionChange({
          ...newVersion,
          uploadedByName: user?.email || 'You'
        })
      }

    } catch (error) {
      console.error('Error uploading new version:', error)
      alert('Error uploading new version. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const downloadVersion = async (version: DocumentVersion) => {
    try {
      const supabase = createClient()

      // Increment download count
      await supabase
        .from('document_versions')
        .update({ downloadCount: version.downloadCount + 1 })
        .eq('id', version.id)

      // Download file
      const link = document.createElement('a')
      link.href = version.fileUrl
      link.download = version.fileName
      link.click()

      // Refresh data
      fetchVersions()

    } catch (error) {
      console.error('Error downloading version:', error)
    }
  }

  const restoreVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version with the restored content.')) {
      return
    }

    try {
      const supabase = createClient()
      const versionToRestore = versions.find(v => v.id === versionId)
      if (!versionToRestore) return

      const user = (await supabase.auth.getUser()).data.user
      const nextVersion = Math.max(...versions.map(v => v.version), 0) + 1

      // Create new version record (restored version)
      const versionData = {
        documentId: documentId,
        version: nextVersion,
        fileName: versionToRestore.fileName,
        fileSize: versionToRestore.fileSize,
        filePath: versionToRestore.filePath,
        fileUrl: versionToRestore.fileUrl,
        changeDescription: `Restored from version ${versionToRestore.version}`,
        uploadedBy: user?.id,
        isActive: true,
        downloadCount: 0
      }

      const { data: newVersion, error: dbError } = await supabase
        .from('document_versions')
        .insert([versionData])
        .select()
        .single()

      if (dbError) throw dbError

      // Deactivate previous versions
      await supabase
        .from('document_versions')
        .update({ isActive: false })
        .eq('documentId', documentId)
        .neq('id', newVersion.id)

      // Update main document record
      await supabase
        .from('documents')
        .update({
          version: nextVersion,
          fileUrl: versionToRestore.fileUrl,
          filePath: versionToRestore.filePath,
          fileSize: versionToRestore.fileSize,
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId)

      fetchVersions()

    } catch (error) {
      console.error('Error restoring version:', error)
      alert('Error restoring version. Please try again.')
    }
  }

  const deleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()

      // Soft delete version
      const { error } = await supabase
        .from('document_versions')
        .update({ deletedAt: new Date().toISOString() })
        .eq('id', versionId)

      if (error) throw error

      fetchVersions()

    } catch (error) {
      console.error('Error deleting version:', error)
      alert('Error deleting version. Please try again.')
    }
  }

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getVersionBadge = (version: DocumentVersion) => {
    if (version.isActive) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Current
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-gray-600">
        v{version.version}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Version History ({versions.length})
          </CardTitle>
          {!readOnly && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Version
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New Version</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="versionFile">Select File</Label>
                    <input
                      id="versionFile"
                      type="file"
                      onChange={handleFileSelect}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="changeDescription">Change Description</Label>
                    <Textarea
                      id="changeDescription"
                      value={changeDescription}
                      onChange={(e) => setChangeDescription(e.target.value)}
                      placeholder="Describe what changed in this version..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={uploadNewVersion}
                      disabled={!selectedFile || uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-gray-500">Loading versions...</div>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Versions</h3>
            <p className="text-gray-500 mb-4">This document has no version history yet.</p>
            {!readOnly && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Version
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{version.fileName}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>Version {version.version}</span>
                          <span>•</span>
                          <span>{getFileSize(version.fileSize)}</span>
                          <span>•</span>
                          <span>{version.downloadCount} downloads</span>
                        </div>
                      </div>
                      {getVersionBadge(version)}
                    </div>

                    {version.changeDescription && (
                      <p className="text-sm text-gray-600 mb-2 italic">
                        "{version.changeDescription}"
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {version.uploadedByName}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadVersion(version)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>

                    {!readOnly && !version.isActive && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => restoreVersion(version.id)}>
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Restore Version
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteVersion(version.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Version
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}