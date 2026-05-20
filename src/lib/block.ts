import type { Block, ExerciseDetail } from "../types";

export function summarizeBlock(block: Block): string {
  const n = block.exercises.length;
  return `${n} exercise${n === 1 ? "" : "s"}`;
}

export function describeExercise(ex: ExerciseDetail): string {
  const unitLabel = ex.unit === "reps" ? "reps" : "s";
  const rest = ex.rest > 0 ? ` · rest ${ex.rest}s` : "";
  return `${ex.sets} × ${ex.value} ${unitLabel}${rest}`;
}
