import { readFile, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { cwd } from "process";
import { extractText, getDocumentProxy } from "unpdf";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { v4 } from "uuid";

const openai = new OpenAI();
const pc = new Pinecone();
const index = pc.index(process.env.PINECONE_INDEX_NAME_QUIZ!);

export async function POST(req: NextRequest) {
  try {
    const buffer = await readFile(
      `${cwd()}/pdfs/Intensives_notes_Zeeshan_Nisar-1-80.pdf`
    );
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const data = text.split(
      /BAYYINAH DREAM INTENSIVE QUR’AN ARABIC LESSON DREAM INTENSIVE \d{1} /
    );

    data.shift();

    interface Intensive {
      [key: string]: string;
    }

    const intensives: Intensive[] = [];

    data.forEach((item, intIndex) => {
      const days = item.split(/DAY \d{1,2} – \d{1,2} \w+ \d{4}/);
      days.shift();
      days.forEach((day, dayIndex) => {
        intensives.push({
          [`intensive-${intIndex + 1}_day-${dayIndex + 1}`]: day,
        });
      });
    });

    const texts = intensives.map((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      return value;
    });

    const lectures = intensives.map((item) => {
      const key = Object.keys(item)[0];
      return key;
    });

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    });

    const embeddings = response.data.map((item) => item.embedding);

    // Prepare vectors for upsert
    const vectors = lectures.map((lecture, index) => ({
      id: v4(),
      values: embeddings[index],
      metadata: {
        section: "Intensive",
        lecture: lecture,
        text: texts[index],
      },
    }));

    await index.upsert(vectors);

    return NextResponse.json({ Success: "Embedding creation done!" });
  } catch (error) {
    console.log((error as Error).message);
    return NextResponse.json({ error: `Error occured: ${error}` });
  }
}
