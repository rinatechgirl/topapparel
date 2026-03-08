import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-6">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h1 className="mb-2 text-6xl font-display font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Page not found</p>
        <Button asChild>
          <a href="/">Back to Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
