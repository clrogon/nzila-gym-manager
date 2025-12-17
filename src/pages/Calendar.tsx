import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, setHours } from "date-fns";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ClassItem {
  id: string;
  start_time: string;
  end_time: string;
  discipline_id: string;
  class_type: string;
  capacity: number;
}

interface BookingCount {
  class_id: string;
  count: number;
}

interface CalendarProps {
  weekStart: Date;
  disciplines: { id: string; name: string; color: string }[];
  filterDisciplineId?: string | null;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 → 21:00

export function Calendar({
  weekStart,
  disciplines,
  filterDisciplineId,
}: CalendarProps) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data: classData, error } = await supabase
        .from("classes")
        .select("*")
        .gte("start_time", weekStart.toISOString())
        .lt("start_time", addDays(weekStart, 7).toISOString());

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const classIds = classData.map((c) => c.id);

      const { data: bookings } = await supabase
        .from("class_bookings")
        .select("class_id")
        .in("class_id", classIds)
        .in("status", ["booked", "confirmed"]);

      if (cancelled) return;

      const counts: Record<string, number> = {};
      bookings?.forEach((b) => {
        counts[b.class_id] = (counts[b.class_id] || 0) + 1;
      });

      setClasses(classData);
      setBookingCounts(counts);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  function classIntersectsHour(
    cls: ClassItem,
    day: Date,
    hour: number
  ): boolean {
    const start = parseISO(cls.start_time);
    const end = parseISO(cls.end_time);

    if (!isSameDay(start, day)) return false;

    const hourStart = setHours(day, hour);
    const hourEnd = setHours(day, hour + 1);

    return start < hourEnd && end > hourStart;
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading classes…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-8 border rounded-lg overflow-hidden">
      {/* Time column */}
      <div className="border-r bg-muted/30">
        {HOURS.map((h) => (
          <div
            key={h}
            className="h-24 border-b px-2 text-sm text-muted-foreground flex items-start pt-1"
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {weekDays.map((day) => (
        <div key={day.toISOString()} className="border-r">
          <div className="text-center py-2 border-b font-medium bg-muted/20">
            {format(day, "EEE dd")}
          </div>

          {HOURS.map((hour) => {
            const hourClasses = classes.filter((c) => {
              if (filterDisciplineId && c.discipline_id !== filterDisciplineId)
                return false;
              return classIntersectsHour(c, day, hour);
            });

            return (
              <div key={hour} className="h-24 border-b relative">
                {hourClasses.map((c) => {
                  const discipline = disciplines.find(
                    (d) => d.id === c.discipline_id
                  );
                  const bookings = bookingCounts[c.id] || 0;

                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "absolute inset-1 rounded-md p-2 text-xs text-white shadow",
                        discipline?.color ?? "bg-gray-500"
                      )}
                    >
                      <div className="font-semibold truncate">
                        {discipline?.name ?? "Class"}
                      </div>
                      <div>
                        {bookings}/{c.capacity}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
