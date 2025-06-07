import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "welcome-banner-dismissed";

export const WelcomeBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (!hasDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    localStorage.setItem(STORAGE_KEY, "true");

    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
        isClosing ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      )}
    >
      <div className="overflow-hidden">
        <Alert className="mb-6 relative p-4">
          <Info className="h-4 w-4" />
          <AlertTitle className="mb-2">Welcome to WinABitco.in!</AlertTitle>
          <AlertDescription>
            Experience the thrill of Bitcoin mining in your browser. Configure your mining settings,
            track your hash rate, and compete with others on the leaderboard. Start mining now to
            see if you can find the next block solution and win a Bitcoin!
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center"
              onClick={handleDismiss}
            >
              <X className="h-5 w-5" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};