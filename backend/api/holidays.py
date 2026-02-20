from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from models.database import get_db
from models.models import ProjectHoliday
from models.schemas import HolidayCreate, HolidayResponse
from api.dependencies import get_current_lead, get_project_or_403


router = APIRouter(prefix="/holidays", tags=["Holidays"])

@router.get("/", response_model=list[HolidayResponse])
def list_holidays(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    project_id = None if project_id in (0, None) else project_id

    query = db.query(ProjectHoliday)

    if project_id is not None:
        query = query.filter(
            or_(
                ProjectHoliday.project_id.is_(None),
                ProjectHoliday.project_id == project_id,
            )
        )
    else:
        query = query.filter(ProjectHoliday.project_id.is_(None))

    return query.order_by(ProjectHoliday.holiday_date).all()


@router.post("/", response_model=HolidayResponse)
def upsert_holiday(
    payload: HolidayCreate,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    payload_project_id = payload.project_id

    if payload_project_id:
        get_project_or_403(payload_project_id, lead, db)

    holiday = (
        db.query(ProjectHoliday)
        .filter(
            ProjectHoliday.project_id == payload_project_id,
            ProjectHoliday.holiday_date == payload.holiday_date,
        )
        .first()
    )

    if holiday:
        holiday.holiday_name = payload.holiday_name
        holiday.spl_allowance = payload.spl_allowance
    else:
        holiday = ProjectHoliday(
            project_id=payload_project_id,
            holiday_date=payload.holiday_date,
            holiday_name=payload.holiday_name,
            spl_allowance=payload.spl_allowance,
        )
        db.add(holiday)

    db.commit()
    db.refresh(holiday)
    return holiday



@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    lead=Depends(get_current_lead),
):
    holiday = db.query(ProjectHoliday).get(holiday_id)
    if not holiday:
        raise HTTPException(404, "Holiday not found")

    if holiday.project_id:
        get_project_or_403(holiday.project_id, lead, db)

    db.delete(holiday)
    db.commit()
    return {"status": "deleted"}
