from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FolderCreate(BaseModel):
    name: str
    is_sensitive: Optional[bool] = False
    password: Optional[str] = None   # plain text — will be hashed on the backend


class FolderUpdate(BaseModel):
    name: str


class FolderResponse(BaseModel):
    id: int
    name: str
    is_sensitive: bool
    is_password_protected: bool        # True if password_hash is set
    created_at: datetime
    owner_id: int
    document_count: Optional[int] = 0

    class Config:
        from_attributes = True
