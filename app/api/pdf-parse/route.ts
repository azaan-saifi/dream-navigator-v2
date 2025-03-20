import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { cwd } from "process";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { v4 } from "uuid";

const openai = new OpenAI();
const pc = new Pinecone();
const index = pc.index(process.env.PINECONE_INDEX_NAME_QUIZ!);

export async function POST() {
  try {
    const data = await readFile(`${cwd()}/02_Intensive.md`, "utf-8");
    const intensiveTwo = data.split(/Day-\d{1,2}/);
    intensiveTwo.shift();
    console.log(intensiveTwo.length);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: intensiveTwo,
      encoding_format: "float",
    });

    const embeddings = response.data.map((item) => item.embedding);

    // Prepare vectors for upsert
    const vectors = intensiveTwo.map((text, index) => ({
      id: v4(),
      values: embeddings[index],
      metadata: {
        section: "intensive-2",
        day: index + 1,
        text,
      },
    }));

    await index.upsert(vectors);

    return NextResponse.json({ success: "Embedding created successfully." });
  } catch (error) {
    console.log((error as Error).message);
    return NextResponse.json({ error: `Error occurred: ${error}` });
  }
}
