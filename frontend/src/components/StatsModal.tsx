import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getFileTypeInfo, FileTypeInfo } from '@/contexts/FileContext';
import FileTypeIcon from './FileTypeIcon';
import { formatFileSize } from '@/lib/utils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
  }>;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, files }) => {
  const filesByType = files
    .filter(f => f.type === 'file')
    .reduce((acc, file) => {
      const typeInfo = getFileTypeInfo(file.name);
      const category = typeInfo.category;
      
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          size: 0,
          typeInfo
        };
      }
      
      acc[category].count++;
      acc[category].size += file.size || 0;
      
      return acc;
    }, {} as Record<string, { count: number; size: number; typeInfo: FileTypeInfo }>);

  const folderCount = files.filter(f => f.type === 'folder').length;
  const totalFiles = files.filter(f => f.type === 'file').length;
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-cyber-dark-card border border-cyber-blue/30 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-cyber-blue">Directory Statistics</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-cyber-blue/5 rounded-lg border border-cyber-blue/20">
              <div className="text-2xl font-bold text-cyber-blue">{totalFiles}</div>
              <div className="text-xs text-muted-foreground">Files</div>
            </div>
            <div className="text-center p-3 bg-cyber-blue/5 rounded-lg border border-cyber-blue/20">
              <div className="text-2xl font-bold text-cyber-blue">{folderCount}</div>
              <div className="text-xs text-muted-foreground">Folders</div>
            </div>
            <div className="text-center p-3 bg-cyber-blue/5 rounded-lg border border-cyber-blue/20">
              <div className="text-lg font-bold text-cyber-blue">{formatFileSize(totalSize)}</div>
              <div className="text-xs text-muted-foreground">Total Size</div>
            </div>
          </div>

          {/* File Types Breakdown */}
          {Object.keys(filesByType).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-cyber-blue">File Types</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(filesByType)
                  .sort(([,a], [,b]) => b.count - a.count)
                  .map(([category, data]) => {
                    const percentage = totalFiles > 0 ? Math.round((data.count / totalFiles) * 100) : 0;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileTypeIcon 
                              iconName={data.typeInfo.icon} 
                              color={data.typeInfo.color} 
                              size={20} 
                            />
                            <div>
                              <div className="text-sm font-medium text-foreground capitalize">
                                {category}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {data.count} file{data.count > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-foreground">
                              {formatFileSize(data.size)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-cyber-blue/10 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: data.typeInfo.color 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {totalFiles === 0 && folderCount === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No files or folders in this directory</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatsModal;
