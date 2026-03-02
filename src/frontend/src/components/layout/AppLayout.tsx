import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
