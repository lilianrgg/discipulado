from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ReadingPlanAssignmentBase(BaseModel):
    day_number: int
    book_slug: str
    chapter_number: int

class ReadingPlanAssignment(ReadingPlanAssignmentBase):
    id: UUID
    plan_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ReadingPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_days: int

class ReadingPlan(ReadingPlanBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ReadingPlanWithAssignments(ReadingPlan):
    assignments: List[ReadingPlanAssignment] = []

class UserReadingProgressBase(BaseModel):
    plan_id: UUID
    day_number: int
    book_slug: str
    chapter_number: int

class UserReadingProgressCreate(UserReadingProgressBase):
    pass

class UserReadingProgress(UserReadingProgressBase):
    id: UUID
    user_id: UUID
    completed_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
