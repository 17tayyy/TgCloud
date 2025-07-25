import React from 'react';
import { useParams } from 'react-router-dom';
import SharedFile from '@/components/SharedFile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SharedProps {
  type: 'file' | 'folder';
}

const Shared: React.FC<SharedProps> = ({ type }) => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert className="bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              Invalid or missing access token in URL.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <SharedFile token={token} type={type} />;
};

export default Shared;
