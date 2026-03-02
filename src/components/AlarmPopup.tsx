import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { getRandomReward } from "@/lib/rewards";

interface AlarmPopupProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const AlarmPopup = ({ isOpen, onDismiss }: AlarmPopupProps) => {
  const breakSuggestion = getRandomReward();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
          >
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-4xl">🔔</span>
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Time to Study!
              </h3>
              <p className="text-gray-600 mb-6">
                Hey there! It's study time. Your brain is ready to learn something amazing today!
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border border-blue-200">
                <p className="text-sm text-blue-600 mb-2">Quick tip before you start:</p>
                <p className="text-blue-700 font-medium">{breakSuggestion}</p>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 text-lg"
                onClick={onDismiss}
              >
                Let's Go! 🚀
              </Button>
              <button
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
                onClick={onDismiss}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlarmPopup;
