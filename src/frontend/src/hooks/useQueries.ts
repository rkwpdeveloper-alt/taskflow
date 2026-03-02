import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ActivityLog,
  Comment,
  Notification,
  RoleView,
  Task,
  TaskInput,
  UserProfile,
} from "../backend.d";
import { UserRole } from "../backend.d";
import { useActor } from "./useActor";

// ─── User Profile ───────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetUserProfile(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const { Principal } = await import("@dfinity/principal");
      return actor.getUserProfile(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<RoleView[]>({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: {
      principal: string;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      await actor.assignCallerUserRole(Principal.fromText(principal), role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function useGetMyTasks() {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["myTasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllTasks() {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["allTasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskInput: TaskInput) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createTask(taskInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      taskInput,
    }: {
      taskId: bigint;
      taskInput: TaskInput;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateTask(taskId, taskInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
    },
  });
}

export function useMarkTaskComplete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markTaskComplete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
    },
  });
}

export function useMarkTaskPending() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markTaskPending(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
    },
  });
}

export function useClearCompletedTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearCompletedTasks();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetTaskComments(taskId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ["comments", taskId?.toString()],
    queryFn: async () => {
      if (!actor || taskId === null) return [];
      return actor.getTaskComments(taskId);
    },
    enabled: !!actor && !isFetching && taskId !== null,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      text,
    }: {
      taskId: bigint;
      text: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addComment(taskId, text);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", taskId.toString()],
      });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      taskId: _taskId,
    }: {
      commentId: bigint;
      taskId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteComment(commentId);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", taskId.toString()],
      });
    },
  });
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export function useGetTaskActivityLog(taskId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ActivityLog[]>({
    queryKey: ["activityLog", taskId?.toString()],
    queryFn: async () => {
      if (!actor || taskId === null) return [];
      return actor.getTaskActivityLog(taskId);
    },
    enabled: !!actor && !isFetching && taskId !== null,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetMyNotifications() {
  const { actor, isFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
