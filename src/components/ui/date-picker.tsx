"use client";

import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (date: string) => void;
  name?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  defaultValue = "",
  onValueChange,
  name,
  placeholder = "Pick a date",
  id,
  required,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const dateValue = value ?? internalValue;
  const selectedDate = parseDate(dateValue);

  function selectDate(date: Date | undefined) {
    if (!date && required) return;
    const nextValue = date ? formatDate(date) : "";
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    if (date) setOpen(false);
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={dateValue} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id={id}
              disabled={disabled}
              aria-required={required}
              data-empty={!selectedDate}
              className={cn(
                "w-full justify-start text-left font-normal data-empty:text-muted-foreground",
                className,
              )}
            />
          }
        >
          <CalendarIcon />
          <span className="min-w-0 flex-1 truncate">
            {selectedDate ? format(selectedDate, "PPP") : placeholder}
          </span>
          <ChevronDownIcon data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={selectDate}
            defaultMonth={selectedDate}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
