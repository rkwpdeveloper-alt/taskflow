import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bell, CheckCheck, Clock, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Notification } from "../backend.d";
import { PageWrapper } from "../components/layout/AppLayout";
import { Header } from "../components/layout/Header";
import {
  useGetMyNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../hooks/useQueries";
import { getRelativeTime } from "../utils/taskUtils";

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: bigint) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!notification.read) onMarkRead(notification.id);
    }
  };
  return (
    <article
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer group",
        notification.read
          ? "border-border bg-card opacity-70 hover:opacity-100"
          : "border-primary/20 bg-primary/5 hover:bg-primary/8",
      )}
      onClick={() => !notification.read && onMarkRead(notification.id)}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          notification.read
            ? "bg-muted text-muted-foreground"
            : "bg-primary/15 text-primary",
        )}
      >
        <Bell className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-relaxed",
            notification.read
              ? "text-muted-foreground"
              : "text-foreground font-medium",
          )}
        >
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {getRelativeTime(notification.createdAt)}
          </span>
          {!notification.read && (
            <span className="ml-auto text-[10px] text-primary font-medium group-hover:underline">
              Mark as read
            </span>
          )}
        </div>
      </div>

      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </article>
  );
}

export function NotificationsPage() {
  const { data: notifications = [], isLoading } = useGetMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sortedNotifications = [...notifications].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  const handleMarkRead = async (id: bigint) => {
    try {
      await markRead.mutateAsync(id);
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  return (
    <>
      <Header title="Notifications" />
      <PageWrapper>
        <div className="max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Notifications
              </h2>
              {!isLoading && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "All caught up!"}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </Button>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
                >
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id.toString()}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
