# 🌿 LeafCure

> AI-powered plant disease diagnosis platform that helps farmers and gardeners identify and treat plant diseases instantly.

LeafCure is a full-stack web application that leverages machine learning to diagnose plant diseases from leaf images. Users can upload photos, receive instant AI-powered predictions, access treatment guidance, and maintain a history of their plant scans.

## ✨ Features

### Core Functionality
- **AI Disease Detection**: Advanced ML models (Swin Transformer & Vision Transformer) for accurate plant disease identification
- **Real-time Diagnosis**: Get instant disease predictions with confidence scores
- **Treatment Guidance**: Comprehensive treatment recommendations for identified diseases
- **History Tracking**: Searchable scan history with timestamps and results

### User Features
- **User Authentication**: Secure login/registration system
- **Dashboard**: Personalized dashboard with scan statistics and upload history
- **Admin Panel**: Advanced management and analytics for administrators
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Rate Limiting**: API protection with intelligent rate limiting

### UI/UX
- Modern, intuitive interface with unified green theme
- Smooth animations and transitions
- Optimized performance with lazy loading
- Offline support for history tracking

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Fetch API with custom utilities

### Backend
- **Framework**: FastAPI (Python)
- **Authentication**: JWT-based auth with Firebase
- **Database**: Optimized for Firebase/Firestore
- **ML Inference**: PyTorch models (Swin & Vision Transformer)
- **Middleware**: Custom auth, rate limiting, and security headers

### ML Models
- Swin Transformer (`swin_model.pth`)
- Vision Transformer (`vit_model.pth`)

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16+ and npm
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/vanshpatel-017/LeafCure.git
cd LeafCure
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend API will be available at `http://127.0.0.1:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

## ⚠️ Important: First Time Setup

Before running the application, you **MUST** configure the environment files with your own credentials:

1. **Firebase Setup**:
   - Create a Firebase project at [https://firebase.google.com](https://firebase.google.com)
   - Generate a service account key and save it to `backend/service-account.json`
   - Copy your Firebase Web API key

2. **Backend Configuration**:
   - Copy the example `.env` template to `backend/.env`
   - Update with your Firebase project ID and credentials
   - Set your API configuration parameters

3. **Frontend Configuration**:
   - Copy the example `.env.local` template to `frontend/.env.local`
   - Update `VITE_API_BASE_URL` if running on a different port
   - Add your Firebase Web API key

4. **ML Models**:
   - Place `swin_model.pth` in `backend/assets/`
   - Place `vit_model.pth` in `backend/assets/`
   - (Models are not included in the repository due to size constraints)

## 🔧 Environment Configuration

### Backend (.env)

Create `backend/.env`:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# API Configuration
API_TITLE=LeafCure API
API_VERSION=1.0.0
DEBUG=True
```

### Backend (service-account.json)

Place your Firebase service account JSON in `backend/service-account.json`

### Frontend (.env.local)

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 📁 Project Structure

```
LeafCure/
│
├── frontend/                    # React + Vite client application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   └── HomePage/      # Homepage sections
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service utilities
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # CSS files
│   │   ├── config/            # Configuration files
│   │   ├── App.jsx            # Main App component
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # FastAPI server application
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── router.py      # Main router
│   │   │   ├── contact_endpoint.py
│   │   │   └── simple_auth_router.py
│   │   ├── core/              # Core utilities
│   │   │   ├── config.py      # Configuration
│   │   │   ├── auth_utils.py  # Auth utilities
│   │   │   ├── logging_config.py
│   │   │   └── validators.py
│   │   ├── middleware/        # Custom middleware
│   │   │   ├── auth.py        # Authentication middleware
│   │   │   ├── rate_limiter.py
│   │   │   └── security.py
│   │   ├── models/            # Data models
│   │   │   └── schemas.py     # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── chatbot_service.py
│   │   │   ├── disease_service.py
│   │   │   ├── history_service.py
│   │   │   ├── ml_inference.py
│   │   │   └── simple_auth.py
│   │   └── main.py            # FastAPI app entry
│   │
│   ├── assets/                # ML models
│   │   ├── swin_model.pth
│   │   └── vit_model.pth
│   │
│   ├── logs/                  # Application logs
│   ├── requirements.txt       # Python dependencies
│   ├── service-account.json   # Firebase credentials
│   └── Dockerfile
│
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

### Disease Detection
- `POST /api/v1/disease/predict` - Upload image and get disease prediction
- `GET /api/v1/disease/treatments/:disease_id` - Get treatment info

### History
- `GET /api/v1/history` - Get user's scan history
- `DELETE /api/v1/history/:scan_id` - Delete a scan record

### Admin
- `GET /api/v1/admin/stats` - Get system statistics
- `GET /api/v1/admin/users` - Get user list (admin only)

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build images
docker build -t leafcure-backend ./backend
docker build -t leafcure-frontend ./frontend

# Run containers
docker run -p 8000:8000 leafcure-backend
docker run -p 5173:5173 leafcure-frontend
```

## 🌍 Deployment

### Frontend
- **Vercel**: Push to GitHub, connect Vercel, auto-deploys on push
- **Netlify**: Similar to Vercel with integration to GitHub

### Backend
- **Railway**: Connect GitHub repo, set environment variables
- **Render**: Similar to Railway, good free tier support
- **Heroku**: Traditional option with good Python support

## 🔍 Troubleshooting

### Backend Issues

**ModuleNotFoundError**
```bash
# Ensure you're in the virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall requirements
pip install -r requirements.txt
```

**Port Already in Use**
```bash
# Use different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Issues

**Module not found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**VITE_API_BASE_URL not working**
- Ensure `.env.local` is in the frontend directory
- Restart dev server after creating `.env.local`

## 📚 Development

### Running Tests

```bash
# Backend tests (when available)
pytest backend/

# Frontend tests (when available)
npm run test
```

### Code Quality

```bash
# Backend linting
pip install flake8
flake8 backend/

# Frontend linting
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## � Security Note

⚠️ **IMPORTANT**: This repository does not include:
- Firebase service account keys
- API keys and secrets
- Machine learning model files (due to size)

These files must be added locally by each developer. Never commit sensitive credentials to version control.

## 📧 Contact & Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [patelvanshj.17@gmail.com]
