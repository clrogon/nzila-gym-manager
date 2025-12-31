import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Flame, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';

interface CheckIn {
  checked_in_at: string;
}

interface MemberActivityHeatmapProps {
  checkIns: CheckIn[];
  daysToShow?: number;
}

export default function MemberActivityHeatmap({ 
  checkIns, 
  daysToShow = 90 
}: MemberActivityHeatmapProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, daysToShow - 1),
      end: now,
    });

    const checkInDates = checkIns.map(ci => new Date(ci.checked_in_at));
    
    const heatmapData = days.map(day => {
      const count = checkInDates.filter(ciDate => isSameDay(ciDate, day)).length;
      return { date: day, count };
    });

    // Calculate streak
    let currentStreak = 0;
    for (let i = heatmapData.length - 1; i >= 0; i--) {
      if (heatmapData[i].count > 0) {
        currentStreak++;
      } else if (i < heatmapData.length - 1) {
        break;
      }
    }

    // This month's check-ins
    const thisMonth = now.getMonth();
    const thisMonthCheckIns = checkInDates.filter(d => d.getMonth() === thisMonth).length;

    return {
      heatmapData,
      currentStreak,
      thisMonthCheckIns,
      totalDays: checkInDates.length,
    };
  }, [checkIns, daysToShow]);

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/30';
    if (count === 2) return 'bg-primary/60';
    return 'bg-primary';
  };

  // Group by weeks for display
  const weeks = useMemo(() => {
    const result: typeof stats.heatmapData[] = [];
    for (let i = 0; i < stats.heatmapData.length; i += 7) {
      result.push(stats.heatmapData.slice(i, i + 7));
    }
    return result;
  }, [stats.heatmapData]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          Atividade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
              <Flame className="w-5 h-5" />
              {stats.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">Dias seguidos</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.thisMonthCheckIns}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalDays}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1 min-w-max">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`w-3 h-3 rounded-sm ${getIntensity(day.count)}`}
                    title={`${format(day.date, 'dd MMM yyyy', { locale: pt })}: ${day.count} check-in(s)`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}
