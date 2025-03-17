/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { getReinforcementQuestion } from "@/lib/actions/messages.action";
import AutoDetectLanguage from "./AutoDetectLanguage";

interface Animate {
  [key: string]: any;
}

interface QuizProps {
  quizId: string;
  quizTopic: string;
  quizData: QuizQuestion[];
  onClose: () => void;
  initial: Animate;
  animate: Animate;
  screenSize: string;
  quizTool: QuizTool;
  context: any[];
  onUpdateQuizState: (quizId: string, updates: Partial<QuizTool>) => void;
}

const Quiz = ({
  quizId,
  quizTopic,
  quizData,
  onClose,
  initial,
  animate,
  screenSize,
  quizTool,
  context,
  onUpdateQuizState,
}: QuizProps) => {
  const [loadingReinforcement, setLoadingReinforcement] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Destructure state from quizTool
  const {
    currentQuestion,
    selectedAnswers,
    showResults,
    answeredCorrectly,
    showExplanation,
    showReinforcement,
    reinforcementAnswer,
    reinforcementAttempts,
    maxAttemptsReached,
    reinforcementQuestion,
    attemptedReinforcementQuestions,
    explanationStates,
    correctnessStates,
  } = quizTool;

  // Unified state updater
  const updateQuizState = (newState: Partial<QuizTool>) => {
    onUpdateQuizState(quizId, newState);
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation) return;

    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = optionIndex;

    const isCorrect = optionIndex === quizData[currentQuestion].correctAnswer;
    const newCorrectnessStates = [...correctnessStates];
    newCorrectnessStates[currentQuestion] = isCorrect;

    const newExplanationStates = [...explanationStates];
    newExplanationStates[currentQuestion] = true;

    updateQuizState({
      selectedAnswers: newSelectedAnswers,
      correctnessStates: newCorrectnessStates,
      explanationStates: newExplanationStates,
      answeredCorrectly: isCorrect,
      showExplanation: true,
    });
  };

  const fetchReinforcementQuestion = async (
    useReinforcementAsContext = false
  ) => {
    setLoadingReinforcement(true);
    try {
      const response = await getReinforcementQuestion({
        context,
        // Use the previous reinforcement question if requested, otherwise use the original quiz question
        question:
          useReinforcementAsContext && reinforcementQuestion
            ? reinforcementQuestion
            : quizData[currentQuestion],
        // Use the previous reinforcement answer if requested, otherwise use the original selected answer
        incorrectOption:
          useReinforcementAsContext && reinforcementAnswer !== null
            ? reinforcementAnswer
            : selectedAnswers[currentQuestion]!,
      });
      updateQuizState({
        reinforcementQuestion: response,
      });
    } catch (error) {
      console.error("Failed to fetch reinforcement question:", error);
    } finally {
      setLoadingReinforcement(false);
    }
  };

  const handleStartReinforcement = async () => {
    const newAttemptedReinforcement = [...attemptedReinforcementQuestions];
    newAttemptedReinforcement[currentQuestion] = true;

    updateQuizState({
      attemptedReinforcementQuestions: newAttemptedReinforcement,
      showExplanation: false,
      showReinforcement: true,
      reinforcementAnswer: null,
    });

    await fetchReinforcementQuestion(false); // Initial reinforcement uses the original question
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReinforcementSelect = (optionIndex: number) => {
    if (showExplanation) return;

    const isCorrect = optionIndex === reinforcementQuestion?.correctAnswer;
    const newAttempts = reinforcementAttempts + 1;

    updateQuizState({
      reinforcementAnswer: optionIndex,
      showExplanation: true,
      answeredCorrectly: isCorrect,
      reinforcementAttempts: isCorrect ? reinforcementAttempts : newAttempts,
      maxAttemptsReached: newAttempts >= 5 && !isCorrect,
    });
  };

  const handleTryAgain = async () => {
    console.log(reinforcementQuestion);
    updateQuizState({
      showExplanation: false,
      reinforcementAnswer: null,
    });
    // Pass true to use the previous reinforcement question as context for the next one
    await fetchReinforcementQuestion(true);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinue = () => {
    const newState: Partial<QuizTool> = {
      showExplanation: false,
      showReinforcement: false,
    };

    if (currentQuestion === quizData.length - 1) {
      newState.showResults = true;
    } else {
      newState.currentQuestion = currentQuestion + 1;
    }

    updateQuizState(newState);
  };

  const handleNavigation = (direction: "prev" | "next") => {
    const newQuestion =
      direction === "next" ? currentQuestion + 1 : currentQuestion - 1;

    const newShowResults =
      direction === "next" && currentQuestion === quizData.length - 1;

    updateQuizState({
      currentQuestion: newQuestion,
      showExplanation: explanationStates[newQuestion],
      answeredCorrectly: correctnessStates[newQuestion],
      showReinforcement: false,
      showResults: newShowResults,
    });

    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReviewQuiz = () => {
    updateQuizState({
      showResults: false,
      currentQuestion: 0,
      showExplanation: explanationStates[0],
      answeredCorrectly: correctnessStates[0],
    });
  };

  // Calculate progress percentage
  const progressPercentage = ((currentQuestion + 1) / quizData.length) * 100;

  // Generate option class - extracted to reuse for both question types
  const getOptionClass = (
    isSelected: boolean,
    isCorrect: boolean,
    showingExplanation: boolean
  ) => {
    let optionClass = "p-4 rounded-lg cursor-pointer border transition-all ";

    if (showingExplanation) {
      if (isCorrect) {
        optionClass += "border-green-500 bg-green-900 bg-opacity-30";
      } else if (isSelected && !isCorrect) {
        optionClass += "border-red-500 bg-red-900 bg-opacity-30";
      } else {
        optionClass += "border-zinc-600";
      }
    } else {
      optionClass += isSelected
        ? "border bg-dark-300"
        : "border-zinc-600 hover:border-zinc-500 hover:bg-dark-300";
    }

    return optionClass;
  };

  // Check if this question already had reinforcement attempts
  const hasAttemptedReinforcement =
    attemptedReinforcementQuestions[currentQuestion];

  return (
    <motion.div
      initial={initial[screenSize]}
      animate={animate[screenSize]}
      className="mx-auto flex flex-col rounded-lg border border-zinc-600 bg-dark-200 text-white shadow-md max-md:fixed max-md:inset-0 max-md:top-20 max-md:flex max-md:flex-col md:mr-3 md:h-[560px] md:w-full xl:w-2/5"
    >
      {/* Fixed Quiz Header */}
      <div className="flex flex-col gap-3 rounded-t-lg border-b border-zinc-600 bg-dark-100 p-6">
        <div className="flex w-full items-start gap-4">
          <h2 className="w-full text-2xl font-bold max-sm:text-xl">
            {!quizTopic && (
              <Skeleton className="h-8 w-3/5 rounded-lg bg-dark-shimmer" />
            )}
            <AutoDetectLanguage text={quizTopic} />
          </h2>
          <div
            onClick={onClose}
            className="cursor-pointer rounded-full border border-zinc-700 bg-dark-200 p-2"
          >
            <FaTimes />
          </div>
        </div>
        {!showResults && (
          <div className="mt-2">
            <div className="flex justify-between text-sm max-sm:text-xs">
              {quizData[2] ? (
                <>
                  <span>
                    Question {currentQuestion + 1} of {quizData.length}
                  </span>
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </>
              ) : (
                <>
                  <Skeleton className="bg-dark-shimmer px-16 py-2.5 " />
                  <Skeleton className="bg-dark-shimmer px-24 py-2.5 " />
                </>
              )}
            </div>
            {quizData[2] ? (
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: "#f81d42",
                  }}
                ></div>
              </div>
            ) : (
              <>
                <Skeleton className="mt-1 w-full bg-dark-shimmer py-1 " />
              </>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Quiz Content */}
      <div ref={contentRef} className="custom-scrollbar grow overflow-auto p-6">
        {showResults ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 text-4xl">🎉</div>
            <h3 className="mb-2 text-center text-2xl font-bold">
              <AutoDetectLanguage text="Quiz Completed!" />
            </h3>
            <Button
              onClick={handleReviewQuiz}
              className="mt-4 bg-primary-100 hover:bg-opacity-90"
            >
              Review Answers
            </Button>
          </div>
        ) : showReinforcement ? (
          // Reinforcement question when user answers incorrectly
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-amber-400">
              Reinforcement Question:
            </h3>

            {loadingReinforcement ? (
              // Skeleton loader for reinforcement question
              <div className="space-y-4">
                <Skeleton className="h-7 w-full bg-dark-shimmer" />
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton
                    key={item}
                    className="rounded-lg border border-zinc-600 bg-dark-200 p-4"
                  >
                    <div className="flex items-center gap-4 py-0.5">
                      <Skeleton className="size-5 rounded-full bg-dark-shimmer" />
                      <Skeleton className="h-5 w-full rounded-lg bg-dark-shimmer" />
                    </div>
                  </Skeleton>
                ))}
              </div>
            ) : reinforcementQuestion ? (
              <>
                <AutoDetectLanguage
                  className="mb-4 text-lg font-semibold"
                  text={reinforcementQuestion.question}
                />
                <div className="space-y-3">
                  {reinforcementQuestion.options.map(
                    (option: string, index: number) => {
                      const isSelected = reinforcementAnswer === index;
                      const isCorrect =
                        index === reinforcementQuestion.correctAnswer;

                      return (
                        <div
                          key={index}
                          onClick={() => handleReinforcementSelect(index)}
                          className={getOptionClass(
                            isSelected,
                            isCorrect,
                            showExplanation
                          )}
                        >
                          <div className="flex items-start">
                            <div className="flex items-center justify-center">
                              <div
                                className={`mr-3 flex size-5 items-center justify-center rounded-full ${
                                  showExplanation && isCorrect
                                    ? "bg-green-500"
                                    : isSelected &&
                                        showExplanation &&
                                        !isCorrect
                                      ? "bg-primary-100"
                                      : isSelected
                                        ? "bg-dark-300"
                                        : "bg-dark-100"
                                }`}
                              >
                                <span className="text-sm">
                                  {String.fromCharCode(65 + index)}
                                </span>
                              </div>
                            </div>
                            <AutoDetectLanguage
                              className="text-white antialiased"
                              text={option}
                            />
                          </div>

                          {showExplanation && isCorrect && (
                            <div className="ml-8 mt-2 text-sm text-green-400">
                              ✓ Correct answer
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {showExplanation && (
                  <div className="mt-4 rounded-lg border border-zinc-700 bg-dark-300 p-3">
                    <p className="mb-1 font-semibold">Explanation:</p>
                    <AutoDetectLanguage
                      text={reinforcementQuestion.explanation}
                    />

                    <div className="mt-4 flex justify-center">
                      {answeredCorrectly ? (
                        <Button
                          onClick={handleContinue}
                          className="rounded-md bg-primary-100 px-4 py-2 text-white hover:bg-opacity-90"
                        >
                          Continue
                        </Button>
                      ) : maxAttemptsReached ? (
                        <div className="flex flex-col items-center">
                          <p className="mb-4 font-bold text-amber-400">
                            You should revisit this topic
                          </p>
                          <Button
                            onClick={handleContinue}
                            className="rounded-md bg-primary-100 px-4 py-2 text-white hover:bg-opacity-90"
                          >
                            Continue
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleTryAgain}
                          className="rounded-md bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
                        >
                          Try Again ({5 - reinforcementAttempts} attempts left)
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                Failed to load reinforcement question
              </div>
            )}
          </div>
        ) : (
          // Regular question display
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold">
              {quizData[2] ? (
                <AutoDetectLanguage
                  text={quizData[currentQuestion]?.question}
                />
              ) : (
                <Skeleton className="h-7 w-full bg-dark-shimmer" />
              )}
            </h3>
            {quizData[2] ? (
              <div className="space-y-3">
                {quizData[currentQuestion]?.options?.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion] === index;
                  const isCorrect =
                    index === quizData[currentQuestion]?.correctAnswer;

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        // Only allow selection if not already answered
                        if (selectedAnswers[currentQuestion] === null) {
                          handleOptionSelect(index);
                        }
                      }}
                      className={`${getOptionClass(
                        isSelected,
                        isCorrect,
                        showExplanation
                      )}`}
                    >
                      {quizData[2] ? (
                        <div className="flex items-start">
                          <div className="flex items-center justify-center">
                            <div
                              className={`mr-3 flex size-5 items-center justify-center rounded-full ${
                                showExplanation && isCorrect
                                  ? "bg-green-500"
                                  : isSelected && showExplanation && !isCorrect
                                    ? "bg-primary-100"
                                    : isSelected
                                      ? "bg-dark-300"
                                      : "bg-dark-100"
                              }`}
                            >
                              <span className="text-sm">
                                {String.fromCharCode(65 + index)}
                              </span>
                            </div>
                          </div>
                          <AutoDetectLanguage
                            className="text-sm text-white"
                            text={option}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 py-0.5">
                            <Skeleton className="size-5 rounded-full bg-dark-shimmer" />
                            <Skeleton className="h-5 w-full rounded-lg bg-dark-shimmer" />
                          </div>
                        </>
                      )}

                      {showExplanation && isCorrect && (
                        <div className="ml-8 mt-2 text-sm text-green-400">
                          ✓ Correct answer
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Skeleton className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton
                    key={item}
                    className="rounded-lg border border-zinc-600 bg-dark-200 p-4"
                  >
                    <div className="flex items-center gap-4 py-0.5">
                      <Skeleton className="size-5 rounded-full bg-dark-shimmer" />
                      <Skeleton className="h-5 w-full rounded-lg bg-dark-shimmer" />
                    </div>
                  </Skeleton>
                ))}
              </Skeleton>
            )}

            {showExplanation && !answeredCorrectly && (
              <div className="mt-4 rounded-lg border border-zinc-700 bg-dark-300 p-3">
                <p className="mb-1 font-semibold">Why was that incorrect?</p>
                <AutoDetectLanguage
                  text={quizData && quizData[currentQuestion]?.explanation}
                />
                {!hasAttemptedReinforcement ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleStartReinforcement}
                      className="rounded-md border border-gold-100 bg-gold-transparant px-4 py-2 font-medium text-gold-100 hover:bg-[#ff940942] hover:duration-200"
                    >
                      Try Reinforcement Question
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {!showResults && !showReinforcement && (
          <div className="mt-8 flex justify-between">
            {quizData[2] ? (
              <Button
                onClick={() => handleNavigation("prev")}
                disabled={currentQuestion === 0}
                className={`rounded-md px-4 py-2 ${
                  currentQuestion === 0
                    ? "cursor-not-allowed bg-dark-100 text-gray-400"
                    : "border border-zinc-700 bg-dark-100 text-white"
                }`}
              >
                Previous
              </Button>
            ) : (
              <Button className="bg-dark-shimmer px-11 py-2"></Button>
            )}
            {quizData[2] ? (
              <Button
                onClick={() => handleNavigation("next")}
                disabled={
                  selectedAnswers[currentQuestion] === null ||
                  (!answeredCorrectly &&
                    showExplanation &&
                    !hasAttemptedReinforcement)
                }
                className={`rounded-md px-4 py-2 ${
                  selectedAnswers[currentQuestion] === null ||
                  (!answeredCorrectly &&
                    showExplanation &&
                    !hasAttemptedReinforcement)
                    ? "cursor-not-allowed text-gray-400"
                    : "bg-primary-100 text-white hover:bg-opacity-90"
                }`}
              >
                {currentQuestion === quizData.length - 1
                  ? "Finish Quiz"
                  : "Next Question"}
              </Button>
            ) : (
              <Button className="bg-dark-shimmer px-14 py-2"></Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Quiz;
