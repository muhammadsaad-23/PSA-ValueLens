from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
import random
import string

from database import get_db, init_db
from models import Event, Feedback, Score, TrainingLabel, ModelState
from scoring import (
    compute_feedback_score,
    compute_revenue_score,
    compute_value_score,
    train_model,
    extract_features
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="PSA Event Value Analyzer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    attendance: int = Field(..., gt=0)
    revenue: float = Field(..., ge=0)

class EventResponse(BaseModel):
    id: int
    name: str
    attendance: int
    revenue: float
    feedback_count: int
    has_score: bool

class FeedbackCreate(BaseModel):
    text: str = Field(..., min_length=10)
    rating: Optional[int] = Field(None, ge=1, le=5)

class FeedbackResponse(BaseModel):
    id: int
    respondent_id: str
    text: str
    rating: Optional[int]

class ScoreResponse(BaseModel):
    event_id: int
    event_name: str
    revenue_score: float
    feedback_score: float
    value_score: float
    explanation: dict

class TrainingLabelCreate(BaseModel):
    admin_label: float = Field(..., ge=0, le=100)

class HistoryItem(BaseModel):
    id: int
    name: str
    attendance: int
    revenue: float
    revenue_score: float
    feedback_score: float
    value_score: float
    created_at: str


def generate_respondent_id() -> str:
    return "R-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@app.get("/api/events", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    return [
        EventResponse(
            id=e.id,
            name=e.name,
            attendance=e.attendance,
            revenue=e.revenue,
            feedback_count=len(e.feedbacks),
            has_score=e.score is not None
        )
        for e in events
    ]


@app.post("/api/events", response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    db_event = Event(name=event.name, attendance=event.attendance, revenue=event.revenue)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return EventResponse(
        id=db_event.id,
        name=db_event.name,
        attendance=db_event.attendance,
        revenue=db_event.revenue,
        feedback_count=0,
        has_score=False
    )


@app.get("/api/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {
        "id": event.id,
        "name": event.name,
        "attendance": event.attendance,
        "revenue": event.revenue,
        "feedback_count": len(event.feedbacks),
        "has_score": event.score is not None,
        "created_at": event.created_at.isoformat() if event.created_at else None
    }


@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted"}


@app.get("/api/events/{event_id}/respondents")
def get_respondents(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    existing = db.query(Feedback).filter(Feedback.event_id == event_id).all()
    existing_ids = {f.respondent_id for f in existing}
    
    if len(existing_ids) >= 30:
        return {"respondents": list(existing_ids), "remaining": 0}
    
    needed = 30 - len(existing_ids)
    new_ids = set()
    while len(new_ids) < needed:
        rid = generate_respondent_id()
        if rid not in existing_ids and rid not in new_ids:
            new_ids.add(rid)
    
    all_ids = list(existing_ids) + list(new_ids)
    return {"respondents": all_ids, "submitted": len(existing_ids), "remaining": 30 - len(existing_ids)}


@app.get("/api/events/{event_id}/feedbacks", response_model=List[FeedbackResponse])
def get_feedbacks(event_id: int, db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).filter(Feedback.event_id == event_id).all()
    return [
        FeedbackResponse(id=f.id, respondent_id=f.respondent_id, text=f.text, rating=f.rating)
        for f in feedbacks
    ]


@app.post("/api/events/{event_id}/feedbacks")
def submit_feedback(event_id: int, respondent_id: str, feedback: FeedbackCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    existing = db.query(Feedback).filter(
        Feedback.event_id == event_id, 
        Feedback.respondent_id == respondent_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this respondent")
    
    db_feedback = Feedback(
        event_id=event_id,
        respondent_id=respondent_id,
        text=feedback.text,
        rating=feedback.rating
    )
    db.add(db_feedback)
    db.commit()
    
    count = db.query(Feedback).filter(Feedback.event_id == event_id).count()
    return {"message": "Feedback submitted", "total_feedbacks": count, "remaining": max(0, 30 - count)}


@app.post("/api/events/{event_id}/compute-score", response_model=ScoreResponse)
def compute_score(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    feedbacks = db.query(Feedback).filter(Feedback.event_id == event_id).all()
    if len(feedbacks) < 30:
        raise HTTPException(status_code=400, detail=f"Need 30 feedbacks, only have {len(feedbacks)}")
    
    model_state = db.query(ModelState).first()
    model_weights = model_state.weights if model_state and model_state.trained_on_n >= 5 else None
    
    feedback_dicts = [{"text": f.text, "rating": f.rating} for f in feedbacks]
    feedback_score, features, feedback_explanation = compute_feedback_score(feedback_dicts, model_weights)
    
    past_events = db.query(Event).filter(Event.id != event_id).all()
    past_data = [{"revenue": e.revenue, "attendance": e.attendance} for e in past_events]
    revenue_score, revenue_explanation = compute_revenue_score(event.revenue, event.attendance, past_data)
    
    value_score = compute_value_score(feedback_score, revenue_score)
    
    explanation = {
        "feedback": feedback_explanation,
        "revenue": revenue_explanation,
        "weights": {"feedback": 0.50, "revenue": 0.50}
    }
    
    existing_score = db.query(Score).filter(Score.event_id == event_id).first()
    if existing_score:
        existing_score.revenue_score = revenue_score
        existing_score.feedback_score = feedback_score
        existing_score.value_score = value_score
        existing_score.explanation = explanation
        existing_score.feature_vector = features
    else:
        db_score = Score(
            event_id=event_id,
            revenue_score=revenue_score,
            feedback_score=feedback_score,
            value_score=value_score,
            explanation=explanation,
            feature_vector=features
        )
        db.add(db_score)
    
    db.commit()
    
    return ScoreResponse(
        event_id=event_id,
        event_name=event.name,
        revenue_score=round(revenue_score, 1),
        feedback_score=round(feedback_score, 1),
        value_score=round(value_score, 1),
        explanation=explanation
    )


@app.get("/api/events/{event_id}/score", response_model=ScoreResponse)
def get_score(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    score = db.query(Score).filter(Score.event_id == event_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Score not computed yet")
    
    return ScoreResponse(
        event_id=event_id,
        event_name=event.name,
        revenue_score=round(score.revenue_score, 1),
        feedback_score=round(score.feedback_score, 1),
        value_score=round(score.value_score, 1),
        explanation=score.explanation
    )


@app.post("/api/events/{event_id}/calibrate")
def submit_calibration(event_id: int, label: TrainingLabelCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    score = db.query(Score).filter(Score.event_id == event_id).first()
    if not score:
        raise HTTPException(status_code=400, detail="Compute score first before calibrating")
    
    existing = db.query(TrainingLabel).filter(TrainingLabel.event_id == event_id).first()
    if existing:
        existing.admin_label = label.admin_label
    else:
        db_label = TrainingLabel(event_id=event_id, admin_label=label.admin_label)
        db.add(db_label)
    
    db.commit()
    
    labeled_events = db.query(TrainingLabel).join(Score, TrainingLabel.event_id == Score.event_id).all()
    
    if len(labeled_events) >= 5:
        training_data = []
        for tl in labeled_events:
            score = db.query(Score).filter(Score.event_id == tl.event_id).first()
            if score and score.feature_vector:
                training_data.append({
                    "features": score.feature_vector,
                    "label": tl.admin_label
                })
        
        if len(training_data) >= 5:
            weights = train_model(training_data)
            if weights:
                model_state = db.query(ModelState).first()
                if model_state:
                    model_state.weights = weights
                    model_state.trained_on_n = len(training_data)
                    model_state.version += 1
                else:
                    db.add(ModelState(weights=weights, trained_on_n=len(training_data)))
                db.commit()
                return {"message": "Calibration saved and model retrained", "trained_on": len(training_data)}
    
    return {"message": "Calibration saved", "total_labels": len(labeled_events), "need_for_training": max(0, 5 - len(labeled_events))}


@app.get("/api/history", response_model=List[HistoryItem])
def get_history(db: Session = Depends(get_db)):
    events_with_scores = db.query(Event).join(Score).order_by(Event.created_at.desc()).all()
    return [
        HistoryItem(
            id=e.id,
            name=e.name,
            attendance=e.attendance,
            revenue=e.revenue,
            revenue_score=round(e.score.revenue_score, 1),
            feedback_score=round(e.score.feedback_score, 1),
            value_score=round(e.score.value_score, 1),
            created_at=e.created_at.isoformat() if e.created_at else ""
        )
        for e in events_with_scores
    ]


@app.get("/api/model-status")
def get_model_status(db: Session = Depends(get_db)):
    model_state = db.query(ModelState).first()
    label_count = db.query(TrainingLabel).count()
    
    if not model_state:
        return {
            "status": "rubric",
            "trained_on": 0,
            "total_labels": label_count,
            "needs_more": max(0, 5 - label_count)
        }
    
    return {
        "status": "learned" if model_state.trained_on_n >= 5 else "rubric",
        "version": model_state.version,
        "trained_on": model_state.trained_on_n,
        "total_labels": label_count,
        "needs_more": max(0, 5 - label_count)
    }


@app.post("/api/seed-demo")
def seed_demo(db: Session = Depends(get_db)):
    existing = db.query(Event).filter(Event.name == "PSA Welcome Week 2024").first()
    if existing:
        return {"message": "Demo already exists", "event_id": existing.id}
    
    event = Event(name="PSA Welcome Week 2024", attendance=150, revenue=2250.0)
    db.add(event)
    db.commit()
    db.refresh(event)
    
    sample_feedbacks = [
        ("The event was amazing! Loved the cultural performances and the food was delicious.", 5),
        ("Great organization but the venue was a bit crowded. Still had fun!", 4),
        ("Wonderful atmosphere and welcoming community. Felt right at home.", 5),
        ("Good event overall. The program content was interesting and informative.", 4),
        ("The timing was perfect and everything ran smoothly. Impressed!", 5),
        ("Loved meeting new people. The networking opportunities were fantastic.", 5),
        ("Food options were great and the venue was accessible. Well done!", 4),
        ("The speakers were engaging and the activities were fun. Would attend again.", 5),
        ("Slightly rushed schedule but otherwise a memorable experience.", 4),
        ("Fantastic energy and inclusive vibes. PSA really knows how to throw an event!", 5),
        ("The registration was smooth and organized. Great first impression.", 4),
        ("Enjoyed the cultural showcase. Very informative about Pakistani traditions.", 5),
        ("Parking was a bit difficult but the event itself was worth it.", 4),
        ("Amazing community spirit. Everyone was so friendly and welcoming.", 5),
        ("The snacks were tasty and there were good halal options available.", 4),
        ("Duration was just right. Not too long, not too short.", 4),
        ("Loved the decorations and attention to detail. Very festive!", 5),
        ("Could use more seating but the standing areas had great views.", 4),
        ("The MC was entertaining and kept the energy high throughout.", 5),
        ("Well-coordinated event. You could tell a lot of planning went into it.", 5),
        ("Good variety of activities for different interests.", 4),
        ("The venue location was convenient and easy to find.", 4),
        ("Felt very included as a first-time attendee. Made new friends!", 5),
        ("Professional yet fun atmosphere. Perfect balance.", 5),
        ("The event started on time which I really appreciated.", 4),
        ("Great content about Pakistani culture and UWaterloo community.", 5),
        ("Would definitely recommend to other students.", 5),
        ("The organizers were helpful and answered all my questions.", 4),
        ("Memorable experience overall. Looking forward to future events!", 5),
        ("One of the best campus events I've attended. Well done PSA!", 5),
    ]
    
    for i, (text, rating) in enumerate(sample_feedbacks):
        fb = Feedback(
            event_id=event.id,
            respondent_id=f"R-DEMO{str(i+1).zfill(2)}",
            text=text,
            rating=rating
        )
        db.add(fb)
    
    db.commit()
    
    return {"message": "Demo event created with 30 feedbacks", "event_id": event.id}
