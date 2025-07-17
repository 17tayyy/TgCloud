import React, { useState, useEffect } from 'react';
import { useFiles, getFileTypeInfo, FileTypeInfo } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HardDrive, Files, Folders, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import FileTypeIcon from './FileTypeIcon';

interface StatisticsPageProps {
  onBack: () => void;
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ onBack }) => {
  const { files } = useFiles();
  const [allFiles, setAllFiles] = useState<Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
    modified: Date;
    path: string;
  }>>([]);

  // Get all files from all directories for comprehensive stats
  useEffect(() => {
    // For now we'll use the current files, but this could be expanded to fetch all files
    setAllFiles(files);
  }, [files]);

  const filesByType = allFiles
    .filter(f => f.type === 'file')
    .reduce((acc, file) => {
      const typeInfo = getFileTypeInfo(file.name);
      const category = typeInfo.category;
      
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          size: 0,
          typeInfo,
          files: []
        };
      }
      
      acc[category].count++;
      acc[category].size += file.size || 0;
      acc[category].files.push(file);
      
      return acc;
    }, {} as Record<string, { count: number; size: number; typeInfo: FileTypeInfo; files: typeof allFiles }>);

  const totalFiles = allFiles.filter(f => f.type === 'file').length;
  const totalFolders = allFiles.filter(f => f.type === 'folder').length;
  const totalSize = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

  // Find largest files
  const largestFiles = allFiles
    .filter(f => f.type === 'file' && f.size)
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 5);

  // Recent files
  const recentFiles = allFiles
    .filter(f => f.type === 'file')
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    .slice(0, 5);

  const sortedFileTypes = Object.entries(filesByType)
    .sort(([,a], [,b]) => b.count - a.count);

  return (
    <div className="min-h-screen bg-cyber-dark text-foreground">
      {/* Header */}
      <div className="border-b border-cyber-blue/30 bg-cyber-dark-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-cyber-blue hover:bg-cyber-blue/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Files
            </Button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-cyber-blue" />
              <h1 className="text-2xl font-bold text-cyber-blue">Storage Statistics</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Files</p>
                <p className="text-3xl font-bold text-cyber-blue">{totalFiles}</p>
              </div>
              <Files className="w-8 h-8 text-cyber-blue/50" />
            </div>
          </div>

          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Folders</p>
                <p className="text-3xl font-bold text-cyber-blue">{totalFolders}</p>
              </div>
              <Folders className="w-8 h-8 text-cyber-blue/50" />
            </div>
          </div>

          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-3xl font-bold text-cyber-blue">{formatFileSize(totalSize)}</p>
              </div>
              <HardDrive className="w-8 h-8 text-cyber-blue/50" />
            </div>
          </div>

          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg File Size</p>
                <p className="text-3xl font-bold text-cyber-blue">{formatFileSize(averageFileSize)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyber-blue/50" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Types Distribution */}
          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <PieChart className="w-5 h-5 text-cyber-blue" />
              <h2 className="text-xl font-semibold text-cyber-blue">File Types Distribution</h2>
            </div>
            
            <div className="space-y-4">
              {sortedFileTypes.map(([category, data]) => {
                const percentage = totalFiles > 0 ? Math.round((data.count / totalFiles) * 100) : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileTypeIcon 
                          iconName={data.typeInfo.icon} 
                          color={data.typeInfo.color} 
                          size={24} 
                        />
                        <div>
                          <div className="font-medium text-foreground capitalize">
                            {category}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} files • {formatFileSize(data.size)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyber-blue">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-cyber-blue/10 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 ease-out"
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

          {/* Largest Files */}
          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-5 h-5 text-cyber-blue" />
              <h2 className="text-xl font-semibold text-cyber-blue">Largest Files</h2>
            </div>
            
            <div className="space-y-3">
              {largestFiles.map((file, index) => {
                const typeInfo = getFileTypeInfo(file.name);
                return (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-cyber-blue/5 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyber-blue/10 rounded-full flex items-center justify-center text-sm font-bold text-cyber-blue">
                      {index + 1}
                    </div>
                    <FileTypeIcon 
                      iconName={typeInfo.icon} 
                      color={typeInfo.color} 
                      size={20} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {typeInfo.description}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-cyber-blue">
                      {formatFileSize(file.size || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Files className="w-5 h-5 text-cyber-blue" />
              <h2 className="text-xl font-semibold text-cyber-blue">Recent Files</h2>
            </div>
            
            <div className="space-y-3">
              {recentFiles.map((file) => {
                const typeInfo = getFileTypeInfo(file.name);
                return (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-cyber-blue/5 rounded-lg">
                    <FileTypeIcon 
                      iconName={typeInfo.icon} 
                      color={typeInfo.color} 
                      size={20} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(file.modified)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {file.size ? formatFileSize(file.size) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Storage Breakdown by Size */}
          <div className="bg-cyber-dark-card border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <HardDrive className="w-5 h-5 text-cyber-blue" />
              <h2 className="text-xl font-semibold text-cyber-blue">Storage by Type</h2>
            </div>
            
            <div className="space-y-4">
              {sortedFileTypes
                .sort(([,a], [,b]) => b.size - a.size)
                .map(([category, data]) => {
                  const percentage = totalSize > 0 ? Math.round((data.size / totalSize) * 100) : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileTypeIcon 
                            iconName={data.typeInfo.icon} 
                            color={data.typeInfo.color} 
                            size={20} 
                          />
                          <span className="text-sm font-medium text-foreground capitalize">
                            {category}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-cyber-blue">
                          {formatFileSize(data.size)} ({percentage}%)
                        </div>
                      </div>
                      <div className="w-full bg-cyber-blue/10 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500 ease-out"
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
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
