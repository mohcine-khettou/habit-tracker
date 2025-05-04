"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, useHabitStore } from "@/lib/habit-store"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format, subDays, subMonths, subWeeks } from "date-fns"
import type { DateRange } from "react-day-picker"

export default function AnalyticsPage() {
  const { habits, getHabitProgress, getAverageProgress, getLastTwoHabitsAverage, getAllHabitsAverage } = useHabitStore()
  const [selectedHabit, setSelectedHabit] = useState<string>("")
  const [dateFilter, setDateFilter] = useState<string>("today")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([])
  const [averages, setAverages] = useState({
    selectedHabit: 0,
    lastTwoHabits: 0,
    allHabits: 0,
  })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && habits.length > 0 && !selectedHabit) {
      setSelectedHabit(habits[0].id)
    }
  }, [habits, isMounted, selectedHabit])

  useEffect(() => {
    if (!isMounted || !selectedHabit) return

    const today = new Date()
    let start: Date
    let end: Date = today

    // Calculate date range based on filter
    switch (dateFilter) {
      case "today":
        start = today
        break
      case "yesterday":
        start = subDays(today, 1)
        end = subDays(today, 1)
        break
      case "week":
        start = subWeeks(today, 1)
        break
      case "month":
        start = subMonths(today, 1)
        break
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          start = dateRange.from
          end = dateRange.to
        } else {
          start = today
        }
        break
      default:
        start = today
    }

    const dateRangeObj = {
      start: formatDate(start),
      end: formatDate(end),
    }

    // Get habit progress data for chart
    const { dates, values } = getHabitProgress(selectedHabit, dateRangeObj)
    const newChartData = dates.map((date, index) => ({
      date,
      value: values[index],
    }))
    setChartData(newChartData)

    // Calculate averages
    const selectedHabitAvg = getAverageProgress(selectedHabit, dateRangeObj)
    const lastTwoHabitsAvg = getLastTwoHabitsAverage(dateRangeObj)
    const allHabitsAvg = getAllHabitsAverage(dateRangeObj)

    setAverages({
      selectedHabit: selectedHabitAvg,
      lastTwoHabits: lastTwoHabitsAvg,
      allHabits: allHabitsAvg,
    })
  }, [
    selectedHabit,
    dateFilter,
    dateRange,
    isMounted,
    getHabitProgress,
    getAverageProgress,
    getLastTwoHabitsAverage,
    getAllHabitsAverage,
  ])

  if (!isMounted) {
    return null
  }

  const selectedHabitName = habits.find((h) => h.id === selectedHabit)?.name || ""

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No habits created yet. Go to the Create tab to add your first habit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Select Habit</label>
                <Select value={selectedHabit} onValueChange={setSelectedHabit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a habit" />
                  </SelectTrigger>
                  <SelectContent>
                    {habits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        {habit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Time Period</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dateFilter === "custom" && (
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{selectedHabitName} Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      progress: {
                        label: "Progress",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                  >
                    <LineChart
                      data={chartData.map((item) => ({
                        date: item.date,
                        progress: item.value,
                      }))}
                    >
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                          const parts = value.split("-")
                          return `${parts[0]}-${parts[1]}`
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke="var(--color-progress)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available for the selected period</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{selectedHabitName} Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.selectedHabit.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Two Habits Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.lastTwoHabits.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">All Habits Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.allHabits.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
