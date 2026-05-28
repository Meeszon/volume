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
            label: "Balance",
            description: "Flagging, hip placement, and manipulating the center of gravity.",
            allowedKinds: ["climb"],
          },
          {
            id: "dynamic-movement",
            label: "Dynamic Movement",
            description: "Generating momentum, deadpointing, dynos, and absorbing catches.",
            allowedKinds: ["climb"],
          },
          {
            id: "coordination",
            label: "Coordination",
            description: "Sequencing arms, hips, and feet so complex moves flow as one motion instead of separate steps.",
            allowedKinds: ["climb"],
          },
        ],
      },
    ],
  },
  {
    id: "mobility",
    label: "Mobility",
    children: [
      {
        id: "hip-mobility",
        label: "Hip Mobility",
        description: "High steps, wide drop knees, frog stretches, and wall turnouts.",
        allowedKinds: ["train"],
        blocks: [
          {
            name: "Hip Mobility Flow",
            exercises: [
              { name: "90/90 Hip Stretch", sets: 2, value: 60, unit: "seconds", rest: 30 },
              { name: "Cossack Squat", sets: 3, value: 8, unit: "reps", rest: 45 },
              { name: "Pigeon Pose", sets: 2, value: 90, unit: "seconds", rest: 30 },
            ],
          },
          {
            name: "Drop-Knee Prep",
            exercises: [
              { name: "Frog Stretch", sets: 2, value: 60, unit: "seconds", rest: 30 },
              { name: "Butterfly Hold", sets: 2, value: 45, unit: "seconds", rest: 30 },
              { name: "Hip CARs", sets: 2, value: 5, unit: "reps", rest: 30 },
            ],
          },
        ],
      },
      {
        id: "ankle-calf-mobility",
        label: "Ankle Mobility",
        description: "Ankle drops for slab climbing and achieving deep pistol squat positions.",
        allowedKinds: ["train"],
        blocks: [
          {
            name: "Ankle Mobility Routine",
            exercises: [
              { name: "Knee-to-Wall Dorsiflexion", sets: 3, value: 10, unit: "reps", rest: 30 },
              { name: "Eccentric Calf Raise", sets: 3, value: 12, unit: "reps", rest: 60 },
              { name: "Banded Ankle Distraction", sets: 2, value: 60, unit: "seconds", rest: 30 },
            ],
          },
        ],
      },
      {
        id: "shoulder-mobility",
        label: "Shoulder Mobility",
        description: "Overhead reach, open chest flexibility, and healthy shoulder rotation.",
        allowedKinds: ["train"],
        blocks: [
          {
            name: "Shoulder Opener",
            exercises: [
              { name: "Band Shoulder Dislocations", sets: 3, value: 10, unit: "reps", rest: 30 },
              { name: "Thoracic Rotations", sets: 3, value: 10, unit: "reps", rest: 30 },
              { name: "Doorframe Chest Opener", sets: 3, value: 30, unit: "seconds", rest: 30 },
            ],
          },
          {
            name: "Overhead Reach Drill",
            exercises: [
              { name: "Wall Slides", sets: 3, value: 12, unit: "reps", rest: 30 },
              { name: "Prone Y-Raise", sets: 3, value: 10, unit: "reps", rest: 45 },
              { name: "Lat Stretch (each side)", sets: 2, value: 60, unit: "seconds", rest: 30 },
            ],
          },
        ],
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
            label: "Route Reading",
            description: "Mapping beta from the floor, memorizing sequences, and brushing holds.",
            allowedKinds: ["climb"],
          },
          {
            id: "pacing-efficiency",
            label: "Pacing",
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
            label: "Commitment",
            description: "Taking intentional falls, committing to dynamic moves, and trusting the mat.",
            allowedKinds: ["climb"],
          },
          {
            id: "focus-try-hard",
            label: "Focus",
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
            label: "Finger Strength",
            description: "Raw holding power (e.g., hangboarding, max crimp strength).",
            allowedKinds: ["climb", "train"],
            blocks: [
              {
                name: "Max Hangs (20mm)",
                exercises: [
                  { name: "Max Recruitment Hang", sets: 5, value: 8, unit: "seconds", rest: 180 },
                ],
              },
              {
                name: "Minimum Edge",
                exercises: [
                  { name: "Min Edge Hang", sets: 4, value: 10, unit: "seconds", rest: 180 },
                ],
              },
            ],
          },
          {
            id: "power-endurance",
            label: "Power Endurance",
            description: "Sustaining strength and recovering on longer, 10+ move boulders.",
            allowedKinds: ["climb", "train"],
            blocks: [
              {
                name: "Hangboard Repeaters",
                exercises: [
                  { name: "Repeater (7s on / 3s off)", sets: 2, value: 6, unit: "reps", rest: 180 },
                ],
              },
              {
                name: "Classic 4×4",
                exercises: [
                  { name: "4 Boulders Linked", sets: 4, value: 4, unit: "reps", rest: 240 },
                ],
              },
            ],
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
            blocks: [
              {
                name: "Weighted Pull-ups",
                exercises: [
                  { name: "Weighted Pull-up", sets: 5, value: 4, unit: "reps", rest: 180 },
                ],
              },
              {
                name: "Lock-off Ladder",
                exercises: [
                  { name: "90° Lock-off Hold", sets: 3, value: 8, unit: "seconds", rest: 90 },
                  { name: "120° Lock-off Hold", sets: 3, value: 8, unit: "seconds", rest: 90 },
                  { name: "Full Lock-off Hold", sets: 3, value: 8, unit: "seconds", rest: 90 },
                ],
              },
            ],
          },
          {
            id: "compression-strength",
            label: "Compression",
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
        blocks: [
          {
            name: "Core Tension Circuit",
            exercises: [
              { name: "Hollow Body Hold", sets: 3, value: 25, unit: "seconds", rest: 60 },
              { name: "Hanging Leg Raise", sets: 3, value: 10, unit: "reps", rest: 60 },
              { name: "Front Lever Progression", sets: 3, value: 7, unit: "seconds", rest: 90 },
            ],
          },
          {
            name: "Steep Tension Holds",
            exercises: [
              { name: "Toes-to-Bar", sets: 3, value: 8, unit: "reps", rest: 90 },
              { name: "Tension Plank (Feet on Wall)", sets: 3, value: 30, unit: "seconds", rest: 60 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "longevity",
    label: "Longevity",
    children: [
      {
        id: "antagonist-training",
        label: "Antagonists",
        description: "Working pushing muscles (push-ups, overhead press) and finger extensors.",
        allowedKinds: ["train"],
        blocks: [
          {
            name: "Antagonist Circuit",
            exercises: [
              { name: "Push-up", sets: 3, value: 12, unit: "reps", rest: 60 },
              { name: "Band Pull-apart", sets: 3, value: 20, unit: "reps", rest: 45 },
              { name: "Reverse Wrist Curl", sets: 3, value: 15, unit: "reps", rest: 60 },
            ],
          },
          {
            name: "Overhead Push",
            exercises: [
              { name: "Dumbbell Shoulder Press", sets: 3, value: 8, unit: "reps", rest: 90 },
              { name: "Pike Push-up", sets: 3, value: 10, unit: "reps", rest: 60 },
            ],
          },
        ],
      },
      {
        id: "finger-prehab",
        label: "Finger Prehab",
        description: "Loaded extensor work, no-hang protocols, and pulley conditioning to keep tendons resilient.",
        allowedKinds: ["train"],
        blocks: [
          {
            name: "Finger Prehab Routine",
            exercises: [
              { name: "Rubber Band Extensions", sets: 3, value: 20, unit: "reps", rest: 30 },
              { name: "No-Hang Pulls (Half-crimp)", sets: 4, value: 10, unit: "seconds", rest: 90 },
              { name: "Finger Rolls", sets: 3, value: 15, unit: "reps", rest: 45 },
            ],
          },
          {
            name: "Pulley Conditioning",
            exercises: [
              { name: "Density Hang (Open-hand)", sets: 4, value: 20, unit: "seconds", rest: 120 },
              { name: "Light No-Hang Drag", sets: 3, value: 30, unit: "seconds", rest: 60 },
            ],
          },
        ],
      },
      {
        id: "active-recovery-prep",
        label: "Recovery",
        description: "Structured warm-ups, cool-downs, soft tissue work, and off-day movement.",
        allowedKinds: ["train"],
        blocks: [
          {
            name: "Pre-Climb Warm-up",
            exercises: [
              { name: "Easy Cardio", sets: 1, value: 300, unit: "seconds", rest: 30 },
              { name: "Arm Circles", sets: 2, value: 15, unit: "reps", rest: 20 },
              { name: "Hip Openers", sets: 2, value: 8, unit: "reps", rest: 20 },
              { name: "Light Open-hand Hangs", sets: 2, value: 10, unit: "seconds", rest: 60 },
            ],
          },
          {
            name: "Cool-Down & Soft Tissue",
            exercises: [
              { name: "Forearm Foam Roll", sets: 2, value: 60, unit: "seconds", rest: 20 },
              { name: "Lat & Pec Stretch", sets: 2, value: 60, unit: "seconds", rest: 20 },
              { name: "Box Breathing", sets: 1, value: 180, unit: "seconds", rest: 0 },
            ],
          },
        ],
      },
    ],
  },
];
