"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, EyeOff, Eye, Trash2, RotateCcw, RotateCw, Plus, Folder, FolderOpen, Settings, MousePointer2, SquarePen, Eraser } from 'lucide-react';
import localforage from 'localforage';

interface QuestionItem {
  id: string;
  sourceUrl: string; // Base64 data URL to allow persistence
  blackouts: { x: number; y: number; w: number; h: number }[];
}

interface TestSet {
  id: string;
  name: string;
  questions: QuestionItem[];
}

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

  // Initialize storage
  useEffect(() => {
    localforage.config({
      name: 'WrongQuestionsApp',
      storeName: 'exam_data'
    });

    localforage.getItem<TestSet[]>('wrong-questions-tests').then((savedTests) => {
      if (savedTests && savedTests.length > 0) {
        setTests(savedTests);
        setActiveTestId(savedTests[0].id);
      } else {
        const defaultTest = { id: Math.random().toString(36).substr(2, 9), name: 'My First Test', questions: [] };
        setTests([defaultTest]);
        setActiveTestId(defaultTest.id);
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!activeTestId) return;
    setIsProcessing(true);
    
    let heic2any: any;
    try { heic2any = (await import('heic2any')).default; } catch (e) { console.error(e); }

    const newQuestions = await Promise.all(
      acceptedFiles.map(async (file) => {
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
    
    setTests(prev => prev.map(t => {
      if (t.id === activeTestId) {
        return { ...t, questions: [...t.questions, ...newQuestions] };
      }
      return t;
    }));
    setIsProcessing(false);
  }, [activeTestId]);

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
          <h2 className="font-bold tracking-tight text-xl flex items-center">
            RedoQuestion
          </h2>
          <button onClick={createNewTest} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition" title="New Test">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 p-2 space-y-1">
          {tests.map(test => (
            <div 
              key={test.id}
              onClick={() => { setActiveTestId(test.id); }}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                activeTestId === test.id ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                {activeTestId === test.id ? <FolderOpen className="w-4 h-4 shrink-0 transition" /> : <Folder className="w-4 h-4 shrink-0 transition" />}
                <input 
                  type="text" 
                  value={test.name}
                  onChange={(e) => renameTest(test.id, e.target.value)}
                  className={`bg-transparent border-none outline-none font-medium truncate w-full transition ${activeTestId === test.id ? 'text-white' : 'text-gray-900'}`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button 
                onClick={(e) => deleteTest(test.id, e)}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${activeTestId === test.id ? 'hover:bg-white/20' : 'hover:bg-gray-200 hover:text-red-500'}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen">
        {!activeTest ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select or create a test to start
          </div>
        ) : (
          <div className="w-full flex flex-col pb-32">
            <div className="w-full bg-white border-b border-gray-200 p-8 flex items-center justify-between shadow-sm">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
                {activeTest.name}
                <span className="ml-4 text-sm font-normal text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                  {activeTest.questions.length} Questions
                </span>
              </h1>
            </div>

            {activeTest.questions.length === 0 ? (
               <div className="p-8 max-w-5xl mx-auto space-y-8 mt-12 w-full">
                 <div 
                   {...getRootProps()} 
                   className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                     isDragActive ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black/50'
                   } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                 >
                   <input {...getInputProps()} />
                   <Upload className="mx-auto h-12 w-12 text-gray-400 mb-6" />
                   <p className="text-xl font-medium text-gray-800">
                     {isProcessing ? 'Saving files to browser...' : 'Drag & drop photos here'}
                   </p>
                 </div>
               </div>
            ) : (
              <div 
                 {...getRootProps()} 
                 className={`w-full max-w-5xl mx-auto mt-8 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                   isDragActive ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black/50'
                 } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
               >
                 <input {...getInputProps()} />
                 <p className="text-sm font-medium text-gray-600 flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                   {isProcessing ? 'Saving files...' : 'Add more photos'}
                 </p>
               </div>
            )}

            <div className="w-full flex flex-col space-y-8 mt-8 p-4">
              {activeTest.questions.map((q) => (
                <QuestionCard 
                  key={q.id} 
                  item={q} 
                  onRemove={() => updateActiveTestQuestions(activeTest.questions.filter(item => item.id !== q.id))}
                  onUpdate={(updatedQuestion) => {
                    updateActiveTestQuestions(activeTest.questions.map(item => item.id === q.id ? updatedQuestion : item));
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ item, onRemove, onUpdate }: { item: QuestionItem; onRemove: () => void, onUpdate: (q: QuestionItem) => void }) {
  const [mode, setMode] = useState<'view' | 'add' | 'delete'>('view');
  const [revealAnswer, setRevealAnswer] = useState(false);

  const handleRotate = (angle: number) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      const rads = (angle * Math.PI) / 180;
      if (Math.abs(angle) === 90 || Math.abs(angle) === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      onUpdate({ ...item, sourceUrl: canvas.toDataURL("image/jpeg", 0.90), blackouts: [] });
    };
    img.src = item.sourceUrl;
  };

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'view' || revealAnswer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentBox || mode === 'view') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentBox({
      ...currentBox,
      w: x - currentBox.x,
      h: y - currentBox.y,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || mode === 'view') return;
    setIsDrawing(false);
    
    if (currentBox) {
      const w = Math.abs(currentBox.w);
      const h = Math.abs(currentBox.h);
      const x = currentBox.w < 0 ? currentBox.x + currentBox.w : currentBox.x;
      const y = currentBox.h < 0 ? currentBox.y + currentBox.h : currentBox.y;

      if (mode === 'add' && w > 0.5 && h > 0.5) {
        onUpdate({ ...item, blackouts: [...item.blackouts, { x, y, w, h }] });
      } else if (mode === 'delete') {
        const rw = w < 0.2 ? 0.2 : w;
        const rh = h < 0.2 ? 0.2 : h;
        const sel = { x, y, w: rw, h: rh };
        
        const remaining = item.blackouts.filter(box => {
          // true if NO intersection
          return (sel.x > box.x + box.w || sel.x + sel.w < box.x || sel.y > box.y + box.h || sel.y + sel.h < box.y);
        });
        
        if (remaining.length !== item.blackouts.length) {
          onUpdate({ ...item, blackouts: remaining });
        }
      }
    }
    setCurrentBox(null);
  };

  return (
    <div 
      data-id={item.id}
      className="question-card-wrapper w-full bg-white flex flex-col relative rounded-lg transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
    >
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex flex-wrap items-center gap-4 justify-between w-full rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={() => handleRotate(-90)} className="p-2 hover:bg-white rounded hover:shadow-sm text-gray-700 transition" title="Rotate Left"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={() => handleRotate(90)} className="p-2 hover:bg-white rounded hover:shadow-sm text-gray-700 transition" title="Rotate Right"><RotateCw className="w-4 h-4" /></button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <div className="flex bg-gray-100 rounded-lg p-1 space-x-1">
            <button 
              onClick={() => setMode('view')} 
              className={`p-2 rounded text-sm font-medium flex items-center transition ${mode === 'view' ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'}`}
              title="View Mode"
            >
              <MousePointer2 className="w-4 h-4 mr-2" /> View
            </button>
            <button 
              onClick={() => setMode('add')} 
              className={`p-2 rounded text-sm font-medium flex items-center transition ${mode === 'add' ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'}`}
              title="Draw Blackout"
            >
              <SquarePen className="w-4 h-4 mr-2" /> Blackout
            </button>
            <button 
              onClick={() => setMode('delete')} 
              className={`p-2 rounded text-sm font-medium flex items-center transition ${mode === 'delete' ? 'bg-red-100 text-red-700 shadow' : 'text-gray-600 hover:text-red-600'}`}
              title="Delete Blackout"
            >
              <Eraser className="w-4 h-4 mr-2" /> Erase
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <button 
            onClick={() => setRevealAnswer(!revealAnswer)}
            disabled={item.blackouts.length === 0}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              item.blackouts.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' :
              revealAnswer ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'text-white bg-black hover:bg-gray-800'
            }`}
            title="Toggle Reveal"
          >
            {revealAnswer ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {revealAnswer ? 'Hide Answers' : 'Reveal Answers'}
          </button>
        </div>

        <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove Image"><Trash2 className="w-5 h-5" /></button>
      </div>

      <div className="w-full bg-gray-100 flex items-start justify-center rounded-b-lg overflow-hidden">
        <div 
          className={`relative w-full ${mode === 'add' && !revealAnswer ? 'cursor-crosshair' : mode === 'delete' && !revealAnswer ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img src={item.sourceUrl} alt="Question" className="w-full h-auto block select-none" draggable="false" />
          
          {item.blackouts.map((box, i) => (
            <div 
              key={i}
              className={`absolute bg-gray-900 transition-all duration-200 ${revealAnswer ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${mode === 'delete' ? 'hover:bg-red-500/80 hover:ring-2 hover:ring-red-500' : ''}`}
              style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
            />
          ))}

          {isDrawing && currentBox && (
            <div 
              className={`absolute border pointer-events-none ${mode === 'add' ? 'bg-gray-900/60 border-gray-900' : 'bg-red-500/40 border-red-500'}`}
              style={{
                left: `${currentBox.w < 0 ? currentBox.x + currentBox.w : currentBox.x}%`,
                top: `${currentBox.h < 0 ? currentBox.y + currentBox.h : currentBox.y}%`,
                width: `${Math.abs(currentBox.w)}%`,
                height: `${Math.abs(currentBox.h)}%`
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
