/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import Welcome from "./Welcome";
import { useRouter, usePathname } from "next/navigation";
import {
  AssistantMessage,
  ErrorMessage,
  ThinkingMessage,
  UserMessage,
} from "./Message";
import ChatScrollAnchor from "./ChatScrollAnchor";
import TextArea from "./TextArea";
import {
  enhancePompt,
  getGeneralResponse,
  getQueryType,
  getQuizContext,
  getQuizResponse,
  getResourceResponse,
  getResources,
  getVideoResponse,
  getVideoTimestamps,
} from "@/lib/actions/messages.action";
import { getStreamingObjectResponse, getStreamingResponse } from "@/lib/utils";
import Quiz from "./Quiz";
import { v4 } from "uuid";
import { RecordMetadataValue } from "@pinecone-database/pinecone";
import { ChatProps, Message, QuizTool } from "@/types";
import QuizForm from "./QuizForm";
import toast from "react-hot-toast";

const MemoizedUserMessage = React.memo(UserMessage);
const MemoizedAssistantMessage = React.memo(AssistantMessage);

const Chat = ({ welcome = false, userId, picture }: ChatProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState("sm");
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizFormData, setQuizFormData] = useState<{
    lecture?: number[];
    section?: string;
    numberOfQuestions?: number;
    query: string;
  } | null>(null);
  const [quizContext, setQuizContext] = useState<
    {
      day: RecordMetadataValue | undefined;
      sectionName: RecordMetadataValue | undefined;
      lectureNotes: RecordMetadataValue | undefined;
    }[]
  >([]);

  const router = useRouter();
  const pathname = usePathname();

  // Handle screen size for animations
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setScreenSize("lg");
      } else {
        setScreenSize("md");
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const initial = {
    lg: { x: -10, opacity: 0 },
    md: { y: 20, opacity: 0 },
  };

  const animate = {
    lg: { x: 0, opacity: 1 },
    md: { y: 0, opacity: 1 },
  };

  // Process initial message from router
  useEffect(() => {
    const initialMessage = localStorage.getItem("initialMessage");

    if (initialMessage) {
      const newMessage: Message[] = [{ role: "user", content: initialMessage }];
      setMessages(newMessage);
      localStorage.removeItem("initialMessage");
      fetchResponse(newMessage);
    } else if (pathname !== "/") {
      router.push("/");
    }
  }, [router, pathname]);

  const fetchResponse = async (messagesToSend: Message[]) => {
    setError("");
    setLoadingMessage("Thinking...");
    const storeMessages = messagesToSend;
    const query = storeMessages[storeMessages.length - 1].content;

    try {
      // Start query type detection
      const queryTypePromise = getQueryType({ query });

      // Set a timeout to update loading message if query type detection takes too long
      const loadingTimeout = setTimeout(() => {
        setLoadingMessage("Processing your request...");
      }, 1500);

      const data = await queryTypePromise;
      clearTimeout(loadingTimeout);

      if (data.queryType === "video") {
        setLoadingMessage("Enhancing the prompt...");
        const enhancedPrompt = await enhancePompt({ query });

        setLoadingMessage("Searching through the lectures...");

        const relevantChunks = await getVideoTimestamps({
          input: enhancedPrompt,
        });
        const videoResponse = await getVideoResponse({ query, relevantChunks });

        // Loading message will be cleared inside the streaming function
        await getStreamingResponse({
          setMessages,
          response: videoResponse,
          setLoadingMessage,
        });
      } else if (data.queryType === "resource") {
        setLoadingMessage("Finding the relevant resources...");
        const relevantResources = await getResources({ input: query });
        const resourceResponse = await getResourceResponse({
          query,
          relevantResources,
        });

        // Loading message will be cleared inside the streaming function
        await getStreamingResponse({
          setMessages,
          response: resourceResponse,
          setLoadingMessage,
        });
      } else if (data.queryType === "quiz") {
        console.log(data);
        setLoadingMessage("Searching for the Knowledge...");

        // Check if we have both lecture and section
        if (data.quizQueryProps?.lecture && data.quizQueryProps?.section) {
          try {
            // Set a timeout for quiz context fetching
            const contextPromise = getQuizContext({
              section: data.quizQueryProps.section,
              day: data.quizQueryProps.lecture,
            });

            // Create a timeout promise that rejects after 8 seconds
            const timeoutPromise = new Promise<never>((resolve, reject) => {
              setTimeout(
                () => reject(new Error("Quiz context fetch timed out")),
                8000
              );
            });

            // Race the promises - whichever resolves/rejects first wins
            const context = await Promise.race([
              contextPromise,
              timeoutPromise,
            ]);

            if (!context || context.length === 0) {
              throw new Error(
                "No quiz content found for the specified section and days"
              );
            }

            console.log(context);

            setQuizContext(context);
            setLoadingMessage("Initialising quiz creation...");

            // Similar timeout approach for quiz response
            const quizResponsePromise = getQuizResponse({
              context,
              query,
              numberOfQuestions: data.quizQueryProps?.numberOfQuestions,
            });

            const quizTimeoutPromise = new Promise<never>((resolve, reject) => {
              setTimeout(
                () => reject(new Error("Quiz generation timed out")),
                50000
              );
            });

            // Define the expected return type from getQuizResponse using a more generic approach
            type QuizResponseType = {
              partialObjectStream: AsyncIterable<any> & ReadableStream<any>;
            };

            const quizResponse = (await Promise.race([
              quizResponsePromise,
              quizTimeoutPromise,
            ])) as QuizResponseType;

            const { partialObjectStream } = quizResponse;

            const quizId = v4();
            setActiveQuizId(quizId);

            // Loading message will be cleared inside the streaming function
            await getStreamingObjectResponse({
              setMessages,
              partialObjectStream,
              toolId: quizId,
              toolName: "quiz",
              setLoadingMessage,
              timeoutMs: 60000,
              transformTool: (tool) => ({
                ...tool,
                currentQuestion: 0,
                selectedAnswers: Array(tool.quizData.length).fill(null),
                showResults: false,
                answeredCorrectly: true,
                showExplanation: false,
                showReinforcement: false,
                reinforcementAnswer: null,
                reinforcementAttempts: 0,
                maxAttemptsReached: false,
                reinforcementQuestion: null,
                attemptedReinforcementQuestions: Array(
                  tool.quizData.length
                ).fill(false),
                explanationStates: Array(tool.quizData.length).fill(false),
                correctnessStates: Array(tool.quizData.length).fill(true),
              }),
            });
          } catch (quizError) {
            console.error("Quiz generation error:", quizError);
            setLoadingMessage("");
            // Add error message to chat
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content:
                  "I'm sorry, there was an error generating your quiz. This could be due to a timeout or server issue. Please try again or try asking for a quiz on a different topic.",
              },
            ]);
            // Also set the error state
            setError("Quiz generation failed. Please try again.");
          }
        } else {
          // If we only have partial information, show the quiz form
          setLoadingMessage("");
          setShowQuizForm(true);
          setQuizFormData({
            lecture: data.quizQueryProps?.lecture,
            section: data.quizQueryProps?.section,
            numberOfQuestions: data.quizQueryProps?.numberOfQuestions || 5,
            query,
          });
        }
      } else {
        setLoadingMessage("Generating the response...");

        // Start the API call to get the response without waiting for it
        const responsePromise = getGeneralResponse({
          messages: storeMessages,
        });

        // Keep the loading message until we actually have a response
        const generalResponse = await responsePromise;

        // Now process streaming response - loading message will be cleared inside the function
        await getStreamingResponse({
          setMessages,
          response: generalResponse,
          setLoadingMessage,
        });
      }
    } catch (error) {
      console.error(error);
      setError("Something went wrong, Click to regenerate response");
    } finally {
      setLoadingMessage("");
    }
  };

  const handleQuizFormSubmit = async (formData: {
    lecture: string;
    section: string;
    numberOfQuestions: number;
  }) => {
    if (!quizFormData) return;

    setShowQuizForm(false);
    setLoadingMessage("Searching for the Knowledge...");

    try {
      // Convert the lecture string to a number array
      const day = [parseInt(formData.lecture)];

      const context = await getQuizContext({
        section: formData.section,
        day,
      });

      if (!context) throw error;
      setQuizContext(context);

      setLoadingMessage("Initialising quiz creation...");

      const { partialObjectStream } = await getQuizResponse({
        context,
        query: quizFormData.query,
        numberOfQuestions: formData.numberOfQuestions,
      });

      const quizId = v4();
      setActiveQuizId(quizId);

      // Loading message will be cleared inside the streaming function
      await getStreamingObjectResponse({
        setMessages,
        partialObjectStream,
        toolId: quizId,
        toolName: "quiz",
        setLoadingMessage,
        timeoutMs: 120000, // 2 minute timeout for quiz generation
        transformTool: (tool) => ({
          ...tool,
          currentQuestion: 0,
          selectedAnswers: Array(tool.quizData.length).fill(null),
          showResults: false,
          answeredCorrectly: true,
          showExplanation: false,
          showReinforcement: false,
          reinforcementAnswer: null,
          reinforcementAttempts: 0,
          maxAttemptsReached: false,
          reinforcementQuestion: null,
          attemptedReinforcementQuestions: Array(tool.quizData.length).fill(
            false
          ),
          explanationStates: Array(tool.quizData.length).fill(false),
          correctnessStates: Array(tool.quizData.length).fill(true),
        }),
      });
    } catch (error) {
      console.error(error);
      setError("Something went wrong, Click to regenerate response");
    } finally {
      setLoadingMessage("");
      setQuizFormData(null);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    if (!userId) {
      toast.error("Please login first");
      return;
    }

    if (pathname === "/") {
      localStorage.setItem("initialMessage", input);
      router.push("/chat");
    } else {
      // Immediately update UI with user message
      const userContent = input;
      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: userContent },
      ];

      // Clear input field immediately for better UX
      setInput("");

      // Update messages state
      setMessages(newMessages);

      // Show thinking message right away
      setLoadingMessage("Thinking...");

      // Then process the response in the background
      await fetchResponse(newMessages);
    }
  }

  async function handleRegenerate(messagesToSend: Message[]) {
    await fetchResponse(messagesToSend);
  }

  const handleQuizSelect = (quizId: string) => {
    if (quizId === activeQuizId) {
      setActiveQuizId(null);
    } else {
      setActiveQuizId(quizId);
    }
  };

  // New function to update quiz state in the messages array
  const updateQuizState = (quizId: string, updates: Partial<QuizTool>) => {
    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        if (message.tool && message.tool.id === quizId) {
          return {
            ...message,
            tool: {
              ...message.tool,
              ...updates,
            },
          };
        }
        return message;
      });
    });
  };

  // Find the active quiz tool
  const activeQuizTool = messages.find(
    (msg) => msg.tool?.id === activeQuizId
  )?.tool;

  // Check if the active quiz has quiz data
  const hasQuizData = activeQuizTool?.quizData && activeQuizTool.quizData[1];

  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <div className="mx-auto flex max-h-[540px] w-full max-w-3xl flex-col sm:max-h-[480px]">
        {welcome ? (
          <Welcome />
        ) : (
          <div className="hide-scrollbar flex h-full flex-col items-end justify-start gap-3 overflow-y-auto p-2">
            {messages.map((message, index) => (
              <div
                key={`message-${index}`}
                className={`flex max-w-[85%] items-start max-sm:max-w-[95%] ${
                  message.role === "user"
                    ? "self-end"
                    : "flex-row-reverse self-start"
                } mb-4`}
              >
                {message.role === "user" ? (
                  <div className="flex flex-col">
                    <MemoizedUserMessage
                      content={message.content}
                      picture={picture}
                    />
                    <ChatScrollAnchor messages={messages} />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* Only show loading for the last message */}
                    {loadingMessage &&
                    index === messages.length - 1 &&
                    !message.content &&
                    !message.tool ? (
                      <ThinkingMessage content={loadingMessage} />
                    ) : message.content ? (
                      <MemoizedAssistantMessage content={message.content} />
                    ) : message.tool ? (
                      <MemoizedAssistantMessage
                        tool={message.tool}
                        onQuizSelect={() =>
                          handleQuizSelect(message.tool?.id || "")
                        }
                      />
                    ) : null}
                    <ChatScrollAnchor messages={messages} />
                  </div>
                )}
              </div>
            ))}
            {/* Show loading message after all messages if needed */}
            {loadingMessage && lastMessage?.role === "user" && (
              <ThinkingMessage content={loadingMessage} />
            )}
            {error && (
              <ErrorMessage
                handleRegenerate={handleRegenerate}
                messages={messages}
                content={error}
              />
            )}

            {/* Show Quiz Form when needed */}
            {showQuizForm && quizFormData && (
              <div className="mx-auto my-4 w-full max-w-md self-start">
                <QuizForm
                  initialLecture={quizFormData.lecture}
                  initialSection={quizFormData.section}
                  initialNumberOfQuestions={quizFormData.numberOfQuestions}
                  onSubmit={handleQuizFormSubmit}
                />
              </div>
            )}
          </div>
        )}

        <TextArea
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          quiz={!!(activeQuizTool && hasQuizData)}
          pathname={pathname}
        />
      </div>

      {activeQuizTool && hasQuizData && pathname === "/chat" && (
        <Quiz
          quizId={activeQuizId!}
          quizTopic={activeQuizTool.quizTopic}
          quizData={activeQuizTool.quizData}
          onClose={() => setActiveQuizId(null)}
          initial={initial}
          animate={animate}
          screenSize={screenSize}
          quizTool={activeQuizTool}
          context={quizContext}
          onUpdateQuizState={updateQuizState}
        />
      )}
    </>
  );
};

export default Chat;
