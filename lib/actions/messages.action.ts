/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
"use server";
import {
  getQueryTypePrompt,
  getQuizResponsePrompt,
  getResourcePrompt,
  getVideoPrompt,
  secondsToTimeFormat,
} from "@/lib/utils";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateObject, generateText, streamObject, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import OpenAI from "openai";
import {
  querySchema,
  quizResponseScheme,
  reinforcementSchema,
} from "../validations";

import { Message, QuizQuestion } from "@/types";

const embeddingModel = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
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
      model: openai("gpt-4o-mini"),
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
      model: openai("gpt-4o-mini"),
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
      model: openai("gpt-4o-mini"),
      schema: querySchema,
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
1. **Video Search**: Finding specific video content from Ustadh Nouman's lectures.
2. **Resource Retrieval**: Providing educational materials
3. **Quiz Creation**: Generating assessment questions on lecture content from Intensive 1 ONLY.

## Important Quiz Limitation
- Currently you can ONLY create quizzes on Intensive 1 and Intensive 2, as these are the only sections with available content.
- If a user asks for a quiz on ANY other section name (like Intensive 3, or 4, Advanced Nahw, Advanced Sarf etc.), you MUST inform them:
  "I apologize, but currently I can only create quizzes for Intensive 1. We're actively expanding our knowledge base, and support for other sections will be available very soon inshallah. Please check the Knowledge tab on Dream Navigator for updates. In the meantime, is there anything specific about Intensive 1 or 2 you'd like to be quizzed on?"

## General Response Guidelines
- Answer user queries about Arabic concepts, grammar, language learning, or any other topic within your knowledge.
- Be friendly, engaging, and impressive while answering.
- Be concise when a lengthy answer is not required.
- For religious terms, maintain them in their original Arabic form (like القرآن، الحمد لله، إن شاء الله).

      `,
      messages,
      model: openai("gpt-4o-mini"),
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
//   messages,
//   context,
//   query,
// }: {
//   messages: Message[];
//   context: any[];
//   query: string;
// }) {
//   try {
//     // const enhancedModel = wrapLanguageModel({
//     //   model: openrouter("deepseek/deepseek-r1:free"),
//     //   middleware: extractReasoningMiddleware({ tagName: "think" }),
//     // });

//     const { text } = await generateText({
//       // model: enhancedModel,
//       messages,
//       model: azure("DeepSeek-V3"),
//       system: getQuizResponsePrompt({ context, query }),
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
//       model: openrouter("google/gemini-2.0-pro-exp-02-05:free"),
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
  context,
  query,
  numberOfQuestions = 3,
}: {
  context: any[];
  query: string;
  numberOfQuestions: number | undefined;
}) {
  try {
    const { partialObjectStream } = streamObject({
      model: anthropic("claude-3-5-sonnet-latest"),
      schema: quizResponseScheme(numberOfQuestions),
      prompt: getQuizResponsePrompt({ context, query }),
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
      model: anthropic("claude-3-5-haiku-latest"),
      schema: reinforcementSchema,
    });

    return object;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function enhancePompt({ query }: { query: string }) {
  try {
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Your job is to enhance the prompt of the user by adding arabic language to it wherever he has used arabic as engligh.
      ## Example:
      User: Where ustadh mentioned about Mowsoof sifah
      Assistant: Where ustadh mentioned about Mowsoof sifah موصوف صفة
      ------
      User: ${query}
      `,
    });
    return response.text;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
