import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Plus, Users, Building2 } from "lucide-react";
import { useStaffSchedules } from "@/hooks/useHR";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export const ShiftScheduling = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: schedules, isLoading } = useStaffSchedules();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSchedulesForDay = (date: Date) => {
    return (schedules || []).filter((s) => isSameDay(new Date(s.shift_date), date));
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Shift Scheduling
            </CardTitle>
            <CardDescription>Manage and view employee work schedules</CardDescription>
          </div>
          <Button variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Shift
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week View Selector */}
        <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
            Previous Week
          </Button>
          <span className="font-semibold">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
            Next Week
          </Button>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const daySchedules = getSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`flex flex-col gap-2 p-3 rounded-lg border ${
                  isToday ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card/50"
                }`}
              >
                <div className="flex flex-col items-center border-b border-border/50 pb-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {format(day, "EEE")}
                  </span>
                  <span className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </span>
                </div>

                <div className="space-y-2 min-h-[100px]">
                  {isLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : daySchedules.length > 0 ? (
                    daySchedules.map((shift) => (
                      <div
                        key={shift.id}
                        className="p-2 rounded bg-secondary/50 border border-border text-[11px] space-y-1 hover:bg-secondary/80 transition-colors cursor-pointer"
                      >
                        <p className="font-bold truncate">
                          {shift.staff?.first_name} {shift.staff?.last_name}
                        </p>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{shift.shift_start.slice(0, 5)} - {shift.shift_end.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{shift.department}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[10px] text-muted-foreground italic">
                      No shifts
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend/Summary */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total Staff:</span>
            <span className="font-bold">{schedules?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-success">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span>Active Shifts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
