'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Lock,
  Globe,
  ChevronRight,
  Home,
  Settings,
  Share
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DocumentFolder {
  id: string
  name: string
  description?: string
  parentId?: string
  module: string
  entityId?: string
  isPublic: boolean
  isLocked: boolean
  permissions: string[]
  documentCount: number
  subfolderCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
  path: string[]
}

interface FolderManagerProps {
  currentFolderId?: string
  module?: string
  entityId?: string
  onFolderChange?: (folderId: string | null) => void
  readOnly?: boolean
}

export function FolderManager({
  currentFolderId,
  module = 'general',
  entityId,
  onFolderChange,
  readOnly = false
}: FolderManagerProps) {
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [currentPath, setCurrentPath] = useState<DocumentFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null)

  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    isPublic: false,
    permissions: [] as string[]
  })

  useEffect(() => {
    fetchFolders()
    if (currentFolderId) {
      buildCurrentPath(currentFolderId)
    }
  }, [currentFolderId, module, entityId])

  const fetchFolders = async () => {
    try {
      const supabase = createClient()

      let query = supabase
        .from('document_folders')
        .select(`
          *,
          documents!documents_folderId_fkey(count),
          subfolders:document_folders!document_folders_parentId_fkey(count)
        `)
        .eq('module', module)
        .eq('deletedAt', null)

      if (currentFolderId) {
        query = query.eq('parentId', currentFolderId)
      } else {
        query = query.is('parentId', null)
      }

      if (entityId) {
        query = query.eq('entityId', entityId)
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      const formattedFolders: DocumentFolder[] = (data || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentId: folder.parentId,
        module: folder.module,
        entityId: folder.entityId,
        isPublic: folder.isPublic,
        isLocked: folder.isLocked,
        permissions: folder.permissions || [],
        documentCount: folder.documents?.[0]?.count || 0,
        subfolderCount: folder.subfolders?.[0]?.count || 0,
        createdBy: folder.createdBy,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        path: []
      }))

      setFolders(formattedFolders)
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildCurrentPath = async (folderId: string) => {
    try {
      const supabase = createClient()
      const path: DocumentFolder[] = []
      let currentId: string | null = folderId

      while (currentId) {
        const { data, error }: { data: any, error: any } = await supabase
          .from('document_folders')
          .select('*')
          .eq('id', currentId)
          .single()

        if (error || !data) break

        path.unshift({
          id: data.id,
          name: data.name,
          description: data.description,
          parentId: data.parentId,
          module: data.module,
          entityId: data.entityId,
          isPublic: data.isPublic,
          isLocked: data.isLocked,
          permissions: data.permissions || [],
          documentCount: 0,
          subfolderCount: 0,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          path: []
        })

        currentId = data.parentId
      }

      setCurrentPath(path)
    } catch (error) {
      console.error('Error building path:', error)
    }
  }

  const createFolder = async () => {
    if (!newFolder.name.trim()) return

    try {
      const supabase = createClient()
      const user = (await supabase.auth.getUser()).data.user

      const folderData = {
        name: newFolder.name.trim(),
        description: newFolder.description,
        parentId: currentFolderId || null,
        module: module,
        entityId: entityId || null,
        isPublic: newFolder.isPublic,
        isLocked: false,
        permissions: newFolder.permissions,
        createdBy: user?.id
      }

      const { data, error } = await supabase
        .from('document_folders')
        .insert([folderData])
        .select()
        .single()

      if (error) throw error

      // Reset form and refresh
      setNewFolder({
        name: '',
        description: '',
        isPublic: false,
        permissions: []
      })
      setCreateDialogOpen(false)
      fetchFolders()

    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Error creating folder. Please try again.')
    }
  }

  const updateFolder = async () => {
    if (!editingFolder || !editingFolder.name.trim()) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('document_folders')
        .update({
          name: editingFolder.name.trim(),
          description: editingFolder.description,
          isPublic: editingFolder.isPublic,
          permissions: editingFolder.permissions
        })
        .eq('id', editingFolder.id)

      if (error) throw error

      setEditingFolder(null)
      fetchFolders()

    } catch (error) {
      console.error('Error updating folder:', error)
      alert('Error updating folder. Please try again.')
    }
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? All contents will be moved to the parent folder.')) {
      return
    }

    try {
      const supabase = createClient()

      // Soft delete the folder
      const { error } = await supabase
        .from('document_folders')
        .update({ deletedAt: new Date().toISOString() })
        .eq('id', folderId)

      if (error) throw error

      fetchFolders()

    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('Error deleting folder. Please try again.')
    }
  }

  const navigateToFolder = (folderId: string | null) => {
    onFolderChange?.(folderId)
  }

  const getFolderIcon = (folder: DocumentFolder) => {
    if (folder.isLocked) return <Lock className="h-4 w-4 text-red-500" />
    if (folder.subfolderCount > 0) return <FolderOpen className="h-4 w-4 text-blue-500" />
    return <Folder className="h-4 w-4 text-blue-500" />
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateToFolder(null)}
          className="p-1 h-auto"
        >
          <Home className="h-4 w-4" />
        </Button>

        {currentPath.map((folder, index) => (
          <div key={folder.id} className="flex items-center space-x-2">
            <ChevronRight className="h-3 w-3" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToFolder(folder.id)}
              className="p-1 h-auto text-xs"
            >
              {folder.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Folder Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Folders ({folders.length})
        </h3>

        {!readOnly && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolder.name}
                    onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter folder name..."
                  />
                </div>

                <div>
                  <Label htmlFor="folderDescription">Description (optional)</Label>
                  <Textarea
                    id="folderDescription"
                    value={newFolder.description}
                    onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this folder..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="folderPublic">Public Access</Label>
                  <Switch
                    id="folderPublic"
                    checked={newFolder.isPublic}
                    onCheckedChange={(checked) => setNewFolder(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFolder} disabled={!newFolder.name.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Folder Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse text-gray-500">Loading folders...</div>
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Folders</h3>
          <p className="text-gray-500 mb-4">
            {currentFolderId ? 'This folder is empty.' : 'Create your first folder to organize documents.'}
          </p>
          {!readOnly && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigateToFolder(folder.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getFolderIcon(folder)}
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                        {folder.name}
                      </h4>
                      {folder.description && (
                        <p className="text-xs text-gray-500 mt-1">{folder.description}</p>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          setEditingFolder(folder)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          // Share functionality
                        }}>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFolder(folder.id)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span>{folder.documentCount} files</span>
                    <span>{folder.subfolderCount} folders</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {folder.isPublic ? (
                      <Globe className="h-3 w-3 text-green-500" />
                    ) : (
                      <Lock className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Created {new Date(folder.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Folder Dialog */}
      {editingFolder && (
        <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFolderName">Folder Name</Label>
                <Input
                  id="editFolderName"
                  value={editingFolder.name}
                  onChange={(e) => setEditingFolder(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter folder name..."
                />
              </div>

              <div>
                <Label htmlFor="editFolderDescription">Description</Label>
                <Textarea
                  id="editFolderDescription"
                  value={editingFolder.description || ''}
                  onChange={(e) => setEditingFolder(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Describe this folder..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="editFolderPublic">Public Access</Label>
                <Switch
                  id="editFolderPublic"
                  checked={editingFolder.isPublic}
                  onCheckedChange={(checked) => setEditingFolder(prev => prev ? { ...prev, isPublic: checked } : null)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingFolder(null)}>
                  Cancel
                </Button>
                <Button onClick={updateFolder} disabled={!editingFolder.name.trim()}>
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}