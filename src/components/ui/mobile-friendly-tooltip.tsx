
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

export function MobileFriendlyTooltip({
  children,
  content,
  className,
}: {
  children: React.ReactNode
  content: React.ReactNode,
  className?: string
}) {
  const hasHover = window.matchMedia('(hover: hover)').matches
  
  return hasHover ? (
    <Tooltip delayDuration={0}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent className={className}>{content}</TooltipContent>
    </Tooltip>
  ) : (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className={className}>{content}</PopoverContent>
    </Popover>
  )
}

export default MobileFriendlyTooltip;