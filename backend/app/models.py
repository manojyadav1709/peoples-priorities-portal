from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class District(SQLModel, table=True):
    __tablename__ = "districts"
    id: int = Field(primary_key=True)
    name: str
    state: str = "Madhya Pradesh"

class Block(SQLModel, table=True):
    __tablename__ = "blocks"
    id: int = Field(primary_key=True)
    name: str
    district_id: int = Field(foreign_key="districts.id", ondelete="CASCADE")

class GramPanchayat(SQLModel, table=True):
    __tablename__ = "gram_panchayats"
    id: int = Field(primary_key=True)
    name: str
    block_id: int = Field(foreign_key="blocks.id", ondelete="CASCADE")

class Village(SQLModel, table=True):
    __tablename__ = "villages"
    id: int = Field(primary_key=True)
    name: str
    gram_panchayat_id: int = Field(foreign_key="gram_panchayats.id", ondelete="CASCADE")
    population: int = Field(default=0)
    literacy_rate: float = Field(default=0.0)
    school_enrollment_ratio: float = Field(default=0.0)
    distance_to_nearest_hospital_km: float = Field(default=0.0)
    road_quality_index: float = Field(default=0.0)  # Scale 0.0 to 1.0
    boundary_geojson: str = Field(default="{}")  # GeoJSON string for Map

class MPSeat(SQLModel, table=True):
    __tablename__ = "mp_seats"
    id: str = Field(primary_key=True)  # e.g., "mp-indore", "mp-bhopal"
    name: str  # e.g., "Indore", "Bhopal"
    state: str = "Madhya Pradesh"

class ConstituencyBlock(SQLModel, table=True):
    __tablename__ = "constituency_blocks"
    constituency_id: str = Field(primary_key=True, foreign_key="mp_seats.id", ondelete="CASCADE")
    block_id: int = Field(primary_key=True, foreign_key="blocks.id", ondelete="CASCADE")

class Submission(SQLModel, table=True):
    __tablename__ = "submissions"
    id: str = Field(primary_key=True)
    citizen_ref: str
    unredacted_citizen_ref: Optional[str] = None
    channel: str  # web, whatsapp, telegram, voice, offline_csv
    raw_text: str
    unredacted_text: Optional[str] = None
    raw_media_url: Optional[str] = None
    language: str
    translated_text: str
    sector: str  # education, water, roads, health, electricity, sanitation, other
    village_id: int = Field(foreign_key="villages.id", ondelete="CASCADE")
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: str = "processed"  # pending, processed, flagged_pii, spam
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubmissionEmbedding(SQLModel, table=True):
    __tablename__ = "submission_embeddings"
    submission_id: str = Field(primary_key=True, foreign_key="submissions.id", ondelete="CASCADE")
    embedding_vector: str  # Comma-separated floats or JSON list of 1536 floats for vector math

class Theme(SQLModel, table=True):
    __tablename__ = "themes"
    id: str = Field(primary_key=True)
    label: str
    sector: str
    village_id: int = Field(foreign_key="villages.id", ondelete="CASCADE")
    submission_count: int
    score: float
    score_breakdown_json: str  # JSON string of breakdown weights/inputs
    status: str = "open"  # open, proposed_to_plan, resolved
    scheme_name: str = "GPDP"  # e.g., Jal Jeevan Mission, SBM, MPLADS, GPDP

class DevelopmentPlanProject(SQLModel, table=True):
    __tablename__ = "development_plan_projects"
    id: str = Field(primary_key=True)
    title: str
    sector: str
    village_id: int = Field(foreign_key="villages.id", ondelete="CASCADE")
    budget: float
    status: str  # proposed, approved, ongoing, completed
    source: str  # existing_plan, citizen_driven
    scheme_name: str = "GPDP"

class ScoringWeights(SQLModel, table=True):
    __tablename__ = "scoring_weights"
    id: str = Field(default="default", primary_key=True)
    demand_volume: float = 0.3
    demand_intensity: float = 0.2
    population_impact: float = 0.2
    gap_severity: float = 0.2
    overlap_penalty: float = 0.1
    updated_at: datetime = Field(default_factory=datetime.utcnow)

