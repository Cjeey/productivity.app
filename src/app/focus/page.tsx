"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { formatShortDate } from '@/lib/utils';
import CategoryBadge from '@/components/ui/category-badge';

const mockUserId = 'mock-user-1';

interface Task {
  id: string;
  user_id: string;
  title: string;
  category: string;
}

interface FocusSession {
  id: string;
  user_id: string;
  task_id: string;
  start: string;
  end: string;
  duration: number;
}

export default function FocusPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select()
          .eq('user_id', mockUserId);
        if (taskError) throw taskError;
        setTasks(taskData || []);
        const { data: sessionData, error: sessionError } = await supabase
          .from('focus_sessions')
          .select()
          .eq('user_id', mockUserId)
          .order('start', { ascending: false });
        if (sessionError) throw sessionError;
        setSessions(sessionData || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load focus data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning) {
      timer = setInterval(() => {
        if (startTime) {
          setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, startTime]);

  const startSession = () => {
    if (!selectedTaskId) {
      toast.error('Please select a task');
      return;
    }
    if (isRunning) return;
    setStartTime(new Date());
    setElapsed(0);
    setIsRunning(true);
  };

  const endSession = async () => {
    if (!isRunning || !startTime) return;
    const end = new Date();
    const durationSec = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    try {
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          id: crypto.randomUUID(),
          user_id: mockUserId,
          task_id: selectedTaskId,
          start: startTime.toISOString(),
          end: end.toISOString(),
          duration: durationSec,
        });
      if (error) throw error;
      toast.success('Focus session logged');
      setSessions(prev => [
        {
          id: crypto.randomUUID(),
          user_id: mockUserId,
          task_id: selectedTaskId,
          start: startTime.toISOString(),
          end: end.toISOString(),
          duration: durationSec,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to log session');
    } finally {
      setIsRunning(false);
      setStartTime(null);
      setElapsed(0);
    }
  };

  const resetSession = () => {
    if (!isRunning) return;
    if (confirm('Reset current session?')) {
      setIsRunning(false);
      setStartTime(null);
      setElapsed(0);
    }
  };

  const remainingSeconds = pomodoroMinutes * 60 - elapsed;
  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');

  return (
    <div className="p-4 space-y-6">
      <header className="space-y-2">
        <p className="subtle">Stay focused on one task at a time.</p>
        <h1 className="section-title">Focus</h1>
      </header>
      {/* Task selection and timer controls */}
      <div className="card p-6 space-y-4 max-w-3xl">
        <div className="space-y-2">
          <label className="label" htmlFor="task">
            Select task
          </label>
          <select
            id="task"
            className="select w-full"
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
          >
            <option value="">-- Choose a task --</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="duration">
            Pomodoro duration (minutes)
          </label>
          <input
            id="duration"
            type="number"
            min={1}
            className="input w-full"
            value={pomodoroMinutes}
            onChange={e => setPomodoroMinutes(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-4">
          {!isRunning ? (
            <button
              className="btn btn-primary"
              onClick={startSession}
              disabled={loading || !selectedTaskId}
            >
              Start
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={endSession}>
                End
              </button>
              <button className="btn btn-warning" onClick={resetSession}>
                Reset
              </button>
              <span className="text-lg font-mono">
                {minutes}:{seconds}
              </span>
            </>
          )}
        </div>
      </div>
      {/* Sessions list */}
      <div className="space-y-2 max-w-3xl">
        <h2 className="text-xl font-semibold">Past sessions</h2>
        {loading ? (
          <div className="space-y-2">
            <div className="animate-pulse h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="animate-pulse h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="animate-pulse h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No focus sessions yet.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map(session => {
              const task = tasks.find(t => t.id === session.task_id);
              return (
                <li
                  key={session.id}
                  className="p-2 border rounded flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {task ? task.title : 'Unknown task'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatShortDate(new Date(session.start))} ·{' '}
                      {Math.round(session.duration / 60)}m
                    </span>
                  </div>
                  {task && <CategoryBadge category={task.category} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
