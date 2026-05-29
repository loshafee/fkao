export type Subject = '刑法' | '民法' | '刑诉' | '民诉' | '行政法' | '商经知' | '理论法' | '三国法';

export type QuestionType = 'single' | 'multi' | 'indeterminate';

export interface Question {
  id: string;
  subject: Subject;
  type: QuestionType;
  year: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: string[];
  explanation: string;
}

export interface AnswerRecord {
  questionId: string;
  userAnswer: string[];
  isCorrect: boolean;
}

export interface ExamRecord {
  date: string;
  score: number;
  total: number;
  timeUsed: number;
  answers: AnswerRecord[];
  subjectFilter: Subject[];
}

export type ExamMode = 'exam' | 'practice';

export interface WrongQuestion {
  questionId: string;
  wrongCount: number;
  lastWrong: string;
}

export interface ExamDraft {
  questionIds: string[];
  answers: Record<string, string[]>;
  currentIndex: number;
  timeStarted: number;
  subjectFilter: Subject[];
}
