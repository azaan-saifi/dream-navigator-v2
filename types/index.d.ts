interface CloudinaryResult {
  secure_url: string;
}

interface WordProps {
  end: number;
  score: number;
  start: number;
  word: string;
}

interface SegmentProps {
  end: number;
  start: number;
  text: string;
  words: WordProps[];
}

interface TranscriptionProps {
  detected_language: string;
  segments: SegmentProps[];
}

interface MergedTranscriptionProps {
  segments: SegmentProps[];
}

interface TranscriptionChunks {
  videoTitle: string;
  videoUrl: string;
  text: string;
  startTime: number;
}

interface PineconeMetadata {
  videoTitle: string;
  videoUrl: string;
  startTime: number;
  text: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  tool?: QuizTool;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizTool {
  id: string;
  name: string;
  quizTopic: string;
  initialResponse: string;
  quizData: QuizQuestion[];
}

interface ChatProps {
  welcome?: boolean;
}

interface UserMessageProps {
  content: string;
  picture?: string;
}

interface AssistantMessageProps {
  content?: string;
  picture?: string;
  tool?: Tool;
  onQuizSelect?: () => void;
}

interface TextAreaProp {
  input: string;
  setInput: (e) => void;
  handleSubmit: (e) => void;
  quiz: boolean;
  pathname: string;
}

interface Animate {
  [key: string]: any;
}

type QueryType = "video" | "resource" | "quiz" | "general";
