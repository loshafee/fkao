import type { Question, QuestionType } from '../types';

function renderExplanation(text: string) {
  const html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

interface Props {
  question: Question;
  selected: string[];
  onAnswer: (selected: string[]) => void;
  showResult?: boolean;
}

const typeLabel: Record<QuestionType, string> = {
  single: '单选题',
  multi: '多选题',
  indeterminate: '不定项选择题',
};

// State of each option in result mode
type OptState = 'chosen-correct' | 'missed-correct' | 'chosen-wrong' | 'idle';

export default function QuestionCard({ question, selected, onAnswer, showResult }: Props) {
  const isCorrect = showResult
    ? JSON.stringify([...selected].sort()) === JSON.stringify([...question.answer].sort())
    : null;

  const toggleOption = (key: string) => {
    if (showResult) return;
    if (question.type === 'single') {
      onAnswer([key]);
    } else {
      onAnswer(
        selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key]
      );
    }
  };

  const getOptState = (key: string): OptState => {
    if (!showResult) return 'idle';
    const isAns = question.answer.includes(key);
    const isSel = selected.includes(key);
    if (isAns && isSel) return 'chosen-correct';
    if (isAns && !isSel) return 'missed-correct';
    if (!isAns && isSel) return 'chosen-wrong';
    return 'idle';
  };

  const stateClass: Record<OptState, string> = {
    'chosen-correct': 'option-item opt-correct',
    'missed-correct': 'option-item opt-missed',
    'chosen-wrong': 'option-item opt-wrong',
    'idle': 'option-item',
  };

  const stateLabel: Record<OptState, string> = {
    'chosen-correct': '✓ 你选了',
    'missed-correct': '正确答案',
    'chosen-wrong': '✗ 你选了',
    'idle': '',
  };

  if (!showResult) {
    // Exam mode
    return (
      <div className="question-card">
        <div className="question-header">
          <span className="subject-tag">{question.subject}</span>
          <span className="type-tag">{typeLabel[question.type]}</span>
          <span className="year-tag">{question.year}年</span>
        </div>
        <div className="question-body">
          <p className="question-text">{question.question}</p>
          <div className="options-list">
            {(['A', 'B', 'C', 'D'] as const).map((key) => (
              <button
                key={key}
                className={`option-item ${selected.includes(key) ? 'selected' : ''}`}
                onClick={() => toggleOption(key)}
              >
                <span className="option-key">{key}</span>
                <span className="option-text">{question.options[key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Result/review mode
  return (
    <div className="question-card">
      <div className="question-header">
        <span className="subject-tag">{question.subject}</span>
        <span className="type-tag">{typeLabel[question.type]}</span>
        <span className="year-tag">{question.year}年</span>
        <span className={`result-badge ${isCorrect ? 'badge-ok' : 'badge-ng'}`}>
          {isCorrect ? '✓ 正确' : '✗ 错误'}
        </span>
      </div>
      <div className="question-body">
        <p className="question-text">{question.question}</p>
        <div className="options-list">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const st = getOptState(key);
            return (
              <div key={key} className={stateClass[st]}>
                <span className="option-key">{key}</span>
                <span className="option-text">{question.options[key]}</span>
                {stateLabel[st] && (
                  <span className={`opt-label label-${st}`}>{stateLabel[st]}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="result-summary">
          你的答案：<strong>{selected.length > 0 ? selected.join('、') : '未作答'}</strong>
          <span className="result-divider">|</span>
          正确答案：<strong>{question.answer.join('、')}</strong>
        </div>
      </div>
      <div className={`explanation ${isCorrect ? 'exp-correct' : 'exp-wrong'}`}>
        <div className="exp-content">{renderExplanation(question.explanation)}</div>
      </div>
    </div>
  );
}
