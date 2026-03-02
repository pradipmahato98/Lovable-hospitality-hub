import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adToBs, bsToAd } from "@/utils/nepaliDate";

interface NepaliCalendarProps {
  selected?: string; // YYYY/MM/DD
  onSelect?: (date: string) => void;
  disableFuture?: boolean;
  className?: string;
}

const NEPALI_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEPALI_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const bsMonthDays: Record<number, number[]> = {
  2070: [31, 31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2074: [31, 31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2078: [31, 31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [31, 31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

export function NepaliCalendar({ selected, onSelect, disableFuture, className }: NepaliCalendarProps) {
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
    const months = bsMonthDays[year] || bsMonthDays[2080];
    return months[month];
  };

  const daysInMonth = getMonthDays(currentDate.year, currentDate.month);

  // Refined day calculation
  const firstAdOfMonth = bsToAd(`${currentDate.year}/${(currentDate.month + 1).toString().padStart(2, '0')}/01`);
  const firstDayOfMonth = new Date(firstAdOfMonth).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.year}/${(currentDate.month + 1).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
    const isSelected = selected === dateStr;
    const isFuture = disableFuture && dateStr > todayBs;

    days.push(
      <Button
        key={d}
        variant="ghost"
        disabled={isFuture}
        className={cn(
          "h-9 w-9 p-0 font-normal",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          isFuture && "opacity-20 pointer-events-none"
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
