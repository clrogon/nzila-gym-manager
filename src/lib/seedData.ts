// src/lib/seedData.ts

export interface DisciplineRank {
  level: number;
  name: string;
  color: string;
  requirements: string;
}

export interface DisciplineSeed {
  name: string;
  description: string;
  category: string;
}

// =============================================================================
// DISCIPLINE CATEGORIES
// =============================================================================

export function getCategoryNames(): string[] {
  return [
    'Combat Sports / Martial Arts',
    'Strength & Conditioning',
    'Mind-Body Practices',
    'Cardiovascular Training',
    'Group Fitness Classes',
    'Aquatic Activities',
  ];
}

// =============================================================================
// ALL DISCIPLINES WITH DESCRIPTIONS
// =============================================================================

export function getAllDisciplines(): DisciplineSeed[] {
  return [
    // Combat Sports / Martial Arts
    {
      name: 'Brazilian Jiu-Jitsu',
      description: 'Ground fighting martial art focusing on grappling and submissions',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'Muay Thai',
      description: 'Traditional Thai martial art known as "Art of Eight Limbs"',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'Karate',
      description: 'Japanese martial art emphasizing striking techniques',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'Taekwondo',
      description: 'Korean martial art known for dynamic kicking techniques',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'Judo',
      description: 'Japanese martial art focusing on throws and takedowns',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'Boxing',
      description: 'Combat sport using punches in a regulated environment',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'Kickboxing',
      description: 'Stand-up combat sport combining punches and kicks',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'MMA',
      description: 'Mixed Martial Arts - Full contact combat sport',
      category: 'Combat Sports / Martial Arts',
    },
    {
      name: 'Wrestling',
      description: 'Grappling sport focusing on takedowns and control',
      category: 'Combat Sports / Martial Arts',
    },

    // Strength & Conditioning
    {
      name: 'Olympic Weightlifting',
      description: 'Competitive weightlifting with snatch and clean & jerk',
      category: 'Strength & Conditioning',
    },
    {
      name: 'Powerlifting',
      description: 'Strength sport with squat, bench press, and deadlift',
      category: 'Strength & Conditioning',
    },
    {
      name: 'CrossFit',
      description: 'High-intensity functional fitness training program',
      category: 'Strength & Conditioning',
    },
    {
      name: 'Bodybuilding',
      description: 'Physique development through resistance training and nutrition',
      category: 'Strength & Conditioning',
    },
    {
      name: 'Functional Fitness',
      description: 'Training for real-world movement patterns and daily activities',
      category: 'Strength & Conditioning',
    },
    {
      name: 'Strength Training',
      description: 'General resistance training for muscle development',
      category: 'Strength & Conditioning',
    },

    // Mind-Body Practices
    {
      name: 'Yoga',
      description: 'Ancient practice combining physical postures, breathing, and meditation',
      category: 'Mind-Body Practices',
    },
    {
      name: 'Pilates',
      description: 'Low-impact exercises focusing on core strength and flexibility',
      category: 'Mind-Body Practices',
    },
    {
      name: 'Tai Chi',
      description: 'Chinese martial art practiced for health and meditation',
      category: 'Mind-Body Practices',
    },
    {
      name: 'Meditation',
      description: 'Mindfulness and mental training practices',
      category: 'Mind-Body Practices',
    },

    // Cardiovascular Training
    {
      name: 'Running',
      description: 'Endurance training through running and jogging',
      category: 'Cardiovascular Training',
    },
    {
      name: 'Cycling',
      description: 'Indoor and outdoor cycling for cardiovascular fitness',
      category: 'Cardiovascular Training',
    },
    {
      name: 'Rowing',
      description: 'Full-body cardio workout using rowing machine or water',
      category: 'Cardiovascular Training',
    },
    {
      name: 'Jump Rope',
      description: 'High-intensity cardio using skipping rope',
      category: 'Cardiovascular Training',
    },

    // Group Fitness Classes
    {
      name: 'Zumba',
      description: 'Dance fitness program with Latin-inspired music',
      category: 'Group Fitness Classes',
    },
    {
      name: 'Spin',
      description: 'Indoor cycling class with music and motivation',
      category: 'Group Fitness Classes',
    },
    {
      name: 'HIIT',
      description: 'High-Intensity Interval Training for maximum calorie burn',
      category: 'Group Fitness Classes',
    },
    {
      name: 'Aerobics',
      description: 'Rhythmic exercise to music for cardiovascular fitness',
      category: 'Group Fitness Classes',
    },
    {
      name: 'Dance',
      description: 'Various dance styles for fitness and expression',
      category: 'Group Fitness Classes',
    },

    // Aquatic Activities
    {
      name: 'Swimming',
      description: 'Water-based exercise and competitive sport',
      category: 'Aquatic Activities',
    },
    {
      name: 'Water Polo',
      description: 'Team water sport combining swimming and ball handling',
      category: 'Aquatic Activities',
    },
    {
      name: 'Aqua Aerobics',
      description: 'Water-based group fitness class',
      category: 'Aquatic Activities',
    },
  ];
}

// =============================================================================
// RANKING SYSTEMS - CHECK IF DISCIPLINE HAS RANKS
// =============================================================================

export function hasBeltSystem(disciplineName: string): boolean {
  const disciplinesWithRanks = [
    // Combat Sports / Martial Arts
    'Brazilian Jiu-Jitsu',
    'Muay Thai',
    'Karate',
    'Taekwondo',
    'Judo',
    'Boxing',
    'Kickboxing',
    'MMA',
    'Wrestling',
    
    // Strength & Conditioning
    'Olympic Weightlifting',
    'Powerlifting',
    'CrossFit',
    'Bodybuilding',
    'Functional Fitness',
    
    // Mind-Body Practices
    'Yoga',
    'Pilates',
    'Tai Chi',
    
    // Cardiovascular Training
    'Running',
    'Cycling',
    'Rowing',
    
    // Group Fitness Classes
    'Zumba',
    'Spin',
    'HIIT',
    
    // Aquatic Activities
    'Swimming',
    'Water Polo',
  ];
  
  return disciplinesWithRanks.includes(disciplineName);
}

// =============================================================================
// GET RANKS FOR SPECIFIC DISCIPLINE
// =============================================================================

export function getDisciplineRanks(disciplineName: string): DisciplineRank[] {
  const ranksMap: Record<string, DisciplineRank[]> = {
    // ==========================================================================
    // COMBAT SPORTS / MARTIAL ARTS
    // ==========================================================================
    
    'Brazilian Jiu-Jitsu': [
      { level: 1, name: 'White Belt', color: '#FFFFFF', requirements: 'Beginner - Learn basic positions and escapes' },
      { level: 2, name: 'Blue Belt', color: '#0000FF', requirements: '1-2 years - Proficient in fundamental techniques' },
      { level: 3, name: 'Purple Belt', color: '#800080', requirements: '3-5 years - Advanced techniques and strategy' },
      { level: 4, name: 'Brown Belt', color: '#8B4513', requirements: '5-7 years - Refined skills, teaching ability' },
      { level: 5, name: 'Black Belt', color: '#000000', requirements: '8+ years - Mastery of fundamentals' },
      { level: 6, name: 'Black Belt 2nd Degree', color: '#000000', requirements: '3 years at black + significant contribution' },
      { level: 7, name: 'Black Belt 3rd Degree', color: '#000000', requirements: '5 years at 2nd degree' },
      { level: 8, name: 'Black Belt 4th Degree', color: '#000000', requirements: '7 years at 3rd degree' },
      { level: 9, name: 'Coral Belt (7th/8th Degree)', color: '#FF0000', requirements: '30+ years - Red and black' },
      { level: 10, name: 'Red Belt (9th/10th Degree)', color: '#FF0000', requirements: '50+ years - Pioneer level' },
    ],

    'Muay Thai': [
      { level: 1, name: 'White Prajioud', color: '#FFFFFF', requirements: 'Beginner - Basic stance and guards' },
      { level: 2, name: 'Yellow Prajioud', color: '#FFFF00', requirements: '6 months - Basic strikes and defense' },
      { level: 3, name: 'Yellow-Orange Prajioud', color: '#FFD700', requirements: '1 year - Combination techniques' },
      { level: 4, name: 'Orange Prajioud', color: '#FFA500', requirements: '18 months - Clinch work fundamentals' },
      { level: 5, name: 'Green Prajioud', color: '#00FF00', requirements: '2 years - Advanced combinations' },
      { level: 6, name: 'Blue Prajioud', color: '#0000FF', requirements: '3 years - Proficient in all ranges' },
      { level: 7, name: 'Purple Prajioud', color: '#800080', requirements: '4 years - Competition experience' },
      { level: 8, name: 'Brown Prajioud', color: '#8B4513', requirements: '5 years - Teaching ability' },
      { level: 9, name: 'Red Prajioud', color: '#FF0000', requirements: '7+ years - Advanced instructor' },
      { level: 10, name: 'Silver/Gold Prajioud', color: '#FFD700', requirements: '10+ years - Master level' },
    ],

    'Karate': [
      { level: 1, name: '10th Kyu (White Belt)', color: '#FFFFFF', requirements: 'Beginner - Basic stances and blocks' },
      { level: 2, name: '9th Kyu (Yellow Belt)', color: '#FFFF00', requirements: '3-6 months - Basic kata' },
      { level: 3, name: '8th Kyu (Orange Belt)', color: '#FFA500', requirements: '6-12 months - Intermediate techniques' },
      { level: 4, name: '7th Kyu (Green Belt)', color: '#00FF00', requirements: '1-1.5 years - Multiple kata' },
      { level: 5, name: '6th Kyu (Blue Belt)', color: '#0000FF', requirements: '1.5-2 years - Advanced basics' },
      { level: 6, name: '5th Kyu (Purple Belt)', color: '#800080', requirements: '2-2.5 years - Kumite proficiency' },
      { level: 7, name: '4th Kyu (Purple Belt II)', color: '#800080', requirements: '2.5-3 years - Refined techniques' },
      { level: 8, name: '3rd Kyu (Brown Belt)', color: '#8B4513', requirements: '3-3.5 years - Pre-black level' },
      { level: 9, name: '2nd Kyu (Brown Belt II)', color: '#8B4513', requirements: '3.5-4 years - Competition ready' },
      { level: 10, name: '1st Kyu (Brown Belt III)', color: '#8B4513', requirements: '4-5 years - Black belt preparation' },
      { level: 11, name: 'Shodan (1st Dan Black)', color: '#000000', requirements: '5+ years - Mastery begins' },
      { level: 12, name: 'Nidan (2nd Dan)', color: '#000000', requirements: '2 years at 1st Dan' },
      { level: 13, name: 'Sandan (3rd Dan)', color: '#000000', requirements: '3 years at 2nd Dan' },
      { level: 14, name: 'Yondan (4th Dan)', color: '#000000', requirements: '4 years at 3rd Dan' },
      { level: 15, name: 'Godan (5th Dan)', color: '#000000', requirements: '5+ years at 4th Dan - Master' },
    ],

    'Taekwondo': [
      { level: 1, name: '10th Geup (White)', color: '#FFFFFF', requirements: 'Beginner - Basic kicks and blocks' },
      { level: 2, name: '9th Geup (White-Yellow)', color: '#FFFACD', requirements: '2 months - Front kick mastery' },
      { level: 3, name: '8th Geup (Yellow)', color: '#FFFF00', requirements: '4 months - Taegeuk Il Jang' },
      { level: 4, name: '7th Geup (Yellow-Green)', color: '#9ACD32', requirements: '6 months - Turning kicks' },
      { level: 5, name: '6th Geup (Green)', color: '#00FF00', requirements: '8 months - Taegeuk Sam Jang' },
      { level: 6, name: '5th Geup (Green-Blue)', color: '#00CED1', requirements: '10 months - Sparring fundamentals' },
      { level: 7, name: '4th Geup (Blue)', color: '#0000FF', requirements: '12 months - Taegeuk Oh Jang' },
      { level: 8, name: '3rd Geup (Blue-Red)', color: '#8B008B', requirements: '15 months - Advanced combinations' },
      { level: 9, name: '2nd Geup (Red)', color: '#FF0000', requirements: '18 months - Taegeuk Chil Jang' },
      { level: 10, name: '1st Geup (Red-Black)', color: '#8B0000', requirements: '24 months - Black belt preparation' },
      { level: 11, name: '1st Dan (Black)', color: '#000000', requirements: '3+ years - Koryo poomsae' },
      { level: 12, name: '2nd Dan', color: '#000000', requirements: '2 years at 1st Dan' },
      { level: 13, name: '3rd Dan', color: '#000000', requirements: '3 years at 2nd Dan' },
      { level: 14, name: '4th Dan (Master)', color: '#000000', requirements: '4 years at 3rd Dan' },
      { level: 15, name: '5th Dan (Master)', color: '#000000', requirements: '5+ years at 4th Dan' },
    ],

    'Judo': [
      { level: 1, name: '6th Kyu (White)', color: '#FFFFFF', requirements: 'Beginner - Basic breakfalls (ukemi)' },
      { level: 2, name: '5th Kyu (Yellow)', color: '#FFFF00', requirements: '6 months - Basic throws' },
      { level: 3, name: '4th Kyu (Orange)', color: '#FFA500', requirements: '1 year - Proficient in ukemi' },
      { level: 4, name: '3rd Kyu (Green)', color: '#00FF00', requirements: '1.5 years - 10 throws mastered' },
      { level: 5, name: '2nd Kyu (Blue)', color: '#0000FF', requirements: '2 years - Newaza proficiency' },
      { level: 6, name: '1st Kyu (Brown)', color: '#8B4513', requirements: '3+ years - Pre-black level' },
      { level: 7, name: '1st Dan (Black)', color: '#000000', requirements: '4+ years - Shodan examination' },
      { level: 8, name: '2nd Dan', color: '#000000', requirements: '2 years at 1st Dan' },
      { level: 9, name: '3rd Dan', color: '#000000', requirements: '3 years at 2nd Dan' },
      { level: 10, name: '4th Dan', color: '#000000', requirements: '4 years at 3rd Dan' },
      { level: 11, name: '5th Dan', color: '#000000', requirements: '5 years at 4th Dan' },
      { level: 12, name: '6th Dan (Red/White)', color: '#FF0000', requirements: '6 years at 5th Dan' },
    ],

    'Boxing': [
      { level: 1, name: 'Novice', color: '#FFFFFF', requirements: 'Beginner - Basic stance and jab' },
      { level: 2, name: 'Beginner', color: '#FFFF00', requirements: '3 months - Basic combinations' },
      { level: 3, name: 'Intermediate I', color: '#FFA500', requirements: '6 months - Footwork fundamentals' },
      { level: 4, name: 'Intermediate II', color: '#00FF00', requirements: '1 year - Defense techniques' },
      { level: 5, name: 'Advanced I', color: '#0000FF', requirements: '1.5 years - Sparring experience' },
      { level: 6, name: 'Advanced II', color: '#800080', requirements: '2 years - Advanced combinations' },
      { level: 7, name: 'Competitor', color: '#8B4513', requirements: '3+ years - Amateur competition' },
      { level: 8, name: 'Elite Amateur', color: '#C0C0C0', requirements: '5+ years - Regional titles' },
      { level: 9, name: 'Professional', color: '#FFD700', requirements: 'Pro license - National level' },
      { level: 10, name: 'Champion', color: '#FF0000', requirements: 'Championship level' },
    ],

    'Kickboxing': [
      { level: 1, name: 'White Level', color: '#FFFFFF', requirements: 'Beginner - Basic strikes' },
      { level: 2, name: 'Yellow Level', color: '#FFFF00', requirements: '4 months - Kick fundamentals' },
      { level: 3, name: 'Orange Level', color: '#FFA500', requirements: '8 months - Combination work' },
      { level: 4, name: 'Green Level', color: '#00FF00', requirements: '1 year - Defense proficiency' },
      { level: 5, name: 'Blue Level', color: '#0000FF', requirements: '1.5 years - Sparring fundamentals' },
      { level: 6, name: 'Purple Level', color: '#800080', requirements: '2 years - Advanced techniques' },
      { level: 7, name: 'Brown Level', color: '#8B4513', requirements: '3 years - Competition ready' },
      { level: 8, name: 'Red Level', color: '#FF0000', requirements: '4 years - Advanced sparring' },
      { level: 9, name: 'Black Level I', color: '#000000', requirements: '5+ years - Instructor level' },
      { level: 10, name: 'Black Level II', color: '#000000', requirements: '7+ years - Master instructor' },
    ],

    'MMA': [
      { level: 1, name: 'Level 1 - White', color: '#FFFFFF', requirements: 'Beginner - All ranges introduction' },
      { level: 2, name: 'Level 2 - Grey', color: '#808080', requirements: '6 months - Basic grappling and striking' },
      { level: 3, name: 'Level 3 - Yellow', color: '#FFFF00', requirements: '1 year - Transitions between ranges' },
      { level: 4, name: 'Level 4 - Orange', color: '#FFA500', requirements: '1.5 years - Ground and pound' },
      { level: 5, name: 'Level 5 - Green', color: '#00FF00', requirements: '2 years - Submission defense' },
      { level: 6, name: 'Level 6 - Blue', color: '#0000FF', requirements: '3 years - Cage work proficiency' },
      { level: 7, name: 'Level 7 - Purple', color: '#800080', requirements: '4 years - Advanced game planning' },
      { level: 8, name: 'Level 8 - Brown', color: '#8B4513', requirements: '5 years - Amateur competition' },
      { level: 9, name: 'Level 9 - Red', color: '#FF0000', requirements: '6+ years - Professional level' },
      { level: 10, name: 'Level 10 - Black', color: '#000000', requirements: '8+ years - Elite competitor/coach' },
    ],

    'Wrestling': [
      { level: 1, name: 'Rookie', color: '#FFFFFF', requirements: 'Beginner - Basic stance and movement' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: '1 season - Basic takedowns' },
      { level: 3, name: 'Junior Varsity', color: '#FFA500', requirements: '2 seasons - Competition experience' },
      { level: 4, name: 'Varsity', color: '#00FF00', requirements: '3 seasons - Advanced techniques' },
      { level: 5, name: 'All-Conference', color: '#0000FF', requirements: '4 seasons - Regional success' },
      { level: 6, name: 'State Qualifier', color: '#800080', requirements: 'State tournament level' },
      { level: 7, name: 'State Placer', color: '#8B4513', requirements: 'Top 8 at state' },
      { level: 8, name: 'State Champion', color: '#FFD700', requirements: 'State title holder' },
      { level: 9, name: 'National Qualifier', color: '#C0C0C0', requirements: 'National tournament level' },
      { level: 10, name: 'National Champion', color: '#FF0000', requirements: 'National title holder' },
    ],

    // ==========================================================================
    // STRENGTH & CONDITIONING
    // ==========================================================================

    'Olympic Weightlifting': [
      { level: 1, name: 'Foundation', color: '#FFFFFF', requirements: 'Learn snatch and clean & jerk basics' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: 'Lift 60% bodyweight snatch, 80% C&J' },
      { level: 3, name: 'Intermediate I', color: '#FFA500', requirements: 'Lift 80% bodyweight snatch, 100% C&J' },
      { level: 4, name: 'Intermediate II', color: '#00FF00', requirements: 'Lift 90% bodyweight snatch, 115% C&J' },
      { level: 5, name: 'Advanced I', color: '#0000FF', requirements: 'Lift 100% bodyweight snatch, 130% C&J' },
      { level: 6, name: 'Advanced II', color: '#800080', requirements: 'Lift 110% bodyweight snatch, 140% C&J' },
      { level: 7, name: 'Competitor', color: '#8B4513', requirements: 'Local competition standards' },
      { level: 8, name: 'Elite', color: '#C0C0C0', requirements: 'National qualifying totals' },
      { level: 9, name: 'Master Class I', color: '#FFD700', requirements: 'International qualifying totals' },
      { level: 10, name: 'Master Class II', color: '#FF0000', requirements: 'World championship standards' },
    ],

    'Powerlifting': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Learn squat, bench, deadlift form' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: '200kg total (male) / 150kg (female)' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: '350kg total (male) / 200kg (female)' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: '500kg total (male) / 300kg (female)' },
      { level: 5, name: 'Class I', color: '#0000FF', requirements: '600kg total (male) / 350kg (female)' },
      { level: 6, name: 'Master', color: '#800080', requirements: '650kg total (male) / 400kg (female)' },
      { level: 7, name: 'Elite', color: '#8B4513', requirements: '700kg total (male) / 450kg (female)' },
      { level: 8, name: 'National Level', color: '#C0C0C0', requirements: 'National qualifying totals' },
      { level: 9, name: 'International', color: '#FFD700', requirements: 'International competition level' },
      { level: 10, name: 'World Class', color: '#FF0000', requirements: 'World record territory' },
    ],

    'CrossFit': [
      { level: 1, name: 'Foundations', color: '#FFFFFF', requirements: 'Learn 9 foundational movements' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: 'Scale all WODs, consistent attendance' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: 'Rx 50% of WODs' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: 'Rx 80% of WODs' },
      { level: 5, name: 'Athlete', color: '#0000FF', requirements: 'Rx all WODs, muscle-ups achieved' },
      { level: 6, name: 'Competitor', color: '#800080', requirements: 'Local competition participation' },
      { level: 7, name: 'Regional Qualifier', color: '#8B4513', requirements: 'CrossFit Open top 10% in region' },
      { level: 8, name: 'Regional Athlete', color: '#C0C0C0', requirements: 'Qualify for Regional competition' },
      { level: 9, name: 'Games Qualifier', color: '#FFD700', requirements: 'Qualify for CrossFit Games' },
      { level: 10, name: 'Elite', color: '#FF0000', requirements: 'CrossFit Games competitor' },
    ],

    'Bodybuilding': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Learn proper form and nutrition basics' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: '6 months consistent training' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: '1 year training, visible progress' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: '2 years training, aesthetic development' },
      { level: 5, name: 'Physique Competitor', color: '#0000FF', requirements: 'Competition preparation knowledge' },
      { level: 6, name: 'Local Competitor', color: '#800080', requirements: 'Local show participation' },
      { level: 7, name: 'Regional Competitor', color: '#8B4513', requirements: 'Regional show placement' },
      { level: 8, name: 'National Qualifier', color: '#C0C0C0', requirements: 'Qualify for national shows' },
      { level: 9, name: 'Professional', color: '#FFD700', requirements: 'IFBB Pro card or equivalent' },
      { level: 10, name: 'Elite Pro', color: '#FF0000', requirements: 'Mr. Olympia qualification level' },
    ],

    'Functional Fitness': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Movement screening passed' },
      { level: 2, name: 'Foundation', color: '#FFFF00', requirements: 'Basic movement patterns mastered' },
      { level: 3, name: 'Developing', color: '#FFA500', requirements: 'Unassisted bodyweight movements' },
      { level: 4, name: 'Proficient', color: '#00FF00', requirements: 'Loaded carries, complex movements' },
      { level: 5, name: 'Advanced', color: '#0000FF', requirements: 'Advanced gymnastics movements' },
      { level: 6, name: 'Athlete', color: '#800080', requirements: 'Sport-specific conditioning' },
      { level: 7, name: 'Competitor', color: '#8B4513', requirements: 'Competition-level fitness' },
      { level: 8, name: 'Elite', color: '#C0C0C0', requirements: 'Multiple disciplines mastered' },
      { level: 9, name: 'Master', color: '#FFD700', requirements: 'Teaching certification level' },
      { level: 10, name: 'Expert', color: '#FF0000', requirements: 'Coach certification, 5+ years' },
    ],

    // ==========================================================================
    // MIND-BODY PRACTICES
    // ==========================================================================

    'Yoga': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Introduction to basic asanas' },
      { level: 2, name: 'Foundation', color: '#FFFF00', requirements: '3 months practice, sun salutations' },
      { level: 3, name: 'Intermediate I', color: '#FFA500', requirements: '6 months practice, standing series' },
      { level: 4, name: 'Intermediate II', color: '#00FF00', requirements: '1 year practice, inversions introduced' },
      { level: 5, name: 'Advanced I', color: '#0000FF', requirements: '18 months practice, arm balances' },
      { level: 6, name: 'Advanced II', color: '#800080', requirements: '2 years practice, advanced inversions' },
      { level: 7, name: 'Practitioner', color: '#8B4513', requirements: '3+ years consistent practice' },
      { level: 8, name: 'Teacher Training (200hr)', color: '#C0C0C0', requirements: '200-hour YTT certification' },
      { level: 9, name: 'Advanced Teacher (500hr)', color: '#FFD700', requirements: '500-hour YTT certification' },
      { level: 10, name: 'Master Teacher', color: '#FF0000', requirements: '1000+ hours teaching experience' },
    ],

    'Pilates': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Introduction to principles' },
      { level: 2, name: 'Foundation', color: '#FFFF00', requirements: 'Mat work fundamentals (3 months)' },
      { level: 3, name: 'Intermediate I', color: '#FFA500', requirements: 'Reformer introduction (6 months)' },
      { level: 4, name: 'Intermediate II', color: '#00FF00', requirements: 'All apparatus basics (1 year)' },
      { level: 5, name: 'Advanced I', color: '#0000FF', requirements: 'Advanced mat and reformer (18 months)' },
      { level: 6, name: 'Advanced II', color: '#800080', requirements: 'Full apparatus proficiency (2 years)' },
      { level: 7, name: 'Practitioner', color: '#8B4513', requirements: 'Consistent practice 3+ years' },
      { level: 8, name: 'Teacher Training', color: '#C0C0C0', requirements: 'Comprehensive teacher training' },
      { level: 9, name: 'Certified Instructor', color: '#FFD700', requirements: 'Full certification + 500 teaching hours' },
      { level: 10, name: 'Master Instructor', color: '#FF0000', requirements: 'Advanced certification + 2000 hours' },
    ],

    'Tai Chi': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Basic stance and breathing' },
      { level: 2, name: 'Elementary', color: '#FFFF00', requirements: '6 months - 8-form sequence' },
      { level: 3, name: 'Intermediate I', color: '#FFA500', requirements: '1 year - 24-form Yang style' },
      { level: 4, name: 'Intermediate II', color: '#00FF00', requirements: '18 months - Push hands basics' },
      { level: 5, name: 'Advanced I', color: '#0000FF', requirements: '2 years - 42-form competition' },
      { level: 6, name: 'Advanced II', color: '#800080', requirements: '3 years - 108-form traditional' },
      { level: 7, name: 'Practitioner', color: '#8B4513', requirements: '4 years - Multiple styles' },
      { level: 8, name: 'Assistant Instructor', color: '#C0C0C0', requirements: '5 years - Teaching basics' },
      { level: 9, name: 'Certified Instructor', color: '#FFD700', requirements: '7+ years - Full certification' },
      { level: 10, name: 'Master', color: '#FF0000', requirements: '15+ years - Lineage certified' },
    ],

    // ==========================================================================
    // CARDIOVASCULAR TRAINING
    // ==========================================================================

    'Running': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Run/walk 1km continuously' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: 'Run 5km without stopping' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: '5km under 30 minutes' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: '10km under 60 minutes' },
      { level: 5, name: 'Competitor', color: '#0000FF', requirements: 'Half marathon completion' },
      { level: 6, name: 'Endurance Athlete', color: '#800080', requirements: 'Marathon completion' },
      { level: 7, name: 'Sub-4 Hour Marathoner', color: '#8B4513', requirements: 'Marathon under 4 hours' },
      { level: 8, name: 'Sub-3:30 Marathoner', color: '#C0C0C0', requirements: 'Marathon under 3:30' },
      { level: 9, name: 'Elite', color: '#FFD700', requirements: 'Boston Marathon qualifying time' },
      { level: 10, name: 'World Class', color: '#FF0000', requirements: 'Olympic trials standard' },
    ],

    'Cycling': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Comfortable riding 10km' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: 'Ride 30km comfortably' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: 'Ride 50km at 20km/h avg' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: 'Ride 100km (century)' },
      { level: 5, name: 'Enthusiast', color: '#0000FF', requirements: 'Regular 100km+ rides' },
      { level: 6, name: 'Competitor', color: '#800080', requirements: 'Local race participation' },
      { level: 7, name: 'Category 4/5', color: '#8B4513', requirements: 'Licensed racer, Cat 4/5' },
      { level: 8, name: 'Category 3', color: '#C0C0C0', requirements: 'Upgrade to Cat 3' },
      { level: 9, name: 'Category 1/2', color: '#FFD700', requirements: 'Elite amateur level' },
      { level: 10, name: 'Professional', color: '#FF0000', requirements: 'UCI professional license' },
    ],

    'Rowing': [
      { level: 1, name: 'Novice', color: '#FFFFFF', requirements: 'Learn proper technique, 2000m completion' },
      { level: 2, name: 'Beginner', color: '#FFFF00', requirements: '2000m under 10 minutes' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: '2000m under 8:30' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: '2000m under 7:30' },
      { level: 5, name: 'Competitor', color: '#0000FF', requirements: '2000m under 7:00 (male) / 8:00 (female)' },
      { level: 6, name: 'Club Racer', color: '#800080', requirements: 'Regular regatta participation' },
      { level: 7, name: 'Elite Amateur', color: '#8B4513', requirements: '2000m under 6:30 (male) / 7:30 (female)' },
      { level: 8, name: 'National Level', color: '#C0C0C0', requirements: 'National championship qualification' },
      { level: 9, name: 'International', color: '#FFD700', requirements: 'World championship standards' },
      { level: 10, name: 'World Class', color: '#FF0000', requirements: 'Olympic qualifying standards' },
    ],

    // ==========================================================================
    // GROUP FITNESS CLASSES
    // ==========================================================================

    'Zumba': [
      { level: 1, name: 'Participant', color: '#FFFFFF', requirements: 'Regular class attendance' },
      { level: 2, name: 'Enthusiast', color: '#FFFF00', requirements: '3 months consistent attendance' },
      { level: 3, name: 'Dedicated', color: '#FFA500', requirements: '6 months - Learn all basic steps' },
      { level: 4, name: 'Advanced Participant', color: '#00FF00', requirements: '1 year - Master complex choreography' },
      { level: 5, name: 'Instructor Training', color: '#0000FF', requirements: 'Zumba Basic 1 certification' },
      { level: 6, name: 'Licensed Instructor', color: '#800080', requirements: 'Full Zumba instructor license' },
      { level: 7, name: 'Certified Instructor', color: '#8B4513', requirements: '100+ classes taught' },
      { level: 8, name: 'Advanced Instructor', color: '#C0C0C0', requirements: 'Additional specialty certifications' },
      { level: 9, name: 'Master Instructor', color: '#FFD700', requirements: '500+ classes, ZES training' },
      { level: 10, name: 'Zumba Education Specialist', color: '#FF0000', requirements: 'ZES certification, train instructors' },
    ],

    'Spin': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Complete first 45-min class' },
      { level: 2, name: 'Regular', color: '#FFFF00', requirements: '3 months consistent attendance' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: 'Power zone training basics' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: 'FTP testing, structured training' },
      { level: 5, name: 'Enthusiast', color: '#0000FF', requirements: '1 year consistent training' },
      { level: 6, name: 'Instructor Candidate', color: '#800080', requirements: 'Instructor certification course' },
      { level: 7, name: 'Certified Instructor', color: '#8B4513', requirements: 'Spinning® certification' },
      { level: 8, name: 'Advanced Instructor', color: '#C0C0C0', requirements: '100+ classes taught' },
      { level: 9, name: 'Master Instructor', color: '#FFD700', requirements: 'Multiple certifications, 500+ classes' },
      { level: 10, name: 'Master Trainer', color: '#FF0000', requirements: 'Train other instructors' },
    ],

    'HIIT': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Complete modified HIIT class' },
      { level: 2, name: 'Intermediate', color: '#FFFF00', requirements: '1 month - Standard class completion' },
      { level: 3, name: 'Advanced', color: '#FFA500', requirements: '3 months - Rx all exercises' },
      { level: 4, name: 'Athlete', color: '#00FF00', requirements: '6 months - Advanced variations' },
      { level: 5, name: 'Elite', color: '#0000FF', requirements: '1 year - Competition-level intensity' },
      { level: 6, name: 'Instructor Trainee', color: '#800080', requirements: 'Group fitness certification' },
      { level: 7, name: 'Certified Instructor', color: '#8B4513', requirements: 'HIIT specialist certification' },
      { level: 8, name: 'Advanced Instructor', color: '#C0C0C0', requirements: '200+ classes taught' },
      { level: 9, name: 'Master Instructor', color: '#FFD700', requirements: 'Multiple specialties, 500+ classes' },
      { level: 10, name: 'Program Director', color: '#FF0000', requirements: 'Create programs, train instructors' },
    ],

    // ==========================================================================
    // AQUATIC ACTIVITIES
    // ==========================================================================

    'Swimming': [
      { level: 1, name: 'Water Safety', color: '#FFFFFF', requirements: 'Comfortable in water, basic floating' },
      { level: 2, name: 'Beginner', color: '#FFFF00', requirements: 'Swim 25m any stroke' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: 'Swim 100m freestyle' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: '4 strokes proficiency, 200m' },
      { level: 5, name: 'Swimmer', color: '#0000FF', requirements: 'Swim 500m continuously' },
      { level: 6, name: 'Competitive', color: '#800080', requirements: 'Meet participation, proper turns' },
      { level: 7, name: 'Club Level', color: '#8B4513', requirements: 'Regional qualifying times' },
      { level: 8, name: 'National Qualifier', color: '#C0C0C0', requirements: 'National championship times' },
      { level: 9, name: 'Elite', color: '#FFD700', requirements: 'Olympic trials consideration' },
      { level: 10, name: 'World Class', color: '#FF0000', requirements: 'International competition standards' },
    ],

    'Water Polo': [
      { level: 1, name: 'Beginner', color: '#FFFFFF', requirements: 'Strong swimming, treading water' },
      { level: 2, name: 'Novice', color: '#FFFF00', requirements: 'Basic ball handling and passing' },
      { level: 3, name: 'Intermediate', color: '#FFA500', requirements: '6 months - Eggbeater kick mastered' },
      { level: 4, name: 'Advanced', color: '#00FF00', requirements: '1 year - Position-specific skills' },
      { level: 5, name: 'Competitive', color: '#0000FF', requirements: 'League/tournament participation' },
      { level: 6, name: 'Club Player', color: '#800080', requirements: 'Competitive club team member' },
      { level: 7, name: 'Elite Amateur', color: '#8B4513', requirements: 'Regional/national tournaments' },
      { level: 8, name: 'Collegiate', color: '#C0C0C0', requirements: 'University team level' },
      { level: 9, name: 'National Team', color: '#FFD700', requirements: 'National team selection' },
      { level: 10, name: 'International', color: '#FF0000', requirements: 'Olympic/World Championship level' },
    ],
  };

  return ranksMap[disciplineName] || [];
}
