# 🛡️ Locker 24: Premium Personal Document Vault

A premium, high-fidelity, and ultra-secure personal document vault designed to keep your sensitive credentials, files, and cards encrypted and organized under a beautiful glassmorphic interface. Built on a clean, modern, and production-ready architecture using a **FastAPI** backend and a **React 19 / Tailwind CSS** frontend.

---

## 🏗️ System Architecture & Data Flow

Locker 24 is built with a decoupled **Client-Server Architecture** designed for speed, security, and scalability. Below is a high-level representation of how the application is laid out:

```mermaid
graph TD
    subgraph Client [React 19 Frontend]
        UI[Glassmorphic UI / Tailwind CSS]
        Router[React Router 7]
        Context[Context Providers: Auth, Theme, Notifications]
        Services[Services Layer: Axios API Clients]
    end

    subgraph Server [FastAPI Backend]
        Main[main.py: App Entrypoint]
        Routes[API Routes: Auth, Documents, Upload, Share, Activity]
        Deps[Dependency Injection: DB & User sessions]
        BLogic[Business Logic Services: Firebase, Storage, Audit]
        Models[SQLAlchemy Models]
        Schemas[Pydantic Validation Schemas]
    end

    subgraph Infrastructure [Data & Storage Layer]
        DB[(PostgreSQL 16 Database)]
        LocalStorage[(Local Storage / uploads/)]
        FirebaseOAuth[Firebase OAuth Provider]
    end

    %% Client communication to Server
    UI --> Router
    Router --> Context
    Context --> Services
    Services -- "HTTP / JSON REST API" --> Main
    
    %% Server internal flow
    Main --> Routes
    Routes --> Deps
    Routes --> BLogic
    BLogic --> Models
    BLogic --> Schemas
    Deps --> DB
    
    %% Infrastructure access
    BLogic --> LocalStorage
    Context -- "Google Sign-In Token" --> FirebaseOAuth
    BLogic -- "Verify Google ID Token" --> FirebaseOAuth
    Models --> DB
```

### Key Architectural Decisions:
1. **Separation of Concerns**: Both frontend and backend separate business logic, state/dependency injection, and presentational elements cleanly.
2. **Double-verification OAuth & Passwords**: Local accounts use state-of-the-art **Argon2** hashing, while social login runs via double-verified **Firebase Google Sign-In** tokens on both front and back.
3. **Stateless JWT Session Management**: Authentication is carried out through cryptographically signed stateless tokens which expire automatically, preventing server-side overhead and securing routes.
4. **Encapsulated Sharing**: Document sharing relies on database-backed temporary tokens. Public download portals bypass general auth, but query precise token-expiry maps before unlocking files.

---

## 📂 Proper File & Architecture Structure

Locker 24 uses a monorepo file structure separating frontend and backend codebases, alongside a DevOps docker orchestration setup in the root.

```
Locker24/
│
├── docker/                         # Docker Service Configurations
│   └── pgadmin/                    # pgAdmin configuration (servers.json)
│
├── backend/                        # FastAPI Backend Application
│   ├── app/                        # Application Root
│   │   ├── api/                    # API Controller Layer
│   │   │   ├── routes/             # REST Route Definitions (auth, documents, share, upload, activity)
│   │   │   └── deps.py             # Dependency Providers (DB, auth context, active users)
│   │   ├── core/                   # System Config & Core Infrastructure
│   │   │   ├── config.py           # Environment Variables Parser (Pydantic Settings)
│   │   │   ├── database.py         # SQLAlchemy Engine & Session Configuration
│   │   │   └── security.py         # Argon2 Hashing & JWT Token Generation
│   │   ├── models/                 # SQLAlchemy ORM Models (user, document, share, activity)
│   │   ├── schemas/                # Pydantic Request/Response DTO Validation Schemas
│   │   ├── services/               # Business Logic Services (Firebase, local/S3 storage, activity audits)
│   │   ├── utils/                  # Helper Utilities (file operations, formatting)
│   │   └── main.py                 # Core FastAPI Application & Middleware Setup
│   │
│   ├── alembic/                    # DB Schema Migrations Tooling
│   ├── alembic.ini                 # Migrations Configurations
│   ├── requirements.txt            # Python Backend Package Dependencies
│   └── Dockerfile                  # Multi-stage Containerization File
│
├── frontend/                       # React 19 Frontend Application
│   ├── public/                     # Static Web Assets
│   ├── src/                        # Source Directory
│   │   ├── assets/                 # App Images, Brand Icons, and Illustrations
│   │   ├── components/             # Reusable UI Blocks (Categorized)
│   │   │   ├── auth/               # Forms for login, signup, forgot password
│   │   │   ├── common/             # Spinnners, Modal overlays, generic Cards
│   │   │   ├── dashboard/          # Share modals, stat widgets, search actions
│   │   │   ├── documents/          # Document lists, Grid cards, detail drawers
│   │   │   └── layout/             # Sidebar, Header Navbar, page wrappers
│   │   ├── context/                # Global React State Contexts (Auth, Theme, Notifications)
│   │   ├── hooks/                  # React Custom Hooks (useAuth, useDocuments, useToast, etc.)
│   │   ├── pages/                  # Top-level Page Views (Vite/React Router Layouts)
│   │   ├── services/               # Axios-based REST Client Handlers (Auth, Share, Uploads)
│   │   ├── styles/                 # Tailwind CSS styles & global styles (index.css)
│   │   ├── utils/                  # JS Utilities (constants, validators, Firebase configuration)
│   │   ├── App.jsx                 # Global Layout Shell
│   │   ├── main.jsx                # DOM Injection Entrypoint
│   │   └── router.jsx              # React Router 7 Pages Navigation Schema
│   │
│   ├── package.json                # Frontend Scripts & NPM Dependency Tree
│   ├── vite.config.js              # Vite Bundling & Development Server Config
│   ├── tailwind.config.js          # Tailwind CSS Style tokens and themes
│   └── postcss.config.mjs          # CSS preprocessing configurations
│
├── docker-compose.yml              # Local PostgreSQL & pgAdmin Orchestration File
└── package.json                    # Root Orchestrator (Frontend & Backend run shortcuts)
```

---

## 🗄️ Database Model Schema (Entity Relationship)

Locker 24 uses **PostgreSQL** as its core database, backed by **SQLAlchemy ORM** models:

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│              users              │           │            documents            │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ id [PK]         : Integer       │           │ id [PK]         : Integer       │
│ name            : String        │──────────o│ name            : String        │
│ email [U]       : String        │           │ file_path       : String        │
│ username [U]    : String        │           │ size            : String        │
│ hashed_password : String        │           │ category        : String        │
│ is_active       : Boolean       │           │ is_sensitive    : Boolean       │
│ bio             : Text          │           │ created_at      : DateTime      │
│ location        : String        │           │ owner_id [FK]   : Integer       │
│ phone           : String        │           └─────────────────────────────────┘
└─────────────────────────────────┘                            │
          │                   │                                │
          │                   │                                │
          │                   └───────────────────────┐        │
          ▼                                           ▼        ▼
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│          activity_logs          │           │          shared_links           │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ id [PK]         : Integer       │           │ id [PK]         : Integer       │
│ user_id [FK]    : Integer       │           │ token [U]       : String        │
│ action          : String        │           │ document_id [FK]: Integer       │
│ details         : String        │           │ owner_id [FK]   : Integer       │
│ ip_address      : String        │           │ expires_at      : DateTime      │
│ created_at      : DateTime      │           │ is_active       : Boolean       │
└─────────────────────────────────┘           │ created_at      : DateTime      │
                                              └─────────────────────────────────┘
```

---

## 🔒 Security Operations

Locker 24 takes digital privacy extremely seriously:

- **Argon2 Hashing**: Standard password hashing schemes like MD5 or SHA256 are susceptible to GPU-accelerated brute-force attacks. Locker 24 utilizes `argon2-cffi` inside `passlib` to ensure high-memory and high-CPU resistance.
- **Asymmetric Firebase SSO**: Users signing in with Google are authenticated using standard Firebase client libraries. The generated token is validated on the backend by fetching Firebase's public keys before a secure local JWT is returned.
- **Tokenized Share Operations**: Sharing sensitive documents doesn't reveal the raw storage path. An active record is created inside the database generating a cryptographically random, high-entropy uuid token. Shared links are queryable solely if the link has not expired (`expires_at > NOW()`) and the sharing is marked active.

---

## ⚙️ Environment Configuration

> [!WARNING]
> **🔒 CRITICAL SECURITY NOTICE**:
> **NEVER commit actual passwords, private API tokens, database connection credentials, secret keys, or Firebase keys to GitHub!**
> 
> The root [.gitignore](file:///d:/Locker24/.gitignore) has been pre-configured to automatically exclude your local `.env` files in both the `backend/` and `frontend/` folders from being tracked by Git. Always keep your real production and staging credentials safely in these ignored `.env` files, and never push them to a public or private GitHub repository.

You will need to set up environment variables in both `backend` and `frontend` directories.

### 🛡️ Backend (`backend/.env`)
Create a `.env` file in the `backend/` folder:
```env
PROJECT_NAME="Locker 24"
SECRET_KEY="generate-a-strong-32-byte-hexadecimal-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL="postgresql://postgres:password@localhost:5432/locker24"

# Optional Firebase config for Google Auth
FIREBASE_PROJECT_ID="locker24-xxxx"

# Local Storage settings
UPLOAD_DIR="./uploads"
MAX_UPLOAD_SIZE=10485760 # 10MB in bytes
```

### 💻 Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` folder:
```env
VITE_API_URL="http://localhost:8000"

# Optional Firebase OAuth API credentials
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="locker24-xxxx.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="locker24-xxxx"
VITE_FIREBASE_STORAGE_BUCKET="locker24-xxxx.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="xxxxxxxx"
VITE_FIREBASE_APP_ID="1:xxxxxx:web:xxxxxx"
```

---

## 🚀 Getting Started

### Method A: Setup with Docker Compose (Recommended)

To run the backing database (PostgreSQL 16) and pgAdmin UI administration system instantly:

1. **Verify Docker Status**: Ensure your docker service is up.
2. **Spin Up Infrastructure**:
   ```bash
   docker-compose up -d
   ```
3. **Database Administration**: Open `http://localhost:8080` to access pgAdmin 4.
   - **Login**: `admin@locker24.com`
   - **Password**: `admin`
   - *(The database connection is pre-registered inside pgAdmin servers config).*

---

### Method B: Local Development Setup (Manual)

#### 1. Backend Launch
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and active a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On MacOS/Linux:
   source venv/bin/activate
   ```
3. Install development dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run Database Migrations:
   ```bash
   alembic upgrade head
   ```
5. Spin up the ASGI server (Uvicorn):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
6. Access Interactive API Swagger Docs: `http://localhost:8000/docs`

#### 2. Frontend Launch
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend package tree:
   ```bash
   npm install
   ```
3. Run Vite development server:
   ```bash
   npm run dev
   ```
4. Open the App: `http://localhost:5173`

---

## 📝 Multi-run shortcuts (From Root)
To streamline local development, the root directory features a standard `package.json` with scripts to run everything in a unified manner:

- Install dependencies on both ends:
  ```bash
  npm run install:all
  ```
- Spin up the frontend development server:
  ```bash
  npm run dev:frontend
  ```
- Spin up the backend server:
  ```bash
  npm run dev:backend
  ```
