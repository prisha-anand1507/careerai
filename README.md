# CareerAI – Your AI Career Companion

Resume analysis, ATS scoring, skill-gap detection, and explainable career recommendations.

```
careerai/
├── frontend/     React 18 + Vite + Tailwind + React Router + Recharts + Lucide + Axios
├── backend/      Node.js + Express + MongoDB (Mongoose), JWT auth, multer uploads
└── ml-service/   Python FastAPI: PDF/DOCX extraction, NLP skill extraction, scoring, TF-IDF career matching
```

Flow: browser → Express (`/api`) → FastAPI (`/analyze`) → results stored in MongoDB and rendered in the UI.

## Run locally

Requirements: Node 18+, Python 3.10+, MongoDB running locally (or an Atlas URI).

```bash
# 1. ML service (port 8000)
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# 2. Backend (port 5000)
cd backend
cp .env.example .env        # set JWT_SECRET and MONGO_URI
npm install
npm run dev

# 3. Frontend (port 5173)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend.

Password reset: there is no email provider wired up. In development the reset link is printed in the backend console. Add SES/SendGrid/Resend in `backend/src/routes/auth.js` before launch.

## How the "AI" works (and what it is not)

- **Extraction**: `pypdf` for PDF, `python-docx` for DOCX. Image-only/scanned PDFs are rejected with a clear message (no OCR).
- **Skill & section detection**: curated taxonomy (`ml-service/app/knowledge.py`) with word-boundary matching, section-header parsing, regexes for degrees, CGPA, date ranges, metrics, and action verbs.
- **Scores**: ATS score = 10 weighted rule checks. Overall score = weighted blend of ATS, skills, education, experience quality, projects, certifications, summary.
- **Career matching**: roles are skill documents; candidate skills are projected into the same TF-IDF space (scikit-learn) and compared by cosine similarity, blended 60/40 with weighted skill coverage plus small bonuses. Each result lists the evidence behind it.
- **Not included**: no labelled hiring dataset or trained classifier ships with this repo. The matcher is an unsupervised similarity model over a hand-curated taxonomy. To add a supervised model, train on your own labelled resumes and blend it in `recommender.py`.
- **Rewrite suggestions** are rule-based templates built from your own weak bullets; you must fill in real numbers.
- "In-demand skills" is a curated list in `knowledge.py`, not live job-market data.

## Using your Colab-trained model

The notebook `Resume_Analyzer_.ipynb` (dataset: `job_resume_fit.csv.xls`, 2,385 resumes, 23 domains) saves everything in `resume_analyzer_v2_bundle.pkl`.

1. In Colab, run the last cell and download `resume_analyzer_v2_bundle.pkl` (Files panel → right-click → Download).
2. Put it in `ml-service/models/` (or set `CAREERAI_MODEL_PATH`).
3. Make `scikit-learn` in `ml-service/requirements.txt` match Colab (`import sklearn; print(sklearn.__version__)`). Pickles often fail across versions.
4. Check it: `cd ml-service && python -m scripts.check_bundle`. For the notebook's sample resume you should see IT Infrastructure Manager near 84%.
5. Restart the ML service. The Careers page then shows a **Trained model** tab: predicted domain, benchmark role matches, and a match score for any job description pasted on the Analyze page.

If the file is missing or fails to load, the app keeps working with the built-in role matching and shows how to enable the model.

Things to know about this model:
- Its 23 benchmark roles come from the dataset (HR, Banking, Chef, Engineering…). There is no data-science or ML role, so for technical resumes (the notebook's own test on a data-scientist resume returned IT Infrastructure Manager at 41.6%) the 8-role matching is more useful.
- The match score imitates the dataset's `ai_match_score`, which is itself AI-generated, not real hiring outcomes (regressor R² 0.64, mean error about 11 points on held-out data).
- Its skill vocabulary has about 19,000 entries including generic words ("management", "engineer", "it"), so its skill lists are noisy. The built-in analyzer uses a cleaner curated taxonomy for the report.
- `pickle` can run code when loaded. Only load a bundle you created.

## Demo / placeholder content

- The landing-page dashboard preview uses clearly labelled sample data.
- The landing statistics describe the product's built-in taxonomy (roles, skills, checks), not user counts.
- Testimonials are labelled placeholders. Contact email, Privacy Policy, and Terms are templates to be replaced.

## API summary (backend)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password` | Auth |
| GET | `/api/auth/me` | Current user |
| GET/PUT | `/api/profile` | Profile |
| POST | `/api/analyses` (multipart `resume`, optional `label`) | Upload + analyze |
| GET | `/api/analyses`, `/latest`, `/compare?a=&b=`, `/:id`, `/:id/text` | History and reports |
| DELETE | `/api/analyses/:id` | Delete |
