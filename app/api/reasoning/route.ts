import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";

export async function POST() {
  try {
    const result = streamText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      prompt: "Who is the most intelligent person alive on the earth.",
      providerOptions: {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 12000 },
        },
      },
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Error occured" });
  }
}
