import React, { useState } from 'react';
import { FileItem as FileItemType, useFiles, getFileTypeInfo } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { Folder, File, Download, Trash, Share } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import FileTypeIcon from './FileTypeIcon';
import { ConfirmDialog } from './ConfirmDialog';
import { InlineEdit } from './InlineEdit';

interface FileItemProps {
  file: FileItemType;
  viewMode: 'grid' | 'list';
}

const FileItem: React.FC<FileItemProps> = ({ file, viewMode }) => {
  const { selectedFiles, toggleFileSelection, setCurrentPath, deleteFiles, setPreviewFile, moveFile, currentPath, shareFile, files, downloadFile, renameFolder, cancelFolderCreation } = useFiles();
  const isSelected = selectedFiles.includes(file.id);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleClick = () => {
    // No permitir navegación si está en modo edición
    if (file.isEditing) {
      return;
    }
    
    if (file.type === 'folder') {
      setCurrentPath(file.path);
    } else {
      setPreviewFile(file);
    }
  };

  const handleContextMenuSelect = (fileId: string) => {
    toggleFileSelection(fileId);
  };

  const handleDownload = () => {
    downloadFile(file.id);
  };

  const handleShare = async () => {
    try {
      const shareLink = await shareFile(file.id);
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareLink).then(() => {
        toast({
          title: "Link copied",
          description: `Share link for ${file.name} copied to clipboard`,
        });
      }).catch(() => {
        toast({
          title: "Share link",
          description: `Share link: ${shareLink}`,
        });
      });
      
      console.log('Share file:', file.id, 'Link:', shareLink);
    } catch (error: unknown) {
      toast({
        title: "Share failed",
        description: error instanceof Error ? error.message : "Failed to create share link",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteFiles([file.id]);
  };

  const handleSaveName = (newName: string) => {
    if (file.isTemporary) {
      renameFolder(file.id, newName);
    }
  };

  const handleCancelEdit = () => {
    if (file.isTemporary) {
      cancelFolderCreation(file.id);
    }
  };

  // Desktop drag events
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    console.log('Drag started for file:', file.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (file.type === 'folder') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.stopPropagation();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (file.type === 'folder') {
      const draggedFileId = e.dataTransfer.getData('text/plain');
      console.log('Dropped file:', draggedFileId, 'on folder:', file.id);
      
      if (draggedFileId && draggedFileId !== file.id) {
        moveFile(draggedFileId, file.path);
        toast({
          title: "File moved",
          description: `File moved to ${file.name}`,
        });
      }
    }
  };

  // Mobile touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // Start drag if moved more than 10 pixels
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging) {
      // Find element under touch point
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Check if dropped on a folder
      const folderElement = elementBelow?.closest('[data-folder-id]');
      if (folderElement) {
        const targetFolderId = folderElement.getAttribute('data-folder-id');
        if (targetFolderId && targetFolderId !== file.id) {
          // Find the target folder path using the files from context
          const targetFolder = files.find(f => f.id === targetFolderId);
          if (targetFolder) {
            moveFile(file.id, targetFolder.path);
            toast({
              title: "File moved",
              description: `File moved to ${targetFolder.name}`,
            });
          }
        }
      }
      
      setIsDragging(false);
    }
    setTouchStartPos(null);
  };

  const getFileIcon = () => {
    if (file.type === 'folder') {
      return <Folder className="w-6 h-6 text-cyber-blue" />;
    }
    
    const fileTypeInfo = getFileTypeInfo(file.name);
    return <FileTypeIcon iconName={fileTypeInfo.icon} color={fileTypeInfo.color} size={24} />;
  };

  const getFileIconLarge = () => {
    if (file.type === 'folder') {
      return <Folder className="w-8 h-8 text-cyber-blue" />;
    }
    
    const fileTypeInfo = getFileTypeInfo(file.name);
    return <FileTypeIcon iconName={fileTypeInfo.icon} color={fileTypeInfo.color} size={32} />;
  };

  if (viewMode === 'grid') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`cyber-card p-4 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-cyber-blue/5 ${
              isSelected ? 'ring-2 ring-cyber-blue bg-cyber-blue/10' : ''
            } ${file.type === 'folder' ? 'hover:bg-cyber-blue/10' : ''} ${
              isDragging ? 'opacity-50 scale-95' : ''
            }`}
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-folder-id={file.type === 'folder' ? file.id : undefined}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-cyber-blue/10 rounded-lg flex items-center justify-center">
                {getFileIconLarge()}
              </div>
              <div className="text-center w-full">
                {file.isEditing ? (
                  <InlineEdit
                    initialValue={file.name}
                    onSave={handleSaveName}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                )}
                <div className="flex flex-col items-center space-y-1">
                  {file.type === 'file' && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {getFileTypeInfo(file.name).description}
                      </p>
                      {file.size && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      )}
                    </>
                  )}
                  {file.type === 'folder' && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(file.modified)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-cyber-dark-card border border-cyber-blue/30">
          <ContextMenuItem onClick={() => handleContextMenuSelect(file.id)} className="text-foreground hover:bg-cyber-blue/10">
            {isSelected ? 'Deselect' : 'Select'}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleShare} className="text-foreground hover:bg-cyber-blue/10">
            <Share className="w-4 h-4 mr-2" />
            Share {file.type === 'folder' ? 'folder' : 'file'}
          </ContextMenuItem>
          {file.type === 'file' && (
            <ContextMenuItem onClick={handleDownload} className="text-foreground hover:bg-cyber-blue/10">
              <Download className="w-4 h-4 mr-2" />
              Download
            </ContextMenuItem>
          )}
          <ContextMenuSeparator className="bg-cyber-blue/20" />
          <ContextMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-500/10">
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <>
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`flex items-center space-x-4 p-3 cyber-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-cyber-blue/5 ${
            isSelected ? 'bg-cyber-blue/10 border-cyber-blue' : ''
          } ${file.type === 'folder' ? 'hover:bg-cyber-blue/10' : ''} ${
            isDragging ? 'opacity-50 scale-95' : ''
          }`}
          onClick={handleClick}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-folder-id={file.type === 'folder' ? file.id : undefined}
        >
          <div className="flex-shrink-0">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {file.isEditing ? (
              <InlineEdit
                initialValue={file.name}
                onSave={handleSaveName}
                onCancel={handleCancelEdit}
              />
            ) : (
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            )}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {file.type === 'file' && (
                <span style={{ color: getFileTypeInfo(file.name).color }}>
                  {getFileTypeInfo(file.name).description}
                </span>
              )}
              <span>{formatDate(file.modified)}</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-xs text-muted-foreground">
            {file.type === 'file' && file.size ? formatFileSize(file.size) : 'Folder'}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-cyber-dark-card border border-cyber-blue/30">
        <ContextMenuItem onClick={() => handleContextMenuSelect(file.id)} className="text-foreground hover:bg-cyber-blue/10">
          {isSelected ? 'Deselect' : 'Select'}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleShare} className="text-foreground hover:bg-cyber-blue/10">
          <Share className="w-4 h-4 mr-2" />
          Share {file.type === 'folder' ? 'folder' : 'file'}
        </ContextMenuItem>
        {file.type === 'file' && (
          <ContextMenuItem onClick={handleDownload} className="text-foreground hover:bg-cyber-blue/10">
            <Download className="w-4 h-4 mr-2" />
            Download
          </ContextMenuItem>
        )}
        <ContextMenuSeparator className="bg-cyber-blue/20" />
        <ContextMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-500/10">
          <Trash className="w-4 h-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>

    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Delete File"
      description={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
      onConfirm={confirmDelete}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
    />
    </>
  );
};

export default FileItem;
