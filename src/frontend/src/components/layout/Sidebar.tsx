import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  List,
  LogOut,
  Moon,
  Sun,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppContext } from "../../contexts/AppContext";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetMyNotifications } from "../../hooks/useQueries";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly: boolean;
  showBadge?: boolean;
}

interface SidebarProps {
  className?: string;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    to: "/my-tasks",
    label: "My Tasks",
    icon: CheckSquare,
    adminOnly: false,
  },
  {
    to: "/all-tasks",
    label: "All Tasks",
    icon: List,
    adminOnly: true,
  },
  {
    to: "/calendar",
    label: "Calendar",
    icon: Calendar,
    adminOnly: false,
  },
  {
    to: "/members",
    label: "Members",
    icon: Users,
    adminOnly: true,
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: Bell,
    adminOnly: false,
    showBadge: true,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { isAdmin, sidebarOpen, setSidebarOpen } = useAppContext();
  const { data: notifications = [] } = useGetMyNotifications();
  const routerState = useRouterState();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Zap
                className="w-4 h-4 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
            <span className="font-display font-bold text-lg text-sidebar-foreground tracking-tight">
              TaskFlow
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scrollbar">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
            Navigation
          </p>
          {visibleNavItems.map((item) => {
            const currentPath = routerState.location.pathname;
            const isActive =
              item.to === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.showBadge && unreadCount > 0 && (
                  <Badge
                    variant="default"
                    className="h-5 min-w-5 px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>

          {/* Logout */}
          {identity && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
