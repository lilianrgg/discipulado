from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from app.core.supabase import get_supabase_admin_client
from app.api.deps import get_current_user
from app.schemas.plan import (
    ReadingPlan,
    ReadingPlanWithAssignments,
    UserReadingProgress,
    UserReadingProgressCreate
)

router = APIRouter()

@router.get("/", response_model=List[ReadingPlan])
def get_plans():
    """Retrieve all available reading plans."""
    supabase = get_supabase_admin_client()
    res = supabase.table("reading_plans").select("*").execute()
    return res.data

@router.get("/{plan_id}", response_model=ReadingPlanWithAssignments)
def get_plan(plan_id: UUID):
    """Retrieve a specific reading plan with its daily chapter assignments."""
    supabase = get_supabase_admin_client()
    
    # Get plan details
    plan_res = supabase.table("reading_plans").select("*").eq("id", str(plan_id)).execute()
    if not plan_res.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan_data = plan_res.data[0]
    
    # Get assignments
    assign_res = supabase.table("reading_plan_assignments").select("*").eq("plan_id", str(plan_id)).execute()
    plan_data["assignments"] = assign_res.data
    
    return plan_data

@router.post("/{plan_id}/progress", response_model=UserReadingProgress)
def mark_progress(
    plan_id: UUID,
    progress: UserReadingProgressCreate,
    user=Depends(get_current_user)
):
    """Mark a specific day and chapter as completed for the current user."""
    supabase = get_supabase_admin_client()
    
    if progress.plan_id != plan_id:
        raise HTTPException(status_code=400, detail="Plan ID mismatch")
    
    # Insert or update progress
    data = {
        "user_id": user.id,
        "plan_id": str(plan_id),
        "day_number": progress.day_number,
        "book_slug": progress.book_slug,
        "chapter_number": progress.chapter_number
    }
    
    res = supabase.table("user_reading_progress").upsert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save progress")
        
    return res.data[0]

@router.get("/user/progress", response_model=List[UserReadingProgress])
def get_user_progress(user=Depends(get_current_user)):
    """Get all reading progress for the current user."""
    supabase = get_supabase_admin_client()
    res = supabase.table("user_reading_progress").select("*").eq("user_id", user.id).execute()
    return res.data
