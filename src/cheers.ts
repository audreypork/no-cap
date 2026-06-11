// capy flyby cheers — nice mode (final cut)
// {time} is replaced with the current time at runtime.

export const flybyCheers = [
  "you've got this!!",
  'look at you go!!',
  'i believe in you SO much',
  'one little task at a time, friend',
  "you're doing better than you think",
  "i flew by just to say you're crushing it",
  'the list is lucky to have you',
  "deep breath. you've totally got this.",
  'small steps still count!! keep going!!',
  "psst. you're doing great.",
  "proud of you already and you're not even done",
  'future you is going to be SO grateful',
  "you showed up today. that's the hard part.",
  'ooh look at that focus!! incredible!!',
  "i told the other capybaras about you. they're impressed.",
  'you make this look easy',
  'one checkbox and the day is officially a win',
  'a checkbox a day keeps the doctor away',
  'rooting for you!!',
  "incoming!! it's encouragement!!",
  'your effort today is genuinely lovely to watch',
  "consider this aerial support. you've earned every second.",
  'you CAN do the thing',
  'future you is cheering so loud right now',
  'amazing work!! seriously!!',
  'ok superstar, one more box',
  "the deadline doesn't stand a chance against you",
  "you wonderful little overachiever. you've got this.",
  'i learned to fly just to cheer you on properly',
  "check one box and i'll do a celebratory loop",
  "naps are earned around here and you're SO close",
  'you opened the app. momentum has officially begun.',
  "its {time} and you're still showing up",
  "this pace is sustainable and that's smart, actually",
  'productivity looks SO good on you',
  'your parents are so proud of you.',
] as const;

// no-repeat picker: drains the shuffled bag before repeating.
// fills {time} with the current time, e.g. "2:47 pm".
let bag: string[] = [];

export function getFlybyCheer(now: Date = new Date()): string {
  if (bag.length === 0) {
    bag = [...flybyCheers].sort(() => Math.random() - 0.5);
  }
  const line = bag.pop()!;
  if (!line.includes('{time}')) return line;

  const time = now
    .toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  return line.replace('{time}', time);
}
