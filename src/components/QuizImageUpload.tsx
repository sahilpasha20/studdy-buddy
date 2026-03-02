import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Image as ImageIcon, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizImageUploadProps {
  isOpen: boolean;
  chapterName: string;
  subjectName: string;
  onClose: () => void;
  onImagesReady: (images: File[]) => void;
  isProcessing: boolean;
}

const QuizImageUpload = ({
  isOpen,
  chapterName,
  subjectName,
  onClose,
  onImagesReady,
  isProcessing,
}: QuizImageUploadProps) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      const newImages = [...images, ...imageFiles].slice(0, 5);
      setImages(newImages);

      const newPreviews = newImages.map((file) => URL.createObjectURL(file));
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews(newPreviews);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (images.length > 0) {
      onImagesReady(images);
    }
  };

  const handleClose = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setImages([]);
    setPreviews([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-gray-900">Upload Chapter Photos</h3>
              <div className="w-5" />
            </div>

            <p className="text-sm text-gray-600 mb-4 text-center">
              Upload pictures of your <span className="font-semibold">{chapterName}</span> chapter
              from {subjectName} to generate quiz questions
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            {previews.length > 0 ? (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {previews.map((preview, index) => (
                    <motion.div
                      key={preview}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={preview}
                        alt={`Chapter page ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {images.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add more photos ({5 - images.length} remaining)
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">
                    Take photos or upload images
                  </p>
                  <p className="text-sm text-gray-500">
                    Capture your textbook pages, notes, or diagrams
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Up to 5 images</p>
                </div>
              </div>
            )}

            <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-200">
              <div className="flex items-start gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  <span className="font-medium">Tip:</span> For best results, upload clear photos
                  of key concepts, definitions, diagrams, and important points from your chapter.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={images.length === 0 || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing your photos...
                </>
              ) : (
                <>Generate Quiz Questions</>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizImageUpload;
