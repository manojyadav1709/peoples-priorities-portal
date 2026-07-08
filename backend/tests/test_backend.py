import pytest
from sqlmodel import Session, SQLModel, create_engine
from app.models import District, Block, GramPanchayat, Village, ScoringWeights, Theme, DevelopmentPlanProject, Submission
from app.services.processing_pipeline import redact_pii, compute_cosine_similarity, get_default_scheme
from app.services.scoring_engine import calculate_theme_score
from app.services.ai_service import AIServiceAdapter

test_engine = create_engine("sqlite:///:memory:")

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    SQLModel.metadata.drop_all(test_engine)

def test_governance_hierarchy_relations(session: Session):
    # 1. Create District
    dist = District(id=1, name="Test District", state="Haryana")
    session.add(dist)
    session.commit()

    # 2. Create Block
    block = Block(id=2, name="Test Block", district_id=1)
    session.add(block)
    session.commit()

    # 3. Create Gram Panchayat
    gp = GramPanchayat(id=3, name="Test GP", block_id=2)
    session.add(gp)
    session.commit()

    # 4. Create Village
    village = Village(
        id=4,
        name="Test Village",
        gram_panchayat_id=3,
        population=10000,
        literacy_rate=75.0,
        school_enrollment_ratio=80.0,
        distance_to_nearest_hospital_km=5.0,
        road_quality_index=0.6,
        boundary_geojson="{}"
    )
    session.add(village)
    session.commit()

    # Verify relationships
    queried_village = session.get(Village, 4)
    assert queried_village is not None
    assert queried_village.gram_panchayat_id == 3

def test_scheme_mappings():
    assert get_default_scheme("water") == "Jal Jeevan Mission (JJM)"
    assert get_default_scheme("sanitation") == "Swachh Bharat Mission (SBM)"
    assert get_default_scheme("roads") == "MPLADS"
    assert get_default_scheme("health") == "National Health Mission (NHM)"
    assert get_default_scheme("education") == "Samagra Shiksha Abhiyan (SSA)"
    assert get_default_scheme("electricity") == "GPDP"
    assert get_default_scheme("other") == "GPDP"

def test_pii_redaction():
    text_with_phone = "Hello, my phone is +91-9876543210. Please fix the water pipe."
    redacted = redact_pii(text_with_phone)
    assert "+91-9876543210" not in redacted
    assert "[REDACTED PHONE]" in redacted

def test_cosine_similarity():
    vec1 = [1.0, 0.0, 1.0, 0.0]
    vec2 = [1.0, 0.0, 1.0, 0.0]
    assert abs(compute_cosine_similarity(vec1, vec2) - 1.0) < 1e-5

def test_scoring_math_with_villages(session: Session):
    # 1. Setup Hierarchy
    session.add(District(id=1, name="Test Dist"))
    session.add(Block(id=2, name="Test Block", district_id=1))
    session.add(GramPanchayat(id=3, name="Test GP", block_id=2))
    
    village = Village(
        id=4,
        name="Test Village",
        gram_panchayat_id=3,
        population=50000,
        literacy_rate=80.0,
        school_enrollment_ratio=90.0,
        distance_to_nearest_hospital_km=10.0,
        road_quality_index=0.3,
        boundary_geojson="{}"
    )
    session.add(village)
    session.commit()

    # 2. Setup Weights
    weights = ScoringWeights(
        id="default",
        demand_volume=0.3,
        demand_intensity=0.2,
        population_impact=0.2,
        gap_severity=0.2,
        overlap_penalty=0.1
    )
    session.add(weights)
    session.commit()

    # 3. Setup a Theme
    theme = Theme(
        id="theme-t",
        label="Test Theme",
        sector="roads",
        village_id=4,
        submission_count=1,
        score=0.0,
        score_breakdown_json="{}",
        status="open",
        scheme_name="MPLADS"
    )
    session.add(theme)
    session.commit()

    # Calculate score
    score = calculate_theme_score(session, theme)
    assert score > 0.0
    
    # Check if duplicate project overlap reduces score
    duplicate_project = DevelopmentPlanProject(
        id="proj-t",
        title="Duplicate Road Repair",
        sector="roads",
        village_id=4,
        budget=100000.0,
        status="ongoing",
        source="existing_plan",
        scheme_name="MPLADS"
    )
    session.add(duplicate_project)
    session.commit()

    reduced_score = calculate_theme_score(session, theme)
    assert reduced_score < score

def test_document_uploader_api():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    
    response = client.post(
        "/api/submissions/document",
        data={"village_id": 472592},
        files={"file": ("test_doc.pdf", b"%PDF-1.4 mock pdf content", "application/pdf")}
    )
    
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["data"]["channel"] == "letter"
    assert int(json_data["data"]["village_id"]) == 472592

def test_secure_admin_api():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    
    # 1. Unauthenticated request must return 401
    bad_res = client.get("/api/admin/submissions")
    assert bad_res.status_code == 401
    
    # 2. Authenticated request must return 200
    good_res = client.get(
        "/api/admin/submissions", 
        headers={"X-Admin-Token": "mp_secret_token_123"}
    )
    assert good_res.status_code == 200
    assert isinstance(good_res.json(), list)



