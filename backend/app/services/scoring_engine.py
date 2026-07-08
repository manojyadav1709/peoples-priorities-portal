import json
import math
from datetime import datetime
from sqlmodel import Session, select
from app.models import Theme, Village, ScoringWeights, DevelopmentPlanProject, Submission

def calculate_theme_score(session: Session, theme: Theme) -> float:
    """Computes composite priority score based on village demographics and schemes."""
    # 1. Fetch Village info
    village = session.get(Village, theme.village_id)
    if not village:
        return 0.0

    # 2. Fetch Weights
    weights_stmt = select(ScoringWeights).where(ScoringWeights.id == "default")
    weights = session.exec(weights_stmt).first()
    if not weights:
        weights = ScoringWeights(id="default")
        session.add(weights)
        session.commit()
        session.refresh(weights)

    # 3. Calculate Demand Volume Score (S_vol)
    s_vol = min(10.0, math.log2(1 + theme.submission_count) * 3.5)

    # 4. Calculate Demand Intensity Score (S_int)
    sub_stmt = select(Submission).where(
        Submission.village_id == theme.village_id,
        Submission.sector == theme.sector,
        Submission.status != "spam"
    )
    submissions = session.exec(sub_stmt).all()
    
    intensities = []
    for sub in submissions:
        sub_text = sub.translated_text.lower()
        sub_intensity = 0.3
        if any(w in sub_text for w in ["urgent", "danger", "hazard", "immediately", "accident", "broken", "leak", "contaminat"]):
            sub_intensity = 0.9
        elif any(w in sub_text for w in ["please", "request", "need", "upgrade"]):
            sub_intensity = 0.6
        intensities.append(sub_intensity)
    
    s_int = (sum(intensities) / len(intensities) * 10.0) if intensities else 5.0

    # 5. Calculate Population Impact Score (S_pop)
    s_pop = min(10.0, (village.population / 80000.0) * 10.0)

    # 6. Calculate Infrastructure Gap Severity (S_gap)
    s_gap = 5.0
    if theme.sector == "roads":
        s_gap = (1.0 - village.road_quality_index) * 10.0
    elif theme.sector == "health":
        s_gap = min(10.0, (village.distance_to_nearest_hospital_km / 15.0) * 10.0)
    elif theme.sector == "education":
        s_gap = min(10.0, (1.0 - (village.school_enrollment_ratio / 100.0)) * 10.0 * 2.0)
    elif theme.sector == "water":
        if theme.village_id in ["village-2", "village-4"]:
            s_gap = 9.0
        else:
            s_gap = 4.0
    elif theme.sector == "electricity":
        if theme.village_id in ["village-4", "village-1"]:
            s_gap = 8.0
        else:
            s_gap = 3.0
    elif theme.sector == "sanitation":
        if theme.village_id in ["village-5", "village-4"]:
            s_gap = 8.5
        else:
            s_gap = 4.0

    # 7. Calculate Overlap/Duplicate Penalty (S_dup)
    proj_stmt = select(DevelopmentPlanProject).where(
        DevelopmentPlanProject.village_id == theme.village_id,
        DevelopmentPlanProject.sector == theme.sector,
        DevelopmentPlanProject.status.in_(["ongoing", "approved", "proposed"])
    )
    duplicate_projects = session.exec(proj_stmt).all()
    s_dup = 10.0 if duplicate_projects else 0.0

    # 8. Compute weighted score
    weighted_score = (
        weights.demand_volume * s_vol +
        weights.demand_intensity * s_int +
        weights.population_impact * s_pop +
        weights.gap_severity * s_gap -
        weights.overlap_penalty * s_dup
    )

    final_score = max(0.0, min(10.0, round(weighted_score, 2)))

    breakdown = {
        "demand_volume_score": round(s_vol, 2),
        "demand_intensity_score": round(s_int, 2),
        "population_impact_score": round(s_pop, 2),
        "gap_severity_score": round(s_gap, 2),
        "overlap_penalty_score": round(s_dup, 2),
        "weightsUsed": {
            "demand_volume": weights.demand_volume,
            "demand_intensity": weights.demand_intensity,
            "population_impact": weights.population_impact,
            "gap_severity": weights.gap_severity,
            "overlap_penalty": weights.overlap_penalty
        },
        "duplicate_projects_found": [p.title for p in duplicate_projects],
        "calculated_at": datetime.utcnow().isoformat()
    }
    
    theme.score = final_score
    theme.score_breakdown_json = json.dumps(breakdown)
    session.add(theme)
    session.commit()
    
    return final_score

def recalculate_all_theme_scores(session: Session):
    themes_stmt = select(Theme)
    themes = session.exec(themes_stmt).all()
    for theme in themes:
        calculate_theme_score(session, theme)
    print("Recalculated scores for all village themes.")
