"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Habit {
  id: string
  name: string
  dateCreated: string // ISO date string
}

export interface TrackingData {
  date: string // Format: DD-MMM-YYYY
  [habitId: string]: number | string // Habit ID as key, percentage as value (or date for the date field)
}

interface HabitStore {
  habits: Habit[]
  trackingData: TrackingData[]
  addHabit: (name: string) => void
  updateHabitProgress: (date: string, habitId: string, percentage: number) => void
  getTrackingDataForDate: (date: string) => TrackingData | undefined
  getHabitProgress: (
    habitId: string,
    dateRange?: { start: string; end: string },
  ) => { dates: string[]; values: number[] }
  getAverageProgress: (habitId?: string, dateRange?: { start: string; end: string }) => number
  getLastTwoHabitsAverage: (dateRange?: { start: string; end: string }) => number
  getAllHabitsAverage: (dateRange?: { start: string; end: string }) => number
}

// Helper to format date as DD-MMM-YYYY
export const formatDate = (date: Date): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${date.getDate().toString().padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`
}

// Helper to parse DD-MMM-YYYY to Date
export const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return new Date(Number.parseInt(year), months.indexOf(month), Number.parseInt(day))
}

// Helper to check if a date is within a range
const isDateInRange = (date: string, range?: { start: string; end: string }): boolean => {
  if (!range) return true
  const dateObj = parseDate(date)
  const startObj = parseDate(range.start)
  const endObj = parseDate(range.end)
  return dateObj >= startObj && dateObj <= endObj
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      trackingData: [],

      addHabit: (name: string) => {
        const newHabit: Habit = {
          id: Date.now().toString(),
          name,
          dateCreated: new Date().toISOString(),
        }

        set((state) => ({
          habits: [...state.habits, newHabit],
        }))
      },

      updateHabitProgress: (date: string, habitId: string, percentage: number) => {
        set((state) => {
          // Find existing tracking data for this date
          const existingDataIndex = state.trackingData.findIndex((data) => data.date === date)

          if (existingDataIndex >= 0) {
            // Update existing tracking data
            const updatedTrackingData = [...state.trackingData]
            updatedTrackingData[existingDataIndex] = {
              ...updatedTrackingData[existingDataIndex],
              [habitId]: percentage,
            }
            return { trackingData: updatedTrackingData }
          } else {
            // Create new tracking data for this date
            const newTrackingData: TrackingData = {
              date,
              [habitId]: percentage,
            }
            return { trackingData: [...state.trackingData, newTrackingData] }
          }
        })
      },

      getTrackingDataForDate: (date: string) => {
        return get().trackingData.find((data) => data.date === date)
      },

      getHabitProgress: (habitId: string, dateRange) => {
        const { trackingData } = get()
        const filteredData = trackingData
          .filter((data) => isDateInRange(data.date, dateRange) && data[habitId] !== undefined)
          .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())

        return {
          dates: filteredData.map((data) => data.date),
          values: filteredData.map((data) => data[habitId] as number),
        }
      },

      getAverageProgress: (habitId, dateRange) => {
        const { trackingData, habits } = get()

        let relevantData: { date: string; value: number }[] = []

        if (habitId) {
          // For a specific habit
          relevantData = trackingData
            .filter((data) => isDateInRange(data.date, dateRange) && data[habitId] !== undefined)
            .map((data) => ({ date: data.date, value: data[habitId] as number }))
        } else {
          // For all habits
          habits.forEach((habit) => {
            trackingData
              .filter((data) => isDateInRange(data.date, dateRange) && data[habit.id] !== undefined)
              .forEach((data) => {
                relevantData.push({ date: data.date, value: data[habit.id] as number })
              })
          })
        }

        if (relevantData.length === 0) return 0

        const sum = relevantData.reduce((acc, item) => acc + item.value, 0)
        return sum / relevantData.length
      },

      getLastTwoHabitsAverage: (dateRange) => {
        const { habits, trackingData } = get()

        if (habits.length < 2) return 0

        // Sort habits by creation date (newest first)
        const sortedHabits = [...habits].sort(
          (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
        )

        // Get the last two habits
        const lastTwoHabits = sortedHabits.slice(0, 2)

        const relevantData: { date: string; value: number }[] = []

        lastTwoHabits.forEach((habit) => {
          trackingData
            .filter((data) => isDateInRange(data.date, dateRange) && data[habit.id] !== undefined)
            .forEach((data) => {
              relevantData.push({ date: data.date, value: data[habit.id] as number })
            })
        })

        if (relevantData.length === 0) return 0

        const sum = relevantData.reduce((acc, item) => acc + item.value, 0)
        return sum / relevantData.length
      },

      getAllHabitsAverage: (dateRange) => {
        return get().getAverageProgress(undefined, dateRange)
      },
    }),
    {
      name: "habit-tracker-storage",
    },
  ),
)
