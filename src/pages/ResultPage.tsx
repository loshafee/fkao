import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import QuestionCard from '../components/QuestionCard';

export default function ResultPage() {
  const { exam, history } = useAppContext();
  const navigate = useNavigate();

  const latestRecord = history[0];

  if (!latestRecord || exam.questions.length === 0) {
    return (
      <div className="page result-page">
        <div className="empty-state">
          <p>暂无考试成绩</p>
          <button className="btn-start" onClick={() => navigate('/')}>
            去练习
          </button>
        </div>
      </div>
    );
  }

  const { score, total, timeUsed, answers } = latestRecord;
  const rate = Math.round((score / total) * 100);

  const rateEmoji = rate >= 80 ? '🎉' : rate >= 60 ? '💪' : '📚';
  const rateText = rate >= 80 ? '优秀' : rate >= 60 ? '良好' : '继续加油';

  return (
    <div className="page result-page">
      <div className="result-hero">
        <div className="result-emoji">{rateEmoji}</div>
        <div className="result-score">
          {score}<span className="result-total">/{total}</span>
        </div>
        <div className="result-rate">{rate}% · {rateText}</div>
        <div className="result-time">
          用时 {Math.floor(timeUsed / 60)}分{timeUsed % 60}秒
        </div>
      </div>

      <div className="result-actions-top">
        <button className="btn-start" onClick={() => navigate('/')}>
          再来一组
        </button>
        <button className="btn-secondary" onClick={() => navigate('/history')}>
          历史记录
        </button>
      </div>

      <div className="answer-review">
        <h3>答题详情</h3>
        {exam.questions.map((q) => {
          const record = answers.find((a) => a.questionId === q.id);
          return (
            <QuestionCard
              key={q.id}
              question={q}
              selected={record?.userAnswer || []}
              onAnswer={() => {}}
              showResult
            />
          );
        })}
      </div>
    </div>
  );
}
