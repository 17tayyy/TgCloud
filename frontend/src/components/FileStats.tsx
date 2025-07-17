import React from 'react';
import { getFileTypeInfo, FileTypeInfo } from '@/contexts/FileContext';
import FileTypeIcon from './FileTypeIcon';

interface FileStatsProps {
  files: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
  }>;
}

const FileStats: React.FC<FileStatsProps> = ({ files }) => {
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

  if (totalFiles === 0 && folderCount === 0) {
    return null;
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-cyber-blue mb-3">Directory Summary</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">{totalFiles}</div>
          <div className="text-xs text-muted-foreground">Files</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">{folderCount}</div>
          <div className="text-xs text-muted-foreground">Folders</div>
        </div>
      </div>

      {Object.keys(filesByType).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-2">File Types:</div>
          {Object.entries(filesByType)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 5) // Show top 5 types
            .map(([category, data]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileTypeIcon 
                    iconName={data.typeInfo.icon} 
                    color={data.typeInfo.color} 
                    size={16} 
                  />
                  <span className="text-xs text-foreground capitalize">
                    {category}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.count} • {formatSize(data.size)}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default FileStats;
