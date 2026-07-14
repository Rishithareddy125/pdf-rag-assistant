import os
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.database import get_db, SessionLocal
from app.models import User, Document, Chat
from app.schemas import DocumentOut
from app.services import pdf_processing, embeddings, vector_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["documents"])


def process_pdf_background(document_id: str, stored_path: str, filename: str):
    db = SessionLocal()
    try:
        chunks = pdf_processing.process_pdf(stored_path)
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document {document_id} not found in database during background ingestion.")
            return

        document.page_count = pdf_processing.page_count(stored_path)

        if chunks:
            vectors = embeddings.embed_documents([c.text for c in chunks])
            vector_store.upsert_chunks(document.id, filename, chunks, vectors)

        document.status = "ready"
        db.commit()
    except Exception as e:
        logger.error(f"Error processing document {document_id} in background: {e}", exc_info=True)
        try:
            db.rollback()
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.status = "failed"
                db.commit()
        except Exception as db_err:
            logger.error(f"Failed to update document status to failed: {db_err}", exc_info=True)
    finally:
        db.close()


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.uploaded_by == user.id).order_by(Document.created_at.desc()).all()


@router.post("/upload", response_model=DocumentOut)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    os.makedirs(settings.upload_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4()}.pdf"
    stored_path = os.path.join(settings.upload_dir, stored_name)
    with open(stored_path, "wb") as f:
        f.write(file.file.read())

    document = Document(
        filename=file.filename,
        page_count=0,
        status="processing",
        uploaded_by=user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    background_tasks.add_task(
        process_pdf_background,
        document.id,
        stored_path,
        file.filename
    )

    return document


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(Document.id == document_id, Document.uploaded_by == user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    # Nullify document_id on all chats referencing this document to prevent ForeignKey constraint violations
    db.query(Chat).filter(Chat.document_id == document_id).update({Chat.document_id: None})
    db.commit()

    vector_store.delete_document(document_id)
    db.delete(document)
    db.commit()
    return {"deleted": True}
