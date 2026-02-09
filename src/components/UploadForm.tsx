import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadFormProps {
  onFilesReady: (syllabus: File, datesheet: File) => void;
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

const UploadForm = ({ onFilesReady, isProcessing }: UploadFormProps) => {
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [datesheet, setDatesheet] = useState<File | null>(null);

  const canGenerate = syllabus && datesheet && !isProcessing;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/60 bg-card shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Upload Your Files</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Drop your syllabus and datesheet PDFs below — we'll extract everything and build your plan automatically.
        </p>

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
        onClick={() => canGenerate && onFilesReady(syllabus!, datesheet!)}
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
