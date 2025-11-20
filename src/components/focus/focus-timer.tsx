"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface FocusTimerProps {
  minutes: number;
  taskId?: string;
  withCard?: boolean;
  onLog: (payload: { taskId?: string; startedAt: string; durationSeconds: number }) => Promise<void> | void;
}

export default function FocusTimer({ minutes: presetMinutes, taskId, withCard = true, onLog }: FocusTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(presetMinutes * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (!running) {
      setSecondsRemaining(presetMinutes * 60);
    }
  }, [presetMinutes, running]);

  const handleStart = useCallback(() => {
    setStartedAt(new Date());
    setRunning(true);
  }, []);

  const handleStop = useCallback(() => {
    setRunning(false);
    if (startedAt) {
      const durationSeconds = presetMinutes * 60 - secondsRemaining;
      void onLog({
        taskId,
        startedAt: startedAt.toISOString(),
        durationSeconds: Math.max(1, durationSeconds),
      });
    }
  }, [onLog, presetMinutes, secondsRemaining, startedAt, taskId]);

  const handleReset = useCallback(() => {
    if (running || secondsRemaining !== presetMinutes * 60) {
      const confirmed = window.confirm("Reset the current session?");
      if (!confirmed) return;
    }
    setRunning(false);
    setSecondsRemaining(presetMinutes * 60);
    setStartedAt(null);
  }, [presetMinutes, running, secondsRemaining]);

  useEffect(() => {
    if (secondsRemaining === 0 && running) {
      handleStop();
    }
  }, [handleStop, running, secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsRemaining % 60).toString().padStart(2, "0");

  const progress = useMemo(() => {
    const total = presetMinutes * 60;
    return Math.min(100, Math.round(((total - secondsRemaining) / total) * 100));
  }, [presetMinutes, secondsRemaining]);

  const wrapperClass = withCard ? "card p-6 space-y-4" : "space-y-4";

  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-between">
        <div>
          <p className="subtle">Pomodoro</p>
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {minutes}:{seconds}
          </p>
        </div>
        <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          {presetMinutes} min
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="absolute inset-y-0 left-0 bg-brand-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {!running ? (
          <button className="btn-primary" onClick={handleStart} type="button">
            Start session
          </button>
        ) : (
          <button className="btn btn-ghost bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-200" onClick={handleStop} type="button">
            Stop & log
          </button>
        )}
        <button className="btn-ghost" onClick={handleReset} type="button">
          Reset
        </button>
      </div>
    </div>
  );
}
