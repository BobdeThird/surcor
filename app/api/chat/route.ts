import { streamText, smoothStream, convertToModelMessages } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  console.log('Incoming request:', req);

  const body = await req.json();
  const { messages, model, googleAccessToken, context } = body;

  console.log('Google Access Token received:', googleAccessToken);
  console.log('Context received:', context);
  console.log('Model received:', model);

  const result = streamText({
    model: model,
    system: `
      Today's date is ${new Date().toLocaleDateString()}.

      <communication>
      1. Be conversational but professional and concise without losing important details.
      2. Refer to the USER in the second person, and yourself in the first person.
      3. Always use markdown for formatting. Use backticks to format file, directory, function, and class names.
      4. Always use LaTeX for mathematical expressions:
      - Inline math must be wrapped in single dollar signs: $content$
      - Display math must be wrapped in double dollar signs: $$content$$
      - Display math should be placed on its own line, with nothing else on that line
      - Do not nest math delimiters or mix styles
      5. NEVER lie or make things up.
      6. Refrain from apologizing all the time when results are unexpected. Instead, just try your best to proceed or explain the circumstances to the user without apologizing.
      </communication>
    `,
    messages: convertToModelMessages(messages),
    experimental_transform: [smoothStream({ chunking: 'word' })],
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}