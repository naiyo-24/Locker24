from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import hashlib
import secrets

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse
from pydantic import BaseModel

router = APIRouter()


def _hash_password(plain: str) -> str:
    """Store password as plain text as requested."""
    return plain


def _verify_password(plain: str, stored: str) -> bool:
    """Verify plain text password."""
    return plain == stored



def _folder_to_response(folder: Folder, doc_count: int = 0) -> FolderResponse:
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        is_sensitive=folder.is_sensitive or False,
        is_password_protected=folder.password_hash is not None,
        created_at=folder.created_at,
        owner_id=folder.owner_id,
        document_count=doc_count,
    )


# ─────────────────────────────────────────────
# LIST
# ─────────────────────────────────────────────
@router.get("/", response_model=List[FolderResponse])
async def list_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all folders for the current user with document counts."""
    folders = db.query(Folder).filter(Folder.owner_id == current_user.id).all()
    result = []
    for folder in folders:
        count = db.query(Document).filter(
            Document.owner_id == current_user.id,
            Document.folder_id == folder.id
        ).count()
        result.append(_folder_to_response(folder, count))
    return result


# ─────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────
@router.post("/", response_model=FolderResponse)
async def create_folder(
    payload: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new folder. Optionally set a password and/or mark as sensitive."""
    existing = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.name == payload.name.strip()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A folder with this name already exists.")

    # Hash the password if provided
    hashed = _hash_password(payload.password) if payload.password and payload.password.strip() else None

    new_folder = Folder(
        name=payload.name.strip(),
        is_sensitive=payload.is_sensitive or False,
        password_hash=hashed,
        owner_id=current_user.id,
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return _folder_to_response(new_folder, 0)


# ─────────────────────────────────────────────
# VERIFY PASSWORD
# ─────────────────────────────────────────────
class PasswordPayload(BaseModel):
    password: str

@router.post("/{folder_id}/verify-password")
async def verify_folder_password(
    folder_id: int,
    payload: PasswordPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify the password for a password-protected folder. Returns {verified: true/false}."""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")

    if not folder.password_hash:
        return {"verified": True}   # no password set

    verified = _verify_password(payload.password, folder.password_hash)
    return {"verified": verified}


# ─────────────────────────────────────────────
# RENAME
# ─────────────────────────────────────────────
@router.patch("/{folder_id}", response_model=FolderResponse)
async def rename_folder(
    folder_id: int,
    payload: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename an existing folder."""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")

    collision = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.name == payload.name.strip(),
        Folder.id != folder_id
    ).first()
    if collision:
        raise HTTPException(status_code=400, detail="A folder with this name already exists.")

    folder.name = payload.name.strip()
    db.commit()
    db.refresh(folder)

    count = db.query(Document).filter(
        Document.owner_id == current_user.id,
        Document.folder_id == folder.id
    ).count()
    return _folder_to_response(folder, count)


# ─────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────
@router.delete("/{folder_id}", status_code=204)
async def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete folder. Documents inside are un-linked (not deleted)."""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")

    db.query(Document).filter(
        Document.owner_id == current_user.id,
        Document.folder_id == folder_id
    ).update({"folder_id": None}, synchronize_session=False)

    db.delete(folder)
    db.commit()
    return None


# ─────────────────────────────────────────────
# GET DOCUMENTS IN FOLDER
# ─────────────────────────────────────────────
@router.get("/{folder_id}/documents")
async def get_folder_documents(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all documents inside a specific folder."""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")

    return db.query(Document).filter(
        Document.owner_id == current_user.id,
        Document.folder_id == folder_id
    ).all()


# ─────────────────────────────────────────────
# MOVE DOCUMENT INTO FOLDER
# ─────────────────────────────────────────────
@router.patch("/{folder_id}/move-document/{document_id}", status_code=200)
async def move_document_to_folder(
    folder_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.folder_id = folder_id
    db.commit()
    return {"detail": "Document moved successfully."}
