from fastapi import FastAPI, Depends
from pydantic import BaseModel, validator
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List

from database import engine, SessionLocal, Base
import models

app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)

class CrowdRequest(BaseModel):
    zone_id: int
    crowd_count: int
    timestamp: datetime

    @validator("timestamp", pre=True)
    def parse_timestamp(cls, v):
        if isinstance(v, str):
            # Android's Instant.now() produces "2026-02-18T09:39:43.123456Z"
            # Python < 3.11 fromisoformat() doesn't handle the trailing 'Z'
            v = v.replace("Z", "+00:00")
        return v


class CrowdResponse(BaseModel):
    zone_id: int
    crowd_count: int
    timestamp: datetime

    class Config:
        orm_mode = True


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"message": "Backend running successfully"}

@app.post("/update-crowd")
def update_crowd(data: CrowdRequest, db: Session = Depends(get_db)):

    new_entry = models.CrowdData(
        zone_id=data.zone_id,
        crowd_count=data.crowd_count,
        timestamp=data.timestamp
    )

    db.add(new_entry)
    db.commit()

    return {"message": "Data stored in SQLite successfully"}
@app.get("/all-crowd-data", response_model=List[CrowdResponse])
def get_all_data(db: Session = Depends(get_db)):
    return db.query(models.CrowdData).all()
