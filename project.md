📘 PRODUCT REQUIREMENTS DOCUMENT (PRD)
Project: FocusFlow — Personal Productivity App
Version: 1.0
Author: Mohamed Ayoub Elhamdaoui
Last Updated: 18/11/2025
1. Product Summary

FocusFlow is a lightweight productivity platform that helps students and young professionals plan their tasks, deadlines, timetable, and focus sessions in one unified dashboard. The goal is to provide clarity, structure, and motivation without the complexity of professional project-management tools like ClickUp or Asana.

2. Problem Statement

Users currently struggle with:

Tasks scattered across random notes, Canvas pages, WhatsApp messages, or memory.

Missing deadlines or realising them too late.

Timetable (lectures/work shifts) not synced with tasks and planning.

No simple daily view showing exactly what needs to be done.

Existing tools feel too heavy, complicated, or not designed for single-user productivity.

FocusFlow aims to fix this by being simple, fast, and personal.

3. Goals & Objectives
Primary Goals

Provide a central hub for all tasks, deadlines, timetable events, and notes.

Increase user productivity with a daily dashboard and focus mode.

Help students manage coursework and study sessions effectively.

Success Metrics

Daily active use (DAU).

Number of tasks completed per week.

Streaks (days with at least one task completed).

Percentage of deadlines completed before due date.

Focus session minutes per day.

4. Target Users
Primary

University students balancing modules, labs, and coursework.

Young professionals managing projects, shifts, and personal goals.

Secondary

Anyone who wants a clean but powerful personal planning tool.

5. Core Features (Scope)

Below is the MVP + Phase 2 feature list.

5.1 Authentication (Phase 2)

Not required in MVP if using localStorage.

Sign up (email + password)

Login

Profile management (name, avatar, timezone)

Secure JWT-based session

5.2 Home Dashboard (MVP)

Route: /

Description:

Where users see everything important for today.

Requirements:

Greeting + date

Today’s tasks (due today or overdue)

Upcoming deadlines (next 3–5 items)

Today’s timetable preview

Quick Start Pomodoro button

Mini analytics (e.g., tasks completed this week)

5.3 Tasks Module (MVP)

Route: /tasks

Requirements:

Add / edit / delete tasks

Fields:

Title

Description (optional)

Due date

Priority

Category (Uni / Work / Personal)

Status (To Do / In Progress / Done)

Views:

Today

This Week

Completed

Filters:

By category, priority

Quick-add bar

Mark complete with animation

5.4 Deadlines Module (MVP)

Route: /deadlines

Requirements:

Create and manage big deadlines (exams, coursework, projects)

Fields:

Title

Type (Assignment / Exam / Project)

Module

Due date

Estimated hours

Notes / URL

Status

List view

Deadline urgency colours:

Red (<2 days)

Orange (<7 days)

Normal (>7 days)

5.5 Timetable Module (MVP)

Route: /timetable

Requirements:

Weekly timetable grid

Add/edit/delete events

Fields:

Title

Day of week

Start/End time

Location (optional)

Category (Lecture / Lab / Work / Other)

Display as block elements

Repeats weekly

5.6 Calendar View (Phase 2)

Route: /calendar

Requirements:

Month view

Dots/badges showing:

Tasks

Deadlines

Timetable events

Click day → open sidebar for details

5.7 Focus Mode (MVP)

Route: /focus

Requirements:

Pomodoro timer

Default settings:

25 min focus

5 min break

4 cycles

Link session to task

Focus mode UI:

Minimal

Hide distractions

Session logs stored in app

5.8 Notes / Quick Capture (Phase 2)

Route: /notes

Requirements:

Add / edit / delete notes

Tags

Search notes

Markdown support (optional)

5.9 Analytics (Phase 2)

Route: /analytics

Requirements:

Charts for:

Tasks completed daily

Pomodoro minutes

Deadlines completed

Task categories breakdown

Weekly productivity streak

5.10 Settings (MVP)

Route: /settings

Requirements:

Theme: light/dark

Pomodoro durations

Default start of week

Export data (Phase 2)

Notifications toggles (Phase 2)

6. Out of Scope (for now)

Collaboration or shared workspace

Live sync with Google Calendar

Voice input

AI-generated study plan

Mobile native app (React Native)

Offline-first caching

All can be added in future roadmap versions.

7. User Flows
7.1 First-Time User

Open app

Onboarding banner → explains “Tasks, Deadlines, Timetable, Focus”

Add first tasks

Add timetable events

Dashboard becomes customised

7.2 Daily Flow

Open dashboard

View today’s tasks + deadlines

Start focus session for most important task

Complete tasks

Review next day

7.3 Weekly Flow

Visit analytics

See completed tasks + focus sessions

Check upcoming deadlines

Update timetable

8. Data Models
Task
{
  id,
  userId,
  title,
  description,
  dueDate,
  priority,
  category,
  status,
  createdAt,
  updatedAt
}

Deadline
{
  id,
  userId,
  title,
  type,
  module,
  dueDate,
  estimatedHours,
  status,
  notes
}

TimetableEvent
{
  id,
  userId,
  title,
  dayOfWeek,
  startTime,
  endTime,
  location,
  category,
  repeat
}

FocusSession
{
  id,
  userId,
  taskId,
  startTime,
  endTime,
  durationMinutes
}

User
{
  id,
  name,
  email,
  passwordHash,
  theme,
  timezone
}

9. Technical Architecture
Frontend (MVP)

React + React Router

TailwindCSS

Context API or Zustand for global state

LocalStorage for persistence

Recharts / Chart.js for analytics (Phase 2)

Backend (Phase 2)

Node.js + Express

PostgreSQL

JWT auth

REST API

Hosted on Render / Railway

10. Timeline / Roadmap
Week 1–2: MVP v1

Dashboard

Tasks

Deadlines

Timetable

Pomodoro

Settings (basic)

LocalStorage integration

Week 3–4: MVP v2

Calendar

Notes

Analytics

Data export

Phase 2 (Month 2)

Backend + auth

Sync across devices

Notifications

Better analytics

Mobile-friendly UI

11. Risks
Technical

State management complexity if too many modules interact

Time calculations (deadlines, timers) need careful handling

User Experience

Overstuffing the UI could make the app feel cluttered

If onboarding is weak, users may not fill timetable/deadlines properly

12. Future Opportunities

AI-generated daily agenda

Study planner based on exam dates

Chrome extension to capture tasks

Mobile native version with widgets

Collaboration mode for group projects