import { CheckCircle2, XCircle, Sparkles, Loader2, BarChart3 } from "lucide-react";

const PredictionResult = ({ prediction, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-primary/10 rounded-full mb-4 animate-pulse-glow">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Analyzing Image</h3>
        <p className="text-sm text-muted-foreground text-center">
          Our ML model is processing your image...
        </p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Sparkles className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Ready to Classify</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Upload an image to see the classification results appear here.
        </p>
      </div>
    );
  }

  if (prediction.error) {
    return (
      <div className="bg-card border border-destructive/50 rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-destructive/10 rounded-full mb-4">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Classification Failed</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {prediction.message}
        </p>
      </div>
    );
  }

  const confidencePercent = (prediction.confidence * 100).toFixed(1);

  return (
    <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 className="w-5 h-5 text-success" />
        <span className="text-sm font-medium text-success">Classification Complete</span>
      </div>

      {/* Main Prediction */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
        <p className="text-sm text-muted-foreground mb-2">Predicted Class</p>
        <h2 className="text-3xl font-bold gradient-text mb-4">{prediction.class}</h2>
        
        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-mono text-primary">{confidencePercent}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* All Predictions */}
      {prediction.all_predictions && prediction.all_predictions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">All Predictions</span>
          </div>
          <div className="space-y-3">
            {prediction.all_predictions.map((pred, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pred.class}</span>
                  <span className="font-mono text-foreground">{(pred.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/50 rounded-full"
                    style={{ width: `${pred.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionResult;
