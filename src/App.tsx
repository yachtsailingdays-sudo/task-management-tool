import { useCallback, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Calendar } from './components/Calendar';
import { TopBar } from './components/TopBar';
import { useTasks } from './hooks/useTasks';
import { useCalendar } from './hooks/useCalendar';
import type { CalendarEvent } from './types';
import { addDays, addMinutes, formatTime, startOfWeek, toLocalISO } from './lib/dates';

export default function App() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const { tasks, addTask, updateTask, removeTask, getTask } = useTasks();
  const cal = useCalendar(weekStart);

  const handleDropTask = useCallback(
    async (taskId: string, when: Date) => {
      const task = getTask(taskId);
      if (!task) return;
      if (!cal.account) {
        alert(
          cal.mode === 'graph'
            ? '先に「Outlook にサインイン」してください。'
            : '先に「デモを開始」してください。',
        );
        return;
      }
      const end = addMinutes(when, task.durationMinutes);
      try {
        const created = await cal.createEvent({
          subject: task.title,
          start: toLocalISO(when),
          end: toLocalISO(end),
          taskId: task.id,
          createdHere: true,
        });
        updateTask(task.id, { scheduledEventId: created.id });
      } catch (e) {
        alert(`予定の作成に失敗しました: ${e instanceof Error ? e.message : e}`);
      }
    },
    [cal, getTask, updateTask],
  );

  const handleMoveEvent = useCallback(
    async (eventId: string, when: Date) => {
      const event = cal.events.find((e) => e.id === eventId);
      if (!event) return;
      const durationMs = new Date(event.end).getTime() - new Date(event.start).getTime();
      const end = new Date(when.getTime() + durationMs);
      try {
        await cal.moveEvent(eventId, toLocalISO(when), toLocalISO(end));
      } catch (e) {
        alert(`予定の移動に失敗しました: ${e instanceof Error ? e.message : e}`);
      }
    },
    [cal],
  );

  const handleDeleteEvent = useCallback(
    async (event: CalendarEvent) => {
      const start = new Date(event.start);
      if (
        !confirm(
          `「${event.subject}」(${formatTime(start)}) の予定を削除しますか？`,
        )
      )
        return;
      try {
        await cal.deleteEvent(event.id);
        if (event.taskId) {
          // Return the task to the backlog so it can be rescheduled.
          updateTask(event.taskId, { scheduledEventId: undefined });
        }
      } catch (e) {
        alert(`削除に失敗しました: ${e instanceof Error ? e.message : e}`);
      }
    },
    [cal, updateTask],
  );

  return (
    <div className="app">
      <Sidebar
        tasks={tasks}
        onAdd={addTask}
        onChangeDuration={(id, minutes) => updateTask(id, { durationMinutes: minutes })}
        onRemove={removeTask}
      />

      <main className="main">
        <TopBar
          mode={cal.mode}
          account={cal.account}
          loading={cal.loading}
          error={cal.error}
          weekStart={weekStart}
          onPrevWeek={() => setWeekStart((w) => addDays(w, -7))}
          onNextWeek={() => setWeekStart((w) => addDays(w, 7))}
          onToday={() => setWeekStart(startOfWeek(new Date()))}
          onSignIn={cal.signIn}
          onSignOut={cal.signOut}
          onRefresh={cal.refresh}
        />
        <Calendar
          weekStart={weekStart}
          events={cal.events}
          canSchedule={Boolean(cal.account)}
          onDropTask={handleDropTask}
          onMoveEvent={handleMoveEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </main>
    </div>
  );
}
