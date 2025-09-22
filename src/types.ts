export interface WorkoutSet {
  Repetions: number;
  Weight: number;
}

export interface OneRepetitionMaximum {
  (workoutSet: WorkoutSet): number;
}
