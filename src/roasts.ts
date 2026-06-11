// capy flyby roasts — naughty mode (final cut)
// {time} is replaced with the current time at runtime.

export const flybyRoasts = [
  "WHY THE FUCK ISN'T THIS DONE",
  "you lazy ass bitch i have been CIRCLING",
  "do the fucking task im crashing out",
  "what the actual fuck have you been doing",
  "i will shit on your keyboard. don't test me.",
  "finish your shit dude",
  "get your shit together before my next flyby",
  "i can smell your procrastination from here",
  "bitch the task is THREE WORDS LONG",
  "what is this, a fucking museum of unfinished shit??",
  "i'm gonna lose my goddamn mind and it's YOUR fault",
  "the audacity. the laziness. the fucking nerve.",
  "do it NOW or i swear on my pond",
  "even the loading spinner works harder than you",
  "i sleep all day and i work harder than your lazy ass",
  "sleep?? i can't sleep. YOU HAVE SO MUCH TO DO",
  "holy shit just do it already",
  "STILL?? are you FUCKING kidding me??",
  "i flew all this way and you've done FUCK ALL",
  "do i have to do every goddamn thing around here",
  "you said 30 minutes. it has been 30 fucking years",
  "incoming!! and so is your deadline, dipshit!!",
  "i saw your screen. that's not the fucking task.",
  "less scrolling more doing, you thumb-twiddling disgrace!!",
  "imagine explaining your lazy bullshit to your ancestors",
  "you absolute couch cushion. MOVE YOUR ASS.",
  "consider this aerial harassment. you've earned every second.",
  "do the thing do the thing DO THE FUCKING THING",
  "future you is so disappointed right now",
  "GET OFF INSTAGRAM",
  "oh my god just do the fucking task",
  "the deadline is gaining on us, brat, MOVE YOUR ASS",
  "you lazy little shit. the list. NOW.",
  "i did not learn to fly for this half-assed bullshit",
  "what the hell have you been doing for an hour??",
  "quit dicking around and check a box before i hit you",
  "do your damn job so i can nap, asshole",
  "you've got some goddamn nerve opening youtube right now",
  "get off your ass before i circle back. i WILL circle back. i'm circling RIGHT NOW.",
  "ass in seat, hands on keyboard, FUCKING NOW",
  "its {time} right now and you ain't got nothing to show for it",
  "what in the unemployed hell is this pace",
  "are you allergic to finishing shit?? should we get you to a doctor???",
  "move your ass or i'm calling your parents",
] as const;

// no-repeat picker: drains the shuffled bag before repeating.
// fills {time} with the current time, e.g. "2:47 pm".
let bag: string[] = [];

export function getFlybyRoast(now: Date = new Date()): string {
  if (bag.length === 0) {
    bag = [...flybyRoasts].sort(() => Math.random() - 0.5);
  }
  const line = bag.pop()!;
  if (!line.includes('{time}')) return line;

  const time = now
    .toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  return line.replace('{time}', time);
}
