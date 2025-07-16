import React, { useState } from 'react';
import { useFiles } from '@/contexts/FileContext';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, FolderPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import FileItem from './FileItem';
import FilePreview from './FilePreview';
import FloatingActionButton from './FloatingActionButton';

const Dashboard = () => {
  const { files, currentPath, viewMode, selectedFiles, previewFile, uploadFiles, createFolder } = useFiles();
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');

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
    if (folderName.trim()) {
      createFolder(folderName.trim());
      setFolderName('');
      setShowCreateFolder(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-foreground">
      <Header />
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
                onClick={() => setShowCreateFolder(true)}
                className="text-foreground hover:bg-cyber-blue/10"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Folder
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {previewFile && (
          <div className="w-80 border-l border-cyber-blue/20">
            <FilePreview />
          </div>
        )}
      </div>

      <FloatingActionButton />

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="bg-cyber-dark-card border border-cyber-blue/30 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-cyber-blue">Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="bg-cyber-dark border-cyber-blue/30 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateFolder(false);
                  setFolderName('');
                }}
                className="border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!folderName.trim()}
                className="bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/90"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
