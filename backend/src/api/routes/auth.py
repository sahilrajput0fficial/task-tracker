import uuid

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlmodel import Session, or_, select

from src.config import settings
from src.database import get_db
from src.models.user import User, UserRole
from src.schemas.auth import Token, UserLogin, UserRegister
from src.schemas.user import UserResponse
from src.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    statement = select(User).where(
        or_(User.username == user_in.username, User.email == user_in.email)
    )
    existing_user = db.exec(statement).first()
    if existing_user:
        if existing_user.username == user_in.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already registered. Please choose another one.",
            )
        if existing_user.email == user_in.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered. Please use another email or login.",
            )

    hashed_pwd = hash_password(user_in.password)

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=user_in.role or UserRole.USER,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
)
def login(
    credentials: UserLogin,
    response : Response,
    db: Session = Depends(get_db),
    
) -> dict:
    statement = select(User).where(
        or_(
            User.username == credentials.username_or_email,
            User.email == credentials.username_or_email,
        )
    )
    user = db.exec(statement).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials: incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
    }
    access_token = create_access_token(data=token_payload)
    refresh_token = create_refresh_token(data= {"id" : user.id})

    env = (settings.ENVIRONMENT or "development").lower()
    is_prod = env == "production"

    response.set_cookie(
        key="refresh_key",
        value=refresh_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }




@router.post("/refresh", response_model=Token, status_code=status.HTTP_200_OK)
def refresh(
    response: Response,
    refresh_key: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_refresh_token(refresh_key)
        sub = payload.get("sub")
        if not sub:
            response.delete_cookie(key="refresh_key", path="/")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token: sub claim is missing",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = db.get(User, uuid.UUID(str(sub)))

        if not user:
            response.delete_cookie(key="refresh_key", path="/")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with this refresh token was not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_payload = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        }

        new_access_token = create_access_token(data=token_payload)
        new_refresh_token = create_refresh_token(data={"id": user.id})

        env = (settings.ENVIRONMENT or "development").lower()
        is_prod = env == "production"

        response.set_cookie(
            key="refresh_key",
            value=new_refresh_token,
            max_age=7 * 24 * 60 * 60,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            path="/",
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
        }

    except HTTPException:
        response.delete_cookie(key="refresh_key", path="/")
        raise
    except (jwt.PyJWTError, ValueError, KeyError):
        response.delete_cookie(key="refresh_key", path="/")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token: could not decode token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response):
    response.delete_cookie(key="refresh_key", path="/")
    return {"message": "Logged out successfully"}