import { useState } from 'react';
import type { Task } from '../types';
import { formatDuration } from '../lib/dates';

export const TASK_DND_TYPE = 'application/x-tmt-task';

interface Props {
  task: Task;
  onChangeDuration: (id: string, minutes: number) => void;
  onRemove: (id: string) => void;
}

export function TaskItem({ task, onChangeDuration, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.durationMinutes);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(TASK_DND_TYPE, task.id);
    e.dataTransfer.setData('text/plain', task.title);
    e.dataTransfer.effectAllowed = 'copy';
    document.body.classList.add('tmt-dragging');
  }

  function commitDuration() {
    onChangeDuration(task.id, Math.max(5, draft || 5));
    setEditing(false);
  }

  return (
    <li
      className={`task-item ${task.scheduledEventId ? 'task-item--scheduled' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => document.body.classList.remove('tmt-dragging')}
      title="カレンダーへドラッグして予定を作成"
    >
      <span className="task-item__grip" aria-hidden>
        ⠿
      </span>
      <div className="task-item__body">
        <div className="task-item__title">{task.title}</div>
        {task.notes && <div className="task-item__notes">{task.notes}</div>}
        {editing ? (
          <div className="task-item__duration-edit">
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(Number(e.target.value))}
              onBlur={commitDuration}
              onKeyDown={(e) => e.key === 'Enter' && commitDuration()}
            />
            <span>分</span>
          </div>
        ) : (
          <button
            className="task-item__duration"
            onClick={() => {
              setDraft(task.durationMinutes);
              setEditing(true);
            }}
            title="クリックして時間を変更"
          >
            🕒 {formatDuration(task.durationMinutes)}
          </button>
        )}
        {task.scheduledEventId && (
          <span className="task-item__badge">予定済み</span>
        )}
      </div>
      <button
        className="task-item__remove"
        onClick={() => onRemove(task.id)}
        aria-label="タスクを削除"
        title="削除"
      >
        ×
      </button>
    </li>
  );
}
