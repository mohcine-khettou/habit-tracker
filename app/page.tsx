"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatDate, useHabitStore } from "@/lib/habit-store";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function TrackHabitsPage() {
  const { habits, trackingData, getTrackingDataForDate, updateHabitProgress } =
    useHabitStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formattedDate, setFormattedDate] = useState<string>(
    formatDate(new Date())
  );
  const [habitProgress, setHabitProgress] = useState<Record<string, number>>(
    {}
  );
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  // Memoize the sorted habits to prevent recalculation on every render
  const { lastTwoHabits, olderHabits } = useMemo(() => {
    // Sort habits by creation date (newest first)
    const sortedHabits = [...habits].sort(
      (a, b) =>
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );

    // Get the last two habits
    const lastTwo = sortedHabits.slice(0, 2);
    // Get the rest of the habits
    const older = sortedHabits.slice(2);

    return { lastTwoHabits: lastTwo, olderHabits: older };
  }, [habits]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const dateStr = formatDate(selectedDate);
      setFormattedDate(dateStr);

      const existingData = getTrackingDataForDate(dateStr);

      const newHabitProgress: Record<string, number> = {};

      // Set default values for habits
      habits.forEach((habit) => {
        // For the last two habits, default to 0%
        if (lastTwoHabits.some((h) => h.id === habit.id)) {
          newHabitProgress[habit.id] =
            existingData && existingData[habit.id] !== undefined
              ? (existingData[habit.id] as number)
              : 0;
        }
        // For older habits, default to 100%
        else {
          newHabitProgress[habit.id] =
            existingData && existingData[habit.id] !== undefined
              ? (existingData[habit.id] as number)
              : 100;
        }
      });

      setHabitProgress(newHabitProgress);
    }
  }, [selectedDate, habits, getTrackingDataForDate, isMounted, lastTwoHabits]);

  // Only update local state when slider changes, don't save to store yet
  const handleProgressChange = (habitId: string, value: number[]) => {
    const newProgress = { ...habitProgress, [habitId]: value[0] };
    setHabitProgress(newProgress);
  };

  // Save all habit progress at once when submit button is clicked
  const handleSubmit = () => {
    // Save each habit's progress to the store
    Object.entries(habitProgress).forEach(([habitId, progress]) => {
      updateHabitProgress(formattedDate, habitId, progress);
    });

    // Show toast notification
    toast({
      title: "Progress saved",
      description: `Your habit progress for ${format(
        selectedDate,
        "PPP"
      )} has been saved.`,
    });
  };

  if (!isMounted) {
    return null;
  }
  console.log(trackingData);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Track Your Habits</h1>

      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No habits created yet. Go to the Create tab to add your first
              habit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Last two habits (newest) */}
          {lastTwoHabits.map((habit) => (
            <Card key={habit.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{habit.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor={`progress-${habit.id}`}>Progress</Label>
                      <span className="text-sm font-medium">
                        {habitProgress[habit.id] || 0}%
                      </span>
                    </div>
                    <Slider
                      id={`progress-${habit.id}`}
                      min={0}
                      max={100}
                      step={1}
                      value={[habitProgress[habit.id] || 0]}
                      onValueChange={(value) =>
                        handleProgressChange(habit.id, value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Older habits */}
          {olderHabits.length > 0 && (
            <>
              <h2 className="text-lg font-medium mt-6">Previous Habits</h2>
              {olderHabits.map((habit) => (
                <Card key={habit.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={`progress-${habit.id}`}>
                            Progress
                          </Label>
                          <span className="text-sm font-medium">
                            {habitProgress[habit.id] || 100}%
                          </span>
                        </div>
                        <Slider
                          id={`progress-${habit.id}`}
                          min={0}
                          max={100}
                          step={1}
                          value={[habitProgress[habit.id] || 100]}
                          onValueChange={(value) =>
                            handleProgressChange(habit.id, value)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button onClick={handleSubmit} className="w-full" size="lg">
              Save Progress
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
