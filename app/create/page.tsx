"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useHabitStore } from "@/lib/habit-store"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function CreateHabitPage() {
  const [habitName, setHabitName] = useState("")
  const { addHabit, habits } = useHabitStore()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!habitName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a habit name",
        variant: "destructive",
      })
      return
    }

    // Check if habit already exists
    if (habits.some((h) => h.name.toLowerCase() === habitName.toLowerCase())) {
      toast({
        title: "Error",
        description: "A habit with this name already exists",
        variant: "destructive",
      })
      return
    }

    addHabit(habitName)

    toast({
      title: "Success",
      description: `Habit "${habitName}" created successfully`,
    })

    setHabitName("")
    router.push("/")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Habit</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>New Habit</CardTitle>
            <CardDescription>Add a new habit you want to track daily</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="habit-name"
                  placeholder="Enter habit name"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Create Habit
            </Button>
          </CardFooter>
        </form>
      </Card>

      {habits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Your Habits</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                {habits.map((habit) => (
                  <li key={habit.id} className="flex justify-between items-center">
                    <span>{habit.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(habit.dateCreated).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
