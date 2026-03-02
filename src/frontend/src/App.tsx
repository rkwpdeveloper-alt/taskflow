import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppLayout } from "./components/layout/AppLayout";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import { useGetMyTasks } from "./hooks/useQueries";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MembersPage } from "./pages/MembersPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfileSetupModal } from "./pages/ProfileSetupModal";
import { TaskListPage } from "./pages/TaskListPage";
import { nanosToDate } from "./utils/taskUtils";

// ─── Reminder checker ─────────────────────────────────────────────────────────

function ReminderChecker() {
  const { data: tasks = [] } = useGetMyTasks();

  useEffect(() => {
    if (!tasks.length) return;

    const now = new Date();
    const WINDOW_MS = 5 * 60 * 1000; // 5 min window

    for (const task of tasks) {
      if (task.reminder === undefined) continue;
      if (task.status === "completed") continue;

      const reminderTime = nanosToDate(task.reminder);
      const diff = now.getTime() - reminderTime.getTime();

      // Show notification if reminder was within the last 5 minutes
      if (diff >= 0 && diff <= WINDOW_MS) {
        const key = `reminder-shown-${task.id.toString()}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          toast.warning(`⏰ Reminder: "${task.title}" is due soon`, {
            duration: 10000,
          });
        }
      }
    }
  }, [tasks]);

  return null;
}

// ─── Auth Guard Component ─────────────────────────────────────────────────────

function AuthenticatedApp() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  // Show login page if not authenticated
  if (!isAuthenticated && !isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading TaskFlow...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup if user is authenticated but no profile
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  if (showProfileSetup) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-background" />
        <ProfileSetupModal open />
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppProvider>
        <ReminderChecker />
        <RouterProvider router={router} />
        <Toaster />
      </AppProvider>
    </ThemeProvider>
  );
}

// ─── Router setup ─────────────────────────────────────────────────────────────

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAppContext();
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 px-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="font-display font-bold text-lg text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to view this page.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
});

const myTasksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/my-tasks",
  component: () => <TaskListPage mode="my" />,
});

const allTasksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/all-tasks",
  component: () => (
    <AdminGuard>
      <TaskListPage mode="all" />
    </AdminGuard>
  ),
});

const calendarRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/calendar",
  component: CalendarPage,
});

const membersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/members",
  component: () => (
    <AdminGuard>
      <MembersPage />
    </AdminGuard>
  ),
});

const notificationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    dashboardRoute,
    myTasksRoute,
    allTasksRoute,
    calendarRoute,
    membersRoute,
    notificationsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  return <AuthenticatedApp />;
}
