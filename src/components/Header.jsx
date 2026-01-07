import { Recycle } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Recycle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Classifier</h1>
            <p className="text-xs text-muted-foreground">Powered by TensorFlow</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
