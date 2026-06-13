import type { CalendarMode } from '../types';
import { formatWeekRange } from '../lib/dates';

interface Props {
  mode: CalendarMode;
  account: string | null;
  loading: boolean;
  error: string | null;
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
}

export function TopBar({
  mode,
  account,
  loading,
  error,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSignIn,
  onSignOut,
  onRefresh,
}: Props) {
  return (
    <header className="topbar">
      <div className="topbar__nav">
        <button className="btn" onClick={onToday}>
          今週
        </button>
        <button className="btn btn--icon" onClick={onPrevWeek} aria-label="前の週">
          ‹
        </button>
        <button className="btn btn--icon" onClick={onNextWeek} aria-label="次の週">
          ›
        </button>
        <span className="topbar__range">{formatWeekRange(weekStart)}</span>
        {loading && <span className="topbar__loading">同期中…</span>}
      </div>

      <div className="topbar__account">
        <span className={`mode-badge mode-badge--${mode}`}>
          {mode === 'graph' ? 'Outlook 連携' : 'デモ (モック)'}
        </span>
        {account ? (
          <>
            <button className="btn btn--icon" onClick={onRefresh} title="再同期">
              ⟳
            </button>
            <span className="topbar__user" title={account}>
              {account}
            </span>
            <button className="btn" onClick={onSignOut}>
              サインアウト
            </button>
          </>
        ) : (
          <button className="btn btn--primary" onClick={onSignIn}>
            {mode === 'graph' ? 'Outlook にサインイン' : 'デモを開始'}
          </button>
        )}
      </div>

      {error && <div className="topbar__error">⚠ {error}</div>}
    </header>
  );
}
