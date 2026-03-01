import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Subject } from "@/lib/planGenerator";
import { format, parseISO } from "date-fns";

export interface StudyPace {
  minutesPerChapter: number;
  hoursPerDay: number;
}

interface SubjectPickerProps {
  subjects: Subject[];
  onConfirm: (selected: Subject[], pace: StudyPace) => void;
  onBack: () => void;
}

const SubjectPicker = ({ subjects, onConfirm, onBack }: SubjectPickerProps) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(subjects.map((s) => s.id))
  );
  const [minutesPerChapter, setMinutesPerChapter] = useState(60);
  const [hoursPerDay, setHoursPerDay] = useState(4);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chaptersPerDay = Math.max(1, Math.floor((hoursPerDay * 60) / minutesPerChapter));

  const handleConfirm = () => {
    const picked = subjects.filter((s) => selected.has(s.id));
    if (picked.length > 0) onConfirm(picked, { minutesPerChapter, hoursPerDay });
  };

  return (
    <div className="space-y-5">
      <Card className="p-6 border-border/60 bg-card shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Select Subjects
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          We extracted these from your PDFs. Uncheck any you want to skip.
        </p>

        <div className="space-y-2">
          {subjects.map((subject, i) => {
            const isSelected = selected.has(subject.id);
            return (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => toggle(subject.id)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 bg-muted/20 opacity-60"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {subject.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {subject.chapters.length} chapters · Exam{" "}
                    {format(parseISO(subject.examDate), "MMM d, yyyy")}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 border-border/60 bg-card shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Time Per Chapter
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          How long does it usually take you to complete one chapter?
        </p>
        <div className="space-y-3">
          <Slider
            value={[minutesPerChapter]}
            onValueChange={([v]) => setMinutesPerChapter(v)}
            min={15}
            max={180}
            step={15}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">15 min</span>
            <span className="font-semibold text-primary">
              {minutesPerChapter >= 60
                ? `${Math.floor(minutesPerChapter / 60)}h ${minutesPerChapter % 60 > 0 ? `${minutesPerChapter % 60}m` : ''}`
                : `${minutesPerChapter} min`} per chapter
            </span>
            <span className="text-muted-foreground">3 hrs</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border/60 bg-card shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Daily Study Time
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          How many hours can you study each day?
        </p>
        <div className="space-y-3">
          <Slider
            value={[hoursPerDay]}
            onValueChange={([v]) => setHoursPerDay(v)}
            min={1}
            max={12}
            step={1}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">1 hr</span>
            <span className="font-semibold text-primary">{hoursPerDay} hours/day</span>
            <span className="text-muted-foreground">12 hrs</span>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-primary/30 bg-primary/5">
        <p className="text-sm text-foreground font-medium text-center">
          Based on your pace: <span className="text-primary">{chaptersPerDay} chapter{chaptersPerDay !== 1 ? 's' : ''}</span> per day
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          ({minutesPerChapter} min/chapter x {chaptersPerDay} = {minutesPerChapter * chaptersPerDay} min = {(minutesPerChapter * chaptersPerDay / 60).toFixed(1)} hrs of study)
        </p>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Re-upload
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          Generate Plan ({selected.size} subjects)
        </Button>
      </div>
    </div>
  );
};

export default SubjectPicker;
