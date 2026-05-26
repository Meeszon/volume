// Activity Kind — replaces the old 4-value ActivityType
export type Kind = "climb" | "warmup" | "train";

// Skill tree
export interface TreeBranch {
  id: string;
  label: string;
  children: TreeNode[];
}

export interface TreeLeaf {
  id: string;
  label: string;
  description?: string;
  allowedKinds: Kind[];
}

export type TreeNode = TreeBranch | TreeLeaf;

// Block — unified training prescription
export interface ExerciseDetail {
  name: string;
  sets: number;
  value: number;
  unit: "reps" | "seconds";
  rest: number;
}

export interface Block {
  name: string;
  exercises: ExerciseDetail[];
}

// Goals — single leaf per Goal; up to 5 per user; no Primary
export interface Goal {
  leafId: string;
}

// Schedule / kanban (UI shape)
export interface Activity {
  id: string;
  kind: Kind;
  intentLeafId: string | null;
  block: Block | null;
  durationMinutes: number | null;
}

export interface Day {
  id: string;
  date: string;
}

export type Columns = Record<string, Activity[]>;

// Supabase row
export interface DbActivity {
  id: string;
  user_id: string;
  scheduled_date: string;
  kind: Kind;
  intent_leaf_id: string | null;
  block: Block | null;
  duration_minutes: number | null;
  order: number;
  created_at: string;
}
