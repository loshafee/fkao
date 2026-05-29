import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Subject, ExamRecord } from '../types';
import HeatmapCalendar from '../components/HeatmapCalendar';
import { getLocalDate } from '../utils';

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

function groupByWeek(records: ExamRecord[]) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const weeks: Record<string, typeof records> = {};

  sorted.forEach((r) => {
    const d = new Date(r.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const weekKey = getLocalDate(startOfWeek);
    if (!weeks[weekKey]) weeks[weekKey] = [];
    weeks[weekKey].push(r);
  });

  return Object.entries(weeks);
}

export default function HistoryPage() {
  const { history } = useAppContext();
  const navigate = useNavigate();

  const totalPracticed = history.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = history.reduce((sum, r) => sum + r.score, 0);
  const overallRate = totalPracticed > 0 ? Math.round((totalCorrect / totalPracticed) * 100) : 0;

  const weeks = groupByWeek(history);

  if (history.length === 0) {
    return (
      <div className="page history-page">
        <div className="empty-state">
          <p>暂无历史记录</p>
          <button className="btn-start" onClick={() => navigate('/')}>
            去练习
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page history-page">
      <div className="history-top">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h2>历史记录</h2>
      </div>

      <section className="history-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-num">{history.length}</div>
            <div className="stat-label">总次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalPracticed}</div>
            <div className="stat-label">总题数</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{overallRate}%</div>
            <div className="stat-label">正确率</div>
          </div>
        </div>
      </section>

      <section className="heatmap-section">
        <h3>练习日历（近120天）</h3>
        <HeatmapCalendar records={history} />
      </section>

      <section className="history-list-section">
        <h3>全部记录</h3>
        {weeks.map(([weekKey, records]) => (
          <div key={weekKey} className="week-group">
            <div className="week-label">{weekKey} 当周</div>
            {records.map((r, i) => {
              const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
              const d = new Date(r.date);
              const dayLabel = dayOfWeek[d.getDay()];
              const rate = Math.round((r.score / r.total) * 100);
              // Find the record's index in the full history array
              const recordIndex = history.indexOf(r);
              return (
                <div
                  key={i}
                  className="history-item history-item-clickable"
                  onClick={() => navigate(`/history/${recordIndex}`)}
                >
                  <div className="hi-date">
                    {r.date} 周{dayLabel}
                    <span className="hi-arrow">→</span>
                  </div>
                  <div className="hi-info">
                    <span className="hi-score">
                      {r.score}/{r.total}
                    </span>
                    <span className={`hi-rate ${rate >= 60 ? 'rate-good' : 'rate-bad'}`}>
                      {rate}%
                    </span>
                    <span className="hi-time">
                      {Math.floor(r.timeUsed / 60)}分{r.timeUsed % 60}秒
                    </span>
                    {r.subjectFilter.length > 0 && (
                      <span className="hi-subjects">
                        {r.subjectFilter.map((s) => (
                          <span key={s} className="hi-subject-tag">{subjectEmoji[s]} {s}</span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
