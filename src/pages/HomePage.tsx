import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { questions as allQuestions } from '../data/questions';
import type { Subject } from '../types';
import { getLocalDate } from '../utils';

const SUBJECTS: Subject[] = ['刑法', '民法', '刑诉', '民诉', '行政法', '商经知', '理论法', '三国法'];
const QUESTIONS_PER_TEST = 10;

const subjectEmoji: Record<Subject, string> = {
  '刑法': '⚖️',
  '民法': '🏛️',
  '刑诉': '🔍',
  '民诉': '📋',
  '行政法': '🏢',
  '商经知': '💼',
  '理论法': '📜',
  '三国法': '🌏',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomePage() {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const { dispatch, history, wrongBook } = useAppContext();
  const navigate = useNavigate();

  const today = getLocalDate();
  const todayRecords = history.filter((r) => r.date === today);
  const hasDoneToday = todayRecords.length > 0;

  const toggleSubject = (s: Subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const allSelected = selectedSubjects.length === 0 || selectedSubjects.length === SUBJECTS.length;

  const startExam = () => {
    let pool = selectedSubjects.length === 0
      ? allQuestions
      : allQuestions.filter((q) => selectedSubjects.includes(q.subject));

    if (pool.length < QUESTIONS_PER_TEST) {
      pool = selectedSubjects.length === 0
        ? allQuestions
        : allQuestions.filter((q) => selectedSubjects.includes(q.subject));
    }

    const picked = shuffle(pool).slice(0, QUESTIONS_PER_TEST);
    dispatch({ type: 'START_EXAM', questions: picked, filter: selectedSubjects });
    navigate('/exam');
  };

  const totalPracticed = history.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = history.reduce((sum, r) => sum + r.score, 0);
  const overallRate = totalPracticed > 0 ? Math.round((totalCorrect / totalPracticed) * 100) : 0;

  const subjectCounts: Record<Subject, number> = {} as Record<Subject, number>;
  SUBJECTS.forEach((s) => { subjectCounts[s] = allQuestions.filter((q) => q.subject === s).length; });
  const totalQuestions = allQuestions.length;

  const wrongBySubject: Record<Subject, number> = {} as Record<Subject, number>;
  SUBJECTS.forEach((s) => { wrongBySubject[s] = 0; });
  wrongBook.forEach((w) => {
    const q = allQuestions.find((x) => x.id === w.questionId);
    if (q) wrongBySubject[q.subject] += 1;
  });

  return (
    <div className="page home-page">
      <header className="home-header">
        <h1>法考客观题 · 每日练习</h1>
        <p className="subtitle">每次 {QUESTIONS_PER_TEST} 题，随机出题，无需登录</p>
      </header>

      <section className="subject-picker">
        <h3>选择学科范围 <span className="hint">（不选则全选，题库共{totalQuestions}题）</span></h3>
        <div className="subject-chips">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              className={`chip ${selectedSubjects.includes(s) || allSelected ? 'chip-on' : 'chip-off'}`}
              onClick={() => toggleSubject(s)}
            >
              <span className="chip-emoji">{subjectEmoji[s]}</span>
              {s}
              <span className="chip-count">{subjectCounts[s]}题</span>
              {wrongBySubject[s] > 0 && (
                <span className="chip-wrong">{wrongBySubject[s]}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {hasDoneToday && (
        <section className="today-summary">
          <h3>今日已完成</h3>
          {todayRecords.map((r, i) => (
            <div key={i} className="summary-item">
              <span>得分：{r.score}/{r.total}</span>
              <span>正确率：{Math.round((r.score / r.total) * 100)}%</span>
              <span>用时：{Math.floor(r.timeUsed / 60)}分{r.timeUsed % 60}秒</span>
            </div>
          ))}
        </section>
      )}

      <button className="btn-start" onClick={startExam}>
        {hasDoneToday ? '再来一组' : '开始今日练习'}
      </button>

      <div className="quick-links">
        <button className="btn-secondary" onClick={() => navigate('/notes')}>
          📖 背诵笔记
        </button>
        <button className="btn-secondary" onClick={() => navigate('/wrongbook')}>
          错题本 {wrongBook.length > 0 && <span className="badge">{wrongBook.length}</span>}
        </button>
        {history.length > 0 && (
          <button className="btn-secondary" onClick={() => navigate('/history')}>
            历史记录
          </button>
        )}
      </div>

      <section className="overall-stats">
        <h3>累计统计</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-num">{history.length}</div>
            <div className="stat-label">练习次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalPracticed}</div>
            <div className="stat-label">总题数</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{overallRate}%</div>
            <div className="stat-label">总正确率</div>
          </div>
        </div>
      </section>

    </div>
  );
}
