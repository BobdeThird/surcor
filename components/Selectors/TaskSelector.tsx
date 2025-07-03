import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Infinity, MessageSquare, Telescope } from "lucide-react"

const tasks = [
  {
    value: "agent",
    label: "Agent",
    icon: Infinity,
  },
  {
    value: "research",
    label: "Research",
    icon: Telescope,
  },
  {
    value: "ask",
    label: "Ask",
    icon: MessageSquare,
  },
]

interface TaskSelectorProps {
  value?: string
  onValueChange: (value: string) => void
}

export function TaskSelector({ value, onValueChange }: TaskSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-fit focus:ring-0 focus:ring-offset-0 bg-gray-100 text-gray-500 border-none shadow-sm">
        <SelectValue placeholder="Select a task" />
      </SelectTrigger>
      <SelectContent>
        {tasks.map((task) => {
          const Icon = task.icon
          return (
            <SelectItem key={task.value} value={task.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 transition-colors group-hover:text-black dark:group-hover:text-gray-200" />
                {task.label}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
