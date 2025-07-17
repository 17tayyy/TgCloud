import React from 'react';
import { 
  ImageIcon, 
  VideoIcon, 
  MusicIcon, 
  FileTextIcon, 
  ArchiveIcon, 
  CodeIcon, 
  ScrollTextIcon, 
  FileIcon 
} from 'lucide-react';

interface FileTypeIconProps {
  iconName: string;
  color: string;
  size?: number;
  className?: string;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ iconName, color, size = 16, className = "" }) => {
  const iconProps = {
    size,
    style: { color },
    className
  };

  switch (iconName) {
    case 'ImageIcon':
      return <ImageIcon {...iconProps} />;
    case 'VideoIcon':
      return <VideoIcon {...iconProps} />;
    case 'MusicIcon':
      return <MusicIcon {...iconProps} />;
    case 'FileTextIcon':
      return <FileTextIcon {...iconProps} />;
    case 'ArchiveIcon':
      return <ArchiveIcon {...iconProps} />;
    case 'CodeIcon':
      return <CodeIcon {...iconProps} />;
    case 'ScrollTextIcon':
      return <ScrollTextIcon {...iconProps} />;
    case 'FileIcon':
    default:
      return <FileIcon {...iconProps} />;
  }
};

export default FileTypeIcon;
