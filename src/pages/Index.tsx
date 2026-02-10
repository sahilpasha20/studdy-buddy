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
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("syllabus", syllabus);
      formData.append("datesheet", datesheet);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdfs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to parse PDFs" }));
        throw new Error(err.error || "Failed to parse PDFs");
      }

      const data = await response.json();

      if (!data.subjects || data.subjects.length === 0) {
        toast.error("Couldn't extract any subjects from your PDFs. Try clearer files.");
        return;
      }

      // Add IDs and generate plan
      const subjects: Subject[] = data.subjects.map((s: any, i: number) => ({
        id: String(i),
        name: s.name,
        chapters: s.chapters,
        examDate: s.examDate,
      }));

      const generatedPlan = generateStudyPlan(subjects);
      if (generatedPlan.length === 0) {
        toast.error("All exam dates seem to be in the past.");
        return;
      }

      setPlan(generatedPlan);
      toast.success(`Plan generated for ${subjects.length} subjects!`);
    } catch (err: any) {
      console.error("Parse error:", err);
      toast.error(err.message || "Something went wrong parsing your PDFs.");
    } finally {
      setIsProcessing(false);
    }
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
            Upload your syllabus and datesheet PDFs — get a realistic day-by-day study plan with 1 chapter per day and 4 days of revision.
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
