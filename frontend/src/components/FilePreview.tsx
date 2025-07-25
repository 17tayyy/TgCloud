import React, { useState } from 'react';
import { FileItem, useFiles, getFileTypeInfo } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { X, Download, Trash, File, Image, Music, Video, FileText, Eye } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import FileTypeIcon from './FileTypeIcon';
import { ConfirmDialog } from './ConfirmDialog';
import { filesAPI } from '@/services/api';

const FilePreview = () => {
  const { previewFile, setPreviewFile, deleteFiles, downloadFile, currentPath, showPreviewModal, setShowPreviewModal, previewUrl, setPreviewUrl, isLoadingPreview, handleGlobalPreview } = useFiles();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!previewFile) return null;

  const handleDownload = () => {
    downloadFile(previewFile.id);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handlePreview = async () => {
    if (previewFile) {
      await handleGlobalPreview(previewFile);
    }
  }
  
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
          <Button
            onClick={handlePreview}
            disabled={isLoadingPreview}
            className="w-full bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingPreview ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyber-blue mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Load Preview
              </>
            )}
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

      {/* Modal de Preview */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-cyber-blue/30 sticky top-0 bg-cyber-dark-card z-10">
              <h3 className="text-lg font-semibold truncate text-cyber-blue">{previewFile.name}</h3>
              <Button
                variant="ghost"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-cyber-blue/20 rounded-full text-cyber-blue/70 hover:text-cyber-blue"
              >
                <X size={20} />
              </Button>
            </div>
            
            {/* Preview Content */}
            <div className="p-6 flex justify-center items-center min-h-[300px] bg-cyber-dark-card">
              {isLoading ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
                  <p className="text-cyber-blue/70">Loading preview...</p>
                </div>
              ) : (
                (() => {
                  const fileInfo = getFileTypeInfo(previewFile.name);
                  
                  switch (fileInfo.category) {
                    case 'image':
                      return (
                        <img 
                          src={previewUrl || ''} 
                          alt={previewFile.name}
                          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-cyber-blue/20"
                        />
                      );
                    case 'video':
                      return (
                        <video 
                          src={previewUrl || ''} 
                          controls 
                          className="max-w-full max-h-[70vh] rounded-lg shadow-lg border border-cyber-blue/20"
                        />
                      );
                    case 'audio':
                      return (
                        <div className="flex flex-col items-center space-y-4 p-8">
                          <div className="text-6xl text-cyber-blue">🎵</div>
                          <audio 
                            src={previewUrl || ''} 
                            controls 
                            className="w-full max-w-md bg-cyber-dark border border-cyber-blue/30 rounded-lg"
                          />
                          <p className="text-cyber-blue/70 text-center">{previewFile.name}</p>
                        </div>
                      );
                    default:
                      return (
                        <div className="text-center p-8">
                          <div className="text-6xl mb-4 text-cyber-blue/50">📁</div>
                          <p className="text-cyber-blue/70">Preview not available for this file type</p>
                          <p className="text-muted-foreground text-sm mt-2">{previewFile.name}</p>
                        </div>
                      );
                  }
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
