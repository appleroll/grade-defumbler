import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Plus } from 'lucide-react';
import { QuestionItem, QuestionSet } from '../types';
import { QuestionCard } from '../QuestionCard';
import { GlobalMode } from './FloatingToolbar';

interface ActiveTestProps {
  set: QuestionSet;
  globalMode: GlobalMode;
  isProcessing: boolean;
  onQuestionsUpdate: (newQuestions: QuestionItem[]) => void;
  onProcessFiles: (files: File[]) => Promise<QuestionItem[]>;
}

/**
 * Component representing the active selected set. It handles drag and drop uploading,
 * reordering questions, and inline insertions.
 */
export function ActiveTest({ set, globalMode, isProcessing, onQuestionsUpdate, onProcessFiles }: ActiveTestProps) {
  
  // Handles main dropzone logic at the bottom or empty state
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newQuestions = await onProcessFiles(acceptedFiles);
    onQuestionsUpdate([...set.questions, ...newQuestions]);
  }, [set.questions, onProcessFiles, onQuestionsUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif']
    }
  });

  // Handle uploading specific images exactly between existing cards
  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>, insertIndex: number) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    const newQuestions = await onProcessFiles(files);
    const updated = [...set.questions];
    updated.splice(insertIndex, 0, ...newQuestions);
    
    onQuestionsUpdate(updated);
    e.target.value = '';
  };

  // Reordering handler
  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= set.questions.length) return;
    
    const newQuestions = [...set.questions];
    const temp = newQuestions[idx];
    newQuestions[idx] = newQuestions[newIdx];
    newQuestions[newIdx] = temp;
    
    onQuestionsUpdate(newQuestions);
  };

  return (
    <div className="w-full flex flex-col pb-32">
      {/* Set Header */}
      <div className="w-full bg-white border-b border-gray-200 p-8 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
          {set.name}
          <span className="ml-4 text-sm font-normal text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
            {set.questions.length} Images
          </span>
        </h1>
      </div>

      {set.questions.length === 0 ? (
        // Empty State Dropzone
        <div className="p-8 w-full mx-auto space-y-8 mt-12">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black/50'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-6" />
            <p className="text-xl font-medium text-gray-800">
              {isProcessing ? 'Processing files...' : 'Drag & drop photos here'}
            </p>
          </div>
        </div>
      ) : (
        // Cards Feed
        <div className="w-full flex flex-col mx-auto space-y-6 mt-8 p-4 px-8">
          {set.questions.map((q, i) => (
            <React.Fragment key={q.id}>
              {/* Insert Image Between Button */}
              {i > 0 && (
          <div className="pt-8">
            <div 
              {...getRootProps()} 
              className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black/50'
              } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />
              <p className="text-sm font-medium text-gray-600 flex items-center justify-center">
                <Plus className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing files...' : 'Add image here'}
              </p>
            </div>
            </div>
              )}

              <QuestionCard 
                item={q} 
                mode={globalMode}
                isFirst={i === 0}
                isLast={i === set.questions.length - 1}
                onMoveUp={() => moveQuestion(i, 'up')}
                onMoveDown={() => moveQuestion(i, 'down')}
                onRemove={() => onQuestionsUpdate(set.questions.filter(item => item.id !== q.id))}
                onUpdate={(updatedQuestion) => {
                  onQuestionsUpdate(set.questions.map(item => item.id === q.id ? updatedQuestion : item));
                }}
              />
            </React.Fragment>
          ))}

          {/* Append to Bottom Dropzone */}
          <div className="pt-8">
            <div 
              {...getRootProps()} 
              className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black/50'
              } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />
              <p className="text-sm font-medium text-gray-600 flex items-center justify-center">
                <Plus className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing files...' : 'Add image here'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
