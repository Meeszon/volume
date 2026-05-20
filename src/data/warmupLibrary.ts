import type { Block } from "../types";

// Warmups live outside the Skill Tree — Warmup Activities pick from here
// instead of an Intent leaf. Contents are placeholder per ADR-0001.
export const warmupLibrary: Block[] = [
  {
    name: "General Warmup",
    exercises: [
      { name: "Easy Cardio", sets: 1, value: 300, unit: "seconds", rest: 30 },
      { name: "Dynamic Leg Swings", sets: 2, value: 10, unit: "reps", rest: 20 },
      { name: "Arm Circles", sets: 2, value: 15, unit: "reps", rest: 20 },
      { name: "Hip Openers", sets: 2, value: 8, unit: "reps", rest: 20 },
    ],
  },
  {
    name: "Wall Warmup",
    exercises: [
      { name: "Easy Traverse", sets: 2, value: 120, unit: "seconds", rest: 60 },
      { name: "Moderate Boulder", sets: 3, value: 1, unit: "reps", rest: 60 },
      { name: "Progressive Difficulty", sets: 3, value: 1, unit: "reps", rest: 90 },
    ],
  },
  {
    name: "Finger Warmup",
    exercises: [
      { name: "Open-Hand Hangs", sets: 3, value: 10, unit: "seconds", rest: 60 },
      { name: "Half-Crimp Activation", sets: 2, value: 7, unit: "seconds", rest: 90 },
      { name: "Finger Rolls", sets: 2, value: 15, unit: "reps", rest: 30 },
    ],
  },
];
