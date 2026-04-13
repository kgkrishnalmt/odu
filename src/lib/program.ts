export type Interval = {
  type: 'walk' | 'run'
  duration: number // in seconds
}

export type RunDay = {
  week: number
  day: number
  intervals: Interval[]
  totalDuration: number // in seconds
}

function buildIntervals(segments: { type: 'walk' | 'run'; duration: number }[]): Interval[] {
  return segments
}

export const program: RunDay[] = [
  // Week 1 — 60s run / 90s walk x 8
  ...([1, 2, 3].map((day) => ({
    week: 1, day,
    intervals: [
      { type: 'walk', duration: 300 }, // 5min warmup
      ...Array(8).fill(null).flatMap(() => [
        { type: 'run', duration: 60 },
        { type: 'walk', duration: 90 },
      ]),
      { type: 'walk', duration: 300 }, // 5min cooldown
    ] as Interval[],
    totalDuration: 1800,
  }))),

  // Week 2 — 90s run / 2min walk x 6
  ...([1, 2, 3].map((day) => ({
    week: 2, day,
    intervals: [
      { type: 'walk', duration: 300 },
      ...Array(6).fill(null).flatMap(() => [
        { type: 'run', duration: 90 },
        { type: 'walk', duration: 120 },
      ]),
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 1920,
  }))),

  // Week 3 — (90s run, 90s walk, 3min run, 3min walk) x 2
  ...([1, 2, 3].map((day) => ({
    week: 3, day,
    intervals: [
      { type: 'walk', duration: 300 },
      ...Array(2).fill(null).flatMap(() => [
        { type: 'run', duration: 90 },
        { type: 'walk', duration: 90 },
        { type: 'run', duration: 180 },
        { type: 'walk', duration: 180 },
      ]),
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 1800,
  }))),

  // Week 4 — 3min run, 90s walk, 5min run, 2.5min walk x 2
  ...([1, 2, 3].map((day) => ({
    week: 4, day,
    intervals: [
      { type: 'walk', duration: 300 },
      ...Array(2).fill(null).flatMap(() => [
        { type: 'run', duration: 180 },
        { type: 'walk', duration: 90 },
        { type: 'run', duration: 300 },
        { type: 'walk', duration: 150 },
      ]),
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 2160,
  }))),

  // Week 5 — Day 1: 5min run, 3min walk x 3
  {
    week: 5, day: 1,
    intervals: [
      { type: 'walk', duration: 300 },
      ...Array(3).fill(null).flatMap(() => [
        { type: 'run', duration: 300 },
        { type: 'walk', duration: 180 },
      ]),
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 2340,
  },
  // Week 5 — Day 2: 8min run, 5min walk, 8min run
  {
    week: 5, day: 2,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 480 },
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 480 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 2160,
  },
  // Week 5 — Day 3: 20min run (no walk breaks!)
  {
    week: 5, day: 3,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 1200 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 1800,
  },

  // Week 6 — Day 1: 5min run, 3min walk, 8min run, 3min walk, 5min run
  {
    week: 6, day: 1,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 300 },
      { type: 'walk', duration: 180 },
      { type: 'run', duration: 480 },
      { type: 'walk', duration: 180 },
      { type: 'run', duration: 300 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 2340,
  },
  // Week 6 — Day 2: 10min run, 3min walk, 10min run
  {
    week: 6, day: 2,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 600 },
      { type: 'walk', duration: 180 },
      { type: 'run', duration: 600 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 1980,
  },
  // Week 6 — Day 3: 22min run
  {
    week: 6, day: 3,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 1320 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 1920,
  },

  // Week 7 — 25min run x 3
  ...([1, 2, 3].map((day) => ({
    week: 7, day,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 1500 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 2100,
  }))),

  // Week 8 — 28min run x 3
  ...([1, 2, 3].map((day) => ({
    week: 8, day,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 1680 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 2280,
  }))),

  // Week 9 — 30min run x 3
  ...([1, 2, 3].map((day) => ({
    week: 9, day,
    intervals: [
      { type: 'walk', duration: 300 },
      { type: 'run', duration: 1800 },
      { type: 'walk', duration: 300 },
    ] as Interval[],
    totalDuration: 2400,
  }))),
]

export function getRun(week: number, day: number): RunDay | undefined {
  return program.find((r) => r.week === week && r.day === day)
}