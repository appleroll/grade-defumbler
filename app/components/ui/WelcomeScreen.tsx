import React from 'react';
import Image from 'next/image';
import { Folder, Upload, SquarePen, Eye, Plus } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateTest: () => void;
}

/**
 * The initial welcome screen shown to the user when no set is selected.
 * Provides a brief tutorial on how to use Grade Defumbler
 */
export function WelcomeScreen({ onCreateTest }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-900 p-8 space-y-8 max-w-2xl mx-auto relative">
      <div className="text-center space-y-9">
        <h1 className="text-5xl font-extrabold tracking-tight flex items-center justify-center gap-4">
          <Image src="https://appleroll.github.io/grade-defumbler/icon.png" loading="eager" alt="Grade Defumbler Cat" width={64} height={64} className="object-cover" />
          Grade Defumbler
        </h1>
      </div>
      
      <div className="w-full p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-100 pb-4">How to Use</h2>
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="p-3 mr-4"><Folder className="w-6 h-6 text-gray-700" /></div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">1. Review Your Questions</h3>
              <p className="text-gray-600">Mark down what you did wrong and the right answer on the paper.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-3 mr-4"><Upload className="w-6 h-6 text-gray-700" /></div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">2. Upload</h3>
              <p className="text-gray-600">Create a new set and upload images of your questions. Don't worry, your mistakes stay on your laptop :)</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-3 mr-4"><SquarePen className="w-6 h-6 text-gray-700" /></div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">3. Blackout Answers</h3>
              <p className="text-gray-600">Select "Blackout" and drag over answers and notes to hide them.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-3 mr-4"><Eye className="w-6 h-6 text-gray-700" /></div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">4. Redo the questions</h3>
              <p className="text-gray-600">Redo the questions and click "reveal answers". Repeat until you get them right!</p>
            </div>
          </div>
        </div>
        <div className="pt-6 flex justify-center border-t border-gray-100">
          <button 
            onClick={onCreateTest}
            className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition flex items-center shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create a Question Set
          </button>
        </div>
      </div>
    </div>
  );
}
