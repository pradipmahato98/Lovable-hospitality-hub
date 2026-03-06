import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { bsMonthDays, NEPALI_MONTHS, adToBs } from "@/utils/nepaliDate";

interface NepaliCalendarProps {
  selected?: string;
  onSelect?: (bsDate: string) => void;
  className?: string;
  disableFuture?: boolean;
  minDate?: string;
  maxDate?: string;
}

export function NepaliCalendar({
  selected,
  onSelect,
  className,
  disableFuture = false,
  minDate,
  maxDate,
}: NepaliCalendarProps) {
  const todayAd = new Date();
  const todayBs = adToBs(todayAd);

  const [currentYear, setCurrentYear] = React.useState(selected ? parseInt(selected.split('/')[0]) : parseInt(todayBs.split('/')[0]));
  const [currentMonth, setCurrentMonth] = React.useState(selected ? parseInt(selected.split('/')[1]) - 1 : parseInt(todayBs.split('/')[1]) - 1);

  const daysInMonth = bsMonthDays[currentYear]?.[currentMonth] || 30;
  const firstDayOfMonth = (currentYear + currentMonth) % 7;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (day: number) => {
    const [ty, tm, td] = todayBs.split('/').map(Number);
    return day === td && currentMonth === tm - 1 && currentYear === ty;
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    const [y, m, d] = selected.split('/').map(Number);
    return y === currentYear && m === currentMonth + 1 && d === day;
  };

  return (
    <div className={cn("p-3 bg-card border rounded-md shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">
          {NEPALI_MONTHS[currentMonth]} {currentYear}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-[10px] font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isCurrentToday = isToday(day);
          const isCurrentSelected = isSelected(day);
          const dateStr = `${currentYear}/${(currentMonth + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;

          return (
            <Button
              key={day}
              variant="ghost"
              size="sm"
              onClick={() => onSelect?.(dateStr)}
              className={cn(
                "h-8 w-8 p-0 text-xs font-normal",
                isCurrentToday && "bg-success text-success-foreground hover:bg-success hover:text-success-foreground",
                isCurrentSelected && "bg-amber-500 text-white hover:bg-amber-600 hover:text-white"
              )}
            >
              {day}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
