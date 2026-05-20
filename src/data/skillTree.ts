import type { TreeNode } from "../types";

export const CATEGORY_COLORS: Record<string, string> = {
  "technique": "#F5A623",
  "flexibility-mobility": "#EF4E8B",
  "mental": "#12B89A",
  "grips": "#7C4DFF",
  "physical-strength": "#4DACF7",
};

export const SKILL_TREE: TreeNode[] = [
  {
    id: "technique",
    label: "Technique",
    children: [
      {
        id: "footwork",
        label: "Footwork",
        description: "Develop precise, deliberate foot placement to save energy and unlock technical sequences.",
        allowedKinds: ["climb"],
        exercises: [
          { name: "Silent Feet", detail: "Climb routes placing feet without sound · 5 routes per session" },
          { name: "Precision Stepping", detail: "Hit chalk dot targets on the wall exactly · 10 routes" },
          { name: "Foot Swap Drills", detail: "Exchange foot on the same hold mid-sequence · 3 sets" },
          { name: "Outside Edge Training", detail: "Climb overhang using outside edge only · 4 problems" },
        ],
      },
      {
        id: "body-positioning",
        label: "Body Positioning",
        description: "Master hip rotation, drop knee, and flagging to maximise reach and reduce arm strain.",
        allowedKinds: ["climb"],
        exercises: [
          { name: "Hip-to-Wall Drills", detail: "Get hip flush to wall before each move · 10 moves × 3 sets" },
          { name: "Drop Knee Traverses", detail: "Sustained drop-knee on traversing wall · 3 laps" },
          { name: "Flagging Circuits", detail: "Inside/outside flag on 5 problems · 3 rounds" },
          { name: "Shoulder-in Climbing", detail: "Twist-lock on 30–45° overhang · 20 min" },
        ],
      },
      {
        id: "dynamic-movement",
        label: "Dynamic Movement",
        description: "Build the timing and coordination to execute dead points and controlled dynos.",
        allowedKinds: ["climb"],
        exercises: [
          { name: "Dead Point Ladder", detail: "Catch holds at zero-momentum apex · 3 × 6 reps" },
          { name: "Dyno Problems", detail: "5 problems requiring full dynos · 3 attempts each" },
          { name: "Campus Coordination", detail: "Alternate hand moves on campus board · 3 × 5 reps" },
          { name: "Momentum Traverses", detail: "Link dynamic moves across wall without stopping · 3 laps" },
        ],
      },
    ],
  },
  {
    id: "flexibility-mobility",
    label: "Mobility",
    children: [
      {
        id: "hip-mobility",
        label: "Hip Mobility",
        description: "Increase hip range of motion to reach high feet and use drop knees fluidly.",
        allowedKinds: ["train"],
        exercises: [
          { name: "90/90 Hip Stretch", detail: "2 min each side · before every climbing session" },
          { name: "Cossack Squat", detail: "3 × 8 each side · daily warm-up" },
          { name: "Pigeon Pose", detail: "2 min each side · post-session cool-down" },
          { name: "High Foot Problems", detail: "5 problems with high foot placements · 3 attempts each" },
        ],
        blocks: [
          {
            name: "Hip Mobility Flow",
            exercises: [
              { name: "90/90 Hip Stretch", sets: 2, value: 60, unit: "seconds", rest: 30 },
              { name: "Cossack Squat", sets: 3, value: 8, unit: "reps", rest: 45 },
              { name: "Pigeon Pose", sets: 2, value: 90, unit: "seconds", rest: 30 },
            ],
          },
        ],
      },
      {
        id: "ankle-calf-flexibility",
        label: "Ankle & Calf",
        description: "Loosen ankle dorsiflexion for precise heel placement and slab smearing.",
        allowedKinds: ["train"],
        exercises: [
          { name: "Toe-up Wall Stretch", detail: "Hold 2 min each foot · increases ankle flexion" },
          { name: "Eccentric Calf Raises", detail: "Slow 4s lower · 12 reps × 3 sets" },
          { name: "Heel-Down Slab", detail: "Slab climbing maintaining heel contact on footholds" },
          { name: "Dorsiflexion Drills", detail: "Kneel and rock forward onto toes · 10 reps × 3 sets" },
        ],
        blocks: [
          {
            name: "Ankle & Calf Routine",
            exercises: [
              { name: "Toe-up Wall Stretch", sets: 2, value: 120, unit: "seconds", rest: 30 },
              { name: "Eccentric Calf Raises", sets: 3, value: 12, unit: "reps", rest: 60 },
              { name: "Dorsiflexion Drills", sets: 3, value: 10, unit: "reps", rest: 30 },
            ],
          },
        ],
      },
      {
        id: "shoulder-mobility",
        label: "Shoulder Mobility",
        description: "Maintain healthy shoulder rotation for dynamic reaches and high-lock moves.",
        allowedKinds: ["train"],
        exercises: [
          { name: "Shoulder Dislocations", detail: "Band shoulder circles · 10 reps × 3 sets" },
          { name: "Thoracic Rotations", detail: "Seated twists · 10 reps each side × 3" },
          { name: "Doorframe Chest Opener", detail: "30s hold each arm · 3 sets" },
          { name: "Lat Stretch", detail: "1 min each side · arm overhead against wall" },
        ],
        blocks: [
          {
            name: "Shoulder Prehab",
            exercises: [
              { name: "Shoulder Dislocations", sets: 3, value: 10, unit: "reps", rest: 30 },
              { name: "Thoracic Rotations", sets: 3, value: 10, unit: "reps", rest: 30 },
              { name: "Doorframe Chest Opener", sets: 3, value: 30, unit: "seconds", rest: 30 },
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
        id: "route-reading",
        label: "Route Reading",
        description: "Develop the ability to visualise and plan an efficient sequence before touching the wall.",
        allowedKinds: ["climb"],
        exercises: [
          { name: "Pre-climb Visualisation", detail: "90s below problem · visualise every move before touching the wall" },
          { name: "Beta Comparison", detail: "Watch 2 other climbers · note differences after your attempt" },
          { name: "Blind Sequence", detail: "Describe moves of a familiar problem from memory · check accuracy" },
          { name: "Move Prediction", detail: "Predict sequence before attempting · track accuracy rate over sessions" },
        ],
      },
      {
        id: "commitment",
        label: "Commitment",
        description: "Train the mental discipline to commit fully to moves rather than hesitating mid-sequence.",
        allowedKinds: ["climb"],
        exercises: [
          { name: "Flash or Leave", detail: "Attempt each problem exactly once · forces full commitment" },
          { name: "Commitment Moves", detail: "One scary move per session · commit fully · repeat 3×" },
          { name: "Lead Practice", detail: "Lead routes instead of top-rope — commitment becomes non-negotiable" },
          { name: "Mock Comp Simulation", detail: "5 problems · one attempt each · score honestly" },
        ],
      },
      {
        id: "fear-management",
        label: "Fear Management",
        description: "Build a systematic approach to managing the fear of falling so it stops blocking performance.",
        allowedKinds: ["climb"],
        exercises: [
          { name: "Controlled Falls Practice", detail: "Safe falling from low heights · 5 falls per session until automatic" },
          { name: "Breathing Reset", detail: "Box breathing before hard attempts · 4s in, 4s hold, 4s out" },
          { name: "Progressive Exposure", detail: "Climb slightly higher each session · log your high point" },
          { name: "Staged Fall Practice", detail: "Gradually increase fall distance from known fall zones" },
        ],
      },
    ],
  },
  {
    id: "grips",
    label: "Longevity",
    children: [
      {
        id: "slopers",
        label: "Slopers",
        description: "Master friction-dependent holds by controlling wrist position and shoulder alignment.",
        allowedKinds: ["climb"],
        exercises: [
          { name: "Sloper Hangboard", detail: "20mm sloper · 7s on / 3s off × 6 reps · 2 sets" },
          { name: "Wrist Position Drills", detail: "Keep wrist low, shoulder over hold · 10 controlled moves" },
          { name: "Sloper Problem Set", detail: "5 problems with sloper cruxes · 3 attempts each" },
          { name: "Open-hand Capacity", detail: "Build open-hand strength on moderate holds · avoid full crimp" },
        ],
      },
      {
        id: "crimp-styles",
        label: "Crimp Styles",
        description: "Build finger strength and grip discipline for technical crimpy sequences.",
        allowedKinds: ["climb", "train"],
        exercises: [
          { name: "Half-crimp Hangs", detail: "20mm edge · 10s on / 3 min off · 5 sets" },
          { name: "Open-to-Half Transition", detail: "Alternate grip positions on same holds · 6 reps × 3 sets" },
          { name: "Max Recruitment Hangs", detail: "Added weight · 6–10s · full rest between · 3 sets" },
          { name: "Limit Crimp Problems", detail: "Climb at or above your crimp grade ceiling · 45 min" },
        ],
        blocks: [
          {
            name: "Half-Crimp Hangs",
            exercises: [
              { name: "Half-Crimp Hang (20mm)", sets: 5, value: 10, unit: "seconds", rest: 180 },
            ],
          },
          {
            name: "Max Recruitment",
            exercises: [
              { name: "Max Recruitment Hang", sets: 3, value: 7, unit: "seconds", rest: 300 },
            ],
          },
        ],
      },
      {
        id: "pinches",
        label: "Pinches",
        description: "Develop thumb opposition and lateral finger force for compression and pinch-heavy sequences.",
        allowedKinds: ["climb", "train"],
        exercises: [
          { name: "Pinch Block Holds", detail: "10s holds · 4 sets — builds lateral finger strength" },
          { name: "Pinch Repeaters", detail: "7s on / 3s off × 6 reps · vary grip width · 2 sets" },
          { name: "Pinch Problems", detail: "5 problems with pinch sequences · 3× each" },
          { name: "Thumb Opposition Drills", detail: "Focus on pressing thumb against fingers on each pinch hold" },
        ],
        blocks: [
          {
            name: "Pinch Block Holds",
            exercises: [
              { name: "Pinch Block Hold", sets: 4, value: 10, unit: "seconds", rest: 120 },
            ],
          },
          {
            name: "Pinch Repeaters",
            exercises: [
              { name: "Pinch Repeater (7-on/3-off)", sets: 2, value: 6, unit: "reps", rest: 180 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "physical-strength",
    label: "Strength",
    children: [
      {
        id: "core-tension",
        label: "Core Tension",
        description: "Build full-body tension required to maintain position on steep terrain and through powerful sequences.",
        allowedKinds: ["climb", "train"],
        exercises: [
          { name: "Hollow Body Holds", detail: "20–30s · 3 sets · maintain full body tension throughout" },
          { name: "Hanging Knee Raises", detail: "Slow, controlled · 10 reps × 3 sets" },
          { name: "Front Lever Progressions", detail: "Tuck → advanced tuck → straddle · 5–8s holds · 3 sets" },
          { name: "Compression Problems", detail: "5 problems using compression technique · 3 attempts each" },
        ],
        blocks: [
          {
            name: "Core Circuit",
            exercises: [
              { name: "Hollow Body Hold", sets: 3, value: 25, unit: "seconds", rest: 60 },
              { name: "Hanging Knee Raise", sets: 3, value: 10, unit: "reps", rest: 60 },
              { name: "Front Lever Progression", sets: 3, value: 7, unit: "seconds", rest: 90 },
            ],
          },
        ],
      },
      {
        id: "finger-strength",
        label: "Finger Strength",
        description: "Systematically overload the finger flexors to build grip strength across all hold types.",
        allowedKinds: ["climb", "train"],
        exercises: [
          { name: "Hangboard Repeaters", detail: "7s on / 3s off × 6 reps · 2 sets per grip type" },
          { name: "Max Recruitment Hangs", detail: "Added weight · 6–10s · full rest between · 3 sets" },
          { name: "Minimum Edge", detail: "Find smallest edge you can hang 10s · shrink each week" },
          { name: "Open-hand Capacity", detail: "Build open-hand strength — avoid full crimp on moderate holds" },
        ],
        blocks: [
          {
            name: "Hangboard Repeaters",
            exercises: [
              { name: "Hangboard Repeater (7-on/3-off)", sets: 2, value: 6, unit: "reps", rest: 180 },
            ],
          },
          {
            name: "Max Hangs",
            exercises: [
              { name: "Max Recruitment Hang", sets: 3, value: 8, unit: "seconds", rest: 300 },
            ],
          },
          {
            name: "Minimum Edge",
            exercises: [
              { name: "Minimum Edge Hang", sets: 4, value: 10, unit: "seconds", rest: 180 },
            ],
          },
        ],
      },
      {
        id: "power-endurance",
        label: "Power Endurance",
        description: "Train the ability to sustain hard moves under fatigue using structured circuit formats.",
        allowedKinds: ["climb", "train"],
        exercises: [
          { name: "Classic 4×4", detail: "4 problems × 4 sets · 1 min rest between problems, 4 min between sets" },
          { name: "ARC Training", detail: "20–40 min non-stop easy climbing · pump but never failure" },
          { name: "Linked Sequences", detail: "Connect 4 moderate problems without rest · 3 rounds" },
          { name: "Campus Laddering", detail: "Consecutive rung movements · 3 sets of max rungs" },
        ],
        blocks: [
          {
            name: "Campus Laddering",
            exercises: [
              { name: "Campus Ladder", sets: 3, value: 8, unit: "reps", rest: 180 },
            ],
          },
          {
            name: "ARC Training",
            exercises: [
              { name: "Easy Continuous Climbing", sets: 1, value: 1800, unit: "seconds", rest: 0 },
            ],
          },
        ],
      },
      {
        id: "antagonist-training",
        label: "Antagonist Training",
        description: "Strengthen opposing muscle groups to prevent injury and maintain joint balance.",
        allowedKinds: ["train"],
        exercises: [
          { name: "Push-up Variations", detail: "Wide, narrow, archer · 3 × 12 reps · 2× per week" },
          { name: "Reverse Wrist Curls", detail: "2 kg · 15 reps × 3 sets · after climbing sessions" },
          { name: "Band Pull-aparts", detail: "20 reps × 3 sets · scapular health focus" },
          { name: "Shoulder Press", detail: "3 × 8 reps · rotator cuff prehab emphasis" },
        ],
        blocks: [
          {
            name: "Antagonist Circuit",
            exercises: [
              { name: "Push-up", sets: 3, value: 12, unit: "reps", rest: 60 },
              { name: "Reverse Wrist Curls", sets: 3, value: 15, unit: "reps", rest: 60 },
              { name: "Band Pull-apart", sets: 3, value: 20, unit: "reps", rest: 45 },
            ],
          },
        ],
      },
    ],
  },
];
