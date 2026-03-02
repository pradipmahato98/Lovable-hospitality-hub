import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NepaliCalendarProps {
  selected?: string; // YYYY/MM/DD
  onSelect?: (date: string) => void;
  className?: string;
}

const NEPALI_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEPALI_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function NepaliCalendar({ selected, onSelect, className }: NepaliCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(() => {
    if (selected) {
      const [y, m, d] = selected.split(/[/-]/).map(Number);
      return { year: y, month: m - 1, day: d };
    }
    // Default to a reasonable BS year (approx 2080)
    return { year: 2080, month: 0, day: 1 };
  });

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      let newMonth = prev.month - 1;
      let newYear = prev.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      return { ...prev, year: newYear, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      let newMonth = prev.month + 1;
      let newYear = prev.year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      return { ...prev, year: newYear, month: newMonth };
    });
  };

  // Simplified month lengths for BS (varies in reality)
  const getMonthDays = (year: number, month: number) => {
    // In reality, BS months are 29 to 32 days.
    // This is a placeholder logic.
    if ([0, 1, 2].includes(month)) return 31;
    if ([3, 4, 5].includes(month)) return 32;
    return 30;
  };

  const daysInMonth = getMonthDays(currentDate.year, currentDate.month);

  // Simplified: assume 1st of month starts on a certain day based on year/month
  const firstDayOfMonth = (currentDate.year + currentDate.month) % 7;

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.year}/${(currentDate.month + 1).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
    const isSelected = selected === dateStr;

    days.push(
      <Button
        key={d}
        variant="ghost"
        className={cn(
          "h-9 w-9 p-0 font-normal",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
        )}
        onClick={() => onSelect?.(dateStr)}
      >
        {d}
      </Button>
    );
  }

  return (
    <div className={cn("p-3 w-[280px]", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {NEPALI_MONTHS[currentDate.month]} {currentDate.year}
        </div>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {NEPALI_DAYS.map(day => (
          <div key={day} className="text-muted-foreground text-[0.8rem] font-normal w-9">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
