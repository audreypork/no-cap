import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capybara } from './Capybara';
import type { CapyState, DayRecord } from './types';
import { addDaysKey, formatHeaderDate, localDateKey } from './dateUtils';

const CORNER_W = 130;
const CORNER_H = (CORNER_W * 55) / 115;
const FLY_W = 160;
const FLY_H = (FLY_W * 55) / 115;
const CORNER_MARGIN = 20;
const POPOVER_W = 320;
const HAPPY_DURATION_MS = 4500;

const COLORS = {
  bg: '#1F1A14',
  text: '#FBFAF6',
  textMuted: 'rgba(251,250,246,0.55)',
  hover: '#3D2F22',
  border: 'rgba(255,255,255,0.08)',
};

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
  const [flyby, setFlyby] = useState<{ count: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [happy, setHappy] = useState(false);
  const prevAllDoneRef = useRef(false);

  useEffect(() => {
    window.capy.getState().then(setState);
    const off = window.capy.onStateChanged((s) => setState(s));
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    const off = window.capy.onFlybyStart(({ count }) => {
      setFlyby({ count });
      setPaused(false);
    });
    return () => {
      off();
    };
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
      {flyby ? (
        <FollowingCapy
          count={flyby.count}
          paused={paused}
          onPauseClick={() => setPaused(true)}
          onPickPause={async (mins) => {
            await window.capy.setPause(mins);
            setFlyby(null);
            setPaused(false);
            window.capy.flybyFinished();
          }}
          onComplete={() => {
            setFlyby(null);
            window.capy.flybyFinished();
          }}
        />
      ) : null}

      {happy && !flyby ? <HappyCapy /> : null}

      {!flyby && !happy ? (
        <>
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

          <CornerCapy
            undoneCount={undoneCount}
            tasksCount={todayRecord.tasks.length}
            allDone={allDone}
            onClick={() => {
              setViewDateKey(today);
              setPopoverOpen((o) => !o);
            }}
          />
        </>
      ) : null}
    </div>
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
  const showCheck = allDone;
  const badgeText = showCheck ? '✓' : tasksCount === 0 ? '+' : String(undoneCount);
  return (
    <ClickableRegion
      style={{
        position: 'absolute',
        right: CORNER_MARGIN,
        bottom: CORNER_MARGIN,
        width: CORNER_W + 18,
        height: CORNER_H + 18,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: CORNER_W,
          height: CORNER_H,
          animation: 'breathe 4s ease-in-out infinite',
        }}
      >
        <Capybara width={CORNER_W} variant="sleeping" />
      </div>
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
  const popoverHeight = 360;
  return (
    <ClickableRegion
      style={{
        position: 'absolute',
        right: CORNER_MARGIN,
        bottom: CORNER_MARGIN + CORNER_H + 12,
        width: POPOVER_W,
        background: COLORS.bg,
        color: COLORS.text,
        borderRadius: 13,
        padding: '14px 16px 12px',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        animation: 'fadeIn 160ms ease-out',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <DateHeader
        viewDateKey={viewDateKey}
        canGoNext={!isViewingToday}
        onPrev={onPrev}
        onNext={onNext}
      />
      <TaskList record={viewRecord} readonly={isViewingPast} />
      {!isViewingPast ? (
        <>
          <StartTimePicker startTime={state.store.startTime} />
          <RemindMeButton
            onClick={async () => {
              await window.capy.setPause(30);
              onClose();
            }}
          />
        </>
      ) : null}
      <Footer
        launchAtLogin={state.store.launchAtLogin}
        onQuit={() => window.capy.quitApp()}
      />
    </ClickableRegion>
  );
}

function RemindMeButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        marginTop: 12,
        width: '100%',
        height: 36,
        borderRadius: 18,
        border: `1px solid ${COLORS.border}`,
        background: hover ? COLORS.hover : 'rgba(255,255,255,0.04)',
        color: COLORS.text,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 120ms',
      }}
    >
      Remind me in 30 mins
    </button>
  );
}

function DateHeader({
  viewDateKey,
  canGoNext,
  onPrev,
  onNext,
}: {
  viewDateKey: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <button
        onClick={onPrev}
        style={chevronStyle(true)}
        aria-label="Previous day"
      >
        ‹
      </button>
      <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0.2 }}>
        {formatHeaderDate(viewDateKey)}
      </div>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        style={chevronStyle(canGoNext)}
        aria-label="Next day"
      >
        ›
      </button>
    </div>
  );
}

function chevronStyle(active: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: COLORS.text,
    fontSize: 20,
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: active ? 'pointer' : 'default',
    opacity: active ? 0.85 : 0.25,
    padding: 0,
    lineHeight: 1,
  };
}

function TaskList({
  record,
  readonly,
}: {
  record: DayRecord;
  readonly: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 0',
      }}
    >
      <button
        onClick={async () => {
          if (!readonly && task) await window.capy.toggleTask(task.id);
        }}
        disabled={readonly || isEmpty}
        aria-label={done ? 'Mark undone' : 'Mark done'}
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          border: `1.5px ${isEmpty ? 'dashed' : 'solid'} ${
            done ? COLORS.text : isEmpty ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.4)'
          }`,
          background: done ? COLORS.text : 'transparent',
          color: COLORS.bg,
          fontSize: 11,
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
          placeholder="Add a priority…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: COLORS.text,
            fontSize: 13,
            padding: 0,
            textDecoration: done ? 'line-through' : 'none',
          }}
        />
      ) : (
        <div
          onClick={() => {
            if (!readonly) setEditing(true);
          }}
          style={{
            flex: 1,
            fontSize: 13,
            color: task?.title ? COLORS.text : COLORS.textMuted,
            textDecoration: done ? 'line-through' : 'none',
            opacity: done ? 0.55 : 1,
            cursor: readonly ? 'default' : 'text',
            minHeight: 18,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task?.title || (readonly ? '—' : 'Add a priority…')}
        </div>
      )}
    </div>
  );
}

function nowHHMM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StartTimePicker({ startTime }: { startTime: string }) {
  const [draft, setDraft] = useState(startTime);
  const [minTime, setMinTime] = useState(() => nowHHMM());
  const [flash, setFlash] = useState(false);

  useEffect(() => setDraft(startTime), [startTime]);

  useEffect(() => {
    const id = window.setInterval(() => setMinTime(nowHHMM()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const commit = async () => {
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
        marginTop: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: COLORS.textMuted,
      }}
    >
      <span>Check in at</span>
      <input
        type="time"
        value={draft}
        min={minTime}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={{
          background: flash ? 'rgba(220,80,80,0.18)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${flash ? 'rgba(220,80,80,0.45)' : COLORS.border}`,
          color: COLORS.text,
          fontSize: 12,
          padding: '4px 8px',
          borderRadius: 6,
          fontFamily: 'inherit',
          colorScheme: 'dark',
          transition: 'background 200ms, border-color 200ms',
        }}
      />
      {flash ? (
        <span style={{ fontSize: 11, color: 'rgba(220,80,80,0.85)' }}>
          must be in the future
        </span>
      ) : null}
    </div>
  );
}

function Footer({
  launchAtLogin,
  onQuit,
}: {
  launchAtLogin: boolean;
  onQuit: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 10,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: COLORS.textMuted,
      }}
    >
      <span>Capy stops at midnight.</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={launchAtLogin}
            onChange={async (e) => {
              await window.capy.setLaunchAtLogin(e.target.checked);
            }}
            style={{ accentColor: COLORS.text, cursor: 'pointer' }}
          />
          Launch at login
        </label>
        <button
          onClick={onQuit}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.textMuted,
            fontSize: 11,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
          }}
        >
          Quit
        </button>
      </div>
    </div>
  );
}

const FOLLOW_DURATION_MS = 12000;
const FOLLOW_LERP = 0.08;
const CURSOR_OFFSET_X = -FLY_W - 24;
const CURSOR_OFFSET_Y = -FLY_H - 20;

function FollowingCapy({
  count,
  paused,
  onPauseClick,
  onPickPause,
  onComplete,
}: {
  count: number;
  paused: boolean;
  onPauseClick: () => void;
  onPickPause: (minutes: number) => void;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<'following' | 'paused' | 'departing'>(
    'following',
  );
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: -FLY_W - 40,
    y: window.innerHeight / 2 - FLY_H / 2,
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

  useEffect(() => {
    if (paused && stage === 'following') setStage('paused');
  }, [paused, stage]);

  useEffect(() => {
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const s = stageRef.current;
      if (s !== 'paused') {
        const p = posRef.current;
        let targetX: number;
        let targetY: number;
        if (s === 'departing') {
          targetX = window.innerWidth + 200;
          targetY = p.y + 30;
        } else {
          const c = cursorRef.current;
          targetX = clamp(c.x + CURSOR_OFFSET_X, 8, window.innerWidth - FLY_W - 8);
          targetY = clamp(c.y + CURSOR_OFFSET_Y, 80, window.innerHeight - FLY_H - 16);
        }
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const next = { x: p.x + dx * FOLLOW_LERP, y: p.y + dy * FOLLOW_LERP };
        const cursorIsLeft = cursorRef.current.x < next.x + FLY_W / 2;
        setFlipped(cursorIsLeft && s !== 'departing');
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

  useEffect(() => {
    if (stage !== 'following') return;
    const t = window.setTimeout(() => setStage('departing'), FOLLOW_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'departing') return;
    const t = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(t);
  }, [stage, onComplete]);

  const handlePauseChoice = (mins: number) => {
    setStage('departing');
    window.setTimeout(() => {
      onPickPause(mins);
    }, 1500);
  };

  const text = `lazy ass bitch you haven't done your ${count} task${count === 1 ? '' : 's'} yet`;

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: FLY_W,
        height: FLY_H,
        pointerEvents: 'none',
      }}
    >
      <ClickableRegion
        style={{
          position: 'relative',
          width: FLY_W,
          height: FLY_H,
          cursor: stage === 'following' ? 'pointer' : 'default',
          pointerEvents: 'auto',
        }}
        onClick={() => {
          if (stage === 'following') onPauseClick();
        }}
      >
        <div
          style={{
            animation: stage === 'departing' ? 'nod 600ms ease-in-out' : undefined,
            transformOrigin: 'center bottom',
          }}
        >
          <Capybara width={FLY_W} variant="awake" flipX={flipped} />
        </div>
        <SpeechBubble text={text} />
        {stage === 'paused' ? <PausePills onPick={handlePauseChoice} /> : null}
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
        left: -8,
        marginBottom: 16,
        background: COLORS.bg,
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 500,
        padding: '10px 16px',
        borderRadius: 16,
        whiteSpace: 'nowrap',
        maxWidth: 480,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
      }}
    >
      {text}
      <div
        style={{
          position: 'absolute',
          bottom: -7,
          left: 22,
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

function PausePills({ onPick }: { onPick: (mins: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div
      style={{
        position: 'absolute',
        left: FLY_W + 12,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {[15, 30, 45, 60].map((m) => (
        <button
          key={m}
          onMouseEnter={() => setHover(m)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onPick(m)}
          style={{
            width: 76,
            height: 38,
            borderRadius: 19,
            border: 'none',
            background: hover === m ? COLORS.hover : COLORS.bg,
            color: COLORS.text,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 120ms',
            boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
          }}
        >
          {m} min
        </button>
      ))}
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
