from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pytz 
import jwt
import random
from passlib.context import CryptContext

from models.database import get_db
from models.models import ProjectLead , Employee
from models.schemas import (
    LoginRequest,
    EmailRequest,
    ResetPasswordRequest,
)
from utils.email_utils import send_email

router = APIRouter(
    prefix="/auth", 
    tags=["Auth"]
    )

SECRET_KEY = "UTIS.SHIFT.ROSTER"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1024

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ist = pytz.timezone('Asia/Kolkata') 

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    lead = (
        db.query(ProjectLead)
        .filter(
            ProjectLead.email == data.email,
            ProjectLead.is_active == True
        )
        .first()
    )

    if not lead or not pwd_context.verify(data.password, lead.passhash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {
            "user_type": "lead",
            "lead_id": lead.lead_id,
            "email": lead.email,
            "is_admin": lead.is_admin,
            "exp": datetime.now(ist) + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            ),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.post("/employee/login")
def employee_login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.email == data.email,
            Employee.is_active == True
        )
        .first()
    )

    if not employee or not employee.passhash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(data.password, employee.passhash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {
            "user_type": "employee",
            "emp_id": employee.emp_id,
            "email": employee.email,
            "exp": datetime.now(ist) + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            ),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/send-otp")
def send_otp(data: EmailRequest, db: Session = Depends(get_db)):
    user = (
        db.query(ProjectLead)
        .filter(ProjectLead.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(404, "User not found")

    otp = str(random.randint(100000, 999999))
    expiry = datetime.now(ist) + timedelta(minutes=10)

    user.otp_code = otp
    user.otp_expiry = expiry
    db.commit()

    if not send_email(
        recipient=user.email,
        subject="ShiftRoster - Password Reset OTP",
        body=f"Your OTP is {otp}. It expires in 10 minutes.",
    ):
        raise HTTPException(500, "Failed to send OTP")

    return {"message": "OTP sent successfully"}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(ProjectLead)
        .filter(ProjectLead.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(404, "User not found")

    if user.otp_code != data.otp:
        raise HTTPException(400, "Invalid OTP")

    if not user.otp_expiry or user.otp_expiry < datetime.utcnow():
        raise HTTPException(400, "OTP expired")

    user.passhash = hash_password(data.new_password)
    user.otp_code = None
    user.otp_expiry = None
    db.commit()

    return {"message": "Password reset successful"}

@router.post("/employee/reset-password")
def reset_employee_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    employee = (
        db.query(Employee)
        .filter(Employee.email == data.email)
        .first()
    )

    if not employee:
        raise HTTPException(404, "Employee not found")

    if employee.otp_code != data.otp:
        raise HTTPException(400, "Invalid OTP")

    if not employee.otp_expiry or employee.otp_expiry < datetime.now(ist):
        raise HTTPException(400, "OTP expired")

    employee.passhash = hash_password(data.new_password)
    employee.otp_code = None
    employee.otp_expiry = None
    db.commit()

    return {"message": "Password reset successful"}
