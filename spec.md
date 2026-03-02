# TaskFlow - Daily Task Management App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full user authentication: sign up, login, logout with role-based access (Admin and Member)
- Dashboard with task summary cards: Total, Completed, Pending, High Priority
- Dashboard views: Today's tasks, Pending tasks, Completed tasks
- Task CRUD: create, read, update, delete tasks
- Task fields: title, description, priority (Low/Medium/High), due date, assigned member, status (pending/completed), reminder datetime
- Mark task as complete toggle
- Task assignment to specific registered members
- In-app notifications for reminders (no email, email is disabled)
- Task filters: by priority, by status, by assigned member
- Task sorting: by due date
- Task search by title/description
- Sidebar navigation with sections: Dashboard, My Tasks, All Tasks (admin), Members (admin), Notifications
- Dark/Light mode toggle
- Activity log per task (who changed what and when)
- Comments section per task
- Calendar view for tasks by due date
- Drag-and-drop task status change (pending <-> completed)

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan

### Backend (Motoko)
- User management: register, login (principal-based auth via authorization component), get all members
- Role management: assign Admin or Member role per user
- Task data model: id, title, description, priority, status, dueDate, assignedTo, createdBy, reminder, createdAt, updatedAt
- Task operations: createTask, updateTask, deleteTask, getTasks, getTaskById, markComplete, getTasksByAssignee
- Notification model: id, userId, message, taskId, read, createdAt
- Notification operations: getNotifications, markNotificationRead, createNotification
- Activity log model: id, taskId, userId, action, timestamp
- Comment model: id, taskId, userId, text, createdAt
- Comment operations: addComment, getComments

### Frontend (React + TypeScript)
- Authentication pages: Login, Sign Up
- Sidebar layout with navigation links and dark/light mode toggle
- Dashboard page: summary cards + today/pending/completed task lists
- Tasks page: full task list with search, filters, sort
- Task detail modal/drawer: edit, delete, mark complete, view comments, add comment, view activity log
- Create/Edit Task modal: all task fields including reminder datetime
- Calendar page: monthly calendar view with tasks on due dates
- Notifications panel: in-app notification list with unread count badge
- Members page (Admin only): list registered members
- Drag-and-drop on task cards to change status
- Mobile-responsive layout with collapsible sidebar
