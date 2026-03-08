import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const TenantNotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Organization Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The organization you're looking for doesn't exist or hasn't been set up yet.
        </p>
        <Button asChild>
          <a href="https://rinasfit.com">Go to Rina's Fit</a>
        </Button>
      </div>
    </div>
  );
};

export default TenantNotFound;
