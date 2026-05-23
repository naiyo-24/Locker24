from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentBase(BaseModel):
    name: str
    category: Optional[str] = "Personal"
    is_sensitive: Optional[bool] = False

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    size: str
    created_at: datetime
    owner_id: int
    folder_id: Optional[int] = None

    class Config:
        from_attributes = True
