from sqlalchemy import Column, Integer, DateTime
from database import Base

class CrowdData(Base):
    __tablename__ = "crowd_data"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer)
    crowd_count = Column(Integer)
    timestamp = Column(DateTime)