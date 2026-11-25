"""Career recommendation engine.

Technique: each role is a "document" of its required skills (core skills repeated
for extra weight). A TF-IDF vectorizer is fitted over the role corpus and the
candidate's detected skills are projected into the same space; cosine similarity
gives a semantic-overlap score. That is blended with an explicit weighted
skill-coverage score and a small preference boost. Every recommendation returns
the evidence behind it so results are explainable.

Note: this is an unsupervised similarity model over a curated role taxonomy.
No labelled hiring data is bundled; plug in your own dataset in `train_hook` to
replace/augment it with a supervised classifier.
"""
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .knowledge import CAREERS

CORE_W, NICE_W = 2.0, 1.0


def _tok(skills):
    return [s.lower().replace(" ", "_").replace("/", "_").replace("&", "and").replace(".", "") for s in skills]


def _role_doc(role: dict) -> str:
    return " ".join(_tok(role["core"]) * 2 + _tok(role["nice"]))


_ROLES = list(CAREERS.keys())
_VEC = TfidfVectorizer(token_pattern=r"[^ ]+", lowercase=True)
_ROLE_MATRIX = _VEC.fit_transform([_role_doc(CAREERS[r]) for r in _ROLES])


def recommend(analysis: dict, interests: Optional[list] = None, preferred_roles: Optional[list] = None, top_n: int = 8) -> list:
    user_skills = {s["name"] for s in analysis["technical_skills"]}
    interests_l = [i.lower() for i in (interests or [])]
    preferred = {p.lower() for p in (preferred_roles or [])}

    user_vec = _VEC.transform([" ".join(_tok(sorted(user_skills)))])
    cos = cosine_similarity(user_vec, _ROLE_MATRIX)[0] if user_skills else np.zeros(len(_ROLES))

    edu = analysis["education"]
    exp = analysis["experience"]
    proj = analysis["projects"]
    results = []
    for i, name in enumerate(_ROLES):
        role = CAREERS[name]
        core, nice = role["core"], role["nice"]
        have_core = [s for s in core if s in user_skills]
        have_nice = [s for s in nice if s in user_skills]
        miss_core = [s for s in core if s not in user_skills]
        miss_nice = [s for s in nice if s not in user_skills]
        total_w = CORE_W * len(core) + NICE_W * len(nice)
        coverage = (CORE_W * len(have_core) + NICE_W * len(have_nice)) / total_w
        project_support = len([t for t in proj["technologies"] if t in core + nice])
        bonus = min(project_support, 4) * 0.01
        bonus += 0.02 if exp["present"] and exp["approx_years"] >= 1 else 0
        pref_boost = 0.0
        if name.lower() in preferred:
            pref_boost += 0.05
        if any(w in name.lower() or w in role["description"].lower() for i_ in interests_l for w in i_.split() if len(w) > 3):
            pref_boost += 0.03
        raw = 0.6 * coverage + 0.4 * float(cos[i]) + bonus + pref_boost
        match = int(round(min(raw, 0.99) * 100))

        why = []
        if have_core:
            why.append(f"You already have {len(have_core)} of {len(core)} core skills: {', '.join(have_core)}.")
        else:
            why.append("None of this role's core skills were detected in your resume yet.")
        if have_nice:
            why.append(f"Bonus skills present: {', '.join(have_nice)}.")
        if project_support:
            why.append(f"{project_support} of your project technologies are relevant to this role.")
        if exp["present"] and exp["approx_years"] >= 1:
            why.append(f"About {exp['approx_years']} years of experience detected.")
        if edu["highest_level"]:
            why.append(f"Highest education detected: {edu['highest_level']}.")
        if name.lower() in preferred:
            why.append("This is one of your preferred roles (small boost applied).")
        why.append(f"Score = 60% weighted skill coverage ({round(coverage*100)}%) + 40% TF-IDF similarity ({round(float(cos[i])*100)}%) + small bonuses.")

        results.append({
            "role": name,
            "match_percentage": match,
            "description": role["description"],
            "required_skills": core,
            "optional_skills": nice,
            "skills_you_have": have_core + have_nice,
            "missing_skills": miss_core + miss_nice,
            "missing_core_skills": miss_core,
            "learning_path": role["learning_path"],
            "certifications": role["certifications"],
            "why": why,
            "signals": {"coverage": round(coverage, 3), "tfidf_cosine": round(float(cos[i]), 3)},
        })
    results.sort(key=lambda r: -r["match_percentage"])
    return results[:top_n]


def skill_gap(analysis: dict, recs: list, in_demand: list) -> dict:
    have = {s["name"] for s in analysis["technical_skills"]}
    target = recs[0] if recs else None
    missing_core = target["missing_core_skills"] if target else []
    freq: dict[str, int] = {}
    for r in recs[:4]:
        for s in r["missing_skills"]:
            freq[s] = freq.get(s, 0) + 1
    priority = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    prioritized = []
    for s, n in priority[:10]:
        prioritized.append({"skill": s, "needed_by_top_roles": n,
                            "in_demand": s in in_demand,
                            "core_for_best_match": s in missing_core})
    prioritized.sort(key=lambda x: (not x["core_for_best_match"], -x["needed_by_top_roles"], not x["in_demand"]))
    proficiency = [{"skill": s["name"], "mentions": s["mentions"], "in_skills_section": s["in_skills_section"],
                    "evidence_level": "Demonstrated" if s["mentions"] >= 3 else ("Mentioned" if s["mentions"] == 2 else "Listed")}
                   for s in analysis["technical_skills"]][:15]
    return {
        "existing_skills": sorted(have),
        "missing_skills": [p["skill"] for p in prioritized],
        "in_demand_missing": [s for s in in_demand if s not in have],
        "in_demand_have": [s for s in in_demand if s in have],
        "prioritized": prioritized,
        "proficiency": proficiency,
        "target_role": target["role"] if target else None,
        "learning_recommendations": (target["learning_path"] if target else []),
        "proficiency_note": "Evidence level reflects how often a skill appears in your resume, not a tested proficiency.",
    }
