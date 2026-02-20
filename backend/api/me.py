from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.database import get_db
from models.models import (
    Project,
    ProjectLead,
    ProjectLeadAssignment,
    Employee,
    ProjectEmployee,
)
from api.dependencies import get_current_user , get_current_employee 

router = APIRouter(prefix="/me", tags=["Me"])


@router.get("/context")
def get_my_context(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # =====================
    # LEAD CONTEXT
    # =====================
    if isinstance(user, ProjectLead):

        if user.is_admin:
            projects = db.query(Project).filter(Project.is_active == True).all()
        else:
            projects = (
                db.query(Project)
                .join(ProjectLeadAssignment)
                .filter(
                    ProjectLeadAssignment.lead_id == user.lead_id,
                    Project.is_active == True,
                )
                .all()
            )

        return {
            "user_type": "lead",
            "lead_id": user.lead_id,
            "name": user.lead_name,
            "is_admin": user.is_admin,
            "projects": [
                {
                    "project_id": p.project_id,
                    "name": p.name,
                }
                for p in projects
            ],
            "default_project_id": projects[0].project_id if projects else None,
        }

    # =====================
    # EMPLOYEE CONTEXT
    # =====================
    elif isinstance(user, Employee):

        projects = (
            db.query(Project)
            .join(ProjectEmployee)
            .filter(
                ProjectEmployee.emp_id == user.emp_id,
                Project.is_active == True,
            )
            .all()
        )

        return {
            "user_type": "employee",
            "emp_id": user.emp_id,
            "name": user.emp_name,
            "projects": [
                {
                    "project_id": p.project_id,
                    "name": p.name,
                }
                for p in projects
            ],
            "default_project_id": projects[0].project_id if projects else None,
        }

    return {}

@router.get("/employee-context")
def get_employee_context(
    db: Session = Depends(get_db),
    employee=Depends(get_current_employee),  
):
    projects = (
        db.query(Project)
        .join(ProjectEmployee)
        .filter(ProjectEmployee.emp_id == employee.emp_id)
        .order_by(Project.name)
        .all()
    )

    if not projects:
        raise HTTPException(404, "No projects assigned")

    return {
        "emp_id": employee.emp_id,
        "emp_name": employee.emp_name,
        "projects": [
            {
                "project_id": p.project_id,
                "name": p.name,
            }
            for p in projects
        ],
        "default_project_id": projects[0].project_id,
    }
