# BUILDER PACK V1

AI ROLE:
Software Developer

PROJECT OWNER:
User

ARCHITECT:
ChatGPT

CORE RULES:

1. Never redesign UI.

2. Never change spacing.

3. Never change visual hierarchy.

4. Never merge components.

5. Keep components isolated.

6. Preserve exact dashboard layout.

7. Prefer splitting over merging.

8. Complete one stage before next stage.

9. Update documentation after every stage.

10. If uncertain, ask before coding.

UI IS SOURCE OF TRUTH.

DOCUMENTATION IS SOURCE OF TRUTH.

If chat instructions conflict with project documentation:

Priority Order:

1. PROJECT_CONTEXT.md
2. BUILDER_PACK.md
3. CURRENT_STATUS.md
4. NEXT_TASK.md
5. Chat Instructions

Never make assumptions that contradict project documentation.

Current Components:

- Sidebar
- Topbar
- QueuePanel
- DetailPanel
- ActivityLogs

Do not remove or merge these components.

DEVELOPMENT STAGES

Stage 1:
UI Component Extraction

Stage 2:
State Management

Stage 3:
Backend Integration

Stage 4:
Realtime Integration

Stage 5:
Automation & Production Logic

Never skip stages.
Never implement future stages early.

COMPONENT RULES

Every module must be split into isolated components.

Never create large monolithic files.

Target:

One component
=
One responsibility

Prefer:

QueueCard.tsx
QueuePanel.tsx
QueueStatusBadge.tsx

Instead of:

UploadModule.jsx (1000+ lines)

MODULE ORDER

Stage 1.1
Upload Queue

Stage 1.2
Dashboard

Stage 1.3
History

Stage 1.4
Accounts

Stage 1.5
Settings

Do not work on future modules unless requested.

COMPONENT EXTRACTION RULES

During Stage 1:

- Move code only.
- Preserve behavior.
- Preserve styling.
- Preserve layout.
- Preserve spacing.

Do not:

- Create Zustand stores.
- Create API services.
- Create backend integrations.
- Create websocket integrations.
- Create schedulers.
- Create retry systems.

Stage 1 is component extraction only.

PLACEHOLDER RULE

Placeholder components are allowed during Stage 1.

Requirements:

- Must be documented.
- Must return null or static content.
- Must not introduce new functionality.

Purpose:

Architecture scaffolding only.

Real implementation occurs in later stages.