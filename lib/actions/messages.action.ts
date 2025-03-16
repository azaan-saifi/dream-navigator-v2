"use server";
import {
  getQueryTypePrompt,
  getQuizResponsePrompt,
  getResourcePrompt,
  getVideoPrompt,
  secondsToTimeFormat,
} from "@/lib/utils";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateObject, streamObject, streamText } from "ai";
import OpenAI from "openai";
import { z } from "zod";
import { quizResponseScheme, reinforcementSchema } from "../validations";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createAzure } from "@quail-ai/azure-ai-provider";
import { openai } from "@ai-sdk/openai";

const azure = createAzure({
  endpoint: process.env.AZURE_API_ENDPOINT,
  apiKey: process.env.AZURE_API_KEY,
});

const embeddingModel = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
const resourceIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME_RESOURCE!);
const quizIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME_QUIZ!);

export async function getVideoTimestamps({ input }: { input: string }) {
  try {
    // Step 1: create an embedding for the user's input
    const embeddingResponse = await embeddingModel.embeddings.create({
      model: "text-embedding-3-small",
      input,
    });

    const userEmbedding = embeddingResponse.data[0].embedding;

    const queryResponse = await index.query({
      vector: userEmbedding,
      includeMetadata: true,
      topK: 3, // Get the top 5 most relevant chunks
    });

    // Step 3: Extract the most relevant chunks from the response
    const relevantChunks = queryResponse.matches.map((match) => {
      const videoTitle = match.metadata?.videoTitle;
      const startTime = Math.floor(+match.metadata!.startTime);
      const videoUrl = match.metadata?.videoUrl;
      const text = match.metadata?.text;

      // Convert startTime
      const TimeFormat = secondsToTimeFormat(startTime);

      return {
        text,
        videoTitle,
        startTime,
        videoUrl,
        TimeFormat,
      };
    });

    return relevantChunks;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getVideoResponse({
  query,
  relevantChunks,
}: {
  query: string;
  relevantChunks: unknown;
}) {
  try {
    const { textStream } = streamText({
      model: openrouter("google/gemini-2.0-pro-exp-02-05:free"),
      prompt: getVideoPrompt({ query, relevantChunks }),
    });

    return textStream;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getResources({ input }: { input: string }) {
  try {
    // Step 1: create an embedding for the user's input
    const embeddingResponse = await embeddingModel.embeddings.create({
      model: "text-embedding-3-small",
      input,
    });

    const userEmbedding = embeddingResponse.data[0].embedding;

    const queryResponse = await resourceIndex.query({
      vector: userEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // Step 3: Extract the most relevant chunks from the response
    const relevantChunks = queryResponse.matches.map((match) => {
      const resourceProvider = match.metadata?.provider;
      const resourceName = match.metadata?.name;
      const resourceLink = match.metadata?.link;
      const resourceDescription = match.metadata?.description;

      return {
        resourceProvider,
        resourceName,
        resourceLink,
        resourceDescription,
      };
    });

    return relevantChunks;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getResourceResponse({
  query,
  relevantResources,
}: {
  query: string;
  relevantResources: unknown;
}) {
  try {
    const { textStream } = streamText({
      model: openrouter("google/gemini-2.0-pro-exp-02-05:free"),
      prompt: getResourcePrompt({ query, relevantResources }),
    });

    return textStream;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getQueryType({ query }: { query: string }) {
  try {
    const { object } = await generateObject({
      prompt: getQueryTypePrompt({ query }),
      model: openai("gpt-4o"),
      schema: z.object({
        queryType: z.union([
          z.literal("video"),
          z.literal("resource"),
          z.literal("quiz"),
          z.literal("general"),
        ]),
        quizQueryProps: z.object({
          section: z
            .union([
              z.literal("intensive-1"),
              z.literal("intensive-2"),
              z.literal("intensive-3"),
              z.literal("intensive-4"),
            ])
            .optional(),
          lecture: z.array(z.number().min(1).max(10)).optional(),
        }),
      }),
    });
    return object;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getGeneralResponse({
  messages,
}: {
  messages: Message[];
}) {
  try {
    const { textStream } = streamText({
      system: `
You are Dream Navigator, developed by the Dream Students community to assist Arabic students studying with Ustadh Nouman Ali Khan at the Bayyinah Institute.

## Core Functions
You have exactly three specialized functions:
1. **Video Search**: Finding specific video content from Ustadh Nouman's lectures
2. **Resource Retrieval**: Providing educational materials
3. **Quiz Creation**: Generating assessment questions on lecture content, Query must include the section name and for which day the user wants the quiz on.

- Or just answer user's query like helping them in grasping any arabic concepts or anything they want.
- Be as friendly, attractive and impressive as possible while answering.
- Be very concise if long answer is not required.

      `,
      messages,
      model: openrouter("google/gemini-2.0-pro-exp-02-05:free"),
    });

    return textStream;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getQuizContext({
  section,
  day,
}: {
  section: string;
  day: number[];
}) {
  try {
    const dummyVector = new Array(1536).fill(0);
    const filter = {
      section,
      day:
        day.length > 1
          ? { $gte: day[0], $lte: day[day.length - 1] }
          : { $eq: day[0] },
    };

    const query = await quizIndex.query({
      vector: dummyVector,
      topK: day.length,
      includeMetadata: true,
      filter,
    });

    const response = query.matches.map((match) => ({
      day: match.metadata?.day,
      sectionName: match.metadata?.section,
      lectureNotes: match.metadata?.text,
    }));

    return response;
  } catch (error) {
    console.log(error);
  }
}

// export async function getQuizUnstructuredResponse({
//   context,
//   query,
// }: {
//   context: any[];
//   query: string;
// }) {
//   try {
//     // const enhancedModel = wrapLanguageModel({
//     //   model: openrouter("deepseek/deepseek-r1:free"),
//     //   middleware: extractReasoningMiddleware({ tagName: "think" }),
//     // });

//     const { text } = await generateText({
//       model: anthropic("claude-3-7-sonnet-20250219"),
//       // model: enhancedModel,
//       prompt: getQuizResponsePrompt({ context, query }),
//     });

//     return { text };
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

// export async function getQuizResponse({ text }: { text: string }) {
//   try {
//     const { partialObjectStream } = streamObject({
//       model: openai("DeepSeek-V3o-mini"),
//       schema: quizResponseScheme,
//       prompt: `Extract the desired information from this text: \n` + text,
//     });

//     return { partialObjectStream };
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

export async function getQuizResponse({
  messages,
  context,
  query,
}: {
  messages: Message[];
  context: any[];
  query: string;
}) {
  try {
    const { partialObjectStream } = streamObject({
      messages,
      model: openrouter("google/gemini-2.0-pro-exp-02-05:free"),
      schema: quizResponseScheme,
      system: getQuizResponsePrompt({ context, query }),
    });

    return { partialObjectStream };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getReinforcementQuestion({
  context,
  question,
  incorrectOption,
}: {
  context: any[];
  question: QuizQuestion;
  incorrectOption: number;
}) {
  try {
    const { object } = await generateObject({
      prompt: `
You are an expert Arabic language tutor specializing in reinforcement learning. A student has answered a quiz question incorrectly, and you need to create a follow-up question to strengthen their understanding of the concept they struggled with.

ORIGINAL QUESTION (That user got incorrect with the correct option number): ${JSON.stringify(
        question
      )}
STUDENT'S INCORRECT ANSWER (the option user chose): ${incorrectOption}
RELEVANT CONTEXT (from which the original question was made): ${JSON.stringify(
        context
      )}

Create a new question that:
1. Targets the same concept but approaches it from a different angle
2. Addresses the specific misconception revealed by their incorrect answer
3. Is slightly simpler than the original question but still challenges understanding
4. Provides subtle guidance toward the correct understanding
5. Uses the same terminology as found in the lecture materials
6. Always put harakas if that's not the part of the challenge

## Guidelines
- Focus on fundamental understanding rather than memorization
- Use concrete examples when possible
- Keep language clear and accessible
- Ensure the question tests understanding, not just recall

The question should help the student recognize their misunderstanding while building confidence in the correct application of the concept.
      `,
      model: openrouter("google/gemini-2.0-pro-exp-02-05:free"),
      schema: reinforcementSchema,
    });

    return object;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
