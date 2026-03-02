import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Users, Zap } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: CheckCircle,
    title: "Smart Task Management",
    desc: "Create, assign, and track tasks with priorities and due dates",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Assign tasks to team members and track progress together",
  },
  {
    icon: Shield,
    title: "Secure & Decentralized",
    desc: "Built on the Internet Computer — your data, your control",
  },
];

export function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left panel */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 lg:py-0 lg:max-w-lg">
        <div className="max-w-sm mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-glow">
              <Zap
                className="w-5 h-5 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
            <span className="font-display font-bold text-2xl text-foreground tracking-tight">
              TaskFlow
            </span>
          </div>

          <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-3">
            Manage your day,
            <br />
            <span className="text-primary">one task at a time.</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-8">
            A clean, focused workspace for you and your team to stay on top of
            what matters most.
          </p>

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn || isInitializing}
            size="lg"
            className="w-full h-12 text-base font-semibold shadow-glow"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            No password needed. Powered by{" "}
            <span className="text-foreground font-medium">
              Internet Computer
            </span>
            .
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-primary/8 blur-2xl" />
        </div>

        <div className="relative z-10 max-w-sm w-full space-y-5">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
              Why TaskFlow
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Built for focused teams
            </h2>
          </div>

          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 p-4 rounded-xl bg-card/80 border border-border backdrop-blur-sm shadow-card"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground mb-0.5">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
