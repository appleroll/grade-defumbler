import { useState, useEffect } from 'react';
import localforage from 'localforage';
import { QuestionItem, QuestionSet } from '../types';

/**
 * Custom hook to manage the state of the tests (sets of questions) and persistence to localforage.
 * This separates the data logic from the UI components.
 */
export function useTestManager() {
  const [tests, setTests] = useState<QuestionSet[]>([]);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize localforage storage and load existing tests on mount
  useEffect(() => {
    localforage.config({
      name: 'GradeDefumblerApp', // Updated database name for GDF
      storeName: 'exam_data'
    });

    localforage.getItem<QuestionSet[]>('questions').then((savedTests) => {
      if (savedTests && savedTests.length > 0) {
        setTests(savedTests);
      }
      setIsLoaded(true);
    }).catch(err => {
      console.error('Error loading from storage:', err);
      setIsLoaded(true);
    });
  }, []);

  // Save changes to storage automatically whenever tests update (and are loaded)
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('questions', tests).catch(err => console.error('Error saving data:', err));
    }
  }, [tests, isLoaded]);

  // Derived state for the currently active test
  const activeTest = tests.find(t => t.id === activeTestId);

  /**
   * Create a new empty test and set it as active
   */
  const createNewTest = () => {
    let testName = prompt('Enter a name for the new test:', `New Test ${tests.length + 1}`);
    if (testName === null) return; // User cancelled
    const newTest: QuestionSet = {
      id: Math.random().toString(36).substr(2, 9),
      name: testName.trim() === '' ? `Test ${tests.length + 1}` : testName.trim(),
      questions: []
    };
    setTests([...tests, newTest]);
    setActiveTestId(newTest.id);
  };

  /**
   * Delete a test by ID. 
   * If the active test is deleted, fallback to the first available test (if any).
   */
  const deleteTest = (id: string) => {
    const filtered = tests.filter(t => t.id !== id);
    setTests(filtered);
    if (activeTestId === id) setActiveTestId(filtered.length > 0 ? filtered[0].id : null);
  };

  /**
   * Rename an existing test
   */
  const renameTest = (id: string, newName: string) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  /**
   * Update the questions for the currently active test
   */
  const updateActiveTestQuestions = (newQuestions: QuestionItem[]) => {
    setTests(prev => prev.map(t => t.id === activeTestId ? { ...t, questions: newQuestions } : t));
  };

  return {
    tests,
    setTests,
    activeTest,
    activeTestId,
    setActiveTestId,
    isLoaded,
    createNewTest,
    deleteTest,
    renameTest,
    updateActiveTestQuestions
  };
}
