import re
import uuid
import json
from datetime import datetime
from sqlmodel import Session, select
from app.models import Submission, SubmissionEmbedding, Theme, Village, DevelopmentPlanProject
from app.services.ai_service import AIServiceAdapter
from app.services.scoring_engine import calculate_theme_score

# Regex patterns for PII Redaction
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
NATIONAL_ID_REGEX = re.compile(r'\b\d{4}[\s-]\d{4}[\s-]\d{4}\b|\b\d{3}-\d{2}-\d{4}\b')

def redact_pii(text: str) -> str:
    """Redact personal identifiers from text."""
    redacted = EMAIL_REGEX.sub("[REDACTED EMAIL]", text)
    redacted = PHONE_REGEX.sub("[REDACTED PHONE]", redacted)
    redacted = NATIONAL_ID_REGEX.sub("[REDACTED ID]", redacted)
    redacted = re.sub(r'(?i)\b(my name is|myself|i am|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', r'\1 [REDACTED NAME]', redacted)
    return redacted

def compute_cosine_similarity(vec1: list, vec2: list) -> float:
    """Calculate cosine similarity between two float vectors."""
    if len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(x * y for x, y in zip(vec1, vec2))
    norm_a = sum(x * x for x in vec1) ** 0.5
    norm_b = sum(y * y for y in vec2) ** 0.5
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def get_default_scheme(sector: str) -> str:
    """Map development sector to corresponding government scheme."""
    sect = sector.lower()
    if sect == "water":
        return "Jal Jeevan Mission (JJM)"
    elif sect == "sanitation":
        return "Swachh Bharat Mission (SBM)"
    elif sect == "roads":
        return "MPLADS"
    elif sect == "health":
        return "National Health Mission (NHM)"
    elif sect == "education":
        return "Samagra Shiksha Abhiyan (SSA)"
    elif sect == "electricity":
        return "GPDP"
    return "GPDP"

def cluster_and_assign_theme(session: Session, submission: Submission, embedding_vec: list) -> Theme:
    """Check if submission clusters with existing themes, otherwise create a new one with a scheme."""
    stmt = select(Theme).where(
        Theme.village_id == submission.village_id,
        Theme.sector == submission.sector
    )
    existing_themes = session.exec(stmt).all()

    best_theme = None
    highest_similarity = 0.0

    for theme in existing_themes:
        sub_stmt = select(SubmissionEmbedding).join(
            Submission, Submission.id == SubmissionEmbedding.submission_id
        ).where(
            Submission.village_id == theme.village_id,
            Submission.sector == theme.sector
        )
        theme_embeddings = session.exec(sub_stmt).all()
        
        if theme_embeddings:
            similarities = [compute_cosine_similarity(embedding_vec, [float(x) for x in emb.embedding_vector.split(",")]) for emb in theme_embeddings]
            avg_sim = sum(similarities) / len(similarities)
            
            if avg_sim > highest_similarity:
                highest_similarity = avg_sim
                best_theme = theme

    if best_theme and highest_similarity >= 0.55:
        print(f"Assigning submission {submission.id} to theme: '{best_theme.label}'")
        best_theme.submission_count += 1
        session.add(best_theme)
        return best_theme
    else:
        theme_id = f"theme-{str(uuid.uuid4())[:8]}"
        words = submission.translated_text.split()
        short_summary = " ".join(words[:6]) + ("..." if len(words) > 6 else "")
        theme_label = f"Request for {submission.sector.capitalize()} in {submission.village_id}: {short_summary}"
        
        scheme = get_default_scheme(submission.sector)
        print(f"Creating new theme: '{theme_label}' under Scheme: {scheme}")
        
        new_theme = Theme(
            id=theme_id,
            label=theme_label,
            sector=submission.sector,
            village_id=submission.village_id,
            submission_count=1,
            score=0.0,
            score_breakdown_json="{}",
            status="open",
            scheme_name=scheme
        )
        session.add(new_theme)
        session.commit()
        session.refresh(new_theme)
        return new_theme

def process_submission_pipeline(
    session: Session,
    citizen_ref: str,
    channel: str,
    raw_text: str = "",
    audio_content: bytes = None,
    photo_content: bytes = None,
    village_id: str = "village-1",
    lat: float = None,
    lng: float = None
) -> Submission:
    """Executes ingestion, redaction, translation, and theme mapping for villages."""
    # Coerce village_id to integer if possible for LGD codes
    try:
        village_id = int(village_id)
    except (ValueError, TypeError):
        pass

    text_to_process = raw_text
    raw_media_url = None
    
    if audio_content:
        transcription = AIServiceAdapter.speech_to_text(audio_content)
        text_to_process = transcription
        raw_media_url = "mock_audio_url_placeholder.mp3"

    redacted_raw = redact_pii(text_to_process)
    translated, language = AIServiceAdapter.translate_to_english(redacted_raw)

    classification = AIServiceAdapter.classify_and_tag(translated)
    sector = classification["sector"]

    if photo_content:
        photo_tags = AIServiceAdapter.analyze_photo(photo_content)
        raw_media_url = "mock_photo_url_placeholder.jpg"
        translated += f" [Photo analysis tags: {', '.join(photo_tags)}]"

    # Mask public citizen_ref if it looks like PII (e.g., phone number or email)
    public_citizen_ref = redact_pii(citizen_ref)
    if "[REDACTED" in public_citizen_ref:
        import hashlib
        public_citizen_ref = "citizen_" + hashlib.md5(citizen_ref.encode('utf-8')).hexdigest()[:8]

    sub_id = f"sub-{str(uuid.uuid4())[:8]}"
    submission = Submission(
        id=sub_id,
        citizen_ref=public_citizen_ref,
        unredacted_citizen_ref=citizen_ref,
        channel=channel,
        raw_text=redacted_raw,
        unredacted_text=raw_text if raw_text else text_to_process,
        raw_media_url=raw_media_url,
        language=language,
        translated_text=translated,
        sector=sector,
        village_id=village_id,
        lat=lat,
        lng=lng,
        status="processed",
        created_at=datetime.utcnow()
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)

    embedding_vector = AIServiceAdapter.generate_embedding(translated)
    emb_str = ",".join(str(x) for x in embedding_vector)
    
    sub_embedding = SubmissionEmbedding(
        submission_id=submission.id,
        embedding_vector=emb_str
    )
    session.add(sub_embedding)
    session.commit()

    theme = cluster_and_assign_theme(session, submission, embedding_vector)
    calculate_theme_score(session, theme)
    
    return submission
