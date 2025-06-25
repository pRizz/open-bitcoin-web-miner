import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell } from "lucide-react";

interface NotificationBadgeProps {
  maybeClassName?: string;
  maybeShowIcon?: boolean;
}

export function NotificationBadge({ maybeClassName = "", maybeShowIcon = true }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${maybeClassName}`}>
      {maybeShowIcon && <Bell className="h-4 w-4" />}
      <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    </div>
  );
}