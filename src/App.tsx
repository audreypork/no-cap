import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capybara } from './Capybara';
import type { CapyState, DayRecord } from './types';
import { addDaysKey, formatHeaderDate, localDateKey } from './dateUtils';

const CORNER_W = 72;
const CORNER_H = (CORNER_W * 55) / 115;
const FLY_W = 120;
const FLY_H = (FLY_W * 55) / 115;
const CORNER_MARGIN = 16;
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
  const [flyby, setFlyby] = useState<{ title: string } | null>(null);
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
    const off = window.capy.onFlybyStart(({ title }) => {
      setFlyby({ title });
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

  useEffect(() => {
    if (popoverOpen) {
      window.capy.setIgnoreMouse(false);
      return () => {
        window.capy.setIgnoreMouse(true);
      };
    }
  }, [popoverOpen]);

  const isViewingToday = viewDateKey === today;
  const isViewingPast = viewDateKey < today;

  const handleClickOutside = useCallback(() => {
    setPopoverOpen(false);
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
        <FlyingCapy
          title={flyby.title}
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
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'auto',
              }}
              onMouseEnter={() => window.capy.setIgnoreMouse(false)}
              onClick={handleClickOutside}
            >
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
            </div>
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
        width: CORNER_W + 14,
        height: CORNER_H + 14,
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
          width: 22,
          height: 22,
          borderRadius: 11,
          background: COLORS.bg,
          color: COLORS.text,
          fontSize: 11,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${COLORS.border}`,
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
      <TaskList
        record={viewRecord}
        readonly={isViewingPast}
        canAdd={!isViewingPast && viewRecord.tasks.length < 3}
      />
      {!isViewingPast ? (
        <StartTimePicker startTime={state.store.startTime} />
      ) : null}
      <Footer
        launchAtLogin={state.store.launchAtLogin}
        onQuit={() => window.capy.quitApp()}
      />
    </ClickableRegion>
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
  canAdd,
}: {
  record: DayRecord;
  readonly: boolean;
  canAdd: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {record.tasks.map((t) => (
        <TaskRow key={t.id} task={t} readonly={readonly} />
      ))}
      {Array.from({ length: Math.max(0, 3 - record.tasks.length) }).map((_, i) => (
        <EmptyTaskRow key={`empty-${i}`} disabled={readonly || record.tasks.length + i >= 3} />
      ))}
      {!readonly ? (
        <button
          disabled={!canAdd}
          onClick={async () => {
            if (canAdd) await window.capy.addTask('');
          }}
          style={{
            marginTop: 4,
            background: 'transparent',
            border: 'none',
            color: COLORS.text,
            fontSize: 12,
            fontWeight: 500,
            alignSelf: 'flex-start',
            padding: '6px 0',
            opacity: canAdd ? 1 : 0.5,
            cursor: canAdd ? 'pointer' : 'default',
          }}
        >
          + Add
        </button>
      ) : null}
    </div>
  );
}

function TaskRow({ task, readonly }: { task: { id: string; title: string; done: boolean }; readonly: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  useEffect(() => {
    if (!editing) setDraft(task.title);
  }, [task.title, editing]);

  const commit = async () => {
    setEditing(false);
    if (draft !== task.title) {
      await window.capy.updateTaskTitle(task.id, draft);
    }
  };

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
          if (!readonly) await window.capy.toggleTask(task.id);
        }}
        disabled={readonly}
        aria-label={task.done ? 'Mark undone' : 'Mark done'}
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          border: `1.5px solid ${task.done ? COLORS.text : 'rgba(255,255,255,0.4)'}`,
          background: task.done ? COLORS.text : 'transparent',
          color: COLORS.bg,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          cursor: readonly ? 'default' : 'pointer',
          flexShrink: 0,
        }}
      >
        {task.done ? '✓' : ''}
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
              setDraft(task.title);
              setEditing(false);
            }
          }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: COLORS.text,
            fontSize: 13,
            padding: 0,
            textDecoration: task.done ? 'line-through' : 'none',
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
            color: task.title ? COLORS.text : COLORS.textMuted,
            textDecoration: task.done ? 'line-through' : 'none',
            opacity: task.done ? 0.55 : 1,
            cursor: readonly ? 'default' : 'text',
            minHeight: 18,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.title || (readonly ? '—' : 'Add a priority…')}
        </div>
      )}
      {!readonly ? (
        <button
          onClick={async () => {
            await window.capy.deleteTask(task.id);
          }}
          aria-label="Delete"
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.textMuted,
            fontSize: 12,
            cursor: 'pointer',
            padding: 4,
            opacity: 0.5,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function EmptyTaskRow({ disabled }: { disabled: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 0',
        opacity: 0.6,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          border: `1.5px dashed rgba(255,255,255,0.2)`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, fontSize: 13, color: COLORS.textMuted }}>
        {disabled ? '—' : 'Add a priority…'}
      </div>
    </div>
  );
}

function StartTimePicker({ startTime }: { startTime: string }) {
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
      <span>Start reminding me at</span>
      <input
        type="time"
        value={startTime}
        onChange={async (e) => {
          await window.capy.setStartTime(e.target.value);
        }}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          fontSize: 12,
          padding: '4px 8px',
          borderRadius: 6,
          fontFamily: 'inherit',
          colorScheme: 'dark',
        }}
      />
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

function FlyingCapy({
  title,
  paused,
  onPauseClick,
  onPickPause,
  onComplete,
}: {
  title: string;
  paused: boolean;
  onPauseClick: () => void;
  onPickPause: (minutes: number) => void;
  onComplete: () => void;
}) {
  const yOffset = useMemo(() => Math.round((Math.random() - 0.5) * 120), []);
  const [stage, setStage] = useState<'flying' | 'paused' | 'departing'>('flying');
  const [frozenX, setFrozenX] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (paused && stage === 'flying') {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setFrozenX(rect.left);
      setStage('paused');
    }
  }, [paused, stage]);

  useEffect(() => {
    if (stage !== 'flying') return;
    const t = window.setTimeout(() => {
      onComplete();
    }, 8000);
    return () => window.clearTimeout(t);
  }, [stage, onComplete]);

  const handlePauseChoice = (mins: number) => {
    setStage('departing');
    window.setTimeout(() => {
      onPickPause(mins);
    }, 1100);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `calc(50vh + ${yOffset}px - ${FLY_H / 2}px)`,
        left: 0,
        width: '100vw',
        height: FLY_H + 80,
        pointerEvents: 'none',
      }}
    >
      <div
        ref={wrapperRef}
        style={
          stage === 'flying'
            ? {
                position: 'absolute',
                top: 40,
                left: 0,
                animation: 'flyAcross 8s linear forwards',
                pointerEvents: 'auto',
              }
            : {
                position: 'absolute',
                top: 40,
                left: frozenX ?? 0,
                pointerEvents: 'auto',
              }
        }
      >
        <ClickableRegion
          style={{
            position: 'relative',
            width: FLY_W,
            height: FLY_H,
            cursor: stage === 'flying' ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (stage === 'flying') onPauseClick();
          }}
        >
          <div
            style={
              stage === 'departing'
                ? { animation: 'nod 500ms ease-in-out, driftOffRight 600ms ease-in 500ms forwards' }
                : undefined
            }
          >
            <Capybara width={FLY_W} variant="awake" />
          </div>
          <SpeechBubble text={title} />
          {stage === 'paused' ? <PausePills onPick={handlePauseChoice} /> : null}
        </ClickableRegion>
      </div>
    </div>
  );
}

function SpeechBubble({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: -8,
        marginBottom: 14,
        background: COLORS.bg,
        color: COLORS.text,
        fontSize: 13,
        fontWeight: 500,
        padding: '8px 12px',
        borderRadius: 13,
        whiteSpace: 'nowrap',
        maxWidth: 320,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      {text}
      <div
        style={{
          position: 'absolute',
          bottom: -5,
          left: 18,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid ${COLORS.bg}`,
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
            width: 64,
            height: 32,
            borderRadius: 16,
            border: 'none',
            background: hover === m ? COLORS.hover : COLORS.bg,
            color: COLORS.text,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 120ms',
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
