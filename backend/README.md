# LeafCure Backend

This backend is built with FastAPI and serves the API layer for LeafCure.

## Responsibilities

- user authentication and token validation
- plant image prediction requests
- researcher-mode responses
- history storage and retrieval
- admin endpoints and system analytics
- Firebase and Firestore integration

## Stack

- FastAPI
- Uvicorn
- Pydantic
- Firebase Admin SDK
- Google Cloud Firestore
- PyTorch
- Pillow
- OpenCV
- SlowAPI

## Local run

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Required configuration

Create `backend/.env` from `backend/.env.example` and configure:

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET_KEY`
- `SIMPLE_AUTH_SECRET_KEY`
- `VIT_WEIGHTS_PATH`
- `SWIN_WEIGHTS_PATH`

## Notes

- Model files are not committed to the public repository.
- Firebase secret files must stay local or be injected through environment variables in production.
