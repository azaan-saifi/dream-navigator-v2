"use client";

import { useState } from "react";

export default function Home() {
  const [link, setLink] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        body: JSON.stringify({ link }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <main className="flex items-center justify-center h-screen">
      <div>
        <h1>Youtube Audio Downloader</h1>
        <form action="" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter youtube url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="text-black"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </main>
  );
}
