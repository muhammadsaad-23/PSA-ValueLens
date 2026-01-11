# PSA Event Value Analyzer

A tool for UWaterloo's Pakistani Students Association to evaluate events using a balanced "Value Score" that considers both operational success (revenue) and participant experience (feedback).

## What is the Value Score?

The Value Score (0-100) answers: **"Was this event worth it?"**

It balances two perspectives equally:
- **Revenue Score (50%)** - Did the event generate reasonable revenue per attendee?
- **Feedback Score (50%)** - Did participants have a good experience?

We weight these equally because a profitable event that people hated is a failure, and a beloved event that loses money is unsustainable.

## How Revenue Scoring Works

Revenue alone isn't a fair metric because a large event naturally generates more money. So we normalize:

1. Calculate **revenue per attendee** = total revenue / attendance
2. Compare against past events to get a percentile
3. If fewer than 3 past events exist, use sensible defaults ($5-$50 per attendee)

This means a small event with $15/person scores the same as a large event with $15/person.

## How Feedback Scoring Works

We collect exactly 30 anonymous feedback responses per event. Each includes:
- Required: text feedback (at least 10 characters)
- Optional: 1-5 star rating

### Initial Rubric-Based Scoring

Until we have enough data, feedback is scored using a transparent rubric:

1. **Sentiment Analysis** - Is the text positive or negative?
2. **Keyword Detection** - Look for terms related to:
   - Logistics (organized, smooth, chaotic)
   - Food (delicious, options, hungry)
   - Program (engaging, boring, informative)
   - Venue (crowded, comfortable, accessible)
   - Timing (punctual, rushed, too long)
   - Community (welcoming, inclusive, friendly)
   - Vibe (fun, memorable, disappointing)
3. **Optional Ratings** - Average of provided star ratings

### Self-Learning (After 5+ Labeled Events)

Here's where it gets interesting. After computing a score, an admin can submit what they THINK the true satisfaction was (0-100).

Once we have 5+ of these "ground truth" labels:
1. We extract feature vectors from each event's feedback
2. Train a simple Ridge Regression model
3. Learn which features actually predict admin satisfaction
4. Use learned weights for future scoring

**This is NOT deep learning or "AI magic"** - it's basic linear regression. The model learns things like "when people mention 'crowded', satisfaction drops by X points."

### Explainability

Every score includes:
- Top positive themes detected
- Top negative themes detected
- Category-by-category breakdown
- Whether rubric or learned weights were used

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLite with SQLAlchemy
- TextBlob for sentiment analysis
- scikit-learn for regression

**Frontend:**
- React 18 with TypeScript
- Vite
- Tailwind CSS
- Recharts for visualization
- Framer Motion for animations

## Project Structure

```
psa-event-analyzer/
├── backend/
│   ├── main.py          # FastAPI app and endpoints
│   ├── models.py        # Database models
│   ├── database.py      # SQLite setup
│   ├── scoring.py       # All scoring logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # Dashboard, Feedback, Results, History, Admin
│   │   ├── components/  # Reusable UI components
│   │   └── App.tsx      # Router setup
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Running Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3002

## Demo Mode

Click "Load Demo" on the dashboard to create a sample event with 30 pre-filled feedbacks. This lets you see the full flow without manual data entry.

## Data Models

- **Event**: name, attendance, revenue, created_at
- **Feedback**: event_id, respondent_id, text, rating (optional)
- **Score**: computed scores and explanation JSON
- **TrainingLabel**: admin-provided ground truth
- **ModelState**: learned regression weights

## API Endpoints

- `POST /api/events` - Create event
- `GET /api/events/{id}/respondents` - Get 30 anonymous respondent IDs
- `POST /api/events/{id}/feedbacks` - Submit feedback
- `POST /api/events/{id}/compute-score` - Calculate scores
- `POST /api/events/{id}/calibrate` - Submit admin label
- `GET /api/history` - All scored events
- `GET /api/model-status` - Learning status
- `POST /api/seed-demo` - Create demo data

## Design Notes

The UI uses colors inspired by the Pakistani flag:
- Deep green (#006233) as primary
- White backgrounds
- Gold (#D4AF37) accents

The crescent and star motif appears in the favicon and logo area.
