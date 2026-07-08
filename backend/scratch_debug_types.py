from fastapi.testclient import TestClient
from app.main import app
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Submission

client = TestClient(app)

response = client.post(
    "/api/submissions/document",
    data={"village_id": 472592},
    files={"file": ("test_doc.pdf", b"%PDF-1.4 mock pdf content", "application/pdf")}
)

with Session(engine) as session:
    sub = session.exec(select(Submission).order_by(Submission.created_at.desc())).first()
    print("Database village_id:", sub.village_id)
    print("Database village_id type:", type(sub.village_id))
