interface Props {
  current: number;
  total: number;
  answers: Record<string, string[]>;
}

export default function ProgressBar({ current, total, answers }: Props) {
  const answered = Object.keys(answers).length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="progress-bar-wrap">
      <div className="progress-info">
        <span>
          {current + 1} / {total}
        </span>
        <span>
          已答 {answered} 题（{pct}%）
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-dots">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`dot ${i === current ? 'dot-active' : ''} ${answers[`q${i}`] !== undefined ? 'dot-done' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
