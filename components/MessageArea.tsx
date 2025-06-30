"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import RichTextInput from "./RichTextInput/RichTextInput"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form"
import { Button } from "./ui/button"
import { ArrowUp } from "lucide-react"
import { TaskSelector } from "./Selectors/taskSelector"
import { ModelSelector } from "./Selectors/modelSelector"
import { ContextSelector } from "./Selectors/contextSelector"

const formSchema = z.object({
  task: z.string().min(1, {
    message: "Please select a task.",
  }),
  model: z.string().min(1, {
    message: "Please select a model.",
  }),
  message: z.string().min(1, {
    message: "Message cannot be empty.",
  }),
  context: z.array(z.string()),
  googleAccessToken: z.string().nullable(),
})

interface MessageAreaProps {
  onSendMessage: (message: { text: string }) => void;
}

export function MessageArea({ onSendMessage }: MessageAreaProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      task: "agent",
      model: "claude-sonnet-4-20250514",
      message: "",
      context: [],
      googleAccessToken: null,
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    onSendMessage({ text: values.message });
    form.reset({
      task: values.task,
      model: values.model,
      message: "",
      context: values.context,
      googleAccessToken: values.googleAccessToken,
    });
  })

  return (
    <div className="w-full max-w-2xl">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="p-3 border rounded-2xl bg-white/75 backdrop-blur-sm shadow-lg">
          
          {/* Context Selector */}
          <FormField
            control={form.control}
            name="context"
            render={({ field }) => (
              <FormItem className="overflow-hidden mb-1 scrollbar-hide">
                <FormControl>
                  <ContextSelector 
                    value={field.value} 
                    onValueChange={field.onChange}
                    onAccessTokenChange={() => {}}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Message Input */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="min-h-16">
                <FormControl>
                  <RichTextInput
                    value={field.value}
                    onChange={field.onChange}
                    mentionItems={[]}
                    onMentionSearchChange={() => {}}
                    onMentionSelect={() => {}}
                    onMentionNodesChange={() => {}}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Bottom Row: Task Selector, Model Selector, and Send Button */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="task"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TaskSelector 
                        value={field.value} 
                        onValueChange={field.onChange} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ModelSelector 
                        value={field.value} 
                        onValueChange={field.onChange} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Send Button */}
            <Button 
              type="submit" 
              className="h-8 w-8 rounded-full bg-black dark:bg-gray-900 dark:hover:bg-gray-800 transition-transform hover:scale-120 flex-shrink-0"
            >
              <ArrowUp className="h-4 w-4 text-gray-50 dark:text-gray-900" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  ) 
}