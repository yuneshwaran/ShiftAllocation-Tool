from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db
from models.models import Project , ProjectLead , ProjectLeadAssignment
from api.dependencies import get_current_lead
from models.schemas import (
    ProjectCreateRequest, 
    ProjectUpdateRequest,
)

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
    dependencies=[Depends(get_current_lead)],
)

# --------------------------------------------------
# List projects
# --------------------------------------------------
@router.get("/")
def list_projects(db: Session = Depends(get_db)):
    projects = (
        db.query(Project)
        .filter(Project.is_active == True)
        .order_by(Project.name)
        .all()
    )

    result = []

    for p in projects:
        leads = (
            db.query(ProjectLead)
            .join(ProjectLeadAssignment,
                  ProjectLeadAssignment.lead_id == ProjectLead.lead_id)
            .filter(ProjectLeadAssignment.project_id == p.project_id)
            .all()
        )

        result.append({
            "project_id": p.project_id,
            "name": p.name,
            "is_active": p.is_active,
            "leads": [
                {
                    "lead_id": l.lead_id,
                    "name": l.lead_name
                }
                for l in leads
            ]
        })

    return result


# --------------------------------------------------
# Create project (admin only)
# --------------------------------------------------
@router.post("/")
def create_project(
    data: ProjectCreateRequest,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    if not lead.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")

    project = Project(
        name=data.name,
        is_active=True,
    )
    db.add(project)
    db.flush()   # get project_id

    for lid in data.lead_ids:
        db.add(ProjectLeadAssignment(
            project_id=project.project_id,
            lead_id=lid
        ))

    db.commit()
    db.refresh(project)

    return project


# --------------------------------------------------
# Update project
# --------------------------------------------------

from models.models import ProjectLeadAssignment

@router.put("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectUpdateRequest,
    db: Session = Depends(get_db),
):
    project = db.query(Project).get(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    project.name = data.name
    project.is_active = data.is_active

    db.query(ProjectLeadAssignment).filter(
        ProjectLeadAssignment.project_id == project_id
    ).delete()

    for lid in data.lead_ids:
        db.add(ProjectLeadAssignment(
            project_id=project_id,
            lead_id=lid
        ))

    db.commit()
    return project


# --------------------------------------------------
# Soft delete project
# --------------------------------------------------
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = db.query(Project).get(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    project.is_active = False
    db.commit()

    return {"status": "deactivated"}


@router.get("/leads")
def list_leads(
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    if not lead.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")

    leads = (
        db.query(ProjectLead)
        .order_by(ProjectLead.lead_name)
        .all()
    )

    return [
        {
            "lead_id": l.lead_id,
            "name": l.lead_name,
            "email": l.email,
        }
        for l in leads
    ]
