/* eslint-disable no-undef */
"use client";
import { motion } from "framer-motion";
import { TextShimmer } from "./TextShimmer";
import { IoSparklesSharp } from "react-icons/io5";
import { Markdown } from "./Markdown";
import Image from "next/image";
import { Loader2, UserIcon } from "lucide-react";
import { MdError } from "react-icons/md";
import { FaUndoAlt } from "react-icons/fa";
import { GiBrain } from "react-icons/gi";
import { Skeleton } from "@/components/ui/skeleton";
import AutoDetectLanguage from "./AutoDetectLanguage";
import { AssistantMessageProps, UserMessageProps, Message } from "@/types";

export const ThinkingMessage = ({ content }: { content: string }) => {
  return (
    <motion.div
      className="mx-auto w-full max-w-3xl pb-10 "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex w-full gap-4 rounded-lg max-sm:gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-white">
          <IoSparklesSharp />
        </div>

        <TextShimmer duration={1.0}>{content}</TextShimmer>
      </div>
    </motion.div>
  );
};

export const AssistantMessage = ({
  content,
  tool,
  onQuizSelect,
}: AssistantMessageProps) => {
  return (
    <motion.div
      className="mx-auto max-w-3xl"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {content && (
        <div className="flex items-start justify-start gap-4 rounded-lg max-sm:gap-2">
          <div className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-white">
            <IoSparklesSharp />
          </div>
          <div className="rounded-lg border border-zinc-700 bg-dark-200 p-3">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      )}
      {tool && (
        <div className="flex items-start justify-start gap-4 rounded-lg max-sm:gap-2">
          <div className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-white">
            <IoSparklesSharp />
          </div>
          <div className="flex flex-col items-start gap-2 rounded-lg border border-zinc-700 bg-dark-200 px-5 py-3">
            {tool.initialResponse ? (
              <Markdown>{tool.initialResponse}</Markdown>
            ) : (
              <Skeleton className="h-4 w-full bg-dark-shimmer" />
            )}
            {tool.quizData && (
              <motion.div
                onClick={onQuizSelect}
                aria-disabled={tool.quizData[2]}
                className="flex w-full cursor-pointer items-stretch rounded-lg border border-zinc-700 bg-dark-hard hover:border-zinc-500 hover:bg-dark-100"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex w-14 items-center justify-center border-r border-r-zinc-700 p-3 max-sm:w-12">
                  {tool.quizData[2] ? (
                    <GiBrain className="text-3xl text-white max-sm:text-xl" />
                  ) : (
                    <Loader2 className="animate-spin text-3xl text-dark-300" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div className="font-semibold text-white">
                    {tool.quizTopic ? (
                      <div className="max-w-full overflow-hidden">
                        <AutoDetectLanguage
                          className="block max-md:text-[16px] max-sm:max-w-48 max-sm:truncate"
                          text={tool.quizTopic}
                        />
                      </div>
                    ) : (
                      <Skeleton className="h-6 w-full max-w-xs bg-dark-shimmer" />
                    )}
                  </div>
                  {tool.quizData[2] && (
                    <div className="mt-1 text-sm text-zinc-400">
                      <AutoDetectLanguage text="Click to open" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const ErrorMessage = ({
  content,
  handleRegenerate,
  messages,
}: {
  content: string;
  handleRegenerate: (messagesToSend: Message[]) => Promise<void>;
  messages: Message[];
}) => {
  return (
    <motion.div
      className="mx-auto w-full max-w-3xl pb-10"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex w-full gap-4 rounded-lg max-sm:gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold-100 bg-gold-transparant text-gold-100">
          <MdError />
        </div>

        <div
          onClick={() => handleRegenerate(messages)}
          className="flex cursor-pointer items-center justify-start gap-4 max-sm:flex-col"
        >
          <div className=" max-w-[85%] rounded-lg border border-gold-100 bg-gold-transparant p-3 text-gold-100">
            {content}
          </div>
          <FaUndoAlt className="size-6 text-gold-100" />
        </div>
      </div>
    </motion.div>
  );
};

export const UserMessage = ({ content, picture }: UserMessageProps) => {
  return (
    <motion.div
      className="mx-auto w-full max-w-3xl "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex w-full items-start  justify-end gap-4 rounded-lg max-sm:gap-2">
        <div className=" max-w-[85%] rounded-lg bg-primary-100 p-3 text-white">
          {content}
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-600 text-white">
          {picture ? (
            <Image src={picture} height={32} width={32} alt="User" />
          ) : (
            <UserIcon />
          )}
        </div>
      </div>
    </motion.div>
  );
};
