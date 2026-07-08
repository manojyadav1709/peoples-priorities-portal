import os
from sqlmodel import create_engine, SQLModel, Session
from dotenv import load_dotenv

# Load env file if it exists
load_dotenv()

# Default to SQLite in the scratch directory
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///C:/Users/Dell/.gemini/antigravity/scratch/peoples_priorities/backend/app.db")

# Ensure the database directory exists
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

# Create SQLAlchemy/SQLModel Engine
engine = create_engine(
    DATABASE_URL, 
    echo=False, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

def init_db():
    """Create all database tables."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for API endpoints to get a DB Session."""
    with Session(engine) as session:
        yield session
