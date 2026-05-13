import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Folder, FolderOpen, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { QuestionSet } from '../types';

interface SidebarProps {
  tests: QuestionSet[];
  activeTestId: string | null;
  onSelectTest: (id: string | null) => void;
  onCreateTest: () => void;
  onDeleteTest: (id: string) => void;
  onRenameTest: (id: string, newName: string) => void;
}

/**
 * Sidebar component to manage and navigate between different set sets.
 */
export function Sidebar({ tests, activeTestId, onSelectTest, onCreateTest, onDeleteTest, onRenameTest }: SidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this entire set?')) return;
    onDeleteTest(id);
    setMenuOpenId(null);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen overflow-y-auto shadow-sm z-40">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <button 
          onClick={() => onSelectTest(null)}
          className="font-bold tracking-tight text-l flex items-center hover:text-gray-500 transition"
        >
          <Image src="https://appleroll.github.io/grade-defumbler/icon.png" loading="eager" alt="GDF Logo" width={24} height={24} className="mr-2 object-cover rounded" />
          Grade Defumbler
        </button>
        <button onClick={onCreateTest} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition" title="New Set">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* Set List */}
      <div className="flex-1 p-2 space-y-1">
        {tests.map(set => (
          <div 
            key={set.id}
            onClick={() => { onSelectTest(set.id); setMenuOpenId(null); setEditingTestId(null); }}
            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all relative ${
              activeTestId === set.id ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3 overflow-hidden flex-1">
              {activeTestId === set.id ? <FolderOpen className="w-4 h-4 shrink-0 transition" /> : <Folder className="w-4 h-4 shrink-0 transition" />}
              {editingTestId === set.id ? (
                <input 
                  type="text" 
                  value={set.name}
                  autoFocus
                  onBlur={() => setEditingTestId(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingTestId(null); }}
                  onChange={(e) => onRenameTest(set.id, e.target.value)}
                  className={`bg-transparent border-none outline-none font-medium truncate w-full transition ${activeTestId === set.id ? 'text-white' : 'text-gray-900'}`}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`font-medium truncate w-full transition select-none ${activeTestId === set.id ? 'text-white' : 'text-gray-900'}`}>
                  {set.name}
                </span>
              )}
            </div>
            
            {/* Settings Context Menu */}
            <div className="relative flex-shrink-0 ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === set.id ? null : set.id);
                }}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${activeTestId === set.id ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                title="Set Settings"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {menuOpenId === set.id && (
                <div className="absolute right-0 mt-8 w-36 bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-50 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTestId(set.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-2 text-gray-500" /> Rename
                  </button>
                  <button
                    onClick={(e) => handleDelete(set.id, e)}
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
  );
}
