import { z } from "zod";

export const quizDataSchema = z
  .array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4), // Ensures exactly 4 options
      correctAnswer: z
        .number()
        .int()
        .min(0)
        .max(3)
        .describe("index of the options"), // Ensures a valid index (0 to 3)
      explanation: z.string().describe("Why the answer is correct"),
    })
  )
  .min(3)
  .max(3);

export const quizResponseScheme = z.object({
  quizTopic: z.string().describe("Topic of the quiz"),
  initialResponse: z
    .string()
    .describe(
      "say Sure that I will create a quiz on the topic 'user asked for'"
    ),
  quizData: quizDataSchema,
});

export const reinforcementSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4), // Ensures exactly 4 options
  correctAnswer: z
    .number()
    .int()
    .min(0)
    .max(3)
    .describe("index of the options"), // Ensures a valid index (0 to 3)
  explanation: z.string().describe("Why the answer is correct"),
});
