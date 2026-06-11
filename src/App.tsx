import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capybara, CAPY_ASPECT, CAPY_CHEER_ASPECT, CAPY_WALK_ASPECT } from './Capybara';
import bedImg from './assets/bed.png';
import { getFlybyRoast } from './roasts';
import type { CapyState, DayRecord } from './types';
import {
  addDaysKey,
  format12h,
  formatHeaderDate,
  isAfterStartTimeToday,
  localDateKey,
} from './dateUtils';

const CORNER_W = 130;
const CORNER_H = CORNER_W / CAPY_ASPECT;
const BED_ASPECT = 640 / 377;
const BED_W = 140;
const BED_H = BED_W / BED_ASPECT;
const FLY_W = 160;
const FLY_H = FLY_W / CAPY_ASPECT;
const FLY_H_WALK = FLY_W / CAPY_WALK_ASPECT;
const CORNER_MARGIN = 20;
const CORNER_LIFT = 8;
const POPOVER_W = 380;
const HAPPY_DURATION_MS = 4500;

// Dark palette — speech bubble + badge.
const COLORS = {
  bg: '#1F1A14',
  text: '#FBFAF6',
  textMuted: 'rgba(251,250,246,0.55)',
  hover: '#3D2F22',
  border: 'rgba(255,255,255,0.08)',
};

// Warm cream palette — the popover panel (Figma node 660:6307).
const PANEL = {
  bg: '#FBF6EF',
  band: '#F4EEE3',
  ink: '#463B2D',
  muted: '#A89C8D',
  placeholder: '#CBC0B1',
  checkbox: '#B5A893',
  hairline: '#C5BCB1',
  shadow:
    '0px 1px 1px rgba(70,59,45,0.06), 0px 10px 15px rgba(70,59,45,0.1), 0px 28px 28px rgba(70,59,45,0.08)',
};

const FEEDBACK_URL = 'https://github.com/audreypork/no-cap/issues';

const FONT_PIXEL = "'Silkscreen', monospace";
const FONT_MONO = "'IBM Plex Mono', monospace";
const FONT_SANS = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

function ClickableRegion({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      style={style}
      onMouseEnter={() => window.capy.setIgnoreMouse(false)}
      onMouseLeave={() => window.capy.setIgnoreMouse(true)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function emptyRecord(date: string, startTime: string): DayRecord {
  return { date, tasks: [], startTime, currentTaskIndex: 0 };
}

export function App() {
  const [state, setState] = useState<CapyState | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [viewDateKey, setViewDateKey] = useState<string>(localDateKey());
  const [followActive, setFollowActive] = useState(false);
  const [followDeparting, setFollowDeparting] = useState(false);
  const [happy, setHappy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const prevAllDoneRef = useRef(false);

  useEffect(() => {
    window.capy.getState().then(setState);
    const off = window.capy.onStateChanged((s) => setState(s));
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const today = state?.today ?? localDateKey();
  const todayRecord: DayRecord = useMemo(() => {
    if (!state) return emptyRecord(today, '15:00');
    return state.store.days[today] ?? emptyRecord(today, state.store.startTime);
  }, [state, today]);
  const viewRecord: DayRecord = useMemo(() => {
    if (!state) return emptyRecord(viewDateKey, '15:00');
    return (
      state.store.days[viewDateKey] ??
      emptyRecord(viewDateKey, state.store.startTime)
    );
  }, [state, viewDateKey]);

  const undoneCount = todayRecord.tasks.filter((t) => !t.done).length;
  const allDone = todayRecord.tasks.length === 3 && undoneCount === 0;

  useEffect(() => {
    if (!state) return;
    const prev = prevAllDoneRef.current;
    prevAllDoneRef.current = allDone;
    if (!prev && allDone) {
      setHappy(true);
      window.setTimeout(() => setHappy(false), HAPPY_DURATION_MS);
    }
  }, [allDone, state]);

  const shouldFollow = useMemo(() => {
    if (!state) return false;
    if (happy) return false;
    if (undoneCount === 0) return false;
    const pause = state.store.pause;
    if (pause && pause.until > now) return false;
    return isAfterStartTimeToday(todayRecord.startTime, new Date(now));
  }, [state, happy, undoneCount, todayRecord.startTime, now]);

  useEffect(() => {
    if (shouldFollow) {
      if (!followActive) {
        setFollowActive(true);
        setFollowDeparting(false);
      } else if (followDeparting) {
        setFollowDeparting(false);
      }
    } else if (followActive && !followDeparting) {
      setFollowDeparting(true);
    }
  }, [shouldFollow, followActive, followDeparting]);

  const isViewingToday = viewDateKey === today;
  const isViewingPast = viewDateKey < today;

  useEffect(() => {
    const off = window.capy.onWindowBlurred(() => {
      setPopoverOpen(false);
    });
    return () => off();
  }, []);

  if (!state) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {followActive ? (
        <FollowingCapy
          count={undoneCount}
          mood={state.store.mood ?? 'naughty'}
          popoverOpen={popoverOpen}
          shouldDepart={followDeparting}
          onClick={() => {
            setViewDateKey(today);
            setPopoverOpen((o) => !o);
          }}
          onComplete={() => {
            setFollowActive(false);
            setFollowDeparting(false);
          }}
        />
      ) : null}

      {happy && !followActive ? <HappyCapy /> : null}

      {followActive ? (
        <CornerBed
          onClick={async () => {
            await window.capy.bumpTodayCheckinMins(30);
          }}
        />
      ) : null}

      {!followActive && !happy ? (
        <CornerCapy
          undoneCount={undoneCount}
          tasksCount={todayRecord.tasks.length}
          allDone={allDone}
          onClick={() => {
            setViewDateKey(today);
            setPopoverOpen((o) => !o);
          }}
        />
      ) : null}

      {popoverOpen ? (
        <Popover
          state={state}
          viewDateKey={viewDateKey}
          viewRecord={viewRecord}
          todayKey={today}
          isViewingToday={isViewingToday}
          isViewingPast={isViewingPast}
          onPrev={() => setViewDateKey(addDaysKey(viewDateKey, -1))}
          onNext={() => {
            if (!isViewingToday) setViewDateKey(addDaysKey(viewDateKey, 1));
          }}
          onClose={() => setPopoverOpen(false)}
        />
      ) : null}
    </div>
  );
}

function CornerBed({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <ClickableRegion
      style={{
        position: 'absolute',
        right: CORNER_MARGIN,
        bottom: CORNER_MARGIN + CORNER_LIFT,
        width: BED_W + 18,
        height: BED_H + 18,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: BED_W,
          height: BED_H,
          transformOrigin: 'bottom right',
          transition: 'transform 140ms ease-out',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
        }}
      >
        <img
          src={bedImg}
          width={BED_W}
          height={BED_H}
          alt="capy's bed — click to call him back"
          draggable={false}
          style={{
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
          }}
        />
      </div>
    </ClickableRegion>
  );
}

function CornerCapy({
  undoneCount,
  tasksCount,
  allDone,
  onClick,
}: {
  undoneCount: number;
  tasksCount: number;
  allDone: boolean;
  onClick: () => void;
}) {
  const showBadge = tasksCount > 0;
  const badgeText = allDone ? '✓' : String(undoneCount);
  const [hovered, setHovered] = useState(false);
  return (
    <ClickableRegion
      style={{
        position: 'absolute',
        right: CORNER_MARGIN,
        bottom: CORNER_MARGIN + CORNER_LIFT,
        width: CORNER_W + 18,
        height: CORNER_H + 18,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: CORNER_W,
          height: CORNER_H,
          transformOrigin: 'bottom right',
          transition: 'transform 140ms ease-out',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
        }}
      >
        <Capybara width={CORNER_W} variant="sleeping" />
      </div>
      {showBadge ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 28,
            height: 28,
            borderRadius: 14,
            background: COLORS.bg,
            color: COLORS.text,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {badgeText}
        </div>
      ) : null}
    </ClickableRegion>
  );
}

function Popover({
  state,
  viewDateKey,
  viewRecord,
  todayKey,
  isViewingToday,
  isViewingPast,
  onPrev,
  onNext,
  onClose,
}: {
  state: CapyState;
  viewDateKey: string;
  viewRecord: DayRecord;
  todayKey: string;
  isViewingToday: boolean;
  isViewingPast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  // key={view} remounts the content div, so re-observe whenever the view flips.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContentHeight(el.offsetHeight));
    ro.observe(el);
    setContentHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, [view]);

  return (
    <ClickableRegion
      style={{
        position: 'absolute',
        right: CORNER_MARGIN,
        bottom: CORNER_MARGIN + CORNER_LIFT + CORNER_H + 2,
        width: POPOVER_W,
        height: contentHeight !== null ? contentHeight + 36 : undefined,
        background: PANEL.bg,
        color: PANEL.ink,
        borderRadius: 16,
        padding: 18,
        overflow: 'hidden',
        boxShadow: PANEL.shadow,
        pointerEvents: 'auto',
        animation: 'fadeIn 160ms ease-out',
        transition: 'height 240ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={contentRef}
        key={view}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'fadeIn 200ms ease-out',
        }}
      >
        {view === 'settings' ? (
          <SettingsView state={state} onClose={() => setView('main')} />
        ) : (
          <>
            <DateHeader
              viewDateKey={viewDateKey}
              canGoNext={!isViewingToday}
              onPrev={onPrev}
              onNext={onNext}
              onOpenSettings={() => setView('settings')}
            />
            {!isViewingPast ? (
              <CheckInBand
                startTime={viewRecord.startTime}
                onRemind={async () => {
                  await window.capy.bumpTodayCheckinMins(30);
                  onClose();
                }}
              />
            ) : null}
            <TaskList record={viewRecord} readonly={isViewingPast} />
          </>
        )}
      </div>
    </ClickableRegion>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path
        d={dir === 'left' ? 'M10.5 3.5 L5.5 8.5 L10.5 13.5' : 'M6.5 3.5 L11.5 8.5 L6.5 13.5'}
        stroke={PANEL.ink}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <g stroke={PANEL.ink} strokeWidth="1.5" strokeLinecap="round">
        <line x1="3" y1="5.5" x2="17" y2="5.5" />
        <line x1="3" y1="10" x2="17" y2="10" />
        <line x1="3" y1="14.5" x2="17" y2="14.5" />
      </g>
      <circle cx="12.5" cy="5.5" r="2.2" fill={PANEL.bg} stroke={PANEL.ink} strokeWidth="1.5" />
      <circle cx="7" cy="10" r="2.2" fill={PANEL.bg} stroke={PANEL.ink} strokeWidth="1.5" />
      <circle cx="14" cy="14.5" r="2.2" fill={PANEL.bg} stroke={PANEL.ink} strokeWidth="1.5" />
    </svg>
  );
}

function iconButtonStyle(active: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: active ? 'pointer' : 'default',
    opacity: active ? 1 : 0.25,
  };
}

function DateHeader({
  viewDateKey,
  canGoNext,
  onPrev,
  onNext,
  onOpenSettings,
}: {
  viewDateKey: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onPrev} style={iconButtonStyle(true)} aria-label="Previous day">
        <ChevronIcon dir="left" />
      </button>
      <div
        style={{
          fontFamily: FONT_PIXEL,
          fontSize: 19,
          letterSpacing: -0.5,
          color: PANEL.ink,
          lineHeight: '19px',
        }}
      >
        {formatHeaderDate(viewDateKey)}
      </div>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        style={iconButtonStyle(canGoNext)}
        aria-label="Next day"
      >
        <ChevronIcon dir="right" />
      </button>
      <div style={{ flex: 1 }} />
      <button onClick={onOpenSettings} style={iconButtonStyle(true)} aria-label="Settings">
        <SlidersIcon />
      </button>
    </div>
  );
}

const SETTING_LABEL: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontWeight: 500,
  fontSize: 12,
  letterSpacing: 1.6,
  textTransform: 'uppercase',
  color: PANEL.muted,
};

function SettingRow({
  label,
  children,
  first,
  last,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${first ? 2 : 11}px 0 ${last ? 2 : 11}px`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={SETTING_LABEL}>{label}</span>
      {children}
    </div>
  );
}

function TogglePill({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="switch"
      aria-checked={on}
      style={{
        width: 32,
        height: 18,
        borderRadius: 10,
        background: on ? PANEL.ink : PANEL.checkbox,
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 150ms',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2.5,
          left: on ? 16.5 : 2.5,
          width: 13,
          height: 13,
          borderRadius: '50%',
          background: PANEL.bg,
          transition: 'left 150ms',
        }}
      />
    </div>
  );
}

function LockedFlyToggle() {
  const [wiggleCount, setWiggleCount] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const noteTimer = useRef<number | null>(null);

  const poke = () => {
    setWiggleCount((c) => c + 1);
    setShowNote(true);
    if (noteTimer.current) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setShowNote(false), 1600);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: 0.4,
          color: PANEL.muted,
          opacity: showNote ? 1 : 0,
          transition: 'opacity 200ms',
          whiteSpace: 'nowrap',
        }}
      >
        capy must fly
      </span>
      <div
        key={wiggleCount}
        onClick={poke}
        style={{
          width: 32,
          height: 18,
          borderRadius: 10,
          background: PANEL.ink,
          position: 'relative',
          opacity: 0.45,
          cursor: 'not-allowed',
          flexShrink: 0,
          animation: wiggleCount > 0 ? 'wiggle 0.18s ease 2' : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2.5,
            right: 2.5,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: PANEL.bg,
          }}
        />
      </div>
    </div>
  );
}

function MoodSeg({
  mood,
  onChange,
}: {
  mood: 'naughty' | 'nice';
  onChange: (m: 'naughty' | 'nice') => void;
}) {
  const opt = (m: 'naughty' | 'nice', text: string) => (
    <span
      onClick={() => onChange(m)}
      style={{
        fontFamily: FONT_MONO,
        fontWeight: 500,
        fontSize: 10,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: mood === m ? PANEL.bg : PANEL.muted,
        background: mood === m ? PANEL.ink : 'transparent',
        padding: '4px 9px',
        borderRadius: 6,
        transition: 'background 150ms, color 150ms',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {text}
    </span>
  );
  return (
    <div
      style={{
        display: 'inline-flex',
        background: PANEL.bg,
        borderRadius: 8,
        padding: 2,
      }}
    >
      {opt('naughty', 'Naughty')}
      {opt('nice', 'Nice')}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M15 5L5 15" stroke={PANEL.checkbox} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 5L15 15" stroke={PANEL.checkbox} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 10L10 4" stroke={PANEL.checkbox} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 4H10V9" stroke={PANEL.checkbox} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M5.25 2.5H3.5C2.95 2.5 2.5 2.95 2.5 3.5V10.5C2.5 11.05 2.95 11.5 3.5 11.5H5.25"
        stroke={PANEL.checkbox}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 9.5L11.5 7L9 4.5" stroke={PANEL.checkbox} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 7H6" stroke={PANEL.checkbox} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsView({
  state,
  onClose,
}: {
  state: CapyState;
  onClose: () => void;
}) {
  const mood = state.store.mood ?? 'naughty';
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', height: 25 }}>
        <div
          style={{
            fontFamily: FONT_PIXEL,
            fontSize: 19,
            letterSpacing: -0.5,
            lineHeight: '19px',
            color: PANEL.ink,
            marginLeft: 2,
          }}
        >
          Settings
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={iconButtonStyle(true)} aria-label="Close settings">
          <CloseIcon />
        </button>
      </div>

      <div
        style={{
          background: PANEL.band,
          borderRadius: 11,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SettingRow label="Capy stops at" first>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: -0.2,
              color: PANEL.ink,
              borderBottom: `0.5px solid ${PANEL.hairline}`,
              padding: '2px 0',
            }}
          >
            12:00 am
          </span>
        </SettingRow>
        <SettingRow label="Capy flies">
          <LockedFlyToggle />
        </SettingRow>
        <SettingRow label="Capy is" last>
          <MoodSeg mood={mood} onChange={(m) => window.capy.setMood(m)} />
        </SettingRow>
      </div>

      <div
        style={{
          background: PANEL.band,
          borderRadius: 11,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SettingRow label="Launch at login" first>
          <TogglePill
            on={state.store.launchAtLogin}
            onClick={() => window.capy.setLaunchAtLogin(!state.store.launchAtLogin)}
          />
        </SettingRow>
        <SettingRow label="Give feedback" onClick={() => window.capy.openExternal(FEEDBACK_URL)}>
          <ArrowOutIcon />
        </SettingRow>
        <SettingRow label="Quit Capy" last onClick={() => window.capy.quitApp()}>
          <QuitIcon />
        </SettingRow>
      </div>
    </>
  );
}

function TaskList({
  record,
  readonly,
}: {
  record: DayRecord;
  readonly: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[0, 1, 2].map((i) => {
        const task = record.tasks[i];
        return (
          <TaskRow
            key={task ? task.id : `slot-${i}`}
            task={task}
            readonly={readonly}
          />
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  readonly,
}: {
  task: { id: string; title: string; done: boolean } | undefined;
  readonly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task?.title ?? '');

  useEffect(() => {
    if (!editing) setDraft(task?.title ?? '');
  }, [task?.title, editing]);

  const commit = async () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (task) {
      if (trimmed === '') {
        await window.capy.deleteTask(task.id);
      } else if (trimmed !== task.title) {
        await window.capy.updateTaskTitle(task.id, trimmed);
      }
    } else if (trimmed !== '') {
      await window.capy.addTask(trimmed);
    }
  };

  const isEmpty = !task;
  const done = task?.done ?? false;

  const textStyle: React.CSSProperties = {
    flex: 1,
    fontFamily: FONT_SANS,
    fontWeight: 400,
    fontSize: 18,
    letterSpacing: -0.54,
    color: task?.title ? PANEL.ink : PANEL.placeholder,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0 8px 14px',
      }}
    >
      <button
        onClick={async () => {
          if (!readonly && task) await window.capy.toggleTask(task.id);
        }}
        disabled={readonly || isEmpty}
        aria-label={done ? 'Mark undone' : 'Mark done'}
        style={{
          width: 12,
          height: 12,
          borderRadius: 2,
          border: `0.75px solid ${done ? PANEL.ink : PANEL.checkbox}`,
          background: done ? PANEL.ink : 'transparent',
          color: PANEL.bg,
          fontSize: 9,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          cursor: readonly || isEmpty ? 'default' : 'pointer',
          flexShrink: 0,
        }}
      >
        {done ? '✓' : ''}
      </button>
      {editing && !readonly ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setDraft(task?.title ?? '');
              setEditing(false);
            }
          }}
          placeholder="Add a priority..."
          style={{
            ...textStyle,
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: PANEL.ink,
            textDecoration: done ? 'line-through' : 'none',
          }}
        />
      ) : (
        <div
          onClick={() => {
            if (!readonly) setEditing(true);
          }}
          style={{
            ...textStyle,
            color: done ? PANEL.muted : textStyle.color,
            textDecoration: done ? 'line-through' : 'none',
            cursor: readonly ? 'default' : 'text',
            minHeight: 22,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task?.title || (readonly ? '—' : 'Add a priority...')}
        </div>
      )}
    </div>
  );
}

function nowHHMM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function CheckInBand({
  startTime,
  onRemind,
}: {
  startTime: string;
  onRemind: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(startTime);
  const [flash, setFlash] = useState(false);
  const [remindHover, setRemindHover] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(startTime);
  }, [startTime, editing]);

  const commit = async () => {
    setEditing(false);
    const current = nowHHMM();
    if (draft < current) {
      setDraft(startTime);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1200);
      return;
    }
    if (draft !== startTime) {
      await window.capy.setStartTime(draft);
    }
  };

  return (
    <div
      style={{
        background: PANEL.band,
        borderRadius: 11,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontWeight: 500,
          fontSize: 12,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: flash ? 'rgba(200,80,70,0.9)' : PANEL.muted,
          transition: 'color 200ms',
        }}
      >
        {flash ? 'Must be in the future' : 'Check in'}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {editing ? (
          <input
            autoFocus
            type="time"
            value={draft}
            min={nowHHMM()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraft(startTime);
                setEditing(false);
              }
            }}
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: -0.2,
              color: PANEL.ink,
              background: 'transparent',
              border: 'none',
              padding: 0,
              colorScheme: 'light',
            }}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: -0.2,
              color: PANEL.ink,
              cursor: 'text',
            }}
          >
            {format12h(startTime)}
          </div>
        )}
        <button
          onClick={onRemind}
          onMouseEnter={() => setRemindHover(true)}
          onMouseLeave={() => setRemindHover(false)}
          style={{
            fontFamily: FONT_MONO,
            fontSize: 14,
            letterSpacing: -0.2,
            color: remindHover ? PANEL.ink : PANEL.muted,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(181,168,147,0.45)',
            padding: '0 0 4px',
            cursor: 'pointer',
            transition: 'color 120ms',
          }}
        >
          Remind me in 30 mins
        </button>
      </div>
    </div>
  );
}

const FOLLOW_LERP = 0.04;
const DEPART_LERP = 0.07;
const CURSOR_OFFSET_X = -FLY_W / 2;
const CURSOR_GAP_Y = 20;
const DEPART_FALLBACK_MS = 6000;

function FollowingCapy({
  count,
  mood,
  popoverOpen,
  shouldDepart,
  onClick,
  onComplete,
}: {
  count: number;
  mood: 'naughty' | 'nice';
  popoverOpen: boolean;
  shouldDepart: boolean;
  onClick: () => void;
  onComplete: () => void;
}) {
  // The two sprite sheets have different proportions, so the on-screen
  // height depends on the active mood.
  const flyH = mood === 'nice' ? FLY_W / CAPY_CHEER_ASPECT : FLY_H_WALK;
  const flyHRef = useRef(flyH);
  useEffect(() => {
    flyHRef.current = flyH;
  }, [flyH]);

  const [stage, setStage] = useState<'following' | 'frozen' | 'departing'>(
    'following',
  );
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: -FLY_W - 40,
    y: window.innerHeight / 2 - flyH / 2,
  }));
  const [flipped, setFlipped] = useState(false);
  const cursorRef = useRef<{ x: number; y: number }>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const posRef = useRef(pos);
  const rafRef = useRef<number | null>(null);
  const stageRef = useRef(stage);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  // Drive stage transitions from props
  useEffect(() => {
    if (shouldDepart && stage !== 'departing') {
      setStage('departing');
      return;
    }
    if (!shouldDepart && stage === 'departing') {
      // shouldn't normally happen, but recover if user un-departs mid-flight
      setStage(popoverOpen ? 'frozen' : 'following');
      return;
    }
    if (stage === 'departing') return;
    if (popoverOpen && stage !== 'frozen') setStage('frozen');
    if (!popoverOpen && stage === 'frozen') setStage('following');
  }, [popoverOpen, shouldDepart, stage]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let stopped = false;
    let arrived = false;
    const tick = () => {
      if (stopped) return;
      const s = stageRef.current;
      if (s !== 'frozen') {
        const p = posRef.current;
        let targetX: number;
        let targetY: number;
        const h = flyHRef.current;
        if (s === 'departing') {
          // Walk home to the corner spot, then hand off to the sleeping capy.
          targetX = window.innerWidth - CORNER_MARGIN - FLY_W + (FLY_W - CORNER_W) / 2;
          targetY = window.innerHeight - CORNER_MARGIN - CORNER_LIFT - h;
        } else {
          const c = cursorRef.current;
          targetX = clamp(c.x + CURSOR_OFFSET_X, 8, window.innerWidth - FLY_W - 8);
          targetY = clamp(c.y - h - CURSOR_GAP_Y, 80, window.innerHeight - h - 16);
        }
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const lerp = s === 'departing' ? DEPART_LERP : FOLLOW_LERP;
        const next = { x: p.x + dx * lerp, y: p.y + dy * lerp };
        // flipped means "face RIGHT": toward the cursor while following,
        // toward the corner while walking home.
        if (s === 'departing') {
          setFlipped(dx > 0);
          if (!arrived && Math.hypot(dx, dy) < 6) {
            arrived = true;
            onCompleteRef.current();
          }
        } else {
          const cursorIsRight = cursorRef.current.x > next.x + FLY_W / 2;
          setFlipped(cursorIsRight);
        }
        posRef.current = next;
        setPos(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Fallback in case the walk-home gets stuck (e.g. display resize mid-walk).
  useEffect(() => {
    if (stage !== 'departing') return;
    const t = window.setTimeout(onComplete, DEPART_FALLBACK_MS);
    return () => window.clearTimeout(t);
  }, [stage, onComplete]);

  const [roast, setRoast] = useState(() => getFlybyRoast());

  useEffect(() => {
    if (mood !== 'naughty') return;
    const id = window.setInterval(() => setRoast(getFlybyRoast()), 2000);
    return () => window.clearInterval(id);
  }, [mood]);

  const plural = count === 1 ? '' : 's';
  const text =
    mood === 'naughty'
      ? roast
      : `you haven't done your ${count} task${plural} yet!!`;

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: FLY_W,
        height: flyH,
        pointerEvents: 'none',
      }}
    >
      <ClickableRegion
        style={{
          position: 'relative',
          width: FLY_W,
          height: flyH,
          cursor: stage === 'departing' ? 'default' : 'pointer',
          pointerEvents: 'auto',
        }}
        onClick={() => {
          if (stage !== 'departing') onClick();
        }}
      >
        <div
          style={{
            animation: stage === 'departing' ? 'nod 600ms ease-in-out' : undefined,
            transformOrigin: 'center bottom',
          }}
        >
          <Capybara
            width={FLY_W}
            variant={mood === 'nice' ? 'cheering' : 'walking'}
            flipX={flipped}
          />
        </div>
        {stage !== 'departing' ? <SpeechBubble text={text} /> : null}
      </ClickableRegion>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function SpeechBubble({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 16,
        background: COLORS.bg,
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 500,
        padding: '10px 16px',
        borderRadius: 16,
        width: 'max-content',
        maxWidth: 340,
        boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
        textAlign: 'center',
      }}
    >
      {text}
      <div
        style={{
          position: 'absolute',
          bottom: -7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `8px solid ${COLORS.bg}`,
        }}
      />
    </div>
  );
}

function HappyCapy() {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const centerX = winW / 2 - FLY_W / 2;
  const centerY = winH / 2 - FLY_H / 2;
  const cornerX = winW - CORNER_W - CORNER_MARGIN;
  const cornerY = winH - CORNER_H - CORNER_MARGIN;
  const dx = cornerX - centerX;
  const dy = cornerY - centerY;
  const [drifting, setDrifting] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setDrifting(true), 3000);
    return () => window.clearTimeout(t1);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: centerY,
        width: FLY_W,
        height: FLY_H,
        pointerEvents: 'none',
        animation: drifting
          ? 'driftToCorner 1500ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'happyBounce 1500ms ease-in-out',
        ['--dx' as string]: `${dx}px`,
        ['--dy' as string]: `${dy}px`,
      }}
    >
      <Capybara width={FLY_W} variant="happy" />
      {!drifting ? <Sparkles /> : null}
    </div>
  );
}

function Sparkles() {
  const points = [
    { x: -14, y: -10, delay: 0 },
    { x: FLY_W - 6, y: -16, delay: 120 },
    { x: FLY_W / 2 - 4, y: -28, delay: 240 },
    { x: -22, y: FLY_H - 8, delay: 360 },
    { x: FLY_W + 4, y: FLY_H / 2, delay: 480 },
    { x: FLY_W / 2 + 18, y: FLY_H + 4, delay: 600 },
  ];
  return (
    <>
      {points.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: 10,
            height: 10,
            animation: `sparklePop 900ms ease-out ${p.delay}ms forwards`,
            opacity: 0,
          }}
        >
          <svg viewBox="0 0 10 10">
            <path
              d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z"
              fill="#FFE9A3"
            />
          </svg>
        </div>
      ))}
    </>
  );
}
