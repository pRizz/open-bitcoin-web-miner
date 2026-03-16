import React from "react";
import { Code2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SOURCE_CODE_ARIA_LABEL,
  SOURCE_CODE_LABEL,
  SOURCE_CODE_URL,
} from "@/constants/urls";
import { cn } from "@/lib/utils";

type SourceCodeLinkProps = {
  mode: "icon" | "labeled" | "sidebar";
  className?: string;
  maybeLabel?: string;
  labeledDisplay?: "button" | "link";
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

function SourceCodeAnchor({
  className,
  onClick,
  children,
}: React.PropsWithChildren<{
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}>) {
  return (
    <a
      aria-label={SOURCE_CODE_ARIA_LABEL}
      className={className}
      href={SOURCE_CODE_URL}
      onClick={onClick}
      rel="noopener noreferrer"
      target="_blank"
      title={SOURCE_CODE_ARIA_LABEL}
    >
      {children}
    </a>
  );
}

export function SourceCodeLink({
  mode,
  className,
  maybeLabel = SOURCE_CODE_LABEL,
  labeledDisplay = "button",
  buttonVariant,
  buttonSize,
  onClick,
}: SourceCodeLinkProps) {
  const content = (
    <>
      <Code2 className="h-4 w-4" />
      {mode !== "icon" && (
        <span className={cn(mode === "sidebar" && "font-medium")}>
          {maybeLabel}
        </span>
      )}
    </>
  );

  if (mode === "icon") {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              asChild
              className={className}
              size={buttonSize ?? "icon"}
              variant={buttonVariant ?? "outline"}
            >
              <SourceCodeAnchor>{content}</SourceCodeAnchor>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{SOURCE_CODE_ARIA_LABEL}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (mode === "sidebar") {
    return (
      <SidebarMenuButton asChild className={className}>
        <SourceCodeAnchor onClick={onClick}>
          {content}
        </SourceCodeAnchor>
      </SidebarMenuButton>
    );
  }

  if (labeledDisplay === "link") {
    return (
      <SourceCodeAnchor
        className={cn(
          "inline-flex items-center gap-2 transition-colors duration-200 hover:text-foreground",
          className,
        )}
        onClick={onClick}
      >
        {content}
      </SourceCodeAnchor>
    );
  }

  return (
    <Button
      asChild
      className={className}
      size={buttonSize ?? "sm"}
      variant={buttonVariant ?? "outline"}
    >
      <SourceCodeAnchor onClick={onClick}>{content}</SourceCodeAnchor>
    </Button>
  );
}
