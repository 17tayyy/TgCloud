
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { foldersAPI, filesAPI } from '@/services/api';
import { APIFolder, APIFile } from '@/types/api';
import { toast } from '@/hooks/use-toast';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: Date;
  path: string;
  mimeType?: string;
  encrypted?: boolean;
}

interface FileContextType {
  files: FileItem[];
  currentPath: string;
  viewMode: 'grid' | 'list';
  selectedFiles: string[];
  previewFile: FileItem | null;
  isLoading: boolean;
  setFiles: (files: FileItem[]) => void;
  setCurrentPath: (path: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleFileSelection: (fileId: string) => void;
  clearSelection: () => void;
  setPreviewFile: (file: FileItem | null) => void;
  uploadFiles: (files: File[]) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  moveFile: (fileId: string, targetPath: string) => void;
  loadData: () => Promise<void>;
  shareFile: (fileId: string) => Promise<string>;
  downloadFile: (fileId: string) => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    console.error('useFiles must be used within a FileProvider. Current context:', context);
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

// Helper function to convert API data to FileItem
const convertAPIFolderToFileItem = (folder: APIFolder): FileItem => ({
  id: folder.id.toString(),
  name: folder.name,
  type: 'folder',
  modified: new Date(folder.created_at),
  path: `/${folder.name}`
});

const convertAPIFileToFileItem = (file: APIFile, folderPath: string): FileItem => ({
  id: file.id.toString(),
  name: file.filename,
  type: 'file',
  size: parseInt(file.size) || 0,
  modified: new Date(file.uploaded_at),
  path: folderPath === '/' ? `/${file.filename}` : `${folderPath}/${file.filename}`,
  encrypted: file.encrypted
});

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (currentPath === '/') {
        // Load folders from root
        const foldersData = await foldersAPI.list();
        const folderItems = foldersData.map(convertAPIFolderToFileItem);
        setFiles(folderItems);
      } else {
        // Load files from specific folder
        const folderName = currentPath.substring(1); // Remove leading slash
        const filesData = await filesAPI.list(folderName);
        const fileItems = filesData.map((file: APIFile) => convertAPIFileToFileItem(file, currentPath));
        setFiles(fileItems);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading files",
        description: error.response?.data?.detail || "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when path changes
  useEffect(() => {
    loadData();
  }, [currentPath]);

  const uploadFiles = async (newFiles: File[]) => {
    if (currentPath === '/') {
      toast({
        title: "Cannot upload to root",
        description: "Please select a folder first to upload files",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const folderName = currentPath.substring(1);
    let successCount = 0;
    let errorCount = 0;
    const totalFiles = newFiles.length;
    
    console.log(`Starting upload of ${totalFiles} file${totalFiles > 1 ? 's' : ''}...`);
    
    for (const file of newFiles) {
      try {
        await filesAPI.upload(folderName, file, (progress) => {
          console.log(`Upload progress for ${file.name}: ${progress}%`);
        });
        successCount++;
      } catch (error: any) {
        console.error('Upload error:', error);
        errorCount++;
      }
    }
    
    if (successCount > 0) {
      toast({
        title: "Upload completed",
        description: `${successCount} of ${totalFiles} files uploaded successfully`,
      });
    }
    
    if (errorCount > 0) {
      toast({
        title: "Upload errors",
        description: `${errorCount} file(s) failed to upload`,
        variant: "destructive"
      });
    }
    
    // Reload files after upload
    await loadData();
    setIsLoading(false);
  };

  const deleteFiles = async (fileIds: string[]) => {
    for (const fileId of fileIds) {
      const file = files.find(f => f.id === fileId);
      if (!file) continue;

      try {
        if (file.type === 'folder') {
          await foldersAPI.delete(file.name);
        } else {
          const folderName = currentPath.substring(1);
          await filesAPI.delete(folderName, file.name);
        }
        
        toast({
          title: "Deleted successfully",
          description: `${file.name} has been deleted`,
        });
      } catch (error: any) {
        console.error('Delete error:', error);
        toast({
          title: "Delete failed",
          description: `Failed to delete ${file.name}`,
          variant: "destructive"
        });
      }
    }
    
    setSelectedFiles([]);
    await loadData();
  };

  const createFolder = async (name: string) => {
    try {
      await foldersAPI.create(name);
      console.log(`Folder "${name}" created successfully`);
      await loadData();
    } catch (error: any) {
      console.error('Create folder error:', error);
      toast({
        title: "Create folder failed",
        description: error.response?.data?.detail || "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const shareFile = async (fileId: string): Promise<string> => {
    const file = files.find(f => f.id === fileId);
    if (!file) throw new Error('File not found');

    try {
      let response;
      if (file.type === 'folder') {
        response = await foldersAPI.share(file.name);
      } else {
        const folderName = currentPath.substring(1);
        response = await filesAPI.share(folderName, file.name);
      }
      
      return response.message;
    } catch (error: any) {
      console.error('Share error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to share file');
    }
  };

  const moveFile = (fileId: string, targetPath: string) => {
    // This would need to be implemented with the API
    console.log('Move file:', fileId, 'to:', targetPath);
    toast({
      title: "Move not implemented",
      description: "File move functionality needs API implementation",
    });
  };

  const downloadFile = async (fileId: string) => {
    try {
      // Find the file in our current files
      const file = files.find(f => f.id === fileId);
      if (!file) {
        toast({
          title: "Download failed",
          description: "File not found",
          variant: "destructive"
        });
        return;
      }

      // Extract folder and filename from file path
      let folderName: string;
      let fileName: string;

      if (file.path.startsWith('/') && file.path.includes('/')) {
        const pathParts = file.path.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
          folderName = pathParts[0];
          fileName = pathParts[pathParts.length - 1];
        } else {
          folderName = pathParts[0] || currentPath.substring(1);
          fileName = file.name;
        }
      } else {
        folderName = currentPath.substring(1) || 'default';
        fileName = file.name;
      }

      console.log('Downloading:', { folderName, fileName, filePath: file.path });

      // Call the API
      const blob = await filesAPI.download(folderName, fileName);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `${fileName} is being downloaded`,
      });
      
    } catch (error: unknown) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  return (
    <FileContext.Provider value={{
      files,
      currentPath,
      viewMode,
      selectedFiles,
      previewFile,
      isLoading,
      setFiles,
      setCurrentPath,
      setViewMode,
      toggleFileSelection,
      clearSelection,
      setPreviewFile,
      uploadFiles,
      deleteFiles,
      createFolder,
      moveFile,
      downloadFile,
      loadData,
      shareFile
    }}>
      {children}
    </FileContext.Provider>
  );
};
