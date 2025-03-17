/* eslint-disable no-undef */
"use client";
import React, { useEffect, useState } from "react";
import Welcome from "./Welcome";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  AssistantMessage,
  ErrorMessage,
  ThinkingMessage,
  UserMessage,
} from "./Message";
import ChatScrollAnchor from "./ChatScrollAnchor";
import TextArea from "./TextArea";
import {
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

const MemoizedUserMessage = React.memo(UserMessage);
const MemoizedAssistantMessage = React.memo(AssistantMessage);

const Chat = ({ welcome = false, userId }: ChatProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState("sm");
  // const [quizForm, setQuizForm] = useState<quizForm | undefined>();
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
      const data = await getQueryType({ query });
      console.log(data);
      setLoadingMessage("");

      if (data.queryType === "video") {
        setLoadingMessage("Searching through the lectures...");
        const relevantChunks = await getVideoTimestamps({ input: query });
        const videoResponse = await getVideoResponse({ query, relevantChunks });
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

        await getStreamingResponse({
          setMessages,
          response: resourceResponse,
          setLoadingMessage,
        });
      } else if (data.queryType === "quiz") {
        setLoadingMessage("Searching for the Knowledge...");

        let context;

        if (data.quizQueryProps?.lecture && data.quizQueryProps?.section) {
          context = await getQuizContext({
            section: data.quizQueryProps?.section,
            day: data.quizQueryProps?.lecture,
          });
        }

        if (!context) throw error;
        setQuizContext(context);
        console.log(context);

        // setLoadingMessage("Reasoning before the response...");
        // const { text } = await getQuizUnstructuredResponse({
        //   messages,
        //   context,
        //   query,
        // });

        // // console.log("Reasoning", reasoning);
        // // console.log("text", text);

        setLoadingMessage("Initialising quiz creation...");

        const { partialObjectStream } = await getQuizResponse({
          messages,
          context,
          query,
        });

        const quizId = v4();
        setActiveQuizId(quizId);

        await getStreamingObjectResponse({
          setMessages,
          partialObjectStream,
          toolId: quizId,
          toolName: "quiz",
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

        setLoadingMessage("");
      } else {
        setLoadingMessage("Generating the response...");
        const generalResponse = await getGeneralResponse({
          messages: storeMessages,
        });

        await getStreamingResponse({
          setMessages,
          response: generalResponse,
          setLoadingMessage,
        });

        setLoadingMessage("");
      }
    } catch (error) {
      console.error(error);
      setError("Something went wrong, Click to regenerate response");
    } finally {
      setLoadingMessage("");
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
      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: input },
      ];
      setMessages(newMessages);
      setInput("");
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
          <div className="hide-scrollbar flex h-full flex-col items-end justify-start gap-3 overflow-y-auto px-2">
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
                    <MemoizedUserMessage content={message.content} />
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
