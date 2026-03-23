# LeafCure Frontend

This frontend is built with React and Vite and provides the user interface for LeafCure.

## Responsibilities

- authentication screens and session flow
- dashboard and image upload experience
- prediction results and researcher mode views
- history page and admin dashboard UI
- shared theming for dark and light mode
- responsive layout and interaction flow

## Stack

- React 18
- Vite
- Tailwind CSS
- React Router

## Local run

```bash
cd frontend
npm install
npm run dev
```

## Environment

Create `frontend/.env.local` from `frontend/.env.example` and set:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Build

```bash
npm run build
```
