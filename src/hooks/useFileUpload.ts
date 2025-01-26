import { useState, useEffect } from 'react';

export interface FileWithPreview {
  file: File | null;
  previewUrl?: string;
}

interface UseFileUploadOptions {
  onError?: (error: string) => void;
  maxSizeInMB?: number;
  acceptedFileTypes?: string[];
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<Map<string, FileWithPreview>>(new Map());
  
  const validateFile = (file: File): string | null => {
    if (options.maxSizeInMB && file.size > options.maxSizeInMB * 1024 * 1024) {
      return `File size should not exceed ${options.maxSizeInMB}MB`;
    }

    if (options.acceptedFileTypes && !options.acceptedFileTypes.includes(file.type)) {
      return `File type not supported. Accepted types: ${options.acceptedFileTypes.join(', ')}`;
    }

    return null;
  };

  const addFile = (key: string, file: File | null) => {
    setFiles(prev => {
      const newFiles = new Map(prev);
      
      // Clean up old preview if exists
      const existing = prev.get(key);
      if (existing?.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl);
      }

      if (file) {
        const error = validateFile(file);
        if (error) {
          options.onError?.(error);
          return prev;
        }

        newFiles.set(key, {
          file,
          previewUrl: URL.createObjectURL(file)
        });
      } else {
        newFiles.delete(key);
      }

      return newFiles;
    });
  };

  const getFile = (key: string): FileWithPreview | undefined => {
    return files.get(key);
  };

  const removeFile = (key: string) => {
    setFiles(prev => {
      const newFiles = new Map(prev);
      const existing = prev.get(key);
      if (existing?.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl);
      }
      newFiles.delete(key);
      return newFiles;
    });
  };

  const clearFiles = () => {
    files.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setFiles(new Map());
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  return {
    files,
    addFile,
    getFile,
    removeFile,
    clearFiles
  };
} 