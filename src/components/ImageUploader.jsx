import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

const ImageUploader = ({ onImageUpload, uploadedImage, isLoading, onReset }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        onImageUpload(files[0]);
      }
    },
    [onImageUpload]
  );

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload(file);
    }
  };

  if (uploadedImage) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 relative group">
        <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
          <img
            src={uploadedImage}
            alt="Uploaded"
            className="w-full h-full object-contain"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Classifying...</span>
              </div>
            </div>
          )}
        </div>
        {!isLoading && (
          <button
            onClick={onReset}
            className="absolute top-3 right-3 p-2 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-90"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isLoading ? "Processing your image..." : "Image uploaded successfully"}
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        bg-card border-2 border-dashed rounded-xl p-8
        flex flex-col items-center justify-center
        min-h-[400px] cursor-pointer
        transition-all duration-300
        ${isDragging 
          ? "border-primary bg-primary/5 glow" 
          : "border-border hover:border-primary/50 hover:bg-primary/5"
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
        <div className={`
          p-4 rounded-full mb-4 transition-all duration-300
          ${isDragging ? "bg-primary/20" : "bg-muted"}
        `}>
          {isDragging ? (
            <ImageIcon className="w-10 h-10 text-primary animate-float" />
          ) : (
            <Upload className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {isDragging ? "Drop your image here" : "Upload an image"}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Drag and drop an image, or click to browse. Supports JPG, PNG, and WEBP.
        </p>
      </label>
    </div>
  );
};

export default ImageUploader;
