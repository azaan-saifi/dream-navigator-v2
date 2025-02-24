
interface CloudinaryResult {
    secure_url: string,
}

interface WordProps {
    end: number,
    score: number,
    start: number,
    word: string
}

interface SegmentProps {
    end: number,
    start: number,
    text: string,
    words: WordProps[]
}

interface TranscriptionProps {
    detected_language: string
    segments: SegmentProps[]
}

interface MergedTranscriptionProps {
    segments: SegmentProps[]
}

interface TranscriptionChunks {
    videoTitle: string
    videoUrl: string
    text: string
    startTime: number
}

interface PineconeMetadata {
    videoTitle: string
    videoUrl: string
    startTime: number
    text: string
}