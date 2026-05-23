from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, documents, upload, share, activity, folders, search

app = FastAPI(
    title="Locker 24 API",
    description="Secure Personal Document Vault API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(share.router, prefix="/api/share", tags=["sharing"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])
app.include_router(folders.router, prefix="/api/folders", tags=["folders"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

@app.get("/")
async def root():
    return {"message": "Welcome to Locker 24 API", "status": "active"}

# Auto-create any new tables (e.g. folders) without breaking existing data
try:
    from app.core.database import engine, Base
    from app.models import folder as _folder_model  # noqa — ensures Folder is registered
    from app.models import document as _doc_model    # noqa — ensures Document is registered
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not auto-create tables: {e}")

# Self-healing database startup task to guarantee 'admin' user with password 'admin' exists
try:
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    
    db = SessionLocal()
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        new_admin = User(
            name="Admin",
            email="admin@locker24.com",
            username="admin",
            hashed_password=get_password_hash("admin"),
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        print("Default admin user created successfully!")
    else:
        # Guarantee password is 'admin'
        admin_user.hashed_password = get_password_hash("admin")
        db.commit()
        print("Default admin user verified.")
    db.close()
except Exception as e:
    print(f"Warning: Failed to verify/create default admin user: {e}")
