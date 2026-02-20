from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db
from models.models import (
    Project,
    ProjectEmployee,
    Employee,
)
from api.dependencies import get_current_lead, get_project_or_403

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
    dependencies=[Depends(get_current_lead)],
)

@router.get("/projects/{project_id}/employees")
def get_assigned_employees(
    project_id: int,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    employees = (
        db.query(Employee)
        .join(ProjectEmployee)
        .filter(ProjectEmployee.project_id == project_id)
        .order_by(Employee.emp_name)
        .all()
    )

    return [
        {
            "emp_id": e.emp_id,
            "emp_name": e.emp_name,
        }
        for e in employees
    ]


@router.get("/projects/{project_id}/employees/available")
def get_available_employees(
    project_id: int,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    assigned_ids = (
        db.query(ProjectEmployee.emp_id)
        .filter(ProjectEmployee.project_id == project_id)
        .subquery()
    )

    employees = (
        db.query(Employee)
        .filter(~Employee.emp_id.in_(assigned_ids))
        .order_by(Employee.emp_name)
        .all()
    )

    return [
        {
            "emp_id": e.emp_id,
            "emp_name": e.emp_name,
        }
        for e in employees
    ]


@router.post("/projects/{project_id}/employees/{emp_id}")
def assign_employee(
    project_id: int,
    emp_id: int,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    exists = (
        db.query(ProjectEmployee)
        .filter(
            ProjectEmployee.project_id == project_id,
            ProjectEmployee.emp_id == emp_id,
        )
        .first()
    )

    if exists:
        raise HTTPException(409, "Employee already assigned")

    db.add(
        ProjectEmployee(
            project_id=project_id,
            emp_id=emp_id,
        )
    )
    db.commit()

    return {"status": "assigned"}


# --------------------------------------------------
# Remove employee from project
# --------------------------------------------------
@router.delete("/projects/{project_id}/employees/{emp_id}")
def remove_employee(
    project_id: int,
    emp_id: int,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    deleted = (
        db.query(ProjectEmployee)
        .filter(
            ProjectEmployee.project_id == project_id,
            ProjectEmployee.emp_id == emp_id,
        )
        .delete()
    )

    if not deleted:
        raise HTTPException(404, "Assignment not found")

    db.commit()
    return {"status": "removed"}
