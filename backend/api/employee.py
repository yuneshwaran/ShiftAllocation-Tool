from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from models.database import get_db
from models.models import ProjectLead as ProjectLeadModel, Employee, ProjectLead
from api.dependencies import get_current_lead, get_project_or_403
from models.schemas import (
    EmployeeCreateRequest,
    EmployeeUpdateRequest,
    EmployeeOut,
    EmployeeInProjectOut,
    LeadOut
)

router = APIRouter(
    prefix="/employees", 
    tags=["Employees"]
)

from fastapi import HTTPException

@router.post("/")
def create_employee(
    data: EmployeeCreateRequest,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    existing = db.query(Employee).filter(Employee.emp_id == data.emp_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Employee ID already exists"
        )

    emp = Employee(
        emp_id=data.emp_id,
        emp_name=data.emp_name,     
        email=data.email,
        is_experienced=data.is_experienced,
        reporting_to=data.reporting_to or lead.emp_id,
    )

    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.put("/{emp_id}")
def update_employee(
    emp_id: int,
    data: EmployeeUpdateRequest,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    emp = db.query(Employee).get(emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")

    emp.emp_name = data.emp_name
    emp.is_experienced = data.is_experienced
    emp.reporting_to = data.reporting_to
    db.commit()
    return emp


@router.get("/")
def list_employees(
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    employees = db.query(Employee).all()
    leads = {
        l.lead_id: l.lead_name
        for l in db.query(ProjectLead).all()
    }

    return [
        {
            "emp_id": e.emp_id,
            "emp_name": e.emp_name,
            "email": e.email,
            "is_experienced": e.is_experienced,
            "lead_name": leads.get(e.reporting_to),
        }
        for e in employees
    ]



@router.get("/leads", response_model=list[LeadOut])
def list_leads(
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    return (
        db.query(ProjectLeadModel)
        .order_by(ProjectLeadModel.lead_name)
        .all()
    )


@router.get("/by-project")
def get_employees_by_project(
    project_id: int,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    employees = (
        db.query(Employee)
        .join(ProjectEmployee)
        .filter(ProjectEmployee.project_id == project_id)
        .all()
    )

    return [
        {
            "emp_id": e.emp_id,
            "emp_name": e.emp_name,
            "in_project": True,
        }
        for e in employees
    ]

@router.delete("/{emp_id}")
def delete_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    emp = db.query(Employee).get(emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")

    db.delete(emp)
    db.commit()
    return {"message": "Employee deleted"}
