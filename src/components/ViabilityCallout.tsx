import React from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, BarChart3 } from "lucide-react";
import { TypedLink } from "@/components/TypedLink";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { routes } from "@/routes";

type ViabilityCalloutProps = {
  variant: "compact" | "card";
  title: string;
  description: React.ReactNode;
  ctaLabel: string;
  className?: string;
};

export function ViabilityCallout({
  variant,
  title,
  description,
  ctaLabel,
  className,
}: ViabilityCalloutProps) {
  const location = useLocation();

  if (location.pathname === routes.homeBitcoinMining.path) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-lg border border-blue-500/20 bg-blue-500/5 p-4",
          className,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span>{title}</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <TypedLink
            routeKeyName="homeBitcoinMining"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue-300 transition-colors hover:text-blue-200"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </TypedLink>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "border-blue-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_40%),hsl(var(--card))]",
        className,
      )}
    >
      <CardHeader className="gap-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-blue-200/80">
          <BarChart3 className="h-4 w-4" />
          <span>Mining viability</span>
        </div>
        <CardTitle className="text-2xl leading-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm leading-7 text-muted-foreground">
        <p>{description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="border-blue-400/30 bg-background/40 hover:bg-background/70">
          <TypedLink routeKeyName="homeBitcoinMining">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </TypedLink>
        </Button>
      </CardFooter>
    </Card>
  );
}
