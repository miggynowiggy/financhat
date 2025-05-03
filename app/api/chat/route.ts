import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages, pdfFile } = await req.json()

  console.log("Received messages:", messages)

  // Create a system prompt that includes information about the PDF
  const systemPrompt = pdfFile
    ? `You are a financial assistant that helps users understand their bank statements. 
       I will provide you with a bank statement PDF. Please analyze it and answer questions about it.
       Be specific and reference actual numbers from the statement when relevant.
       Only answer questions related to the provided bank statement.
       If asked about something not in the statement, politely explain you can only 
       answer questions about the provided statement. Respond to the user in markdown`
    : `You are a financial assistant that helps users understand their bank statements.
       The user hasn't uploaded a bank statement yet. Encourage them to upload one
       so you can provide specific financial insights. Response to the user in markdown.`

  try {
    const result = streamText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      messages: messages,
      system: systemPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
