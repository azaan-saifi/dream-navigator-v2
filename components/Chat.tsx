"use client";
import React, { useEffect, useState, useCallback } from "react";
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
  getGeneralResponse,
  getQueryType,
  getQuizResponse,
  getResourceResponse,
  getResources,
  getVideoResponse,
  getVideoTimestamps,
} from "@/lib/actions/messages.action";
import { getStreamingObjectResponse, getStreamingResponse } from "@/lib/utils";
import Quiz from "./Quiz";
import { v4 } from "uuid";

const MemoizedUserMessage = React.memo(UserMessage);
const MemoizedAssistantMessage = React.memo(AssistantMessage);

const quizResponsesMap = new Map();

const Chat = ({ welcome = false }: ChatProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "user",
      content: `This domain is for use in illustrative examples in documents.`,
    },
  ]);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState("sm");
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
      // localStorage.removeItem("initialMessage"); // Consider removing after processing
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
      // Determine query type based on content
      const data: QueryType = query.includes("quiz")
        ? "quiz"
        : query.includes("video")
        ? "video"
        : query.includes("resource")
        ? "resource"
        : "general";

      setLoadingMessage("");

      if (data === "video") {
        setLoadingMessage("Searching through the lectures...");
        const relevantChunks = await getVideoTimestamps({ input: query });
        const videoResponse = await getVideoResponse({ query, relevantChunks });
        await getStreamingResponse({
          setMessages,
          response: videoResponse,
          setLoadingMessage,
        });
      } else if (data === "resource") {
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
      } else if (data === "quiz") {
        setLoadingMessage("Creating the Quiz...");
        const { partialObjectStream } = await getQuizResponse();
        const quizId = v4();

        await getStreamingObjectResponse({
          setMessages,
          partialObjectStream: partialObjectStream,
          toolId: quizId,
          toolName: "quiz",
        });

        // Automatically activate the quiz after it's created
        setActiveQuizId(quizId);
        setLoadingMessage("");
      } else {
        setLoadingMessage("Generating the response...");
        // const generalResponse = await getGeneralResponse({
        //   messages: storeMessages,
        // });

        // await getStreamingResponse({
        //   setMessages,
        //   response: generalResponse,
        //   setLoadingMessage,
        // });

        // For now, using dummy response
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Lorem Ipsum is simply dummy text`,
          },
        ]);
        setLoadingMessage("");
      }
    } catch (error) {
      console.error(error);
      setError("Something went wrong, Click to regenerate response");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

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

  const activeQuiz =
    (activeQuizId &&
      messages.find((msg) => msg.tool?.id === activeQuizId)?.tool?.quizData) ||
    null;

  const quizTopic = messages.find((msg) => msg.tool?.id === activeQuizId)?.tool
    ?.quizTopic;

  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <div className="flex flex-col w-full max-w-3xl mx-auto sm:max-h-[480px] max-h-[540px]">
        {welcome ? (
          <Welcome />
        ) : (
          <div className="flex flex-col items-end justify-start h-full overflow-y-auto hide-scrollbar px-2 gap-3">
            {messages.map((message, index) => (
              <div
                key={`message-${index}`}
                className={`flex items-start max-w-[85%] max-sm:max-w-[95%] ${
                  message.role === "user"
                    ? "self-end"
                    : "self-start flex-row-reverse"
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
          quiz={
            activeQuiz &&
            messages.find((msg) => msg.tool?.id === activeQuizId)?.tool
              ?.quizData[1]
              ? true
              : false
          }
          pathname={pathname}
        />
      </div>

      {activeQuiz &&
        messages.find((msg) => msg.tool?.id === activeQuizId)?.tool
          ?.quizData[1] &&
        pathname === "/chat" && (
          <Quiz
            quizId={activeQuizId!}
            quizTopic={quizTopic!}
            quizData={activeQuiz}
            onClose={() => setActiveQuizId(null)}
            initial={initial}
            animate={animate}
            screenSize={screenSize}
          />
        )}
    </>
  );
};

export default Chat;
