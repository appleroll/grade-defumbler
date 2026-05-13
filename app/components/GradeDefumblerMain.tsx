"use client";

import React, { useState } from 'react';
import { useTestManager } from './hooks/useTestManager';
import { useImageProcessor } from './hooks/useImageProcessor';
import { Sidebar } from './ui/Sidebar';
import { WelcomeScreen } from './ui/WelcomeScreen';
import { ActiveTest } from './ui/ActiveTest';
import { FloatingToolbar, GlobalMode } from './ui/FloatingToolbar';

/**
 * GradeDefumblerMain is the root client-side wrapper.
 * It ties together the sidebar, welcome screen, floating tools, and active test view,
 * delegating complex storage logic and image processing to external hooks.
 */
export default function GradeDefumblerMain() {
  const {
    tests,
    activeTest,
    activeTestId,
    setActiveTestId,
    isLoaded,
    createNewTest,
    deleteTest,
    renameTest,
    updateActiveTestQuestions
  } = useTestManager();

  const { isProcessing, processFiles } = useImageProcessor();
  const [globalMode, setGlobalMode] = useState<GlobalMode>('view');

  // Show a loading text while localforage is loading data
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading your data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans w-full flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        tests={tests}
        activeTestId={activeTestId}
        onSelectTest={setActiveTestId}
        onCreateTest={createNewTest}
        onDeleteTest={deleteTest}
        onRenameTest={renameTest}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen relative">
        
        {/* Render either the welcome instructions or the selected test feed */}
        {!activeTest ? (
          <WelcomeScreen onCreateTest={createNewTest} />
        ) : (
          <>
            <ActiveTest 
              test={activeTest}
              globalMode={globalMode}
              isProcessing={isProcessing}
              onQuestionsUpdate={updateActiveTestQuestions}
              onProcessFiles={processFiles}
            />
            {/* Show floating toolbar only if the active test actually has images to edit */}
            {activeTest.questions.length > 0 && (
              <FloatingToolbar mode={globalMode} onModeChange={setGlobalMode} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
