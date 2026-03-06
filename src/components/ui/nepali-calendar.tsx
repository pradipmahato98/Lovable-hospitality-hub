import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  adToBs,
  bsToAd,
  BS_MONTH_NAMES,
  BS_DAY_NAMES,
  getDaysInBsMonth,
  formatBsDate,
  parseBsDate
} from "@/utils/nepaliDate";

interface NepaliCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function NepaliCalendar({ selected, onSelect, className, minDate, maxDate }: NepaliCalendarProps) {
  const effectiveMaxDate = useMemo(() => {
    const today = new Date();
    if (!maxDate) return today;
    return maxDate < today ? maxDate : today;
  }, [maxDate]);

  const currentBS = useMemo(() => adToBs(selected || new Date()), [selected]);

  const [viewMonth, setViewMonth] = useState(currentBS.month);
  const [viewYear, setViewYear] = useState(currentBS.year);

  const minBS = useMemo(() => minDate ? adToBs(minDate) : null, [minDate]);
  const maxBS = useMemo(() => effectiveMaxDate ? adToBs(effectiveMaxDate) : null, [effectiveMaxDate]);

  // Calculate days in the view month
  const daysInMonth = getDaysInBsMonth(viewYear, viewMonth);
  const firstDayOfMonthAD = bsToAd(viewYear, viewMonth, 1);
  const startDayOfWeek = firstDayOfMonthAD.getDay(); // 0 (Sun) to 6 (Sat)

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      if (maxBS && viewYear >= maxBS.year) return;
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      if (maxBS && viewYear === maxBS.year && viewMonth >= maxBS.month) return;
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    const today = adToBs(new Date());
    setViewMonth(today.month);
    setViewYear(today.year);
    onSelect?.(new Date());
  };

  const isToday = (day: number) => {
    const today = adToBs(new Date());
    return today.year === viewYear && today.month === viewMonth && today.day === day;
  };

  const isSelected = (day: number) => {
    const sel = adToBs(selected || new Date());
    return sel.year === viewYear && sel.month === viewMonth && sel.day === day;
  };

  const years = useMemo(() => {
    const currentYear = adToBs(new Date()).year;
    return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  }, []);

  return (
    <div className={cn("p-3 bg-card border rounded-md shadow-sm w-[280px]", className)}>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value))}
              className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              {BS_MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value))}
              className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {BS_DAY_NAMES.map(day => (
          <div key={day} className="text-muted-foreground text-[10px] uppercase font-bold py-1">
            {day}
          </div>
        ))}

        {/* Fill empty slots before the first day */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 w-8" />
        ))}

        {/* Render days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const today = isToday(day);
          const sel = isSelected(day);

          const dateAD = bsToAd(viewYear, viewMonth, day);
          let disabled = false;
          if (minDate && dateAD < minDate) disabled = true;
          if (effectiveMaxDate && dateAD > effectiveMaxDate) disabled = true;

          return (
            <Button
              key={day}
              variant="ghost"
              disabled={disabled}
              className={cn(
                "h-8 w-8 p-0 text-sm font-normal transition-colors",
                today && "bg-success text-success-foreground hover:bg-success/90",
                sel && !today && "bg-amber-500 text-white hover:bg-amber-600",
                !today && !sel && "hover:bg-accent",
                disabled && "opacity-30 cursor-not-allowed"
              )}
              onClick={() => !disabled && onSelect?.(dateAD)}
            >
              {day}
            </Button>
          );
        })}
      </div>
      <div className="mt-4 pt-2 border-t flex justify-center">
        <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={goToToday}>
          Go to Today
        </Button>
      </div>
    </div>
  );
}
