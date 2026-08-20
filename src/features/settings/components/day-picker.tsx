import { Button } from "@/components/ui/button";
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/features/settings/lib/types";
import type { WeekDay } from "@/generated/prisma/enums";

export function DayPicker({
  value,
  onChange,
  disabled,
}: {
  value: WeekDay;
  onChange: (day: WeekDay) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {WEEKDAY_ORDER.map((day) => (
        <Button
          key={day}
          type="button"
          size="sm"
          variant={value === day ? "default" : "outline"}
          className={value === day ? "" : "text-muted-foreground hover:text-foreground"}
          disabled={disabled}
          onClick={() => onChange(day)}
        >
          {WEEKDAY_LABELS[day]}
        </Button>
      ))}
    </div>
  );
}
