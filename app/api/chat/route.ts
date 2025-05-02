import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages, pdfFile } = await req.json()

  // Create a system prompt that includes information about the PDF
  const systemPrompt = pdfFile
    ? `You are a financial assistant that helps users understand their bank statements. 
       I will provide you with a bank statement PDF. Please analyze it and answer questions about it.
       Be specific and reference actual numbers from the statement when relevant.
       Only answer questions related to the provided bank statement.
       If asked about something not in the statement, politely explain you can only 
       answer questions about the provided statement.`
    : `You are a financial assistant that helps users understand their bank statements.
       The user hasn't uploaded a bank statement yet. Encourage them to upload one
       so you can provide specific financial insights.`

  // If we have a PDF file, we'll send it as an attachment to Claude
  let attachments = []

  if (pdfFile) {
    // Convert base64 back to binary
    const pdfBuffer = Buffer.from(pdfFile.data, "base64")

    // Create an attachment for Claude
    attachments = [
      {
        type: "file",
        file_data: {
          type: "application/pdf",
          data: pdfBuffer.toString("base64"),
        },
      },
    ]
  }

  const result = streamText({
    model: anthropic("claude-3-haiku-20240307"),
    messages,
    system: systemPrompt,
    // Add attachments if we have a PDF
    ...(attachments.length > 0 && { attachments }),
  })

  return result.toDataStreamResponse()
}
