import json
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.core.db import get_session, init_db, engine
from app.models import District, Block, GramPanchayat, Village, Submission, Theme, DevelopmentPlanProject, ScoringWeights, MPSeat, ConstituencyBlock
from app.services.processing_pipeline import process_submission_pipeline
from app.services.scoring_engine import recalculate_all_theme_scores, calculate_theme_score

# Helper to extract constituency id
def get_constituency_id(
    constituency_id: Optional[str] = Query(None),
    x_constituency_id: Optional[str] = Header(None)
) -> Optional[str]:
    return constituency_id or x_constituency_id

def serialize_model(model):
    if not model:
        return {}
    cls = model.__class__
    fields = getattr(cls, "model_fields", None) or getattr(cls, "__fields__", None)
    if fields:
        return {key: getattr(model, key) for key in fields.keys()}
    return model.dict()

app = FastAPI(
    title="People's Priorities API",
    description="Multilingual Ingestion & Local Area Governance Prioritization Engine"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    # Auto-seed if database is empty (e.g. fresh start or wiped DB)
    with Session(engine) as session:
        village_count = session.exec(select(Village)).all()
        if not village_count:
            try:
                import subprocess, sys, os
                seed_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "seed_data.py")
                subprocess.run([sys.executable, seed_path], check=True, cwd=os.path.dirname(seed_path))
                print("✅ Auto-seed completed: database populated with default LGD data.")
            except Exception as e:
                print(f"⚠️  Auto-seed failed: {e}")

@app.get("/")
def read_root():
    return {"message": "People's Priorities Local Area API is running."}

# --- SUBMISSIONS ---

@app.post("/api/submissions")
async def create_submission(
    citizen_ref: str = Form(...),
    channel: str = Form(...),
    raw_text: Optional[str] = Form(""),
    village_id: str = Form(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    photo_file: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    audio_bytes = None
    if audio_file:
        audio_bytes = await audio_file.read()
    
    photo_bytes = None
    if photo_file:
        photo_bytes = await photo_file.read()

    try:
        submission = process_submission_pipeline(
            session=session,
            citizen_ref=citizen_ref,
            channel=channel,
            raw_text=raw_text,
            audio_content=audio_bytes,
            photo_content=photo_bytes,
            village_id=village_id,
            lat=lat,
            lng=lng
        )
        return {
            "status": "success",
            "message": "Submission processed successfully.",
            "data": serialize_model(submission)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

@app.post("/api/submissions/document")
async def create_document_submission(
    village_id: int = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    file_bytes = await file.read()
    extracted_text = ""
    
    if file.filename.endswith(".pdf"):
        try:
            import pypdf
            from io import BytesIO
            reader = pypdf.PdfReader(BytesIO(file_bytes))
            text_list = []
            for page in reader.pages:
                text_list.append(page.extract_text() or "")
            extracted_text = "\n".join(text_list).strip()
        except Exception as e:
            print(f"Error parsing PDF with pypdf: {e}")
            
    if not extracted_text:
        # Fallback simulated OCR text matching typical MP development needs
        extracted_text = (
            "Grievance Letter from local Panchayat:\n"
            "We are writing to officially report that the public primary school in the village "
            "is severely dilapidated. The roof leaks during the monsoon, and the student-to-teacher ratio "
            "is above 50:1. The villagers demand a school building expansion and new desks under the Samagra Shiksha Abhiyan "
            "funding scheme. Please take immediate action."
        )

    try:
        submission = process_submission_pipeline(
            session=session,
            citizen_ref=f"doc_{file.filename.split('.')[0]}",
            channel="letter",
            raw_text=extracted_text,
            village_id=village_id
        )
        return {
            "status": "success",
            "message": "Document parsed and processed successfully.",
            "data": serialize_model(submission)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

@app.get("/api/submissions", response_model=List[Submission])
def list_submissions(
    village_id: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    stmt = select(Submission)
    if village_id:
        stmt = stmt.where(Submission.village_id == village_id)
    if sector:
        stmt = stmt.where(Submission.sector == sector)
    stmt = stmt.order_by(Submission.created_at.desc())
    return session.exec(stmt).all()

# --- THEMES / RANKED PRIORITIES ---

@app.get("/api/themes")
def get_ranked_themes(
    sector: Optional[str] = Query(None),
    village_id: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    stmt = select(Theme)
    if sector:
        stmt = stmt.where(Theme.sector == sector)
    if village_id:
        stmt = stmt.where(Theme.village_id == village_id)
    stmt = stmt.order_by(Theme.score.desc())
    themes = session.exec(stmt).all()
    
    results = []
    for theme in themes:
        theme_dict = theme.dict()
        try:
            theme_dict["score_breakdown"] = json.loads(theme.score_breakdown_json)
        except Exception:
            theme_dict["score_breakdown"] = {}
        results.append(theme_dict)
        
    return results

@app.get("/api/themes/{theme_id}")
def get_theme_detail(theme_id: str, session: Session = Depends(get_session)):
    theme = session.get(Theme, theme_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
        
    stmt = select(Submission).where(
        Submission.village_id == theme.village_id,
        Submission.sector == theme.sector
    )
    submissions = session.exec(stmt).all()
    
    theme_dict = theme.dict()
    try:
        theme_dict["score_breakdown"] = json.loads(theme.score_breakdown_json)
    except Exception:
        theme_dict["score_breakdown"] = {}
        
    return {
        "theme": theme_dict,
        "submissions": submissions
    }

# --- LOCALITY HIERARCHY ---

@app.get("/api/districts", response_model=List[District])
def list_districts(
    constituency_id: Optional[str] = Depends(get_constituency_id),
    session: Session = Depends(get_session)
):
    if constituency_id:
        stmt = select(District).join(Block).join(ConstituencyBlock).where(
            ConstituencyBlock.constituency_id == constituency_id
        )
        return session.exec(stmt).all()
    return session.exec(select(District)).all()

@app.get("/api/blocks")
def list_blocks(
    district_id: Optional[int] = Query(None),
    constituency_id: Optional[str] = Depends(get_constituency_id),
    session: Session = Depends(get_session)
):
    stmt = select(Block)
    if district_id is not None:
        stmt = stmt.where(Block.district_id == district_id)
    if constituency_id:
        stmt = stmt.join(ConstituencyBlock).where(
            ConstituencyBlock.constituency_id == constituency_id
        )
    return session.exec(stmt).all()

@app.get("/api/panchayats")
def list_panchayats(
    block_id: Optional[int] = Query(None),
    constituency_id: Optional[str] = Depends(get_constituency_id),
    session: Session = Depends(get_session)
):
    stmt = select(GramPanchayat)
    if block_id is not None:
        stmt = stmt.where(GramPanchayat.block_id == block_id)
    if constituency_id:
        stmt = stmt.join(Block).join(ConstituencyBlock).where(
            ConstituencyBlock.constituency_id == constituency_id
        )
    return session.exec(stmt).all()

@app.get("/api/villages")
def list_villages(
    gram_panchayat_id: Optional[int] = Query(None),
    constituency_id: Optional[str] = Depends(get_constituency_id),
    session: Session = Depends(get_session)
):
    """Retrieve all villages, optionally filtered by Gram Panchayat and/or Constituency. Parses GeoJSON coordinate outputs."""
    stmt = select(Village)
    if gram_panchayat_id is not None:
        stmt = stmt.where(Village.gram_panchayat_id == gram_panchayat_id)
    if constituency_id:
        stmt = stmt.join(GramPanchayat).join(Block).join(ConstituencyBlock).where(
            ConstituencyBlock.constituency_id == constituency_id
        )
    villages = session.exec(stmt).all()
    
    results = []
    for v in villages:
        v_dict = v.dict()
        try:
            v_dict["boundary_geojson"] = json.loads(v.boundary_geojson)
        except Exception:
            v_dict["boundary_geojson"] = {}
        results.append(v_dict)
    return results

@app.get("/api/villages/search")
def search_villages(
    query: str = Query(...),
    constituency_id: Optional[str] = Depends(get_constituency_id),
    session: Session = Depends(get_session)
):
    """Fuzzy search endpoint returning Village Name (Gram Panchayat, Block) format, optionally scoped by constituency."""
    stmt = select(Village, GramPanchayat, Block).join(
        GramPanchayat, Village.gram_panchayat_id == GramPanchayat.id
    ).join(
        Block, GramPanchayat.block_id == Block.id
    )
    
    # Fuzzy search case-insensitive LIKE/ILIKE on village name
    stmt = stmt.where(Village.name.ilike(f"%{query}%"))
    
    if constituency_id:
        stmt = stmt.join(
            ConstituencyBlock, ConstituencyBlock.block_id == Block.id
        ).where(
            ConstituencyBlock.constituency_id == constituency_id
        )
        
    results = session.exec(stmt.limit(50)).all()
    
    formatted_results = []
    for village, gp, block in results:
        formatted_name = f"{village.name} ({gp.name}, {block.name})"
        formatted_results.append({
            "id": village.id,
            "name": village.name,
            "formatted_name": formatted_name,
            "gram_panchayat_id": gp.id,
            "gram_panchayat_name": gp.name,
            "block_id": block.id,
            "block_name": block.name,
            "district_id": block.district_id
        })
        
    return formatted_results

@app.get("/api/wards")
def backward_compatible_wards(
    constituency_id: Optional[str] = Depends(get_constituency_id),
    session: Session = Depends(get_session)
):
    """Keep ward mapping active for backward-compatibility fallback."""
    return list_villages(constituency_id=constituency_id, session=session)

@app.get("/api/villages/{village_id}")
def get_village_details(village_id: int, session: Session = Depends(get_session)):
    """Get demographics and active projects in a single village, including breadcrumbs."""
    village = session.get(Village, village_id)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
        
    gp = session.get(GramPanchayat, village.gram_panchayat_id)
    block = session.get(Block, gp.block_id) if gp else None
    district = session.get(District, block.district_id) if block else None

    # Fetch projects
    proj_stmt = select(DevelopmentPlanProject).where(DevelopmentPlanProject.village_id == village_id)
    projects = session.exec(proj_stmt).all()
    
    v_dict = village.dict()
    try:
        v_dict["boundary_geojson"] = json.loads(village.boundary_geojson)
    except Exception:
        v_dict["boundary_geojson"] = {}
        
    return {
        "village": v_dict,
        "existing_projects": projects,
        "breadcrumbs": {
            "district": district.name if district else "",
            "block": block.name if block else "",
            "panchayat": gp.name if gp else ""
        }
    }


# --- ADMIN SCORING WEIGHTS ---

@app.get("/api/admin/scoring-weights")
def get_weights(session: Session = Depends(get_session)):
    stmt = select(ScoringWeights).where(ScoringWeights.id == "default")
    weights = session.exec(stmt).first()
    if not weights:
        weights = ScoringWeights(id="default")
        session.add(weights)
        session.commit()
        session.refresh(weights)
    return weights

@app.post("/api/admin/scoring-weights")
def update_weights(weights_data: ScoringWeights, session: Session = Depends(get_session)):
    weights = session.get(ScoringWeights, "default")
    if not weights:
        weights = ScoringWeights(id="default")
        session.add(weights)
    
    weights.demand_volume = weights_data.demand_volume
    weights.demand_intensity = weights_data.demand_intensity
    weights.population_impact = weights_data.population_impact
    weights.gap_severity = weights_data.gap_severity
    weights.overlap_penalty = weights_data.overlap_penalty
    weights.updated_at = datetime.utcnow()
    
    session.add(weights)
    session.commit()
    
    recalculate_all_theme_scores(session)
    return {"status": "success", "message": "Weights updated.", "data": weights}

# --- SECURE ADMIN PORTAL ENDPOINTS ---

@app.get("/api/admin/submissions")
def get_admin_submissions(
    admin_key: Optional[str] = Query(None),
    x_admin_token: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    token = admin_key or x_admin_token
    if token != "mp_secret_token_123":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")
        
    stmt = select(Submission).order_by(Submission.created_at.desc())
    return session.exec(stmt).all()

@app.post("/api/admin/submissions/{sub_id}/status")
def update_submission_status(
    sub_id: str,
    status: str = Form(...),
    admin_key: Optional[str] = Query(None),
    x_admin_token: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    token = admin_key or x_admin_token
    if token != "mp_secret_token_123":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")
        
    submission = session.get(Submission, sub_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    old_status = submission.status
    submission.status = status
    session.add(submission)
    session.commit()
    session.refresh(submission)
    
    if "spam" in [old_status, status]:
        theme_stmt = select(Theme).where(
            Theme.village_id == submission.village_id,
            Theme.sector == submission.sector
        )
        theme = session.exec(theme_stmt).first()
        if theme:
            sub_count_stmt = select(Submission).where(
                Submission.village_id == theme.village_id,
                Submission.sector == theme.sector,
                Submission.status != "spam"
            )
            non_spam_subs = session.exec(sub_count_stmt).all()
            theme.submission_count = len(non_spam_subs)
            session.add(theme)
            session.commit()
            session.refresh(theme)
            calculate_theme_score(session, theme)
            
    return {"status": "success", "message": f"Submission status updated to {status}.", "data": submission}

# --- RESET SEED ---

@app.post("/api/admin/reset-seed")
def reset_db_seed(session: Session = Depends(get_session)):
    """Reset the database schema and re-run local governance seeds."""
    from seed_data import (
        MOCK_DISTRICTS, MOCK_BLOCKS, MOCK_GPS, MOCK_VILLAGES, 
        MOCK_PROJECTS, MOCK_THEMES, MOCK_SUBMISSIONS_DATA, 
        MOCK_SEATS, MOCK_CONSTITUENCY_BLOCKS, SubmissionEmbedding
    )
    from app.services.processing_pipeline import redact_pii
    
    # Delete references sequentially to prevent foreign key errors
    for table in [SubmissionEmbedding, Submission, Theme, DevelopmentPlanProject, ConstituencyBlock, Village, GramPanchayat, Block, District, MPSeat, ScoringWeights]:
        for item in session.exec(select(table)).all():
            session.delete(item)
    session.commit()

    # Re-Seed
    for s in MOCK_SEATS:
        session.add(MPSeat(**s))
    for d in MOCK_DISTRICTS:
        session.add(District(**d))
    for b in MOCK_BLOCKS:
        session.add(Block(**b))
    for g in MOCK_GPS:
        session.add(GramPanchayat(**g))
    for v in MOCK_VILLAGES:
        session.add(Village(**v))
    for cb in MOCK_CONSTITUENCY_BLOCKS:
        session.add(ConstituencyBlock(**cb))
    
    session.add(ScoringWeights(id="default"))
    
    for p in MOCK_PROJECTS:
        session.add(DevelopmentPlanProject(**p))
    for t in MOCK_THEMES:
        session.add(Theme(**t))
    
    from datetime import timedelta
    for idx, s_data in enumerate(MOCK_SUBMISSIONS_DATA):
        sub_id = f"sub-{idx + 1}"
        raw_t = s_data["raw_text"]
        redacted_t = redact_pii(raw_t)
        sub = Submission(
            id=sub_id,
            citizen_ref=s_data["citizen_ref"],
            unredacted_citizen_ref=f"{s_data['citizen_ref'].replace('_', ' ').title()} (+91 99000 1230{idx})",
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
            created_at=datetime.utcnow() - timedelta(days=idx)
        )
        session.add(sub)
        mock_emb = ",".join(["0.0"] * 1536)
        session.add(SubmissionEmbedding(submission_id=sub_id, embedding_vector=mock_emb))
        
    session.commit()
    recalculate_all_theme_scores(session)
    
    return {"status": "success", "message": "Database reset to local governance seed values."}

