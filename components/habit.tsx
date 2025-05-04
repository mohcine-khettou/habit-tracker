import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface HabitProps {
  title: string;
  description: string;
  frequency: string;
  streak: number;
  completed: boolean;
}

export function Habit({
  title,
  description,
  frequency,
  streak,
  completed,
}: HabitProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Checkbox checked={completed} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{frequency}</Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center border-t">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Streak: {streak} days</div>
        </div>
        <div className="flex gap-2">
          {completed ? (
            <Badge className="bg-green-500">Completed</Badge>
          ) : (
            <Badge variant="outline">Pending</Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
