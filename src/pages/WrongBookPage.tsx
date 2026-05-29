import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { questions as allQuestions } from '../data/questions';
import type { Subject, WrongQuestion } from '../types';

const subjectEmoji: Record<Subject, string> = {
  '刑法': '⚖️', '民法': '🏛️', '刑诉': '🔍', '民诉': '📋',
  '行政法': '🏢', '商经知': '💼', '理论法': '📜', '三国法': '🌏',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function groupBySubject(wrongs: WrongQuestion[]): Map<Subject, WrongQuestion[]> {
  const map = new Map<Subject, WrongQuestion[]>();
  wrongs.forEach((w) => {
    const q = allQuestions.find((x) => x.id === w.questionId);
    const subject = q?.subject || '理论法';
    if (!map.has(subject)) map.set(subject, []);
    map.get(subject)!.push(w);
  });
  return map;
}

export default function WrongBookPage() {
  const { wrongBook, dispatch, removeWrongQuestions } = useAppContext();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);

  if (wrongBook.length === 0) {
    return (
      <div className="page wrongbook-page">
        <div className="history-top">
          <button className="btn-back" onClick={() => navigate('/')}>← 返回</button>
          <h2>错题本</h2>
        </div>
        <div className="empty-state">
          <div className="empty-emoji">🎯</div>
          <p>暂无错题，继续保持！</p>
          <button className="btn-start" onClick={() => navigate('/')}>去练习</button>
        </div>
      </div>
    );
  }

  const grouped = groupBySubject(wrongBook);
  const allIds = wrongBook.map((w) => w.questionId);
  const selectedCount = selectAll ? allIds.length : selected.size;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    setSelectAll((prev) => !prev);
  };

  const startWrongPractice = () => {
    const targetIds = selectAll ? allIds : Array.from(selected);
    const pool = allQuestions.filter((q) => targetIds.includes(q.id));
    if (pool.length === 0) return;
    const picked = shuffle(pool).slice(0, Math.min(pool.length, 20));
    dispatch({ type: 'START_EXAM', questions: picked, filter: [] });
    navigate('/exam');
  };

  const deleteIds = selectAll ? allIds : Array.from(selected);
  const clearSelected = () => {
    if (confirm(`确定要移除选中的 ${deleteIds.length} 道错题吗？`)) {
      removeWrongQuestions(deleteIds);
      setSelected(new Set());
      setSelectAll(true);
    }
  };

  const exportToFile = () => {
    const json = JSON.stringify(wrongBook, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wrongbook-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page wrongbook-page">
      <div className="history-top">
        <button className="btn-back" onClick={() => navigate('/')}>← 返回</button>
        <h2>错题本</h2>
        <span className="wrong-count-badge">{wrongBook.length}题</span>
      </div>

      <div className="wrongbook-toolbar">
        <button className="btn-secondary btn-sm" onClick={toggleSelectAll}>
          {selectAll ? '取消全选' : '全选'}
        </button>
        <span className="selected-hint">
          已选 {selectedCount} 题
        </span>
        <button className="btn-secondary btn-sm btn-danger" onClick={clearSelected}>
          移除此{deleteIds.length}题
        </button>
        <button className="btn-secondary btn-sm btn-export" onClick={exportToFile}>
          ⬇ 导出JSON
        </button>
      </div>

      <div className="export-hint">
        导出后将下载的 <code>wrongbook-data.json</code> 放回项目 <code>public/</code> 目录即可持久化。
      </div>

      <div className="wrongbook-actions">
        <button className="btn-start" onClick={startWrongPractice}>
          练习错题（{Math.min(selectedCount, 20)}题）
        </button>
      </div>

      {Array.from(grouped.entries()).map(([subject, wrongs]) => (
        <div key={subject} className="wrong-subject-group">
          <div className="wrong-subject-header">
            <span className="chip-emoji">{subjectEmoji[subject]}</span>
            {subject}
            <span className="wrong-subject-count">{wrongs.length}题</span>
          </div>
          {wrongs.map((w) => {
            const q = allQuestions.find((x) => x.id === w.questionId);
            const isSel = selectAll || selected.has(w.questionId);
            return (
              <div
                key={w.questionId}
                className={`wrong-item ${isSel ? 'wrong-item-sel' : ''}`}
                onClick={() => toggleSelect(w.questionId)}
              >
                <div className="wrong-item-check">
                  {isSel ? '☑' : '☐'}
                </div>
                <div className="wrong-item-body">
                  <div className="wrong-item-q">
                    <span className="type-tag-sm">{q?.type === 'single' ? '单选' : q?.type === 'multi' ? '多选' : '不定项'}</span>
                    {q?.question.slice(0, 60)}{(q?.question.length || 0) > 60 ? '...' : ''}
                  </div>
                  <div className="wrong-item-meta">
                    <span>答错{w.wrongCount}次</span>
                    <span>最近{w.lastWrong}</span>
                    {q && <span className="correct-answer">答案：{q.answer.join('')}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
