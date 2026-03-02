import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Bell, Menu } from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import {
  useGetCallerUserProfile,
  useGetMyNotifications,
} from "../../hooks/useQueries";
import { getInitials } from "../../utils/taskUtils";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { setSidebarOpen } = useAppContext();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: notifications = [] } = useGetMyNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = userProfile?.name ?? "User";

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-2 text-foreground"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="font-display font-bold text-lg text-foreground flex-1">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <Link to="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        {/* Avatar */}
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
