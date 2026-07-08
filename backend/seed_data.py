import json
import uuid
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.core.db import engine, init_db
from app.models import District, Block, GramPanchayat, Village, ScoringWeights, DevelopmentPlanProject, Submission, Theme, SubmissionEmbedding, MPSeat, ConstituencyBlock

# 1. District Seed
MOCK_DISTRICTS = [
    {"id": 410, "name": "Indore", "state": "Madhya Pradesh"},
    {"id": 396, "name": "Bhopal", "state": "Madhya Pradesh"}
]

# 2. Blocks Seed
MOCK_BLOCKS = [
    {"id": 4000, "name": "Indore Block", "district_id": 410},
    {"id": 3999, "name": "Bhopal Block", "district_id": 396}
]

# 3. Gram Panchayats Seed
MOCK_GPS = [
    {"id": 150535, "name": "Pachora GP", "block_id": 4000},
    {"id": 150999, "name": "Kolar GP", "block_id": 3999}
]

# 4. Villages Seed
MOCK_VILLAGES = [
    {
        "id": 472592,
        "name": "Abhaypur (Village 1)",
        "gram_panchayat_id": 150535,
        "population": 45000,
        "literacy_rate": 84.5,
        "school_enrollment_ratio": 92.1,
        "distance_to_nearest_hospital_km": 1.2,
        "road_quality_index": 0.85,
        "boundary_geojson": json.dumps({
            "type": "Feature",
            "properties": {"name": "Abhaypur"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [77.01, 28.47],
                    [77.04, 28.47],
                    [77.04, 28.45],
                    [77.01, 28.45],
                    [77.01, 28.47]
                ]]
            }
        })
    },
    {
        "id": 472999,
        "name": "Kolar Village (Village 2)",
        "gram_panchayat_id": 150999,
        "population": 32000,
        "literacy_rate": 62.0,
        "school_enrollment_ratio": 71.5,
        "distance_to_nearest_hospital_km": 8.5,
        "road_quality_index": 0.40,
        "boundary_geojson": json.dumps({
            "type": "Feature",
            "properties": {"name": "Kolar Village"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [77.04, 28.47],
                    [77.07, 28.47],
                    [77.07, 28.45],
                    [77.04, 28.45],
                    [77.04, 28.47]
                ]]
            }
        })
    }
]

# 5. Existing plan projects
MOCK_PROJECTS = [
    {
        "id": "project-1",
        "title": "Primary School Renovation and Desk Upgrade",
        "sector": "education",
        "village_id": 472592,
        "budget": 1200000.0,
        "status": "ongoing",
        "source": "existing_plan",
        "scheme_name": "Samagra Shiksha Abhiyan (SSA)"
    },
    {
        "id": "project-2",
        "title": "Kolar Drinking Water Pipeline Connection",
        "sector": "water",
        "village_id": 472999,
        "budget": 4500000.0,
        "status": "proposed",
        "source": "existing_plan",
        "scheme_name": "Jal Jeevan Mission (JJM)"
    }
]

# 6. Raw citizen inputs
MOCK_SUBMISSIONS_DATA = [
    {
        "channel": "whatsapp",
        "citizen_ref": "wa_user_01",
        "raw_text": "Hey, the main road in Kolar Village has huge potholes. It is very dangerous for children going to school. Please fix it! My phone number is +91 9988776655.",
        "language": "en",
        "translated_text": "Hey, the main road in Kolar Village has huge potholes. It is very dangerous for children going to school. Please fix it! My phone number is [REDACTED PHONE].",
        "sector": "roads",
        "village_id": 472999,
        "lat": 28.421,
        "lng": 77.052,
    },
    {
        "channel": "voice",
        "citizen_ref": "voice_user_03",
        "raw_text": "हाथ जोड़कर निवेदन है कि हमारे गाँव अभयपुर में कोई अस्पताल नहीं है। कृपया एक स्वास्थ्य केंद्र खोलें। मेरा नाम रमेश कुमार है।",
        "language": "hi",
        "translated_text": "It is a humble request that there is no hospital in our village Abhaypur. Please open a health center. My name is [REDACTED].",
        "sector": "health",
        "village_id": 472592,
        "lat": 28.418,
        "lng": 77.049,
    }
]

# 7. Pre-defined themes mapped to schemes
MOCK_THEMES = [
    {
        "id": "theme-1",
        "label": "Road Repair & Pothole Repair on Kolar Main Road",
        "sector": "roads",
        "village_id": 472999,
        "submission_count": 1,
        "status": "open",
        "score": 8.2,
        "scheme_name": "MPLADS",
        "score_breakdown_json": json.dumps({
            "demand_volume_score": 5.0,
            "demand_intensity_score": 8.0,
            "population_impact_score": 4.0,
            "gap_severity_score": 9.5,
            "overlap_penalty_score": 0.0,
            "calculated_at": datetime.utcnow().isoformat()
        })
    },
    {
        "id": "theme-2",
        "label": "Primary Health Clinic Construction",
        "sector": "health",
        "village_id": 472592,
        "submission_count": 1,
        "status": "open",
        "score": 7.9,
        "scheme_name": "National Health Mission (NHM)",
        "score_breakdown_json": json.dumps({
            "demand_volume_score": 3.0,
            "demand_intensity_score": 9.0,
            "population_impact_score": 4.0,
            "gap_severity_score": 10.0,
            "overlap_penalty_score": 0.0,
            "calculated_at": datetime.utcnow().isoformat()
        })
    }
]

MOCK_SEATS = [
    {"id": "mp-indore", "name": "Indore", "state": "Madhya Pradesh"},
    {"id": "mp-bhopal", "name": "Bhopal", "state": "Madhya Pradesh"}
]

MOCK_CONSTITUENCY_BLOCKS = [
    {"constituency_id": "mp-indore", "block_id": 4000},
    {"constituency_id": "mp-bhopal", "block_id": 3999}
]

def seed_database():
    print("Initializing Relational Database tables...")
    init_db()

    with Session(engine) as session:
        # Delete references sequentially to prevent foreign key errors
        for table in [SubmissionEmbedding, Submission, Theme, DevelopmentPlanProject, ConstituencyBlock, Village, GramPanchayat, Block, District, MPSeat, ScoringWeights]:
            for item in session.exec(select(table)).all():
                session.delete(item)
        session.commit()

        # Seed MP Seats
        for seat in MOCK_SEATS:
            session.add(MPSeat(**seat))

        # Seed Districts, Blocks, Gram Panchayats
        for dist in MOCK_DISTRICTS:
            session.add(District(**dist))
        session.flush() # Force write Districts first

        for block in MOCK_BLOCKS:
            session.add(Block(**block))
        session.flush() # Force write Blocks next

        for gp in MOCK_GPS:
            session.add(GramPanchayat(**gp))
        session.flush() # Force write GPs next

        for vil in MOCK_VILLAGES:
            session.add(Village(**vil))
        session.flush() # Force write Villages next

        for cb in MOCK_CONSTITUENCY_BLOCKS:
            session.add(ConstituencyBlock(**cb))
        
        weights = ScoringWeights(id="default")
        session.add(weights)
        session.flush()

        for p in MOCK_PROJECTS:
            session.add(DevelopmentPlanProject(**p))
            
        for t in MOCK_THEMES:
            session.add(Theme(**t))

        from app.services.processing_pipeline import redact_pii

        for sub_idx, s_data in enumerate(MOCK_SUBMISSIONS_DATA):
            sub_id = f"sub-{sub_idx + 1}"
            raw_t = s_data["raw_text"]
            redacted_t = redact_pii(raw_t)
            
            sub = Submission(
                id=sub_id,
                citizen_ref=s_data["citizen_ref"],
                unredacted_citizen_ref=f"{s_data['citizen_ref'].replace('_', ' ').title()} (+91 99000 1230{sub_idx})",
                channel=s_data["channel"],
                raw_text=redacted_t,
                unredacted_text=raw_t,
                language=s_data["language"],
                translated_text=s_data["translated_text"],
                sector=s_data["sector"],
                village_id=s_data["village_id"],
                lat=s_data.get("lat"),
                lng=s_data.get("lng"),
                status="processed",
                created_at=datetime.utcnow() - timedelta(days=sub_idx)
            )
            session.add(sub)
            
            mock_emb = ",".join(["0.0"] * 1536)
            embedding = SubmissionEmbedding(
                submission_id=sub_id,
                embedding_vector=mock_emb
            )
            session.add(embedding)

        session.commit()
        print("Database Seed completed successfully!")

if __name__ == "__main__":
    seed_database()
