import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, Sparkles } from "lucide-react";

const PendingApproval = () => {
  const { tenant, signOut, refreshTenant } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Rina's Fit</span>
          </div>
        </div>
        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warning/10 mx-auto mb-4">
              <Clock className="w-7 h-7 text-warning" />
            </div>
            <CardTitle className="font-display text-xl">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Your organization <span className="font-semibold text-foreground">{tenant?.business_name ?? "your business"}</span> has been registered and is awaiting approval from the platform administrator.
            </p>
            <p className="text-xs text-muted-foreground">
              You'll be able to access the system once your account is approved.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={refreshTenant} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Check Status
              </Button>
              <Button variant="secondary" onClick={signOut}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;
