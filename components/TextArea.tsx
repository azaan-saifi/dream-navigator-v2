/* eslint-disable no-undef */
"use client";
import React, { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { IoSend } from "react-icons/io5";
import { TextAreaProp } from "@/types";

const TextArea = ({
  input,
  setInput,
  handleSubmit,
  quiz,
  pathname,
}: TextAreaProp) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect mobile devices
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 208; // max-h-52 (13rem * 16px = 208px)
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;

      // Scroll to bottom when content exceeds max height
      if (newHeight >= maxHeight) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, [input]);
  return (
    <div
      id="searchBar"
      className={`absolute ${
        quiz && pathname === "/chat" && "md:w-[48%] xl:w-[58%]"
      } inset-x-2 bottom-0 py-4 max-lg:inset-x-2 sm:pb-12`}
    >
      <form
        className="relative mx-auto flex w-full max-w-3xl"
        onSubmit={handleSubmit}
      >
        <textarea
          ref={textareaRef}
          className="h-[48px] w-full resize-none overflow-hidden rounded-xl border border-zinc-700 bg-dark-200 py-4 pl-6 pr-16 text-[16px] text-white outline-none placeholder:text-zinc-400 focus-within:outline-none"
          placeholder="Send a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Mobile handling
            if (isMobile()) {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setInput((prev: string) => prev + "\n");
              }
            }
            // Desktop handling
            else {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.ctrlKey &&
                !e.metaKey
              ) {
                handleSubmit(e);
              }
            }
          }}
          rows={1}
        />
        <Button
          type="submit"
          disabled={!input.length}
          className="absolute bottom-1.5 right-2 size-11 rounded-lg bg-primary-100 text-white"
        >
          <IoSend />
        </Button>
      </form>
    </div>
  );
};

export default TextArea;
