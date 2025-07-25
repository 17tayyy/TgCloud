import React, { useState, useEffect } from 'react';
import { Download, File, Folder, Clock, HardDrive, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { sharedAPI } from '@/services/api';
import { formatFileSize } from '@/lib/utils';
import type { SharedFileInfo, SharedFolderInfo } from '@/types/api';

interface SharedFileProps {
  token: string;
  type: 'file' | 'folder';
}

const SharedFile: React.FC<SharedFileProps> = ({ token, type }) => {
  const [data, setData] = useState<SharedFileInfo | SharedFolderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (type === 'file') {
          response = await sharedAPI.getFileInfo(token);
        } else {
          response = await sharedAPI.getFolderInfo(token);
        }
        
        setData(response);
        console.log('Shared content loaded:', response); // Debug log
      } catch (err: unknown) {
        console.error('Error loading shared content:', err); // Debug log
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 404) {
          setError('File or folder not found or the link has expired.');
        } else if (error.response?.status === 403) {
          setError('You do not have permission to access this content.');
        } else {
          setError('Error loading shared content.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, type]);

  const handleDownload = async (filename?: string) => {
    const downloadKey = filename || 'main';
    
    try {
      setDownloading(downloadKey);
      setDownloadProgress(prev => ({ ...prev, [downloadKey]: 0 }));
      
      let blob;
      
      // Simular progreso de descarga
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const currentProgress = prev[downloadKey] || 0;
          if (currentProgress < 90) {
            return { ...prev, [downloadKey]: currentProgress + 10 };
          }
          return prev;
        });
      }, 100);
      
      if (type === 'file') {
        blob = await sharedAPI.downloadFile(token);
      } else if (filename) {
        blob = await sharedAPI.downloadFromFolder(token, filename);
      }
      
      clearInterval(progressInterval);
      setDownloadProgress(prev => ({ ...prev, [downloadKey]: 100 }));
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || (data as SharedFileInfo)?.filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      // Limpiar progreso después de un momento
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[downloadKey];
          return newProgress;
        });
      }, 2000);
      
    } catch (err: unknown) {
      setError('Error downloading file.');
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[downloadKey];
        return newProgress;
      });
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-300">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-red-800">
          <CardContent className="pt-6">
            <Alert className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <Alert className="bg-yellow-900/20 border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                No data available for this shared content.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
            TgCloud - Shared File
          </h1>
          <p className="text-gray-400">Securely shared content</p>
        </div>

        {type === 'file' && data && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-cyan-300">
                <File className="h-6 w-6" />
                {(data as SharedFileInfo).filename}
                {(data as SharedFileInfo).encrypted && (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-900 text-green-300">
                    Encrypted
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <HardDrive className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-500">Size</p>
                    <p className="font-semibold">{formatFileSize(parseInt((data as SharedFileInfo).size))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-500">Uploaded</p>
                    <p className="font-semibold">{formatDate((data as SharedFileInfo).uploaded_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold text-green-400">Available</p>
                  </div>
                </div>
              </div>

              {downloadProgress['main'] !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Downloading...</span>
                    <span className="text-cyan-400">{downloadProgress['main']}%</span>
                  </div>
                  <Progress value={downloadProgress['main']} className="h-2" />
                </div>
              )}

              <Button
                onClick={() => handleDownload()}
                disabled={downloading === 'main'}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === 'main' ? 'Downloading...' : 'Download File'}
              </Button>
            </CardContent>
          </Card>
        )}

        {type === 'folder' && data && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-cyan-300">
                <Folder className="h-6 w-6" />
                {(data as SharedFolderInfo).foldername}
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-900 text-blue-300">
                  {(data as SharedFolderInfo).files.length} files
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 text-gray-300 mb-4">
                <Calendar className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold">{formatDate((data as SharedFolderInfo).created_at)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">Files in folder</h3>
                {(data as SharedFolderInfo).files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white">{file.filename}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{formatFileSize(parseInt(file.size))}</span>
                          <span>{formatDate(file.uploaded_at)}</span>
                          {file.encrypted && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-900 text-green-300">
                              Encrypted
                            </span>
                          )}
                        </div>
                        {downloadProgress[file.filename] !== undefined && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Downloading...</span>
                              <span className="text-cyan-400">{downloadProgress[file.filename]}%</span>
                            </div>
                            <Progress value={downloadProgress[file.filename]} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(file.filename)}
                      disabled={downloading === file.filename}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {downloading === file.filename ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>This link may expire for security purposes. Download content soon.</p>
        </div>
      </div>
    </div>
  );
};

export default SharedFile;
