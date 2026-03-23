# LeafCure

LeafCure is a full-stack web application for plant disease diagnosis from leaf images. It combines a React frontend, a FastAPI backend, Firebase services, and transformer-based deep learning models to deliver instant predictions, treatment guidance, scan history, and role-based access for both users and administrators.

## What the project does

Users can upload one or more leaf images and receive:
- a predicted disease label
- confidence scores from the inference pipeline
- plant-specific treatment guidance
- prevention recommendations
- a saved scan history for later review

The platform also includes a researcher-oriented view for more detailed outputs and an admin dashboard for system monitoring and management.

## Highlights

- Plant disease prediction from leaf images using Swin Transformer and Vision Transformer models
- User authentication with Firebase-backed account flows
- Role-aware access with separate admin dashboard handling
- Prediction history stored in Firestore, with offline/local fallback support on the client
- Researcher mode with expanded result details and explainability-oriented output support
- Responsive dashboard, history, results, and admin interfaces
- Dark mode and light mode with a shared theme system
- Production-ready environment configuration for frontend and backend deployment

## Tech stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios / Fetch-based API utilities

### Backend
- FastAPI
- Uvicorn
- Pydantic
- SlowAPI
- Pillow
- OpenCV

### Machine learning
- PyTorch
- torchvision
- timm
- Swin Transformer
- Vision Transformer (ViT)

### Data and authentication
- Firebase Authentication
- Firebase Admin SDK
- Google Cloud Firestore

## Core features

### User-facing
- Sign up and login
- Upload plant images for analysis
- View predicted disease and confidence score
- Read treatment and prevention guidance
- Access previous scans through history
- Use researcher mode for detailed outputs
- Export or share results

### Admin-facing
- Admin-only dashboard access
- User and system analytics
- Prediction monitoring
- Contact and management flows already wired into the backend/admin area

### Platform and UX
- Responsive layout for desktop and mobile
- Client-side offline history fallback
- Image validation and upload constraints
- Shared theme system for dark and light modes

## Repository structure

```text
LeafCure/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── services/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── render.yaml
└── README.md
```

## Local development

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:8000`.

## Environment configuration

### Backend

Create `backend/.env` from `backend/.env.example`.

Important variables:

```env
FIREBASE_WEB_API_KEY=your_firebase_web_api_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
# or use FIREBASE_SERVICE_ACCOUNT_JSON for cloud deployments

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ENVIRONMENT=development

JWT_SECRET_KEY=replace_with_a_long_random_secret
SIMPLE_AUTH_SECRET_KEY=replace_with_a_different_long_random_secret

API_HOST=0.0.0.0
API_PORT=8000

VIT_WEIGHTS_PATH=./assets/vit_model.pth
SWIN_WEIGHTS_PATH=./assets/swin_model.pth
```

### Frontend

Create `frontend/.env.local` from `frontend/.env.example`.

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Model files

The trained model weights are not included in this repository.

Expected backend paths:
- `backend/assets/vit_model.pth`
- `backend/assets/swin_model.pth`

You can also point the backend to different locations using:
- `VIT_WEIGHTS_PATH`
- `SWIN_WEIGHTS_PATH`

## Deployment

The project is structured for a split deployment:

- Frontend: Vercel
- Backend: Render

Included deployment helpers:
- `render.yaml`
- `frontend/vercel.json`

### Backend deployment notes

- Set `ENVIRONMENT=production`
- Provide Firebase credentials through `FIREBASE_SERVICE_ACCOUNT_JSON` or a mounted `FIREBASE_SERVICE_ACCOUNT_PATH`
- Set production `CORS_ALLOWED_ORIGINS`
- Set strong values for `JWT_SECRET_KEY` and `SIMPLE_AUTH_SECRET_KEY`
- Provide accessible model paths through `VIT_WEIGHTS_PATH` and `SWIN_WEIGHTS_PATH`

### Frontend deployment notes

Set:

```env
VITE_API_BASE_URL=https://your-backend-domain/api/v1
```

## Security

This repository intentionally excludes:
- API keys
- Firebase service account credentials
- local environment files
- trained model weight files

If a secret has ever been committed elsewhere, rotate it before deployment.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
