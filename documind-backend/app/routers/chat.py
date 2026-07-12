from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Chat, Message, Document
from app.schemas import ChatMessageRequest, ChatMessageResponse, ChatOut, ChatSummaryOut
from app.services.llm import answer_question

router = APIRouter(tags=["chat"])


@router.post("/api/chat/{chat_id}/message", response_model=ChatMessageResponse)
def send_message(
    chat_id: str,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Ensure the user has permission to access the document if provided
    if payload.document_id:
        doc = db.query(Document).filter(Document.id == payload.document_id, Document.uploaded_by == user.id).first()
        if not doc:
            raise HTTPException(status_code=403, detail="Access denied to this document.")

    if chat_id == "new":
        chat = Chat(user_id=user.id, title=payload.message[:60], document_id=payload.document_id)
        db.add(chat)
        db.commit()
        db.refresh(chat)
    else:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found.")

    db.add(Message(chat_id=chat.id, role="user", content=payload.message))
    db.commit()

    result = answer_question(payload.message, document_id=chat.document_id)

    assistant_message = Message(
        chat_id=chat.id,
        role="assistant",
        content=result["answer"],
        citations=result.get("citations", []),
        refused=result.get("refused", False),
    )
    db.add(assistant_message)
    db.commit()

    return ChatMessageResponse(
        chat_id=chat.id,
        answer=result["answer"],
        citations=result.get("citations", []),
        refused=result.get("refused", False),
    )


@router.get("/api/chats", response_model=list[ChatSummaryOut])
def list_chats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chats = (
        db.query(Chat)
        .filter(Chat.user_id == user.id)
        .order_by(Chat.updated_at.desc())
        .all()
    )
    summaries = []
    for chat in chats:
        last_message = chat.messages[-1].content if chat.messages else ""
        summaries.append(
            ChatSummaryOut(
                id=chat.id,
                title=chat.title,
                document_id=chat.document_id,
                preview=last_message[:100],
                updated_at=chat.updated_at,
            )
        )
    return summaries


@router.get("/api/chats/{chat_id}", response_model=ChatOut)
def get_chat(chat_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return chat
