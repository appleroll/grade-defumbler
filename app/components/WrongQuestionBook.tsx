"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Eye, EyeOff, Trash2, Plus, Folder, FolderOpen, MousePointer2, SquarePen, Eraser, MoreVertical, Edit2 } from 'lucide-react';
import localforage from 'localforage';
import { QuestionItem, TestSet } from './types';
import { QuestionCard } from './QuestionCard';

const fileToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function WrongQuestionBook() {
  const [tests, setTests] = useState<TestSet[]>([]);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // New Global State
  const [globalMode, setGlobalMode] = useState<'view' | 'add' | 'delete'>('view');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  // Initialize storage
  useEffect(() => {
    localforage.config({
      name: 'WrongQuestionsApp',
      storeName: 'exam_data'
    });

    localforage.getItem<TestSet[]>('wrong-questions-tests').then((savedTests) => {
      if (savedTests && savedTests.length > 0) {
        setTests(savedTests);
        setActiveTestId(null);
      } else {
        setTests([]);
        setActiveTestId(null);
      }
      setIsLoaded(true);
    }).catch(err => {
      console.error('Error loading from storage:', err);
      setIsLoaded(true);
    });
  }, []);

  // Save changes automatically
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('wrong-questions-tests', tests).catch(err => console.error('Error saving data:', err));
    }
  }, [tests, isLoaded]);

  const activeTest = tests.find(t => t.id === activeTestId);

  const createNewTest = () => {
    const newTest: TestSet = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New Test ${tests.length + 1}`,
      questions: []
    };
    setTests([...tests, newTest]);
    setActiveTestId(newTest.id);
  };

  const deleteTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this entire test?')) return;
    const sorted = tests.filter(t => t.id !== id);
    setTests(sorted);
    if (activeTestId === id) setActiveTestId(sorted.length > 0 ? sorted[0].id : null);
  };

  const renameTest = (id: string, newName: string) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const updateActiveTestQuestions = (newQuestions: QuestionItem[]) => {
    setTests(prev => prev.map(t => t.id === activeTestId ? { ...t, questions: newQuestions } : t));
  };

  const processFiles = async (files: File[]) => {
    let heic2any: any;
    try { heic2any = (await import('heic2any')).default; } catch (e) { console.error(e); }

    return await Promise.all(
      files.map(async (file) => {
        let processableBlob: Blob = file;
        const fileName = file.name.toLowerCase();
        
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
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!activeTestId) return;
    setIsProcessing(true);
    const newQuestions = await processFiles(acceptedFiles);
    setTests(prev => prev.map(t => t.id === activeTestId ? { ...t, questions: [...t.questions, ...newQuestions] } : t));
    setIsProcessing(false);
  }, [activeTestId]);

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>, insertIndex: number) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeTestId) return;
    setIsProcessing(true);
    
    const newQuestions = await processFiles(files);
    setTests(prev => prev.map(t => {
      if (t.id === activeTestId) {
        const arr = [...t.questions];
        arr.splice(insertIndex, 0, ...newQuestions);
        return { ...t, questions: arr };
      }
      return t;
    }));
    
    setIsProcessing(false);
    e.target.value = '';
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!activeTest) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= activeTest.questions.length) return;
    
    const newQuestions = [...activeTest.questions];
    const temp = newQuestions[idx];
    newQuestions[idx] = newQuestions[newIdx];
    newQuestions[newIdx] = temp;
    
    updateActiveTestQuestions(newQuestions);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif']
    }
  });

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading your data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans w-full flex">
      {/* Sidebar for Tests */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen overflow-y-auto shadow-sm z-40">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <button 
            onClick={() => setActiveTestId(null)}
            className="font-bold tracking-tight text-xl flex items-center hover:text-gray-600 transition"
          >
            Exam Defumbler
          </button>
          <button onClick={createNewTest} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition" title="New Test">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 p-2 space-y-1">
          {tests.map(test => (
            <div 
              key={test.id}
              onClick={() => { setActiveTestId(test.id); setMenuOpenId(null); setEditingTestId(null); }}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all relative ${
                activeTestId === test.id ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden flex-1">
                {activeTestId === test.id ? <FolderOpen className="w-4 h-4 shrink-0 transition" /> : <Folder className="w-4 h-4 shrink-0 transition" />}
                {editingTestId === test.id ? (
                  <input 
                    type="text" 
                    value={test.name}
                    autoFocus
                    onBlur={() => setEditingTestId(null)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingTestId(null); }}
                    onChange={(e) => renameTest(test.id, e.target.value)}
                    className={`bg-transparent border-none outline-none font-medium truncate w-full transition ${activeTestId === test.id ? 'text-white' : 'text-gray-900'}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={`font-medium truncate w-full transition select-none ${activeTestId === test.id ? 'text-white' : 'text-gray-900'}`}>
                    {test.name}
                  </span>
                )}
              </div>
              <div className="relative flex-shrink-0 ml-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === test.id ? null : test.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${activeTestId === test.id ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                  title="Test Settings"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {menuOpenId === test.id && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-50 overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTestId(test.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                    >
                      <Edit2 className="w-4 h-4 mr-2 text-gray-500" /> Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTest(test.id, e);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors border-t border-gray-100"
                    >
                      <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen relative">
        {/* Global Floating Toolbar */}
        {activeTest && activeTest.questions.length > 0 && (
          <div className="fixed bottom-8 left-1/2 ml-32 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md rounded-full shadow-2xl px-2 py-2 flex items-center space-x-1 border border-gray-700 z-50">
            <button 
              onClick={() => setGlobalMode('view')} 
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition ${globalMode === 'view' ? 'bg-white text-black shadow-sm' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
            >
              <MousePointer2 className="w-4 h-4 mr-2" /> View
            </button>
            <button 
              onClick={() => setGlobalMode('add')} 
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition ${globalMode === 'add' ? 'bg-white text-black shadow-sm' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
            >
              <SquarePen className="w-4 h-4 mr-2" /> Blackout
            </button>
            <button 
              onClick={() => setGlobalMode('delete')} 
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition ${globalMode === 'delete' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
            >
              <Eraser className="w-4 h-4 mr-2" /> Erase
            </button>
          </div>
        )}

        {!activeTest ? (
          <div className="flex flex-col items-center justify-center min-h-screen text-gray-900 p-8 space-y-8 max-w-2xl mx-auto relative">
            <div className="text-center space-y-9">
              <h1 className="text-5xl font-extrabold tracking-tight">Exam Defumbler</h1>
              <p className="text-xl text-gray-500">Fumbling your questions and making mistakes? This tool's designed to make you learn from your mistakes so they never happen again.</p>
            </div>
            
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-100 pb-4">How to Use</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-gray-100 p-3 rounded-xl mr-4"><Folder className="w-6 h-6 text-gray-700" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">1. Review Your Questions</h3>
                    <p className="text-gray-600">Mark down what you did wrong and the write answer on the test paper.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-gray-100 p-3 rounded-xl mr-4"><Upload className="w-6 h-6 text-gray-700" /></div>
                                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">2. Upload Tests</h3>
                    <p className="text-gray-600">Create a new test and upload images of your test papers. Don't worry, your mistakes stay on your laptop :)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-gray-100 p-3 rounded-xl mr-4"><SquarePen className="w-6 h-6 text-gray-700" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">2. Blackout Answers</h3>
                    <p className="text-gray-600">Select "Blackout" from the bottom toolbar and drag over answers or notes to hide them.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-gray-100 p-3 rounded-xl mr-4"><Eye className="w-6 h-6 text-gray-700" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">3. Redo the questions</h3>
                    <p className="text-gray-600">Redo the questions and click "reveal answers". Repeat until you master them.</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 flex justify-center border-t border-gray-100">
                <button 
                  onClick={createNewTest}
                  className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition flex items-center shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Test
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col pb-32">
            <div className="w-full bg-white border-b border-gray-200 p-8 flex items-center justify-between shadow-sm">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
                {activeTest.name}
                <span className="ml-4 text-sm font-normal text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                  {activeTest.questions.length} Images
                </span>
              </h1>
            </div>

            {activeTest.questions.length === 0 ? (
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
              <div className="w-full flex flex-col mx-auto space-y-6 mt-8 p-4 px-8">
                {activeTest.questions.map((q, i) => (
                  <React.Fragment key={q.id}>
                    {/* Add Image Between Dropzone/Button */}
                    {i > 0 && (
                       <div className="w-full flex justify-center py-1 opacity-0 hover:opacity-100 transition-opacity duration-300">
                         <label className="cursor-pointer bg-white shadow-sm border border-gray-200 hover:bg-gray-50 rounded-full px-4 py-2 flex items-center text-sm text-gray-600 font-medium transition-colors">
                           <Plus className="w-4 h-4 mr-2" /> Add image between
                           <input type="file" multiple accept="image/*,.heic,.heif" className="hidden" onChange={(e) => handleInlineUpload(e, i)} />
                         </label>
                       </div>
                    )}

                    <QuestionCard 
                      item={q} 
                      mode={globalMode}
                      isFirst={i === 0}
                      isLast={i === activeTest.questions.length - 1}
                      onMoveUp={() => moveQuestion(i, 'up')}
                      onMoveDown={() => moveQuestion(i, 'down')}
                      onRemove={() => updateActiveTestQuestions(activeTest.questions.filter(item => item.id !== q.id))}
                      onUpdate={(updatedQuestion) => {
                        updateActiveTestQuestions(activeTest.questions.map(item => item.id === q.id ? updatedQuestion : item));
                      }}
                    />
                  </React.Fragment>
                ))}

                {/* Final Add to Bottom Section */}
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
                       {isProcessing ? 'Processing files...' : 'Add more photos at bottom'}
                     </p>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
