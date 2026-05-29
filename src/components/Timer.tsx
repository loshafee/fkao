import { useState, useEffect, useRef } from 'react';

interface Props {
  running: boolean;
  resetKey: number;
  initialSeconds?: number;
}

export default function Timer({ running, resetKey, initialSeconds = 0 }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<number | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setSeconds(initialSeconds);
    startRef.current = Date.now();
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, [resetKey, initialSeconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSeconds(initialSeconds + Math.floor((Date.now() - startRef.current) / 1000));
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, initialSeconds]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <div className="timer">
      <span className="timer-icon">⏱</span>
      {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </div>
  );
}
