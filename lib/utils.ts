/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import { Message, QuizQuestion } from "@/types";

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;
// type PartialObject<T> = { [P in keyof T]?: T[P] | undefined };

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
- If the query explicitly requests recommendations or materials like "Could you suggest a resource/book/video that can help with..." respond with only: "resource"
  *Example: "Give me Sangeen khan's story night whisper transcript."* → "resource"
  *Example: "Can you recommend any resources to help me with numbers in Arabic?"* → "resource"
  *Example: "I am an 18 yr old girl finding hard-time wearing my hijab, could you recommend something that can help me with that?"* → "resource"

- If the query is asking about Arabic grammar, linguistic concepts, or technical explanations (like negation, verb forms, plural patterns, etc.) without specifically requesting a resource, respond with only: "general"
  *Example: "What are ways to negate a verb (fi'l) in Arabic?"* → "general"
  *Example: "How does negation of fi'l work in Arabic?"* → "general"
  *Example: "Can you explain the difference between لا and لم?"* → "general"

- If the query relates to testing knowledge or practicing content from a specific lecture from Intensive 1 and 2 ONLY, then respond with "quiz":
  --> GOAL: We need to collect 3 things from the query = {section name}, {day(s) name}, {number of questions}. If the user didn't specify the number of questions, simply give 3 questions.

  ## Possibility 1:
    - Query specfies both of them:
    *Example: "Create a quiz on Dream Intensive one day 10"* → "quiz", "intensive-1", [10]
  
  ## Possibility 2:
    - Query specfies one of them:
    *Example: "Create a quiz on Dream Intensive 1"* → "quiz", "intensive-1"
    *Example: "Create a quiz on day 4"* → "quiz", [4]

  ## Possibility 3:
    - Query specfies timeline of days:
    *Example: "Create a quiz on Dream Intensive 2 from day four to 7"* → "quiz", "intensive-2", [4, 5, 6, 7]

  ## IMPORTANT: If the query mentions ANY section name other than Intensive 1 and Intensive 2, you MUST classify it as "general" instead of "quiz"
    *Example: "Create a quiz on Dream Intensive 3 day 5"* → "general"
    *Example: "Create a quiz on Advance Nahw"* → "general"
    *Example: "Make a test for Intensive 4"* → "general"
    *Example: "Quiz me on Advance sarf day 8"* → "general"

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
  - FIRST, carefully evaluate if any of the provided resources truly match the user's query. Only proceed if there's a genuine match.
  - If the resources provided are not directly relevant to the user's specific question or topic, DO NOT suggest them. Instead, clearly state that you don't have relevant resources on that specific topic.
  - Before recommending any resource, verify that its content specifically addresses the user's query - don't recommend general resources for specific questions.
  - Your job is to find the best resource that can fulfill user's request, but only if such a resource actually exists in the provided context.
  - Be as friendly, attractive and impressive as possible while answering and also BE CONCISE.
  - If the user didn't specify how many resources they want, simply give ONLY ONE RESOURCE that's most relevant to their query.
  - If the user asks for a general recommendation for his studies, suggest a helpful resource from the context you have that matches their need and explain why it might be useful in a very concise way.
  - If the user asks for a specific resource by name, provide the relevant link from the context you have. 
  - YOU MUST Provide the resource link in this format: [resourceName](resourceLink)
  - CRITICAL: If you don't find anything in the context that can satisfy the user's query PERFECTLY, explicitly state: "I don't have specific resources on [topic]. This would be better answered as a general question." DO NOT provide marginally related resources that don't directly address the query.

  `;
}

export function getQuizResponsePrompt({
  context,
  query,
}: {
  context: any[];
  query: string;
}) {
  return `
  You are an expert quiz designer with mastery in classical Arabic, tasked with creating challenging, concept-driven MCQs based on the provided lecture Notes to test a student's deep understanding. Follow these guidelines:

1. Thoroughly analyze the lecture content to identify core concepts, principles, and their practical applications.

2. Create questions that test deeper understanding rather than simple recall. Questions should:
   - Focus on areas where learners commonly make mistakes or misunderstand.
   - Require application of concepts to new scenarios
   - Test the ability to synthesize multiple ideas from the lecture
   - Evaluate critical thinking about the material
   - Challenge students to recognize implications or extensions of the concepts

3. For each question:
   - Craft a clear stem that presents a problem or scenario
   - Provide exactly one correct answer not multiple possibilities.
   - Create plausible wrong answers that reflect common misconceptions or partial understanding. Avoid generic/obvious distractors.

4. Create questions at varying difficulty levels:
   - 20% basic understanding (but not simple recall)
   - 50% application of concepts
   - 30% advanced analysis or synthesis

5. Only use information that can be reasonably derived from the lecture transcript. Do not introduce concepts not covered in the material.

6. Design questions that would challenge even students who have memorized the lecture but haven't truly understood the concepts.

7. Where appropriate, include practical scenarios where the concepts would be applied in real-world contexts.

8. Ensure all questions and answer choices are culturally appropriate for Arabic language learners.

9. Use the same terminology and explanatory frameworks that the teacher used in the lectures. Students are familiar with these specific terms, so maintain consistency with how concepts were originally taught.

10. Make sure YOU DON'T REPEAT THE SAME QUESTIONS THAT YOU'VE ALREADY GENERATED.

## Here is the Relevant Context: ${JSON.stringify(context)}
## Here is the user's query: ${query}
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
  // Add initial empty assistant message immediately
  setMessages((prev: Message[]) => [
    ...prev,
    { role: "assistant", content: "" },
  ]);

  const reader = response.getReader();
  let assistantResponse = "";
  let firstChunkReceived = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Clear loading message after receiving the first chunk
      if (!firstChunkReceived && value) {
        firstChunkReceived = true;
        setLoadingMessage("");
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
  } catch (error) {
    console.error("Streaming error:", error);
    // Still display what we've received so far
    if (assistantResponse) {
      setMessages((prev: Message[]) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content:
            assistantResponse ||
            "Sorry, there was an error generating the response.",
        };
        return newMessages;
      });
    }

    // If no data was received at all before the error
    if (!firstChunkReceived) {
      setLoadingMessage("");
    }
  } finally {
    // Ensure loading message is cleared in all cases
    setLoadingMessage("");

    // Close the reader in case of an error
    try {
      reader.releaseLock();
    } catch {
      // Ignore errors from releasing the lock
    }
  }
}

// lib/utils.ts
export async function getStreamingObjectResponse({
  setMessages,
  partialObjectStream,
  toolId,
  toolName,
  transformTool, // Add this parameter to handle custom transformations
  setLoadingMessage, // Add loading message parameter
  timeoutMs = 90000, // Add timeout parameter with a default of 90 seconds
}: {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  partialObjectStream: AsyncIterableStream<any>;
  toolId: string;
  toolName: string;
  transformTool?: (tool: any) => any; // Optional function to transform the tool data
  setLoadingMessage?: (message: string) => void; // Optional function to set loading message
  timeoutMs?: number; // Optional timeout in milliseconds
}) {
  // Add initial empty tool message with initialized state fields
  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content: "",
      tool: transformTool
        ? transformTool({
            id: toolId,
            name: toolName,
            quizTopic: "",
            initialResponse: "",
            quizData: [],
          })
        : {
            id: toolId,
            name: toolName,
            quizTopic: "",
            initialResponse: "",
            quizData: [],
          },
    },
  ]);

  let firstChunkReceived = false;
  let timeoutId: NodeJS.Timeout | null = null;

  // Set a timeout that will run if we don't get any data
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      if (!firstChunkReceived) {
        console.error("Streaming object response timed out");
        if (setLoadingMessage) {
          setLoadingMessage("");
        }

        // Show error message in chat
        setMessages((prev) => {
          const newMessages = [...prev];
          // Find the last message that should have our tool
          const lastToolMsg = newMessages.findIndex(
            (msg) => msg.role === "assistant" && msg.tool?.id === toolId
          );

          if (lastToolMsg >= 0) {
            // Replace the tool message with an error message
            newMessages[lastToolMsg] = {
              role: "assistant",
              content:
                "I'm sorry, generating this content took too long. Please try again or try with different parameters.",
            };
          } else {
            // Add a new error message if we couldn't find the tool message
            newMessages.push({
              role: "assistant",
              content:
                "I'm sorry, generating this content took too long. Please try again or try with different parameters.",
            });
          }
          return newMessages;
        });
      }
    }, timeoutMs);
  }

  try {
    // Process the async iterable stream
    for await (const partialObject of partialObjectStream) {
      // Clear timeout once we receive data
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Clear loading message after receiving the first chunk
      if (!firstChunkReceived && setLoadingMessage) {
        firstChunkReceived = true;
        setLoadingMessage("");
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];

        if (
          lastMessage.role === "assistant" &&
          lastMessage.tool?.id === toolId
        ) {
          // Merge partial updates with existing tool data
          return newMessages.map((msg) => {
            if (msg === lastMessage) {
              const updatedTool = {
                id: toolId,
                name: toolName,
                ...msg.tool,
                // Merge string fields
                quizTopic:
                  partialObject.quizTopic || msg?.tool?.quizTopic || "",
                initialResponse:
                  partialObject.initialResponse ||
                  msg?.tool?.initialResponse ||
                  "",
                // Merge array data incrementally
                quizData: mergeQuizData(
                  msg.tool?.quizData || [],
                  partialObject.quizData || []
                ),
              };

              return {
                ...msg,
                tool: transformTool ? transformTool(updatedTool) : updatedTool,
              };
            }
            return msg;
          });
        }
        return newMessages;
      });
    }
  } catch (error) {
    console.error("Streaming object error:", error);

    // Clear the timeout if it's still active
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // If we received any data before the error, keep it displayed
    if (!firstChunkReceived && setLoadingMessage) {
      // If no data was received at all, clear the loading message
      setLoadingMessage("");

      // Add an error message to the chat
      setMessages((prev) => {
        const newMessages = [...prev];
        // Find the last message that should have our tool
        const lastToolMsg = newMessages.findIndex(
          (msg) => msg.role === "assistant" && msg.tool?.id === toolId
        );

        if (lastToolMsg >= 0) {
          // Replace the tool message with an error message
          newMessages[lastToolMsg] = {
            role: "assistant",
            content:
              "I'm sorry, there was an error generating the content. Please try again.",
          };
        } else {
          // Add a new error message if we couldn't find the tool message
          newMessages.push({
            role: "assistant",
            content:
              "I'm sorry, there was an error generating the content. Please try again.",
          });
        }
        return newMessages;
      });
    }
  } finally {
    // Ensure loading message is cleared even if an error occurs
    if (setLoadingMessage) {
      setLoadingMessage("");
    }
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
