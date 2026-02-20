from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean,
    ForeignKey, UniqueConstraint, Date , Numeric , Time
)
from sqlalchemy.orm import relationship
from models.database import Base
import datetime


class ProjectLead(Base):
    __tablename__ = "project_lead"

    lead_id = Column(Integer, primary_key=True)
    lead_name = Column(String(50), nullable=False)
    email = Column(String(50), unique=True, nullable=False)
    passhash = Column(String(255), nullable=False)

    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    otp_code = Column(String(10))
    otp_expiry = Column(DateTime)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)



class Employee(Base):
    __tablename__ = "employee"

    emp_id = Column(Integer, primary_key=True, index=True)
    emp_name = Column(String(50), nullable=False)
    email = Column(String(50), unique=True, nullable=False)
    passhash = Column(String(255))

    is_experienced = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    reporting_to = Column(
        Integer,
        ForeignKey("project_lead.lead_id")
    )

    lead = relationship("ProjectLead")



class Project(Base):
    __tablename__ = "project"

    project_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)

    # lead_id = Column(
    #     Integer,
    #     ForeignKey("project_lead.lead_id")
    # )

    is_active = Column(Boolean, default=True)

    last_updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow
    )

    # lead = relationship("ProjectLead")


class ProjectLeadAssignment(Base):
    __tablename__ = "project_lead_assignment"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("project.project_id"))
    lead_id = Column(Integer, ForeignKey("project_lead.lead_id"))


class ProjectEmployee(Base):
    __tablename__ = "project_employee"

    id = Column(
        Integer, 
        autoincrement=True,
        primary_key=True)

    project_id = Column(
        Integer,
        ForeignKey("project.project_id"),
        nullable=False
    )

    emp_id = Column(
        Integer,
        ForeignKey("employee.emp_id"),
        nullable=False
    )


    employee = relationship("Employee")
    project = relationship("Project")


class ShiftAllocation(Base):
    __tablename__ = "shift_allocation"

    allocation_id = Column(Integer, primary_key=True, autoincrement=True)

    emp_id = Column(Integer, ForeignKey("employee.emp_id"), nullable=False)
    project_id = Column(Integer, ForeignKey("project.project_id"), nullable=False)

    approved_by = Column(
    Integer,
    ForeignKey("project_lead.lead_id"),
    nullable=True
    )
    shift_code = Column(String(20), nullable=False)
    shift_date = Column(Date, nullable=False)

    is_approved = Column(Boolean, default=False)

    last_updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint(
            "emp_id", "project_id", "shift_code", "shift_date",
            name="uq_emp_project_shift_day"
        ),
    )

    employee = relationship("Employee")
    project = relationship("Project")
    approver = relationship("ProjectLead")


class ProjectShiftMaster(Base):
    __tablename__ = "project_shift_master"

    id = Column(Integer, primary_key=True, autoincrement=True)

    project_id = Column(
        Integer,
        ForeignKey("project.project_id"),
        nullable=False
    )

    shift_code = Column(String(20), nullable=False)   # S1, S2, N1
    shift_name = Column(String(50), nullable=False)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    weekday_allowance = Column(Numeric(10, 2), default=0, nullable=False)
    weekend_allowance = Column(Numeric(10, 2), default=0, nullable=False)

    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint(
            "project_id", "shift_code", "effective_from",
            name="uq_project_shift_effective"
        ),
    )

    project = relationship("Project")

class ProjectHoliday(Base):
    __tablename__ = "project_holiday"

    holiday_id = Column(Integer, primary_key=True, autoincrement=True)

    project_id = Column(
        Integer,
        ForeignKey("project.project_id", ondelete="CASCADE"),
        nullable=True
    )

    holiday_date = Column(Date, nullable=False)
    holiday_name = Column(String(100), nullable=False)
    spl_allowance = Column(Numeric(10, 2), default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow
    )

    project = relationship("Project")
    
    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "holiday_date",
            name="uq_project_holiday_date"
            
        ),
    )