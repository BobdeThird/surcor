import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, smoothStream, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-5-nano'),
    messages: convertToModelMessages(messages),
    experimental_transform: smoothStream(),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
}