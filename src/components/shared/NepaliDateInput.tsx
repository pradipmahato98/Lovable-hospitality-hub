import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  adToBS,
  bsToAD,
  formatBSDate,
  getBSMonthName,
  getDaysInBSMonth,
  todayBS,
  type NepaliDate,
} from "@/lib/nepaliDate";

interface NepaliDateInputProps {
  /** ISO string value (YYYY-MM-DD) in AD */
  value: string;
  /** Callback with AD ISO string */
  onChange: (adIsoDate: string) => void;
  /** Label text */
  label?: string;
  /** Additional className */
  className?: string;
  /** Show both AD and BS inputs side by side */
  showDual?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export function NepaliDateInput({
  value,
  onChange,
  label,
  className,
  showDual = true,
  disabled = false,
}: NepaliDateInputProps) {
  const bsDate = useMemo(() => {
    if (!value) return todayBS();
    const [y, m, d] = value.split("-").map(Number);
    return adToBS(new Date(y, m - 1, d));
  }, [value]);

  const [bsYear, setBsYear] = useState(bsDate.year);
  const [bsMonth, setBsMonth] = useState(bsDate.month);
  const [bsDay, setBsDay] = useState(bsDate.day);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setBsYear(bsDate.year);
    setBsMonth(bsDate.month);
    setBsDay(bsDate.day);
  }, [bsDate.year, bsDate.month, bsDate.day]);

  const handleBSChange = (year: number, month: number, day: number) => {
    const clamped = Math.min(day, getDaysInBSMonth(year, month));
    const adDate = bsToAD({ year, month, day: clamped });
    const iso = `${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2, "0")}-${String(adDate.getDate()).padStart(2, "0")}`;
    onChange(iso);
  };

  const handleADChange = (adIso: string) => {
    onChange(adIso);
  };

  const bsFormatted = formatBSDate(bsDate, "long");
  const daysInMonth = getDaysInBSMonth(bsYear, bsMonth);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const firstDayAD = bsToAD({ year: bsYear, month: bsMonth, day: 1 });
    const startDayOfWeek = firstDayAD.getDay(); // 0=Sun
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [bsYear, bsMonth, daysInMonth]);

  const today = todayBS();
  const isToday = (d: number) => d === today.day && bsMonth === today.month && bsYear === today.year;
  const isSelected = (d: number) => d === bsDate.day && bsMonth === bsDate.month && bsYear === bsDate.year;

  const navigateMonth = (delta: number) => {
    let newMonth = bsMonth + delta;
    let newYear = bsYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setBsMonth(newMonth);
    setBsYear(newYear);
  };

  // BS year range
  const yearRange = Array.from({ length: 20 }, (_, i) => todayBS().year - 5 + i);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-xs font-medium">{label}</Label>}
      
      <div className={cn("flex gap-2", showDual ? "flex-col sm:flex-row" : "")}>
        {/* AD Date Input */}
        {showDual && (
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AD Date</span>
            <Input
              type="date"
              value={value}
              onChange={(e) => handleADChange(e.target.value)}
              disabled={disabled}
              className="h-9 text-sm"
            />
          </div>
        )}

        {/* BS Date Input with Calendar Picker */}
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {showDual ? "BS मिति" : "मिति (BS)"}
          </span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal h-9 text-sm",
                  !value && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-medium">{bsFormatted}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <div className="p-3 space-y-3">
                {/* Month/Year Selectors */}
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Select value={String(bsMonth)} onValueChange={(v) => setBsMonth(Number(v))}>
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={String(m)} className="text-xs">
                            {getBSMonthName(m)} ({getBSMonthName(m, "np")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={String(bsYear)} onValueChange={(v) => setBsYear(Number(v))}>
                      <SelectTrigger className="h-7 w-[80px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearRange.map((y) => (
                          <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                  {calendarDays.map((day, idx) => (
                    <div key={idx} className="aspect-square flex items-center justify-center">
                      {day ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleBSChange(bsYear, bsMonth, day);
                            setCalendarOpen(false);
                          }}
                          className={cn(
                            "h-7 w-7 rounded-md text-xs font-medium transition-colors",
                            isSelected(day)
                              ? "bg-primary text-primary-foreground"
                              : isToday(day)
                              ? "bg-accent text-accent-foreground font-bold"
                              : "hover:bg-secondary text-foreground"
                          )}
                        >
                          {day}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Today Button */}
                <div className="flex justify-center pt-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary"
                    onClick={() => {
                      const t = todayBS();
                      handleBSChange(t.year, t.month, t.day);
                      setCalendarOpen(false);
                    }}
                  >
                    आज (Today)
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

interface NepaliDateSearchProps {
  /** Callback with from/to AD ISO strings */
  onSearch: (fromDate: string, toDate: string) => void;
  className?: string;
}

/** Search bar with BS date range pickers */
export function NepaliDateSearch({ onSearch, className }: NepaliDateSearchProps) {
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  return (
    <div className={cn("flex flex-col sm:flex-row items-end gap-2", className)}>
      <NepaliDateInput
        label="From / देखि"
        value={fromDate}
        onChange={setFromDate}
        showDual={false}
      />
      <NepaliDateInput
        label="To / सम्म"
        value={toDate}
        onChange={setToDate}
        showDual={false}
      />
      <Button
        size="sm"
        className="h-9 px-4"
        onClick={() => onSearch(fromDate, toDate)}
      >
        Search
      </Button>
    </div>
  );
}
