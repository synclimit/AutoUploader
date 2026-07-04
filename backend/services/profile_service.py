from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from typing import List

from models import Profile, ProfileTemplate
from schemas import (
    ProfileCreate, ProfileUpdate, BulkImportRequest, BulkImportResponse
)

class ProfileService:
    @staticmethod
    def get_all(db: Session) -> List[Profile]:
        return db.query(Profile).all()

    @staticmethod
    def create(db: Session, data: ProfileCreate) -> Profile:
        db_profile = Profile(
            name=data.name,
            description=data.description,
            content_type=data.content_type,
            metadata_strategy=data.metadata_strategy,
            category=data.category,
            language=data.language,
            audience=data.audience,
            license=data.license,
            thumbnail_rules=data.thumbnail_rules,
            ai_preset=data.ai_preset,
            prompt_template=data.prompt_template
        )
        try:
            db.add(db_profile)
            db.commit()
            db.refresh(db_profile)
            db_profile.title_templates = []
            db_profile.description_templates = []
            db_profile.tag_templates = []
            return db_profile
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Profile Name Already Exists")

    @staticmethod
    def get_by_id(db: Session, profile_id: str) -> Profile:
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile.title_templates = [t for t in profile.templates if t.type == "title"]
        profile.description_templates = [t for t in profile.templates if t.type == "description"]
        profile.tag_templates = [t for t in profile.templates if t.type == "tag"]
        return profile

    @staticmethod
    def update(db: Session, profile_id: str, data: ProfileUpdate) -> Profile:
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        profile.name = data.name
        profile.description = data.description
        profile.content_type = data.content_type
        profile.metadata_strategy = data.metadata_strategy
        profile.category = data.category
        profile.language = data.language
        profile.audience = data.audience
        profile.license = data.license
        profile.thumbnail_rules = data.thumbnail_rules
        profile.ai_preset = data.ai_preset
        profile.prompt_template = data.prompt_template

        try:
            db.commit()
            db.refresh(profile)
            profile.title_templates = [t for t in profile.templates if t.type == "title"]
            profile.description_templates = [t for t in profile.templates if t.type == "description"]
            profile.tag_templates = [t for t in profile.templates if t.type == "tag"]
            return profile
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Profile Name Already Exists")

    @staticmethod
    def delete(db: Session, profile_id: str) -> None:
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        db.delete(profile)
        db.commit()

    @staticmethod
    def bulk_import_templates(db: Session, profile_id: str, data: BulkImportRequest) -> BulkImportResponse:
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        if data.mode == "replace":
            db.query(ProfileTemplate).filter(
                ProfileTemplate.profile_id == profile_id,
                ProfileTemplate.type == data.type
            ).delete()
            db.commit()
            
        existing_templates = db.query(ProfileTemplate).filter(
            ProfileTemplate.profile_id == profile_id,
            ProfileTemplate.type == data.type
        ).all()
        existing_contents = {t.content for t in existing_templates}
        
        imported_count = 0
        skipped_count = 0
        new_templates = []
        
        for tmpl in data.templates:
            content = tmpl.strip()
            if not content:
                continue
                
            if content in existing_contents:
                skipped_count += 1
                continue
                
            new_template = ProfileTemplate(
                profile_id=profile_id,
                type=data.type,
                content=content
            )
            new_templates.append(new_template)
            existing_contents.add(content)
            imported_count += 1
            
        if new_templates:
            db.add_all(new_templates)
            db.commit()
            
        all_type_templates = db.query(ProfileTemplate).filter(
            ProfileTemplate.profile_id == profile_id,
            ProfileTemplate.type == data.type
        ).all()
        
        return BulkImportResponse(
            imported_count=imported_count,
            skipped_count=skipped_count,
            templates=all_type_templates
        )

    @staticmethod
    def delete_template(db: Session, profile_id: str, template_id: str) -> None:
        template = db.query(ProfileTemplate).filter(
            ProfileTemplate.id == template_id,
            ProfileTemplate.profile_id == profile_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
            
        db.delete(template)
        db.commit()

    @staticmethod
    def set_default(db: Session, profile_id: str) -> Profile:
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        db.query(Profile).update({"is_default": False})
        profile.is_default = True
        db.commit()
        
        return ProfileService.get_by_id(db, profile_id)

    @staticmethod
    def duplicate(db: Session, profile_id: str) -> Profile:
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        new_name = profile.name + " (Copy)"
        
        # Ensure unique name
        counter = 1
        while db.query(Profile).filter(Profile.name == new_name).first():
            counter += 1
            new_name = f"{profile.name} (Copy {counter})"
            
        db_profile = Profile(
            name=new_name,
            description=profile.description,
            content_type=profile.content_type,
            metadata_strategy=profile.metadata_strategy,
            category=profile.category,
            language=profile.language,
            audience=profile.audience,
            license=profile.license,
            thumbnail_rules=profile.thumbnail_rules,
            ai_preset=profile.ai_preset,
            prompt_template=profile.prompt_template,
            is_default=False
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        
        # Copy templates
        templates_to_add = []
        for template in profile.templates:
            templates_to_add.append(ProfileTemplate(
                profile_id=db_profile.id,
                type=template.type,
                content=template.content
            ))
            
        if templates_to_add:
            db.add_all(templates_to_add)
            db.commit()
            
        return ProfileService.get_by_id(db, db_profile.id)

