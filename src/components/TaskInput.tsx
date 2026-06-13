import { useState } from 'react';
import { DEFAULT_DURATION_MINUTES } from '../hooks/useTasks';

interface Props {
  onAdd: (title: string, durationMinutes: number, notes?: string) => void;
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export function TaskInput({ onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(DEFAULT_DURATION_MINUTES);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, duration, notes);
    setTitle('');
    setNotes('');
    setShowNotes(false);
    setDuration(DEFAULT_DURATION_MINUTES);
  }

  return (
    <form className="task-input" onSubmit={submit}>
      <input
        className="task-input__title"
        type="text"
        placeholder="タスクを入力 (例: 提案書を書く)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="タスク名"
      />

      <div className="task-input__row">
        <label className="task-input__label">所要時間</label>
        <div className="duration-presets">
          {DURATION_PRESETS.map((m) => (
            <button
              type="button"
              key={m}
              className={`chip ${duration === m ? 'chip--active' : ''}`}
              onClick={() => setDuration(m)}
            >
              {m}分
            </button>
          ))}
        </div>
      </div>

      <div className="task-input__row">
        <label className="task-input__label" htmlFor="custom-duration">
          カスタム
        </label>
        <div className="custom-duration">
          <input
            id="custom-duration"
            type="number"
            min={5}
            max={480}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Math.max(5, Number(e.target.value) || 5))}
          />
          <span>分</span>
        </div>
      </div>

      {showNotes ? (
        <textarea
          className="task-input__notes"
          placeholder="メモ (任意)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      ) : (
        <button
          type="button"
          className="link-button"
          onClick={() => setShowNotes(true)}
        >
          + メモを追加
        </button>
      )}

      <button type="submit" className="btn btn--primary" disabled={!title.trim()}>
        タスクを追加
      </button>
    </form>
  );
}
