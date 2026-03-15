import React from "react";

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

type MobileFriendlyTooltipProps = {
  children: React.ReactNode
  content: React.ReactNode,
  className?: string
  tooltipProviderKey?: string
}

export function MobileFriendlyTooltip({
  children,
  content,
  className,
  tooltipProviderKey,
}: MobileFriendlyTooltipProps) {
  const hasHover = window.matchMedia('(hover: hover)').matches

  return hasHover ? (
    <TooltipProvider key={tooltipProviderKey}>
      <Tooltip delayDuration={0} key={tooltipProviderKey}>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent className={className}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className={className}>{content}</PopoverContent>
    </Popover>
  )
}

export default MobileFriendlyTooltip;