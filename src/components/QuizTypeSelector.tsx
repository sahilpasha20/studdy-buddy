import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, PenLine, ArrowLeft, Loader as Loader2, Zap, Brain, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuizType = "mcq" | "short_long";
export type QuizDifficulty = "easy" | "medium" | "hard";

interface QuizTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOptions: (type: QuizType, difficulty: QuizDifficulty) => void;
  isLoading?: boolean;
}

const QuizTypeSelector = ({ isOpen, onClose, onSelectOptions, isLoading = false }: QuizTypeSelectorProps) => {
  const [selectedType, setSelectedType] = useState<QuizType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty | null>(null);

  const handleTypeSelect = (type: QuizType) => {
    setSelectedType(type);
  };

  const handleDifficultySelect = (difficulty: QuizDifficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleSubmit = () => {
    if (selectedType && selectedDifficulty) {
      onSelectOptions(selectedType, selectedDifficulty);
    }
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
      setSelectedDifficulty(null);
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setSelectedDifficulty(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={isLoading ? undefined : handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-4"
                >
                  <Loader2 className="w-8 h-8 text-blue-600" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Generating Your Quiz</h3>
                <p className="text-gray-500">Analyzing your chapter and creating questions...</p>
              </div>
            ) : !selectedType ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">Choose Quiz Type</h3>
                  <div className="w-5" />
                </div>

                <p className="text-sm text-gray-600 mb-6 text-center">
                  How would you like to test your knowledge?
                </p>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleTypeSelect("mcq")}
                    className="w-full py-8 border-2 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <ListChecks className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Multiple Choice</p>
                        <p className="text-sm text-gray-500">Quick questions with 4 options each</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleTypeSelect("short_long")}
                    className="w-full py-8 border-2 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <PenLine className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Short & Long Answer</p>
                        <p className="text-sm text-gray-500">Write your own answers to questions</p>
                      </div>
                    </div>
                  </Button>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleBack}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">Select Difficulty</h3>
                  <div className="w-5" />
                </div>

                <p className="text-sm text-gray-600 mb-6 text-center">
                  How challenging should the questions be?
                </p>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleDifficultySelect("easy")}
                    className={`w-full py-6 border-2 transition-all group ${
                      selectedDifficulty === "easy"
                        ? "border-green-500 bg-green-50"
                        : "hover:border-green-400 hover:bg-green-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        selectedDifficulty === "easy" ? "bg-green-200" : "bg-green-100 group-hover:bg-green-200"
                      }`}>
                        <Zap className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Easy</p>
                        <p className="text-sm text-gray-500">Basic recall and simple concepts</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDifficultySelect("medium")}
                    className={`w-full py-6 border-2 transition-all group ${
                      selectedDifficulty === "medium"
                        ? "border-amber-500 bg-amber-50"
                        : "hover:border-amber-400 hover:bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        selectedDifficulty === "medium" ? "bg-amber-200" : "bg-amber-100 group-hover:bg-amber-200"
                      }`}>
                        <Brain className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Medium</p>
                        <p className="text-sm text-gray-500">Application and understanding</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDifficultySelect("hard")}
                    className={`w-full py-6 border-2 transition-all group ${
                      selectedDifficulty === "hard"
                        ? "border-red-500 bg-red-50"
                        : "hover:border-red-400 hover:bg-red-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        selectedDifficulty === "hard" ? "bg-red-200" : "bg-red-100 group-hover:bg-red-200"
                      }`}>
                        <GraduationCap className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Hard</p>
                        <p className="text-sm text-gray-500">Analysis and critical thinking</p>
                      </div>
                    </div>
                  </Button>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedDifficulty}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-5"
                >
                  Generate Quiz
                </Button>

                <button
                  onClick={handleClose}
                  className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
                >
                  Cancel
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizTypeSelector;
