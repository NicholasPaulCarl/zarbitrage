import * as React from "react"
import { format, subDays, subMonths, subYears } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangePickerProps {
  dateRange: DateRange
  onChange: (range: DateRange) => void
  className?: string
  disabled?: boolean
}

// Preset date ranges
const presets = [
  {
    label: "7D",
    value: "7d",
    getRange: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: "30D",
    value: "30d", 
    getRange: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    label: "90D",
    value: "90d",
    getRange: () => ({
      from: subDays(new Date(), 90),
      to: new Date(),
    }),
  },
  {
    label: "6M",
    value: "6m",
    getRange: () => ({
      from: subMonths(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "1Y",
    value: "1y",
    getRange: () => ({
      from: subYears(new Date(), 1),
      to: new Date(),
    }),
  },
]

export function DateRangePicker({ 
  dateRange, 
  onChange, 
  className,
  disabled = false 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempRange, setTempRange] = React.useState<DateRange>(dateRange)

  // Update temp range when external dateRange changes
  React.useEffect(() => {
    setTempRange(dateRange)
  }, [dateRange])

  const handlePresetClick = (preset: typeof presets[0]) => {
    const newRange = preset.getRange()
    setTempRange(newRange)
    onChange(newRange)
    setIsOpen(false)
  }

  const handleDateSelect = (range: any) => {
    const newRange: DateRange = {
      from: range?.from,
      to: range?.to,
    }
    setTempRange(newRange)
    
    // Only update if we have both dates
    if (newRange.from && newRange.to) {
      onChange(newRange)
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    const defaultRange = presets[1].getRange() // Default to 30D
    setTempRange(defaultRange)
    onChange(defaultRange)
  }

  const formatDateRange = () => {
    if (!dateRange.from) {
      return "Select date range"
    }
    
    if (dateRange.from && !dateRange.to) {
      return format(dateRange.from, "MMM dd, yyyy")
    }
    
    if (dateRange.from && dateRange.to) {
      // Check if it matches a preset
      const matchingPreset = presets.find(preset => {
        const presetRange = preset.getRange()
        return (
          presetRange.from &&
          presetRange.to &&
          dateRange.from &&
          dateRange.to &&
          Math.abs(presetRange.from.getTime() - dateRange.from.getTime()) < 24 * 60 * 60 * 1000 && // Within 1 day
          Math.abs(presetRange.to.getTime() - dateRange.to.getTime()) < 24 * 60 * 60 * 1000
        )
      })
      
      if (matchingPreset) {
        return `Last ${matchingPreset.label.toLowerCase()}`
      }
      
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
    }
    
    return "Select date range"
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
            {dateRange.from && (
              <X 
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100" 
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Preset buttons */}
            <div className="flex flex-col gap-1 p-3 border-r">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Quick select
              </div>
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 px-2 font-normal"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempRange.from}
                selected={tempRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                disabled={(date) =>
                  date > new Date() || date < subYears(new Date(), 2)
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}