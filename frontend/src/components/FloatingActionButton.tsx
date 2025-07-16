
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Upload, FolderPlus } from 'lucide-react';
import { useFiles } from '@/contexts/FileContext';
import { toast } from '@/hooks/use-toast';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const { uploadFiles, createFolder, currentPath } = useFiles();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
      setIsOpen(false);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleUploadClick = () => {
    if (currentPath === '/') {
      toast({
        title: "Cannot upload to root",
        description: "Please select a folder first to upload files",
        variant: "destructive"
      });
      return;
    }
    
    // This is the critical fix - properly trigger the file input
    const fileInput = document.getElementById('floating-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleCreateFolder = () => {
    if (folderName.trim()) {
      createFolder(folderName.trim());
      setFolderName('');
      setShowCreateFolder(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Action buttons that appear when main FAB is clicked */}
        <div className={`transition-all duration-300 ${isOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col space-y-3 mb-3">
            {/* Upload Files */}
            <Button
              size="sm"
              onClick={handleUploadClick}
              disabled={currentPath === '/'}
              className="bg-cyber-blue/20 border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30 shadow-lg backdrop-blur-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>

            {/* Create Folder */}
            <Button
              size="sm"
              onClick={() => setShowCreateFolder(true)}
              className="bg-cyber-blue/20 border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30 shadow-lg backdrop-blur-sm"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Main FAB */}
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-cyber-blue text-cyber-dark shadow-lg hover:bg-cyber-blue/90 transition-all duration-300 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Hidden file input - this is the key component that wasn't working */}
      <input
        id="floating-file-upload"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept="*/*"
      />

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
    </>
  );
};

export default FloatingActionButton;
