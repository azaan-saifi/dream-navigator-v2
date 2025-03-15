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

export const ThinkingMessage = ({ content }: { content: string }) => {
  return (
    <motion.div
      className="mx-auto w-full max-w-3xl pb-10 "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex w-full gap-4 rounded-lg max-sm:gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-white">
          <IoSparklesSharp />
        </div>

        <TextShimmer duration={1.5}>{content}</TextShimmer>
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
    >
      {content && (
        <div className="flex items-start justify-start gap-4 rounded-lg max-sm:gap-2">
          <div className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-white">
            <IoSparklesSharp />
          </div>
          <div className="border p-3 rounded-lg border-zinc-700 bg-dark-200">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      )}
      {tool && (
        <div className="flex items-start justify-start gap-4 rounded-lg max-sm:gap-2">
          <div className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-white">
            <IoSparklesSharp />
          </div>
          <div className="flex py-3 px-5 flex-col border-zinc-700 bg-dark-200 rounded-lg border gap-2 items-start">
            {tool.initialResponse ? (
              <Markdown>{tool.initialResponse}</Markdown>
            ) : (
              <Skeleton className="w-full h-4 bg-dark-shimmer" />
            )}
            {tool.quizData && (
              <motion.div
                onClick={onQuizSelect}
                aria-disabled={tool.quizData[2]}
                className="flex items-stretch bg-dark-hard rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-dark-100 cursor-pointer w-full"
              >
                <div className="w-14 max-sm:w-12 flex items-center justify-center border-r border-r-zinc-700 p-3">
                  {tool.quizData[2] ? (
                    <GiBrain className="text-white text-3xl max-sm:text-xl" />
                  ) : (
                    <Loader2 className="animate-spin text-dark-300 text-3xl" />
                  )}
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div className="text-white font-semibold">
                    {tool.quizTopic ? (
                      <div className="max-w-full overflow-hidden">
                        <AutoDetectLanguage
                          className="max-md:text-[16px] block max-sm:max-w-48 max-sm:truncate"
                          text={tool.quizTopic}
                        />
                      </div>
                    ) : (
                      <Skeleton className="h-6 bg-dark-shimmer w-full max-w-xs" />
                    )}
                  </div>
                  {tool.quizData[2] && (
                    <div className="text-sm text-zinc-400 mt-1">
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
  handleRegenerate: (messages: Message[]) => Promise<void>;
  messages: Message[];
}) => {
  return (
    <motion.div
      className="mx-auto w-full max-w-3xl pb-10"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex w-full gap-4 rounded-lg max-sm:gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-transparant border border-gold-100 text-gold-100">
          <MdError />
        </div>

        <div
          onClick={() => handleRegenerate(messages)}
          className="flex max-sm:flex-col items-center justify-start gap-4 cursor-pointer"
        >
          <div className=" rounded-lg border border-gold-100 bg-gold-transparant p-3 text-gold-100 max-w-[85%]">
            {content}
          </div>
          <FaUndoAlt className="text-gold-100 size-6" />
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
        <div className=" rounded-lg bg-primary-100 p-3 text-white max-w-[85%]">
          {content}
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-600 text-white">
          {picture ? (
            <Image
              src={JSON.parse(picture)}
              height={32}
              width={32}
              alt="User"
            />
          ) : (
            <UserIcon />
          )}
        </div>
      </div>
    </motion.div>
  );
};
