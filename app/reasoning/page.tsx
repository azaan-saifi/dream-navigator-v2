"use client";

import { useChat } from "@ai-sdk/react";

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat({
    api: "/api/reasoning",
  });

  return (
    <>
      {messages.map((message) => (
        <div key={message.id} className="text-white">
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, index) => {
            // text parts:
            if (part.type === "text") {
              return (
                <div className="mt-10" key={index}>
                  {part.text}
                </div>
              );
            }
            // reasoning parts:
            if (part.type === "reasoning") {
              return (
                <pre className="text-purple-400" key={index}>
                  {part.details.map((detail) =>
                    detail.type === "text" ? detail.text : "<redacted>"
                  )}
                </pre>
              );
            }
          })}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          name="prompt"
          value={input}
          onChange={handleInputChange}
          className="text-black"
        />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
