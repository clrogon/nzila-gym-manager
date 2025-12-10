// Default workout categories and disciplines for new gyms

export interface DisciplineSeed {
  name: string;
  description: string;
  category: string;
  equipment?: string;
  instructorProfile?: string;
}

export interface RankSeed {
  name: string;
  level: number;
  color: string;
  requirements?: string;
}

export interface CategorySeed {
  name: string;
  description: string;
  equipment: string;
  instructorProfile: string;
  disciplines: string[];
}

// Belt/Rank systems for martial arts disciplines
export const DISCIPLINE_RANKS: Record<string, RankSeed[]> = {
  "BJJ Gi": [
    { name: "White Belt", level: 1, color: "#FFFFFF", requirements: "Beginner level" },
    { name: "Blue Belt", level: 2, color: "#1E40AF", requirements: "2+ years training, basic positions and submissions" },
    { name: "Purple Belt", level: 3, color: "#7C3AED", requirements: "5+ years training, intermediate techniques" },
    { name: "Brown Belt", level: 4, color: "#78350F", requirements: "7+ years training, advanced techniques" },
    { name: "Black Belt", level: 5, color: "#000000", requirements: "10+ years training, mastery level" },
  ],
  "BJJ No-Gi": [
    { name: "White Belt", level: 1, color: "#FFFFFF", requirements: "Beginner level" },
    { name: "Blue Belt", level: 2, color: "#1E40AF", requirements: "2+ years training" },
    { name: "Purple Belt", level: 3, color: "#7C3AED", requirements: "5+ years training" },
    { name: "Brown Belt", level: 4, color: "#78350F", requirements: "7+ years training" },
    { name: "Black Belt", level: 5, color: "#000000", requirements: "10+ years training" },
  ],
  "Judo": [
    { name: "White Belt (6th Kyu)", level: 1, color: "#FFFFFF", requirements: "Beginner" },
    { name: "Yellow Belt (5th Kyu)", level: 2, color: "#FCD34D", requirements: "Basic throws and pins" },
    { name: "Orange Belt (4th Kyu)", level: 3, color: "#F97316", requirements: "Intermediate throws" },
    { name: "Green Belt (3rd Kyu)", level: 4, color: "#22C55E", requirements: "Advanced throws and combinations" },
    { name: "Blue Belt (2nd Kyu)", level: 5, color: "#3B82F6", requirements: "Competition level" },
    { name: "Brown Belt (1st Kyu)", level: 6, color: "#78350F", requirements: "Pre-black belt" },
    { name: "Black Belt (1st Dan)", level: 7, color: "#000000", requirements: "Dan grade" },
  ],
  "Boxing": [
    { name: "Novice", level: 1, color: "#FFFFFF", requirements: "0-6 months training" },
    { name: "Intermediate", level: 2, color: "#FCD34D", requirements: "6-18 months training" },
    { name: "Advanced", level: 3, color: "#F97316", requirements: "18+ months, sparring experience" },
    { name: "Competition Ready", level: 4, color: "#22C55E", requirements: "Amateur competition level" },
    { name: "Elite", level: 5, color: "#000000", requirements: "Professional/Elite amateur level" },
  ],
  "Muay Thai": [
    { name: "White Prajiad", level: 1, color: "#FFFFFF", requirements: "Beginner" },
    { name: "Yellow Prajiad", level: 2, color: "#FCD34D", requirements: "Basic techniques" },
    { name: "Orange Prajiad", level: 3, color: "#F97316", requirements: "Intermediate" },
    { name: "Green Prajiad", level: 4, color: "#22C55E", requirements: "Advanced" },
    { name: "Blue Prajiad", level: 5, color: "#3B82F6", requirements: "Expert" },
    { name: "Brown Prajiad", level: 6, color: "#78350F", requirements: "Instructor level" },
    { name: "Black Prajiad", level: 7, color: "#000000", requirements: "Master" },
  ],
  "Kickboxing": [
    { name: "White Belt", level: 1, color: "#FFFFFF", requirements: "Beginner" },
    { name: "Yellow Belt", level: 2, color: "#FCD34D", requirements: "Basic kicks and punches" },
    { name: "Orange Belt", level: 3, color: "#F97316", requirements: "Combinations" },
    { name: "Green Belt", level: 4, color: "#22C55E", requirements: "Sparring" },
    { name: "Blue Belt", level: 5, color: "#3B82F6", requirements: "Competition" },
    { name: "Brown Belt", level: 6, color: "#78350F", requirements: "Advanced" },
    { name: "Black Belt", level: 7, color: "#000000", requirements: "Expert" },
  ],
  "Krav Maga": [
    { name: "Practitioner 1 (P1)", level: 1, color: "#FFFFFF", requirements: "Basic self-defense" },
    { name: "Practitioner 2 (P2)", level: 2, color: "#FCD34D", requirements: "Intermediate" },
    { name: "Practitioner 3 (P3)", level: 3, color: "#F97316", requirements: "Advanced defense" },
    { name: "Practitioner 4 (P4)", level: 4, color: "#22C55E", requirements: "Expert" },
    { name: "Practitioner 5 (P5)", level: 5, color: "#3B82F6", requirements: "Instructor candidate" },
    { name: "Graduate 1 (G1)", level: 6, color: "#78350F", requirements: "Graduate level" },
    { name: "Expert (E1)", level: 7, color: "#000000", requirements: "Expert instructor" },
  ],
  "Wrestling": [
    { name: "Novice", level: 1, color: "#FFFFFF", requirements: "Beginner" },
    { name: "Intermediate", level: 2, color: "#FCD34D", requirements: "Basic takedowns" },
    { name: "Advanced", level: 3, color: "#F97316", requirements: "Competition experience" },
    { name: "Varsity", level: 4, color: "#22C55E", requirements: "Team level" },
    { name: "Elite", level: 5, color: "#000000", requirements: "National level" },
  ],
  "MMA": [
    { name: "White", level: 1, color: "#FFFFFF", requirements: "Beginner" },
    { name: "Yellow", level: 2, color: "#FCD34D", requirements: "Fundamentals" },
    { name: "Orange", level: 3, color: "#F97316", requirements: "Intermediate" },
    { name: "Green", level: 4, color: "#22C55E", requirements: "Advanced" },
    { name: "Blue", level: 5, color: "#3B82F6", requirements: "Competition ready" },
    { name: "Purple", level: 6, color: "#7C3AED", requirements: "Professional level" },
    { name: "Brown", level: 7, color: "#78350F", requirements: "Expert" },
    { name: "Black", level: 8, color: "#000000", requirements: "Master" },
  ],
};

// Polymorphic WOD input configurations based on category
export interface WodFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'time' | 'distance';
  placeholder?: string;
  options?: string[];
  unit?: string;
}

export const CATEGORY_WOD_FIELDS: Record<string, WodFieldConfig[]> = {
  "Strength & Conditioning": [
    { name: 'exercise', label: 'Exercise', type: 'text', placeholder: 'e.g., Back Squat' },
    { name: 'sets', label: 'Sets', type: 'number', placeholder: '5' },
    { name: 'reps', label: 'Reps', type: 'text', placeholder: '5 or 8-12' },
    { name: 'weight', label: 'Weight', type: 'text', placeholder: '100kg or 70%' },
    { name: 'rest', label: 'Rest', type: 'text', placeholder: '90s' },
  ],
  "Cardiovascular Training": [
    { name: 'exercise', label: 'Exercise', type: 'text', placeholder: 'e.g., Treadmill Run' },
    { name: 'duration', label: 'Duration', type: 'time', placeholder: '30:00' },
    { name: 'distance', label: 'Distance', type: 'distance', unit: 'km', placeholder: '5' },
    { name: 'pace', label: 'Target Pace', type: 'text', placeholder: '6:00/km' },
    { name: 'intensity', label: 'Intensity', type: 'select', options: ['Low', 'Moderate', 'High', 'Interval'] },
  ],
  "Group Fitness Classes": [
    { name: 'exercise', label: 'Movement', type: 'text', placeholder: 'e.g., Burpees' },
    { name: 'duration', label: 'Duration', type: 'time', placeholder: '45s' },
    { name: 'reps', label: 'Reps', type: 'text', placeholder: '15 or AMRAP' },
    { name: 'rest', label: 'Rest', type: 'text', placeholder: '15s' },
  ],
  "Mind-Body Practices": [
    { name: 'pose', label: 'Pose/Movement', type: 'text', placeholder: 'e.g., Downward Dog' },
    { name: 'duration', label: 'Hold Time', type: 'time', placeholder: '30s' },
    { name: 'breaths', label: 'Breaths', type: 'number', placeholder: '5' },
    { name: 'side', label: 'Side', type: 'select', options: ['Both', 'Left', 'Right', 'Alternate'] },
  ],
  "Combat Sports / Martial Arts": [
    { name: 'technique', label: 'Technique', type: 'text', placeholder: 'e.g., Jab-Cross Combo' },
    { name: 'rounds', label: 'Rounds', type: 'number', placeholder: '3' },
    { name: 'duration', label: 'Round Duration', type: 'time', placeholder: '3:00' },
    { name: 'rest', label: 'Rest Between', type: 'text', placeholder: '1:00' },
    { name: 'intensity', label: 'Intensity', type: 'select', options: ['Technical', 'Light Sparring', 'Hard Sparring', 'Competition'] },
  ],
  "Gymnastics / Movement Arts": [
    { name: 'skill', label: 'Skill', type: 'text', placeholder: 'e.g., Handstand Hold' },
    { name: 'sets', label: 'Sets', type: 'number', placeholder: '5' },
    { name: 'reps', label: 'Reps/Time', type: 'text', placeholder: '30s or 5 reps' },
    { name: 'rest', label: 'Rest', type: 'text', placeholder: '90s' },
    { name: 'progression', label: 'Progression', type: 'select', options: ['Assisted', 'Partial', 'Full', 'Advanced'] },
  ],
  "Indoor Sports / Court-Based": [
    { name: 'drill', label: 'Drill', type: 'text', placeholder: 'e.g., 3-Point Shooting' },
    { name: 'duration', label: 'Duration', type: 'time', placeholder: '10:00' },
    { name: 'reps', label: 'Reps/Attempts', type: 'number', placeholder: '20' },
    { name: 'focus', label: 'Focus Area', type: 'select', options: ['Technique', 'Speed', 'Endurance', 'Game Simulation'] },
  ],
  "Aquatic Activities": [
    { name: 'stroke', label: 'Stroke', type: 'select', options: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Mixed'] },
    { name: 'distance', label: 'Distance', type: 'distance', unit: 'm', placeholder: '100' },
    { name: 'sets', label: 'Sets', type: 'number', placeholder: '4' },
    { name: 'targetTime', label: 'Target Time', type: 'time', placeholder: '1:30' },
    { name: 'rest', label: 'Rest', type: 'text', placeholder: '30s' },
  ],
  "Performance & Sport-Specific": [
    { name: 'exercise', label: 'Exercise', type: 'text', placeholder: 'e.g., Box Jumps' },
    { name: 'sets', label: 'Sets', type: 'number', placeholder: '4' },
    { name: 'reps', label: 'Reps', type: 'text', placeholder: '6' },
    { name: 'rest', label: 'Rest', type: 'text', placeholder: '2:00' },
    { name: 'focus', label: 'Focus', type: 'select', options: ['Power', 'Speed', 'Agility', 'Endurance', 'Recovery'] },
  ],
  "Special Population Training": [
    { name: 'exercise', label: 'Exercise', type: 'text', placeholder: 'e.g., Chair Squats' },
    { name: 'sets', label: 'Sets', type: 'number', placeholder: '2' },
    { name: 'reps', label: 'Reps', type: 'text', placeholder: '10' },
    { name: 'modification', label: 'Modification', type: 'select', options: ['Assisted', 'Seated', 'Standing', 'Supported'] },
    { name: 'notes', label: 'Safety Notes', type: 'text', placeholder: 'Any precautions' },
  ],
};

export const DEFAULT_WORKOUT_CATEGORIES: CategorySeed[] = [
  {
    name: "Strength & Conditioning",
    description: "Training focused on strength, muscle development, functional capacity, and overall conditioning.",
    equipment: "Barbells, dumbbells, kettlebells, racks, benches, TRX, sleds, rigs.",
    instructorProfile: "Certified strength coach, PT, functional trainer.",
    disciplines: [
      "Barbell Weightlifting",
      "Olympic Lifting",
      "Functional Training",
      "Kettlebell Training",
      "Powerbuilding",
      "Bodybuilding",
      "TRX Training",
      "Strongman"
    ]
  },
  {
    name: "Cardiovascular Training",
    description: "Aerobic and anaerobic conditioning focused on endurance and fat loss.",
    equipment: "Treadmills, bikes, ellipticals, air bikes, rowers, SkiErg, stair steppers.",
    instructorProfile: "Cardio specialist, conditioning coach.",
    disciplines: [
      "Treadmill Endurance",
      "HIIT Treadmill",
      "Indoor Cycling/Spin",
      "Rowing Endurance",
      "SkiErg Programs",
      "Stair Climber Workouts",
      "Low-Impact Elliptical",
      "Air Bike MetCon",
      "Fat-Burning Cardio"
    ]
  },
  {
    name: "Group Fitness Classes",
    description: "High-energy classes promoting community, rhythm, and calorie burn.",
    equipment: "Studio space, sound system, steps, light weights, mats.",
    instructorProfile: "Group fitness instructor, dance fitness trainer.",
    disciplines: [
      "Aerobics",
      "Step",
      "Zumba",
      "Afro-Fusion",
      "Kuduro Fitness",
      "Dancehall",
      "Bootcamp",
      "Circuit HIIT",
      "Pound Fitness",
      "BodyPump",
      "Stretch & Tone"
    ]
  },
  {
    name: "Mind-Body Practices",
    description: "Flexibility, mindfulness, posture, and core control.",
    equipment: "Yoga mats, blocks, straps, Pilates reformer (optional).",
    instructorProfile: "Yoga instructor, Pilates coach, mobility specialist.",
    disciplines: [
      "Hatha Yoga",
      "Vinyasa Yoga",
      "Power Yoga",
      "Yin Yoga",
      "Restorative Yoga",
      "Pilates Mat",
      "Pilates Reformer",
      "Breathwork",
      "Mobility Workshop",
      "Flexibility Class",
      "Posture Correction",
      "Meditation",
      "Balance & Core Stability"
    ]
  },
  {
    name: "Combat Sports / Martial Arts",
    description: "Combat systems for discipline, fitness, and self-defense.",
    equipment: "Boxing bags, gloves, mats, pads, tatami.",
    instructorProfile: "Boxing coach, Muay Thai instructor, BJJ belt, MMA coach.",
    disciplines: [
      "Boxing",
      "Muay Thai",
      "Kickboxing",
      "BJJ Gi",
      "BJJ No-Gi",
      "MMA",
      "Wrestling",
      "Judo",
      "Krav Maga",
      "Self-Defense",
      "Kids Martial Arts"
    ]
  },
  {
    name: "Gymnastics / Movement Arts",
    description: "Body control, acrobatics, calisthenics, expressive movement.",
    equipment: "Bars, rings, parallettes, mats, floor space.",
    instructorProfile: "Calisthenics coach, gymnastics instructor, movement coach.",
    disciplines: [
      "Calisthenics Foundations",
      "Static Strength",
      "Handstand Training",
      "Rings Training",
      "Parallette Skills",
      "Basic Acrobatics",
      "Rhythmic Movement",
      "Animal Flow",
      "Movement Flow",
      "Parkour Basics"
    ]
  },
  {
    name: "Indoor Sports / Court-Based",
    description: "Recreational or competitive court sports.",
    equipment: "Basketball hoops, futsal goals, volleyball nets, padel courts, badminton nets.",
    instructorProfile: "Sports coach (basketball, futsal, volleyball, padel).",
    disciplines: [
      "Basketball",
      "Futsal",
      "Volleyball",
      "Padel",
      "Badminton",
      "Table Tennis",
      "Recreational Leagues",
      "Court Rentals",
      "Mini-Tournaments"
    ]
  },
  {
    name: "Aquatic Activities",
    description: "Water-based fitness, rehabilitation, sport performance.",
    equipment: "Pool, aqua equipment (boards, noodles, buoys).",
    instructorProfile: "Swimming coach, lifeguard, hydrotherapy specialist.",
    disciplines: [
      "Learn-to-Swim",
      "Competitive Swim Training",
      "Lap Swimming",
      "Aqua Aerobics",
      "Aqua Strength",
      "Hydrotherapy",
      "Water Confidence",
      "Lifesaving Workshops"
    ]
  },
  {
    name: "Performance & Sport-Specific",
    description: "Strength, speed, agility, and injury prevention for athletes.",
    equipment: "Sleds, cones, ladders, timing gates, plyo boxes.",
    instructorProfile: "Performance coach, sports scientist, physiotherapist.",
    disciplines: [
      "Speed Mechanics",
      "Agility Training",
      "Change of Direction",
      "Plyometrics",
      "Strength for Sport",
      "Athletic Conditioning",
      "Vertical Jump Training",
      "Movement Screening",
      "Injury Prevention Programs"
    ]
  },
  {
    name: "Special Population Training",
    description: "Safe training for specific/vulnerable groups.",
    equipment: "Low-impact machines, mats, light weights, balance tools.",
    instructorProfile: "Senior fitness specialist, prenatal coach, physio.",
    disciplines: [
      "Senior Mobility",
      "Low-Impact Strength",
      "Kids Fitness",
      "Youth Agility",
      "Prenatal Fitness",
      "Postpartum Recovery",
      "Rehab Support",
      "Obesity Workout Programs",
      "Adaptive Training"
    ]
  }
];

// Flatten disciplines for easy insertion
export const getAllDisciplines = (): DisciplineSeed[] => {
  const disciplines: DisciplineSeed[] = [];
  
  DEFAULT_WORKOUT_CATEGORIES.forEach(category => {
    category.disciplines.forEach(disciplineName => {
      disciplines.push({
        name: disciplineName,
        description: `${disciplineName} - ${category.description}`,
        category: category.name,
        equipment: category.equipment,
        instructorProfile: category.instructorProfile
      });
    });
  });
  
  return disciplines;
};

// Get unique category names
export const getCategoryNames = (): string[] => {
  return DEFAULT_WORKOUT_CATEGORIES.map(cat => cat.name);
};

// Check if discipline has a belt/rank system
export const hasBeltSystem = (disciplineName: string): boolean => {
  return Object.keys(DISCIPLINE_RANKS).includes(disciplineName);
};

// Get ranks for a discipline
export const getDisciplineRanks = (disciplineName: string): RankSeed[] => {
  return DISCIPLINE_RANKS[disciplineName] || [];
};

// Get WOD fields for a category
export const getWodFieldsForCategory = (categoryName: string): WodFieldConfig[] => {
  return CATEGORY_WOD_FIELDS[categoryName] || CATEGORY_WOD_FIELDS["Strength & Conditioning"];
};
