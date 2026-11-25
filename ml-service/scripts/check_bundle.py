"""Verify the trained bundle loads and runs.

Usage (from ml-service/):
    python -m scripts.check_bundle [path/to/resume_analyzer_v2_bundle.pkl]
"""
import json
import sys

from app.trained import TrainedModel

SAMPLE = """Experienced IT Infrastructure & Cloud Engineer with 6 years of expertise in server management,
network architecture, AWS, Azure, Linux, Docker, Kubernetes, cybersecurity, disaster recovery planning,
database systems, project management, leadership, and problem solving."""

JD = """Seeking a Cloud Infrastructure Manager with strong skills in AWS, Docker, Kubernetes, Linux,
cybersecurity, network architecture, vendor management, budget management, and team management."""

if __name__ == "__main__":
    model = TrainedModel(sys.argv[1] if len(sys.argv) > 1 else None).load()
    if not model.available:
        print("NOT AVAILABLE:", model.reason)
        sys.exit(1)
    out = model.analyze(SAMPLE, JD)
    print("Domain:", out["predicted_domain"])
    for m in out["benchmark_matches"][:5]:
        print(f"  {m['match_score']:>5}%  {m['role_title']} [{m['category']}]")
    print("JD match:", json.dumps(out.get("jd_match"), indent=2))
    print("Expected from the notebook for this sample: top role ~ IT Infrastructure Manager (~84%), JD match ~ 85%.")
