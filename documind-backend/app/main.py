from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, users, documents, chat, admin

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocuMind Enterprise API")

# Allowed frontend URLs
origins = [
    "http://localhost:5173",                  # Local frontend
    "https://pdf-rag-assistant-4.onrender.com"  # Render frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}