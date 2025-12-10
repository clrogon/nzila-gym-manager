import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleClassFromLibrary } from './ScheduleClassFromLibrary';
import { 
  DEFAULT_WORKOUT_CATEGORIES, 
  getCategoryNames, 
  getCategoryByName 
} from '@/lib/seedData';
import {
  Search,
  Dumbbell,
  Calendar,
  ListChecks,
  Activity,
  CalendarPlus,
} from 'lucide-react';

type LibraryTab = 'workouts' | 'classes' | 'exercises';

interface GymClass {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  default_duration: number | null;
  default_capacity: number | null;
  category: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Strength & Conditioning": "bg-red-500/10 text-red-600 border-red-500/20",
  "Cardiovascular Training": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "Group Fitness Classes": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  "Mind-Body Practices": "bg-green-500/10 text-green-600 border-green-500/20",
  "Combat Sports / Martial Arts": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Gymnastics / Movement Arts": "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  "Indoor Sports / Court-Based": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "Aquatic Activities": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  "Performance & Sport-Specific": "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "Special Population Training": "bg-teal-500/10 text-teal-600 border-teal-500/20",
};

const DEFAULT_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#6366F1', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

export function TrainingLibraryView() {
  const { currentGym } = useGym();
  const [activeTab, setActiveTab] = useState<LibraryTab>('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [gymClasses, setGymClasses] = useState<GymClass[]>([]);

  const categories = getCategoryNames();

  // Fetch gym classes from database
  useEffect(() => {
    if (currentGym?.id) {
      fetchGymClasses();
    }
  }, [currentGym?.id]);

  const fetchGymClasses = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('gym_classes')
      .select('*')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true);
    setGymClasses(data || []);
  };

  const getDataForTab = () => {
    const category = filterCategory === 'all' ? null : getCategoryByName(filterCategory);
    
    if (activeTab === 'workouts') {
      if (category) return category.workouts.map(w => ({ name: w, category: filterCategory }));
      return DEFAULT_WORKOUT_CATEGORIES.flatMap(c => c.workouts.map(w => ({ name: w, category: c.name })));
    }
    if (activeTab === 'classes') {
      // Combine seed data with gym classes
      const seedClasses = filterCategory === 'all' 
        ? DEFAULT_WORKOUT_CATEGORIES.flatMap(c => c.classes.map(cl => ({ 
            name: cl, 
            category: c.name,
            isGymClass: false,
            gymClass: null as GymClass | null,
          })))
        : (category?.classes || []).map(cl => ({ 
            name: cl, 
            category: filterCategory,
            isGymClass: false,
            gymClass: null as GymClass | null,
          }));

      // Check if gym has these classes stored
      return seedClasses.map(sc => {
        const gymClass = gymClasses.find(gc => gc.name === sc.name);
        return {
          ...sc,
          isGymClass: !!gymClass,
          gymClass: gymClass || {
            id: '',
            name: sc.name,
            description: null,
            color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
            default_duration: 60,
            default_capacity: 20,
            category: sc.category,
          },
        };
      });
    }
    if (activeTab === 'exercises') {
      if (category) return category.exercises.map(e => ({ name: e, category: filterCategory }));
      return DEFAULT_WORKOUT_CATEGORIES.flatMap(c => c.exercises.map(e => ({ name: e, category: c.name })));
    }
    return [];
  };

  const data = getDataForTab();
  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedData = filteredData.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof filteredData>);

  const stats = {
    workouts: DEFAULT_WORKOUT_CATEGORIES.reduce((sum, c) => sum + c.workouts.length, 0),
    classes: DEFAULT_WORKOUT_CATEGORIES.reduce((sum, c) => sum + c.classes.length, 0),
    exercises: DEFAULT_WORKOUT_CATEGORIES.reduce((sum, c) => sum + c.exercises.length, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.workouts}</p>
                <p className="text-sm text-muted-foreground">Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.classes}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ListChecks className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.exercises}</p>
                <p className="text-sm text-muted-foreground">Exercises</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LibraryTab)}>
        <TabsList>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Exercises
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <TabsContent value={activeTab} className="mt-4">
          {Object.keys(groupedData).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No {activeTab} found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedData).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge className={CATEGORY_COLORS[category] || "bg-muted"} variant="outline">
                        {category}
                      </Badge>
                      <span className="text-sm font-normal text-muted-foreground">
                        ({items.length} {activeTab})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'classes' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((item: any, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <span className="font-medium text-sm">{item.name}</span>
                            <ScheduleClassFromLibrary
                              gymClass={item.gymClass || {
                                id: '',
                                name: item.name,
                                description: null,
                                color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                                default_duration: 60,
                                default_capacity: 20,
                                category: item.category,
                              }}
                              trigger={
                                <Button size="sm" variant="ghost" className="h-8">
                                  <CalendarPlus className="w-4 h-4 mr-1" />
                                  Schedule
                                </Button>
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {items.map((item: any, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
