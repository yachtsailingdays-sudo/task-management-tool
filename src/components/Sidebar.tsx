import type { Task } from '../types';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';

interface Props {
  tasks: Task[];
  onAdd: (title: string, durationMinutes: number, notes?: string) => void;
  onChangeDuration: (id: string, minutes: number) => void;
  onRemove: (id: string) => void;
}

export function Sidebar({ tasks, onAdd, onChangeDuration, onRemove }: Props) {
  const pending = tasks.filter((t) => !t.scheduledEventId);
  const scheduled = tasks.filter((t) => t.scheduledEventId);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1>タスク</h1>
        <p className="sidebar__subtitle">
          追加したタスクをカレンダーへドラッグすると予定になります
        </p>
      </header>

      <TaskInput onAdd={onAdd} />

      <section className="task-list-section">
        <h2 className="task-list-section__title">
          未スケジュール <span className="count">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <p className="empty-hint">タスクはまだありません。</p>
        ) : (
          <ul className="task-list">
            {pending.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onChangeDuration={onChangeDuration}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
      </section>

      {scheduled.length > 0 && (
        <section className="task-list-section">
          <h2 className="task-list-section__title">
            予定済み <span className="count">{scheduled.length}</span>
          </h2>
          <ul className="task-list">
            {scheduled.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onChangeDuration={onChangeDuration}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
