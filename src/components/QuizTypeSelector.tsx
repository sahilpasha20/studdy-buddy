import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, PenLine, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuizType = "mcq" | "short_long";

interface QuizTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: QuizType) => void;
}

const QuizTypeSelector = ({ isOpen, onClose, onSelectType }: QuizTypeSelectorProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={onClose}
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
                onClick={() => onSelectType("mcq")}
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
                onClick={() => onSelectType("short_long")}
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
              onClick={onClose}
              className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizTypeSelector;
