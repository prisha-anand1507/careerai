"""Adapter for the Colab-trained bundle `resume_analyzer_v2_bundle.pkl`.

The bundle is produced by the training notebook (Resume_Analyzer_.ipynb, Step 10) and holds:
  classifier, regressor, tfidf, label_encoder, master_skills, career_profiles.
Functions (preprocessing, skill extraction, pair scoring) are NOT stored in the pickle, so they are
re-implemented here to match the notebook. Keep them in sync if you retrain with different preprocessing.

SECURITY: pickle can execute code on load. Only load a bundle you trained yourself or fully trust.
"""
import logging
import os
import pickle
import re
import threading
from pathlib import Path
from typing import Optional

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

log = logging.getLogger("careerai.trained")

DEFAULT_PATH = Path(__file__).resolve().parent.parent / "models" / "resume_analyzer_v2_bundle.pkl"
REQUIRED_KEYS = ("classifier", "regressor", "tfidf", "label_encoder", "master_skills", "career_profiles")

# Held-out results printed by the training notebook run. Update if you retrain.
REPORTED_METRICS = {
    "classifier_accuracy": 0.7568,   # Random Forest, 23 domains, 20% test split
    "regressor_r2": 0.6359,          # Random Forest Regressor on ai_match_score
    "regressor_mae": 11.46,          # percentage points
    "training_rows": 2385,
    "domains": 23,
}

COVERAGE_NOTE = (
    "Benchmark roles come from the 23 domains in the training dataset (for example HR, Banking, IT, Engineering). "
    "Data-science and ML roles are not among them, so for technical careers rely on the 8-role matching instead."
)

_nlp = None


def _get_nlp():
    """Stopwords + WordNet lemmatizer, exactly as in the notebook (downloads NLTK data on first use)."""
    global _nlp
    if _nlp is None:
        import nltk
        from nltk.corpus import stopwords
        from nltk.stem import WordNetLemmatizer

        lem = WordNetLemmatizer()
        try:
            stop = set(stopwords.words("english"))
            lem.lemmatize("tests")
        except LookupError:
            for pkg in ("stopwords", "wordnet", "omw-1.4"):
                nltk.download(pkg, quiet=True)
            stop = set(stopwords.words("english"))
            lem.lemmatize("tests")
        _nlp = (stop, lem)
    return _nlp


def preprocess_text(text: str) -> str:
    stop, lem = _get_nlp()
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+|https\S+", " ", text)
    text = re.sub(r"\S+@\S+", " ", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return " ".join(lem.lemmatize(w) for w in text.split() if w not in stop and len(w) > 2)


_SIMPLE = re.compile(r"[a-z0-9][a-z0-9 '\-]*$")


class TrainedModel:
    def __init__(self, path: Optional[str] = None):
        self.path = Path(path or os.getenv("CAREERAI_MODEL_PATH") or DEFAULT_PATH)
        self.available = False
        self.reason: Optional[str] = None
        self._loaded = False
        self._lock = threading.Lock()

    # ---- loading -------------------------------------------------------------------------
    def load(self) -> "TrainedModel":
        with self._lock:
            if self._loaded:
                return self
            self._loaded = True
            if not self.path.exists():
                self.reason = f"Model bundle not found at {self.path}"
                log.warning(self.reason)
                return self
            try:
                with open(self.path, "rb") as f:
                    bundle = pickle.load(f)  # noqa: S301 - trusted, operator-supplied file
                missing = [k for k in REQUIRED_KEYS if k not in bundle]
                if missing:
                    self.reason = f"Bundle is missing keys: {', '.join(missing)}"
                    return self
                self.b = bundle
                self._build_skill_index()
                self.available = True
                log.info("Trained model loaded from %s", self.path)
            except Exception as exc:  # version mismatch, corrupt file, missing deps...
                self.reason = f"Could not load model bundle: {type(exc).__name__}: {exc}"
                log.exception(self.reason)
            return self

    def _build_skill_index(self):
        """Fast equivalent of the notebook's per-skill regex scan (19k skills): n-gram set lookup,
        with a regex fallback only for skills containing punctuation such as c++ or a/b testing."""
        self._index, self._special, max_n = {}, [], 1
        for skill in self.b["master_skills"]:
            low = str(skill).lower()
            if _SIMPLE.match(low):
                toks = re.findall(r"[a-z0-9]+", low)
                if not toks:
                    continue
                self._index.setdefault(" ".join(toks), []).append(low)
                max_n = max(max_n, len(toks))
            else:
                # \b fails after symbols such as '+' (c++, c#); use lookarounds instead.
                self._special.append((low, re.compile(r"(?<![a-z0-9])" + re.escape(low) + r"(?![a-z0-9])")))
        self._max_n = min(max_n, 8)

    # ---- inference -----------------------------------------------------------------------
    def extract_skills(self, text: str) -> set:
        low = str(text).lower()
        toks = re.findall(r"[a-z0-9]+", low)
        grams = set()
        for n in range(1, self._max_n + 1):
            for i in range(len(toks) - n + 1):
                grams.add(" ".join(toks[i:i + n]))
        found = set()
        for g in grams:
            hits = self._index.get(g)
            if hits:
                found.update(hits)
        for skill, rx in self._special:
            if rx.search(low):
                found.add(skill)
        return found

    def _pair_score(self, res_vec, res_skills: set, job_vec, job_skills: set) -> float:
        cos_sim = cosine_similarity(res_vec, job_vec)[0][0]
        ratio = len(res_skills & job_skills) / len(job_skills) if job_skills else 0.0
        breadth = min(len(res_skills) / 40.0, 1.0)
        pred = float(np.clip(self.b["regressor"].predict(np.array([[ratio, cos_sim, breadth]]))[0], 0.0, 100.0))
        return round(pred, 1)

    def analyze(self, text: str, job_description: Optional[str] = None, top_n: int = 8) -> dict:
        if not self.available:
            return {"available": False, "reason": self.reason}
        b = self.b
        res_vec = b["tfidf"].transform([preprocess_text(text)])
        res_skills = self.extract_skills(text)
        words = len(str(text).split())

        clf = b["classifier"]
        proba = clf.predict_proba(res_vec)[0]
        names = b["label_encoder"].inverse_transform(clf.classes_)
        order = np.argsort(proba)[::-1][:3]
        domains = [{"domain": str(names[i]), "probability": round(float(proba[i]), 3)} for i in order]

        matches = []
        for prof in b["career_profiles"]:
            req = set(prof["required_skills"])
            matches.append({
                "category": prof["category"],
                "role_title": prof["role_title"],
                "match_score": self._pair_score(res_vec, res_skills, prof["job_vector"], req),
                "matched_skills": sorted(s.title() for s in res_skills & req),
                "missing_skills": sorted(s.title() for s in req - res_skills),
            })
        matches.sort(key=lambda m: -m["match_score"])

        warnings = []
        if words < 100:
            warnings.append("Resume text is very short; trained-model scores are unreliable.")
        if matches and matches[0]["match_score"] < 40:
            warnings.append("No benchmark role matched strongly (best is below 40%).")

        result = {
            "available": True,
            "predicted_domain": domains[0],
            "domain_candidates": domains,
            "benchmark_matches": matches[:top_n],
            "skills_extracted_count": len(res_skills),
            "warnings": warnings,
            "coverage_note": COVERAGE_NOTE,
            "model_info": {
                "classifier": type(clf).__name__,
                "regressor": type(b["regressor"]).__name__,
                "reported_metrics": REPORTED_METRICS,
                "metrics_source": "Printed by the training notebook on a held-out 20% split.",
                "labels_note": "Match scores are trained to imitate the dataset's ai_match_score labels, which are themselves AI-generated, not real hiring outcomes.",
            },
        }
        if job_description and job_description.strip():
            jd_vec = b["tfidf"].transform([preprocess_text(job_description)])
            jd_skills = self.extract_skills(job_description)
            result["jd_match"] = {
                "score": self._pair_score(res_vec, res_skills, jd_vec, jd_skills),
                "matched_skills": sorted(s.title() for s in res_skills & jd_skills),
                "missing_skills": sorted(s.title() for s in jd_skills - res_skills),
            }
        return result


_instance: Optional[TrainedModel] = None


def get_model() -> TrainedModel:
    global _instance
    if _instance is None:
        _instance = TrainedModel().load()
    return _instance
