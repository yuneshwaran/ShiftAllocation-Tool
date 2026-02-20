from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func 

from datetime import date, datetime , timedelta
import pytz 
from models.database import get_db
from models.models import (
    Project,
    ProjectLead,
    ProjectEmployee,
    Employee,
    ShiftAllocation,
    ProjectShiftMaster,
)
from models.schemas import (
    ShiftAssignRequest,
    ShiftBatchRequest,
    ProjectShiftCreateRequest,
    ShiftBatchItem,
)
from api.dependencies import get_current_lead, get_project_or_403 , get_holidays_map

router = APIRouter(
    prefix="/shifts",
    tags=["Shifts"],
    dependencies=[Depends(get_current_lead)],
)
ist = pytz.timezone('Asia/Kolkata') 

@router.get("/masters")
def get_project_shifts(
    project_id: int,
    on_date: date | None = None,
    db: Session = Depends(get_db),
):
    if not on_date:
        on_date = date.today()

    shifts = (
        db.query(ProjectShiftMaster)
        .filter(
            ProjectShiftMaster.project_id == project_id,
            ProjectShiftMaster.effective_from <= on_date,
            (ProjectShiftMaster.effective_to.is_(None))
            | (ProjectShiftMaster.effective_to >= on_date),
            ProjectShiftMaster.is_active == True,
        )
        .order_by(ProjectShiftMaster.shift_code)
        .all()
    )

    return shifts

@router.get("/projects/{project_id}/shifts/history")
def get_project_shift_history(
    project_id: int,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    shifts = (
        db.query(ProjectShiftMaster)
        .filter(ProjectShiftMaster.project_id == project_id)
        .order_by(
            ProjectShiftMaster.shift_code,
            ProjectShiftMaster.effective_from.desc(),
        )
        .all()
    )

    return [
        {
            "shift_code": s.shift_code,
            "shift_name": s.shift_name,
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "weekday_allowance": float(s.weekday_allowance),
            "weekend_allowance": float(s.weekend_allowance),
            "effective_from": s.effective_from,
            "effective_to": s.effective_to,
            "is_active": s.is_active,
        }
        for s in shifts
    ]


@router.post("/assign")
def assign_shift(
    req: ShiftAssignRequest,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(req.project_id, lead, db)

    get_shift_for_date(
        db=db,
        project_id=req.project_id,
        shift_code=req.shift_code,
        shift_date=req.shift_date,
    )

    for emp_id in req.emp_ids:
        if not db.query(ProjectEmployee).filter_by(
            project_id=req.project_id,
            emp_id=emp_id,
        ).first():
            raise HTTPException(400, "Employee not part of project")

        try:
            db.add(
                ShiftAllocation(
                    project_id=req.project_id,
                    emp_id=emp_id,
                    shift_code=req.shift_code,
                    shift_date=req.shift_date,
                )
            )
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, "Employee already assigned")

    return {"status": "ok"}

@router.get("/weekly")
def get_weekly_allocation(
    project_id: int,
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    allocations = (
        db.query(ShiftAllocation, Employee, ProjectLead)
        .select_from(ShiftAllocation)
        .join(Employee, ShiftAllocation.emp_id == Employee.emp_id)
        .outerjoin(
            ProjectLead,
            ShiftAllocation.approved_by == ProjectLead.lead_id
        )
        .filter(
            ShiftAllocation.project_id == project_id,
            ShiftAllocation.shift_date.between(from_date, to_date),
        )
        .all()
    )

    holidays = get_holidays_map(db, project_id, from_date, to_date)

    result = {}
    day_meta = {}

    for alloc, emp , approver in allocations:
        d = alloc.shift_date.isoformat()

        result.setdefault(d, {
            "shifts": {},
            "is_approved": True,    
            "approved_by": approver.lead_name if approver else None,
            "last_updated": None,
            **holidays.get(d, {"is_holiday": False}),
        })

        if not alloc.is_approved:
            result[d]["is_approved"] = False

        if (
            result[d]["last_updated"] is None
            or alloc.last_updated > result[d]["last_updated"]
        ):
            result[d]["last_updated"] = alloc.last_updated
            
        if alloc.is_approved and approver:
            result[d]["approved_by_name"] = approver.lead_name

        result[d]["shifts"].setdefault(
            alloc.shift_code, []
        ).append({
            "allocation_id": alloc.allocation_id,
            "emp_id": emp.emp_id,
            "emp_name": emp.emp_name,
            "project_id": alloc.project_id,
            "is_approved": alloc.is_approved,
        })

    for d, h in holidays.items():
        result.setdefault(d, {
            "shifts": {},
            "is_approved": False,
            "last_updated": None,
            **h,
        })
    return result

@router.get("/employees/available")
def get_available_employees(
    project_id: int,
    shift_code: str,
    shift_date: date,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    assigned = (
        db.query(ShiftAllocation.emp_id)
        .filter(
            ShiftAllocation.project_id == project_id,
            ShiftAllocation.shift_code == shift_code,
            ShiftAllocation.shift_date == shift_date,
        )
        .subquery()
    )

    employees = (
        db.query(Employee)
        .join(ProjectEmployee)
        .filter(
            ProjectEmployee.project_id == project_id,
            ~Employee.emp_id.in_(assigned),
        )
        .all()
    )

    return [{"emp_id": e.emp_id, "emp_name": e.emp_name} for e in employees]

@router.post("/apply-batch")
def apply_shift_batch(
    payload: ShiftBatchRequest,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(payload.project_id, lead, db)

    if payload.remove:
        db.query(ShiftAllocation).filter(
            ShiftAllocation.allocation_id.in_(payload.remove),
            ShiftAllocation.project_id == payload.project_id,
        ).delete(synchronize_session=False)


    for a in payload.add:
        exists = (
            db.query(ShiftAllocation)
            .filter(
                ShiftAllocation.project_id == payload.project_id,
                ShiftAllocation.emp_id == a.emp_id,
                ShiftAllocation.shift_code == a.shift_code,
                ShiftAllocation.shift_date == a.shift_date,
            )
            .first()
        )

        if exists:
            continue  

        db.add(
            ShiftAllocation(
                project_id=payload.project_id,
                emp_id=a.emp_id,
                shift_code=a.shift_code,
                shift_date=a.shift_date,
                is_approved=False,
            )
        )

    for a in payload.approvals:
        db.query(ShiftAllocation).filter(
            ShiftAllocation.project_id == payload.project_id,
            ShiftAllocation.shift_date == a.date,
        ).update(
            {
                ShiftAllocation.is_approved: a.is_approved,
                ShiftAllocation.last_updated: datetime.now(ist),
                ShiftAllocation.approved_by: lead.lead_id if a.is_approved else None,
            },
            synchronize_session=False,
        )

    db.commit()
    return {"status": "ok"}

@router.post("/projects/{project_id}/shifts")
def create_project_shift(
    project_id: int,
    data: ProjectShiftCreateRequest,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    # Check duplicate effective_from for same shift_code
    exists = db.query(ProjectShiftMaster).filter(
        ProjectShiftMaster.project_id == project_id,
        ProjectShiftMaster.shift_code == data.shift_code,
        ProjectShiftMaster.effective_from == data.effective_from,
    ).first()

    if exists:
        raise HTTPException(
            400,
            "Shift already exists for this effective date"
        )

    new_shift = ProjectShiftMaster(
        project_id=project_id,
        shift_code=data.shift_code,
        shift_name=data.shift_name,
        start_time=data.start_time,
        end_time=data.end_time,
        weekday_allowance=data.weekday_allowance,
        weekend_allowance=data.weekend_allowance,
        effective_from=data.effective_from,
        is_active=True,
    )

    db.add(new_shift)
    db.commit()

    return {"status": "created"}


@router.get("/projects/{project_id}/shifts")
def get_project_shifts(
    project_id: int,
    on_date: date,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    return (
        db.query(ProjectShiftMaster)
        .filter(
            ProjectShiftMaster.project_id == project_id,
            ProjectShiftMaster.effective_from <= on_date,
            (
                ProjectShiftMaster.effective_to.is_(None)
                | (ProjectShiftMaster.effective_to >= on_date)
            ),
            ProjectShiftMaster.is_active == True,
        )
        .order_by(ProjectShiftMaster.shift_code)
        .all()
    )


@router.put("/projects/{project_id}/shifts/{shift_code}")
def update_project_shift(
    project_id: int,
    shift_code: str,
    data: ProjectShiftCreateRequest,
    db: Session = Depends(get_db),
    lead = Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    current = db.query(ProjectShiftMaster).filter(
        ProjectShiftMaster.project_id == project_id,
        ProjectShiftMaster.shift_code == shift_code,
        ProjectShiftMaster.effective_to.is_(None),
        ProjectShiftMaster.is_active == True,
    ).first()

    if not current:
        raise HTTPException(404, "Active shift not found")

    if data.effective_from <= current.effective_from:
        raise HTTPException(
            400,
            "effective_from must be after current effective_from"
        )

    current.effective_to = data.effective_from - timedelta(days=1)

    new_shift = ProjectShiftMaster(
        project_id=project_id,
        shift_code=shift_code,
        shift_name=data.shift_name,
        start_time=data.start_time,
        end_time=data.end_time,
        weekday_allowance=data.weekday_allowance,
        weekend_allowance=data.weekend_allowance,
        effective_from=data.effective_from,
        is_active=True,
    )

    db.add(new_shift)
    db.commit()

    return {"status": "versioned"}