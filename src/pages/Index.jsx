import { useState } from "react";
import ImageUploader from "../components/ImageUploader.jsx";
import PredictionResult from "../components/PredictionResult.jsx";
import Header from "../components/Header.jsx";
import WasteClassDetails from "../components/WasteClassDetails.jsx";
import { Leaf } from "lucide-react";

const Index = () => {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleClassify = async (file) => {
    setIsLoading(true);
    setPrediction(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Classification failed");
      }

      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      console.error("Error classifying image:", error);
      setPrediction({
        error: true,
        message: "Failed to classify image. Make sure the Flask API is running.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
    };
    reader.readAsDataURL(file);
    handleClassify(file);
  };

  const handleReset = () => {
    setPrediction(null);
    setUploadedImage(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Eco-friendly background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Eco-Friendly AI Classification</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Smart Waste Sorting</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Help protect our planet by properly classifying waste. Upload an image and our AI will identify the waste type for sustainable recycling.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {["🗃️ Cardboard", "🫙 Glass", "⚙️ Metal", "📄 Paper", "🧴 Plastic", "🗑️ Trash"].map((label) => (
                  <span key={label} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full border border-primary/20 hover:bg-primary/10 transition-colors">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-8 md:grid-cols-2">
              <ImageUploader
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImage}
                isLoading={isLoading}
                onReset={handleReset}
              />
              <PredictionResult
                prediction={prediction}
                isLoading={isLoading}
              />
            </div>

            {/* Waste Class Details - Only shows when an image is classified */}
            <WasteClassDetails predictedClass={prediction?.class} uploadedImage={uploadedImage} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
