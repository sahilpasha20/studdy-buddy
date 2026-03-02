import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, Award, ArrowLeft, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuizType } from "./QuizTypeSelector";

export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ShortLongQuestion {
  question: string;
  type: "short" | "long";
  sampleAnswer: string;
}

interface QuizDisplayProps {
  isOpen: boolean;
  quizType: QuizType;
  mcqQuestions: MCQQuestion[];
  shortLongQuestions: ShortLongQuestion[];
  chapterName: string;
  onClose: () => void;
  onRetake: () => void;
}

const QuizDisplay = ({
  isOpen,
  quizType,
  mcqQuestions,
  shortLongQuestions,
  chapterName,
  onClose,
  onRetake,
}: QuizDisplayProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [writtenAnswers, setWrittenAnswers] = useState<string[]>([]);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);

  const questions = quizType === "mcq" ? mcqQuestions : shortLongQuestions;
  const totalQuestions = questions.length;

  const handleMCQSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === (mcqQuestions[currentQuestion] as MCQQuestion).correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowSampleAnswer(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleWrittenAnswerChange = (answer: string) => {
    const newAnswers = [...writtenAnswers];
    newAnswers[currentQuestion] = answer;
    setWrittenAnswers(newAnswers);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setWrittenAnswers([]);
    setShowSampleAnswer(false);
  };

  const handleClose = () => {
    handleRestart();
    onClose();
  };

  const getScoreMessage = () => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) return "Excellent! You've mastered this chapter!";
    if (percentage >= 60) return "Good job! You're getting there!";
    if (percentage >= 40) return "Keep practicing, you're improving!";
    return "Don't worry, review the chapter and try again!";
  };

  const getScoreEmoji = () => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) return "🏆";
    if (percentage >= 60) return "🌟";
    if (percentage >= 40) return "💪";
    return "📚";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {quizComplete ? (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4"
                >
                  <span className="text-4xl">{getScoreEmoji()}</span>
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>

                {quizType === "mcq" && (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="text-3xl font-bold text-amber-600">
                        {score}/{totalQuestions}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-6">{getScoreMessage()}</p>
                  </>
                )}

                {quizType === "short_long" && (
                  <p className="text-gray-600 mb-6">
                    Great effort! Review your answers against the sample answers to see how you did.
                  </p>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={onRetake}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Take Another Quiz
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="w-full">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-500">
                    Question {currentQuestion + 1} of {totalQuestions}
                  </span>
                  <div className="w-5" />
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-gray-500 mb-2">{chapterName}</p>

                {quizType === "mcq" && mcqQuestions[currentQuestion] && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {mcqQuestions[currentQuestion].question}
                    </h4>

                    <div className="space-y-2 mb-4">
                      {mcqQuestions[currentQuestion].options.map((option, index) => {
                        const isCorrect =
                          index === mcqQuestions[currentQuestion].correctIndex;
                        const isSelected = selectedAnswer === index;

                        return (
                          <motion.button
                            key={index}
                            onClick={() => handleMCQSelect(index)}
                            disabled={showResult}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              showResult
                                ? isCorrect
                                  ? "border-green-500 bg-green-50"
                                  : isSelected
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-200 bg-white"
                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                            }`}
                            whileTap={!showResult ? { scale: 0.98 } : {}}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                  showResult
                                    ? isCorrect
                                      ? "bg-green-500 text-white"
                                      : isSelected
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-100 text-gray-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {showResult ? (
                                  isCorrect ? (
                                    <Check className="w-4 h-4" />
                                  ) : isSelected ? (
                                    <X className="w-4 h-4" />
                                  ) : (
                                    String.fromCharCode(65 + index)
                                  )
                                ) : (
                                  String.fromCharCode(65 + index)
                                )}
                              </div>
                              <span
                                className={`flex-1 ${
                                  showResult && isCorrect ? "font-semibold text-green-700" : ""
                                }`}
                              >
                                {option}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200"
                      >
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Explanation:</span>{" "}
                          {mcqQuestions[currentQuestion].explanation}
                        </p>
                      </motion.div>
                    )}

                    {showResult && (
                      <Button onClick={handleNextQuestion} className="w-full">
                        {currentQuestion < totalQuestions - 1 ? (
                          <>
                            Next Question <ChevronRight className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          "See Results"
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {quizType === "short_long" && shortLongQuestions[currentQuestion] && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          shortLongQuestions[currentQuestion].type === "short"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {shortLongQuestions[currentQuestion].type === "short"
                          ? "Short Answer"
                          : "Long Answer"}
                      </span>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {shortLongQuestions[currentQuestion].question}
                    </h4>

                    <Textarea
                      placeholder={
                        shortLongQuestions[currentQuestion].type === "short"
                          ? "Write your answer in 1-2 sentences..."
                          : "Write a detailed answer..."
                      }
                      value={writtenAnswers[currentQuestion] || ""}
                      onChange={(e) => handleWrittenAnswerChange(e.target.value)}
                      className={`mb-4 ${
                        shortLongQuestions[currentQuestion].type === "long"
                          ? "min-h-[150px]"
                          : "min-h-[80px]"
                      }`}
                    />

                    {showSampleAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200"
                      >
                        <p className="text-sm font-semibold text-emerald-700 mb-1">
                          Sample Answer:
                        </p>
                        <p className="text-sm text-emerald-800">
                          {shortLongQuestions[currentQuestion].sampleAnswer}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex gap-2">
                      {!showSampleAnswer && (
                        <Button
                          variant="outline"
                          onClick={() => setShowSampleAnswer(true)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Show Answer
                        </Button>
                      )}
                      <Button
                        onClick={handleNextQuestion}
                        className="flex-1"
                        disabled={
                          !showSampleAnswer && !(writtenAnswers[currentQuestion] || "").trim()
                        }
                      >
                        {currentQuestion < totalQuestions - 1 ? (
                          <>
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          "Finish"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizDisplay;
