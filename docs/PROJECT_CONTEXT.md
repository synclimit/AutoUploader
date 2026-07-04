PROJECT:
AutoUploader

PURPOSE:
Semi-automatic YouTube upload platform.

TARGET USERS:
Content creators managing multiple channels.

PRIMARY FEATURES:
- Upload video
- Metadata management
- Upload queue
- Scheduler
- Retry system
- Activity logs
- Multi-account support

TECH STACK:
Frontend:
- React
- Vite
- Tailwind

Backend:
- FastAPI

Database:
- Current: SQLite
- Planned: Supabase/Postgres

IMPORTANT:
Database migration is not part of current stages.
Do not migrate database unless explicitly requested.

Queue:
- Redis

Automation:
- Playwright

IMPORTANT RULES:
- Stability over speed
- No UI redesign
- No workflow changes without approval
- Component-first architecture


APPLICATION MODULES

1. Dashboard
2. Upload Queue
3. History
4. Accounts
5. Settings

CURRENT DEVELOPMENT STATUS

Current Stage:
Stage 1.1

Current Module:
Upload Queue

Current Goal:
Convert Upload Queue prototype into production-ready component architecture.