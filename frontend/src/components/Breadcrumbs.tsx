
import React from 'react';
import { useFiles } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { Folder } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import EncryptionToggle from './EncryptionToggle';

const Breadcrumbs = () => {
  const { currentPath, setCurrentPath, moveFile } = useFiles();

  const pathParts = currentPath.split('/').filter(Boolean);
  
  const handlePathClick = (index: number) => {
    if (index === -1) {
      setCurrentPath('/');
    } else {
      const newPath = '/' + pathParts.slice(0, index + 1).join('/');
      setCurrentPath(newPath);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    const draggedFileId = e.dataTransfer.getData('text/plain');
    
    if (draggedFileId) {
      moveFile(draggedFileId, targetPath);
      toast({
        title: "File moved",
        description: `File moved to ${targetPath === '/' ? 'root' : targetPath}`,
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-cyber-dark-card/30 border-b border-cyber-blue/10">
      <div className="flex items-center space-x-2">
        <Folder className="w-4 h-4 text-cyber-blue" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePathClick(-1)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, '/')}
          className="text-cyber-blue hover:bg-cyber-blue/10 h-auto p-1 transition-colors duration-200 hover:ring-2 hover:ring-cyber-blue/30"
        >
          TgCloud
        </Button>
        
        {pathParts.map((part, index) => {
          const targetPath = '/' + pathParts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={index}>
              <span className="text-cyber-blue/50">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePathClick(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, targetPath)}
                className="text-cyber-blue hover:bg-cyber-blue/10 h-auto p-1 transition-colors duration-200 hover:ring-2 hover:ring-cyber-blue/30"
              >
                {part}
              </Button>
            </React.Fragment>
          );
        })}
      </div>

      <EncryptionToggle />
    </div>
  );
};

export default Breadcrumbs;
