"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { getReinforcementQuestion } from "@/lib/actions/messages.action";

interface Animate {
  [key: string]: any;
}

interface QuizState {
  currentQuestion: number;
  selectedAnswers: (number | null)[];
  showResults: boolean;
  answeredCorrectly: boolean;
  showExplanation: boolean;
  showReinforcement: boolean;
  reinforcementAnswer: number | null;
  reinforcementAttempts: number;
  maxAttemptsReached: boolean;
  reinforcementQuestion: any;
  attemptedReinforcementQuestions: boolean[];
  explanationStates: boolean[];
  correctnessStates: boolean[];
}

// Create a global quiz responses store to maintain state across quizzes
const globalQuizResponses: { [quizId: string]: QuizState } = {};

const Quiz = ({
  quizId,
  quizTopic,
  quizData,
  onClose,
  initial,
  animate,
  screenSize,
}: {
  quizId: string;
  quizTopic: string;
  quizData: QuizQuestion[];
  onClose: () => void;
  initial: Animate;
  animate: Animate;
  screenSize: string;
}) => {
  // Initialize state from global store or create new
  const [quizState, setQuizState] = useState<QuizState>(() => {
    return (
      globalQuizResponses[quizId] || {
        currentQuestion: 0,
        selectedAnswers: Array(quizData.length).fill(null),
        showResults: false,
        answeredCorrectly: true,
        showExplanation: false,
        showReinforcement: false,
        reinforcementAnswer: null,
        reinforcementAttempts: 0,
        maxAttemptsReached: false,
        reinforcementQuestion: null,
        attemptedReinforcementQuestions: Array(quizData.length).fill(false),
        explanationStates: Array(quizData.length).fill(false),
        correctnessStates: Array(quizData.length).fill(true),
      }
    );
  });

  // Destructure state from quizState
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
  } = quizState;

  const [loadingReinforcement, setLoadingReinforcement] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Update the global store whenever quizState changes
  useEffect(() => {
    globalQuizResponses[quizId] = quizState;
  }, [quizState, quizId]);

  // Unified state updater
  const updateQuizState = (newState: Partial<QuizState>) => {
    setQuizState((prev) => ({
      ...prev,
      ...newState,
    }));
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

  const fetchReinforcementQuestion = async () => {
    setLoadingReinforcement(true);
    try {
      const response = await getReinforcementQuestion({
        question: quizData[currentQuestion],
        incorrectOption: selectedAnswers[currentQuestion]!,
      });
      updateQuizState({
        reinforcementQuestion: response,
        reinforcementAttempts: 0,
        maxAttemptsReached: false,
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

    await fetchReinforcementQuestion();
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
    updateQuizState({
      showExplanation: false,
      reinforcementAnswer: null,
    });
    await fetchReinforcementQuestion();
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinue = () => {
    const newState: Partial<QuizState> = {
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

    updateQuizState({
      currentQuestion: newQuestion,
      showExplanation: explanationStates[newQuestion],
      answeredCorrectly: correctnessStates[newQuestion],
      showReinforcement: false,
    });

    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReviewQuiz = () => {
    updateQuizState({
      showResults: false,
      currentQuestion: 0,
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
      className="max-md:fixed max-md:size-full md:w-full md:mr-3 xl:w-[40%] border border-zinc-600 rounded-lg h-[560px] mx-auto bg-dark-200 shadow-md flex flex-col text-white"
    >
      {/* Fixed Quiz Header */}
      <div className="flex flex-col gap-3 p-6 bg-dark-100 border-b rounded-t-lg border-zinc-600">
        <div className="w-full flex">
          <h2 className="w-full text-2xl font-bold">
            {!quizTopic && (
              <Skeleton className="h-8 w-[60%] rounded-lg bg-dark-shimmer" />
            )}
            {quizTopic}
          </h2>
          <div
            onClick={onClose}
            className="bg-dark-200 border border-zinc-700 rounded-full p-2 cursor-pointer"
          >
            <FaTimes />
          </div>
        </div>
        {!showResults && (
          <div className="mt-2">
            <div className="flex justify-between text-sm">
              {quizData[2] ? (
                <>
                  <span>
                    Question {currentQuestion + 1} of {quizData.length}
                  </span>
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </>
              ) : (
                <>
                  <Skeleton className="py-2.5 px-16 bg-dark-shimmer " />
                  <Skeleton className="py-2.5 px-24 bg-dark-shimmer " />
                </>
              )}
            </div>
            {quizData[2] ? (
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
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
                <Skeleton className="py-1 mt-1 w-full bg-dark-shimmer " />
              </>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Quiz Content */}
      <div
        ref={contentRef}
        className="p-6 overflow-auto custom-scrollbar flex-grow"
      >
        {showResults ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-center mb-2">
              Quiz Completed!
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
            <h3 className="text-lg font-semibold mb-2 text-amber-400">
              Reinforcement Question:
            </h3>

            {loadingReinforcement ? (
              // Skeleton loader for reinforcement question
              <div className="space-y-4">
                <Skeleton className="w-full h-7 bg-dark-shimmer" />
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton
                    key={item}
                    className="p-4 border-zinc-600 border rounded-lg bg-dark-200"
                  >
                    <div className="flex py-0.5 items-center gap-4">
                      <Skeleton className="h-5 w-5 bg-dark-shimmer rounded-full" />
                      <Skeleton className="w-full h-5 bg-dark-shimmer rounded-lg" />
                    </div>
                  </Skeleton>
                ))}
              </div>
            ) : reinforcementQuestion ? (
              <>
                <h4 className="text-lg font-semibold mb-4">
                  {reinforcementQuestion.question}
                </h4>
                <div className="space-y-3">
                  {reinforcementQuestion.options.map(
                    (option: number, index: number) => {
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
                          <div className="flex items-center">
                            <div
                              className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                                showExplanation && isCorrect
                                  ? "bg-green-500"
                                  : isSelected && showExplanation && !isCorrect
                                  ? "bg-primary-100"
                                  : isSelected
                                  ? "bg-dark-300"
                                  : "bg-dark-100"
                              }`}
                            >
                              <span className="text-xs">
                                {String.fromCharCode(65 + index)}
                              </span>
                            </div>
                            <span className="text-white">{option}</span>
                          </div>

                          {showExplanation && isCorrect && (
                            <div className="mt-2 ml-8 text-green-400 text-sm">
                              ✓ Correct answer
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {showExplanation && (
                  <div className="mt-4 p-3 bg-dark-300 rounded-lg border border-zinc-700">
                    <p className="font-semibold mb-1">Explanation:</p>
                    <p>{reinforcementQuestion.explanation}</p>

                    <div className="mt-4 flex justify-center">
                      {answeredCorrectly ? (
                        <Button
                          onClick={handleContinue}
                          className="px-4 py-2 rounded-md text-white bg-primary-100 hover:bg-opacity-90"
                        >
                          Continue
                        </Button>
                      ) : maxAttemptsReached ? (
                        <div className="flex flex-col items-center">
                          <p className="text-amber-400 mb-4">
                            You should revisit this topic
                          </p>
                          <Button
                            onClick={handleContinue}
                            className="px-4 py-2 rounded-md text-white bg-primary-100 hover:bg-opacity-90"
                          >
                            Continue
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleTryAgain}
                          className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white"
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
            <h3 className="text-lg font-semibold mb-4">
              {quizData[2] ? (
                quizData[currentQuestion]?.question
              ) : (
                <Skeleton className="w-full h-7 bg-dark-shimmer" />
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
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                              showExplanation && isCorrect
                                ? "bg-green-500"
                                : isSelected && showExplanation && !isCorrect
                                ? "bg-primary-100"
                                : isSelected
                                ? "bg-dark-300"
                                : "bg-dark-100"
                            }`}
                          >
                            <span className="text-xs">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <span className="text-white">{option}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex py-0.5 items-center gap-4">
                            <Skeleton className="h-5 w-5 bg-dark-shimmer rounded-full" />
                            <Skeleton className="w-full h-5 bg-dark-shimmer rounded-lg" />
                          </div>
                        </>
                      )}

                      {showExplanation && isCorrect && (
                        <div className="mt-2 ml-8 text-green-400 text-sm">
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
                    className="p-4 border-zinc-600 border rounded-lg bg-dark-200"
                  >
                    <div className="flex py-0.5 items-center gap-4">
                      <Skeleton className="h-5 w-5 bg-dark-shimmer rounded-full" />
                      <Skeleton className="w-full h-5 bg-dark-shimmer rounded-lg" />
                    </div>
                  </Skeleton>
                ))}
              </Skeleton>
            )}

            {showExplanation && !answeredCorrectly && (
              <div className="mt-4 p-3 bg-dark-300 rounded-lg border border-zinc-700">
                <p className="font-semibold mb-1">Why was that incorrect?</p>
                <p>{quizData && quizData[currentQuestion]?.explanation}</p>
                {!hasAttemptedReinforcement ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleStartReinforcement}
                      className="animate-pulse px-4 py-2 rounded-md bg-gold-transparant hover:animate-none text-gold-100 border border-gold-100 font-medium"
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
          <div className="flex justify-between mt-8">
            {quizData[2] ? (
              <Button
                onClick={() => handleNavigation("prev")}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 rounded-md ${
                  currentQuestion === 0
                    ? "bg-dark-100 text-gray-400 cursor-not-allowed"
                    : "bg-dark-100 border border-zinc-700 text-white"
                }`}
              >
                Previous
              </Button>
            ) : (
              <Button className="px-11 py-2 bg-dark-shimmer"></Button>
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
                className={`px-4 py-2 rounded-md ${
                  selectedAnswers[currentQuestion] === null ||
                  (!answeredCorrectly &&
                    showExplanation &&
                    !hasAttemptedReinforcement)
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-white bg-primary-100 hover:bg-opacity-90"
                }`}
              >
                {currentQuestion === quizData.length - 1
                  ? "Finish Quiz"
                  : "Next Question"}
              </Button>
            ) : (
              <Button className="px-14 py-2 bg-dark-shimmer"></Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Quiz;
