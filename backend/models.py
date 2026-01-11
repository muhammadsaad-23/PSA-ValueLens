from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    attendance = Column(Integer)
    revenue = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    feedbacks = relationship("Feedback", back_populates="event", cascade="all, delete-orphan")
    score = relationship("Score", back_populates="event", uselist=False, cascade="all, delete-orphan")
    training_label = relationship("TrainingLabel", back_populates="event", uselist=False, cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    respondent_id = Column(String)
    text = Column(Text)
    rating = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    event = relationship("Event", back_populates="feedbacks")

class Score(Base):
    __tablename__ = "scores"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), unique=True)
    revenue_score = Column(Float)
    feedback_score = Column(Float)
    value_score = Column(Float)
    explanation = Column(JSON)
    feature_vector = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    event = relationship("Event", back_populates="score")

class TrainingLabel(Base):
    __tablename__ = "training_labels"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), unique=True)
    admin_label = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    event = relationship("Event", back_populates="training_label")

class ModelState(Base):
    __tablename__ = "model_state"
    
    id = Column(Integer, primary_key=True, index=True)
    version = Column(Integer, default=1)
    weights = Column(JSON)
    trained_on_n = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
