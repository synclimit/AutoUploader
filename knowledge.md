# AutoUploader – Project Knowledge

YouTube video upload automation tool with a FastAPI backend, React+Vite frontend, and Playwright-based browser automation.

---

## Quickstart

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # FastAPI dev server (default: http://127.0.0.1:8000)
```
- Runs SQLite (`backend/app.db`) via SQLAlchemy.
- Requires Redis running locally (for task queue).

### Frontend
```bash
cd frontend/app
npm install
npm run dev                        # Vite dev server
npm run build                      # Production build
npm run lint                       # ESLint
npm run preview                    # Preview production build
```

### Browser Automation (Playwright)
```bash
# Test browser session with saved profile
cd backend && python workers/test_browser.py

# Test YouTube upload via Playwright
cd backend && python workers/youtube_uploader.py
```

---

## Architecture

| Layer | Directory | Tech |
|---|---|---|
| Backend API | `backend/` | FastAPI, SQLAlchemy, SQLite |
| Task Queue | `backend/queues/` | Redis (rpush/lpop based) |
| Workers | `backend/workers/` | Playwright (Chromium) |
| Scheduler | `backend/scheduler/` | APScheduler (interval-based) |
| Frontend | `frontend/app/` | React 19, Vite 8, Tailwind CSS 4 |

### Key Files
- `backend/main.py` – FastAPI app entry, `/tasks` GET & `/upload` POST endpoints
- `backend/models.py` – SQLAlchemy `UploadTask` model (id, title, description, visibility, video_path, thumbnail_path, status, created_at)
- `backend/db.py` – SQLite engine, SessionLocal, Base. **Note: there are two db.py files** (`backend/db.py` and `backend/database/db.py`); `backend/main.py` imports from `backend/db.py`.
- `backend/core/config.py` – Reads env vars (DATABASE_URL, REDIS_HOST/PORT, APP_NAME/ENV/HOST/PORT)
- `backend/queues/upload_queue.py` – Redis-backed task queue (add_upload_task / get_upload_task)
- `backend/workers/youtube_uploader.py` – Playwright script that connects to a CDP Chrome instance at `localhost:9222` and uploads via YouTube Studio
- `backend/scheduler/upload_scheduler.py` – Generates dummy tasks every 15s and pushes to Redis queue
- `frontend/app/src/App.jsx` – Root layout: Sidebar + Topbar + QueuePanel + DetailPanel + ActivityLogs
- `frontend/src/api/backend.js` – Axios instance pointing to `http://127.0.0.1:8000`

### Data Flow
1. User uploads video + thumbnail via frontend → FastAPI `/upload` → saves files to `backend/uploads/` & `backend/thumbnails/` → creates `UploadTask` in SQLite
2. Task is pushed to Redis queue (`upload_queue`)
3. Scheduler (`upload_scheduler.py`) generates scheduled tasks
4. Workers (Playwright) pick tasks from Redis and perform browser-based YouTube Studio upload

---

## Conventions & Gotchas

### General
- **Indentation**: Heavy use of 4-space indentation with blank lines between each line of code (unusual style).
- **Imports**: Each import on its own line with blank lines separating them.
- **No `__init__.py` exports** – just simple file imports.

### Backend
- **Two `db.py` files exist**: `backend/db.py` (used by `main.py` and `models.py`) and `backend/database/db.py` (used by `backend/database/` modules). They have different DATABASE_URL values – the former is hardcoded to `sqlite:///./app.db`, the latter reads from `core.config.DATABASE_URL`.
- **Playwright CDP mode**: `youtube_uploader.py` connects to an already-running Chrome instance via `connect_over_cdp("http://localhost:9222")`. The browser must be launched with `--remote-debugging-port=9222`.
- **Browser profiles**: Saved under `browser_profiles/youtube_automation/` (persistent Chromium context).
- **Two Base definitions**: `backend/db.py` and `backend/database/base.py` both define a `Base = declarative_base()`. The `models.py` uses `from db import Base` (the former).
- **Environment variables**: Loaded via `python-dotenv` in `core/config.py` – create a `.env` in `backend/` if needed.

### Frontend
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin – no `tailwind.config.js` needed (v4 is config file–less).
- **No routing**: The app uses a single-page layout with components, not react-router (react-router-dom was removed).
- **Component tree**: `App` → `Sidebar` | `Topbar` + `QueuePanel` + (`DetailPanel` + `ActivityLogs`)
- **API client lives in `frontend/src/api/`** (not in `frontend/app/src/`). Both use Axios.

### Testing
- No formal test suite configured. Backend has test scripts in `backend/queues/` (`test_queue.py`, `test_redis.py`, `test_task_state.py`) and `backend/workers/` (`test_browser.py`, `test_worker.py`).

### Dependencies
- Root-level `package.json` has axios + dev Tailwind dependencies (likely shared).
- `frontend/app/package.json` is the main frontend app with React + Vite + Tailwind.
- `backend/requirements.txt`: fastapi, uvicorn, sqlalchemy, psycopg2-binary, redis, python-dotenv, websockets.
