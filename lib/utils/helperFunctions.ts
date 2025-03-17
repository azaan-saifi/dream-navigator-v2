/* eslint-disable no-undef */
import fs from "fs";
import path from "path";
import Replicate from "replicate";
import { v2 as cloudinary } from "cloudinary";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { TRANSCRIPTION_PROMPT } from "../utils";
import { v4 } from "uuid";

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const replicate = new Replicate();

// Step1: Download the youtube audio
export async function downloadAudio(
  youtubeUrl: string,
  outputPath: string
): Promise<void> {
  await new Promise((resolve, reject) => {
    ytdl(youtubeUrl, {
      filter: "audioonly",
      quality: "highestaudio",
    })
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        console.log("Audio downloaded successfully!");
        resolve("audio Downloaded successfully!");
      })
      .on("error", (err: Error) => {
        console.log("Error while downloading the audio", err.message);
        reject(err.message);
      });
  });
}

// Step2: Split the audio into multiple small audios using ffmpeg and return list of file paths
export function splitAudio(
  inputPath: string,
  outputDir: string,
  chunkDuration: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-f segment",
        `-segment_time ${chunkDuration}`,
        "-c copy",
      ])
      .output(`${outputDir}/audio_part_%03d.mp4`)
      .on("end", () => {
        const files = fs
          .readdirSync(outputDir)
          .filter((file) => file.match(/audio_part_\d+\.mp4/))
          .map((file) => path.join(outputDir, file));
        resolve(files);
      })
      .on("error", reject)
      .run();
  });
}

// Step3: Upload all those split audios to cloudinary and get their remote url for transcription
export async function uploadToCloudinay(filePaths: string[]) {
  return Promise.all(
    filePaths.map(async (filePath) => {
      return new Promise<CloudinaryResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "dream-nav-audios",
            resource_type: "video",
            format: "mp3",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryResult);
            }
          }
        );

        fs.createReadStream(filePath).on("error", reject).pipe(uploadStream);
      });
    })
  );
}

// Step4: Transcribe all the audios paralelly at once for faster results
export async function transcribeChunks(
  files: CloudinaryResult[]
): Promise<TranscriptionProps[]> {
  const transcribePromises = files.map(async (file) => {
    console.log(`Transcribing ${file.secure_url}...`);

    const input = {
      audio_file: file.secure_url,
      align_output: true,
      initial_prompt: TRANSCRIPTION_PROMPT,
    };
    return replicate.run(
      `${process.env.REPLICATE_MODEL_OWNER}/${process.env.REPLICATE_MODEL_ID}`,
      { input }
    ) as Promise<TranscriptionProps>;
  });

  return Promise.all(transcribePromises); // Will reject if any transcription fails
}

// Step5: Merge all pieces into one transcription
export function mergeTranscriptions(
  transcriptions: TranscriptionProps[],
  CHUNK_DURATION: number
): MergedTranscriptionProps {
  const mergedSegments: SegmentProps[] = [];

  transcriptions.forEach((transcription, index) => {
    const offset = index * CHUNK_DURATION;
    if (index === 0) {
      mergedSegments.push(...transcription.segments);
    } else {
      const adjustedSegments = transcription.segments.map((segment) => ({
        ...segment,
        start: segment.start + offset,
        end: segment.end + offset,
        words: segment.words.map((word) => ({
          ...word,
          start: word.start + offset,
          end: word.end + offset,
        })),
      }));
      mergedSegments.push(...adjustedSegments);
    }
  });

  return {
    segments: mergedSegments,
  };
}

export function createTranscriptionChunks(
  segments: SegmentProps[],
  videoTitle: string,
  videoUrl: string,
  maxChunkDuration: number = 30
): TranscriptionChunks[] {
  const chunks: TranscriptionChunks[] = [];
  let currentChunk: TranscriptionChunks | null = null;

  for (const segment of segments) {
    if (!currentChunk) {
      // Initialize the first chunk
      currentChunk = {
        videoTitle,
        videoUrl,
        text: segment.text.trim(),
        startTime: Math.round(segment.start),
      };
    } else {
      // Calculate potential chunk duration if we add this segment
      const potentialEnd = segment.end;
      const chunkDuration = potentialEnd - currentChunk.startTime;

      if (chunkDuration <= maxChunkDuration) {
        // Add to current chunk
        currentChunk.text += " " + segment.text.trim();
      } else {
        // Finalize current chunk and start new one
        chunks.push(currentChunk);
        currentChunk = {
          videoTitle,
          videoUrl,
          text: segment.text.trim(),
          startTime: Math.round(segment.start),
        };
      }
    }
  }

  // Add the last chunk if it exists
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Add this function to create embeddings
export async function createEmbeddings(
  chunks: TranscriptionChunks[]
): Promise<{ embeddings: number[][]; texts: string[] }> {
  try {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const texts = chunks.map((chunk) => chunk.text);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    });

    const embeddings = response.data.map((item) => item.embedding);
    return { embeddings, texts };
  } catch (error) {
    console.error("Error creating embeddings:", error);
    throw new Error("Embedding creation failed");
  }
}

// Add this function to store in Pinecone
export async function storeInPinecone(
  embeddings: number[][],
  chunks: TranscriptionChunks[],
  texts: string[]
) {
  try {
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    // Prepare vectors for upsert
    const vectors = chunks.map((chunk, index) => ({
      id: v4(),
      values: embeddings[index],
      metadata: {
        videoTitle: chunk.videoTitle,
        videoUrl: chunk.videoUrl,
        startTime: chunk.startTime,
        text: texts[index],
      },
    }));

    await index.upsert(vectors);
    console.log(`Successfully stored ${vectors.length} vectors in Pinecone`);
  } catch (error) {
    console.error("Pinecone storage error:", error);
    throw new Error("Failed to store embeddings in Pinecone");
  }
}

// Delete all files in a Cloudinary folder
export async function deleteCloudinaryFolder(folder: string) {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(folder);
    console.log(`Deleted files in Cloudinary folder: ${folder}`);
    return result;
  } catch (error) {
    console.error("Error deleting Cloudinary files:", error);
    throw error;
  }
}
