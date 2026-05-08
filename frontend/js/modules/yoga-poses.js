/**
 * Yoga Poses Database
 * Comprehensive library of yoga poses organized by difficulty
 */

export const YOGA_POSES = {
  beginner: [
    {
      id: "mountain",
      name: "Mountain Pose",
      sanskrit: "Tadasana",
      difficulty: "Beginner",
      duration: 30,
      emoji: "⛰️",
      description: "A grounding foundation pose that builds awareness and alignment.",
      benefits: ["Improves posture", "Strengthens legs", "Builds focus"],
      keyPoints: [
        "Feet hip-width apart, weight evenly distributed",
        "Engage thighs, lengthen spine",
        "Shoulders relax away from ears",
        "Arms at sides, palms facing forward",
        "Gaze straight ahead, breathe steadily"
      ],
      steps: [
        { title: "Ground your feet", detail: "Feet hip-width, weight even", hold: 2 },
        { title: "Lengthen spine", detail: "Lift tall, shoulders relax", hold: 2 },
        { title: "Reach upward", detail: "Arms long, palms forward", hold: 2 },
        { title: "Final hold", detail: "Breathe steady and tall", hold: 10 }
      ],
      breathing: "Steady, natural breathing",
      modifications: "Use wall for support",
      safetyTips: "Avoid looking down, keep chest open",
      criticalJoints: ["shoulders", "hips", "knees", "ankles"]
    },
    {
      id: "tree",
      name: "Tree Pose",
      sanskrit: "Vrksasana",
      difficulty: "Beginner",
      duration: 30,
      emoji: "🌳",
      description: "A balancing pose that cultivates stability and inner peace.",
      benefits: ["Improves balance", "Strengthens legs", "Opens hips"],
      keyPoints: [
        "Stand on left leg, right foot to calf or inner thigh",
        "Hands to heart center or overhead",
        "Square hips forward, lengthen spine",
        "Soft gaze on a fixed point",
        "Breathe deeply and hold"
      ],
      steps: [
        { title: "Find your base", detail: "Soft knee, steady gaze", hold: 2 },
        { title: "Place your foot", detail: "Foot to calf or inner thigh", hold: 2 },
        { title: "Hands to heart", detail: "Chest open, core engaged", hold: 2 },
        { title: "Final hold", detail: "Arms overhead, breathe", hold: 10 }
      ],
      breathing: "Deep belly breathing",
      modifications: "Use wall for support",
      safetyTips: "Don't place foot on knee",
      criticalJoints: ["left_knee", "right_hip", "ankles", "shoulders"]
    },
    {
      id: "child",
      name: "Child's Pose",
      sanskrit: "Balasana",
      difficulty: "Beginner",
      duration: 60,
      emoji: "👶",
      description: "A restorative pose perfect for rest and relaxation.",
      benefits: ["Relieves stress", "Stretches back", "Calms mind"],
      keyPoints: [
        "Knees wide, big toes touching",
        "Sink hips to heels",
        "Arms extended forward or alongside body",
        "Forehead rests on mat",
        "Breathe into the stretch"
      ],
      steps: [
        { title: "Come to knees", detail: "Big toes together", hold: 2 },
        { title: "Sink hips", detail: "Rest on heels comfortably", hold: 3 },
        { title: "Extend arms", detail: "Forehead down, relax", hold: 3 },
        { title: "Deep rest", detail: "Breathe and release tension", hold: 15 }
      ],
      breathing: "Slow, deep breathing",
      modifications: "Place pillow under chest",
      safetyTips: "Knees should be comfortable",
      criticalJoints: ["hips", "knees", "ankles", "spine"]
    },
    {
      id: "cobra",
      name: "Cobra Pose",
      sanskrit: "Bhujangasana",
      difficulty: "Beginner",
      duration: 30,
      emoji: "🐍",
      description: "A backbend that opens the chest and strengthens the spine.",
      benefits: ["Opens chest", "Strengthens arms", "Energizes body"],
      keyPoints: [
        "Lie on belly, hands under shoulders",
        "Elbows close to ribs",
        "Press chest forward and up",
        "Shoulders back, gaze upward",
        "Engage core and thighs"
      ],
      steps: [
        { title: "Lie on belly", detail: "Palms under shoulders", hold: 1 },
        { title: "Press chest up", detail: "Elbows close to body", hold: 2 },
        { title: "Open front body", detail: "Shoulders relaxed", hold: 3 },
        { title: "Hold and breathe", detail: "Steady posture", hold: 10 }
      ],
      breathing: "Steady breaths",
      modifications: "Keep elbows bent",
      safetyTips: "Don't strain neck",
      criticalJoints: ["shoulders", "elbows", "wrists", "spine"]
    },
    {
      id: "catcow",
      name: "Cat-Cow Pose",
      sanskrit: "Marjaryasana-Bitilasana",
      difficulty: "Beginner",
      duration: 45,
      emoji: "🐱",
      description: "A flowing warm-up that mobilizes the spine.",
      benefits: ["Warms up spine", "Builds flexibility", "Calms mind"],
      keyPoints: [
        "Start on hands and knees",
        "Alternate between arching and rounding spine",
        "Move with breath",
        "Smooth, fluid transitions",
        "Engage core throughout"
      ],
      steps: [
        { title: "Come to table", detail: "Wrists under shoulders", hold: 1 },
        { title: "Cow breath", detail: "Drop belly, lift gaze", hold: 2 },
        { title: "Cat breath", detail: "Round spine, tuck chin", hold: 2 },
        { title: "Flow cycles", detail: "Repeat 8-10 times", hold: 20 }
      ],
      breathing: "Synced with movement",
      modifications: "Move gently",
      safetyTips: "Don't force range",
      criticalJoints: ["shoulders", "wrists", "spine", "hips"]
    }
  ],
  intermediate: [
    {
      id: "warrior1",
      name: "Warrior I",
      sanskrit: "Virabhadrasana I",
      difficulty: "Intermediate",
      duration: 45,
      emoji: "⚔️",
      description: "A powerful standing pose that builds strength and focus.",
      benefits: ["Builds leg strength", "Opens hips", "Improves focus"],
      keyPoints: [
        "Feet wide, front knee bent",
        "Back foot at 45 degrees",
        "Hips face forward",
        "Arms overhead, shoulder width",
        "Square shoulders to front"
      ],
      steps: [
        { title: "Set your stance", detail: "Feet wide, back foot angled", hold: 2 },
        { title: "Bend front knee", detail: "Knee stacks over ankle", hold: 3 },
        { title: "Raise arms", detail: "Arms overhead, engaged", hold: 3 },
        { title: "Final alignment", detail: "Square hips forward", hold: 10 }
      ],
      breathing: "Deep, steady breaths",
      modifications: "Hands on hips",
      safetyTips: "Keep front knee aligned",
      criticalJoints: ["hips", "knees", "ankles", "shoulders"]
    },
    {
      id: "warrior2",
      name: "Warrior II",
      sanskrit: "Virabhadrasana II",
      difficulty: "Intermediate",
      duration: 45,
      emoji: "⚔️",
      description: "A lateral pose that opens hips and strengthens legs.",
      benefits: ["Opens hips", "Builds endurance", "Improves stability"],
      keyPoints: [
        "Feet wide apart",
        "Front knee bent to 90 degrees",
        "Shoulders stacked over hips",
        "Arms extended, gaze over fingertips",
        "Back foot grounded at 90 degrees"
      ],
      steps: [
        { title: "Set your stance", detail: "Feet wide, toes angled out", hold: 2 },
        { title: "Bend front knee", detail: "Knee stacks over ankle", hold: 3 },
        { title: "Extend arms", detail: "Arms parallel, gaze forward", hold: 3 },
        { title: "Final hold", detail: "Strong legs, soft breath", hold: 10 }
      ],
      breathing: "Steady, powerful breaths",
      modifications: "Shorter stance",
      safetyTips: "Don't let knee collapse inward",
      criticalJoints: ["hips", "knees", "ankles", "shoulders"]
    },
    {
      id: "triangle",
      name: "Triangle Pose",
      sanskrit: "Trikonasana",
      difficulty: "Intermediate",
      duration: 40,
      emoji: "📐",
      description: "A lateral stretch that opens the hips and hamstrings.",
      benefits: ["Stretches sides", "Opens hamstrings", "Strengthens legs"],
      keyPoints: [
        "Feet wide, toes forward",
        "Extend torso to one side",
        "Hand on shin, block, or floor",
        "Top arm reaches up",
        "Open chest toward ceiling"
      ],
      steps: [
        { title: "Wide stance", detail: "Feet hip-width, toes forward", hold: 1 },
        { title: "Extend left arm", detail: "Reach forward and up", hold: 2 },
        { title: "Hinge at hips", detail: "Lower hand toward leg", hold: 3 },
        { title: "Open chest", detail: "Stack shoulders, gaze up", hold: 10 }
      ],
      breathing: "Deep lateral breathing",
      modifications: "Use block under hand",
      safetyTips: "Don't bend at waist",
      criticalJoints: ["hips", "knees", "ankles", "shoulders"]
    },
    {
      id: "bridge",
      name: "Bridge Pose",
      sanskrit: "Setu Bandha Sarvangasana",
      difficulty: "Intermediate",
      duration: 45,
      emoji: "🌉",
      description: "A restorative backbend that opens the chest and hips.",
      benefits: ["Opens chest", "Strengthens glutes", "Calms mind"],
      keyPoints: [
        "Lie on back, knees bent",
        "Feet hip-width apart, parallel",
        "Press through feet to lift hips",
        "Shoulders back, hands clasped under back",
        "Thighs parallel to ground"
      ],
      steps: [
        { title: "Lie on back", detail: "Knees bent, feet flat", hold: 1 },
        { title: "Press feet down", detail: "Lift hips high", hold: 2 },
        { title: "Clasp hands", detail: "Shoulders back and under", hold: 2 },
        { title: "Hold steady", detail: "Engage core and glutes", hold: 10 }
      ],
      breathing: "Steady, supported breaths",
      modifications: "Block under sacrum",
      safetyTips: "Don't turn head",
      criticalJoints: ["hips", "knees", "shoulders", "spine"]
    },
    {
      id: "boat",
      name: "Boat Pose",
      sanskrit: "Navasana",
      difficulty: "Intermediate",
      duration: 30,
      emoji: "🚤",
      description: "A challenging core strengthener that builds power.",
      benefits: ["Strengthens core", "Builds balance", "Improves focus"],
      keyPoints: [
        "Sit, feet flat on floor",
        "Lean back slightly",
        "Lift feet off ground",
        "Extend arms forward",
        "Chest proud, shoulders back"
      ],
      steps: [
        { title: "Seated position", detail: "Bend knees, feet flat", hold: 1 },
        { title: "Engage core", detail: "Lean back slightly", hold: 2 },
        { title: "Lift feet", detail: "Shins parallel to ground", hold: 2 },
        { title: "Full posture", detail: "Extend arms and legs", hold: 8 }
      ],
      breathing: "Deep core breathing",
      modifications: "Keep knees bent",
      safetyTips: "Avoid straining neck",
      criticalJoints: ["hips", "knees", "spine", "shoulders"]
    }
  ],
  advanced: [
    {
      id: "crow",
      name: "Crow Pose",
      sanskrit: "Bakasana",
      difficulty: "Advanced",
      duration: 30,
      emoji: "🐦",
      description: "An arm balance that requires strength and focus.",
      benefits: ["Builds arm strength", "Improves focus", "Boosts confidence"],
      keyPoints: [
        "Squat, hands shoulder-width",
        "Place knees on triceps",
        "Lean forward, transfer weight",
        "Gaze forward, not down",
        "Engage core throughout"
      ],
      steps: [
        { title: "Squat position", detail: "Hands on ground, shoulder-width", hold: 1 },
        { title: "Position knees", detail: "Place on back of upper arms", hold: 1 },
        { title: "Lean forward", detail: "Shift weight to hands", hold: 1 },
        { title: "Lift feet", detail: "Press strongly through hands", hold: 5 }
      ],
      breathing: "Steady, focused breaths",
      modifications: "Keep one foot on ground",
      safetyTips: "Practice near wall",
      criticalJoints: ["shoulders", "elbows", "wrists", "core"]
    },
    {
      id: "headstand",
      name: "Headstand",
      sanskrit: "Sirsasana",
      difficulty: "Advanced",
      duration: 30,
      emoji: "🤸",
      description: "An inversion that reverses blood flow and builds strength.",
      benefits: ["Improves circulation", "Strengthens shoulders", "Calms mind"],
      keyPoints: [
        "Forearms on ground, clasped hands",
        "Crown of head on floor",
        "Shoulders over elbows",
        "Legs extended upward",
        "Engage core throughout"
      ],
      steps: [
        { title: "Forearm setup", detail: "Elbows shoulder-width", hold: 1 },
        { title: "Head position", detail: "Crown on floor, light pressure", hold: 1 },
        { title: "Leg lift", detail: "Walk feet toward torso", hold: 2 },
        { title: "Full inversion", detail: "Legs vertical, steady breathe", hold: 10 }
      ],
      breathing: "Calm, steady breaths",
      modifications: "Wall support",
      safetyTips: "Never force, build gradually",
      criticalJoints: ["shoulders", "neck", "core", "spine"]
    },
    {
      id: "wheel",
      name: "Wheel Pose",
      sanskrit: "Urdhva Mukha Svanasana",
      difficulty: "Advanced",
      duration: 30,
      emoji: "🎡",
      description: "A deep backbend that opens the entire front body.",
      benefits: ["Opens entire front", "Strengthens back", "Energizes body"],
      keyPoints: [
        "Lie on back, knees bent",
        "Hands under shoulders, elbows bent",
        "Press feet and hands to lift",
        "Chest lifts toward chin",
        "Weight distributed evenly"
      ],
      steps: [
        { title: "Lie on back", detail: "Knees bent, feet flat", hold: 1 },
        { title: "Place hands", detail: "Under shoulders, fingers back", hold: 1 },
        { title: "Press up", detail: "Lift chest high", hold: 2 },
        { title: "Full expression", detail: "Crown hangs back gently", hold: 8 }
      ],
      breathing: "Deep, supported breaths",
      modifications: "Stay on forearms",
      safetyTips: "Warm up thoroughly first",
      criticalJoints: ["shoulders", "elbows", "wrists", "spine"]
    },
    {
      id: "sideplank",
      name: "Side Plank",
      sanskrit: "Vasisthasana",
      difficulty: "Advanced",
      duration: 30,
      emoji: "📍",
      description: "A lateral strengthener that builds oblique and shoulder power.",
      benefits: ["Strengthens shoulders", "Builds obliques", "Improves stability"],
      keyPoints: [
        "From plank, roll to outer edge of right foot",
        "Left arm extends upward",
        "Stack shoulders",
        "Engage entire body",
        "Keep hips lifted"
      ],
      steps: [
        { title: "Plank position", detail: "Straight line from head to heels", hold: 1 },
        { title: "Roll to side", detail: "Stack feet or step back", hold: 1 },
        { title: "Raise arm", detail: "Left hand reaches toward sky", hold: 2 },
        { title: "Strong hold", detail: "Engage core and shoulders", hold: 10 }
      ],
      breathing: "Steady, powerful breaths",
      modifications: "Lower knee down",
      safetyTips: "Keep hips high",
      criticalJoints: ["shoulders", "wrists", "hips", "core"]
    },
    {
      id: "kingpigeon",
      name: "King Pigeon Pose",
      sanskrit: "Raja Eka Pada Rajakapotasana",
      difficulty: "Advanced",
      duration: 45,
      emoji: "🕊️",
      description: "A deep backbend and hip opener for advanced practitioners.",
      benefits: ["Massive hip opening", "Deep backbend", "Builds flexibility"],
      keyPoints: [
        "From pigeon, hands reach back",
        "Grab ankle or foot",
        "Chest lifts up",
        "Quad stretch deepens",
        "Breathe into sensation"
      ],
      steps: [
        { title: "Pigeon base", detail: "Left shin forward, right back", hold: 2 },
        { title: "Fold forward", detail: "Hands to ground, hinge hips", hold: 2 },
        { title: "Reach back", detail: "Hands toward back foot", hold: 2 },
        { title: "Deep expression", detail: "Bow forward or chest up", hold: 10 }
      ],
      breathing: "Deep hip breathing",
      modifications: "Stay in pigeon",
      safetyTips: "Go slowly, respect limits",
      criticalJoints: ["hips", "knees", "spine", "shoulders"]
    }
  ]
};

export class PoseLibrary {
  constructor() {
    this.poses = YOGA_POSES;
  }

  getPoseById(id) {
    for (const category of Object.values(this.poses)) {
      const pose = category.find(p => p.id === id);
      if (pose) return pose;
    }
    return null;
  }

  getPosesByDifficulty(difficulty) {
    return this.poses[difficulty] || [];
  }

  getAllPoses() {
    return Object.values(this.poses).flat();
  }

  getCategorized() {
    return this.poses;
  }

  getRandomPose(difficulty = null) {
    const poses = difficulty ? this.getPosesByDifficulty(difficulty) : this.getAllPoses();
    return poses[Math.floor(Math.random() * poses.length)];
  }

  searchPoses(query) {
    const q = query.toLowerCase();
    return this.getAllPoses().filter(
      p => p.name.toLowerCase().includes(q) || 
           p.sanskrit.toLowerCase().includes(q) ||
           p.description.toLowerCase().includes(q)
    );
  }
}

export default new PoseLibrary();
