export type Task = {
  id: string;
  title: string;
  done: boolean;
  doneAt?: number;
};

export type DayRecord = {
  date: string;
  tasks: Task[];
  startTime: string;
  currentTaskIndex: number;
};

export type Mood = 'naughty' | 'nice';

export type CapyStoreShape = {
  days: Record<string, DayRecord>;
  startTime: string;
  pause?: { until: number };
  launchAtLogin: boolean;
  mood: Mood;
};

export type CapyState = {
  store: CapyStoreShape;
  today: string;
  now: number;
};

export type FlybyTask = {
  title: string;
};
