from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models.database import SessionLocal, engine
from models.models import Base
from models.schemas import LoginRequest, UserResponse
from api.auth import router as auth_router
from api import auth, shifts, employee, me , projects ,assignments , holidays ,allowance

Base.metadata.create_all(bind=engine)
app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       
    allow_credentials=True,       
    allow_methods=["*"],
    allow_headers=["*"],     
)

app.include_router(auth_router)
app.include_router(shifts.router)
app.include_router(me.router)
app.include_router(employee.router)
app.include_router(assignments.router)
app.include_router(projects.router)
app.include_router(holidays.router)
app.include_router(allowance.router)

