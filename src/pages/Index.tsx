import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap } from "lucide-react";
import UploadForm from "@/components/UploadForm";
import StudyPlanView from "@/components/StudyPlanView";
import { Subject, DayPlan, generateStudyPlan } from "@/lib/planGenerator";
import { toast } from "sonner";

const Index = () => {
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesReady = async (syllabus: File, datesheet: File) => {
    // TODO: Once Cloud is enabled, parse PDFs via edge function
    // For now, show a message that Cloud is needed
    toast.info("PDF parsing requires Lovable Cloud. Enable it to continue!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">
            Study Planner
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add your subjects, chapters, and exam dates — get a realistic day-by-day study plan instantly.
          </p>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {plan ? (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StudyPlanView plan={plan} onReset={() => setPlan(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UploadForm onFilesReady={handleFilesReady} isProcessing={isProcessing} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
