import { useMemo, useState } from 'react';
import type { CalendarEvent } from '../types';
import { TASK_DND_TYPE } from './TaskItem';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOTS_PER_DAY,
  SLOT_MINUTES,
  addDays,
  formatDayHeading,
  formatTime,
  isSameDay,
  minutesFromDayStart,
  slotToDate,
} from '../lib/dates';

const SLOT_HEIGHT = 26; // px per 30-minute slot

interface Props {
  weekStart: Date;
  events: CalendarEvent[];
  canSchedule: boolean;
  onDropTask: (taskId: string, when: Date) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
}

interface HoverTarget {
  day: number;
  slot: number;
}

export function Calendar({
  weekStart,
  events,
  canSchedule,
  onDropTask,
  onDeleteEvent,
}: Props) {
  const [hover, setHover] = useState<HoverTarget | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const hours = useMemo(
    () =>
      Array.from(
        { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
        (_, i) => DAY_START_HOUR + i,
      ),
    [],
  );

  const now = new Date();
  const dayHeight = SLOTS_PER_DAY * SLOT_HEIGHT;

  function eventsForDay(day: Date): CalendarEvent[] {
    return events.filter((e) => isSameDay(new Date(e.start), day));
  }

  function handleDrop(e: React.DragEvent, dayIndex: number, slotIndex: number) {
    e.preventDefault();
    setHover(null);
    const taskId = e.dataTransfer.getData(TASK_DND_TYPE);
    if (!taskId) return;
    onDropTask(taskId, slotToDate(weekStart, dayIndex, slotIndex));
  }

  function handleDragOver(e: React.DragEvent, dayIndex: number, slotIndex: number) {
    if (!canSchedule) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setHover((h) =>
      h?.day === dayIndex && h?.slot === slotIndex ? h : { day: dayIndex, slot: slotIndex },
    );
  }

  return (
    <div className="calendar">
      <div className="calendar__head">
        <div className="calendar__corner" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`calendar__dayhead ${isSameDay(day, now) ? 'is-today' : ''}`}
          >
            {formatDayHeading(day)}
          </div>
        ))}
      </div>

      <div className="calendar__body">
        <div className="calendar__times" style={{ height: dayHeight }}>
          {hours.map((h) => (
            <div key={h} className="calendar__timelabel" style={{ height: SLOT_HEIGHT * 2 }}>
              {h}:00
            </div>
          ))}
        </div>

        {days.map((day, dayIndex) => (
          <div
            key={day.toISOString()}
            className="calendar__day"
            style={{ height: dayHeight }}
          >
            {Array.from({ length: SLOTS_PER_DAY }, (_, slotIndex) => {
              const isHovered = hover?.day === dayIndex && hover?.slot === slotIndex;
              const onHour = slotIndex % 2 === 0;
              return (
                <div
                  key={slotIndex}
                  className={`calendar__slot ${onHour ? 'is-hour' : ''} ${
                    isHovered ? 'is-drop-target' : ''
                  }`}
                  style={{ height: SLOT_HEIGHT }}
                  onDragOver={(e) => handleDragOver(e, dayIndex, slotIndex)}
                  onDragLeave={() => setHover(null)}
                  onDrop={(e) => handleDrop(e, dayIndex, slotIndex)}
                />
              );
            })}

            {eventsForDay(day).map((event) => {
              const start = new Date(event.start);
              const end = new Date(event.end);
              const top = (minutesFromDayStart(start) / SLOT_MINUTES) * SLOT_HEIGHT;
              const minutes = Math.max(
                15,
                (end.getTime() - start.getTime()) / 60_000,
              );
              const height = Math.max(
                18,
                (minutes / SLOT_MINUTES) * SLOT_HEIGHT - 2,
              );
              return (
                <div
                  key={event.id}
                  className={`event ${event.createdHere ? 'event--task' : 'event--existing'}`}
                  style={{ top, height }}
                  title={`${event.subject}\n${formatTime(start)}–${formatTime(end)}`}
                >
                  <div className="event__time">
                    {formatTime(start)}–{formatTime(end)}
                  </div>
                  <div className="event__subject">{event.subject}</div>
                  {event.createdHere && (
                    <button
                      className="event__delete"
                      onClick={() => onDeleteEvent(event)}
                      aria-label="予定を削除"
                      title="予定を削除"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            {isSameDay(day, now) &&
              now.getHours() >= DAY_START_HOUR &&
              now.getHours() < DAY_END_HOUR && (
                <div
                  className="calendar__now"
                  style={{
                    top: (minutesFromDayStart(now) / SLOT_MINUTES) * SLOT_HEIGHT,
                  }}
                />
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
