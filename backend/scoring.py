from textblob import TextBlob
from typing import List, Dict, Tuple, Optional
import numpy as np
from sklearn.linear_model import Ridge
import json

CATEGORIES = ["logistics", "food", "program", "venue", "timing", "community", "vibe"]

CATEGORY_KEYWORDS = {
    "logistics": ["organized", "registration", "smooth", "chaotic", "confusing", "late", "on time", "schedule", "planning", "coordination"],
    "food": ["food", "snacks", "catering", "hungry", "delicious", "tasty", "refreshments", "drinks", "halal", "options"],
    "program": ["content", "speakers", "presentation", "boring", "interesting", "engaging", "informative", "learned", "activities", "workshop"],
    "venue": ["venue", "location", "space", "crowded", "comfortable", "seating", "room", "hall", "parking", "accessible"],
    "timing": ["time", "duration", "long", "short", "rushed", "dragged", "punctual", "started", "ended", "hours"],
    "community": ["welcoming", "inclusive", "friendly", "diverse", "belonging", "connected", "people", "networking", "social", "community"],
    "vibe": ["atmosphere", "energy", "fun", "enjoyable", "memorable", "amazing", "great", "loved", "fantastic", "disappointing"]
}

POSITIVE_WORDS = ["great", "amazing", "excellent", "wonderful", "fantastic", "loved", "enjoyed", "perfect", "awesome", "best", "good", "nice", "helpful", "friendly", "welcoming", "organized", "smooth", "delicious", "engaging", "informative", "comfortable", "fun", "memorable", "inclusive"]
NEGATIVE_WORDS = ["bad", "terrible", "awful", "disappointing", "boring", "confusing", "chaotic", "late", "crowded", "rushed", "long", "cold", "hot", "hungry", "uncomfortable", "disorganized", "poor", "worst", "waste", "lacking"]


def extract_features(feedbacks: List[Dict]) -> Dict:
    if not feedbacks:
        return {cat: 0.0 for cat in CATEGORIES + ["sentiment", "avg_rating", "positive_count", "negative_count"]}
    
    all_text = " ".join([f["text"].lower() for f in feedbacks])
    
    features = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in all_text)
        features[cat] = min(count / len(keywords), 1.0)
    
    sentiments = []
    for f in feedbacks:
        blob = TextBlob(f["text"])
        sentiments.append(blob.sentiment.polarity)
    features["sentiment"] = np.mean(sentiments) if sentiments else 0.0
    
    ratings = [f["rating"] for f in feedbacks if f.get("rating") is not None]
    features["avg_rating"] = np.mean(ratings) / 5.0 if ratings else 0.5
    
    positive_count = sum(1 for word in POSITIVE_WORDS if word in all_text)
    negative_count = sum(1 for word in NEGATIVE_WORDS if word in all_text)
    features["positive_count"] = min(positive_count / 10.0, 1.0)
    features["negative_count"] = min(negative_count / 10.0, 1.0)
    
    return features


def extract_themes(feedbacks: List[Dict]) -> Tuple[List[str], List[str]]:
    positive_themes = []
    negative_themes = []
    
    all_text = " ".join([f["text"].lower() for f in feedbacks])
    
    for cat, keywords in CATEGORY_KEYWORDS.items():
        mentioned_keywords = [kw for kw in keywords if kw in all_text]
        if mentioned_keywords:
            positive_in_cat = [kw for kw in mentioned_keywords if kw in POSITIVE_WORDS or any(pw in kw for pw in POSITIVE_WORDS)]
            negative_in_cat = [kw for kw in mentioned_keywords if kw in NEGATIVE_WORDS or any(nw in kw for nw in NEGATIVE_WORDS)]
            
            if positive_in_cat:
                positive_themes.append(f"{cat.title()}: {', '.join(positive_in_cat[:2])}")
            if negative_in_cat:
                negative_themes.append(f"{cat.title()}: {', '.join(negative_in_cat[:2])}")
    
    for f in feedbacks:
        blob = TextBlob(f["text"])
        if blob.sentiment.polarity > 0.3:
            for word in POSITIVE_WORDS:
                if word in f["text"].lower() and f"{word}" not in str(positive_themes):
                    positive_themes.append(word.title())
                    break
        elif blob.sentiment.polarity < -0.3:
            for word in NEGATIVE_WORDS:
                if word in f["text"].lower() and f"{word}" not in str(negative_themes):
                    negative_themes.append(word.title())
                    break
    
    return positive_themes[:5], negative_themes[:5]


def rubric_feedback_score(features: Dict) -> float:
    base_score = 50.0
    
    sentiment_contribution = features.get("sentiment", 0) * 20
    base_score += sentiment_contribution
    
    rating_contribution = (features.get("avg_rating", 0.5) - 0.5) * 30
    base_score += rating_contribution
    
    positive_boost = features.get("positive_count", 0) * 10
    negative_penalty = features.get("negative_count", 0) * 15
    base_score += positive_boost - negative_penalty
    
    category_scores = [features.get(cat, 0) for cat in CATEGORIES]
    category_avg = np.mean(category_scores) if category_scores else 0
    base_score += category_avg * 10
    
    return max(0, min(100, base_score))


def compute_feedback_score(feedbacks: List[Dict], model_weights: Optional[Dict] = None) -> Tuple[float, Dict, Dict]:
    features = extract_features(feedbacks)
    positive_themes, negative_themes = extract_themes(feedbacks)
    
    if model_weights and len(model_weights.get("coefficients", [])) > 0:
        feature_vector = [features.get(key, 0) for key in model_weights["feature_order"]]
        score = model_weights["intercept"]
        for i, coef in enumerate(model_weights["coefficients"]):
            score += coef * feature_vector[i]
        score = max(0, min(100, score))
        method = "learned"
    else:
        score = rubric_feedback_score(features)
        method = "rubric"
    
    explanation = {
        "method": method,
        "positive_themes": positive_themes,
        "negative_themes": negative_themes,
        "category_breakdown": {cat: round(features.get(cat, 0) * 100, 1) for cat in CATEGORIES},
        "sentiment_avg": round(features.get("sentiment", 0), 3),
        "rating_avg": round(features.get("avg_rating", 0.5) * 5, 1) if features.get("avg_rating") else None
    }
    
    return score, features, explanation


def compute_revenue_score(revenue: float, attendance: int, past_events: List[Dict]) -> Tuple[float, Dict]:
    if attendance <= 0:
        return 0, {"error": "Invalid attendance"}
    
    revenue_per_attendee = revenue / attendance
    
    past_rpa = [e["revenue"] / e["attendance"] for e in past_events if e["attendance"] > 0]
    
    if len(past_rpa) >= 3:
        min_rpa = min(past_rpa)
        max_rpa = max(past_rpa)
    else:
        min_rpa = 5.0
        max_rpa = 50.0
    
    if max_rpa == min_rpa:
        score = 50.0
    else:
        normalized = (revenue_per_attendee - min_rpa) / (max_rpa - min_rpa)
        score = normalized * 100
    
    score = max(0, min(100, score))
    
    explanation = {
        "revenue_per_attendee": round(revenue_per_attendee, 2),
        "min_benchmark": round(min_rpa, 2),
        "max_benchmark": round(max_rpa, 2),
        "normalization": "rolling" if len(past_rpa) >= 3 else "default"
    }
    
    return score, explanation


def compute_value_score(feedback_score: float, revenue_score: float) -> float:
    return 0.50 * feedback_score + 0.50 * revenue_score


def train_model(training_data: List[Dict]) -> Optional[Dict]:
    if len(training_data) < 5:
        return None
    
    feature_order = CATEGORIES + ["sentiment", "avg_rating", "positive_count", "negative_count"]
    
    X = []
    y = []
    
    for item in training_data:
        features = item["features"]
        feature_vector = [features.get(key, 0) for key in feature_order]
        X.append(feature_vector)
        y.append(item["label"])
    
    X = np.array(X)
    y = np.array(y)
    
    model = Ridge(alpha=1.0)
    model.fit(X, y)
    
    return {
        "feature_order": feature_order,
        "coefficients": model.coef_.tolist(),
        "intercept": float(model.intercept_)
    }
