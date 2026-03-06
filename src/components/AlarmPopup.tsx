import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Sun, Zap, Heart } from "lucide-react";
import { getRandomReward } from "@/lib/rewards";
import { useState, useEffect } from "react";

interface AlarmPopupProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const motivationalMessages = [
  "Your brain is ready to absorb some amazing knowledge!",
  "Every minute of study brings you closer to your dreams!",
  "You've got this! Time to shine and learn something new!",
  "Today's effort is tomorrow's success story!",
  "Let's make today's study session your best one yet!",
  "Your future self will thank you for studying now!",
  "Small steps lead to big achievements. Let's begin!",
  "You're capable of incredible things. Time to prove it!",
];

const emojis = ["🌟", "✨", "🚀", "🎯", "💫", "🌈", "🎨", "📚"];

const AlarmPopup = ({ isOpen, onDismiss }: AlarmPopupProps) => {
  const breakSuggestion = getRandomReward();
  const [message] = useState(() =>
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );
  const [emoji] = useState(() =>
    emojis[Math.floor(Math.random() * emojis.length)]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-blue-900/70 via-cyan-900/60 to-teal-900/70 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400" />

            <motion.div
              className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-50"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            />

            <motion.div
              className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-50"
              animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            />

            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center relative z-10">
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-yellow-200 flex items-center justify-center mx-auto mb-5 shadow-lg"
              >
                <span className="text-5xl">{emoji}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Study Time!
                  </h3>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mb-6 text-lg leading-relaxed"
              >
                {message}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 mb-6 border border-emerald-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700">Before you start:</p>
                </div>
                <p className="text-emerald-600">{breakSuggestion}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300"
                  onClick={onDismiss}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Let's Do This!
                </Button>

                <button
                  className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2 flex items-center justify-center gap-1"
                  onClick={onDismiss}
                >
                  <Heart className="w-3 h-3" />
                  Remind me later
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlarmPopup;
