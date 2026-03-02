import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  type Task = {
    id : Nat;
    title : Text;
    description : Text;
    priority : {
      #low;
      #medium;
      #high;
    };
    status : {
      #pending;
      #completed;
    };
    dueDate : Int;
    assignedTo : ?Principal;
    createdBy : Principal;
    reminder : ?Int;
    createdAt : Int;
    updatedAt : Int;
  };

  type Notification = {
    id : Nat;
    userId : Principal;
    message : Text;
    taskId : ?Nat;
    read : Bool;
    createdAt : Int;
  };

  type ActivityLog = {
    taskId : Nat;
    userId : Principal;
    action : Text;
    timestamp : Int;
  };

  type Comment = {
    id : Nat;
    taskId : Nat;
    userId : Principal;
    text : Text;
    createdAt : Int;
  };

  type TaskInput = {
    title : Text;
    description : Text;
    priority : {
      #low;
      #medium;
      #high;
    };
    dueDate : Int;
    assignedTo : ?Principal;
    reminder : ?Int;
  };

  type RoleView = {
    principal : Principal;
    role : Authorization.UserRole;
  };

  type UserProfile = {
    name : Text;
  };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Nat.compare(task1.id, task2.id);
    };
  };

  var nextTaskId = 0;
  var nextNotificationId = 0;
  var nextCommentId = 0;
  let tasks = Map.empty<Nat, Task>();
  let notifications = Map.empty<Nat, Notification>();
  let activityLogs = Map.empty<Nat, [ActivityLog]>();
  let comments = Map.empty<Nat, Comment>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Task Functions
  public shared ({ caller }) func createTask(taskInput : TaskInput) : async Nat {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You are not authorized to do this action. Please register or login first.");
    };
    let taskId = nextTaskId;
    nextTaskId += 1;
    let now = Time.now();
    let newTask : Task = {
      id = taskId;
      title = taskInput.title;
      description = taskInput.description;
      priority = taskInput.priority;
      status = #pending;
      dueDate = taskInput.dueDate;
      assignedTo = taskInput.assignedTo;
      createdBy = caller;
      reminder = taskInput.reminder;
      createdAt = now;
      updatedAt = now;
    };
    tasks.add(taskId, newTask);
    let logEntry : ActivityLog = {
      taskId;
      userId = caller;
      action = "Created task";
      timestamp = now;
    };
    activityLogs.add(taskId, [logEntry]);
    taskId;
  };

  public shared ({ caller }) func updateTask(taskId : Nat, taskInput : TaskInput) : async () {
    let existingTask = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
    if (
      caller != existingTask.createdBy
      and not Authorization.hasPermission(accessControlState, caller, #admin)
    ) {
      Runtime.trap("Unauthorized: Only creator or admin can update task");
    };
    let updatedTask : Task = {
      existingTask with
      title = taskInput.title;
      description = taskInput.description;
      priority = taskInput.priority;
      dueDate = taskInput.dueDate;
      assignedTo = taskInput.assignedTo;
      reminder = taskInput.reminder;
      updatedAt = Time.now();
    };
    tasks.add(taskId, updatedTask);
    let logEntry : ActivityLog = {
      taskId;
      userId = caller;
      action = "Updated task";
      timestamp = Time.now();
    };
    activityLogs.add(taskId, [logEntry]);
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    let task = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
    if (
      caller != task.createdBy
      and not Authorization.hasPermission(accessControlState, caller, #admin)
    ) {
      Runtime.trap("Unauthorized: Only creator or admin can delete task");
    };
    tasks.remove(taskId);
    let logEntry : ActivityLog = {
      taskId;
      userId = caller;
      action = "Deleted task";
      timestamp = Time.now();
    };
    activityLogs.add(taskId, [logEntry]);
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (Authorization.hasPermission(accessControlState, caller, #admin)) {
      return tasks.values().toArray().sort();
    };
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    tasks.values().toArray().filter(
      func(task) { task.createdBy == caller or task.assignedTo == ?caller }
    ).sort();
  };

  public query ({ caller }) func getMyTasks() : async [Task] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You need to login to get your tasks.");
    };
    tasks.values().toArray().filter(
      func(task) { task.createdBy == caller or task.assignedTo == ?caller }
    );
  };

  public query ({ caller }) func getTasksByAssignee(assignee : Principal) : async [Task] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    if (caller != assignee and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view tasks assigned to yourself unless you are an admin");
    };
    tasks.values().toArray().filter(
      func(task) {
        switch (task.assignedTo) {
          case (?assigned) { assigned == assignee };
          case (null) { false };
        };
      }
    );
  };

  public shared ({ caller }) func markTaskComplete(taskId : Nat) : async () {
    let task = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
    if (
      caller != task.createdBy
      and task.assignedTo != ?caller
      and not Authorization.hasPermission(accessControlState, caller, #admin)
    ) {
      Runtime.trap("Unauthorized: Only creator, assignee, or admin can update task");
    };
    let updatedTask : Task = { task with status = #completed; updatedAt = Time.now() };
    tasks.add(taskId, updatedTask);
    let logEntry : ActivityLog = {
      taskId;
      userId = caller;
      action = "Marked task as complete";
      timestamp = Time.now();
    };
    activityLogs.add(taskId, [logEntry]);
  };

  public shared ({ caller }) func markTaskPending(taskId : Nat) : async () {
    let task = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
    if (
      caller != task.createdBy
      and task.assignedTo != ?caller
      and not Authorization.hasPermission(accessControlState, caller, #admin)
    ) {
      Runtime.trap("Unauthorized: Only creator, assignee, or admin can update task");
    };
    let updatedTask : Task = { task with status = #pending; updatedAt = Time.now() };
    tasks.add(taskId, updatedTask);
    let logEntry : ActivityLog = {
      taskId;
      userId = caller;
      action = "Marked task as pending";
      timestamp = Time.now();
    };
    activityLogs.add(taskId, [logEntry]);
  };

  // Notification Functions
  public query ({ caller }) func getMyNotifications() : async [Notification] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You're not authorized to get your notifications. Please register or login first");
    };
    notifications.values().toArray().filter(func(notification) { notification.userId == caller });
  };

  public shared ({ caller }) func markNotificationRead(notificationId : Nat) : async () {
    let notification = switch (notifications.get(notificationId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?n) { n };
    };
    if (notification.userId != caller) {
      Runtime.trap("Unauthorized: Can only update your own notifications");
    };
    let updatedNotification : Notification = { notification with read = true };
    notifications.add(notificationId, updatedNotification);
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Please register or login to use this feature");
    };
    for ((id, notification) in notifications.entries()) {
      if (notification.userId == caller) {
        let updatedNotification : Notification = { notification with read = true };
        notifications.add(id, updatedNotification);
      };
    };
  };

  public shared ({ caller }) func createNotification(userId : Principal, message : Text, taskId : ?Nat) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can create notfications for members");
    };
    let newId = nextNotificationId;
    nextNotificationId += 1;
    let notification : Notification = {
      id = newId;
      userId;
      message;
      taskId;
      read = false;
      createdAt = Time.now();
    };
    notifications.add(newId, notification);
  };

  // Activity Log Functions
  public query ({ caller }) func getTaskActivityLog(taskId : Nat) : async [ActivityLog] {
    let task = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?t) { t };
    };
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view activity logs");
    };
    if (
      caller != task.createdBy
      and task.assignedTo != ?caller
      and not Authorization.isAdmin(accessControlState, caller)
    ) {
      Runtime.trap("Unauthorized: Can only view activity logs for your own tasks");
    };
    switch (activityLogs.get(taskId)) {
      case (null) { [] };
      case (?logs) { logs };
    };
  };

  // Comment Functions
  public shared ({ caller }) func addComment(taskId : Nat, text : Text) : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You're not authorized to add comments. Please login or register first. ");
    };
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (_) { () };
    };
    let newId = nextCommentId;
    nextCommentId += 1;
    let comment : Comment = {
      id = newId;
      taskId;
      userId = caller;
      text;
      createdAt = Time.now();
    };
    comments.add(newId, comment);
  };

  public query ({ caller }) func getTaskComments(taskId : Nat) : async [Comment] {
    let task = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?t) { t };
    };
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };
    if (
      caller != task.createdBy
      and task.assignedTo != ?caller
      and not Authorization.isAdmin(accessControlState, caller)
    ) {
      Runtime.trap("Unauthorized: Can only view comments for your own tasks");
    };
    comments.values().toArray().filter(func(comment) { comment.taskId == taskId });
  };

  public shared ({ caller }) func deleteComment(commentId : Nat) : async () {
    let comment = switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };
    if (
      caller != comment.userId
      and not Authorization.hasPermission(accessControlState, caller, #admin)
    ) {
      Runtime.trap("Unauthorized: Only author or admin can delete comment");
    };
    comments.remove(commentId);
  };

  // Member Functions
  public query ({ caller }) func getMembers() : async [RoleView] {
    if (not Authorization.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view members");
    };
    accessControlState.userRoles.values().toArray().map(
      func(role) { { principal = caller; role } }
    );
  };

  // Admin Functions
  public shared ({ caller }) func clearCompletedTasks() : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can do this action");
    };
    for ((id, task) in tasks.entries()) {
      if (task.status == #completed) {
        tasks.remove(id);
      };
    };
  };

  public shared ({ caller }) func clearOldNotifications() : async () {
    if (not Authorization.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can do this action");
    };
    for ((id, notification) in notifications.entries()) {
      if (notification.createdAt < Time.now() - 7 * 24 * 3600000000000) {
        notifications.remove(id);
      };
    };
  };
};
