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
  .min(5)
  .max(5);

export const quizResponseScheme = (numberOfQuestions: number) => {
  return z.object({
    quizTopic: z.string().describe("Topic of the quiz"),
    initialResponse: z
      .string()
      .describe(
        "say Sure that I will create a quiz on the topic 'user asked for'"
      ),
    quizData: z
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
      .min(numberOfQuestions)
      .max(numberOfQuestions),
  });
};

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

export const querySchema = z.object({
  queryType: z.union([
    z.literal("video"),
    z.literal("resource"),
    z.literal("quiz"),
    z.literal("general"),
  ]),
  quizQueryProps: z.object({
    section: z
      .union([z.literal("intensive-1"), z.literal("intensive-2")])
      .optional(),
    lecture: z.array(z.number().min(1).max(10)).optional(),
    numberOfQuestions: z.number().min(3).max(10).optional(),
  }),
});
