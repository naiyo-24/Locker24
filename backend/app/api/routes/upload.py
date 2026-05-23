from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.services.storage_service import storage_service
from app.services.activity_service import activity_service
from app.schemas.document import DocumentResponse
from app.utils.file_utils import format_size, parse_size
import os

router = APIRouter()

@router.post("/", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("Personal"),
    is_sensitive: bool = Form(False),
    folder_id: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document to the vault.
    Saves the file to local storage and creates a record in the database.
    """
    try:
        # Check overall storage limit first (15 GB)
        LIMIT_BYTES = 15 * 1024 * 1024 * 1024
        user_docs = db.query(Document).filter(Document.owner_id == current_user.id).all()
        current_used_bytes = sum(parse_size(doc.size) for doc in user_docs)
        
        if current_used_bytes >= LIMIT_BYTES:
            raise HTTPException(status_code=413, detail="Storage limit of 15 GB reached. Upgrade or delete files to upload more.")

        # Create a user-specific folder
        user_folder = f"user_{current_user.id}"
        
        # Save file to local storage
        file_path = await storage_service.save_file(file, folder=user_folder)
        
        # Get file size
        file_size_bytes = os.path.getsize(file_path)
        
        if current_used_bytes + file_size_bytes > LIMIT_BYTES:
            storage_service.delete_file(file_path)
            raise HTTPException(status_code=413, detail="File too large. This upload exceeds your 15 GB storage limit.")

        readable_size = format_size(file_size_bytes)
        
        # Create database record
        new_doc = Document(
            name=file.filename,
            file_path=file_path,
            size=readable_size,
            category=category,
            is_sensitive=is_sensitive,
            owner_id=current_user.id,
            folder_id=folder_id if folder_id else None
        )
        
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        
        # Log the activity
        activity_service.log_action(
            db, 
            user_id=current_user.id, 
            action="UPLOAD", 
            details=f"Uploaded document: {file.filename}"
        )
        
        return new_doc
        
    except Exception as e:
        # If DB fails, try to cleanup the file
        if 'file_path' in locals():
            storage_service.delete_file(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
