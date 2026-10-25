"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "@daypicker/react";
import "@daypicker/react/style.css";

function localValue(day: Date, time: string) {
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  return `${date}T${time}`;
}

export function DateTimeSelector({ value, onChange, min, timezone }: { value: string; onChange: (value: string) => void; min: string; timezone: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value.slice(0, 10)}T12:00:00`) : undefined;
  const time = value?.slice(11, 16) || "09:00";
  const earliest = new Date(`${min.slice(0, 10)}T12:00:00`);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <div className="date-time-selector"><div className="date-time-fields"><div><strong>Date</strong><button type="button" className="date-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><CalendarDays size={17} />{selected ? selected.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Choose a date"}</button></div><label>Time<input type="time" value={time} onChange={(event) => onChange(localValue(selected ?? earliest, event.target.value))} /></label></div><small>Timezone: {timezone}. Choose a future date and time.</small><dialog ref={dialogRef} className="date-picker-dialog" aria-label="Choose a scheduling date" onClose={() => setOpen(false)} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}><div className="date-picker-content"><div className="date-picker-heading"><strong>Choose a date</strong><button type="button" className="icon-only" aria-label="Close calendar" onClick={() => dialogRef.current?.close()}>×</button></div><DayPicker mode="single" selected={selected} onSelect={(day) => { if (day) { onChange(localValue(day, time)); dialogRef.current?.close(); } }} disabled={{ before: earliest }} captionLayout="dropdown" startMonth={new Date()} endMonth={new Date(new Date().getFullYear() + 2, 11)} /></div></dialog></div>;
}
