"""Resume analysis: section parsing, skill extraction, scoring, suggestions.

All logic is deterministic NLP/rules over the extracted text. Nothing here
claims to be a trained model; trained/statistical components live in recommender.py.
"""
import re
from collections import OrderedDict

from .knowledge import (ACTION_VERBS, DEGREE_PATTERNS, IN_DEMAND, SECTION_HEADERS,
                        SOFT_SKILLS, TECH_SKILLS)

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{8,}\d)")
METRIC_RE = re.compile(r"(\d+(\.\d+)?\s?%|\$\s?\d[\d,.]*|₹\s?\d[\d,.]*|\b\d+\+?\s?(users|customers|clients|records|requests|ms|hours|days|models|projects|engineers|people|members|rows|datasets)\b|\b\d{2,}\b)", re.I)
YEAR_RANGE_RE = re.compile(r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(20\d{2}|19\d{2})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(20\d{2}|present|current|now)", re.I)
CGPA_RE = re.compile(r"(cgpa|gpa)\s*[:\-]?\s*(\d(?:\.\d{1,2})?)\s*(?:/\s*(\d+(?:\.\d+)?))?", re.I)
BULLET_RE = re.compile(r"^\s*[•\-\*▪●◦·]\s*")


def _word_pattern(alias: str) -> re.Pattern:
    escaped = re.escape(alias)
    return re.compile(rf"(?<![\w+#]){escaped}(?![\w+#])", re.I)


def split_sections(text: str) -> "OrderedDict[str, str]":
    sections: "OrderedDict[str, list[str]]" = OrderedDict()
    current = "header"
    sections[current] = []
    for line in text.split("\n"):
        stripped = line.strip().strip(":").strip()
        low = stripped.lower()
        matched = None
        if 0 < len(stripped) <= 40:
            for key, aliases in SECTION_HEADERS.items():
                if low in aliases:
                    matched = key
                    break
        if matched:
            current = matched
            sections.setdefault(current, [])
        else:
            sections[current].append(line)
    return OrderedDict((k, "\n".join(v).strip()) for k, v in sections.items())


def extract_skills(text: str, sections) -> dict:
    found: dict[str, dict] = {}
    skills_section = sections.get("skills", "")
    for category, skills in TECH_SKILLS.items():
        for name, aliases in skills.items():
            patterns = [name] + aliases
            count = 0
            for alias in patterns:
                count += len(_word_pattern(alias).findall(text))
            # single-letter languages are too ambiguous; accept only in the skills section
            if name in ("C", "R") and not re.search(rf"(?<![\w+#.]){name}(?![\w+#.])", skills_section):
                count = 0
            if count:
                found[name] = {"category": category, "mentions": count,
                               "in_skills_section": bool(_word_pattern(name).search(skills_section)) or
                               any(_word_pattern(a).search(skills_section) for a in aliases)}
    soft = []
    low = text.lower()
    for name, aliases in SOFT_SKILLS.items():
        if any(a in low for a in aliases):
            soft.append(name)
    return {"technical": found, "soft": soft}


def analyze_education(sections, text: str) -> dict:
    edu = sections.get("education", "") or ""
    scope = edu if edu else text
    levels = [lvl for lvl, pat in DEGREE_PATTERNS.items() if re.search(pat, scope, re.I)]
    order = ["phd", "masters", "bachelors", "diploma"]
    highest = next((l for l in order if l in levels), None)
    institutions = [l.strip() for l in scope.split("\n")
                    if re.search(r"university|college|institute|school of|iit|nit\b", l, re.I)][:3]
    cgpa = None
    m = CGPA_RE.search(scope)
    if m:
        value = float(m.group(2))
        scale = float(m.group(3)) if m.group(3) else (4.0 if value <= 4.0 else 10.0)
        cgpa = {"value": value, "scale": scale}
    notes = []
    if not edu:
        notes.append("No dedicated Education section found; add one with degree, institution, and graduation year.")
    if highest is None and edu:
        notes.append("Degree level was not recognised; write the full degree name (e.g. 'B.Tech in Computer Science').")
    if not re.search(r"(19|20)\d{2}", scope):
        notes.append("Add graduation year(s) so ATS and recruiters can place your timeline.")
    if cgpa is None and highest in ("bachelors", "diploma", None):
        notes.append("Consider adding CGPA/percentage if it is strong (above ~7.5/10).")
    return {"present": bool(edu), "highest_level": highest, "institutions": institutions, "cgpa": cgpa, "notes": notes}


def _entry_lines(block: str):
    return [l.strip() for l in block.split("\n") if l.strip()]


def analyze_experience(sections, text: str) -> dict:
    block = sections.get("experience", "") or ""
    lines = _entry_lines(block)
    bullets = [BULLET_RE.sub("", l) for l in lines if BULLET_RE.match(l)]
    if not bullets:
        bullets = [l for l in lines if len(l.split()) >= 6]
    action = [b for b in bullets if b.split() and b.split()[0].lower().strip(",.") in ACTION_VERBS]
    quantified = [b for b in bullets if METRIC_RE.search(b)]
    months = 0
    current_year = 2026
    for m in YEAR_RANGE_RE.finditer(block):
        start = int(m.group(2))
        end_raw = m.group(4).lower()
        end = current_year if end_raw in ("present", "current", "now") else int(end_raw)
        months += max(0, (end - start)) * 12 or 6
    roles = [l for l in lines if YEAR_RANGE_RE.search(l)]
    notes = []
    if not block:
        notes.append("No Experience section found. Add internships, freelance, or volunteer work with dates.")
    else:
        if bullets and len(action) / len(bullets) < 0.6:
            notes.append(f"Only {len(action)} of {len(bullets)} bullets start with a strong action verb (e.g., Built, Reduced, Led).")
        if bullets and len(quantified) / len(bullets) < 0.4:
            notes.append(f"Only {len(quantified)} of {len(bullets)} bullets contain measurable results; add %, counts, time or cost saved.")
    return {"present": bool(block), "roles_detected": len(roles), "approx_years": round(months / 12, 1),
            "bullet_count": len(bullets), "action_verb_bullets": len(action),
            "quantified_bullets": len(quantified), "notes": notes, "_bullets": bullets}


def analyze_projects(sections, skills: dict) -> dict:
    block = sections.get("projects", "") or ""
    lines = _entry_lines(block)
    titles = [l for l in lines if not BULLET_RE.match(l) and len(l.split()) <= 14]
    bullets = [BULLET_RE.sub("", l) for l in lines if BULLET_RE.match(l)]
    tech_mentions = sorted({s for s in skills["technical"] if _word_pattern(s).search(block)})
    quantified = [b for b in bullets if METRIC_RE.search(b)]
    has_links = bool(re.search(r"github\.com|https?://", block, re.I))
    notes = []
    if not block:
        notes.append("No Projects section found. Add 2-3 relevant projects with tech stack and outcomes.")
    else:
        if not has_links:
            notes.append("Add GitHub or live-demo links to your projects.")
        if bullets and len(quantified) == 0:
            notes.append("No project bullet states a measurable result (accuracy, latency, users, dataset size).")
        if len(tech_mentions) < 3:
            notes.append("Name the technologies used in each project explicitly.")
    return {"present": bool(block), "project_count": len(titles), "technologies": tech_mentions,
            "has_links": has_links, "quantified_bullets": len(quantified), "notes": notes}


def analyze_certifications(sections) -> dict:
    block = sections.get("certifications", "") or ""
    items = [BULLET_RE.sub("", l) for l in _entry_lines(block)][:10]
    return {"present": bool(block), "count": len(items), "items": items}


def contact_info(text: str) -> dict:
    head = "\n".join(text.split("\n")[:12])
    return {
        "email": bool(EMAIL_RE.search(head)),
        "phone": bool(PHONE_RE.search(head)),
        "linkedin": bool(re.search(r"linkedin\.com", text, re.I)),
        "github": bool(re.search(r"github\.com", text, re.I)),
    }


def ats_score(text: str, sections, contact: dict, exp: dict, skills: dict, meta: dict) -> tuple[int, list]:
    checks = []

    def add(label, passed, weight, tip):
        checks.append({"label": label, "passed": bool(passed), "weight": weight, "tip": tip})

    add("Email present near the top", contact["email"], 10, "Place your email in the first lines of the document body (not a header/footer).")
    add("Phone number present", contact["phone"], 6, "Add a phone number with country code.")
    add("LinkedIn / GitHub link", contact["linkedin"] or contact["github"], 6, "Add LinkedIn and, for technical roles, GitHub URLs.")
    std = [k for k in ("education", "experience", "skills", "projects") if sections.get(k)]
    add("Standard section headings (4 core)", len(std) >= 4, 18, f"Use standard headings: Education, Experience, Skills, Projects. Found: {', '.join(std) or 'none'}.")
    add("Dedicated Skills section", bool(sections.get("skills")), 12, "Add a plain-text Skills section listing tools and languages.")
    words = len(text.split())
    add("Length 300-900 words", 300 <= words <= 900, 10, f"Resume has {words} words; aim for 1 page (fresher) or 2 pages (experienced).")
    bullets_total = exp["bullet_count"]
    add("Uses bullet points", bullets_total >= 3, 8, "Use short bullet points under each role/project.")
    add("Date ranges present", bool(YEAR_RANGE_RE.search(text)), 8, "Add consistent dates (e.g., 'Jun 2024 – Aug 2024').")
    add("Enough searchable skills (>=8)", len(skills["technical"]) >= 8, 12, "List at least 8 relevant tools/technologies as plain text.")
    add("No heavy tables/columns", meta.get("tables", 0) == 0, 10, "Tables and multi-column layouts can scramble ATS parsing; use a single column.")
    total = sum(c["weight"] for c in checks)
    got = sum(c["weight"] for c in checks if c["passed"])
    return round(100 * got / total), checks


def missing_sections(sections) -> list:
    wanted = {
        "summary": "Professional Summary: a 2-3 line pitch aligned to your target role.",
        "education": "Education: degree, institution, year.",
        "experience": "Experience: internships, jobs, or freelance work.",
        "projects": "Projects: 2-3 with tech stack and outcomes.",
        "skills": "Skills: grouped technical skills.",
        "certifications": "Certifications: relevant courses or credentials.",
    }
    return [{"section": k.title(), "why": v} for k, v in wanted.items() if not sections.get(k)]


def overall_score(ats: int, skills: dict, edu: dict, exp: dict, proj: dict, cert: dict, sections) -> int:
    skill_pts = min(len(skills["technical"]), 15) / 15 * 100
    edu_pts = 100 if edu["present"] and edu["highest_level"] else (60 if edu["present"] else 0)
    exp_quality = 0
    if exp["bullet_count"]:
        exp_quality = 50 * exp["action_verb_bullets"] / exp["bullet_count"] + 50 * exp["quantified_bullets"] / exp["bullet_count"]
    exp_pts = exp_quality if exp["present"] else 0
    proj_pts = 0
    if proj["present"]:
        proj_pts = 40 + (20 if proj["has_links"] else 0) + min(len(proj["technologies"]), 5) * 4
    cert_pts = min(cert["count"], 3) / 3 * 100
    summary_pts = 100 if sections.get("summary") else 0
    score = (0.25 * ats + 0.20 * skill_pts + 0.10 * edu_pts + 0.20 * exp_pts +
             0.15 * proj_pts + 0.05 * cert_pts + 0.05 * summary_pts)
    return round(min(100, score))


def build_suggestions(text, sections, skills, exp, proj, ats_checks) -> dict:
    """Rule-based suggestions. Rewrites are templates with [placeholders]; the user must fill real numbers."""
    suggestions = []
    weak_pairs = []
    for b in exp["_bullets"][:25]:
        first = b.split()[0].lower().strip(",.") if b.split() else ""
        has_metric = bool(METRIC_RE.search(b))
        if first not in ACTION_VERBS or not has_metric:
            core = re.sub(r"^(responsible for|worked on|helped (with|to)|involved in|tasked with)\s+", "", b, flags=re.I)
            core = core[0].lower() + core[1:] if core else core
            if core.split() and core.split()[0].endswith("ing"):
                verb = "Handled"
            else:
                verb = "Built" if re.search(r"\b(app|system|tool|pipeline|model|api|dashboard)\b", b, re.I) else "Delivered"
            after = f"{verb} {core.rstrip('.')}, [improving/reducing X by Y% or serving N users]"
            weak_pairs.append({"before": b, "after": after,
                               "why": "Leads with an action verb and leaves a slot for a measurable result. Replace the bracket with your real figure."})
        if len(weak_pairs) >= 3:
            break

    if not sections.get("summary"):
        top = ", ".join(list(skills["technical"])[:4]) or "[your core skills]"
        suggestions.append({"area": "Resume summary", "priority": "high",
                            "tip": "Add a 2-3 line summary naming your target role, strongest skills, and one proof point.",
                            "example_template": f"[Target role] with hands-on experience in {top}. Built [project/result with metric]. Seeking to [value you add] at [type of company]."})
    if weak_pairs:
        suggestions.append({"area": "Bullet points", "priority": "high",
                            "tip": "Start each bullet with an action verb and end with the outcome.",
                            "examples": weak_pairs})
    if exp["present"] and exp["bullet_count"] and exp["quantified_bullets"] / exp["bullet_count"] < 0.4:
        suggestions.append({"area": "Measurable achievements", "priority": "high",
                            "tip": "Quantify scale, speed, accuracy, cost, or users. Even estimates (clearly approximate) beat vague claims."})
    n_skills = len(skills["technical"])
    unlisted = [s for s, v in skills["technical"].items() if not v["in_skills_section"]]
    if sections.get("skills") and unlisted:
        suggestions.append({"area": "Technical skill presentation", "priority": "medium",
                            "tip": f"These skills appear in the body but not in your Skills section: {', '.join(unlisted[:8])}. List them there too, grouped by category."})
    elif not sections.get("skills"):
        suggestions.append({"area": "Technical skill presentation", "priority": "high",
                            "tip": "Create a Skills section grouped as Languages / Frameworks / Tools / Cloud."})
    missing_demand = [s for s in IN_DEMAND if s not in skills["technical"]][:5]
    if missing_demand:
        suggestions.append({"area": "Keyword optimization", "priority": "medium",
                            "tip": f"Commonly requested skills not found in your resume: {', '.join(missing_demand)}. Add only the ones you genuinely have; otherwise treat them as learning goals."})
    if not proj["present"] or not proj["has_links"]:
        suggestions.append({"area": "Highlight relevant projects", "priority": "medium",
                            "tip": "Put 2-3 projects most relevant to your target role first, each with stack, your contribution, a result, and a GitHub/demo link."})
    failed = [c for c in ats_checks if not c["passed"]]
    if failed:
        suggestions.append({"area": "ATS readability", "priority": "high" if len(failed) >= 4 else "medium",
                            "tip": "Fix these ATS checks: " + "; ".join(c["label"] for c in failed[:5]) + ".",
                            "details": [c["tip"] for c in failed]})
    return {"items": suggestions, "weak_bullet_examples": weak_pairs}


def strengths_and_improvements(skills, edu, exp, proj, cert, contact, ats) -> tuple[list, list]:
    strengths, improve = [], []
    if len(skills["technical"]) >= 10:
        strengths.append(f"Broad technical profile: {len(skills['technical'])} skills detected.")
    if exp["bullet_count"] and exp["action_verb_bullets"] / exp["bullet_count"] >= 0.6:
        strengths.append("Experience bullets mostly start with strong action verbs.")
    if exp["quantified_bullets"] >= 3:
        strengths.append(f"{exp['quantified_bullets']} bullets include measurable results.")
    if proj["present"] and proj["has_links"]:
        strengths.append("Projects include links to verify your work.")
    if cert["count"] >= 2:
        strengths.append(f"{cert['count']} certifications listed.")
    if contact["github"] or contact["linkedin"]:
        strengths.append("Professional profile links included.")
    if ats >= 75:
        strengths.append("Structure is largely ATS-friendly.")
    improve += edu["notes"] + exp["notes"] + proj["notes"]
    if len(skills["technical"]) < 6:
        improve.append("Few technical skills detected; list tools and languages explicitly.")
    if not cert["present"]:
        improve.append("No certifications section; add relevant ones if you have them.")
    if not skills["soft"]:
        improve.append("No soft-skill evidence found; show leadership/teamwork through outcomes in bullets.")
    return strengths or ["Not enough signals yet to identify strengths; see improvements."], improve


def analyze(text: str, meta: dict) -> dict:
    sections = split_sections(text)
    skills = extract_skills(text, sections)
    edu = analyze_education(sections, text)
    exp = analyze_experience(sections, text)
    proj = analyze_projects(sections, skills)
    cert = analyze_certifications(sections)
    contact = contact_info(text)
    ats, ats_checks = ats_score(text, sections, contact, exp, skills, meta)
    overall = overall_score(ats, skills, edu, exp, proj, cert, sections)
    suggestions = build_suggestions(text, sections, skills, exp, proj, ats_checks)
    strengths, improve = strengths_and_improvements(skills, edu, exp, proj, cert, contact, ats)
    exp.pop("_bullets", None)
    return {
        "overall_score": overall,
        "ats_score": ats,
        "ats_checks": ats_checks,
        "score_breakdown": {
            "Skills": round(min(len(skills["technical"]), 15) / 15 * 100),
            "Education": 100 if edu["present"] and edu["highest_level"] else (60 if edu["present"] else 0),
            "Experience": 0 if not exp["bullet_count"] else round(50 * exp["action_verb_bullets"] / exp["bullet_count"] + 50 * exp["quantified_bullets"] / exp["bullet_count"]),
            "Projects": 0 if not proj["present"] else min(100, 40 + (20 if proj["has_links"] else 0) + min(len(proj["technologies"]), 5) * 4),
            "ATS": ats,
        },
        "technical_skills": [{"name": k, **v} for k, v in sorted(skills["technical"].items(), key=lambda kv: -kv[1]["mentions"])],
        "soft_skills": skills["soft"],
        "education": edu,
        "experience": exp,
        "projects": proj,
        "certifications": cert,
        "contact": contact,
        "missing_sections": missing_sections(sections),
        "strengths": strengths,
        "improvements": improve,
        "suggestions": suggestions,
        "document": meta,
        "sections_found": [k for k, v in sections.items() if v and k != "header"],
    }
