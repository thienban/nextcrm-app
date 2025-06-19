import { authOptions } from "@/lib/auth";
import { openAiHelper } from "@/lib/openai";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { getServerSession } from "next-auth";

// IMPORTANT! Set the runtime to edge
//export const runtime = "edge";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const openai = await openAiHelper(session.user.id);

  if (!openai) {
    return new Response("No openai key found", { status: 500 });
  }

  const { prompt } = await req.json();

  // Create OpenAI provider instance
  const provider = createOpenAI({
    apiKey: openai.apiKey,
    compatibility: 'strict'
  });

  // Create completion stream
  const stream = await generateText({
    model: provider('text-davinci-003'),
    prompt: prompt,
    stream: true
  });

  // Return streaming response
  return streamText(stream);
}
