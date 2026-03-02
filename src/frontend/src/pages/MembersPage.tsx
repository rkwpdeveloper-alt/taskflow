import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Loader2, Shield, User, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import { PageWrapper } from "../components/layout/AppLayout";
import { Header } from "../components/layout/Header";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAssignRole,
  useGetMembers,
  useGetUserProfile,
} from "../hooks/useQueries";
import { getInitials, shortenPrincipal } from "../utils/taskUtils";

function RoleBadge({ role }: { role: UserRole }) {
  const configs: Record<UserRole, { label: string; className: string }> = {
    [UserRole.admin]: {
      label: "Admin",
      className:
        "bg-[oklch(var(--warning)/0.15)] text-[oklch(var(--warning))] border-[oklch(var(--warning)/0.3)]",
    },
    [UserRole.user]: {
      label: "Member",
      className: "bg-primary/10 text-primary border-primary/30",
    },
    [UserRole.guest]: {
      label: "Guest",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const config = configs[role] ?? configs[UserRole.guest];

  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function MemberRow({
  principal,
  role,
  currentPrincipal,
  onRoleChange,
}: {
  principal: string;
  role: UserRole;
  currentPrincipal: string | undefined;
  onRoleChange: (principal: string, role: UserRole) => void;
}) {
  const { data: profile } = useGetUserProfile(principal);
  const displayName = profile?.name ?? shortenPrincipal(principal);
  const isSelf = principal === currentPrincipal;

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          {displayName}
          {isSelf && (
            <span className="text-[10px] text-muted-foreground font-normal">
              (you)
            </span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">
          {shortenPrincipal(principal)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <RoleBadge role={role} />
        {!isSelf && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
              >
                Change <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onRoleChange(principal, UserRole.admin)}
              >
                <Shield className="h-3.5 w-3.5 mr-2 text-[oklch(var(--warning))]" />
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRoleChange(principal, UserRole.user)}
              >
                <UserCheck className="h-3.5 w-3.5 mr-2 text-primary" />
                Make Member
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRoleChange(principal, UserRole.guest)}
              >
                <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Make Guest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export function MembersPage() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString();
  const { data: members = [], isLoading } = useGetMembers();
  const assignRole = useAssignRole();
  const [_changingPrincipal, setChangingPrincipal] = useState<string | null>(
    null,
  );

  const handleRoleChange = async (principal: string, role: UserRole) => {
    setChangingPrincipal(principal);
    try {
      await assignRole.mutateAsync({ principal, role });
      toast.success("Role updated successfully");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setChangingPrincipal(null);
    }
  };

  const admins = members.filter((m) => m.role === UserRole.admin);
  const regularMembers = members.filter((m) => m.role !== UserRole.admin);

  return (
    <>
      <Header title="Members" />
      <PageWrapper>
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Team Members
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading ? (
                  <Skeleton className="h-4 w-32 inline-block" />
                ) : (
                  `${members.length} member${members.length !== 1 ? "s" : ""} in your workspace`
                )}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card"
                >
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="space-y-5">
              {admins.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                    Admins
                  </p>
                  <div className="space-y-2">
                    {admins.map((member) => (
                      <MemberRow
                        key={member.principal.toString()}
                        principal={member.principal.toString()}
                        role={member.role}
                        currentPrincipal={currentPrincipal}
                        onRoleChange={handleRoleChange}
                      />
                    ))}
                  </div>
                </section>
              )}

              {regularMembers.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                    Members
                  </p>
                  <div className="space-y-2">
                    {regularMembers.map((member) => (
                      <MemberRow
                        key={member.principal.toString()}
                        principal={member.principal.toString()}
                        role={member.role}
                        currentPrincipal={currentPrincipal}
                        onRoleChange={handleRoleChange}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
