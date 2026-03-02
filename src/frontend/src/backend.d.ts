import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TaskInput {
    title: string;
    assignedTo?: Principal;
    reminder?: bigint;
    dueDate: bigint;
    description: string;
    priority: Variant_low_high_medium;
}
export interface Comment {
    id: bigint;
    userId: Principal;
    createdAt: bigint;
    text: string;
    taskId: bigint;
}
export interface Notification {
    id: bigint;
    userId: Principal;
    createdAt: bigint;
    read: boolean;
    taskId?: bigint;
    message: string;
}
export interface ActivityLog {
    action: string;
    userId: Principal;
    taskId: bigint;
    timestamp: bigint;
}
export interface Task {
    id: bigint;
    status: Variant_pending_completed;
    title: string;
    assignedTo?: Principal;
    reminder?: bigint;
    createdAt: bigint;
    createdBy: Principal;
    dueDate: bigint;
    description: string;
    updatedAt: bigint;
    priority: Variant_low_high_medium;
}
export interface RoleView {
    principal: Principal;
    role: UserRole;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_low_high_medium {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum Variant_pending_completed {
    pending = "pending",
    completed = "completed"
}
export interface backendInterface {
    addComment(taskId: bigint, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCompletedTasks(): Promise<void>;
    clearOldNotifications(): Promise<void>;
    createNotification(userId: Principal, message: string, taskId: bigint | null): Promise<void>;
    createTask(taskInput: TaskInput): Promise<bigint>;
    deleteComment(commentId: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMembers(): Promise<Array<RoleView>>;
    getMyNotifications(): Promise<Array<Notification>>;
    getMyTasks(): Promise<Array<Task>>;
    getTaskActivityLog(taskId: bigint): Promise<Array<ActivityLog>>;
    getTaskComments(taskId: bigint): Promise<Array<Comment>>;
    getTasksByAssignee(assignee: Principal): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(notificationId: bigint): Promise<void>;
    markTaskComplete(taskId: bigint): Promise<void>;
    markTaskPending(taskId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateTask(taskId: bigint, taskInput: TaskInput): Promise<void>;
}
