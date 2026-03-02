import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserRole } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserRole, useIsCallerAdmin } from "../hooks/useQueries";

interface AppContextValue {
  isAdmin: boolean;
  userRole: UserRole;
  principalId: string | undefined;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: userRole = UserRole.guest } = useGetCallerUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const principalId = identity?.getPrincipal().toString();

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAdmin,
        userRole,
        principalId,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
