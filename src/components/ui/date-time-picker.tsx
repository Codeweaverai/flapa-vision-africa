
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  // Handle date change from the calendar
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        value.getHours(),
        value.getMinutes()
      );
      onChange(newDateTime);
    }
  };

  // Handle hour change
  const handleHourChange = (hour: string) => {
    const newDateTime = new Date(value);
    newDateTime.setHours(parseInt(hour, 10));
    onChange(newDateTime);
  };

  // Handle minute change
  const handleMinuteChange = (minute: string) => {
    const newDateTime = new Date(value);
    newDateTime.setMinutes(parseInt(minute, 10));
    onChange(newDateTime);
  };

  // Generate hours for select
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: String(i).padStart(2, "0"),
  }));

  // Generate minutes for select (0, 15, 30, 45)
  const minutes = Array.from({ length: 4 }, (_, i) => ({
    value: String(i * 15),
    label: String(i * 15).padStart(2, "0"),
  }));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP HH:mm") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateChange}
          initialFocus
        />
        <div className="p-3 border-t border-border flex items-center gap-2">
          <div className="grid gap-1">
            <div className="text-xs font-medium">Hour</div>
            <Select
              value={String(value.getHours())}
              onValueChange={handleHourChange}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs font-medium">Minute</div>
            <Select
              value={String(Math.floor(value.getMinutes() / 15) * 15)}
              onValueChange={handleMinuteChange}
            >
              <SelectTrigger className="w-[75px]">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={minute.value} value={minute.value}>
                    {minute.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
