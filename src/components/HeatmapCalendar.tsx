import type { ExamRecord } from '../types';
import { getLocalDate } from '../utils';

interface Props {
  records: ExamRecord[];
}

export default function HeatmapCalendar({ records }: Props) {
  const dateMap: Record<string, { count: number; totalScore: number; totalQ: number }> = {};
  records.forEach((r) => {
    if (!dateMap[r.date]) {
      dateMap[r.date] = { count: 0, totalScore: 0, totalQ: 0 };
    }
    dateMap[r.date].count += 1;
    dateMap[r.date].totalScore += r.score;
    dateMap[r.date].totalQ += r.total;
  });

  const today = new Date();
  const days: { date: string; day: number; month: number; data: typeof dateMap[string] | null }[] = [];

  // Find the earliest record date, or default to today
  let startDate = today;
  if (records.length > 0) {
    const dates = records.map((r) => r.date).sort();
    startDate = new Date(dates[0]);
    // Ensure startDate doesn't include time portion for correct comparison
    startDate.setHours(0, 0, 0, 0);
  }

  // Generate grid from the earliest record to today
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / msPerDay);

  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getLocalDate(d);
    days.push({
      date: key,
      day: d.getDate(),
      month: d.getMonth() + 1,
      data: dateMap[key] || null,
    });
  }

  const getColor = (data: typeof dateMap[string] | null) => {
    if (!data) return 'cell-empty';
    const rate = data.totalScore / data.totalQ;
    if (rate >= 0.8) return 'cell-high';
    if (rate >= 0.6) return 'cell-mid';
    return 'cell-low';
  };

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {days.map((d) => (
          <div
            key={d.date}
            className={`heatmap-cell ${getColor(d.data)}`}
            title={
              d.data
                ? `${d.date}: ${d.data.totalScore}/${d.data.totalQ} (${Math.round((d.data.totalScore / d.data.totalQ) * 100)}%)`
                : d.date
            }
          >
            <span className="cell-label">{d.day}</span>
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="cell-empty" />
        <span>0%</span>
        <span className="cell-low" />
        <span>&lt;60%</span>
        <span className="cell-mid" />
        <span>60-80%</span>
        <span className="cell-high" />
        <span>&gt;80%</span>
      </div>
    </div>
  );
}
