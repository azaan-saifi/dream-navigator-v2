import fs from "fs";
import path from "path";
import { cwd } from "process";
import {  NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";
import { downloadAudio, splitAudio, uploadToCloudinay, transcribeChunks, mergeTranscriptions, createTranscriptionChunks, createEmbeddings, storeInPinecone, deleteCloudinaryFolder } from "@/lib/utils/helperFunctions";

export async function POST(req: NextRequest) {
    const {youtubeUrl} = await req.json()
    const outputDir = path.join(cwd(), "audio_segments");
    const tempFilePath = path.join(cwd(), "temp_audio.mp4");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    try {

        if (!ytdl.validateURL(youtubeUrl)) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        const videoInfo = await ytdl.getBasicInfo(youtubeUrl)
        const totalDuration = Math.floor(videoInfo.videoDetails.lengthSeconds);
        const CHUNK_DURATION = Math.floor(totalDuration / 12)
        
        const videoTitle = videoInfo.videoDetails.title
        const videoUrl = videoInfo.videoDetails.video_url

        console.log("Downloading audio...");
        await downloadAudio(youtubeUrl, tempFilePath);
        console.log("Splitting audio...");

        const segments = await splitAudio(tempFilePath, outputDir, CHUNK_DURATION);

        // Delete extra chunks if more than 12 are generated
        if (segments.length > 12) {
            console.log(`Warning: Audio was split into ${segments.length} chunks. Deleting extra chunks.`);
            for (let i = 12; i < segments.length; i++) {
                fs.unlinkSync(segments[i]);
            }
            segments.splice(12); // Keep only the first 12 chunks
        }else {
            console.log(`Audio split into ${segments.length} parts.`);
        }

        console.log("Uploading files to cloudinary...")
        const cloudinaryUrls = await uploadToCloudinay(segments)
        console.log("Cloudinay upload done.")

        console.log("Starting transcription...");
        const transcriptions = await transcribeChunks(cloudinaryUrls);
        console.log("Transcription completed!");

        console.log("Merging all the transcription...");
        const {segments:transcriptSegments} = mergeTranscriptions(transcriptions, CHUNK_DURATION);
        console.log("Merged successfully!")

        console.log("Creating transcription chunks...")
        const transcription = createTranscriptionChunks(transcriptSegments, videoTitle, videoUrl)
        console.log("Chunk creation completed")
        
        console.log("Creating embeddings...");
        const { embeddings, texts } = await createEmbeddings(transcription);
        console.log("Embeddings created successfully!");

        console.log("Storing in PineconeDB...");
        await storeInPinecone(embeddings, transcription, texts);
        console.log("Storage completed!");

        return NextResponse.json({ 
            message: "Processing complete", 
            chunkCount: transcription.length 
        }, {status: 200});
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Processing failed" },
            { status: 500 }
        );
    } finally {
        // Ensure cleanup after transcription
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath)
            console.log("Temporary File has deleted")
        }
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
            console.log("All Audio files has deleted")
        }

        // Delete all files in the Cloudinary folder after transcription
        await deleteCloudinaryFolder('dream-nav-audios/');
        console.log("Cloudinary files deleted successfully!");
    }
}