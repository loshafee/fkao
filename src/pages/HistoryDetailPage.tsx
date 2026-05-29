import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { questions as allQuestions } from '../data/questions';
import QuestionCard from '../components/QuestionCard';

export default function HistoryDetailPage() {
  const { index } = useParams<{ index: string }>();
  const { history } = useAppContext();
  const navigate = useNavigate();

  const record = index !== undefined ? history[parseInt(index)] : null;

  if (!record) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>记录不存在</p>
          <button className="btn-start" onClick={() => navigate('/history')}>返回历史</button>
        </div>
      </div>
    );
  }

  const { score, total, timeUsed, answers, date, subjectFilter } = record;
  const rate = Math.round((score / total) * 100);
  const rateEmoji = rate >= 80 ? '🎉' : rate >= 60 ? '💪' : '📚';
  const rateText = rate >= 80 ? '优秀' : rate >= 60 ? '良好' : '继续加油';

  // Reconstruct full question data from stored question IDs
  const questionDetails = answers.map((a) => {
    const q = allQuestions.find((x) => x.id === a.questionId);
    return { question: q!, userAnswer: a.userAnswer, isCorrect: a.isCorrect };
  }).filter((d) => d.question);

  const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  const d = new Date(date);
  const dayLabel = dayOfWeek[d.getDay()];

  return (
    <div className="page history-detail-page">
      <div className="history-top">
        <button className="btn-back" onClick={() => navigate('/history')}>← 返回历史</button>
        <h2>答题详情</h2>
      </div>

      <div className="result-hero result-hero-sm">
        <div className="result-emoji">{rateEmoji}</div>
        <div className="result-score">
          {score}<span className="result-total">/{total}</span>
        </div>
        <div className="result-rate">{rate}% · {rateText}</div>
        <div className="result-meta">
          <span>{date} 周{dayLabel}</span>
          <span>用时 {Math.floor(timeUsed / 60)}分{timeUsed % 60}秒</span>
          {subjectFilter.length > 0 && (
            <span>范围：{subjectFilter.join('、')}</span>
          )}
        </div>
      </div>

      <div className="answer-review">
        <h3>逐题解析（{total}题，正确{score}题）</h3>
        {questionDetails.map((d, i) => (
          <div key={d.question.id} className="review-item-wrap">
            <div className={`review-item-badge ${d.isCorrect ? 'badge-ok' : 'badge-ng'}`}>
              {i + 1}. {d.isCorrect ? '✓' : '✗'}
            </div>
            <QuestionCard
              question={d.question}
              selected={d.userAnswer}
              onAnswer={() => {}}
              showResult
            />
          </div>
        ))}
      </div>
    </div>
  );
}
