from pydantic import BaseModel, EmailStr
from datetime import date
from typing import List, Optional , Dict

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    username: str

class EmailRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class EmployeeCreateRequest(BaseModel):
    emp_id: int
    emp_name: str
    email: EmailStr
    is_experienced: bool
    reporting_to: Optional[int] = None


class EmployeeUpdateRequest(BaseModel):
    emp_id: int
    emp_name: str
    email: EmailStr
    is_experienced: bool
    reporting_to: Optional[int] = None


class EmployeeOut(BaseModel):
    emp_id: int
    emp_name: str
    email: Optional[str]
    is_experienced: bool
    is_active: bool
    reporting_to: Optional[int]
    lead_name: Optional[str]

    class Config:
        from_attributes = True


class EmployeeInProjectOut(BaseModel):
    emp_id: int
    emp_name: str
    in_project: bool

class LeadOut(BaseModel):
    lead_id: int
    lead_name: str

    class Config:
        from_attributes = True

class ProjectCreateRequest(BaseModel):
    name: str
    lead_ids: list[int]

class ProjectUpdateRequest(BaseModel):
    name: str
    is_active: bool
    lead_ids: list[int]



class ProjectShiftCreateRequest(BaseModel):
    shift_code: str
    shift_name: str
    start_time: str       
    end_time: str         
    weekday_allowance: float
    weekend_allowance: float
    effective_from: date

class ProjectShiftOut(BaseModel):
    shift_code: str
    shift_name: str
    start_time: str
    end_time: str
    weekday_allowance: float
    weekend_allowance: float
    effective_from: date
    effective_to: Optional[date]

    class Config:
        from_attributes = True

class ShiftAssignRequest(BaseModel):
    project_id: int
    shift_code: str
    shift_date: date
    emp_ids: List[int]

class ShiftBatchItem(BaseModel):
    emp_id: int
    shift_code: str
    shift_date: date
    is_approved: bool = False

class ShiftApprovalRequest(BaseModel):
    date: date
    is_approved: bool

class ShiftBatchRequest(BaseModel):
    project_id: int
    add: List[ShiftBatchItem] = []
    remove: List[int] = []        
    approvals: List[ShiftApprovalRequest] = []

class AvailableEmployee(BaseModel):
    emp_id: int
    emp_name: str

class ShiftView(BaseModel):
    emp_id: int
    emp_name: str
    shift_code: str
    shift_name: str
    shift_date: date

class EmployeeAvailability(BaseModel):
    emp_id: int
    emp_name: str
    available: bool
    reason: Optional[str] = None

class HolidayBase(BaseModel):
    holiday_date: date
    holiday_name: str
    spl_allowance: float = 0.0


class HolidayCreate(HolidayBase):
    project_id: Optional[int] = None
    spl_allowance: float = 0.0

class HolidayResponse(HolidayBase):
    holiday_id: int
    project_id: Optional[int]
    spl_allowance: float = 0.0
    class Config:
        from_attributes = True

class ReportShiftOut(BaseModel):
    shift_code: str
    shift_name: str
    start_time: str
    end_time: str


class EmployeeAllowanceRow(BaseModel):
    emp_id: int
    emp_name: str
    shift_counts: Dict[str, int]
    total_allowance: float


class EmployeeAllowanceReport(BaseModel):
    shifts: List[ReportShiftOut]
    rows: List[EmployeeAllowanceRow]

class AllowanceShiftOut(BaseModel):
    shift_code: str
    shift_name: str
    start_time: str
    end_time: str


class AllowanceEmployeeRow(BaseModel):
    emp_id: int
    emp_name: str
    shift_counts: Dict[str, int]
    total_allowance: float


class AllowanceReportResponse(BaseModel):
    shifts: List[AllowanceShiftOut]
    rows: List[AllowanceEmployeeRow]