import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type GradeLevel = "6" | "7" | "8" | "9" | "11";

interface UploadFormProps {
  onFilesReady: (syllabus: File, datesheet: File, grade: GradeLevel) => void;
  isProcessing?: boolean;
}

interface DropZoneProps {
  label: string;
  description: string;
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

const DropZone = ({ label, description, file, onFile, onClear }: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile && droppedFile.type === "application/pdf") {
        onFile(droppedFile);
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFile(selected);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
        ${isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
      />
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Upload className="w-5 h-5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      <p className="text-xs text-muted-foreground mt-2">PDF files only</p>
    </div>
  );
};

const GRADE_OPTIONS: { value: GradeLevel; label: string }[] = [
  { value: "6", label: "Class 6 (Form VI)" },
  { value: "7", label: "Class 7 (Form VII)" },
  { value: "8", label: "Class 8 (Form VIII)" },
  { value: "9", label: "Class 9 (Form IX)" },
  { value: "11", label: "Class 11 (Form XI)" },
];

const UploadForm = ({ onFilesReady, isProcessing }: UploadFormProps) => {
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [datesheet, setDatesheet] = useState<File | null>(null);
  const [grade, setGrade] = useState<GradeLevel | null>(null);

  const canGenerate = syllabus && datesheet && grade && !isProcessing;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/60 bg-card shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Upload Your Files</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Select your class and upload your syllabus and datesheet PDFs. We'll extract everything and build your plan automatically.
        </p>

        <div className="mb-5">
          <Label htmlFor="grade-select" className="text-sm font-medium mb-2 block">
            Select Your Class
          </Label>
          <Select value={grade || ""} onValueChange={(v) => setGrade(v as GradeLevel)}>
            <SelectTrigger id="grade-select" className="w-full">
              <SelectValue placeholder="Choose your class/form" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DropZone
            label="Syllabus"
            description="Subjects & chapters list"
            file={syllabus}
            onFile={setSyllabus}
            onClear={() => setSyllabus(null)}
          />
          <DropZone
            label="Datesheet"
            description="Exam schedule & dates"
            file={datesheet}
            onFile={setDatesheet}
            onClear={() => setDatesheet(null)}
          />
        </div>
      </Card>

      <Button
        onClick={() => canGenerate && onFilesReady(syllabus!, datesheet!, grade!)}
        disabled={!canGenerate}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Parsing your PDFs...
          </>
        ) : (
          "Generate Study Plan"
        )}
      </Button>
    </div>
  );
};

export default UploadForm;
