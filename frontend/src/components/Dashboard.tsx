import React, { useState, useEffect } from 'react';
import { useFiles, getFileTypeInfo } from '@/contexts/FileContext';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Upload, FolderPlus, Download, Trash, X, CheckSquare, Square, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import FileItem from './FileItem';
import FilePreview from './FilePreview';
import FloatingActionButton from './FloatingActionButton';
import StatisticsPage from './StatisticsPage';
import { ConfirmDialog } from './ConfirmDialog';
import { ProgressManager } from './ProgressManager';

const Dashboard = () => {
  const { 
    files, 
    currentPath, 
    viewMode, 
    selectedFiles, 
    previewFile, 
    uploadFiles, 
    createFolder, 
    createTemporaryFolder,
    clearSelection, 
    selectAllFiles,
    deleteFiles, 
    downloadMultipleFiles,
    handleGlobalPreview,
    toggleFileSelection,
    setCurrentPath,
    setPreviewFile,
    moveFile,
    shareFile,
    downloadFile,
    renameFolder,
    cancelFolderCreation
  } = useFiles();
  const [showStatsPage, setShowStatsPage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getCurrentFiles = () => {
    return files.filter(file => {
      const filePath = file.path;
      const pathParts = filePath.split('/').filter(Boolean);
      const currentParts = currentPath.split('/').filter(Boolean);
      
      if (currentPath === '/') {
        return pathParts.length === 1;
      }
      
      return pathParts.length === currentParts.length + 1 && 
             filePath.startsWith(currentPath + '/');
    });
  };

  const currentFiles = getCurrentFiles();

  const handleUploadClick = () => {
    if (currentPath === '/') {
      toast({
        title: "Cannot upload to root",
        description: "Please select a folder first to upload files",
        variant: "destructive"
      });
      return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      if (files.length > 0) {
        uploadFiles(files);
      }
    };
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  const handleCreateFolder = () => {
    if (currentPath === '/') {
      createTemporaryFolder();
    } else {
      toast({
        title: "Cannot create folder here",
        description: "Folders can only be created in the root directory. Navigate back to create a new folder.",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    await deleteFiles(selectedFiles);
    clearSelection();
  };

  const handleBulkDownload = async () => {
    if (selectedFiles.length === 0) return;
    
    await downloadMultipleFiles(selectedFiles);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            if (currentFiles.length > 0) {
              const allFileIds = currentFiles.map(file => file.id);
              selectAllFiles(allFileIds);
            }
            break;
          case 'Escape':
            event.preventDefault();
            clearSelection();
            break;
        }
      }
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentFiles, clearSelection, selectAllFiles]);

  const handleSelectAll = () => {
    const allFileIds = currentFiles.map(file => file.id);
    selectAllFiles(allFileIds);
  };

  // If showing stats page, render it instead of dashboard
  if (showStatsPage) {
    return <StatisticsPage onBack={() => setShowStatsPage(false)} />;
  }

  return (
    <div className="min-h-screen bg-cyber-dark text-foreground">
      <Header onShowStatsPage={() => setShowStatsPage(true)} />
      
      {/* Selection Bar */}
      {selectedFiles.length > 0 && (
        <div className="bg-cyber-blue/10 border-b border-cyber-blue/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-cyber-blue" />
                <span className="text-sm text-cyber-blue font-medium">
                  {selectedFiles.length} of {currentFiles.length} item{selectedFiles.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleBulkDownload}
                  size="sm"
                  variant="outline"
                  className="border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {selectedFiles.length > 1 ? 'All' : ''}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete {selectedFiles.length > 1 ? 'All' : ''}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                Press Ctrl+A to select all, Esc to clear
              </span>
              <Button
                onClick={clearSelection}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex">
        <div className="flex-1">
          <Breadcrumbs />

          {/* File Grid/List with Context Menu */}
          <ContextMenu>
            <ContextMenuTrigger className="block">
              <div className="p-4 min-h-[500px]">
                {currentFiles.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No files in this directory</p>
                    <p className="text-sm mt-2">Right-click to add files or folders</p>
                  </div>
                ) : (
                  <div className={`${
                    viewMode === 'grid' 
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4' 
                      : 'space-y-2'
                  }`}>
                    {currentFiles.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-cyber-dark-card border border-cyber-blue/30 text-foreground">
              <ContextMenuItem 
                onClick={handleUploadClick}
                disabled={currentPath === '/'}
                className="text-foreground hover:bg-cyber-blue/10 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={handleCreateFolder}
                className="text-foreground hover:bg-cyber-blue/10"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Folder
              </ContextMenuItem>

              {previewFile && ['image', 'video', 'audio'].includes(getFileTypeInfo(previewFile.name).category) && (
                <>
                  <ContextMenuSeparator className="bg-cyber-blue/20" />
                  <ContextMenuItem 
                    onClick={() => handleGlobalPreview(previewFile)}
                    className="text-cyber-blue hover:bg-cyber-blue/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview File
                  </ContextMenuItem>
                </>
              )}
              
              {currentFiles.length > 0 && (
                <>
                  <ContextMenuSeparator className="bg-cyber-blue/20" />
                  {selectedFiles.length === currentFiles.length ? (
                    <ContextMenuItem 
                      onClick={clearSelection}
                      className="text-foreground hover:bg-cyber-blue/10"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Deselect All
                    </ContextMenuItem>
                  ) : (
                    <ContextMenuItem 
                      onClick={handleSelectAll}
                      className="text-foreground hover:bg-cyber-blue/10"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select All
                    </ContextMenuItem>
                  )}
                </>
              )}
              
              {selectedFiles.length > 0 && (
                <>
                  <ContextMenuSeparator className="bg-cyber-blue/20" />
                  <ContextMenuItem 
                    onClick={handleBulkDownload}
                    className="text-foreground hover:bg-cyber-blue/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {selectedFiles.length > 1 ? 'Files' : 'File'}
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={handleBulkDelete}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete {selectedFiles.length > 1 ? 'Files' : 'File'}
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {/* Sidebar for preview */}
        {previewFile && (
          <div className="w-80 border-l border-cyber-blue/20">
            <FilePreview />
          </div>
        )}
      </div>

      <FloatingActionButton />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Selected Items"
        description={`Are you sure you want to delete ${selectedFiles.length} selected item${selectedFiles.length > 1 ? 's' : ''}? This action cannot be undone.`}
        onConfirm={confirmBulkDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Dashboard;
