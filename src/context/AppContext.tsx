import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import type { Subject, Question, ExamRecord, ExamMode, WrongQuestion, ExamDraft } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { questions as allQuestions } from '../data/questions';
import { getLocalDate } from '../utils';

interface ExamState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string[]>;
  mode: ExamMode;
  subjectFilter: Subject[];
  timeStarted: number | null;
}

type ExamAction =
  | { type: 'START_EXAM'; questions: Question[]; filter: Subject[] }
  | { type: 'ANSWER'; questionId: string; selected: string[] }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GO_TO'; index: number }
  | { type: 'SUBMIT' }
  | { type: 'RESTORE_DRAFT'; draft: ExamDraft; questions: Question[] }
  | { type: 'RESET' };

function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case 'START_EXAM':
      return {
        questions: action.questions,
        currentIndex: 0,
        answers: {},
        mode: 'exam',
        subjectFilter: action.filter,
        timeStarted: Date.now(),
      };
    case 'RESTORE_DRAFT':
      return {
        questions: action.questions,
        currentIndex: action.draft.currentIndex,
        answers: action.draft.answers,
        mode: 'exam',
        subjectFilter: action.draft.subjectFilter,
        timeStarted: action.draft.timeStarted,
      };
    case 'ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.selected },
      };
    case 'NEXT':
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
      };
    case 'PREV':
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
      };
    case 'GO_TO':
      return {
        ...state,
        currentIndex: action.index,
      };
    case 'SUBMIT':
      return { ...state };
    case 'RESET':
      return {
        questions: [],
        currentIndex: 0,
        answers: {},
        mode: 'exam',
        subjectFilter: [],
        timeStarted: null,
      };
    default:
      return state;
  }
}

interface AppContextType {
  exam: ExamState;
  dispatch: React.Dispatch<ExamAction>;
  history: ExamRecord[];
  addRecord: (record: ExamRecord) => void;
  wrongBook: WrongQuestion[];
  addWrongQuestions: (ids: string[]) => void;
  removeWrongQuestions: (ids: string[]) => void;
  clearDraft: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DRAFT_KEY = 'fkao_exam_draft';

function loadDraft(): ExamState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: ExamDraft = JSON.parse(raw);
    if (!draft.questionIds || draft.questionIds.length === 0) return null;
    const qs = draft.questionIds.map((id) => allQuestions.find((q) => q.id === id)).filter(Boolean) as Question[];
    if (qs.length === 0) return null;
    return {
      questions: qs,
      currentIndex: draft.currentIndex,
      answers: draft.answers,
      mode: 'exam' as ExamMode,
      subjectFilter: draft.subjectFilter,
      timeStarted: draft.timeStarted,
    };
  } catch {
    return null;
  }
}

function getInitialExamState(): ExamState {
  const draft = loadDraft();
  if (draft) return draft;
  return {
    questions: [],
    currentIndex: 0,
    answers: {},
    mode: 'exam',
    subjectFilter: [],
    timeStarted: null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [exam, dispatch] = useReducer(examReducer, null, getInitialExamState);

  const [history, setHistory] = useLocalStorage<ExamRecord[]>('fkao_history', []);
  const [wrongBook, setWrongBook] = useLocalStorage<WrongQuestion[]>('fkao_wrongbook', []);

  // Auto-save draft whenever exam state changes
  useEffect(() => {
    if (exam.questions.length === 0 || !exam.timeStarted) return;
    const draft: ExamDraft = {
      questionIds: exam.questions.map((q) => q.id),
      answers: exam.answers,
      currentIndex: exam.currentIndex,
      timeStarted: exam.timeStarted,
      subjectFilter: exam.subjectFilter,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [exam.questions, exam.answers, exam.currentIndex, exam.timeStarted, exam.subjectFilter]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  // Merge wrongbook-data.json from public/ on every load
  useEffect(() => {
    fetch('/wrongbook-data.json')
      .then((res) => {
        if (!res.ok) throw new Error('no file');
        return res.json();
      })
      .then((fileData: WrongQuestion[]) => {
        if (!Array.isArray(fileData) || fileData.length === 0) return;

        setWrongBook((prev) => {
          const map = new Map<string, WrongQuestion>();
          fileData.forEach((w) => {
            if (w.questionId) map.set(w.questionId, w);
          });
          prev.forEach((w) => {
            map.set(w.questionId, w);
          });
          return Array.from(map.values()).sort((a, b) => b.lastWrong.localeCompare(a.lastWrong));
        });
      })
      .catch(() => { /* no file yet, that's fine */ });
  }, []);

  const addRecord = (record: ExamRecord) => {
    setHistory((prev) => [record, ...prev]);
  };

  const addWrongQuestions = useCallback((ids: string[]) => {
    const today = getLocalDate();
    setWrongBook((prev) => {
      const map = new Map(prev.map((w) => [w.questionId, w]));
      ids.forEach((id) => {
        const existing = map.get(id);
        if (existing) {
          map.set(id, { ...existing, wrongCount: existing.wrongCount + 1, lastWrong: today });
        } else {
          map.set(id, { questionId: id, wrongCount: 1, lastWrong: today });
        }
      });
      return Array.from(map.values()).sort((a, b) => b.lastWrong.localeCompare(a.lastWrong));
    });
  }, [setWrongBook]);

  const removeWrongQuestions = useCallback((ids: string[]) => {
    setWrongBook((prev) => prev.filter((w) => !ids.includes(w.questionId)));
  }, [setWrongBook]);

  return (
    <AppContext.Provider value={{ exam, dispatch, history, addRecord, wrongBook, addWrongQuestions, removeWrongQuestions, clearDraft }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
