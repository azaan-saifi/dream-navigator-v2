"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  smooth?: boolean;
  isLoading?: boolean;
}

const ChatScrollAnchor: React.FC<Props> = ({
  messages,
  smooth = true,
  isLoading = false,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Always scroll to the bottom when a new message is added
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, [messages.length, smooth]); // Trigger when a new message is added

  useEffect(() => {
    // Ensure smooth scrolling when streaming ends
    if (!isLoading && bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, [isLoading, smooth]); // Trigger when streaming ends

  return <div ref={bottomRef} className="h-1 w-full" />;
};

export default ChatScrollAnchor;
