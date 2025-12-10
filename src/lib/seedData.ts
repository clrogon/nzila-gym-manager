// Default workout categories and disciplines for new gyms

export interface DisciplineSeed {
  name: string;
  description: string;
  category: string;
  equipment?: string;
  instructorProfile?: string;
}

export interface CategorySeed {
  name: string;
  description: string;
  equipment: string;
  instructorProfile: string;
  disciplines: string[];
}

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
