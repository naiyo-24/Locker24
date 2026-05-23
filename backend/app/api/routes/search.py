from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def search_documents(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search documents by name securely on the backend.
    """
    if not q:
        return []
        
    query = db.query(Document).filter(
        Document.owner_id == current_user.id,
        Document.name.ilike(f"%{q}%")
    )
    
    return query.all()
