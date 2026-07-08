import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app
from app.core.db import get_session
from app.models import (
    District, Block, GramPanchayat, Village, MPSeat, ConstituencyBlock,
    Submission, SubmissionEmbedding, Theme, DevelopmentPlanProject, ScoringWeights
)
from seed_data import (
    MOCK_DISTRICTS, MOCK_BLOCKS, MOCK_GPS, MOCK_VILLAGES,
    MOCK_SEATS, MOCK_CONSTITUENCY_BLOCKS, MOCK_PROJECTS, MOCK_THEMES, MOCK_SUBMISSIONS_DATA
)

# Use a file-based SQLite database for tests to prevent isolated connections
test_db_path = r"C:\Users\Dell\.gemini\antigravity\scratch\peoples_priorities\backend\test_app.db"
test_engine = create_engine(f"sqlite:///{test_db_path}", connect_args={"check_same_thread": False})

@pytest.fixture(name="session")
def session_fixture():
    # Clean and set up schema
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)

    
    # Seed mock data directly into the test database
    with Session(test_engine) as session:
        # Seed MP Seats
        for seat in MOCK_SEATS:
            session.add(MPSeat(**seat))
        # Seed Districts
        for dist in MOCK_DISTRICTS:
            session.add(District(**dist))
        # Seed Blocks
        for block in MOCK_BLOCKS:
            session.add(Block(**block))
        # Seed GPs
        for gp in MOCK_GPS:
            session.add(GramPanchayat(**gp))
        # Seed Villages
        for vil in MOCK_VILLAGES:
            session.add(Village(**vil))
        # Seed Constituency-Block mappings
        for cb in MOCK_CONSTITUENCY_BLOCKS:
            session.add(ConstituencyBlock(**cb))
            
        session.commit()
        
    with Session(test_engine) as session:
        yield session
        
    SQLModel.metadata.drop_all(test_engine)

@pytest.fixture(name="client")
def client_fixture(session):
    # Override get_session dependency to use test_engine
    def get_test_session():
        with Session(test_engine) as s:
            yield s
            
    app.dependency_overrides[get_session] = get_test_session
    
    with TestClient(app) as client:
        yield client
        
    app.dependency_overrides.clear()


def test_api_list_districts(client):
    # Retrieve all districts (Indore [410], Bhopal [396])
    response = client.get("/api/districts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    names = [d["name"] for d in data]
    assert "Indore" in names
    assert "Bhopal" in names

def test_api_constituency_filtering(client):
    # Filter by Indore constituency query parameter
    response = client.get("/api/blocks?constituency_id=mp-indore")
    assert response.status_code == 200
    blocks = response.json()
    assert len(blocks) == 1
    assert blocks[0]["name"] == "Indore Block"
    assert blocks[0]["id"] == 4000

    # Filter by Bhopal constituency header
    response = client.get("/api/panchayats", headers={"x-constituency-id": "mp-bhopal"})
    assert response.status_code == 200
    gps = response.json()
    assert len(gps) == 1
    assert gps[0]["name"] == "Kolar GP"
    assert gps[0]["id"] == 150999

    # Filter villages by Indore
    response = client.get("/api/villages", headers={"x-constituency-id": "mp-indore"})
    assert response.status_code == 200
    villages = response.json()
    assert len(villages) == 1
    assert villages[0]["name"] == "Abhaypur (Village 1)"
    assert villages[0]["id"] == 472592

def test_api_fuzzy_search_villages(client):
    # Search for Abhaypur
    response = client.get("/api/villages/search?query=abhay")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["id"] == 472592
    # Verify formatted_name format: Village Name (Gram Panchayat, Block)
    assert results[0]["formatted_name"] == "Abhaypur (Village 1) (Pachora GP, Indore Block)"
    
    # Search with constituency filter mismatch
    response = client.get("/api/villages/search?query=abhay&constituency_id=mp-bhopal")
    assert response.status_code == 200
    assert len(response.json()) == 0

    # Search with constituency filter match
    response = client.get("/api/villages/search?query=abhay&constituency_id=mp-indore")
    assert response.status_code == 200
    assert len(response.json()) == 1
