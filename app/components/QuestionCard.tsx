"use client";

import React, { useState } from 'react';
import { EyeOff, Eye, Trash2, RotateCcw, RotateCw, ArrowUp, ArrowDown } from 'lucide-react';
import { QuestionItem } from './types';

export function QuestionCard({ item, mode, onRemove, onUpdate, onMoveUp, onMoveDown, isFirst, isLast }: { item: QuestionItem; mode: 'view' | 'add' | 'delete'; onRemove: () => void, onUpdate: (q: QuestionItem) => void, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean }) {
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
    <div className="question-card-wrapper w-full bg-white flex flex-col relative rounded-lg border border-gray-200 shadow-sm hover:shadow-md">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex flex-wrap items-center gap-4 justify-between w-full rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
            <button 
              onClick={onMoveUp}
              disabled={isFirst}
              className={`p-1.5 rounded transition ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
              title="Move Up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button 
              onClick={onMoveDown}
              disabled={isLast}
              className={`p-1.5 rounded transition ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
              title="Move Down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={() => handleRotate(-90)} className="flex items-center px-3 py-1.5 hover:bg-white rounded hover:shadow-sm text-sm font-medium text-gray-700 transition" title="Rotate Left">
              <RotateCcw className="w-4 h-4 mr-2" /> Rotate Left
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            <button onClick={() => handleRotate(90)} className="flex items-center px-3 py-1.5 hover:bg-white rounded hover:shadow-sm text-sm font-medium text-gray-700 transition" title="Rotate Right">
              <RotateCw className="w-4 h-4 mr-2" /> Rotate Right
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
          <div className="h-6 w-px bg-gray-300"></div>
          <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove Image">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
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