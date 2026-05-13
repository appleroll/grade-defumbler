import { useState } from 'react';
import { QuestionItem } from '../types';

/**
 * Utility function to convert a Blob (File) into a Base64 string.
 */
const fileToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Hook to manage the processing of image files, including HEIC conversion to JPEG
 * and base64 encoding. Returns the processing state and the processing function.
 */
export function useImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Given an array of File objects, converts them into new QuestionItem objects.
   * Handles HEIC/HEIF conversion automatically if the heic2any library is available.
   */
  const processFiles = async (files: File[]): Promise<QuestionItem[]> => {
    setIsProcessing(true);
    let heic2any: any;
    try { 
      // Dynamic import to avoid SSR issues if used in Next.js
      heic2any = (await import('heic2any')).default; 
    } catch (e) { console.error(e); }

    const results = await Promise.all(
      files.map(async (file) => {
        let processableBlob: Blob = file;
        const fileName = file.name.toLowerCase();
        
        // Convert HEIC formats to JPEG
        if (heic2any && (fileName.endsWith('.heic') || fileName.endsWith('.heif'))) {
          try {
            const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
            processableBlob = Array.isArray(converted) ? converted[0] : converted;
          } catch (error) {
            console.error('Error converting HEIC:', error);
          }
        }
        
        const base64Url = await fileToBase64(processableBlob);
        return {
          id: Math.random().toString(36).substr(2, 9),
          sourceUrl: base64Url,
          blackouts: []
        };
      })
    );
    
    setIsProcessing(false);
    return results;
  };

  return {
    isProcessing,
    processFiles
  };
}
