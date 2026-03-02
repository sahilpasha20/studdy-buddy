import { motion, AnimatePresence } from "framer-motion";
import { BookCheck, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChapterCompletionPopupProps {
  isOpen: boolean;
  chapterName: string;
  subjectName: string;
  onClose: () => void;
  onTakeQuiz: () => void;
}

const ChapterCompletionPopup = ({
  isOpen,
  chapterName,
  subjectName,
  onClose,
  onTakeQuiz,
}: ChapterCompletionPopupProps) => {
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
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
              >
                <BookCheck className="w-8 h-8 text-emerald-600" />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-gray-900 mb-2"
              >
                Chapter Completed!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-2"
              >
                Great job finishing{" "}
                <span className="font-semibold text-gray-800">{chapterName}</span>
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-sm text-gray-500 mb-6"
              >
                in {subjectName}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border border-blue-200"
              >
                <p className="text-gray-700 font-medium mb-2">
                  Have you understood the chapter well?
                </p>
                <p className="text-sm text-gray-500">
                  Test your knowledge with a quick quiz to reinforce what you've learned!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <Button
                  onClick={onTakeQuiz}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-5"
                >
                  <BrainCircuit className="w-5 h-5 mr-2" />
                  Take Quiz!
                </Button>

                <button
                  onClick={onClose}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
                >
                  Maybe later
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChapterCompletionPopup;
