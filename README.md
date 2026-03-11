# LeafCure

LeafCure is an AI-powered plant disease diagnosis platform. Users can upload leaf images, get instant disease predictions, view treatment guidance, and track scan history through a modern dashboard.

## Features

- AI-based plant disease prediction workflow
- User authentication with admin access support
- Admin dashboard for management and monitoring
- Scan history and result views
- Responsive UI with a unified green theme

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI (Python)
- Auth/Data: Firebase integration (with local fallback paths)

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend runs on `http://127.0.0.1:8000`.

## Environment Setup

Create and configure:

- `backend/.env`
- `backend/service-account.json`
- `frontend/.env.local`

Recommended frontend env:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Project Structure

```text
LeafCure/
+-- frontend/   # React + Vite client
+-- backend/    # FastAPI server
+-- README.md
```

## Deployment

- Frontend: Vercel or Netlify
- Backend: Railway or Render

## License

MIT
