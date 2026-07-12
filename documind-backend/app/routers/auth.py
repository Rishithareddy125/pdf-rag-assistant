from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import SignupRequest, LoginRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.auth import hash_password, verify_password, create_access_token, create_reset_token, decode_reset_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    is_first_user = db.query(User).count() == 0
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="admin" if is_first_user else "member",  # first signup bootstraps the admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(access_token=create_access_token(user.id), user=user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return AuthResponse(access_token=create_access_token(user.id), user=user)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        reset_token = create_reset_token(user.id)
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        # Log to the server console for easy testing
        print("\n" + "=" * 60)
        print(f" PASSWORD RESET URL GENERATED FOR: {user.email}")
        print(f" Reset URL: {reset_link}")
        print("=" * 60 + "\n")
        
        return {
            "message": "If this email is registered, a password reset link has been generated.",
            "debug_reset_link": reset_link,
            "debug_token": reset_token
        }
        
    return {"message": "If this email is registered, a password reset link has been generated."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id = decode_reset_token(payload.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"message": "Your password has been successfully reset."}
