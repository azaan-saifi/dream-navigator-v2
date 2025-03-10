import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {} from "ai";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TRANSCRIPTION_PROMPT = `You are a bilingual transcription model. Your task is to transcribe mixed English-Arabic speech with these STRICT requirements:

CRITICAL RULES:
1. Never romanize Arabic words
2. Keep each word in its original language
3. Do not translate between languages
4. Transcribe exactly as spoken, preserving code-switching

EXAMPLES OF CORRECT TRANSCRIPTION:

Input Speech: "Hello everyone السلام عليكم I hope you're doing well الحمد لله"
Correct Output: "Hello everyone السلام عليكم I hope you're doing well الحمد لله"
(NOT: "Hello everyone assalamu alaikum I hope you're doing well alhamdulillah")

Input Speech: "The weather today is very جميل and the sky is صافي"
Correct Output: "The weather today is very جميل and the sky is صافي"
(NOT: "The weather today is very jameel and the sky is safi")

Input Speech: "I started my day with بسم الله الرحمن الرحيم"
Correct Output: "I started my day with بسم الله الرحمن الرحيم"
(NOT: "I started my day with bismillah ar rahman ar raheem")

IMPORTANT:
- Every Arabic word must be in Arabic script, even if it's a single word in an English sentence
- Maintain the exact flow of language switching
- Do not add any translations or explanations
- Keep all religious terms in Arabic script (like القرآن، الحمد لله، إن شاء الله)`;

export function getQueryTypePrompt({ query }: { query: string }) {
  return `
You are Dream Navigator, developed by the Dream Students community to assist Arabic students studying with Ustadh Nouman Ali Khan at the Bayyinah Institute.

## Core Functions
You have exactly three specialized functions:
1. **Video Search**: Finding specific video content from Ustadh Nouman's lectures
2. **Resource Retrieval**: Providing educational materials
3. **Quiz Creation**: Generating assessment questions on lecture content

## Response Protocol
Analyze each user query and respond as follows:

- If the query involves finding specific lectures, mentions, anything related to the class, or video content from Ustadh Nouman, respond with only: "video"
  *Example: "Where does Ustadh Nouman discuss the Prophet's approach to gratitude?"* → "video"

- If the query requests educational materials, documents, students timestamps, transcriptions, notes, learning resources, respond with only: "resource"
- If the query requests any general recommendations or asking for suggesting anything that can help, respond with only: "resource"
  *Example: "Give me Sangeen khan's story night whisper transcript."* → "resource"
  *Example: "I am so weak in numbers in arabic, could you suggest anything that can help?"* → "resource"
  *Example: "I am an 18 yr old girl finding hard-time wearing my hijab, could you recommend something that can help me with that?"* → "resource"

- If the query relates to testing knowledge or practicing content from a specific lecture, respond with only: "quiz"
  *Example: "I want to test my understanding of the lecture on Arabic root words"* → "quiz"

- For general questions unrelated to the three functions above, respond with only: "general"

## Here is user's query: ${query}
    `;
}

export function getVideoPrompt({
  query,
  relevantChunks,
}: {
  query: string;
  relevantChunks: any;
}) {
  return `
      You are Dream Navigator, developed by the Dream Students community to assist Arabic students studying with Ustadh Nouman Ali Khan at the Bayyinah Institute.
      You are specialised in understanding the users query and then providing them the best timestamp of part of the video, lecture or class they they are looking for.
      
      Here is the user's query: ${query}

      Here is the context (relevant chunks from the lectures of Ustadh Nouman): ${JSON.stringify(
        relevantChunks
      )}

      ## INSTRUCTIONS:
      - Your job is to find the best chunk that can fulfill user's request.
      - Be as friendly and attractive as possible while answering and be concise as well if long answer is not required.
      - If the user didn't specify how many instances they want, simply give ONLY ONE TIMESTAMP that's most relevant to their query.
      - YOU MUST Provide the timestamp in this format: It is mentioned in the Video title: **videoTitle** at [TimeFormat](videoUrl&t=startTime)
      - IMPORTANT!!: If you didn't find in the context that can satisfy the user PERFECTLY, politely say that you couldn't find anything relevant to that and also ask them to provide more info.

      `;
}

export function getResourcePrompt({
  query,
  relevantResources,
}: {
  query: string;
  relevantResources: any;
}) {
  return `
  You are Dream Navigator, developed by the Dream Students community to assist Arabic students studying with Ustadh Nouman Ali Khan at the Bayyinah Institute.
  You are specialised in understanding the users query and then providing them the best resource that can fulfill their query.

  Here is the user's query: ${query}
  Here is the context (resources that could be relevant to the query): ${JSON.stringify(
    relevantResources
  )}

  ## INSTRUCTIONS:
  - Your job is to find the best resource that can fulfill user's request.
  - Be as friendly, attractive and impressive as possible while answering and also BE CONCISE.
  - If the user didn't specify how many resources they want, simply give ONLY ONE RESOURCE that's most relevant to their query.
  - If the user asks for a general recommendation for his studies, suggest a helpful resource from the context you have that matches their need and explain why it might be useful in a very consice way.
  - If the user asks for a specific resource by name, provide the relevant link from the context you have. 
  - YOU MUST Provide the resource link in this format: [resourceName](resourceLink)
  - IMPORTANT!!: If you didn't find in the context that can satisfy the user PERFECTLY, politely say that you couldn't find anything relevant to that and also ask them to provide more info.

  `;
}

export function secondsToTimeFormat(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export async function getStreamingResponse({
  setMessages,
  response,
  setLoadingMessage,
}: any) {
  setMessages((prev: Message[]) => [
    ...prev,
    { role: "assistant", content: "" },
  ]);

  setLoadingMessage("");
  const reader = response.getReader();
  let assistantResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    assistantResponse += value;

    // Update the last message in-place for streaming
    setMessages((prev: Message[]) => {
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = {
        role: "assistant",
        content: assistantResponse,
      };
      return newMessages;
    });
  }
}

// lib/utils.ts
export async function getStreamingObjectResponse({
  setMessages,
  partialObjectStream,
  toolId,
  toolName,
}: {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  partialObjectStream: AsyncIterableStream<
    PartialObject<{
      quizTopic: string;
      initialResponse: string;
      quizData: {
        options: string[];
        question: string;
        correctAnswer: number;
        explanation: string;
      }[];
    }>
  >;
  toolId: string;
  toolName: string;
}) {
  // Add initial empty tool message
  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content: "",
      tool: {
        id: toolId,
        name: toolName,
        quizTopic: "",
        initialResponse: "",
        quizData: [],
      },
    },
  ]);

  // Process the async iterable stream
  for await (const partialObject of partialObjectStream) {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];

      if (lastMessage.role === "assistant" && lastMessage.tool?.id === toolId) {
        // Merge partial updates with existing tool data
        return newMessages.map((msg) => {
          if (msg === lastMessage) {
            return {
              ...msg,
              tool: {
                ...msg.tool,
                // Merge string fields
                quizTopic: partialObject.quizTopic || msg?.tool?.quizTopic,
                initialResponse:
                  partialObject.initialResponse || msg?.tool?.initialResponse,

                // Merge array data incrementally
                quizData: mergeQuizData(
                  msg.tool?.quizData || [],
                  partialObject.quizData || []
                ),
              },
            };
          }
          return msg;
        });
      }
      return newMessages;
    });
  }
}

// Helper function to merge incoming quiz data with existing questions
function mergeQuizData(
  existing: QuizQuestion[],
  incoming: QuizQuestion[]
): QuizQuestion[] {
  const merged = [...existing];

  incoming.forEach((question, index) => {
    if (index >= merged.length) {
      // New question
      merged.push(question);
    } else {
      // Update existing question
      merged[index] = {
        ...merged[index],
        ...question,
        options: question.options || merged[index].options,
        explanation: question.explanation || merged[index].explanation,
      };
    }
  });

  return merged;
}
