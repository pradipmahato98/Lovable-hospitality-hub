import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adToBs, bsToAd, NEPALI_MONTHS, fromDateStr } from "@/utils/nepaliDate";

interface NepaliCalendarProps {
  selected?: string; // YYYY/MM/DD
  onSelect?: (date: string) => void;
  disableFuture?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const NEPALI_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function NepaliCalendar({ selected, onSelect, disableFuture, minDate, maxDate, className }: NepaliCalendarProps) {
  const todayBs = adToBs(new Date());

  const [currentDate, setCurrentDate] = React.useState(() => {
    if (selected && selected.match(/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/)) {
      const [y, m, d] = selected.split(/[/-]/).map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const [y, m, d] = todayBs.split(/[/-]/).map(Number);
    return { year: y, month: m - 1, day: d };
  });

  React.useEffect(() => {
    if (selected && selected.match(/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/)) {
      const [y, m, d] = selected.split(/[/-]/).map(Number);
      setCurrentDate({ year: y, month: m - 1, day: d });
    }
  }, [selected]);

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

  const getMonthDays = (year: number, month: number) => {
    // Access the raw data if available
    const data = (adToBs as any).bsMonthDays?.[year];
    if (data) return data[month];

    // Fallback logic if needed, but the utility should have the data
    return 30;
  };

  const daysInMonth = getMonthDays(currentDate.year, currentDate.month);

  // Refined day calculation using local time to avoid UTC shift
  const firstAdOfMonth = bsToAd(`${currentDate.year}/${(currentDate.month + 1).toString().padStart(2, '0')}/01`);
  const firstDayOfMonth = fromDateStr(firstAdOfMonth)?.getDay() ?? 0;

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.year}/${(currentDate.month + 1).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
    const isSelected = selected === dateStr;
    const isFuture = disableFuture && dateStr > todayBs;
    const isOutOfRange = (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate);

    const isToday = dateStr === todayBs;

    days.push(
      <Button
        key={d}
        variant="ghost"
        disabled={isFuture || isOutOfRange}
        className={cn(
          "h-9 w-9 p-0 font-normal",
          isToday && "bg-success text-success-foreground font-bold hover:bg-success/90 hover:text-success-foreground",
          isSelected && !isToday && "bg-amber-500 text-white hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white",
          isSelected && isToday && "ring-2 ring-amber-500 ring-offset-2",
          (isFuture || isOutOfRange) && "opacity-20 pointer-events-none"
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
