import React from 'react';
import { MousePointer2, SquarePen, Eraser } from 'lucide-react';

export type GlobalMode = 'view' | 'add' | 'delete';

interface FloatingToolbarProps {
  mode: GlobalMode;
  onModeChange: (mode: GlobalMode) => void;
}

/**
 * Floating toolbar rendered globally to toggle between 
 * View, Blackout (add mask), and Erase (remove mask) modes.
 */
export function FloatingToolbar({ mode, onModeChange }: FloatingToolbarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 ml-32 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md rounded-full shadow-2xl px-2 py-2 flex items-center space-x-1 border border-gray-700 z-50">
      <button 
        onClick={() => onModeChange('view')} 
        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition ${mode === 'view' ? 'bg-white text-black shadow-sm' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
      >
        <MousePointer2 className="w-4 h-4 mr-2" /> View
      </button>
      <button 
        onClick={() => onModeChange('add')} 
        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition ${mode === 'add' ? 'bg-white text-black shadow-sm' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
      >
        <SquarePen className="w-4 h-4 mr-2" /> Blackout
      </button>
      <button 
        onClick={() => onModeChange('delete')} 
        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition ${mode === 'delete' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
      >
        <Eraser className="w-4 h-4 mr-2" /> Erase
      </button>
    </div>
  );
}
