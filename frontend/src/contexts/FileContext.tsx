import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { foldersAPI, filesAPI } from '@/services/api';
import { APIFolder, APIFile } from '@/types/api';
import { toast } from '@/hooks/use-toast';
import { useProgressTracker } from '@/hooks/useProgressTracker';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: Date;
  path: string;
  mimeType?: string;
  encrypted?: boolean;
  isTemporary?: boolean; // Para carpetas temporales en edición
  isEditing?: boolean;   // Para indicar si está en modo edición
}

export interface FileTypeInfo {
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'text' | 'unknown';
  icon: string;
  color: string;
  description: string;
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
  selectAllFiles: (fileIds: string[]) => void;
  clearSelection: () => void;
  setPreviewFile: (file: FileItem | null) => void;
  uploadFiles: (files: File[]) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  createTemporaryFolder: () => void;
  renameFolder: (fileId: string, newName: string) => Promise<void>;
  cancelFolderCreation: (fileId: string) => void;
  moveFile: (fileId: string, targetPath: string) => void;
  loadData: () => Promise<void>;
  shareFile: (fileId: string) => Promise<string>;
  downloadFile: (fileId: string) => Promise<void>;
  downloadMultipleFiles: (fileIds: string[]) => Promise<void>;
}

// Export utility function for file type detection
export const getFileTypeInfo = (filename: string): FileTypeInfo => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].includes(extension)) {
    return { category: 'image', icon: 'ImageIcon', color: '#10b981', description: 'Image' };
  }
  
  // Video files
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ogv'].includes(extension)) {
    return { category: 'video', icon: 'VideoIcon', color: '#f59e0b', description: 'Video' };
  }
  
  // Audio files
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff'].includes(extension)) {
    return { category: 'audio', icon: 'MusicIcon', color: '#8b5cf6', description: 'Audio' };
  }
  
  // Document files
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(extension)) {
    return { category: 'document', icon: 'FileTextIcon', color: '#3b82f6', description: 'Document' };
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'z', 'lz', 'lzma'].includes(extension)) {
    return { category: 'archive', icon: 'ArchiveIcon', color: '#6b7280', description: 'Archive' };
  }
  
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'php', 'rb', 'go', 'rs', 'swift'].includes(extension)) {
    return { category: 'code', icon: 'CodeIcon', color: '#ef4444', description: 'Code' };
  }
  
  // Text files
  if (['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'conf', 'log'].includes(extension)) {
    return { category: 'text', icon: 'ScrollTextIcon', color: '#14b8a6', description: 'Text' };
  }
  
  // Unknown/other files
  return { category: 'unknown', icon: 'FileIcon', color: '#6b7280', description: 'File' };
};

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
  
  // Hook de progreso
  const { connect, disconnect, isConnected } = useProgressTracker();

  const toggleFileSelection = (fileId: string) => {
    // No permitir selección de archivos temporales
    const file = files.find(f => f.id === fileId);
    if (file?.isTemporary) {
      return;
    }
    
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const selectAllFiles = (fileIds: string[]) => {
    setSelectedFiles(fileIds);
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
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      let description = "Failed to load files";
      if (typeof error === "object" && error !== null && "response" in error) {
        const errObj = error as { response?: { data?: { detail?: string } } };
        description = errObj.response?.data?.detail || description;
      }
      toast({
        title: "Error loading files",
        description,
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

  // Connect to progress WebSocket
  useEffect(() => {
    const token = localStorage.getItem('tgcloud_token');
    if (token) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Also try to connect when component updates and token becomes available
  useEffect(() => {
    const checkTokenAndConnect = () => {
      const token = localStorage.getItem('tgcloud_token');
      if (token && !isConnected) {
        connect();
      }
    };

    checkTokenAndConnect();
    window.addEventListener('storage', checkTokenAndConnect);
    
    return () => {
      window.removeEventListener('storage', checkTokenAndConnect);
    };
  }, [connect, isConnected]);

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
        const result = await filesAPI.upload(folderName, file);
        successCount++;
      } catch (error: unknown) {
        console.error('Upload error:', error);
        errorCount++;
      }
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
      } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Create folder error:', error);
      let description = "Failed to create folder";
      if (typeof error === "object" && error !== null && "response" in error) {
        const errObj = error as { response?: { data?: { detail?: string } } };
        description = errObj.response?.data?.detail || description;
      }
      toast({
        title: "Create folder failed",
        description,
        variant: "destructive"
      });
    }
  };

  const createTemporaryFolder = () => {
    const tempId = `temp-${Date.now()}`;
    const tempFolder: FileItem = {
      id: tempId,
      name: 'Nueva carpeta',
      type: 'folder',
      modified: new Date(),
      path: currentPath === '/' ? '/Nueva carpeta' : `${currentPath}/Nueva carpeta`,
      isTemporary: true,
      isEditing: true
    };
    
    setFiles(prev => [...prev, tempFolder]);
  };

  const renameFolder = async (fileId: string, newName: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.isTemporary) return;
    
    try {
      await foldersAPI.create(newName);
      console.log(`Folder "${newName}" created successfully`);
      await loadData();
    } catch (error: unknown) {
      console.error('Create folder error:', error);
      let description = "Failed to create folder";
      if (typeof error === "object" && error !== null && "response" in error) {
        const errObj = error as { response?: { data?: { detail?: string } } };
        description = errObj.response?.data?.detail || description;
      }
      toast({
        title: "Create folder failed",
        description,
        variant: "destructive"
      });
      // Remove temporary folder on error
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const cancelFolderCreation = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
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
    } catch (error: unknown) {
      console.error('Share error:', error);
      let errorMessage = 'Failed to share file';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { detail?: string } } };
        errorMessage = errObj.response?.data?.detail || errorMessage;
      }
      throw new Error(errorMessage);
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

      // Usar fetch con headers personalizados en lugar de axios
      const token = localStorage.getItem('tgcloud_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/v1/folders/${encodeURIComponent(folderName)}/files/${encodeURIComponent(fileName)}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
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
      
    } catch (error: unknown) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const downloadMultipleFiles = async (fileIds: string[]) => {
    try {
      const filesToDownload = files.filter(f => fileIds.includes(f.id) && f.type === 'file');
      
      if (filesToDownload.length === 0) {
        toast({
          title: "No files to download",
          description: "Selected items contain no downloadable files",
          variant: "destructive"
        });
        return;
      }

      // Download each file with a small delay to avoid overwhelming the server
      for (let i = 0; i < filesToDownload.length; i++) {
        const file = filesToDownload[i];
        await downloadFile(file.id);
        
        // Add small delay between downloads
        if (i < filesToDownload.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

    } catch (error: unknown) {
      console.error('Bulk download error:', error);
      toast({
        title: "Bulk download failed",
        description: "Failed to download multiple files",
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
      selectAllFiles,
      clearSelection,
      setPreviewFile,
      uploadFiles,
      deleteFiles,
      createFolder,
      createTemporaryFolder,
      renameFolder,
      cancelFolderCreation,
      moveFile,
      downloadFile,
      loadData,
      shareFile,
      downloadMultipleFiles
    }}>
      {children}
    </FileContext.Provider>
  );
};
