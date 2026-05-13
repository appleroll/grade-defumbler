export interface QuestionItem {
  id: string;
  sourceUrl: string; // Base64 data URL to allow persistence
  blackouts: { x: number; y: number; w: number; h: number }[];
}

export interface QuestionSet {
  id: string;
  name: string;
  questions: QuestionItem[];
}
