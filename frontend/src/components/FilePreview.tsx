
import React from 'react';
import { FileItem, useFiles } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { X, Download, Trash, File, Image, Music, Video, FileText } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const FilePreview = () => {
  const { previewFile, setPreviewFile, deleteFiles, downloadFile } = useFiles();

  if (!previewFile) return null;

  const handleDownload = () => {
    downloadFile(previewFile.id);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${previewFile.name}?`)) {
      deleteFiles([previewFile.id]);
      setPreviewFile(null);
    }
  };

  const getFileIcon = () => {
    if (!previewFile.mimeType) return <File className="w-16 h-16 text-cyber-blue/70" />;
    
    if (previewFile.mimeType.startsWith('image/')) {
      return <Image className="w-16 h-16 text-green-400" />;
    } else if (previewFile.mimeType.startsWith('audio/')) {
      return <Music className="w-16 h-16 text-purple-400" />;
    } else if (previewFile.mimeType.startsWith('video/')) {
      return <Video className="w-16 h-16 text-red-400" />;
    } else if (previewFile.mimeType.includes('pdf') || previewFile.mimeType.includes('text')) {
      return <FileText className="w-16 h-16 text-blue-400" />;
    }
    
    return <File className="w-16 h-16 text-cyber-blue/70" />;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-cyber-dark-card border-l border-cyber-blue/30 p-6 z-40 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">File Preview</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreviewFile(null)}
          className="text-cyber-blue/50 hover:text-cyber-blue"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-cyber-blue/10 rounded-lg flex items-center justify-center">
            {getFileIcon()}
          </div>
          <div className="text-center">
            <h4 className="font-medium text-foreground truncate max-w-full">{previewFile.name}</h4>
            <p className="text-sm text-muted-foreground">{previewFile.mimeType || 'Unknown type'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Size:</span>
            <span className="text-sm text-foreground">
              {previewFile.size ? formatFileSize(previewFile.size) : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Modified:</span>
            <span className="text-sm text-foreground">{formatDate(previewFile.modified)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Path:</span>
            <span className="text-sm text-foreground truncate">{previewFile.path}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleDownload}
            className="w-full bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="w-full bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
