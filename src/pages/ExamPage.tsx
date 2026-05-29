import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import type { AnswerRecord, ExamRecord } from '../types';
import { getLocalDate } from '../utils';

export default function ExamPage() {
  const { exam, dispatch, addRecord, addWrongQuestions, removeWrongQuestions, wrongBook, clearDraft } = useAppContext();
  const navigate = useNavigate();
  const { questions, currentIndex, answers, timeStarted } = exam;

  const [timerReset] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finalTimeUsed, setFinalTimeUsed] = useState(0);

  const initialElapsed = timeStarted ? Math.floor((Date.now() - timeStarted) / 1000) : 0;

  if (questions.length === 0) {
    navigate('/');
    return null;
  }

  const handleQuit = () => {
    if (!submitted && Object.keys(answers).length > 0) {
      const ok = window.confirm('退出后答题进度已保存，下次进入可继续作答。确定退出吗？');
      if (!ok) return;
    }
    clearDraft();
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(
    (selected: string[]) => {
      dispatch({ type: 'ANSWER', questionId: currentQuestion.id, selected });
    },
    [dispatch, currentQuestion.id]
  );

  const handleSubmit = () => {
    const unanswered = questions.filter((q) => !answers[q.id] || answers[q.id].length === 0);
    if (unanswered.length > 0) {
      const ok = window.confirm(`还有 ${unanswered.length} 题未作答，确定提交吗？`);
      if (!ok) return;
    }

    const used = Math.floor((Date.now() - (timeStarted || Date.now())) / 1000);
    setFinalTimeUsed(used);
    setSubmitted(true);
    setShowAnswer(true);

    const answerRecords: AnswerRecord[] = questions.map((q) => {
      const userAnswer = answers[q.id] || [];
      const isCorrect =
        JSON.stringify([...userAnswer].sort()) === JSON.stringify([...q.answer].sort());
      return { questionId: q.id, userAnswer, isCorrect };
    });

    const score = answerRecords.filter((r) => r.isCorrect).length;

    const wrongIds = answerRecords.filter((r) => !r.isCorrect).map((r) => r.questionId);
    if (wrongIds.length > 0) {
      addWrongQuestions(wrongIds);
    }

    const correctedIds = answerRecords
      .filter((r) => r.isCorrect && wrongBook.some((w) => w.questionId === r.questionId))
      .map((r) => r.questionId);
    if (correctedIds.length > 0) {
      removeWrongQuestions(correctedIds);
    }

    const record: ExamRecord = {
      date: getLocalDate(),
      score,
      total: questions.length,
      timeUsed: used,
      answers: answerRecords,
      subjectFilter: exam.subjectFilter,
    };
    addRecord(record);
    clearDraft();
  };

  const goTo = (index: number) => {
    dispatch({ type: 'GO_TO', index });
  };

  return (
    <div className="page exam-page">
      <div className="exam-topbar">
        <button className="btn-back" onClick={handleQuit}>
          ← 退出
        </button>
        {!submitted ? (
          <Timer running={true} resetKey={timerReset} initialSeconds={initialElapsed} />
        ) : (
          <span className="time-used">
            用时 {Math.floor(finalTimeUsed / 60)}分{finalTimeUsed % 60}秒
          </span>
        )}
      </div>

      <ProgressBar current={currentIndex} total={questions.length} answers={answers} />

      {!submitted && (
        <div className="question-nav">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`qnav-btn ${i === currentIndex ? 'qnav-current' : ''} ${
                answers[q.id]?.length > 0 ? 'qnav-answered' : ''
              }`}
              onClick={() => goTo(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        selected={answers[currentQuestion.id] || []}
        onAnswer={handleAnswer}
        showResult={showAnswer}
      />

      {!submitted ? (
        <div className="exam-actions">
          <button
            className="btn-nav"
            disabled={currentIndex === 0}
            onClick={() => dispatch({ type: 'PREV' })}
          >
            上一题
          </button>
          <span className="current-idx">
            {currentIndex + 1} / {questions.length}
          </span>
          {currentIndex < questions.length - 1 ? (
            <button className="btn-nav btn-next" onClick={() => dispatch({ type: 'NEXT' })}>
              下一题
            </button>
          ) : (
            <button className="btn-nav btn-submit" onClick={handleSubmit}>
              提交答卷
            </button>
          )}
        </div>
      ) : (
        <div className="exam-actions">
          <button className="btn-nav" onClick={() => navigate('/')}>
            返回首页
          </button>
          <button className="btn-nav btn-next" onClick={() => navigate('/result')}>
            查看成绩
          </button>
        </div>
      )}
    </div>
  );
}
