import type { TreeNode } from "../types";

export const CATEGORY_COLORS: Record<string, string> = {
  "technique": "#F5A623",
  "mobility": "#EF4E8B",
  "mental": "#12B89A",
  "longevity": "#7C4DFF",
  "strength": "#4DACF7",
};

export const SKILL_TREE: TreeNode[] = [
  {
    id: "technique",
    label: "Technique",
    children: [
      {
        id: "footwork",
        label: "Footwork",
        children: [
          {
            id: "foot-placement",
            label: "Foot Placement",
            description: "Precision, stepping quietly, edging, and smearing.",
            allowedKinds: ["climb"],
          },
          {
            id: "hooking",
            label: "Hooking",
            description: "Heel hooks, toe hooks, and bicycles.",
            allowedKinds: ["climb"],
          },
        ],
      },
      {
        id: "body-positioning",
        label: "Body Positioning",
        children: [
          {
            id: "balance-weight-shifting",
            label: "Balance & Weight Shifting",
            description: "Flagging, hip placement, and manipulating the center of gravity.",
            allowedKinds: ["climb"],
          },
          {
            id: "dynamic-movement",
            label: "Dynamic Movement",
            description: "Generating momentum, deadpointing, dynos, and absorbing catches.",
            allowedKinds: ["climb"],
          },
        ],
      },
      {
        id: "hold-application",
        label: "Hold Application",
        description: "Adapting to specific hold types (e.g., spending a month focused on trusting slopers or squeezing pinches).",
        allowedKinds: ["climb"],
      },
    ],
  },
  {
    id: "mobility",
    label: "Mobility",
    children: [
      {
        id: "lower-body",
        label: "Lower Body",
        children: [
          {
            id: "hip-mobility",
            label: "Hip Mobility",
            description: "High steps, wide drop knees, frog stretches, and wall turnouts.",
            allowedKinds: ["train"],
          },
          {
            id: "ankle-calf-mobility",
            label: "Ankle & Calf Mobility",
            description: "Ankle drops for slab climbing and achieving deep pistol squat positions.",
            allowedKinds: ["train"],
          },
        ],
      },
      {
        id: "shoulder-mobility",
        label: "Shoulder Mobility",
        description: "Overhead reach, open chest flexibility, and healthy shoulder rotation.",
        allowedKinds: ["train"],
      },
    ],
  },
  {
    id: "mental",
    label: "Mental",
    children: [
      {
        id: "tactics",
        label: "Tactics",
        children: [
          {
            id: "route-reading",
            label: "Route Reading & Visualization",
            description: "Mapping beta from the floor, memorizing sequences, and brushing holds.",
            allowedKinds: ["climb"],
          },
          {
            id: "pacing-efficiency",
            label: "Pacing & Efficiency",
            description: "Knowing when to climb quickly vs. statically, and finding micro-rests.",
            allowedKinds: ["climb"],
          },
        ],
      },
      {
        id: "psychological",
        label: "Psychological",
        children: [
          {
            id: "fear-fall-management",
            label: "Fear & Fall Management",
            description: "Taking intentional falls, committing to dynamic moves, and trusting the mat.",
            allowedKinds: ["climb"],
          },
          {
            id: "focus-try-hard",
            label: "Focus & Try-Hard",
            description: "Staying present, regulating breathing, and pushing through the crux.",
            allowedKinds: ["climb"],
          },
        ],
      },
    ],
  },
  {
    id: "strength",
    label: "Strength",
    children: [
      {
        id: "fingers",
        label: "Fingers",
        children: [
          {
            id: "max-finger-strength",
            label: "Max Finger Strength",
            description: "Raw holding power (e.g., hangboarding, max crimp strength).",
            allowedKinds: ["climb", "train"],
          },
          {
            id: "power-endurance",
            label: "Power Endurance",
            description: "Sustaining strength and recovering on longer, 10+ move boulders.",
            allowedKinds: ["climb", "train"],
          },
        ],
      },
      {
        id: "upper-body",
        label: "Upper Body",
        children: [
          {
            id: "pulling-power",
            label: "Pulling Power",
            description: "Lock-offs, explosive pull-ups, and raw bicep/lat strength.",
            allowedKinds: ["climb", "train"],
          },
          {
            id: "compression-strength",
            label: "Compression Strength",
            description: "Squeezing volumes, hugging arêtes, and wide-span tension.",
            allowedKinds: ["climb"],
          },
        ],
      },
      {
        id: "core-tension",
        label: "Core Tension",
        description: "Keeping feet from cutting on steep overhangs and maintaining body rigidity.",
        allowedKinds: ["climb", "train"],
      },
    ],
  },
  {
    id: "longevity",
    label: "Longevity",
    children: [
      {
        id: "injury-prevention",
        label: "Injury Prevention",
        children: [
          {
            id: "antagonist-training",
            label: "Antagonist Training",
            description: "Working pushing muscles (push-ups, overhead press) and finger extensors.",
            allowedKinds: ["train"],
          },
          {
            id: "load-volume-management",
            label: "Load & Volume Management",
            description: "Self-regulating session intensity, resting between goes, and avoiding overtraining.",
            allowedKinds: ["climb", "train"],
          },
          {
            id: "active-recovery-prep",
            label: "Active Recovery & Prep",
            description: "Structured warm-ups, cool-downs, soft tissue work, and off-day movement.",
            allowedKinds: ["train"],
          },
        ],
      },
    ],
  },
];
