import { motion, AnimatePresence } from "framer-motion";
import { BookCheck, CircleCheck as CheckCircle2, Circle as XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChapterCompletionPopupProps {
  isOpen: boolean;
  chapterName: string;
  subjectName: string;
  onClose: () => void;
  onUnderstood: () => void;
}

const ChapterCompletionPopup = ({
  isOpen,
  chapterName,
  subjectName,
  onClose,
  onUnderstood,
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
                className="text-gray-600 mb-1"
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
                <p className="text-gray-800 font-semibold mb-1">
                  Did you understand the chapter thoroughly?
                </p>
                <p className="text-sm text-gray-500">
                  Upload photos of your chapter and we'll generate 10-15 questions from the actual content.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3"
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-5 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-700 transition-all"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Not yet
                </Button>

                <Button
                  onClick={onUnderstood}
                  className="flex-1 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Yes, quiz me!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChapterCompletionPopup;
