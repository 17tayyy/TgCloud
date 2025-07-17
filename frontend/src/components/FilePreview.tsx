
import React, { useState } from 'react';
import { FileItem, useFiles, getFileTypeInfo } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { X, Download, Trash, File, Image, Music, Video, FileText } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import FileTypeIcon from './FileTypeIcon';
import { ConfirmDialog } from './ConfirmDialog';

const FilePreview = () => {
  const { previewFile, setPreviewFile, deleteFiles, downloadFile } = useFiles();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!previewFile) return null;

  const handleDownload = () => {
    downloadFile(previewFile.id);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteFiles([previewFile.id]);
    setPreviewFile(null);
  };

  const getFileIcon = () => {
    const fileTypeInfo = getFileTypeInfo(previewFile.name);
    return <FileTypeIcon iconName={fileTypeInfo.icon} color={fileTypeInfo.color} size={48} />;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-cyber-dark-card border-l border-cyber-blue/30 p-6 z-40 overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">File Preview</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreviewFile(null)}
          className="text-cyber-blue/50 hover:text-cyber-blue flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6 min-w-0">{/* min-w-0 ayuda con el text wrapping */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-cyber-blue/10 rounded-lg flex items-center justify-center">
            {getFileIcon()}
          </div>
          <div className="text-center max-w-full">
            <h4 className="font-medium text-foreground break-words text-wrap leading-tight px-2">
              {previewFile.name}
            </h4>
            <div className="flex flex-col space-y-1">
              <p className="text-sm" style={{ color: getFileTypeInfo(previewFile.name).color }}>
                {getFileTypeInfo(previewFile.name).description}
              </p>
              <p className="text-xs text-muted-foreground">
                .{previewFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex-shrink-0">Type:</span>
            <span className="text-sm text-foreground capitalize">
              {getFileTypeInfo(previewFile.name).category}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex-shrink-0">Size:</span>
            <span className="text-sm text-foreground">
              {previewFile.size ? formatFileSize(previewFile.size) : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex-shrink-0">Modified:</span>
            <span className="text-sm text-foreground text-right ml-2">
              {formatDate(previewFile.modified)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground flex-shrink-0">Path:</span>
              <span className="text-sm text-foreground break-words text-right ml-2 max-w-[200px]">
                {previewFile.path}
              </span>
            </div>
          </div>
          {previewFile.encrypted && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex-shrink-0">Security:</span>
              <span className="text-sm text-cyber-blue">🔒 Encrypted</span>
            </div>
          )}
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

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete File"
        description={`Are you sure you want to delete "${previewFile.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default FilePreview;
