from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# --- Documents ---
class DocumentOut(BaseModel):
    id: str
    filename: str
    page_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chat ---
class ChatMessageRequest(BaseModel):
    message: str
    document_id: Optional[str] = None


class Citation(BaseModel):
    document: str
    page: int
    snippet: str


class ChatMessageResponse(BaseModel):
    chat_id: str
    answer: str
    citations: List[Citation] = []
    refused: bool = False


class MessageOut(BaseModel):
    role: str
    content: str
    citations: Optional[List[Citation]] = None
    refused: bool = False

    class Config:
        from_attributes = True


class ChatOut(BaseModel):
    id: str
    title: Optional[str]
    document_id: Optional[str] = None
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True


class ChatSummaryOut(BaseModel):
    id: str
    title: Optional[str]
    document_id: Optional[str] = None
    preview: str
    updated_at: datetime


# --- Admin ---
class AdminStats(BaseModel):
    total_users: int
    total_documents: int
    chats_this_week: int
    refusal_rate: float
