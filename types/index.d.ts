/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IUser } from "@/lib/database/models/user.model";

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

  // Migrated from QuizState
  currentQuestion: number;
  selectedAnswers: (number | null)[];
  showResults: boolean;
  answeredCorrectly: boolean;
  showExplanation: boolean;
  showReinforcement: boolean;
  reinforcementAnswer: number | null;
  reinforcementAttempts: number;
  maxAttemptsReached: boolean;
  reinforcementQuestion: any; // Match the existing type
  attemptedReinforcementQuestions: boolean[];
  explanationStates: boolean[];
  correctnessStates: boolean[];
}
interface Message {
  role: "user" | "assistant";
  content: string;
  tool?: QuizTool;
}

interface ChatProps {
  welcome?: boolean;
  userId?: string | null;
  picture?: string;
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

interface quizForm {
  section: string | undefined;
  lecture: string | undefined;
}

interface createUserProps {
  clerkId: string;
  name: string;
  email: string;
  password?: string;
  picture: string;
}
interface updateUserProps {
  clerkId: string;
  updateData: Partial<IUser>;
}

interface deleteUserProps {
  clerkId: string;
}

export type PartialQuizResponse = Partial<QuizResponse>;
