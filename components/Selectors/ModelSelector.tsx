import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const models = [
  {
    value: "claude-sonnet-4-20250514",
    label: "Claude 4 Sonnet",
    provider: "Anthropic",
  },
  {
    value: "gpt-4.1",
    label: "GPT-4.1",
    provider: "OpenAI",
  },
  {
    value: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
  },
]

export type Model = typeof models[number]

interface ModelSelectorProps {
  value?: string
  onValueChange: (value: string) => void
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  // Find the selected model to display its label
  const selectedModel = models.find(model => model.value === value)
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-fit focus:ring-0 focus:ring-offset-0 text-gray-500 border-none shadow-none">
        <SelectValue placeholder="Select a model">
          {selectedModel?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            <div className="flex items-center gap-2">
              <span>{model.label}</span>
            </div>  
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
