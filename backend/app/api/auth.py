from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.hash import bcrypt
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": username, "exp": expire},
        settings.JWT_SECRET,
        algorithm="HS256",
    )


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    if not settings.AUTH_PASSWORD_HASH:
        raise HTTPException(status_code=500, detail="Auth not configured")

    if req.username != settings.AUTH_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.verify(req.password, settings.AUTH_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(access_token=create_token(req.username))
