from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database.db import SessionLocal
from schemas import (
    ProfileCreate, ProfileUpdate, ProfileListResponse, ProfileDetailResponse,
    BulkImportRequest, BulkImportResponse
)
from services.profile_service import ProfileService

router = APIRouter(prefix="/api/v1/profiles", tags=["Profiles"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[ProfileListResponse])
def get_profiles(db: Session = Depends(get_db)):
    return ProfileService.get_all(db)

@router.post("", response_model=ProfileDetailResponse, status_code=status.HTTP_201_CREATED)
def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    return ProfileService.create(db, profile)

@router.get("/{profile_id}", response_model=ProfileDetailResponse)
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    return ProfileService.get_by_id(db, profile_id)

@router.put("/{profile_id}", response_model=ProfileDetailResponse)
def update_profile(profile_id: str, profile_data: ProfileUpdate, db: Session = Depends(get_db)):
    return ProfileService.update(db, profile_id, profile_data)

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(profile_id: str, db: Session = Depends(get_db)):
    ProfileService.delete(db, profile_id)
    return None

@router.post("/{profile_id}/templates/bulk", response_model=BulkImportResponse)
def bulk_import_templates(profile_id: str, data: BulkImportRequest, db: Session = Depends(get_db)):
    return ProfileService.bulk_import_templates(db, profile_id, data)

@router.delete("/{profile_id}/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(profile_id: str, template_id: str, db: Session = Depends(get_db)):
    ProfileService.delete_template(db, profile_id, template_id)
    return None

@router.post("/{profile_id}/duplicate", response_model=ProfileDetailResponse)
def duplicate_profile(profile_id: str, db: Session = Depends(get_db)):
    return ProfileService.duplicate(db, profile_id)

@router.post("/{profile_id}/default", response_model=ProfileDetailResponse)
def set_default_profile(profile_id: str, db: Session = Depends(get_db)):
    return ProfileService.set_default(db, profile_id)
