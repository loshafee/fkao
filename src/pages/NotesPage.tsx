import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesData, MODULE_META, type NoteModule, type SubjectNote } from '../data/notes';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  T0: { label: '核心', color: '#c5221f', bg: '#fce8e6' },
  T1: { label: '重点', color: '#e37400', bg: '#fef7e0' },
  T2: { label: '一般', color: '#0d904f', bg: '#e6f4ea' },
  T3: { label: '次重', color: '#5f6368', bg: '#f1f3f4' },
};

export default function NotesPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const note = useMemo(() => notesData.find((n) => n.subjectId === selectedSubject), [selectedSubject]);

  if (note) {
    return <NotesDetail note={note} onBack={() => setSelectedSubject(null)} />;
  }

  return (
    <div className="notes-page">
      <h2 className="notes-page-title">📖 背诵笔记</h2>
      <p className="notes-page-sub">18大学科核心考点速记 · 碎片时间高效背诵</p>

      {(['T0', 'T1', 'T2', 'T3'] as const).map((tier) => {
        const subjects = notesData.filter((n) => n.tier === tier);
        if (subjects.length === 0) return null;
        const cfg = TIER_CONFIG[tier];
        return (
          <div key={tier} className="notes-tier-group">
            <h3 className="notes-tier-title" style={{ color: cfg.color }}>{cfg.label}科目</h3>
            <div className="notes-subject-grid">
              {subjects.map((n) => (
                <div
                  key={n.subjectId}
                  className="notes-subject-card"
                  onClick={() => setSelectedSubject(n.subjectId)}
                >
                  <span className="notes-subject-icon">{n.subjectIcon || '📌'}</span>
                  <span className="notes-subject-name">{n.subjectName}</span>
                  <span className="notes-subject-badge" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className="notes-subject-time">{n.readTime}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Detail View ----

function getAvailableModules(note: SubjectNote): NoteModule[] {
  const modules: NoteModule[] = [];
  if (note.examPoints.length > 0) modules.push('examPoints');
  if (note.concepts.length > 0) modules.push('concepts');
  if (note.comparisons.length > 0) modules.push('comparisons');
  if (note.mnemonics.length > 0) modules.push('mnemonics');
  if (note.traps.length > 0) modules.push('traps');
  if (note.keyNumbers.length > 0) modules.push('keyNumbers');
  if (note.updates2026.length > 0) modules.push('updates2026');
  return modules;
}

function NotesDetail({ note, onBack }: { note: SubjectNote; onBack: () => void }) {
  const available = getAvailableModules(note);
  const [activeModule, setActiveModule] = useState<NoteModule>(available[0] || 'examPoints');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="notes-detail">
      <button className="notes-back-btn" onClick={onBack}>← 返回目录</button>
      <div className="notes-detail-header">
        <h2>{note.subjectIcon} {note.subjectName}</h2>
        <p>{note.meta.scoreWeight} · {note.meta.studyHours}</p>
        {note.meta.change2026 && <p>🆕 {note.meta.change2026}</p>}
      </div>

      {/* Module Tabs */}
      <div className="notes-module-tabs">
        {available.map((m) => {
          const meta = MODULE_META[m];
          return (
            <button
              key={m}
              className={`notes-module-tab ${m === activeModule ? 'active' : ''}`}
              onClick={() => setActiveModule(m)}
            >
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="notes-module-content">
        {activeModule === 'examPoints' && (
          <div className="notes-section">
            <h3>⭐ 高频考点速查表</h3>
            {note.examPoints.map((ep, i) => (
              <div key={i} className="notes-exam-card">
                <div className="notes-exam-name">{ep.name}</div>
                <div className="notes-exam-stars">{'⭐'.repeat(Math.min(ep.stars, 5))}</div>
                <div className="notes-exam-info">
                  {ep.frequency ? `近5年考${ep.frequency}次 · ` : ''}
                  {ep.questionType?.join('/') || ''}
                  {ep.sectionRef ? ` → ${ep.sectionRef}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeModule === 'concepts' && (
          <div className="notes-section">
            {note.concepts.map((c, i) => {
              const isOpen = expanded.has(i);
              return (
                <div key={i} className="notes-concept-item">
                  <div className="notes-concept-header" onClick={() => toggleExpand(i)}>
                    <span>{c.title}</span>
                    <span className="notes-concept-arrow">{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {isOpen && (
                    <div className="notes-concept-body">
                      <p className="notes-concept-def">📌 {c.definition}</p>
                      <div className="notes-concept-kw">
                        {c.keywords.map((kw, j) => <span key={j} className="notes-kw-tag">{kw}</span>)}
                      </div>
                      <p className="notes-concept-exam">🎯 {c.examTips}</p>
                      {c.points.map((p, j) => <p key={j} className="notes-concept-point">• {p}</p>)}
                      {c.classicCase && <p className="notes-concept-case">💡 {c.classicCase}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeModule === 'comparisons' && (
          <div className="notes-section">
            {note.comparisons.map((comp, i) => (
              <div key={i} className="notes-comp-table">
                <h4>{comp.title}</h4>
                <table>
                  <thead>
                    <tr>{comp.headers.map((h, j) => <th key={j}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {comp.rows.map((row, ri) => (
                      <tr key={ri}>
                        <td>{row.dimA}</td>
                        <td>{row.dimB}</td>
                        {row.dimC && <td>{row.dimC}</td>}
                        <td>{row.keyDiff || row.oneLiner || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {activeModule === 'mnemonics' && (
          <div className="notes-section">
            <h3>💬 记忆口诀</h3>
            {note.mnemonics.map((m, i) => (
              <div key={i} className="notes-mnemonic-card">
                <div className="notes-mnemonic-topic">{m.topic}</div>
                <div className="notes-mnemonic-rhyme">"{m.rhyme}"</div>
                <div className="notes-mnemonic-meaning">{m.meaning}</div>
              </div>
            ))}
          </div>
        )}

        {activeModule === 'traps' && (
          <div className="notes-section">
            <h3>⚠️ 常见陷阱</h3>
            {note.traps.map((t, i) => (
              <div key={i} className="notes-trap-item">
                <div className="notes-trap-name">陷阱{i + 1}：{t.trap}</div>
                <div className="notes-trap-wrong">❌ {t.wrong}</div>
                <div className="notes-trap-correct">✅ {t.correct}</div>
              </div>
            ))}
          </div>
        )}

        {activeModule === 'keyNumbers' && (
          <div className="notes-section">
            <h3>🔢 必背数字</h3>
            {note.keyNumbers.map((kv, i) => (
              <div key={i} className="notes-kv-row">
                <span className="notes-kv-num">{kv.number}</span>
                <span className="notes-kv-meaning">{kv.meaning}</span>
              </div>
            ))}
          </div>
        )}

        {activeModule === 'updates2026' && (
          <div className="notes-section">
            <h3>🆕 2026新增/修订</h3>
            {note.updates2026.map((u, i) => (
              <div key={i} className={`notes-update-card priority-${u.priority}`}>
                <div className="notes-update-content">
                  {u.priority === 'red' ? '🔴' : u.priority === 'yellow' ? '🟡' : '🟢'} {u.content}
                </div>
                <div className="notes-update-points">{u.keyPoints}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
