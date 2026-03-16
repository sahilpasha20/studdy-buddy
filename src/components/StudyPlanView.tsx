import { useState } from "react";
import { DayPlan } from "@/lib/planGenerator";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, RefreshCw, FileText, ArrowLeft, Star, Trophy, Coffee, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NotificationSettings } from "@/components/NotificationSettings";
import { RewardState, getAvailableBreaks, getRandomReward } from "@/lib/rewards";
import confetti from "canvas-confetti";
import { RewardEvent } from "@/lib/rewards";
import ChapterCompletionPopup from "./ChapterCompletionPopup";
import QuizImageUpload from "./QuizImageUpload";
import QuizTypeSelector, { QuizType, QuizDifficulty } from "./QuizTypeSelector";
import QuizDisplay, { MCQQuestion, ShortLongQuestion } from "./QuizDisplay";

interface StudyPlanViewProps {
  plan: DayPlan[];
  onReset: () => void;
  reminder: {
    reminderTime: string;
    reminderEnabled: boolean;
    notificationPermission: "granted" | "denied" | "default";
    soundEnabled: boolean;
    enableReminder: (time: string) => Promise<void>;
    disableReminder: () => void;
    requestPermission: () => Promise<"granted" | "denied" | "default">;
    toggleSound: (enabled: boolean) => void;
  };
  checkedTasks: Set<string>;
  onToggleTask: (taskKey: string) => Promise<RewardEvent | null | undefined>;
  onReminderChange: (time: string, enabled: boolean) => void;
  rewardState: RewardState;
}

const typeConfig = {
  study: {
    icon: BookOpen,
    label: "Study",
    bg: "bg-study/10",
    text: "text-study",
    border: "border-study/20",
    dot: "bg-study",
  },
  revision: {
    icon: RefreshCw,
    label: "Revision",
    bg: "bg-revision/10",
    text: "text-revision",
    border: "border-revision/20",
    dot: "bg-revision",
  },
  exam: {
    icon: FileText,
    label: "Exam",
    bg: "bg-exam/10",
    text: "text-exam",
    border: "border-exam/20",
    dot: "bg-exam",
  },
};

const StudyPlanView = ({ plan, onReset, reminder, checkedTasks, onToggleTask, onReminderChange, rewardState }: StudyPlanViewProps) => {
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [breakSuggestion, setBreakSuggestion] = useState("");

  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completedChapter, setCompletedChapter] = useState({ chapter: "", subject: "" });
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType>("mcq");
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [shortLongQuestions, setShortLongQuestions] = useState<ShortLongQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const {
    reminderTime,
    reminderEnabled,
    notificationPermission,
    soundEnabled,
    enableReminder,
    disableReminder,
    requestPermission,
    toggleSound,
  } = reminder;

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#10b981', '#3b82f6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#10b981', '#3b82f6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handleToggleTask = async (taskKey: string, task?: { subject: string; chapters: string[]; type: string }) => {
    const wasChecked = checkedTasks.has(taskKey);
    const event = await onToggleTask(taskKey);
    if (event?.type === 'confetti') {
      triggerConfetti();
    }

    if (!wasChecked && task && task.type === "study" && task.chapters.length > 0) {
      setCompletedChapter({
        chapter: task.chapters.join(", "),
        subject: task.subject,
      });
      setShowCompletionPopup(true);
    }
  };

  const handleUnderstood = () => {
    setShowCompletionPopup(false);
    setShowImageUpload(true);
  };

  const handleQuizFromTask = (e: React.MouseEvent, task: { subject: string; chapters: string[] }) => {
    e.stopPropagation();
    setCompletedChapter({
      chapter: task.chapters.join(", "),
      subject: task.subject,
    });
    setShowImageUpload(true);
  };

  const handleImagesReady = (images: File[]) => {
    setUploadedImages(images);
    setShowImageUpload(false);
    setShowTypeSelector(true);
  };

  const handleQuizOptionsSelect = async (type: QuizType, difficulty: QuizDifficulty) => {
    setSelectedQuizType(type);
    setIsGeneratingQuiz(true);

    try {
      const formData = new FormData();
      formData.append("quizType", type);
      formData.append("difficulty", difficulty);
      formData.append("chapterName", completedChapter.chapter);
      formData.append("subjectName", completedChapter.subject);
      uploadedImages.forEach((img, i) => formData.append(`image${i}`, img));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();

      if (type === "mcq" && data.mcqQuestions) {
        setMcqQuestions(data.mcqQuestions);
      } else if (type === "short_long" && data.shortLongQuestions) {
        setShortLongQuestions(data.shortLongQuestions);
      }

      setShowTypeSelector(false);
      setShowQuiz(true);
    } catch (error) {
      console.error("Quiz generation error:", error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setShowQuiz(false);
    setShowImageUpload(true);
  };

  const handleBreakCheck = () => {
    const breaks = getAvailableBreaks(rewardState.chaptersCompletedToday);
    if (breaks > 0) {
      setBreakSuggestion(getRandomReward());
    } else {
      setBreakSuggestion("");
    }
    setShowBreakModal(true);
  };

  const handleBackFromBreak = () => {
    setShowBackModal(true);
    setShowBackButton(false);
  };

  const handleFloatingQuiz = () => {
    const todayPlan = plan.find((day) => isToday(parseISO(day.date)));
    const source = todayPlan ?? plan[0];
    const studyTask = source?.tasks.find((t) => t.type === "study" && t.chapters.length > 0);
    if (studyTask) {
      setCompletedChapter({ chapter: studyTask.chapters.join(", "), subject: studyTask.subject });
    }
    setShowImageUpload(true);
  };

  const getProgressMessage = () => {
    const { chaptersCompletedToday } = rewardState;
    if (chaptersCompletedToday === 0) return "Start studying to earn points!";
    if (chaptersCompletedToday === 1) return "Great start! Complete 1 more for a bonus!";
    if (chaptersCompletedToday === 2) return "Amazing! You earned a break bonus!";
    if (chaptersCompletedToday === 3) return "Incredible! Another bonus earned!";
    return `${chaptersCompletedToday} chapters today - you're on fire!`;
  };

  const handleEnableReminder = async (time: string) => {
    await enableReminder(time);
    onReminderChange(time, true);
  };

  const handleDisableReminder = () => {
    disableReminder();
    onReminderChange("", false);
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start Over
        </Button>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-700">{rewardState.totalPoints}</span>
                <span className="text-sm text-amber-600">points</span>
              </div>
              <p className="text-xs text-amber-600">{getProgressMessage()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-lg font-semibold text-amber-700">{rewardState.chaptersCompletedToday}</span>
              </div>
              <p className="text-[10px] text-amber-600">Today</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBreakCheck}
                className="flex items-center gap-1 border-green-300 text-green-700 hover:bg-green-50"
              >
                <Coffee className="w-3 h-3" />
                <span className="text-xs font-medium">Break</span>
              </Button>
              <AnimatePresence>
                {showBackButton && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBackFromBreak}
                      className="flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <span className="text-xs font-medium">I'm Back</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-6">
        <NotificationSettings
          reminderTime={reminderTime}
          reminderEnabled={reminderEnabled}
          notificationPermission={notificationPermission}
          soundEnabled={soundEnabled}
          onEnableReminder={handleEnableReminder}
          onDisableReminder={handleDisableReminder}
          onRequestPermission={requestPermission}
          onToggleSound={toggleSound}
        />
      </div>

      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-1">
          {plan.map((day, dayIndex) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: dayIndex * 0.03, duration: 0.3 }}
              className="relative pl-12"
            >
              <div className="absolute left-[15px] top-3 w-[9px] h-[9px] rounded-full bg-primary border-2 border-background z-10" />

              <div className="pb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-display text-lg text-foreground">
                    {getDateLabel(day.date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(day.date), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="space-y-2">
                  {day.tasks.map((task, taskIndex) => {
                    const cfg = typeConfig[task.type];
                    const Icon = cfg.icon;
                    const taskKey = `${day.date}-${taskIndex}`;
                    const isDone = checkedTasks.has(taskKey);
                    return (
                      <div
                        key={taskIndex}
                        className={`rounded-lg border ${cfg.border} ${cfg.bg} px-4 py-3 cursor-pointer transition-opacity ${isDone ? "opacity-50" : ""}`}
                        onClick={() => handleToggleTask(taskKey, task)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={() => handleToggleTask(taskKey, task)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                              <span className={`text-sm font-semibold ${cfg.text} ${isDone ? "line-through" : ""}`}>
                                {task.subject}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider font-medium ${cfg.text} opacity-60`}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className={`text-sm text-foreground/80 pl-5 ${isDone ? "line-through" : ""}`}>
                              {task.chapters.join(" · ")}
                            </div>
                          </div>
                          {task.type === "study" && task.chapters.length > 0 && (
                            <button
                              onClick={(e) => handleQuizFromTask(e, task)}
                              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1.5 transition-all flex-shrink-0"
                            >
                              <BrainCircuit className="w-3.5 h-3.5" />
                              Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showBreakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBreakModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎉</span>
                </div>
                {breakSuggestion ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">You Earned a Break!</h3>
                    <p className="text-gray-600 mb-4">
                      Amazing work! You've completed {rewardState.chaptersCompletedToday} chapters today. You deserve this!
                    </p>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-4 border border-green-200">
                      <p className="text-lg font-semibold text-green-700">{breakSuggestion}</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {getAvailableBreaks(rewardState.chaptersCompletedToday)} break{getAvailableBreaks(rewardState.chaptersCompletedToday) > 1 ? 's' : ''} available - you're doing great! 🌟
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Almost There!</h3>
                    <p className="text-gray-600 mb-4">
                      Complete 2 chapters to earn your first break! You've completed {rewardState.chaptersCompletedToday} so far.
                    </p>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <p className="text-sm text-amber-700">Keep going - you're almost there! 💪</p>
                    </div>
                  </>
                )}
                <Button
                  className="mt-4 w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowBreakModal(false);
                    if (breakSuggestion) {
                      setShowBackButton(true);
                    }
                  }}
                >
                  {breakSuggestion ? "Thanks, I'll take my break! ☕" : "Back to Studying 📚"}
                </Button>
                {breakSuggestion && (
                  <button
                    className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
                    onClick={() => {
                      setShowBreakModal(false);
                      setShowBackButton(false);
                    }}
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Great! Time to Lock In Again!</h3>
                <p className="text-gray-600 mb-6">
                  You're refreshed and ready to tackle the next chapter. Let's keep the momentum going!
                </p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowBackModal(false)}
                >
                  Let's Do This! 💪
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChapterCompletionPopup
        isOpen={showCompletionPopup}
        chapterName={completedChapter.chapter}
        subjectName={completedChapter.subject}
        onClose={() => setShowCompletionPopup(false)}
        onUnderstood={handleUnderstood}
      />

      <QuizImageUpload
        isOpen={showImageUpload}
        chapterName={completedChapter.chapter}
        subjectName={completedChapter.subject}
        onClose={() => setShowImageUpload(false)}
        onImagesReady={handleImagesReady}
        isProcessing={false}
      />

      <QuizTypeSelector
        isOpen={showTypeSelector}
        onClose={() => {
          setShowTypeSelector(false);
          setUploadedImages([]);
        }}
        onSelectOptions={handleQuizOptionsSelect}
        isLoading={isGeneratingQuiz}
      />

      <QuizDisplay
        isOpen={showQuiz}
        quizType={selectedQuizType}
        mcqQuestions={mcqQuestions}
        shortLongQuestions={shortLongQuestions}
        chapterName={completedChapter.chapter}
        onClose={() => setShowQuiz(false)}
        onRetake={handleRetakeQuiz}
      />

      <motion.button
        onClick={handleFloatingQuiz}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 transition-colors"
        title="Take a Quiz"
      >
        <BrainCircuit className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default StudyPlanView;
