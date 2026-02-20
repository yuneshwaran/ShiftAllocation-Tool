from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_

import jwt
from datetime import date

from models.database import get_db
from models.models import (
    ProjectLead,
    ProjectLeadAssignment,
    Project,
    ProjectShiftMaster,
    Employee,
    ProjectHoliday,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = "UTIS.SHIFT.ROSTER"
ALGORITHM = "HS256"


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    user_type = payload.get("user_type")

    if user_type == "lead":
        user = (
            db.query(ProjectLead)
            .filter(
                ProjectLead.lead_id == payload.get("lead_id"),
                ProjectLead.is_active == True,
            )
            .first()
        )
    elif user_type == "employee":
        user = (
            db.query(Employee)
            .filter(
                Employee.emp_id == payload.get("emp_id"),
                Employee.is_active == True,
            )
            .first()
        )
    else:
        raise HTTPException(401, "Invalid user type")

    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unauthorized")

    return user


def get_current_lead(
    user=Depends(get_current_user),
):
    if not isinstance(user, ProjectLead):
        raise HTTPException(403, "Not a lead")

    return user

def get_current_employee(
    user=Depends(get_current_user),
):
    if not isinstance(user, Employee):
        raise HTTPException(403, "Not an employee")

    return user

def get_project_or_403(
    project_id: int,
    lead: ProjectLead,
    db: Session,
) -> Project:

    project = (
        db.query(Project)
        .filter(
            Project.project_id == project_id,
            Project.is_active == True,
        )
        .first()
    )

    if not project:
        raise HTTPException(404, "Project not found")

    # Admin bypass
    if lead.is_admin:
        return project

    # Check many-to-many assignment
    mapping = (
        db.query(ProjectLeadAssignment)
        .filter(
            ProjectLeadAssignment.project_id == project_id,
            ProjectLeadAssignment.lead_id == lead.lead_id,
        )
        .first()
    )

    if not mapping:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Not authorized for this project",
        )

    return project


# ───────────────────── SHIFT CORE (LOCKED) ─────────────────────

def get_shift_for_date(
    db: Session,
    project_id: int,
    shift_code: str,
    shift_date: date,
) -> ProjectShiftMaster:
    """
    Canonical shift resolver.
    DO NOT duplicate this logic anywhere else.
    """

    shift = (
        db.query(ProjectShiftMaster)
        .filter(
            ProjectShiftMaster.project_id == project_id,
            ProjectShiftMaster.shift_code == shift_code,
            ProjectShiftMaster.effective_from <= shift_date,
            or_(
                ProjectShiftMaster.effective_to.is_(None),
                ProjectShiftMaster.effective_to >= shift_date,
            ),
            ProjectShiftMaster.is_active == True,
        )
        .order_by(ProjectShiftMaster.effective_from.desc())
        .one_or_none()
    )

    if not shift:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No active shift found for "
                f"project={project_id}, "
                f"shift_code={shift_code}, "
                f"date={shift_date}"
            ),
        )

    return shift

def get_holidays_map(
    db: Session,
    project_id: int,
    from_date: date,
    to_date: date,
):
    holidays = (
        db.query(ProjectHoliday)
        .filter(
            ProjectHoliday.holiday_date.between(from_date, to_date),
            or_(
                ProjectHoliday.project_id.is_(None),
                ProjectHoliday.project_id == project_id
            )
        )
        .all()
    )

    holiday_map = {}

    for h in holidays:
        d = h.holiday_date.isoformat()

        if d not in holiday_map or h.project_id is not None:
            holiday_map[d] = {
                "is_holiday": True,
                "holiday_name": h.holiday_name,
                "scope": "company" if h.project_id is None else "project",
            }

    return holiday_map


def get_shift_allowance(
    db: Session,
    project_id: int,
    shift_code: str,
    shift_date: date,
) -> float:
    """
    Allowance resolver built on top of canonical shift resolver.
    """

    shift = get_shift_for_date(
        db=db,
        project_id=project_id,
        shift_code=shift_code,
        shift_date=shift_date,
    )

    is_weekend = shift_date.weekday() >= 5

    return (
        shift.weekend_allowance
        if is_weekend
        else shift.weekday_allowance
    )
