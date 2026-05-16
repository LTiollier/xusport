# XuSport - Project Instructions

XuSport is a mobile-first Progressive Web App (PWA) designed for tracking bodyweight workouts. It features an "Offline-first" architecture, allowing users to record sessions without an internet connection and sync them later.

## 🏗 Architecture Overview

The project is split into a **Next.js frontend** and a **Laravel backend**.

### Frontend (Next.js)
- **Tech Stack:** Next.js 16 (TypeScript), TailwindCSS, Framer Motion.
- **Local Database:** [Dexie.js](https://dexie.org/) (IndexedDB) for offline persistence.
- **Sync Engine:** Located in `src/lib/sync.ts`. It manages a `sync_queue` in IndexedDB.
- **State Management:** Centralized in `src/lib/store.ts`.
- **Styling:** Custom Vanilla-like CSS and Tailwind. Theme is primarily Dark Mode.

### Backend (Laravel)
- **Tech Stack:** Laravel 13 (PHP 8.3), PostgreSQL.
- **Auth:** Laravel Sanctum (Token-based).
- **API:** RESTful API returning JSON, typically wrapped in a `data` key.
- **Testing:** Pest PHP.

## 🚀 Getting Started

The project is dockerized for easy development.

### Prerequisites
- Docker & Docker Compose
- Node.js & PHP (optional for local execution outside Docker)

### Setup Commands
```bash
# 1. Clone and enter
git clone <repo> xusport && cd xusport

# 2. Setup env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Start the stack
docker-compose up -d

# 4. Initialize Backend
docker-compose exec backend composer setup
```

### Key Development Commands
- **Frontend Dev:** `npm run dev` (in `frontend/`)
- **Backend Dev:** `npm run dev` (in `backend/`, starts Vite and Laravel server)
- **Run Tests:** `php artisan test` or `vendor/bin/pest` (in `backend/`)

## 🛠 Development Conventions

### General
- **Offline-First:** All data-modifying actions should be performed against the local Dexie database first and then queued for sync using the `enqueue()` function in `src/lib/sync.ts`.
- **ID Management:** Local records use temporary string IDs (e.g., `local:uuid`). The sync engine reconciles these with numeric server IDs upon successful push.

### Backend (Laravel)
- **Controllers:** Grouped under `app/Http/Controllers/Api/`.
- **Resources:** Use Laravel API Resources for consistent JSON output.
- **Migrations:** Keep migrations clean and documented.
- **Testing:** Always write Pest tests for new API endpoints.

### Frontend (Next.js)
- **Components:** Functional components with React hooks.
- **Types:** Definitions reside in `src/lib/types.ts`.
- **Sync Logic:** Do not modify `src/lib/sync.ts` without understanding the reconciliation logic for local IDs.

## 📖 Important Files
- `README.md`: High-level project vision and quick start.
- `XUSPORT.md`: Detailed product vision and design specs.
- `backend/API.md`: Comprehensive API documentation.
- `frontend/src/lib/sync.ts`: Core synchronization logic.
- `frontend/src/lib/db.ts`: IndexedDB schema and Dexie setup.
