import { useCallback, useEffect, useState } from 'react';
import type { Task } from '../types';

const STORAGE_KEY = 'tmt.tasks';
export const DEFAULT_DURATION_MINUTES = 30;

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

function uid(): string {
  return `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Backlog tasks, persisted to localStorage. */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback(
    (title: string, durationMinutes = DEFAULT_DURATION_MINUTES, notes?: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const task: Task = {
        id: uid(),
        title: trimmed,
        durationMinutes,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [task, ...prev]);
    },
    [],
  );

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  );

  return { tasks, addTask, updateTask, removeTask, getTask };
}
