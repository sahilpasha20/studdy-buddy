import { useState } from "react";
import { Subject } from "@/lib/planGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, X, BookOpen, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubjectFormProps {
  onGenerate: (subjects: Subject[]) => void;
}

const SubjectForm = ({ onGenerate }: SubjectFormProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "", chapters: [""], examDate: "" },
  ]);

  const addSubject = () => {
    setSubjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", chapters: [""], examDate: "" },
    ]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const updateChapter = (subjectId: string, chapterIndex: number, value: string) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        const chapters = [...s.chapters];
        chapters[chapterIndex] = value;
        return { ...s, chapters };
      })
    );
  };

  const addChapter = (subjectId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, chapters: [...s.chapters, ""] } : s
      )
    );
  };

  const removeChapter = (subjectId: string, chapterIndex: number) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId || s.chapters.length <= 1) return s;
        return { ...s, chapters: s.chapters.filter((_, i) => i !== chapterIndex) };
      })
    );
  };

  const handleSubmit = () => {
    const valid = subjects.filter(
      (s) => s.name.trim() && s.examDate && s.chapters.some((c) => c.trim())
    );
    if (valid.length > 0) {
      const cleaned = valid.map((s) => ({
        ...s,
        chapters: s.chapters.filter((c) => c.trim()),
      }));
      onGenerate(cleaned);
    }
  };

  const isValid = subjects.some(
    (s) => s.name.trim() && s.examDate && s.chapters.some((c) => c.trim())
  );

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-5 relative border-border/60 bg-card shadow-sm">
              {subjects.length > 1 && (
                <button
                  onClick={() => removeSubject(subject.id)}
                  className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Subject {index + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Subject Name
                  </label>
                  <Input
                    placeholder="e.g. Mathematics"
                    value={subject.name}
                    onChange={(e) => updateSubject(subject.id, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Exam Date
                  </label>
                  <Input
                    type="date"
                    value={subject.examDate}
                    onChange={(e) => updateSubject(subject.id, "examDate", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Chapters / Topics
                </label>
                <div className="space-y-2">
                  {subject.chapters.map((chapter, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                        {ci + 1}.
                      </span>
                      <Input
                        placeholder={`Chapter ${ci + 1}`}
                        value={chapter}
                        onChange={(e) => updateChapter(subject.id, ci, e.target.value)}
                        className="flex-1"
                      />
                      {subject.chapters.length > 1 && (
                        <button
                          onClick={() => removeChapter(subject.id, ci)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addChapter(subject.id)}
                  className="mt-2 text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add chapter
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="outline" onClick={addSubject} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          Generate Study Plan
        </Button>
      </div>
    </div>
  );
};

export default SubjectForm;
