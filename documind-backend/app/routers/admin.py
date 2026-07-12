from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import User, Document, Chat, Message
from app.schemas import UserOut, AdminStats

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    total_users = db.query(User).count()
    total_documents = db.query(Document).count()

    week_ago = datetime.utcnow() - timedelta(days=7)
    chats_this_week = db.query(Chat).filter(Chat.created_at >= week_ago).count()

    assistant_messages = db.query(Message).filter(Message.role == "assistant").all()
    refusal_rate = 0.0
    if assistant_messages:
        refused_count = sum(1 for m in assistant_messages if m.refused)
        refusal_rate = round(100 * refused_count / len(assistant_messages), 1)

    return AdminStats(
        total_users=total_users,
        total_documents=total_documents,
        chats_this_week=chats_this_week,
        refusal_rate=refusal_rate,
    )
