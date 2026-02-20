# backend/api/allowance.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from models.database import get_db
from models.models import (
    ShiftAllocation,
    ProjectShiftMaster,
    ProjectHoliday,
    Employee,
)
from api.dependencies import(
    get_current_lead,
    get_project_or_403,
    get_holidays_map,
    )
from models.schemas import (
    AllowanceReportResponse,
    EmployeeAllowanceReport,
    AllowanceShiftOut,
    AllowanceEmployeeRow,
    )


router = APIRouter(
    prefix="/allowances",
    tags=["Allowances"],
    dependencies=[Depends(get_current_lead)],
)


@router.get("/reports/employee-allowance")
def employee_allowance_report(
    project_id: int,
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    get_project_or_403(project_id, lead, db)

    # Fetch active shifts
    shifts = (
        db.query(ProjectShiftMaster)
        .filter(
            ProjectShiftMaster.project_id == project_id,
            ProjectShiftMaster.effective_from <= to_date,
            (ProjectShiftMaster.effective_to.is_(None)) |
            (ProjectShiftMaster.effective_to >= from_date),
            ProjectShiftMaster.is_active == True,
        )
        .all()
    )

    shift_map = {s.shift_code: s for s in shifts}

    # Fetch allocations
    allocations = (
        db.query(
            ShiftAllocation.emp_id,
            Employee.emp_name,
            ShiftAllocation.shift_code,
            ShiftAllocation.shift_date,
        )
        .join(Employee)
        .filter(
            ShiftAllocation.project_id == project_id,
            ShiftAllocation.shift_date.between(from_date, to_date),
            ShiftAllocation.is_approved == True,
        )
        .all()
    )

    holidays = get_holidays_map(db, project_id, from_date, to_date)

    report = {}
    for emp_id, emp_name, shift_code, shift_date in allocations:

        emp = report.setdefault(emp_id, {
            "emp_id": emp_id,
            "emp_name": emp_name,
            "shift_counts": {},
            "holiday_shift_count": 0,
            "weekend_shift_count": 0,
            "total_allowance": 0,
        })

        shift = shift_map.get(shift_code)
        if not shift:
            continue

        is_weekend = shift_date.weekday() >= 5
        holiday_data = holidays.get(shift_date.isoformat())
        is_holiday = holiday_data is not None

        # --------------------------------------------------
        # PRIORITY 1 → WEEKEND (even if also holiday)
        # --------------------------------------------------
        if is_weekend:
            emp["weekend_shift_count"] += 1
            allowance = float(shift.weekend_allowance)
            emp["total_allowance"] += allowance
            continue

        # --------------------------------------------------
        # PRIORITY 2 → HOLIDAY (weekday holiday only)
        # --------------------------------------------------
        if is_holiday:
            emp["holiday_shift_count"] += 1
            allowance = float(shift.weekend_allowance)
            emp["total_allowance"] += allowance
            continue

        # --------------------------------------------------
        # NORMAL WEEKDAY SHIFT
        # --------------------------------------------------
        emp["shift_counts"][shift_code] = (
            emp["shift_counts"].get(shift_code, 0) + 1
        )

        allowance = float(shift.weekday_allowance)
        emp["total_allowance"] += allowance



    return {
        "shifts": [
            {
                "shift_code": s.shift_code,
                "shift_name": s.shift_name,
                "start_time": str(s.start_time),
                "end_time": str(s.end_time),
                "weekday_allowance": float(s.weekday_allowance),
                "weekend_allowance": float(s.weekend_allowance),
            }
            for s in shifts
        ],
        "rows": list(report.values()),
    }
