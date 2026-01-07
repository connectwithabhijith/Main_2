import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <p className="text-muted-foreground text-xl mb-8">Page not found</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
