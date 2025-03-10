"use server";
import {
  getQueryTypePrompt,
  getResourcePrompt,
  getVideoPrompt,
  secondsToTimeFormat,
} from "@/lib/utils";
import { openai } from "@ai-sdk/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateObject, generateText, streamObject, streamText } from "ai";
import OpenAI from "openai";
import { z } from "zod";
import {
  quizDataSchema,
  quizResponseScheme,
  reinforcementSchema,
} from "../validations";

const embeddingModel = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
const resourceIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME_RESOURCE!);

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
      schema: z.object({
        queryType: z.union([
          z.literal("video"),
          z.literal("resource"),
          z.literal("quiz"),
          z.literal("general"),
        ]),
      }),
    });
    return object.queryType;
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
3. **Quiz Creation**: Generating assessment questions on lecture content

- Or just answer user's query like helping them in grasping any arabic concepts or anything they want.
- Be as friendly, attractive and impressive as possible while answering.
- Be very concise if long answer is not required.

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

export async function getQuizResponse() {
  try {
    const { partialObjectStream } = streamObject({
      system: `You are a helpful assistant whose job is to create a MCQ quiz based on user's query.`,
      model: openai("gpt-4o-mini"),
      schema: quizResponseScheme,
      prompt: "Create a quiz on french revolution.",
    });

    return { partialObjectStream };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getReinforcementQuestion({
  question,
  incorrectOption,
}: {
  question: QuizQuestion;
  incorrectOption: number;
}) {
  try {
    const { object } = await generateObject({
      prompt: `
# Reinforcement Question Generator

You are an adaptive learning expert specializing in creating targeted follow-up questions based on student misconceptions. Your task is to create a highly effective reinforcement question when a learner answers incorrectly.

## Input Context
Original question the user answered incorrectly: ${question}
and here is the incorrect option index he chose for this question: ${incorrectOption}

## Instructions
1. **Analyze the misconception**: Identify the specific knowledge gap or misunderstanding that likely led to the incorrect answer.

2. **Create a new question** that:
   - Approaches the same concept from a different angle
   - Is slightly easier than the original question (70-80% difficulty)
   - Includes clear, unambiguous answer choices
   - Has one definitively correct answer and plausible distractors
   - Isolates the specific concept the learner struggled with

3. **Ensure the explanation**:
   - Explicitly addresses why each incorrect option is wrong
   - Provides a concise, memorable explanation of the core concept
   - Connects back to the original question to reinforce understanding

## Guidelines
- Focus on fundamental understanding rather than memorization
- Use concrete examples when possible
- Keep language clear and accessible
- Ensure the question tests understanding, not just recall
      `,
      model: openai("gpt-4o-mini"),
      schema: reinforcementSchema,
    });

    return object;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
